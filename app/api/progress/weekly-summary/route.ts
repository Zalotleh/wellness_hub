import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DefenseSystem } from '@prisma/client';
import {
  calculateConsumptionData,
  calculate5x5x5Score,
  analyzeSystemTrend,
  calculateStreak,
} from '@/lib/utils/progress-calculator';

/**
 * GET /api/progress/weekly-summary
 * 
 * Get weekly progress summary with trends and achievements
 * Analyzes patterns across the 5x5x5 framework
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Default to last 7 days
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000); // 7 days ago
    startDate.setHours(0, 0, 0, 0);

    // Fetch all consumptions for the period
    const consumptions = await prisma.foodConsumption.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        foodItems: {
          include: {
            defenseSystems: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group consumptions by day
    const dailyData = new Map<string, typeof consumptions>();
    consumptions.forEach(consumption => {
      const dateKey = consumption.date.toISOString().split('T')[0];
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, []);
      }
      dailyData.get(dateKey)!.push(consumption);
    });

    // Calculate daily scores
    const dailyScores = Array.from(dailyData.entries()).map(([dateKey, dayConsumptions]) => {
      const foodItems = dayConsumptions.flatMap(c => c.foodItems);
      const mealTimesForDay = [...new Set(dayConsumptions.map(c => c.mealTime))];
      const consumptionData = calculateConsumptionData(foodItems, mealTimesForDay.length);
      const score = calculate5x5x5Score(consumptionData);

      return {
        date: new Date(dateKey),
        score: score.overallScore,
        overallScore: score.overallScore,
        systemScore: score.systemScore,
        foodScore: score.foodScore,
        frequencyScore: score.frequencyScore,
        level: score.level,
        totalMeals: dayConsumptions.length,
        totalFoods: consumptionData.totalUniqueFoods,
      };
    });

    // Calculate overall period statistics
    const allFoodItems = consumptions.flatMap(c => c.foodItems);
    const periodData = calculateConsumptionData(allFoodItems, consumptions.length);

    // Track unique foods per system over the period
    const systemBreakdown = Object.entries(periodData.systemFoodCounts).map(
      ([system, count]) => ({
        system: system as DefenseSystem,
        uniqueFoods: count,
        foods: Array.from(periodData.uniqueFoodsBySystem[system as DefenseSystem]),
      })
    );

    // Analyze trends
    const trends = {
      overall: analyzeSystemTrend(dailyScores.map(d => d.score)),
      systems: analyzeSystemTrend(dailyScores.map(d => d.systemScore)),
      foods: analyzeSystemTrend(dailyScores.map(d => d.foodScore)),
      frequency: analyzeSystemTrend(dailyScores.map(d => d.frequencyScore)),
    };

    // Calculate streak
    const streak = calculateStreak(dailyScores);

    // Find top foods (most frequently consumed)
    const foodFrequency = new Map<string, number>();
    allFoodItems.forEach(item => {
      foodFrequency.set(item.name, (foodFrequency.get(item.name) || 0) + 1);
    });

    const topFoods = Array.from(foodFrequency.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate averages
    const avgDailyScore = dailyScores.length > 0
      ? dailyScores.reduce((sum, d) => sum + d.score, 0) / dailyScores.length
      : 0;

    const avgDailyMeals = dailyScores.length > 0
      ? dailyScores.reduce((sum, d) => sum + d.totalMeals, 0) / dailyScores.length
      : 0;

    // Determine achievements
    const achievements = [];
    if (streak >= 7) achievements.push('WEEK_STREAK');
    if (streak >= 30) achievements.push('MONTH_STREAK');
    if (avgDailyScore >= 80) achievements.push('CONSISTENT_EXCELLENCE');
    if (periodData.totalUniqueFoods >= 25) achievements.push('FOOD_DIVERSITY');
    if (systemBreakdown.every(s => s.uniqueFoods >= 5)) achievements.push('ALL_SYSTEMS_COMPLETE');

    // Build response
    const summary = {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: dailyScores.length,
      },
      overview: {
        averageDailyScore: Math.round(avgDailyScore),
        averageDailyMeals: Math.round(avgDailyMeals * 10) / 10,
        totalConsumptions: consumptions.length,
        totalUniqueFoods: periodData.totalUniqueFoods,
        currentStreak: streak,
      },
      dailyScores,
      systemBreakdown,
      trends,
      topFoods,
      achievements,
      insights: generateInsights(dailyScores, trends, systemBreakdown),
    };

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Error fetching weekly summary:', error);

    return NextResponse.json(
      { error: 'Failed to fetch weekly summary' },
      { status: 500 }
    );
  }
}

/**
 * Generate insights based on weekly data
 */
function generateInsights(
  dailyScores: any[],
  trends: any,
  systemBreakdown: any[]
): string[] {
  const insights: string[] = [];

  // Trend insights
  if (trends.overall === 'IMPROVING') {
    insights.push('Your overall 5x5x5 score is improving! Keep up the great work.');
  } else if (trends.overall === 'DECLINING') {
    insights.push('Your scores have been declining. Consider reviewing your meal planning.');
  }

  // System insights
  const weakSystems = systemBreakdown
    .filter(s => s.uniqueFoods < 5)
    .map(s => s.system);

  if (weakSystems.length > 0) {
    insights.push(
      `Focus on ${weakSystems.join(', ')} - these systems need more food variety.`
    );
  }

  // Frequency insights
  const avgFrequency = dailyScores.length > 0
    ? dailyScores.reduce((sum, d) => sum + d.frequencyScore, 0) / dailyScores.length
    : 0;

  if (avgFrequency < 3) {
    insights.push('Try to increase meal frequency to 5 times per day for optimal results.');
  }

  // Consistency insights
  if (dailyScores.length >= 7) {
    const consistency = dailyScores.filter(d => d.score >= 70).length / dailyScores.length;
    if (consistency >= 0.8) {
      insights.push('Excellent consistency! You\'re hitting your targets regularly.');
    }
  }

  return insights;
}
