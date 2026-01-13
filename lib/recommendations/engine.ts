import {
  SmartRecommendation,
  RecommendationContext,
  RecommendationPriority,
  GapAnalysis,
  UserBehaviorProfile,
} from './types';
import { analyzeGaps, prioritizeGaps } from './gap-analyzer';
import {
  analyzeUserBehavior,
  getPreferredMealTime,
  hasRecentlyDismissedType,
  calculateEngagementScore,
} from './behavior-analyzer';
import type { Score5x5x5, SystemScore } from '@/lib/tracking/types';
import { DefenseSystem } from '@/types';
import { prisma } from '@/lib/prisma';
import { addHours, addDays } from 'date-fns';

const MAX_PENDING_RECOMMENDATIONS = 3;
const MIN_HOURS_BETWEEN_RECOMMENDATIONS = 4;
const MIN_ACCEPTANCE_RATE = 20; // 20% minimum

export class RecommendationEngine {
  /**
   * Generate smart recommendations for a user
   */
  async generateRecommendations(
    userId: string,
    date: Date,
    score: Score5x5x5
  ): Promise<SmartRecommendation[]> {
    // Analyze gaps in current score
    const gaps = analyzeGaps(score);
    
    // Analyze user behavior patterns
    const userProfile = await analyzeUserBehavior(userId);
    
    // Get existing recommendations
    const existingRecommendations = await this.getActiveRecommendations(userId);
    
    // Auto-dismiss outdated recommendations
    await this.dismissOutdatedRecommendations(userId, score, existingRecommendations);
    
    // Build context
    const context: RecommendationContext = {
      userId,
      date,
      score,
      gaps,
      userProfile,
      existingRecommendations,
    };
    
    // Check if we should generate new recommendations
    if (!this.shouldGenerateRecommendation(context)) {
      return [];
    }
    
    // Prioritize gaps
    const prioritizedGaps = prioritizeGaps(gaps);
    const recommendations: SmartRecommendation[] = [];
    const usedSystems = new Set<string>(); // Track which systems we've already recommended
    
    // Generate recommendations based on priority
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
    
    // Priority 2: Additional missing defense systems (0 foods - skip already recommended)
    if (recommendations.length < 3 && gaps.missingSystems.length > 0) {
      for (const system of gaps.missingSystems) {
        if (recommendations.length >= 3) break;
        if (usedSystems.has(system)) continue; // Skip already recommended systems
        
        const systemRec = this.createSystemRecommendation(
          system,
          'HIGH',
          context
        );
        if (systemRec) {
          recommendations.push(systemRec);
          usedSystems.add(system);
        }
      }
    }
    
    // Priority 3: Weak systems (1-4 foods - needs strengthening)
    if (recommendations.length < 3 && gaps.weakSystems.length > 0) {
      for (const system of gaps.weakSystems) {
        if (recommendations.length >= 3) break;
        if (usedSystems.has(system)) continue; // Skip already recommended systems
        
        const systemRec = this.createSystemRecommendation(
          system,
          'MEDIUM', // Weak systems are MEDIUM priority (not HIGH)
          context
        );
        if (systemRec) {
          recommendations.push(systemRec);
          usedSystems.add(system);
        }
      }
    }
    
    // Priority 4: Main meals first (BREAKFAST, LUNCH, DINNER)
    if (recommendations.length < 3 && gaps.missedMeals.length > 0) {
      const mainMeals = gaps.missedMeals.filter(mt => 
        mt === 'BREAKFAST' || mt === 'LUNCH' || mt === 'DINNER'
      );
      for (const mealTime of mainMeals) {
        if (recommendations.length >= 3) break;
        const mealRec = this.createMissedMealRecommendation(mealTime, context);
        if (mealRec) recommendations.push(mealRec);
      }
    }
    
    // Priority 5: Snacks (only after main meals are covered)
    if (recommendations.length < 3 && gaps.missedMeals.length > 0) {
      const snacks = gaps.missedMeals.filter(mt => 
        mt === 'MORNING_SNACK' || mt === 'AFTERNOON_SNACK'
      );
      // Only recommend snacks if all main meals are logged
      const mainMeals = ['BREAKFAST', 'LUNCH', 'DINNER'];
      const loggedMainMeals = context.score.mealTimes
        .filter(mt => mainMeals.includes(mt.mealTime) && mt.hasFood)
        .length;
      
      if (loggedMainMeals === 3) { // All main meals logged
        for (const mealTime of snacks) {
          if (recommendations.length >= 3) break;
          const mealRec = this.createMissedMealRecommendation(mealTime, context);
          if (mealRec) recommendations.push(mealRec);
        }
      }
    }
    
    // Priority 6: Multiple weak systems → meal plan
    if (recommendations.length < 3 && gaps.weakSystems.length >= 2) {
      const mealPlanRec = this.createMealPlanRecommendation(gaps.weakSystems, context);
      if (mealPlanRec) recommendations.push(mealPlanRec);
    }
    
    // Priority 7: Variety improvement (only after meals are covered)
    if (recommendations.length < 3 && gaps.varietyScore < 60) {
      // Only recommend variety if user has logged at least 2 meals
      const mealsLogged = context.score.mealTimes.filter(mt => mt.hasFood).length;
      if (mealsLogged >= 2) {
        const varietyRec = this.createVarietyRecommendation(context);
        if (varietyRec) recommendations.push(varietyRec);
      }
    }
    
    return recommendations.slice(0, 3); // Max 3 per day
  }
  
  /**
   * Check if we should generate a new recommendation
   */
  private shouldGenerateRecommendation(context: RecommendationContext): boolean {
    // ALWAYS generate for new users or zero-activity days
    // This ensures "All Caught Up!" doesn't show when user has done nothing
    if (context.gaps.overallScore === 0 || context.gaps.missingSystems.length === 5) {
      return true;
    }
    
    // Don't generate if too many pending
    if (context.existingRecommendations.length >= MAX_PENDING_RECOMMENDATIONS) {
      return false;
    }
    
    // Check time since last recommendation ONLY if there are pending recommendations
    // If all previous recommendations are completed, allow immediate new generation
    if (context.existingRecommendations.length > 0 && context.userProfile.lastRecommendationDate) {
      const hoursSince = (Date.now() - context.userProfile.lastRecommendationDate.getTime()) / (1000 * 60 * 60);
      if (hoursSince < MIN_HOURS_BETWEEN_RECOMMENDATIONS) {
        return false;
      }
    }
    
    // Check acceptance rate (if user keeps dismissing, slow down)
    if (context.userProfile.acceptanceRate < MIN_ACCEPTANCE_RATE) {
      // Only generate critical recommendations
      return context.gaps.overallScore < 40;
    }
    
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
    // Check if user recently dismissed recipe recommendations
    if (hasRecentlyDismissedType(context.userProfile, 'RECIPE')) {
      return null;
    }
    
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
   * Get active recommendations for a user
   */
  private async getActiveRecommendations(userId: string): Promise<SmartRecommendation[]> {
    try {
      const recs = await prisma.recommendation.findMany({
        where: {
          userId,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
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
