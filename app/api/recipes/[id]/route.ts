import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recipeSchema } from '@/lib/validations';

// GET /api/recipes/[id] - Get single recipe
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const session = await getServerSession(authOptions);

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, image: true, bio: true },
        },
        ratings: true,
        comments: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
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
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    type Rating = { value: number; userId: string };
    
    // Calculate average rating
    const averageRating =
      recipe.ratings.length > 0
        ? recipe.ratings.reduce((sum: number, rating: Rating) => sum + (rating.value || 0), 0) / recipe.ratings.length
        : 0;

    // Check if current user has rated
    const userRating = session?.user?.id
      ? recipe.ratings.find((rating: Rating) => rating.userId === session.user.id)?.value
      : undefined;

    const isFavorited = session?.user?.id ? (recipe as any).favorites?.length > 0 : false;

    // Remove ratings array from response
    const { ratings, favorites, ...recipeData } = recipe as any;

    return NextResponse.json({
      ...recipeData,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: ratings.length,
      userRating,
      isFavorited,
    });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipe' },
      { status: 500 }
    );
  }
}

// PUT /api/recipes/[id] - Update recipe
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if recipe exists and user owns it
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existingRecipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    if (existingRecipe.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden. You can only edit your own recipes.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Clean up the data before validation
    const dataToValidate = {
      ...body,
      imageUrl: body.imageUrl?.trim() || undefined,  // Only include if it's not empty
    };

    const validatedData = recipeSchema.parse(dataToValidate);

    // Update recipe
    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: validatedData,
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({
      data: updatedRecipe,
      message: 'Recipe updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating recipe:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid recipe data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update recipe' },
      { status: 500 }
    );
  }
}

// DELETE /api/recipes/[id] - Delete recipe
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if recipe exists and user owns it
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existingRecipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    if (existingRecipe.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden. You can only delete your own recipes.' },
        { status: 403 }
      );
    }

    // Delete recipe (cascade will handle related records)
    await prisma.recipe.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Recipe deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      { error: 'Failed to delete recipe' },
      { status: 500 }
    );
  }
}