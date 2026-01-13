import { DefenseSystem } from '@/types';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';
import { transformFoodConsumptionToProgress } from '@/lib/utils/food-consumption-transformer';
import { getUserDayRangeUTC, normalizeToNoonUTC } from '@/lib/utils/timezone';
import type {
  Score5x5x5,
  SystemScore,
  MealTimeScore,
  FoodVarietyScore,
  ScoreInsights,
} from './types';

/**
 * Calculate comprehensive 5x5x5 score for a given date
 * 
 * The 5x5x5 system tracks:
 * - 5 defense systems (ANGIOGENESIS, REGENERATION, MICROBIOME, DNA_PROTECTION, IMMUNITY)
 * - 5 foods per system per day (goal)
 * - 5 meal times (BREAKFAST, LUNCH, DINNER, SNACK x2)
 * 
 * Scoring weights:
 * - Defense Systems: 50%
 * - Meal Time Coverage: 30%
 * - Food Variety: 20%
 * 
 * @param userId - User ID
 * @param date - Date to calculate score for (will be normalized to noon UTC)
 * @param userTimezone - Optional IANA timezone (e.g., 'America/New_York'). If not provided, defaults to UTC
 */
export async function calculate5x5x5Score(
  userId: string,
  date: Date,
  userTimezone?: string
): Promise<Score5x5x5> {
  // Normalize to UTC date at noon to prevent timezone shifting
  const normalizedDate = normalizeToNoonUTC(date);

  // Fetch user if timezone not provided
  if (!userTimezone) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    userTimezone = user?.timezone || 'UTC';
  }

  // Get the day range for querying (start/end of user's day in UTC)
  const { start, end } = getUserDayRangeUTC(userTimezone, date);

  // Fetch all food consumptions for the date from new table
  // Query using user's day range to catch all entries for their local day
  const foodConsumptions = await prisma.foodConsumption.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lt: end,
      },
    },
    include: {
      foodItems: {
        include: {
          defenseSystems: true,
        },
      },
    },
  });

  // Transform to old Progress format for backward compatibility
  const progressEntries = transformFoodConsumptionToProgress(foodConsumptions);

  // Calculate defense system scores
  const systemScores = calculateSystemScores(progressEntries);

  // Calculate meal time coverage using actual FoodConsumption data
  const mealTimeScores = calculateMealTimeScores(progressEntries, foodConsumptions);

  // Calculate food variety
  const foodVariety = calculateFoodVariety(progressEntries);

  // Calculate overall score (weighted)
  const overallScore = calculateOverallScore(
    systemScores,
    mealTimeScores,
    foodVariety
  );

  // Generate insights
  const insights = generateInsights(systemScores, mealTimeScores, foodVariety);

  return {
    overallScore,
    defenseSystems: systemScores,
    mealTimes: mealTimeScores,
    foodVariety,
    insights,
  };
}

/**
 * Calculate scores for each defense system
 * Goal: 5 unique foods per system per day
 */
function calculateSystemScores(progressEntries: any[]): SystemScore[] {
  const systemMap = new Map<DefenseSystem, Set<string>>();

  // Group foods by defense system
  progressEntries.forEach((entry) => {
    const system = entry.defenseSystem as DefenseSystem;
    if (!systemMap.has(system)) {
      systemMap.set(system, new Set());
    }

    // Add all foods from this entry
    const foods = Array.isArray(entry.foodsConsumed) 
      ? entry.foodsConsumed 
      : JSON.parse(entry.foodsConsumed as string);
    
    foods.forEach((food: string) => {
      systemMap.get(system)!.add(food);
    });
  });

  // Calculate scores for each of the 5 defense systems
  const allSystems = [
    DefenseSystem.ANGIOGENESIS,
    DefenseSystem.REGENERATION,
    DefenseSystem.MICROBIOME,
    DefenseSystem.DNA_PROTECTION,
    DefenseSystem.IMMUNITY,
  ];

  return allSystems.map((system) => {
    const uniqueFoods = Array.from(systemMap.get(system) || new Set<string>()) as string[];
    const foodsConsumed = uniqueFoods.length;
    const coveragePercent = Math.min((foodsConsumed / 5) * 100, 100);

    // Score calculation (non-linear to encourage reaching goal):
    // - 5+ foods = 100 points (goal achieved!)
    // - 4 foods = 85 points (very good)
    // - 3 foods = 70 points (good)
    // - 2 foods = 50 points (okay)
    // - 1 food = 30 points (minimal)
    // - 0 foods = 0 points (none)
    const score = 
      foodsConsumed >= 5 ? 100 :
      foodsConsumed === 4 ? 85 :
      foodsConsumed === 3 ? 70 :
      foodsConsumed === 2 ? 50 :
      foodsConsumed === 1 ? 30 : 0;

    return {
      system,
      foodsConsumed,
      uniqueFoods,
      coveragePercent,
      score,
    };
  });
}

