import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserLocalDateNoonUTC } from '@/lib/utils/timezone';
import { ConsumptionSource } from '@prisma/client';
import { invalidateScoreCache } from '@/lib/tracking/score-cache';

/**
 * POST /api/meal-planner/log-planned-meal
 * 
 * Convert a planned meal to a logged food consumption
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { mealId, date } = body;

    if (!mealId || !date) {
      return NextResponse.json(
        { error: 'mealId and date are required' },
        { status: 400 }
      );
    }

    // Get the meal details
    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
      include: {
        generatedRecipe: true,
        dailyMenu: {
          include: {
            mealPlan: true,
          },
        },
      },
    });

    if (!meal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    // Parse ingredients from generated recipe or use empty array
    const ingredients = meal.generatedRecipe?.ingredients 
      ? (Array.isArray(meal.generatedRecipe.ingredients) 
          ? meal.generatedRecipe.ingredients 
          : JSON.parse(meal.generatedRecipe.ingredients as string))
      : [];

    // Check if already logged
    const userTimezone = user.timezone || 'UTC';
    const consumptionDate = getUserLocalDateNoonUTC(userTimezone, new Date(date));

    const existingConsumption = await prisma.foodConsumption.findFirst({
      where: {
        userId: user.id,
        mealId: mealId,
        date: consumptionDate,
        mealTime: meal.mealType as any,
      },
    });

    if (existingConsumption) {
      return NextResponse.json(
        { error: 'This meal has already been logged' },
        { status: 400 }
      );
    }

    // Load food database for matching
    const foodDatabase = await prisma.foodDatabase.findMany();

    // Match recipe ingredients to food database
    const { matchIngredientToFood } = await import('@/lib/utils/food-matcher');

    // Create food consumption entry
    const consumption = await prisma.foodConsumption.create({
      data: {
        userId: user.id,
        mealTime: meal.mealType as any,
        sourceType: ConsumptionSource.MEAL_PLAN,
        date: consumptionDate,
        recipeId: meal.recipeId,
        mealId: meal.id,
        mealPlanId: meal.dailyMenu?.mealPlanId || null,
        servings: meal.servings || 1,
        notes: meal.dailyMenu ? `From meal plan: ${meal.dailyMenu.mealPlan.title}` : 'From meal plan',
        foodItems: {
          create: await Promise.all(
            ingredients.map(async (ingredient: any) => {
              const match = await matchIngredientToFood(ingredient.name, foodDatabase);

              return {
                name: ingredient.name,
                quantity: ingredient.quantity ? parseFloat(ingredient.quantity) : 1,
                unit: ingredient.unit || 'serving',
                defenseSystems: {
                  create: match.defenseSystems.map(benefit => ({
                    defenseSystem: benefit.system,
                    strength: benefit.strength,
                  })),
                },
              };
            })
          ),
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

    // Invalidate score cache
    await invalidateScoreCache(user.id, consumptionDate);

    return NextResponse.json(
      {
        success: true,
        message: 'Planned meal logged successfully',
        consumption,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error logging planned meal:', error);
    return NextResponse.json(
      { 
        error: 'Failed to log planned meal',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
