import {
  SmartRecommendation,
  RecommendationContext,
  RecommendationPriority,
  UserBehaviorProfile,
} from './types';
import { analyzeGaps } from './gap-analyzer';
import {
  analyzeUserBehavior,
  getPreferredMealTime,
  hasRecentlyDismissedType,
} from './behavior-analyzer';
import type { Score5x5x5, SystemScore } from '@/lib/tracking/types';
import { DefenseSystem } from '@/types';
import { prisma } from '@/lib/prisma';
import { addHours, addDays } from 'date-fns';

const MAX_PENDING_RECOMMENDATIONS = 3;
const MIN_HOURS_BETWEEN_RECOMMENDATIONS = 4;

export class RecommendationEngine {
  /**
   * Generate smart recommendations for a user (backward-compat wrapper).
   * Delegates entirely to generateDefenseSystemRecommendations so that DB-stored
   * records remain scoped to defense-system types (RECIPE, MEAL_PLAN, FOOD_SUGGESTION).
   * Meal-logging nudges (WORKFLOW_STEP) are now computed fresh via
   * generateMealLoggingRecommendations() and are never persisted to DB.
   */
  async generateRecommendations(
    userId: string,
    date: Date,
    score: Score5x5x5
  ): Promise<SmartRecommendation[]> {
    return this.generateDefenseSystemRecommendations(userId, date, score);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 1 — Defense System Recommendations
  // Scope: RECIPE · FOOD_SUGGESTION · MEAL_PLAN
  // Source: DB-backed, persisted, smart-dismissed when system reaches ≥5 foods
  // ─────────────────────────────────────────────────────────────────────────
  async generateDefenseSystemRecommendations(
    userId: string,
    date: Date,
    score: Score5x5x5
  ): Promise<SmartRecommendation[]> {
    const gaps = analyzeGaps(score);
    const userProfile = await analyzeUserBehavior(userId);
    const existingRecommendations = await this.getActiveRecommendations(userId);
    await this.dismissOutdatedRecommendations(userId, score, existingRecommendations);

    const context: RecommendationContext = {
      userId,
      date,
      score,
      gaps,
      userProfile,
      existingRecommendations,
    };

    // Only apply throttle when there are already active recs.
    // When the DB is empty (most common case triggering this method from the
    // GET route) we should ALWAYS attempt to generate — no throttling.
    const hasExisting = existingRecommendations.length > 0;
    if (hasExisting && !this.shouldGenerateRecommendation(context)) {
      return [];
    }

    // If ALL defense systems are complete → nothing to recommend for Section 1
    const allSystemsComplete = context.score.defenseSystems.every(
      s => s.foodsConsumed >= 5
    );
    if (allSystemsComplete) {
      return []; // Section 2 (meal logging) handles the celebration nudge
    }

    const recommendations: SmartRecommendation[] = [];
    const usedSystems = new Set<string>();

    // Priority 1: Critical gaps (overall < 50 + missing systems with 0 foods)
    if (gaps.overallScore < 50 && gaps.missingSystems.length > 0) {
      const system = gaps.missingSystems[0];
      const systemRec = this.createSystemRecommendation(
        system,
        'CRITICAL',
        context
      );
      if (systemRec) {
        recommendations.push(systemRec);
        usedSystems.add(system);
      }
    }
    
    // Priority 2: Additional missing defense systems (0 foods)
    if (recommendations.length < 3 && gaps.missingSystems.length > 0) {
      for (const system of gaps.missingSystems) {
        if (recommendations.length >= 3) break;
        if (usedSystems.has(system)) continue;

        const systemRec = this.createSystemRecommendation(system, 'HIGH', context);
        if (systemRec) {
          recommendations.push(systemRec);
          usedSystems.add(system);
        }
      }
    }

    // Priority 3: Weak systems (1-4 foods — needs strengthening)
    if (recommendations.length < 3 && gaps.weakSystems.length > 0) {
      for (const system of gaps.weakSystems) {
        if (recommendations.length >= 3) break;
        if (usedSystems.has(system)) continue;

        const systemRec = this.createSystemRecommendation(system, 'MEDIUM', context);
        if (systemRec) {
          recommendations.push(systemRec);
          usedSystems.add(system);
        }
      }
    }

    // Priority 4: Multiple weak systems → meal plan
    if (recommendations.length < 3 && gaps.weakSystems.length >= 2) {
      const mealPlanRec = this.createMealPlanRecommendation(gaps.weakSystems, context);
      if (mealPlanRec) recommendations.push(mealPlanRec);
    }

    // Priority 5: Variety improvement (only after user has logged ≥2 meals)
    if (recommendations.length < 3 && gaps.varietyScore < 60) {
      const mealsLogged = context.score.mealTimes.filter(mt => mt.hasFood).length;
      if (mealsLogged >= 2) {
        const varietyRec = this.createVarietyRecommendation(context);
        if (varietyRec) recommendations.push(varietyRec);
      }
    }

    return recommendations.slice(0, 3); // Max 3 defense-system recs per day
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 2 — Meal Logging Recommendations
  // Scope: WORKFLOW_STEP (missing meal types, recipe creation nudges)
  // Source: Computed fresh from today's score — NOT persisted to DB.
  //         Nudges auto-disappear as soon as the meal is logged.
  // ─────────────────────────────────────────────────────────────────────────
  generateMealLoggingRecommendations(
    userId: string,
    date: Date,
    score: Score5x5x5
  ): SmartRecommendation[] {
    const gaps = analyzeGaps(score);

    // Minimal profile — no dismiss throttling; nudges vanish when meal is logged
    const userProfile: UserBehaviorProfile = {
      userId,
      preferredMealTimes: [],
      favoriteFoods: [],
      dietaryRestrictions: [],
      averageDailyScore: gaps.overallScore,
      consistency: 0,
      acceptanceRate: 100,
      dismissedTypes: [],
      lastRecommendationDate: null,
    };

    const context: RecommendationContext = {
      userId,
      date,
      score,
      gaps,
      userProfile,
      existingRecommendations: [],
    };

    const recommendations: SmartRecommendation[] = [];

    // When all defense systems are fully covered → celebration nudge for missing main meals
    const allSystemsComplete = score.defenseSystems.every(s => s.foodsConsumed >= 5);
    if (allSystemsComplete) {
      const missingMainMeals = (gaps.missedMeals as string[]).filter(
        mt => mt === 'BREAKFAST' || mt === 'LUNCH' || mt === 'DINNER'
      );
      if (missingMainMeals.length === 0) return []; // Truly all done — nothing needed
      return missingMainMeals
        .slice(0, 3)
        .map(mt => this.createMealCelebrationNudge(mt, context))
        .filter((r): r is SmartRecommendation => r !== null);
    }

    // Main meals first: BREAKFAST · LUNCH · DINNER
    const mainMeals = (gaps.missedMeals as string[]).filter(
      mt => mt === 'BREAKFAST' || mt === 'LUNCH' || mt === 'DINNER'
    );
    for (const mealTime of mainMeals) {
      const rec = this.createMealLoggingNudge(mealTime, context);
      if (rec) recommendations.push(rec);
    }

    // Snacks — only nudge after all three main meals have been logged
    const loggedMainMeals = score.mealTimes
      .filter(mt => ['BREAKFAST', 'LUNCH', 'DINNER'].includes(mt.mealTime) && mt.hasFood)
      .length;

    if (loggedMainMeals === 3) {
      const snacks = (gaps.missedMeals as string[]).filter(
        mt => mt === 'MORNING_SNACK' || mt === 'AFTERNOON_SNACK'
      );
      for (const mealTime of snacks) {
        const rec = this.createMealLoggingNudge(mealTime, context);
        if (rec) recommendations.push(rec);
      }
    }

    return recommendations;
  }

  /**
   * Check if we should generate a new recommendation
   */
  private shouldGenerateRecommendation(context: RecommendationContext): boolean {
    // ALWAYS generate for new users or zero-activity days
    if (context.gaps.overallScore === 0 || context.gaps.missingSystems.length === 5) {
      return true;
    }

    // Don't generate if already at the cap
    if (context.existingRecommendations.length >= MAX_PENDING_RECOMMENDATIONS) {
      return false;
    }

    // Time-based throttle — only applies when there ARE pending recs in the DB
    // so we don't flood a user who just dismissed everything
    if (context.existingRecommendations.length > 0 && context.userProfile.lastRecommendationDate) {
      const hoursSince = (Date.now() - context.userProfile.lastRecommendationDate.getTime()) / (1000 * 60 * 60);
      if (hoursSince < MIN_HOURS_BETWEEN_RECOMMENDATIONS) {
        return false;
      }
    }

    // NOTE: Acceptance-rate throttle intentionally removed for Section 1.
    // Defense-system gaps are mandatory health alerts — low acceptance rate
    // should not silence them. Users with gaps must see recommendations.

    return true;
  }
  
  /**
   * Create recommendation for a missing/weak defense system
   */
  private createSystemRecommendation(
    system: string,
    priority: RecommendationPriority,
    context: RecommendationContext
  ): SmartRecommendation | null {
    // NOTE: No dismiss guard here. Defense-system gaps are mandatory health
    // alerts — the user must see them regardless of past dismissal history.
    
    const isMissing = context.gaps.missingSystems.includes(system as DefenseSystem);
    const systemScore = context.score.defenseSystems.find((d: SystemScore) => d.system === system);
    const foodsConsumed = systemScore?.foodsConsumed || 0;
    
    // Create context-aware titles with progress
    const title = isMissing
      ? `Start Your ${system} Journey`
      : `Strengthen Your ${system} (${foodsConsumed}/5 foods)`;
    
    const description = isMissing
      ? `You haven't logged any ${system.toLowerCase().replace(/_/g, ' ')} foods yet. These are crucial for your wellness.`
      : `You've logged ${foodsConsumed} ${system.toLowerCase().replace(/_/g, ' ')} food${foodsConsumed === 1 ? '' : 's'}. Add ${5 - foodsConsumed} more to complete this system!`;
    
    const reasoning = isMissing
      ? `Missing defense system detected. ${system.replace(/_/g, ' ')} foods are essential for optimal health.`
      : `Weak defense system detected. Only ${foodsConsumed}/5 ${system.toLowerCase().replace(/_/g, ' ')} foods logged today.`;
    
    return {
      id: crypto.randomUUID(),
      userId: context.userId,
      type: 'RECIPE',
      priority,
      status: 'PENDING',
      title,
      description,
      reasoning,
      actionLabel: 'Generate Recipe',
      actionUrl: '/recipes/ai-generate',
      actionData: {
        targetSystem: system,
        dietaryRestrictions: context.userProfile.dietaryRestrictions,
        preferredMealTime: getPreferredMealTime(context.userProfile),
      },
      targetSystem: system as DefenseSystem,
      targetMealTime: undefined,
      expiresAt: addDays(context.date, 3),
      createdAt: new Date(),
      viewCount: 0,
      dismissCount: 0,
    };
  }
  
  /**
   * Create meal plan recommendation for multiple weak systems
   */
  private createMealPlanRecommendation(
    systems: string[],
    context: RecommendationContext
  ): SmartRecommendation | null {
    // Check if user recently dismissed meal plan recommendations
    if (hasRecentlyDismissedType(context.userProfile, 'MEAL_PLAN')) {
      return null;
    }
    
    const systemList = systems.slice(0, 3).join(', ');
    
    return {
      id: crypto.randomUUID(),
      userId: context.userProfile.userId,
      type: 'MEAL_PLAN',
      priority: 'HIGH',
      status: 'PENDING',
      title: 'Create a Meal Plan',
      description: `Boost multiple defense systems (${systemList}) with a custom meal plan.`,
      reasoning: `Multiple weak systems detected. A meal plan can efficiently address all of them.`,
      actionLabel: 'Plan My Week',
      actionUrl: '/meal-planner',
      actionData: {
        targetSystems: systems.slice(0, 3),
        dietaryRestrictions: context.userProfile.dietaryRestrictions,
        duration: 7,
      },
      targetSystem: undefined,
      targetMealTime: undefined,
      viewCount: 0,
      dismissCount: 0,
      expiresAt: addDays(context.date, 7),
      createdAt: new Date(),
    };
  }
  
  /**
   * Create recommendation for improving variety
   */
  private createVarietyRecommendation(
    context: RecommendationContext
  ): SmartRecommendation | null {
    // Check if user recently dismissed food suggestions
    if (hasRecentlyDismissedType(context.userProfile, 'FOOD_SUGGESTION')) {
      return null;
    }
        // Only suggest variety if user has logged at least 3 unique foods
    // Otherwise, they need to log food first, not improve variety
    if (context.score.foodVariety.totalUniqueFoods < 3) {
      return null;
    }
        const repeatedFoodsList = context.gaps.repeatedFoods.slice(0, 3).join(', ');
    
    return {
      id: crypto.randomUUID(),
      userId: context.userProfile.userId,
      type: 'FOOD_SUGGESTION',
      priority: 'MEDIUM',
      status: 'PENDING',
      title: 'Add More Variety',
      description: `You're eating similar foods (${repeatedFoodsList}). Let's diversify!`,
      reasoning: `Low variety score (${context.gaps.varietyScore}/100). Eating diverse foods maximizes nutrient intake.`,
      actionLabel: 'Create New Recipe',
      actionUrl: '/recipes/ai-generate',
      actionData: {
        from: 'variety',
        avoidIngredients: context.gaps.repeatedFoods,
        dietaryRestrictions: context.userProfile.dietaryRestrictions,
      },
      targetSystem: undefined,
      targetMealTime: undefined,
      viewCount: 0,
      dismissCount: 0,
      expiresAt: addDays(context.date, 7),
      createdAt: new Date(),
    };
  }
  
  /**
   * Create recommendation for missed meal
   */
  private createMissedMealRecommendation(
    mealTime: string,
    context: RecommendationContext
  ): SmartRecommendation | null {
    // Check if user recently dismissed workflow recommendations
    if (hasRecentlyDismissedType(context.userProfile, 'WORKFLOW_STEP')) {
      return null;
    }
    
    const mealTimeLower = mealTime.toLowerCase();
    
    return {
      id: crypto.randomUUID(),
      userId: context.userProfile.userId,
      type: 'WORKFLOW_STEP',
      priority: 'MEDIUM',
      status: 'PENDING',
      title: `Plan Your ${mealTime}`,
      description: `${mealTime} not logged yet. Create a healthy ${mealTimeLower} recipe!`,
      reasoning: `Missed meal detected. Planning ahead makes healthy eating easier.`,
      actionLabel: 'Create Recipe',
      actionUrl: '/recipes/ai-generate',
      actionData: {
        from: 'missed-meal',
        preferredMealTime: mealTime,
        dietaryRestrictions: context.userProfile.dietaryRestrictions,
      },
      targetSystem: undefined,
      targetMealTime: mealTime,
      viewCount: 0,
      dismissCount: 0,
      expiresAt: addHours(context.date, 12), // Expires after 12 hours
      createdAt: new Date(),
    };
  }

  /**
   * Create a Section-2 meal logging nudge for a specific missing meal time.
   * Unlike createMissedMealRecommendation, this ALWAYS generates (no dismiss guard)
   * because the nudge disappears automatically once the meal is logged — no DB record needed.
   */
  private createMealLoggingNudge(
    mealTime: string,
    context: RecommendationContext
  ): SmartRecommendation | null {
    const mealLabel = mealTime
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase()); // e.g. "Breakfast", "Morning Snack"

    return {
      id: crypto.randomUUID(),
      userId: context.userId,
      type: 'WORKFLOW_STEP',
      priority: 'MEDIUM',
      status: 'PENDING',
      title: `Log Your ${mealLabel}`,
      description: `You haven't logged ${mealLabel.toLowerCase()} yet. Create a healthy recipe and log it to stay on track with your 5x5x5 goals!`,
      reasoning: `${mealLabel} hasn't been recorded today. Logging all meals ensures complete 5x5x5 framework coverage.`,
      actionLabel: `Create ${mealLabel} Recipe`,
      actionUrl: '/recipes/ai-generate',
      actionData: {
        from: 'meal-logging',
        preferredMealTime: mealTime,
      },
      targetSystem: undefined,
      targetMealTime: mealTime,
      viewCount: 0,
      dismissCount: 0,
      expiresAt: addHours(context.date, 12),
      createdAt: new Date(),
    };
  }

  /**
   * Create a celebratory nudge shown when the user has fully covered all 5
   * defense systems but hasn't logged a main meal yet.
   *
   * Unlike createMissedMealRecommendation, this intentionally SKIPS the
   * hasRecentlyDismissedType guard – the user earned the celebration and
   * should always be offered the next helpful action.
   */
  private createMealCelebrationNudge(
    mealTime: string,
    context: RecommendationContext
  ): SmartRecommendation | null {
    const mealLabel = mealTime
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase()); // e.g. "Dinner", "Breakfast"

    return {
      id: crypto.randomUUID(),
      userId: context.userId,
      type: 'WORKFLOW_STEP',
      priority: 'LOW',
      status: 'PENDING',
      title: `Amazing! All 5 Systems Covered 🎉`,
      description: `You've hit all 5 defense systems today! Would you like to create a ${mealLabel} recipe to complete your day?`,
      reasoning: `All 5 defense systems are fully covered. ${mealLabel} hasn't been logged yet — a great chance to round out your day with another healthy meal.`,
      actionLabel: `Create ${mealLabel} Recipe`,
      actionUrl: '/recipes/ai-generate',
      actionData: {
        from: 'celebration-nudge',
        preferredMealTime: mealTime,
        dietaryRestrictions: context.userProfile.dietaryRestrictions,
      },
      targetSystem: undefined,
      targetMealTime: mealTime,
      viewCount: 0,
      dismissCount: 0,
      expiresAt: addHours(context.date, 18), // Valid for rest of the day
      createdAt: new Date(),
    };
  }

