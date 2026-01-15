import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DefenseSystem } from '@prisma/client';
import { 
  calculateConsumptionData, 
  calculate5x5x5Score,
  getMissedMealTimes,
} from '@/lib/utils/progress-calculator';
import { recommendFoods } from '@/lib/utils/food-matcher';
import { getUserLocalDateNoonUTC } from '@/lib/utils/timezone';

/**
 * GET /api/progress/daily-summary
 * 
 * Get enhanced daily progress summary with full 5x5x5 tracking
 * Includes all three dimensions: systems, foods, and meal frequency
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
    const dateParam = searchParams.get('date');
    const includeRecommendations = searchParams.get('includeRecommendations') === 'true';

    // Get user's timezone (default to UTC if not set)
    const userTimezone = user.timezone || 'UTC';

    // Use timezone-aware date handling to prevent date shifting
    const targetDate = dateParam 
      ? getUserLocalDateNoonUTC(userTimezone, new Date(dateParam))
      : getUserLocalDateNoonUTC(userTimezone);
    
    // Set to start and end of day in UTC (since getUserLocalDateNoonUTC returns noon UTC)
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Fetch all consumptions for the day
    const consumptions = await prisma.foodConsumption.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        foodItems: {
          include: {
            defenseSystems: true,
          },
        },
        recipe: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Extract all food items with their defense systems
    const allFoodItems = consumptions.flatMap(c => c.foodItems);

    // Get meal times consumed
    const mealTimesConsumed = [...new Set(consumptions.map(c => c.mealTime))];
    const missedMealTimes = getMissedMealTimes(mealTimesConsumed);

    // Calculate consumption data
    const consumptionData = calculateConsumptionData(
      allFoodItems,
      mealTimesConsumed.length  // Pass unique meal times count, not total consumptions
    );

    // Calculate 5x5x5 score
    const score = calculate5x5x5Score(consumptionData);

    // Build system-by-system breakdown
    const systemBreakdown = Object.entries(consumptionData.systemFoodCounts).map(
      ([system, count]) => ({
        system: system as DefenseSystem,
        foodCount: count,
        target: 5,
        percentage: Math.min((count / 5) * 100, 100),
        foods: Array.from(consumptionData.uniqueFoodsBySystem[system as DefenseSystem]),
      })
    );

    // Determine missing systems (less than 5 foods)
    const missingSystems = systemBreakdown
      .filter(s => s.foodCount < 5)
      .map(s => s.system);

    // Get food recommendations if requested
    let recommendations = null;
    if (includeRecommendations && missingSystems.length > 0) {
      const consumedFoodNames = Array.from(
        new Set(allFoodItems.map(f => f.name))
      );

      recommendations = await recommendFoods(
        missingSystems,
        consumedFoodNames,
        10
      );
    }

    // Build response
    const summary = {
      date: targetDate.toISOString(),
      score: {
        overall: Math.round(score.overallScore),
        level: score.level,
        dimensions: {
          systems: {
            score: score.systemScore,
            target: 5,
            percentage: (score.systemScore / 5) * 100,
          },
          foods: {
            score: Math.round(score.foodScore * 10) / 10,
            target: 5,
            percentage: Math.min((score.foodScore / 5) * 100, 100),
          },
          frequency: {
            score: score.frequencyScore,
            target: 5,
            percentage: (score.frequencyScore / 5) * 100,
          },
        },
      },
      systemBreakdown,
      mealTracking: {
        totalMeals: consumptions.length,
        mealTimesConsumed,
        missedMealTimes,
        consumptions: consumptions.map(c => ({
          id: c.id,
          mealTime: c.mealTime,
          time: c.date,
          sourceType: c.sourceType,
          foodCount: c.foodItems.length,
          recipe: c.recipe,
        })),
      },
      stats: {
        totalFoods: consumptionData.totalUniqueFoods,
        totalConsumptions: consumptions.length,
        systemsComplete: score.systemScore,
        systemsInProgress: missingSystems.length,
      },
      recommendations: recommendations || undefined,
    };

    const response = NextResponse.json(summary);
    
    // Prevent caching to ensure fresh data for each date
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error: any) {
    console.error('Error fetching daily summary:', error);

    return NextResponse.json(
      { error: 'Failed to fetch daily summary' },
      { status: 500 }
    );
  }
}
