/**
 * Progress Calculator Utility
 * 
 * Calculates 5x5x5 scores and analyzes progress across all three dimensions:
 * 1. Defense Systems (5 systems)
 * 2. Food Variety (5 foods per system)
 * 3. Meal Frequency (5 times per day)
 */

import { DefenseSystem, MealTime, BenefitStrength } from '@prisma/client';
import { DailyProgress5x5x5 } from '@/types';

export interface FoodSystemBenefit {
  system: DefenseSystem;
  strength: BenefitStrength;
}

export interface FoodWithSystems {
  name: string;
  systems: FoodSystemBenefit[];
}

export interface ConsumptionData {
  systemFoodCounts: Record<DefenseSystem, number>;
  totalMeals: number;
  uniqueFoodsBySystem: Record<DefenseSystem, Set<string>>;
  totalUniqueFoods: number;
}

/**
 * Calculate multi-system benefits for a list of foods
 * One food can contribute to multiple systems
 */
export function calculateSystemBenefits(
  foods: FoodWithSystems[]
): Record<DefenseSystem, Set<string>> {
  const systemFoods: Record<DefenseSystem, Set<string>> = {
    [DefenseSystem.ANGIOGENESIS]: new Set(),
    [DefenseSystem.REGENERATION]: new Set(),
    [DefenseSystem.MICROBIOME]: new Set(),
    [DefenseSystem.DNA_PROTECTION]: new Set(),
    [DefenseSystem.IMMUNITY]: new Set(),
  };

  foods.forEach(food => {
    food.systems.forEach(benefit => {
      systemFoods[benefit.system].add(food.name);
    });
  });

  return systemFoods;
}

/**
 * Calculate 5x5x5 score for a given day
 */
export function calculate5x5x5Score(consumption: {
  systemFoodCounts: Record<DefenseSystem, number>;
  totalMeals: number;
  totalUniqueFoods: number;
}): {
  systemScore: number;      // Out of 5
  foodScore: number;        // Out of 5
  frequencyScore: number;   // Out of 5
  overallScore: number;     // Out of 100
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';
} {
  // System dimension: How many unique defense systems are covered?
  const systemsCovered = Object.values(consumption.systemFoodCounts)
    .filter(count => count > 0).length;

  // Food dimension: Total unique foods consumed
  const uniqueFoodsCount = consumption.totalUniqueFoods;

  // Frequency dimension: Unique meal times (capped at 5)
  const frequencyScore = Math.min(consumption.totalMeals, 5);

  // Calculate percentages
  const systemPerc = (systemsCovered / 5) * 100;
  const foodPerc = (Math.min(uniqueFoodsCount, 5) / 5) * 100;
  const freqPerc = (frequencyScore / 5) * 100;

  const overallScore = (systemPerc + foodPerc + freqPerc) / 3;

  // Determine level
  let level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER' = 'BEGINNER';
  if (overallScore >= 90) level = 'MASTER';
  else if (overallScore >= 70) level = 'ADVANCED';
  else if (overallScore >= 50) level = 'INTERMEDIATE';

  return {
    systemScore: systemsCovered,
    foodScore: uniqueFoodsCount,
    frequencyScore,
    overallScore,
    level,
  };
}

/**
 * Calculate consumption data from food items
 */
