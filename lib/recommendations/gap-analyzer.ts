import { Score5x5x5 } from '@/lib/tracking/types';
import { GapAnalysis } from './types';
import { DefenseSystem } from '@/types';

/**
 * Analyze user's 5x5x5 score to identify gaps and weaknesses
 */
export function analyzeGaps(score: Score5x5x5): GapAnalysis {
  // Identify missing and weak systems
  const missingSystems: DefenseSystem[] = [];
  const weakSystems: DefenseSystem[] = [];
  
  score.defenseSystems.forEach(systemScore => {
    if (systemScore.foodsConsumed === 0) {
      // 0 foods = truly missing (CRITICAL)
      missingSystems.push(systemScore.system);
    } else if (systemScore.foodsConsumed >= 1 && systemScore.foodsConsumed < 5) {
      // 1-4 foods = weak/needs strengthening (HIGH/MEDIUM)
      weakSystems.push(systemScore.system);
    }
    // 5+ foods = complete, no recommendation needed
  });
  
  // Identify missed meals
  const missedMeals = score.mealTimes
    .filter(mt => !mt.hasFood)
    .map(mt => mt.mealTime) as Array<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'>;
  
  // Check for repeated foods (low variety)
  const repeatedFoods = score.foodVariety.repeatedFoods;
  
  return {
    missingSystems,
    weakSystems,
    missedMeals,
    varietyScore: score.foodVariety.varietyScore,
    repeatedFoods,
    overallScore: score.overallScore,
    systemBalance: score.insights.systemBalance,
  };
}

/**
 * Calculate priority score for a gap (0-100)
 * Higher = more urgent
 */
export function calculateGapPriority(
  gap: { type: 'system' | 'meal' | 'variety'; value: any },
  context: { overallScore: number; systemBalance: number }
): number {
  let priority = 50; // Base priority
  
  if (gap.type === 'system') {
    // Missing systems are high priority
    priority = 80;
    
    // Critical if overall score is low
    if (context.overallScore < 40) {
      priority = 95;
    }
  } else if (gap.type === 'meal') {
    // Missed meals are medium priority
    priority = 60;
    
    // Higher if it's a main meal (breakfast, lunch, dinner)
    if (['BREAKFAST', 'LUNCH', 'DINNER'].includes(gap.value)) {
      priority = 70;
    }
  } else if (gap.type === 'variety') {
    // Low variety is lower priority unless very repetitive
    priority = 40;
    
    if (context.overallScore > 70) {
      // If score is good, variety becomes more important
      priority = 55;
    }
  }
  
  return Math.min(100, Math.max(0, priority));
}

/**
 * Prioritize gaps by urgency
 * Returns sorted array of gaps from most to least urgent
 */
export function prioritizeGaps(gaps: GapAnalysis): Array<{
  type: 'system' | 'meal' | 'variety';
  value: any;
  priority: number;
}> {
  const gapList: Array<{ type: 'system' | 'meal' | 'variety'; value: any; priority: number }> = [];
  
  const context = {
    overallScore: gaps.overallScore,
    systemBalance: gaps.systemBalance,
  };
  
  // Add missing systems
  gaps.missingSystems.forEach(system => {
    gapList.push({
      type: 'system',
      value: system,
      priority: calculateGapPriority({ type: 'system', value: system }, context),
    });
  });
  
  // Add weak systems (lower priority)
  gaps.weakSystems.forEach(system => {
    gapList.push({
      type: 'system',
      value: system,
      priority: calculateGapPriority({ type: 'system', value: system }, context) - 15,
    });
  });
  
  // Add missed meals
  gaps.missedMeals.forEach(meal => {
    gapList.push({
      type: 'meal',
      value: meal,
      priority: calculateGapPriority({ type: 'meal', value: meal }, context),
    });
  });
  
  // Add variety gap if score is low
  if (gaps.varietyScore < 60) {
    gapList.push({
      type: 'variety',
      value: gaps.varietyScore,
      priority: calculateGapPriority({ type: 'variety', value: gaps.varietyScore }, context),
    });
  }
  
  // Sort by priority (highest first)
  return gapList.sort((a, b) => b.priority - a.priority);
}