  /**
   * Get active defense-system recommendations for a user (Section 1 only).
   * Deliberately excludes WORKFLOW_STEP records so that any stale entries
   * lingering in the DB from before the refactor cannot inflate the pending
   * count and block new generation.
   */
  private async getActiveRecommendations(userId: string): Promise<SmartRecommendation[]> {
    try {
      const recs = await prisma.recommendation.findMany({
        where: {
          userId,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
          // Only count defense-system types; WORKFLOW_STEP is never persisted
          type: { in: ['RECIPE', 'MEAL_PLAN', 'FOOD_SUGGESTION'] },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      return recs.map(r => ({
        id: r.id,
        userId: r.userId,
        type: r.type as any,
        priority: r.priority as any,
        status: r.status as any,
        title: r.title,
        description: r.description,
        reasoning: r.reasoning,
        actionLabel: r.actionLabel,
        actionUrl: r.actionUrl,
        actionData: r.actionData as any,
        targetSystem: r.targetSystem as any,
        targetMealTime: r.targetMealTime ?? undefined,
        viewCount: r.viewCount,
        dismissCount: r.dismissCount,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      }));
    } catch (error) {
      // Handle case where table doesn't exist yet
      return [];
    }
  }

  /**
   * Auto-dismiss recommendations that are no longer relevant
   */
  private async dismissOutdatedRecommendations(
    userId: string,
    score: Score5x5x5,
    recommendations: SmartRecommendation[]
  ): Promise<void> {
    const systemCompletionMap = new Map<DefenseSystem, number>();
    score.defenseSystems.forEach(sys => {
      systemCompletionMap.set(sys.system, sys.foodsConsumed);
    });

    for (const rec of recommendations) {
      let shouldDismiss = false;
      let dismissReason = '';

      // Check if recommendation is for a system that's now complete
      if (rec.type === 'RECIPE' && rec.targetSystem) {
        const foodsConsumed = systemCompletionMap.get(rec.targetSystem) || 0;
        if (foodsConsumed >= 5) {
          shouldDismiss = true;
          dismissReason = 'System goal achieved (5/5 foods)';
        }
      }

      if (shouldDismiss) {
        await prisma.recommendation.update({
          where: { id: rec.id },
          data: { 
            status: 'DISMISSED',
            dismissedAt: new Date(),
          },
        });
        console.log(`✅ Auto-dismissed recommendation "${rec.title}" - ${dismissReason}`);
      }
    }
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();
