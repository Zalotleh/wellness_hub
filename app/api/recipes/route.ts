import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recipeSchema } from '@/lib/validations';
import { DefenseSystem } from '@/types';

// GET /api/recipes - Get all recipes with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const system = searchParams.get('system') as DefenseSystem | null;
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');
    const sortBy = searchParams.get('sortBy') || 'recent';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '12');

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};

    if (system && Object.values(DefenseSystem).includes(system)) {
      where.defenseSystems = {
        has: system,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (userId) {
      where.userId = userId;
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' };
    
    if (sortBy === 'popular') {
      orderBy = { favorites: { _count: 'desc' } };
    }

    // Get session for favorite check
    const session = await getServerSession(authOptions);

    // Fetch recipes
    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
          ratings: true,
          _count: {
            select: { comments: true, favorites: true },
          },
          ...(session?.user?.id && {
            favorites: {
              where: { userId: session.user.id },
              select: { id: true },
            },
          }),
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.recipe.count({ where }),
    ]);

    // Calculate average ratings and add to response
    const recipesWithRatings = recipes.map((recipe: any) => {
      const averageRating =
        recipe.ratings.length > 0
          ? recipe.ratings.reduce((sum: number, r: any) => sum + r.value, 0) / recipe.ratings.length
          : 0;

      const isFavorited = session?.user?.id ? recipe.favorites?.length > 0 : false;

      // Remove the full ratings array and favorites from response
      const { ratings, favorites, ...recipeData } = recipe;

      return {
        ...recipeData,
        averageRating: Math.round(averageRating * 10) / 10,
        isFavorited,
      };
    });

    return NextResponse.json({
      data: recipesWithRatings,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}

// POST /api/recipes - Create a new recipe
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Clean up empty strings for optional fields
    const cleanedBody = {
      ...body,
      imageUrl: body.imageUrl === '' ? undefined : body.imageUrl,
    };

    // Validate request body
    const validatedData = recipeSchema.parse(cleanedBody);

    // Create recipe
    const recipe = await prisma.recipe.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        _count: {
          select: { comments: true, favorites: true },
        },
      },
    });

    return NextResponse.json(
      {
        data: recipe,
        message: 'Recipe created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating recipe:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid recipe data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create recipe' },
      { status: 500 }
    );
  }
}