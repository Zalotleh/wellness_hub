import { prisma } from '@/lib/prisma';
import { UserBehaviorProfile, RecommendationType } from './types';
import { subDays } from 'date-fns';

/**
 * Analyze user's behavior patterns over the last 30 days
 */
export async function analyzeUserBehavior(userId: string): Promise<UserBehaviorProfile> {
  const thirtyDaysAgo = subDays(new Date(), 30);
  
  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      defaultDietaryRestrictions: true,
    },
  });
  
  // Get food consumption data from last 30 days
  const foodConsumptions = await prisma.foodConsumption.findMany({
    where: {
      userId,
      date: { gte: thirtyDaysAgo },
    },
    include: {
      foodItems: {
        include: {
          defenseSystems: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });
  
  // Get daily scores from cache
  const dailyScores = await prisma.dailyProgressScore.findMany({
    where: {
      userId,
      date: { gte: thirtyDaysAgo },
    },
    orderBy: { date: 'desc' },
  });
  
  // Analyze meal time preferences
  const mealTimeCounts: Record<string, number> = {};
  foodConsumptions.forEach(fc => {
    mealTimeCounts[fc.mealTime] = (mealTimeCounts[fc.mealTime] || 0) + 1;
  });
  
  const preferredMealTimes = Object.entries(mealTimeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([time]) => time);
  
  // Analyze favorite foods
  const foodCounts: Record<string, number> = {};
  foodConsumptions.forEach(fc => {
    fc.foodItems.forEach(food => {
      foodCounts[food.name] = (foodCounts[food.name] || 0) + 1;
    });
  });
  
  const favoriteFoods = Object.entries(foodCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, frequency]) => ({ name, frequency }));
  
  // Calculate average score
  const avgScore = dailyScores.length > 0
    ? dailyScores.reduce((sum, s) => sum + (s.overallScore || 0), 0) / dailyScores.length
    : 0;
  
  // Calculate consistency (days tracked / 30 days)
  const uniqueDates = new Set(foodConsumptions.map(p => p.date.toISOString().split('T')[0]));
  const consistency = (uniqueDates.size / 30) * 100;
  
  // Get recommendation history
  const recommendations = await prisma.recommendation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  }).catch(() => []); // Handle case where table doesn't exist yet
  
  const acceptedCount = recommendations.filter(r => r.status === 'ACCEPTED').length;
  const acceptanceRate = recommendations.length > 0
    ? (acceptedCount / recommendations.length) * 100
    : 50; // Default to 50% if no history
  
  const dismissedTypes = recommendations
    .filter(r => r.status === 'DISMISSED' && r.createdAt > subDays(new Date(), 7))
    .map(r => r.type as RecommendationType);
  
  const lastRec = recommendations[0];
  
  return {
    userId,
    preferredMealTimes,
    favoriteFoods,
    dietaryRestrictions: user?.defaultDietaryRestrictions || [],
    averageDailyScore: Math.round(avgScore),
    consistency: Math.round(consistency),
    acceptanceRate: Math.round(acceptanceRate),
    dismissedTypes,
    lastRecommendationDate: lastRec?.createdAt || null,
  };
}

/**
 * Get user's preferred meal time for recommendations
 */
export function getPreferredMealTime(userProfile: UserBehaviorProfile): string {
  // Return most frequent meal time, or default to DINNER
  return userProfile.preferredMealTimes[0] || 'DINNER';
}

/**
 * Check if user has recently dismissed a recommendation type
 */
export function hasRecentlyDismissedType(
  userProfile: UserBehaviorProfile,
  type: RecommendationType
): boolean {
  return userProfile.dismissedTypes.includes(type);
}

/**
 * Calculate user engagement score (0-100)
 * Higher score = more engaged user
 */
export function calculateEngagementScore(userProfile: UserBehaviorProfile): number {
  let score = 0;
  
  // Consistency (0-40 points)
  score += (userProfile.consistency / 100) * 40;
  
  // Average daily score (0-30 points)
  score += (userProfile.averageDailyScore / 100) * 30;
  
  // Acceptance rate (0-30 points)
  score += (userProfile.acceptanceRate / 100) * 30;
  
  return Math.round(Math.min(100, Math.max(0, score)));
}
