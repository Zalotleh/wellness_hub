import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Toggle favorite (add or remove)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to favorite recipes.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recipeId } = body;

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        recipeId_userId: {
          recipeId,
          userId: session.user.id,
        },
      },
    });

    let isFavorited = false;
    let message = '';

    if (existingFavorite) {
      // Remove favorite
      await prisma.favorite.delete({
        where: {
          id: existingFavorite.id,
        },
      });
      isFavorited = false;
      message = 'Recipe removed from favorites';
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: {
          recipeId,
          userId: session.user.id,
        },
      });
      isFavorited = true;
      message = 'Recipe added to favorites';
    }

    // Get updated favorite count
    const favoriteCount = await prisma.favorite.count({
      where: { recipeId },
    });

    return NextResponse.json({
      success: true,
      isFavorited,
      favoriteCount,
      message,
    });

  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { error: 'Failed to update favorite status' },
      { status: 500 }
    );
  }
}

// GET - Get user's favorites
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        recipe: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
            _count: {
              select: {
                ratings: true,
                comments: true,
                favorites: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const recipes = favorites.map(fav => ({
      ...fav.recipe,
      isFavorited: true,
    }));

    return NextResponse.json({
      success: true,
      recipes,
      count: recipes.length,
    });

  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}
