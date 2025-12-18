import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        recipes: {
          select: { 
            id: true,
            title: true,
            createdAt: true,
          },
        },
        mealPlans: {
          select: { 
            id: true,
            title: true,
            createdAt: true,
          },
        },
        shoppingLists: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
        favorites: {
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        progress: {
          select: { 
            id: true,
            date: true,
            defenseSystem: true,
            count: true,
            createdAt: true,
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User stats debug:', {
      email: user.email,
      recipesCount: user.recipes.length,
      mealPlansCount: user.mealPlans.length,
      shoppingListsCount: user.shoppingLists.length,
      favoritesCount: user.favorites.length,
      progressCount: user.progress.length,
    });

    // Calculate stats
    const recipesCreated = user.recipes.length;
    const mealPlansCreated = user.mealPlans.length;
    const shoppingListsCreated = user.shoppingLists.length;
    const recipesFavorited = user.favorites.length;
    
    // Get unique days with progress (since Progress model has one entry per defenseSystem per day)
    const uniqueDates = new Set(user.progress.map(p => p.date.toISOString().split('T')[0]));
    const progressDays = uniqueDates.size;

    // Calculate average completion rate
    // Group progress by date and calculate daily completion
    const progressByDate = new Map<string, { [key: string]: number }>();
    user.progress.forEach((entry) => {
      const dateKey = entry.date.toISOString().split('T')[0];
      if (!progressByDate.has(dateKey)) {
        progressByDate.set(dateKey, {
          ANGIOGENESIS: 0,
          REGENERATION: 0,
          MICROBIOME: 0,
          DNA_PROTECTION: 0,
          IMMUNITY: 0,
        });
      }
      const dayData = progressByDate.get(dateKey)!;
      dayData[entry.defenseSystem] = entry.count;
    });

    let totalCompletion = 0;
    if (progressByDate.size > 0) {
      progressByDate.forEach((dayData) => {
        const servings = Object.values(dayData);
        const dayCompletion = servings.reduce((acc, val) => acc + (val / 5) * 100, 0) / 5;
        totalCompletion += dayCompletion;
      });
      totalCompletion = Math.round(totalCompletion / progressByDate.size);
    }

    // Get recent activity - combine recipes, meal plans, shopping lists, favorites, and progress
    const recentRecipes = user.recipes.slice(0, 3);
    const recentMealPlans = user.mealPlans.slice(0, 3);
    const recentShoppingLists = user.shoppingLists.slice(0, 3);
    const recentProgress = user.progress.slice(0, 5);
    const recentFavorites = user.favorites.slice(0, 3);

    // Combine and sort recent activity
    const recentActivity = [
      ...recentRecipes.map((recipe) => ({
        type: 'recipe_created' as const,
        title: recipe.title,
        linkUrl: `/recipes/${recipe.id}`,
        timestamp: recipe.createdAt,
      })),
      ...recentMealPlans.map((plan) => ({
        type: 'meal_plan_created' as const,
        title: plan.title,
        linkUrl: `/meal-planner/${plan.id}`,
        timestamp: plan.createdAt,
      })),
      ...recentShoppingLists.map((list) => ({
        type: 'shopping_list_created' as const,
        title: list.title,
        linkUrl: `/shopping-lists/${list.id}`,
        timestamp: list.createdAt,
      })),
      ...recentProgress.map((entry) => ({
        type: 'progress_logged' as const,
        title: `Logged ${entry.defenseSystem.toLowerCase().replace('_', ' ')} (${entry.count}/5)`,
        linkUrl: `/progress`,
        timestamp: entry.createdAt,
      })),
      ...recentFavorites.map((favorite) => ({
        type: 'recipe_favorited' as const,
        title: favorite.recipe.title,
        linkUrl: `/recipes/${favorite.recipe.id}`,
        timestamp: favorite.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return NextResponse.json({
      stats: {
        recipesCreated,
        mealPlansCreated,
        shoppingListsCreated,
        recipesFavorited,
        progressDays,
        avgCompletion: totalCompletion,
      },
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
