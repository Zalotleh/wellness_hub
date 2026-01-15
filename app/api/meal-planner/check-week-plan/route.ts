import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart');
    const weekEnd = searchParams.get('weekEnd');

    if (!weekStart || !weekEnd) {
      return NextResponse.json(
        { error: 'weekStart and weekEnd are required' },
        { status: 400 }
      );
    }

    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        userId: session.user.id,
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
      },
      include: {
        dailyMenus: {
          include: {
            meals: {
              include: {
                generatedRecipe: true,
              },
            },
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    if (!mealPlan) {
      return NextResponse.json({ exists: false, mealPlan: null });
    }

    // Get consumption data to determine what's been logged
    const consumptions = await prisma.foodConsumption.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: new Date(weekStart),
          lte: new Date(weekEnd),
        },
      },
      select: {
        date: true,
        mealTime: true,
      },
    });

    // Create a map of logged meals
    const loggedMeals = new Map<string, Set<string>>();
    consumptions.forEach((c) => {
      const dateKey = format(new Date(c.date), 'yyyy-MM-dd');
      if (!loggedMeals.has(dateKey)) {
        loggedMeals.set(dateKey, new Set());
      }
      loggedMeals.get(dateKey)!.add(c.mealTime);
    });

    // Transform meal plan data
    const dailyMenus = mealPlan.dailyMenus.map((dm) => {
      const dateKey = format(new Date(dm.date), 'yyyy-MM-dd');
      const loggedMealTimes = loggedMeals.get(dateKey) || new Set();

      return {
        date: dm.date,
        meals: dm.meals.map((m) => ({
          id: m.id,
          mealType: m.mealType,
          isLogged: loggedMealTimes.has(m.mealType),
          recipe: m.generatedRecipe
            ? {
                title: m.generatedRecipe.name,
                description: m.generatedRecipe.description,
                imageUrl: null, // imageUrl not in GeneratedRecipe schema
                prepTime: m.generatedRecipe.prepTime,
                cookTime: m.generatedRecipe.cookTime,
                servings: m.generatedRecipe.servings,
                defenseSystems: m.generatedRecipe.defenseSystems,
              }
            : null,
        })),
      };
    });

    const totalMeals = dailyMenus.reduce((sum, dm) => sum + dm.meals.length, 0);
    const loggedCount = dailyMenus.reduce(
      (sum, dm) => sum + dm.meals.filter((m) => m.isLogged).length,
      0
    );

    return NextResponse.json({
      exists: true,
      mealPlan: {
        id: mealPlan.id,
        weekStart: mealPlan.weekStart,
        weekEnd: mealPlan.weekEnd,
        createdAt: mealPlan.createdAt,
        dailyMenus,
        stats: {
          totalMeals,
          loggedMeals: loggedCount,
          remainingMeals: totalMeals - loggedCount,
        },
      },
    });
  } catch (error) {
    console.error('Error checking meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to check meal plan' },
      { status: 500 }
    );
  }
}
