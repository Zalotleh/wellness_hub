import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ratingSchema } from '@/lib/validations';

// POST /api/ratings - Create or update rating
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = ratingSchema.parse(body);

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: validatedData.recipeId },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Upsert rating (update if exists, create if not)
    const rating = await prisma.rating.upsert({
      where: {
        recipeId_userId: {
          recipeId: validatedData.recipeId,
          userId: session.user.id,
        },
      },
      update: {
        value: validatedData.value,
      },
      create: {
        recipeId: validatedData.recipeId,
        userId: session.user.id,
        value: validatedData.value,
      },
    });

    // Calculate new average rating
    const allRatings = await prisma.rating.findMany({
      where: { recipeId: validatedData.recipeId },
    });

    const averageRating =
      allRatings.reduce((sum, r) => sum + r.value, 0) / allRatings.length;

    return NextResponse.json({
      data: rating,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: allRatings.length,
      message: 'Rating submitted successfully',
    });
  } catch (error: any) {
    console.error('Error submitting rating:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid rating data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}

// DELETE /api/ratings - Delete rating
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get('recipeId');

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID required' },
        { status: 400 }
      );
    }

    // Delete rating
    await prisma.rating.delete({
      where: {
        recipeId_userId: {
          recipeId,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({
      message: 'Rating deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting rating:', error);
    return NextResponse.json(
      { error: 'Failed to delete rating' },
      { status: 500 }
    );
  }
}