export function calculateConsumptionData(
  foodItems: Array<{
    name: string;
    defenseSystems: Array<{
      defenseSystem: DefenseSystem;
      strength: BenefitStrength;
    }>;
  }>,
  mealCount: number
): ConsumptionData {
  const uniqueFoodsBySystem: Record<DefenseSystem, Set<string>> = {
    [DefenseSystem.ANGIOGENESIS]: new Set(),
    [DefenseSystem.REGENERATION]: new Set(),
    [DefenseSystem.MICROBIOME]: new Set(),
    [DefenseSystem.DNA_PROTECTION]: new Set(),
    [DefenseSystem.IMMUNITY]: new Set(),
  };

  const allUniqueFoods = new Set<string>();

  // Process each food item
  foodItems.forEach(food => {
    allUniqueFoods.add(food.name);
    
    food.defenseSystems.forEach(benefit => {
      uniqueFoodsBySystem[benefit.defenseSystem].add(food.name);
    });
  });

  // Count foods per system
  const systemFoodCounts: Record<DefenseSystem, number> = {
    [DefenseSystem.ANGIOGENESIS]: uniqueFoodsBySystem[DefenseSystem.ANGIOGENESIS].size,
    [DefenseSystem.REGENERATION]: uniqueFoodsBySystem[DefenseSystem.REGENERATION].size,
    [DefenseSystem.MICROBIOME]: uniqueFoodsBySystem[DefenseSystem.MICROBIOME].size,
    [DefenseSystem.DNA_PROTECTION]: uniqueFoodsBySystem[DefenseSystem.DNA_PROTECTION].size,
    [DefenseSystem.IMMUNITY]: uniqueFoodsBySystem[DefenseSystem.IMMUNITY].size,
  };

  return {
    systemFoodCounts,
    totalMeals: mealCount,
    uniqueFoodsBySystem,
    totalUniqueFoods: allUniqueFoods.size,
  };
}

/**
 * Get missed meal times based on consumed meals
 */
export function getMissedMealTimes(
  consumedMealTimes: MealTime[]
): MealTime[] {
  const standardMealTimes = [
    MealTime.BREAKFAST,
    MealTime.MORNING_SNACK,
    MealTime.LUNCH,
    MealTime.AFTERNOON_SNACK,
    MealTime.DINNER,
  ];

  return standardMealTimes.filter(
    mealTime => !consumedMealTimes.includes(mealTime)
  );
}

/**
 * Analyze system trends over time
 */
export function analyzeSystemTrend(
  dailyScores: number[]
): 'IMPROVING' | 'STABLE' | 'DECLINING' {
  if (dailyScores.length < 2) return 'STABLE';

  // Calculate linear regression slope
  const n = dailyScores.length;
  const xMean = (n - 1) / 2;
  const yMean = dailyScores.reduce((sum, score) => sum + score, 0) / n;

  let numerator = 0;
  let denominator = 0;

  dailyScores.forEach((score, index) => {
    numerator += (index - xMean) * (score - yMean);
    denominator += Math.pow(index - xMean, 2);
  });

  const slope = numerator / denominator;

  // Classify based on slope
  if (slope > 2) return 'IMPROVING';
  if (slope < -2) return 'DECLINING';
  return 'STABLE';
}

/**
 * Get top foods by benefit strength
 */
export function getTopFoodsByStrength(
  foods: Array<{
    name: string;
    count: number;
    defenseSystems: Array<{
      defenseSystem: DefenseSystem;
      strength: BenefitStrength;
    }>;
  }>,
  system: DefenseSystem,
  limit: number = 5
): Array<{
  name: string;
  count: number;
  benefitStrength: BenefitStrength;
}> {
  return foods
    .filter(food =>
      food.defenseSystems.some(ds => ds.defenseSystem === system)
    )
    .map(food => ({
      name: food.name,
      count: food.count,
      benefitStrength:
        food.defenseSystems.find(ds => ds.defenseSystem === system)
          ?.strength || BenefitStrength.MEDIUM,
    }))
    .sort((a, b) => {
      // Sort by strength first (HIGH > MEDIUM > LOW)
      const strengthOrder = {
        [BenefitStrength.HIGH]: 3,
        [BenefitStrength.MEDIUM]: 2,
        [BenefitStrength.LOW]: 1,
      };
      const strengthDiff =
        strengthOrder[b.benefitStrength] - strengthOrder[a.benefitStrength];
      if (strengthDiff !== 0) return strengthDiff;

      // Then by count
      return b.count - a.count;
    })
    .slice(0, limit);
}

/**
 * Calculate streak (consecutive days achieving target)
 */
export function calculateStreak(
  dailyScores: Array<{ date: Date; overallScore: number }>
): number {
  if (dailyScores.length === 0) return 0;

  // Sort by date descending (most recent first)
  const sorted = [...dailyScores].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  let streak = 0;
  for (const day of sorted) {
    if (day.overallScore >= 80) {
      // 80% threshold for "achieving" 5x5x5
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
