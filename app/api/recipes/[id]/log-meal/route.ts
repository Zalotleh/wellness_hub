import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserLocalDateNoonUTC } from '@/lib/utils/timezone';
import { invalidateScoreCache } from '@/lib/tracking/score-cache';

/**
 * POST /api/recipes/[id]/log-meal
 * Log a recipe as consumed food to today's progress
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== LOG MEAL ENDPOINT CALLED ===');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('Unauthorized: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipeId = params.id;
    const body = await request.json();
    const { mealTime, date } = body;

    console.log('Log meal request:', { userId: session.user.id, recipeId, mealTime, date });

    // Get user to access timezone
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    });

    const userTimezone = user?.timezone || 'UTC';

    // Validate mealTime
    const validMealTimes = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'SNACK'];
    if (!validMealTimes.includes(mealTime)) {
      console.error('Invalid meal time:', mealTime);
      return NextResponse.json(
        { error: 'Invalid meal time. Must be BREAKFAST, MORNING_SNACK, LUNCH, AFTERNOON_SNACK, DINNER, or SNACK' },
        { status: 400 }
      );
    }

    // Get the recipe
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      console.error('Recipe not found:', recipeId);
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    console.log('Recipe found:', recipe.title);

    // Parse defense systems and ingredients from recipe
    const defenseSystems = Array.isArray(recipe.defenseSystems)
      ? recipe.defenseSystems
      : JSON.parse(recipe.defenseSystems as string);

    const ingredients = Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : JSON.parse(recipe.ingredients as string);

    // Get unique food items from ingredients
    type Ingredient = string | { name?: string; item?: string };
    const foodItems = ingredients.map((ing: Ingredient) => 
      typeof ing === 'string' ? ing : ing.name || ing.item || ''
    ).filter((name: string) => name.length > 0);

    // Use timezone-aware date handling
    // Converts user's local date to noon UTC to prevent timezone shifting
    const targetDate = date
      ? getUserLocalDateNoonUTC(userTimezone, new Date(date))
      : getUserLocalDateNoonUTC(userTimezone);
    
    console.log('Target date for logging:', targetDate.toISOString());
    console.log('Target date (date part only):', targetDate.toISOString().split('T')[0]);

    // Create a single FoodConsumption entry for this recipe
    const consumption = await prisma.foodConsumption.create({
      data: {
        userId: session.user.id,
        date: targetDate,
        mealTime,
        timeConsumed: new Date(),
        sourceType: 'RECIPE',
        recipeId: recipeId,
        servings: 1,
        foodItems: {
          create: foodItems.map((foodName: string) => ({
            name: foodName,
            quantity: 1,
            unit: 'serving',
            defenseSystems: {
              create: defenseSystems.map((system: string) => ({
                defenseSystem: system,
                strength: 'MEDIUM',
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
      },
    });

    console.log(`✅ Logged recipe ${recipeId} as ${mealTime}:`, consumption.id);
    console.log(`   - Systems: ${defenseSystems.join(', ')}`);
    console.log(`   - Foods: ${foodItems.length} items`);

    // Invalidate score cache so the dashboard reflects the new data immediately
    try {
      await invalidateScoreCache(session.user.id, targetDate);
      console.log('✅ Score cache invalidated');
    } catch (cacheError) {
      console.error('Error invalidating score cache (non-critical):', cacheError);
    }

    // Check if this recipe is linked to a recommendation and mark it COMPLETED
    try {
      type RecommendationStatus = Parameters<typeof prisma.recommendation.findFirst>[0] extends { where?: infer W } ? W extends { status?: infer S } ? S : never : never;
      const actedOn = 'ACTED_ON' as unknown as RecommendationStatus;
      const shopped = 'SHOPPED' as unknown as RecommendationStatus;
      const completed = 'COMPLETED' as unknown as RecommendationStatus;

      const linkedRecommendation = await prisma.recommendation.findFirst({
        where: {
          userId: session.user.id,
          linkedRecipeId: recipeId,
          OR: [
            { status: actedOn },
            { status: shopped },
          ],
        },
      });

      if (linkedRecommendation) {
        await prisma.recommendation.update({
          where: { id: linkedRecommendation.id },
          data: {
            status: completed,
            completedAt: new Date(),
            linkedMealLogId: consumption.id,
          },
        });
      }
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      // Don't fail the request if recommendation update fails
    }

    return NextResponse.json({
      success: true,
      message: `Recipe logged to ${mealTime.toLowerCase()}`,
      consumption: {
        id: consumption.id,
        mealTime: consumption.mealTime,
        foodCount: consumption.foodItems?.length || 0,
      },
      systemsTracked: defenseSystems,
      foodsLogged: foodItems.length,
    });

  } catch (error) {
    console.error('Error logging recipe to progress:', error);
    return NextResponse.json(
      { 
        error: 'Failed to log recipe',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
