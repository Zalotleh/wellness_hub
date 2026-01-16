import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { invalidateScoreCache } from '@/lib/tracking/score-cache';
import { MealTime, ConsumptionSource } from '@/types';
import { getUserLocalDateNoonUTC } from '@/lib/utils/timezone';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mealPlanId } = body;

    if (!mealPlanId) {
      return NextResponse.json(
        { error: 'mealPlanId is required' },
        { status: 400 }
      );
    }

    // Fetch meal plan with all data
    const mealPlan = await prisma.mealPlan.findUnique({
      where: {
        id: mealPlanId,
        userId: session.user.id,
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
        },
      },
    });

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // Get existing consumptions to avoid duplicates
    const existingConsumptions = await prisma.foodConsumption.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: mealPlan.weekStart,
          lte: mealPlan.weekEnd,
        },
      },
      select: {
        date: true,
        mealTime: true,
      },
    });

    const loggedMeals = new Map<string, Set<string>>();
    existingConsumptions.forEach((c) => {
      const dateKey = format(new Date(c.date), 'yyyy-MM-dd');
      if (!loggedMeals.has(dateKey)) {
        loggedMeals.set(dateKey, new Set());
      }
      loggedMeals.get(dateKey)!.add(c.mealTime);
    });

    // Get user timezone
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    });
    const userTimezone = user?.timezone || 'UTC';

    // Load food database for matching
    const foodDatabase = await prisma.foodDatabase.findMany();
    const { matchIngredientToFood } = await import('@/lib/utils/food-matcher');

    const datesAffected = new Set<string>();
    let totalLogged = 0;
    let skippedPlaceholders = 0;

    // Process each daily menu - create food consumptions
    for (const dailyMenu of mealPlan.dailyMenus) {
      // dailyMenu.date is already stored as noon UTC, use it directly
      const consumptionDate = dailyMenu.date;
      const dateKey = format(consumptionDate, 'yyyy-MM-dd');
      const dayLoggedMeals = loggedMeals.get(dateKey) || new Set();

      console.log(`🔍 [log-week-plan] Processing dailyMenu:`, {
        dateKey,
        rawDate: dailyMenu.date,
        isoString: dailyMenu.date.toISOString?.() || dailyMenu.date,
        consumptionDate: consumptionDate.toISOString?.() || consumptionDate,
        mealsCount: dailyMenu.meals.length,
      });

      for (const meal of dailyMenu.meals) {
        console.log(`🔍 [log-week-plan] Meal ${meal.mealType}:`, {
          id: meal.id,
          consumed: meal.consumed,
          hasRecipe: !!meal.generatedRecipe,
          recipeId: meal.recipeId,
          hasIngredients: meal.generatedRecipe ? !!meal.generatedRecipe.ingredients : false,
        });
        
        // Skip if already logged
        if (dayLoggedMeals.has(meal.mealType) || meal.consumed) {
          console.log(`🔍 [log-week-plan] Skipping ${meal.mealType} on ${dateKey} - already logged`);
          continue;
        }

        // Skip placeholder meals without recipes
        if (!meal.generatedRecipe || !meal.generatedRecipe.ingredients) {
          console.log(`🔍 [log-week-plan] Skipping ${meal.mealType} on ${dateKey} - no recipe (placeholder)`);
          skippedPlaceholders++;
          continue;
        }

        // Parse ingredients
        const ingredients = Array.isArray(meal.generatedRecipe.ingredients)
          ? meal.generatedRecipe.ingredients
          : JSON.parse(meal.generatedRecipe.ingredients as string);

        // Create food consumption with all food items
        console.log(`🔍 [log-week-plan] Creating consumption:`);
        console.log(`  - dailyMenu.date (raw): ${dailyMenu.date}`);
        console.log(`  - dailyMenu.date (ISO): ${dailyMenu.date.toISOString ? dailyMenu.date.toISOString() : 'no toISOString'}`);
        console.log(`  - consumptionDate (ISO): ${consumptionDate.toISOString ? consumptionDate.toISOString() : 'no toISOString'}`);
        console.log(`  - dateKey: ${dateKey}`);
        console.log(`  - mealType: ${meal.mealType}`);
        
        const createdConsumption = await prisma.foodConsumption.create({
          data: {
            userId: session.user.id,
            mealTime: meal.mealType as any,
            sourceType: ConsumptionSource.MEAL_PLAN,
            date: consumptionDate,
            recipeId: meal.recipeId,
            mealId: meal.id,
            mealPlanId: mealPlan.id,
            servings: meal.servings || 1,
            notes: `From meal plan: ${mealPlan.title}`,
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
        });

        // Mark meal as consumed
        await prisma.meal.update({
          where: { id: meal.id },
          data: {
            consumed: true,
            consumedAt: new Date(),
          },
        });

        datesAffected.add(dateKey);
        totalLogged++;
      }
    }

    if (totalLogged === 0) {
      const message = skippedPlaceholders > 0
        ? `Cannot log ${skippedPlaceholders} placeholder meal${skippedPlaceholders > 1 ? 's' : ''} without recipes. Please generate recipes first.`
        : 'All meals already logged';
      
      return NextResponse.json({
        success: false,
        message,
        logged: 0,
        skippedPlaceholders,
      });
    }

    // Invalidate cache for affected dates
    for (const dateKey of datesAffected) {
      await invalidateScoreCache(session.user.id, new Date(dateKey));
    }

    console.log('Logged meal plan:', {
      mealPlanId,
      mealsLogged: totalLogged,
      skippedPlaceholders,
      datesAffected: datesAffected.size,
    });

    return NextResponse.json({
      success: true,
      logged: totalLogged,
      skippedPlaceholders,
      datesAffected: Array.from(datesAffected),
      message: totalLogged > 0 
        ? `Successfully logged ${totalLogged} meal${totalLogged > 1 ? 's' : ''}${skippedPlaceholders > 0 ? `. Skipped ${skippedPlaceholders} placeholder meal${skippedPlaceholders > 1 ? 's' : ''} - generate recipes first.` : ''}`
        : undefined,
    });
  } catch (error) {
    console.error('Error logging meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to log meal plan' },
      { status: 500 }
    );
  }
}