/**
 * Calculate meal time coverage scores
 * Goal: Eat foods across 5 meal times throughout the day
 * 
 * Now uses actual FoodConsumption data with real mealTime information
 */
function calculateMealTimeScores(progressEntries: any[], foodConsumptions?: any[]): MealTimeScore[] {
  const mealTimes: Array<'BREAKFAST' | 'MORNING_SNACK' | 'LUNCH' | 'AFTERNOON_SNACK' | 'DINNER'> = [
    'BREAKFAST',
    'MORNING_SNACK',
    'LUNCH', 
    'AFTERNOON_SNACK',
    'DINNER',
  ];

  // If we have actual FoodConsumption data, use it for accurate counts
  if (foodConsumptions && foodConsumptions.length > 0) {
    // Group consumptions by meal time
    const consumptionsByMeal = new Map<string, any[]>();
    foodConsumptions.forEach((consumption) => {
      const mealTime = consumption.mealTime;
      if (!consumptionsByMeal.has(mealTime)) {
        consumptionsByMeal.set(mealTime, []);
      }
      consumptionsByMeal.get(mealTime)!.push(consumption);
    });

    return mealTimes.map((mealTime) => {
      const consumptions = consumptionsByMeal.get(mealTime) || [];
      const hasFood = consumptions.length > 0;
      
      // Count unique foods for this meal time
      const foodsSet = new Set<string>();
      consumptions.forEach((consumption) => {
        consumption.foodItems?.forEach((item: any) => {
          foodsSet.add(item.name);
        });
      });
      const foodCount = foodsSet.size;

      // Get unique systems covered at this meal
      const systemsSet = new Set<DefenseSystem>();
      consumptions.forEach((consumption) => {
        consumption.foodItems?.forEach((item: any) => {
          item.defenseSystems?.forEach((ds: any) => {
            systemsSet.add(ds.defenseSystem);
          });
        });
      });
      const systemsCovered = Array.from(systemsSet);

      const score = hasFood ? 100 : 0;

      return {
        mealTime,
        hasFood,
        foodCount,
        systemsCovered,
        score,
      };
    });
  }

  // Fallback: Use old estimation method if no FoodConsumption data
  const hasAnyFood = progressEntries.length > 0;
  const estimatedMealsCovered = hasAnyFood ? Math.min(3, Math.ceil(progressEntries.length / 2)) : 0;

  // Get unique systems covered
  const systemsSet = new Set<DefenseSystem>();
  progressEntries.forEach((entry) => {
    systemsSet.add(entry.defenseSystem);
  });
  const systemsCovered = Array.from(systemsSet);

  return mealTimes.map((mealTime, index) => {
    // Estimate meal coverage (this is simplified)
    const hasFood = index < estimatedMealsCovered;
    const foodCount = hasFood ? Math.ceil(progressEntries.length / estimatedMealsCovered) : 0;
    const score = hasFood ? 100 : 0;

    return {
      mealTime,
      hasFood,
      foodCount,
      systemsCovered: hasFood ? systemsCovered : [],
      score,
    };
  });
}

/**
 * Calculate food variety score
 * Goal: Maximize unique foods, minimize repetition
 */
