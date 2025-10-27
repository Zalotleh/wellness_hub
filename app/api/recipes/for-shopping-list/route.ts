import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get recipes optimized for shopping list creation modal
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt, title, prepTime
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc

    // Build search filter
    const searchFilter = search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    // Build sort order
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'title') {
      orderBy = { title: sortOrder };
    } else if (sortBy === 'prepTime') {
      orderBy = { prepTime: sortOrder };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    }

    // Fetch recipes with minimal data needed for selection modal
    const recipes = await prisma.recipe.findMany({
      where: {
        userId: session.user.id,
        ...searchFilter,
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        prepTime: true,
        cookTime: true,
        servings: true,
        ingredients: true, // Needed to calculate ingredient count
      },
      orderBy,
      take: limit,
    });

    // Transform data to include calculated fields
    const transformedRecipes = recipes.map(recipe => {
      // Calculate ingredient count
      let ingredientCount = 0;
      if (recipe.ingredients) {
        try {
          const ingredients = Array.isArray(recipe.ingredients) 
            ? recipe.ingredients 
            : JSON.parse(recipe.ingredients as string);
          ingredientCount = ingredients.length;
        } catch (error) {
          console.error('Error parsing ingredients:', error);
        }
      }

      // Simple difficulty calculation based on prep time and ingredient count
      let difficulty = 'Easy';
      const prepTimeMinutes = recipe.prepTime ? parseInt(recipe.prepTime) || 0 : 0;
      if (prepTimeMinutes > 30 || ingredientCount > 10) {
        difficulty = 'Medium';
      }
      if (prepTimeMinutes > 60 || ingredientCount > 15) {
        difficulty = 'Hard';
      }

      // Simple cuisine detection (could be enhanced with more sophisticated logic)
      const cuisine = 'Various'; // This could be improved by analyzing ingredients or having it as a recipe field

      return {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        createdAt: recipe.createdAt.toISOString(),
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty,
        cuisine,
        ingredientCount,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedRecipes,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('Error fetching recipes for shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}