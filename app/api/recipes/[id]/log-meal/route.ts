import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/recipes/[id]/log-meal
 * Log a recipe as consumed food to today's progress
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipeId = params.id;
    const body = await request.json();
    const { mealTime, date } = body;

    // Validate mealTime
    const validMealTimes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
    if (!validMealTimes.includes(mealTime)) {
      return NextResponse.json(
        { error: 'Invalid meal time. Must be BREAKFAST, LUNCH, DINNER, or SNACK' },
        { status: 400 }
      );
    }

    // Get the recipe
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Parse defense systems and ingredients from recipe
    const defenseSystems = Array.isArray(recipe.defenseSystems)
      ? recipe.defenseSystems
      : JSON.parse(recipe.defenseSystems as string);

    const ingredients = Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : JSON.parse(recipe.ingredients as string);

    // Get unique food items from ingredients
    const foodItems = ingredients.map((ing: any) => 
      typeof ing === 'string' ? ing : ing.name || ing.item || ''
    ).filter((name: string) => name.length > 0);

    // Use the target date or default to today
    const targetDate = date ? new Date(date) : new Date();

    // Log to progress for each defense system
    const progressEntries = [];
    for (const system of defenseSystems) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/progress`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            defenseSystem: system,
            mealTime,
            foodsConsumed: foodItems,
            date: targetDate.toISOString(),
          }),
        });

        if (response.ok) {
          const { data } = await response.json();
          progressEntries.push(data);
        }
      } catch (error) {
        console.error(`Error logging ${system} for recipe ${recipeId}:`, error);
      }
    }

    // Check if this recipe is linked to a recommendation and mark it COMPLETED
    try {
      const linkedRecommendation = await prisma.recommendation.findFirst({
        where: {
          userId: session.user.id,
          linkedRecipeId: recipeId,
          OR: [
            { status: 'ACTED_ON' as any },
            { status: 'SHOPPED' as any },
          ],
        } as any,
      });

      if (linkedRecommendation && progressEntries.length > 0) {
        await prisma.recommendation.update({
          where: { id: linkedRecommendation.id },
          data: {
            status: 'COMPLETED' as any,
            completedAt: new Date(),
            linkedMealLogId: progressEntries[0].id,
          } as any,
        });
      }
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      // Don't fail the request if recommendation update fails
    }

    return NextResponse.json({
      success: true,
      message: `Recipe logged to ${mealTime.toLowerCase()}`,
      progressEntries: progressEntries.map(entry => ({
        id: entry.id,
        defenseSystem: entry.defenseSystem,
        mealTime: entry.mealTime,
      })),
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
