import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { markRecipeConsumedSchema } from '@/lib/validations';
import { extractRecipeSystemBenefits } from '@/lib/utils/food-matcher';
import { ConsumptionSource } from '@prisma/client';

/**
 * POST /api/progress/mark-recipe-consumed
 * 
 * Mark a recipe as consumed - one-click tracking from recipe page
 * Automatically extracts defense system benefits from recipe ingredients
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
    const validatedData = markRecipeConsumedSchema.parse(body);

    // Fetch the recipe with ingredients
    const recipe = await prisma.recipe.findUnique({
      where: { id: validatedData.recipeId },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    const consumptionDate = validatedData.date
      ? new Date(validatedData.date)
      : new Date();

    // Extract defense system benefits from recipe ingredients
    const foodsWithSystems = await extractRecipeSystemBenefits(recipe as any);

    // Calculate servings adjustment
    const servingMultiplier = validatedData.servingsConsumed / (recipe.servings || 1);

    // Create the food consumption entry
    const consumption = await prisma.foodConsumption.create({
      data: {
        userId: user.id,
        mealTime: validatedData.mealTime,
        sourceType: ConsumptionSource.RECIPE,
        recipeId: recipe.id,
        date: consumptionDate,
        notes: validatedData.notes,
        foodItems: {
          create: foodsWithSystems.map((food) => ({
            name: food.name,
            portion: `${servingMultiplier} serving${servingMultiplier !== 1 ? 's' : ''}`,
            servings: servingMultiplier,
            defenseSystems: {
              create: food.systems.map(benefit => ({
                defenseSystem: benefit.system,
                strength: benefit.strength,
              })),
            },
          })),
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
            defenseSystems: true,
          },
        },
      },
    });

    // Calculate defense system impact
    const systemImpact = new Map<string, number>();
    consumption.foodItems.forEach((item: any) => {
      item.defenseSystems.forEach((ds: any) => {
        systemImpact.set(
          ds.defenseSystem,
          (systemImpact.get(ds.defenseSystem) || 0) + 1
        );
      });
    });

    return NextResponse.json(
      {
        message: `Recipe "${recipe.title}" marked as consumed`,
        consumption,
        impact: {
          totalFoods: consumption.foodItems.length,
          systemsImpacted: Array.from(systemImpact.keys()),
          systemFoodCounts: Object.fromEntries(systemImpact),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error marking recipe as consumed:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to mark recipe as consumed' },
      { status: 500 }
    );
  }
}
