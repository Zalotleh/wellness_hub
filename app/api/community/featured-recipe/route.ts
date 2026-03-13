import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/community/featured-recipe
 * Returns the recipe with the most favorites in the last 30 days.
 * Falls back to all-time most favorited if none in last 30 days.
 */
export async function GET() {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    // Count favorites per recipe in the last 30 days and pick the top one
    const topFavorite = await prisma.favorite.groupBy({
      by: ['recipeId'],
      where: { createdAt: { gte: since } },
      _count: { recipeId: true },
      orderBy: { _count: { recipeId: 'desc' } },
      take: 1,
    });

    // Fallback: all-time most favorited if no activity in last 30 days
    const topFavoriteAllTime = topFavorite.length === 0
      ? await prisma.favorite.groupBy({
          by: ['recipeId'],
          _count: { recipeId: true },
          orderBy: { _count: { recipeId: 'desc' } },
          take: 1,
        })
      : topFavorite;

    if (topFavoriteAllTime.length === 0) {
      return NextResponse.json({ recipe: null });
    }

    const featuredRecipeId = topFavoriteAllTime[0].recipeId;
    const favoriteCount = topFavoriteAllTime[0]._count.recipeId;

    const recipe = await prisma.recipe.findUnique({
      where: { id: featuredRecipeId },
      select: {
        id: true,
        title: true,
        description: true,
        defenseSystems: true,
        imageUrl: true,
        prepTime: true,
        cookTime: true,
        mealType: true,
        user: { select: { name: true } },
        _count: { select: { favorites: true, ratings: true, comments: true } },
      },
    });

    if (!recipe) {
      return NextResponse.json({ recipe: null });
    }

    return NextResponse.json({ recipe: { ...recipe, favoriteCount } });
  } catch (error) {
    console.error('Featured recipe error:', error);
    return NextResponse.json({ recipe: null }, { status: 500 });
  }
}
