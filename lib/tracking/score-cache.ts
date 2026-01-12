import { prisma } from '@/lib/prisma';
import { calculate5x5x5Score } from './5x5x5-score';
import { startOfDay, differenceInMinutes } from 'date-fns';
import type { Score5x5x5, SystemScore } from './types';
import { DefenseSystem } from '@/types';

/**
 * Cache TTL (Time To Live) in minutes
 * Cached scores older than this will be recalculated
 */
const CACHE_TTL_MINUTES = 60;

/**
 * Invalidate (delete) cached score for a specific date
 * Call this after logging new food to force fresh calculation
 */
export async function invalidateScoreCache(
  userId: string,
  date: Date
): Promise<void> {
  // Normalize to UTC date at noon
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const dateOnly = new Date(Date.UTC(year, month, day, 12, 0, 0));

  try {
    await prisma.dailyProgressScore.delete({
      where: {
        userId_date: {
          userId,
          date: dateOnly,
        },
      },
    });
    console.log(`✅ Cache invalidated for user ${userId} on ${dateOnly.toISOString()}`);
  } catch (error) {
    // It's okay if cache doesn't exist - just means it wasn't cached yet
    if (error instanceof Error && !error.message.includes('Record to delete does not exist')) {
      console.error('Error invalidating cache:', error);
    }
  }
}

/**
 * Save calculated score to database for caching
 */
export async function cacheDailyScore(
  userId: string,
  date: Date,
  score: Score5x5x5
): Promise<void> {
  // Normalize to UTC date at noon
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const dateOnly = new Date(Date.UTC(year, month, day, 12, 0, 0));

  // Extract system counts
  const systemCounts: Record<string, number> = {};
  score.defenseSystems.forEach((s) => {
    systemCounts[s.system] = s.foodsConsumed;
  });

  await prisma.dailyProgressScore.upsert({
    where: {
      userId_date: {
        userId,
        date: dateOnly,
      },
    },
    create: {
      userId,
      date: dateOnly,
      overallScore: score.overallScore,
      defenseSystemScore: score.defenseSystems.reduce((sum, s) => sum + s.score, 0) / score.defenseSystems.length,
      mealTimeScore: score.mealTimes.reduce((sum, m) => sum + m.score, 0) / score.mealTimes.length,
      foodVarietyScore: score.foodVariety.varietyScore,
      angiogenesisCount: systemCounts[DefenseSystem.ANGIOGENESIS] || 0,
      regenerationCount: systemCounts[DefenseSystem.REGENERATION] || 0,
      microbiomeCount: systemCounts[DefenseSystem.MICROBIOME] || 0,
      dnaProtectionCount: systemCounts[DefenseSystem.DNA_PROTECTION] || 0,
      immunityCount: systemCounts[DefenseSystem.IMMUNITY] || 0,
      breakfastSystems: score.mealTimes.find(m => m.mealTime === 'BREAKFAST')?.systemsCovered.length || 0,
      lunchSystems: score.mealTimes.find(m => m.mealTime === 'LUNCH')?.systemsCovered.length || 0,
      dinnerSystems: score.mealTimes.find(m => m.mealTime === 'DINNER')?.systemsCovered.length || 0,
      snackSystems: score.mealTimes.find(m => m.mealTime === 'SNACK')?.systemsCovered.length || 0,
      uniqueFoodsCount: score.foodVariety.totalUniqueFoods,
      totalServings: 0, // Will be calculated from actual serving data
      gaps: {
        missedSystems: score.defenseSystems.filter(s => s.foodsConsumed === 0).map(s => s.system),
        missedMealTimes: score.insights.missedMealTimes,
      },
      achievements: score.defenseSystems
        .filter(s => s.foodsConsumed >= 5)
        .map(s => ({ system: s.system, achievement: 'COMPLETE' })),
    },
    update: {
      overallScore: score.overallScore,
      defenseSystemScore: score.defenseSystems.reduce((sum, s) => sum + s.score, 0) / score.defenseSystems.length,
      mealTimeScore: score.mealTimes.reduce((sum, m) => sum + m.score, 0) / score.mealTimes.length,
      foodVarietyScore: score.foodVariety.varietyScore,
      angiogenesisCount: systemCounts[DefenseSystem.ANGIOGENESIS] || 0,
      regenerationCount: systemCounts[DefenseSystem.REGENERATION] || 0,
      microbiomeCount: systemCounts[DefenseSystem.MICROBIOME] || 0,
      dnaProtectionCount: systemCounts[DefenseSystem.DNA_PROTECTION] || 0,
      immunityCount: systemCounts[DefenseSystem.IMMUNITY] || 0,
      breakfastSystems: score.mealTimes.find(m => m.mealTime === 'BREAKFAST')?.systemsCovered.length || 0,
      lunchSystems: score.mealTimes.find(m => m.mealTime === 'LUNCH')?.systemsCovered.length || 0,
      dinnerSystems: score.mealTimes.find(m => m.mealTime === 'DINNER')?.systemsCovered.length || 0,
      snackSystems: score.mealTimes.find(m => m.mealTime === 'SNACK')?.systemsCovered.length || 0,
      uniqueFoodsCount: score.foodVariety.totalUniqueFoods,
      gaps: {
        missedSystems: score.defenseSystems.filter(s => s.foodsConsumed === 0).map(s => s.system),
        missedMealTimes: score.insights.missedMealTimes,
      },
      achievements: score.defenseSystems
        .filter(s => s.foodsConsumed >= 5)
        .map(s => ({ system: s.system, achievement: 'COMPLETE' })),
    },
  });
}

