import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DefenseSystem } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mealPlanId, dateRange } = body;

    if (!mealPlanId) {
      return NextResponse.json(
        { error: 'Meal plan ID is required' },
        { status: 400 }
      );
    }

    // Fetch the meal plan
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: mealPlanId, userId: session.user.id },
    });

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // Fetch meals from the meal plan
    const meals = await prisma.meal.findMany({
      where: {
        dailyMenu: {
          mealPlanId: mealPlanId,
        },
        consumed: false,
      },
      include: {
        dailyMenu: true,
      },
    });

    let mealsToSync = meals;

    // Filter by date range if provided
    if (dateRange) {
      const { startDate, endDate } = dateRange;
      mealsToSync = mealsToSync.filter((meal) => {
        const mealDate = new Date(meal.dailyMenu.date);
        return (!startDate || mealDate >= new Date(startDate)) &&
               (!endDate || mealDate <= new Date(endDate));
      });
    }

    if (mealsToSync.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No meals to sync',
        synced: 0,
      });
    }

    const syncResults = [];
    let totalSynced = 0;
    let totalFoodItems = 0;

    // Process each meal
    for (const meal of mealsToSync) {
      // Get meal date from dailyMenu
      const mealDate = new Date(meal.dailyMenu.date);
      mealDate.setHours(0, 0, 0, 0);

      // Determine meal time based on meal type
      const mealTimeMap: Record<string, any> = {
        'breakfast': 'BREAKFAST',
        'morning_snack': 'MORNING_SNACK',
        'lunch': 'LUNCH',
        'afternoon_snack': 'AFTERNOON_SNACK',
        'dinner': 'DINNER',
      };

      const mealTime = (mealTimeMap[meal.mealType] || 'CUSTOM') as any;

      // Simple food consumption entry from meal
      const foodConsumption = await prisma.foodConsumption.create({
        data: {
          userId: session.user.id,
          date: mealDate,
          mealTime,
          sourceType: 'MEAL_PLAN',
          mealId: meal.id,
          servings: meal.servings || 1,
          notes: `From meal plan: ${meal.mealName}`,
          foodItems: {
            create: [
              {
                name: meal.mealName,
                quantity: meal.servings || 1,
              },
            ],
          },
        },
      });

      // Mark the meal as consumed
      await prisma.meal.update({
        where: { id: meal.id },
        data: {
          consumed: true,
          consumedAt: new Date(),
        },
      });

      syncResults.push({
        mealId: meal.id,
        mealName: meal.mealName,
        date: mealDate,
        mealTime,
        systemsCovered: meal.defenseSystems.length,
      });

      totalSynced++;
      totalFoodItems++;
    }

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      totalFoodItems,
      results: syncResults,
      message: `Successfully synced ${totalSynced} meal(s) to progress tracking`,
    });

  } catch (error) {
    console.error('Sync meal plan error:', error);
    return NextResponse.json(
      { error: 'Failed to sync meal plan' },
      { status: 500 }
    );
  }
}
