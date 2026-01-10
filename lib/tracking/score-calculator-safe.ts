import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';
import { transformFoodConsumptionToProgress } from '@/lib/utils/food-consumption-transformer';
import type { Score5x5x5 } from './types';

/**
 * Safely calculate score with comprehensive error handling
 */
export async function calculateScoreSafe(
  userId: string,
  date: Date
): Promise<{ score: Score5x5x5 | null; error: string | null }> {
  try {
    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      return { score: null, error: 'Invalid user ID' };
    }

    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return { score: null, error: 'Invalid date' };
    }

    const dateKey = startOfDay(date);

    // Check cache first
    const cached = await prisma.dailyProgressScore.findUnique({
      where: {
        userId_date: {
          userId,
          date: dateKey,
        },
      },
    }).catch((err) => {
      console.error('Error fetching cached score:', err);
      return null;
    });

    if (cached && cached.overallScore !== null) {
      return {
        score: {
          overallScore: cached.overallScore,
          defenseSystems: [],
          mealTimes: [],
          foodVariety: {
            totalUniqueFoods: cached.uniqueFoodsCount || 0,
            varietyScore: cached.foodVarietyScore || 0,
            repeatedFoods: [],
            diversityIndex: 0,
          },
          insights: {
            strongestSystem: null,
            weakestSystem: null,
            missedMealTimes: [],
            systemBalance: 0,
            recommendation: 'Cached score - recalculate for detailed insights',
            nextSteps: [],
          },
        },
        error: null,
      };
    }

    // Fetch new food consumption data (this is now the primary source)
    const foodConsumptions = await prisma.foodConsumption.findMany({
      where: {
        userId,
        date: dateKey,
      },
      include: {
        foodItems: {
          include: {
            defenseSystems: true,
          },
        },
      },
    }).catch((err) => {
      console.error('Error fetching food consumption data:', err);
      throw new Error('Failed to fetch food consumption data');
    });

    // Transform to progress format
    const progressData = transformFoodConsumptionToProgress(foodConsumptions);

    // No data for this date - return zero score
    if (!foodConsumptions || foodConsumptions.length === 0) {
      return {
        score: {
          overallScore: 0,
          defenseSystems: [],
          mealTimes: [],
          foodVariety: {
            totalUniqueFoods: 0,
            varietyScore: 0,
            repeatedFoods: [],
            diversityIndex: 0,
          },
          insights: {
            strongestSystem: null,
            weakestSystem: null,
            missedMealTimes: ['BREAKFAST', 'LUNCH', 'DINNER'],
            systemBalance: 0,
            recommendation: 'No food logged for this day',
            nextSteps: ['Start logging your meals to track progress'],
          },
        },
        error: null,
      };
    }

    // Calculate score using existing logic
    const { calculate5x5x5Score } = await import('./5x5x5-score');
    const score = await calculate5x5x5Score(userId, dateKey);

    if (!score) {
      return { score: null, error: 'Failed to calculate score' };
    }

    return { score, error: null };
  } catch (error) {
    console.error('Error in calculateScoreSafe:', error);
    return {
      score: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Safely fetch score with retry logic
 */
export async function fetchScoreWithRetry(
  userId: string,
  date: Date,
  maxRetries: number = 3
): Promise<{ score: Score5x5x5 | null; error: string | null }> {
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await calculateScoreSafe(userId, date);

    if (result.score) {
      return result;
    }

    lastError = result.error;

    // Don't retry on validation errors
    if (lastError?.includes('Invalid')) {
      return { score: null, error: lastError };
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }

  return {
    score: null,
    error: lastError || 'Failed to fetch score after retries',
  };
}

/**
 * Validate score data integrity
 */
export function validateScore(score: Score5x5x5): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (score.overallScore < 0 || score.overallScore > 100) {
    errors.push('Overall score out of range (0-100)');
  }

  if (score.foodVariety.varietyScore < 0 || score.foodVariety.varietyScore > 100) {
    errors.push('Variety score out of range (0-100)');
  }

  if (!score.defenseSystems || !Array.isArray(score.defenseSystems)) {
    errors.push('Defense systems data missing or invalid');
  }

  if (!score.mealTimes || !Array.isArray(score.mealTimes)) {
    errors.push('Meal times data missing or invalid');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get fallback score for error states
 */
export function getFallbackScore(date: Date): Score5x5x5 {
  return {
    overallScore: 0,
    defenseSystems: [],
    mealTimes: [],
    foodVariety: {
      totalUniqueFoods: 0,
      varietyScore: 0,
      repeatedFoods: [],
      diversityIndex: 0,
    },
    insights: {
      strongestSystem: null,
      weakestSystem: null,
      missedMealTimes: [],
      systemBalance: 0,
      recommendation: 'Unable to load score data',
      nextSteps: [],
    },
  };
}