function calculateFoodVariety(progressEntries: any[]): FoodVarietyScore {
  const foodCounts = new Map<string, number>();
  const allFoods = new Set<string>();

  // Count each food across all systems
  progressEntries.forEach((entry) => {
    const foods = Array.isArray(entry.foodsConsumed)
      ? entry.foodsConsumed
      : JSON.parse(entry.foodsConsumed as string);

    foods.forEach((food: string) => {
      allFoods.add(food);
      foodCounts.set(food, (foodCounts.get(food) || 0) + 1);
    });
  });

  const totalUniqueFoods = allFoods.size;
  const repeatedFoods = Array.from(foodCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([food, _]) => food);

  // Variety score: rewards diverse food choices
  // 25+ unique foods = 100 points (excellent variety)
  // Linear scale below that
  const varietyScore = Math.min((totalUniqueFoods / 25) * 100, 100);

  // Diversity index: ratio of unique foods to total food instances
  const totalFoodInstances = Array.from(foodCounts.values()).reduce((sum, count) => sum + count, 0);
  const diversityIndex = totalFoodInstances > 0 ? totalUniqueFoods / totalFoodInstances : 0;

  return {
    totalUniqueFoods,
    varietyScore,
    repeatedFoods,
    diversityIndex,
  };
}

/**
 * Calculate overall 5x5x5 score (weighted)
 * 
 * Weight distribution (as approved):
 * - Defense Systems: 50%
 * - Meal Time Coverage: 30%
 * - Food Variety: 20%
 */
function calculateOverallScore(
  systemScores: SystemScore[],
  mealTimeScores: MealTimeScore[],
  foodVariety: FoodVarietyScore
): number {
  // System score (average of all 5 defense systems)
  const avgSystemScore = systemScores.reduce((sum, s) => sum + s.score, 0) / systemScores.length;

  // Meal time score (percentage of meal times with food)
  const mealTimesCovered = mealTimeScores.filter(m => m.hasFood).length;
  const mealTimeScore = (mealTimesCovered / mealTimeScores.length) * 100;

  // Weighted overall score
  const overallScore = (
    avgSystemScore * 0.5 +
    mealTimeScore * 0.3 +
    foodVariety.varietyScore * 0.2
  );

  return Math.round(overallScore);
}

/**
 * Generate actionable insights
 */
function generateInsights(
  systemScores: SystemScore[],
  mealTimeScores: MealTimeScore[],
  foodVariety: FoodVarietyScore
): ScoreInsights {
  // Find strongest and weakest systems
  const sortedSystems = [...systemScores].sort((a, b) => b.score - a.score);
  const strongestSystem = sortedSystems[0].score > 0 ? sortedSystems[0].system : null;
  const weakestSystem = sortedSystems[sortedSystems.length - 1].system;

  // Find missed meal times
  const missedMealTimes = mealTimeScores
    .filter(m => !m.hasFood)
    .map(m => m.mealTime);

  // Calculate system balance (how evenly distributed)
  const scores = systemScores.map(s => s.score);
  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);
  // Balance is higher when standard deviation is lower
  const systemBalance = Math.max(0, Math.round(100 - standardDeviation));

  // Generate main recommendation
  let recommendation = '';
  const nextSteps: string[] = [];

  if (systemScores.every(s => s.score >= 85)) {
    recommendation = "Excellent! You're hitting all 5 defense systems with great coverage. Keep up the amazing work!";
    nextSteps.push("Maintain your current eating patterns");
    nextSteps.push("Try new foods within your favorite systems for variety");
  } else if (weakestSystem) {
    const weakScore = sortedSystems[sortedSystems.length - 1];
    const needed = 5 - weakScore.foodsConsumed;
    recommendation = `Focus on ${weakestSystem} foods to improve balance. You need ${needed} more ${needed === 1 ? 'food' : 'foods'} in this system.`;
    nextSteps.push(`Add ${needed} ${weakestSystem} ${needed === 1 ? 'food' : 'foods'} to reach the daily goal`);
    
    if (missedMealTimes.length > 0) {
      nextSteps.push(`Try adding ${weakestSystem} foods during ${missedMealTimes[0].toLowerCase()}`);
    }
  } else if (missedMealTimes.length > 0) {
    recommendation = `You're doing well! Try spreading your food intake across more meal times for better absorption.`;
    nextSteps.push(`Add foods during ${missedMealTimes[0].toLowerCase()}`);
  } else {
    recommendation = "Keep up the good work! Aim for more variety within each defense system.";
    nextSteps.push("Explore new foods you haven't tried yet");
  }

  // Add variety-specific insights
  if (foodVariety.totalUniqueFoods < 10) {
    nextSteps.push(`Increase food variety (currently ${foodVariety.totalUniqueFoods} unique foods)`);
  }

  return {
    strongestSystem,
    weakestSystem,
    missedMealTimes,
    systemBalance,
    recommendation,
    nextSteps,
  };
}