/**
 * Get cached score or calculate if not cached/stale
 */
export async function getCachedOrCalculateScore(
  userId: string,
  date: Date
): Promise<Score5x5x5> {
  // Normalize to UTC date at noon
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const dateOnly = new Date(Date.UTC(year, month, day, 12, 0, 0));

  // Try to get cached score
  const cached = await prisma.dailyProgressScore.findUnique({
    where: {
      userId_date: {
        userId,
        date: dateOnly,
      },
    },
  });

  // If cached and fresh (calculated within TTL), use it
  if (cached && differenceInMinutes(new Date(), cached.createdAt) < CACHE_TTL_MINUTES) {
    // Reconstruct Score5x5x5 from cached data
    return reconstructScoreFromCache(cached);
  }

  // Otherwise, calculate fresh
  const score = await calculate5x5x5Score(userId, date);
  await cacheDailyScore(userId, date, score);
  return score;
}

/**
 * Reconstruct Score5x5x5 object from cached database entry
 */
function reconstructScoreFromCache(cached: any): Score5x5x5 {
  const defenseSystems: SystemScore[] = [
    {
      system: DefenseSystem.ANGIOGENESIS,
      foodsConsumed: cached.angiogenesisCount,
      uniqueFoods: [],
      coveragePercent: (cached.angiogenesisCount / 5) * 100,
      score: cached.angiogenesisCount >= 5 ? 100 :
             cached.angiogenesisCount === 4 ? 85 :
             cached.angiogenesisCount === 3 ? 70 :
             cached.angiogenesisCount === 2 ? 50 :
             cached.angiogenesisCount === 1 ? 30 : 0,
    },
    {
      system: DefenseSystem.REGENERATION,
      foodsConsumed: cached.regenerationCount,
      uniqueFoods: [],
      coveragePercent: (cached.regenerationCount / 5) * 100,
      score: cached.regenerationCount >= 5 ? 100 :
             cached.regenerationCount === 4 ? 85 :
             cached.regenerationCount === 3 ? 70 :
             cached.regenerationCount === 2 ? 50 :
             cached.regenerationCount === 1 ? 30 : 0,
    },
    {
      system: DefenseSystem.MICROBIOME,
      foodsConsumed: cached.microbiomeCount,
      uniqueFoods: [],
      coveragePercent: (cached.microbiomeCount / 5) * 100,
      score: cached.microbiomeCount >= 5 ? 100 :
             cached.microbiomeCount === 4 ? 85 :
             cached.microbiomeCount === 3 ? 70 :
             cached.microbiomeCount === 2 ? 50 :
             cached.microbiomeCount === 1 ? 30 : 0,
    },
    {
      system: DefenseSystem.DNA_PROTECTION,
      foodsConsumed: cached.dnaProtectionCount,
      uniqueFoods: [],
      coveragePercent: (cached.dnaProtectionCount / 5) * 100,
      score: cached.dnaProtectionCount >= 5 ? 100 :
             cached.dnaProtectionCount === 4 ? 85 :
             cached.dnaProtectionCount === 3 ? 70 :
             cached.dnaProtectionCount === 2 ? 50 :
             cached.dnaProtectionCount === 1 ? 30 : 0,
    },
    {
      system: DefenseSystem.IMMUNITY,
      foodsConsumed: cached.immunityCount,
      uniqueFoods: [],
      coveragePercent: (cached.immunityCount / 5) * 100,
      score: cached.immunityCount >= 5 ? 100 :
             cached.immunityCount === 4 ? 85 :
             cached.immunityCount === 3 ? 70 :
             cached.immunityCount === 2 ? 50 :
             cached.immunityCount === 1 ? 30 : 0,
    },
  ];

  const gaps = cached.gaps as any;

  return {
    overallScore: cached.overallScore,
    defenseSystems,
    mealTimes: [
      {
        mealTime: 'BREAKFAST',
        hasFood: cached.breakfastSystems > 0,
        foodCount: cached.breakfastSystems,
        systemsCovered: [],
        score: cached.breakfastSystems > 0 ? 100 : 0,
      },
      {
        mealTime: 'LUNCH',
        hasFood: cached.lunchSystems > 0,
        foodCount: cached.lunchSystems,
        systemsCovered: [],
        score: cached.lunchSystems > 0 ? 100 : 0,
      },
      {
        mealTime: 'DINNER',
        hasFood: cached.dinnerSystems > 0,
        foodCount: cached.dinnerSystems,
        systemsCovered: [],
        score: cached.dinnerSystems > 0 ? 100 : 0,
      },
      {
        mealTime: 'SNACK',
        hasFood: cached.snackSystems > 0,
        foodCount: cached.snackSystems,
        systemsCovered: [],
        score: cached.snackSystems > 0 ? 100 : 0,
      },
    ],
    foodVariety: {
      totalUniqueFoods: cached.uniqueFoodsCount,
      varietyScore: cached.foodVarietyScore,
      repeatedFoods: [],
      diversityIndex: 0,
    },
    insights: {
      strongestSystem: null,
      weakestSystem: null,
      missedMealTimes: gaps?.missedMealTimes || [],
      systemBalance: 0,
      recommendation: 'View full score for detailed insights',
      nextSteps: [],
    },
  };
}

/**
 * Batch invalidate cache for multiple dates
 */
export async function batchInvalidateScoreCache(
  userId: string,
  dates: Date[]
): Promise<void> {
  const dateOnlys = dates.map(d => startOfDay(d));
  
  await prisma.dailyProgressScore.deleteMany({
    where: {
      userId,
      date: {
        in: dateOnlys,
      },
    },
  });
}
