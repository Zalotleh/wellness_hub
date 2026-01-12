/**
 * GET /api/progress/recommendations
 * 
 * Legacy endpoint that provides gap analysis and food suggestions.
 * Currently used by: SmartRecommendations component (Food Suggestions UI)
 * 
 * Note: This endpoint provides different data structure than /api/recommendations:
 * - Returns gap analysis (missing systems, meal times)
 * - Returns suggested foods grouped by system
 * - Returns multi-system superfoods
 * 
 * Consider: Extend /api/recommendations to include gap analysis data
 * so SmartRecommendations can be migrated to unified endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculate5x5x5Score, calculateConsumptionData } from '@/lib/utils/progress-calculator';

const DEFENSE_SYSTEMS = [
  'ANGIOGENESIS',
  'REGENERATION',
  'MICROBIOME',
  'DNA_PROTECTION',
  'IMMUNITY'
] as const;

const MEAL_TIMES = [
  'BREAKFAST',
  'MORNING_SNACK',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER'
] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Get today's consumption data
    const consumptions = await prisma.foodConsumption.findMany({
      where: {
        userId: session.user.id,
        date: targetDate,
      },
      include: {
        foodItems: {
          include: {
            defenseSystems: true,
          },
        },
      },
    });

    // Collect all food items from today
    const allFoodItems = consumptions.flatMap(c => c.foodItems);
    
    // Calculate current progress
    const consumptionData = calculateConsumptionData(allFoodItems, consumptions.length);
    const currentProgress = calculate5x5x5Score(consumptionData);

    // Get all covered systems and meal times
    const coveredSystems = new Set<string>();
    const coveredMealTimes = new Set<string>();
    
    consumptions.forEach((consumption) => {
      coveredMealTimes.add(consumption.mealTime);
      consumption.foodItems.forEach((food) => {
        food.defenseSystems.forEach((benefit) => {
          coveredSystems.add(benefit.defenseSystem);
        });
      });
    });

    // Find missing systems and meal times
    const missingSystems = DEFENSE_SYSTEMS.filter(
      (system) => !coveredSystems.has(system)
    );
    const missingMealTimes = MEAL_TIMES.filter(
      (time) => !coveredMealTimes.has(time)
    );

    // Generate recommendations for missing systems
    const systemRecommendations = [];
    
    for (const system of missingSystems) {
      // Get top foods for this system from database
      const topFoods = await prisma.foodDatabase.findMany({
        where: {
          defenseSystems: {
            has: system,
          },
        },
        take: 5,
      });

      if (topFoods.length > 0) {
        systemRecommendations.push({
          system,
          reason: `You haven't covered the ${system.toLowerCase().replace('_', ' ')} system yet today`,
          priority: 'HIGH' as const,
          suggestedFoods: topFoods.map((food) => ({
            id: food.id,
            name: food.name,
            category: food.category,
            benefits: food.defenseSystems?.length || 0,
            isMultiSystem: (food.defenseSystems?.length || 0) >= 3,
          })),
        });
      }
    }

    // Generate recommendations for missing meal times
    const mealTimeRecommendations = missingMealTimes.map((mealTime) => {
      const timeLabel = mealTime.replace('_', ' ').toLowerCase();
      return {
        mealTime,
        reason: `You haven't logged any foods for ${timeLabel} yet`,
        priority: 'MEDIUM' as const,
        suggestion: `Try to eat at least one defense system food during ${timeLabel}`,
      };
    });

    // Get multi-system superfoods for general recommendations
    const superfoods = await prisma.foodDatabase.findMany();

    // Filter to foods with 3+ systems
    const multiSystemFoods = superfoods
      .filter((food) => (food.defenseSystems?.length || 0) >= 3)
      .sort((a, b) => (b.defenseSystems?.length || 0) - (a.defenseSystems?.length || 0))
      .slice(0, 10);

    // Get personalized recommendations based on user history
    const recentConsumptions = await prisma.foodConsumption.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        foodItems: true,
      },
    });

    // Track user's favorite foods
    const foodFrequency = new Map<string, number>();
    recentConsumptions.forEach((consumption) => {
      consumption.foodItems.forEach((food) => {
        const count = foodFrequency.get(food.name) || 0;
        foodFrequency.set(food.name, count + 1);
      });
    });

    const favoriteFoods = Array.from(foodFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, timesConsumed: count }));

    return NextResponse.json({
      date: targetDate,
      currentProgress: {
        overall: currentProgress.overallScore,
        systemsCovered: coveredSystems.size,
        totalSystems: DEFENSE_SYSTEMS.length,
        mealTimesCovered: coveredMealTimes.size,
        totalMealTimes: MEAL_TIMES.length,
        foodsConsumed: consumptionData.totalUniqueFoods,
      },
      gaps: {
        systems: missingSystems,
        mealTimes: missingMealTimes,
      },
      recommendations: {
        bySystem: systemRecommendations,
        byMealTime: mealTimeRecommendations,
        multiSystemFoods: multiSystemFoods.map((food) => {
          const systemBenefits = food.systemBenefits as Record<string, string> || {};
          return {
            id: food.id,
            name: food.name,
            category: food.category,
            systemsCovered: food.defenseSystems?.length || 0,
            systems: (food.defenseSystems || []).map((system) => ({
              system,
              strength: systemBenefits[system] || 'MEDIUM',
            })),
          };
        }),
      },
      insights: {
        favoriteFoods,
        consistency: {
          daysTracked: new Set(
            recentConsumptions.map((c) => c.date.toDateString())
          ).size,
          totalDays: 7,
        },
      },
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
