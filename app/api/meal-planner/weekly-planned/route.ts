import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserLocalDateNoonUTC } from '@/lib/utils/timezone';
import { eachDayOfInterval, format } from 'date-fns';

/**
 * GET /api/meal-planner/weekly-planned
 * 
 * Get all planned meals for a week with their logged status
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

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'startDate and endDate parameters are required' },
        { status: 400 }
      );
    }

    const userTimezone = user.timezone || 'UTC';
    const startDate = getUserLocalDateNoonUTC(userTimezone, new Date(startDateParam));
    const endDate = getUserLocalDateNoonUTC(userTimezone, new Date(endDateParam));

    // Find all meal plans that overlap with this week
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        userId: user.id,
        OR: [
          {
            weekStart: { lte: endDate },
            weekEnd: { gte: startDate },
          },
        ],
      },
      include: {
        dailyMenus: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            meals: {
              include: {
                generatedRecipe: true,
              },
            },
          },
        },
      },
    });

    // Get all food consumptions for the week to check logged status
    const consumptions = await prisma.foodConsumption.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
        mealPlanId: {
          not: null,
        },
      },
      select: {
        id: true,
        date: true,
        mealTime: true,
        mealId: true,
        mealPlanId: true,
      },
    });

    // Flatten all meals from all plans
    const plannedMeals: any[] = [];

    mealPlans.forEach((plan: any) => {
      plan.dailyMenus.forEach((menu: any) => {
        menu.meals.forEach((meal: any) => {
          const menuDateString = format(new Date(menu.date), 'yyyy-MM-dd');
          
          // Check if this meal has been logged using date string comparison
          const isLogged = consumptions.some(c => {
            const consumptionDateString = format(new Date(c.date), 'yyyy-MM-dd');
            return c.mealId === meal.id && 
                   c.mealTime === meal.mealType &&
                   consumptionDateString === menuDateString;
          });

          plannedMeals.push({
            id: meal.id,
            date: menu.date.toISOString(),
            mealTime: meal.mealType,
            recipeId: meal.recipeId || meal.id,
            recipeTitle: meal.generatedRecipe?.name || meal.mealName,
            recipeImage: null,
            servings: meal.servings,
            isLogged,
            mealPlanId: plan.id,
            mealPlanTitle: plan.title,
          });
        });
      });
    });

    const response = NextResponse.json({
      success: true,
      plannedMeals,
      totalPlanned: plannedMeals.length,
      totalLogged: plannedMeals.filter(m => m.isLogged).length,
    });

    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('Error fetching weekly planned meals:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch weekly planned meals',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
