import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserFeatureAccess } from '@/lib/features/feature-flags';

// GET - Get specific meal plan by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Meal plan ID is required' },
        { status: 400 }
      );
    }

    // First, check if meal plan exists and get basic info
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        visibility: true,
        status: true,
        user: {
          select: {
            name: true,
            image: true,
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

    // Check if user can access this meal plan
    const canAccess = 
      mealPlan.visibility === 'PUBLIC' ||
      (session?.user?.id && mealPlan.userId === session.user.id) ||
      (session?.user?.id && mealPlan.visibility === 'FRIENDS'); // TODO: Add friends check

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Not authorized to access this meal plan' },
        { status: 403 }
      );
    }

    // Get full meal plan with all details
    const fullMealPlan = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        dailyMenus: {
          include: {
            meals: {
              include: {
                generatedRecipe: true,
              },
            },
          },
          orderBy: { date: 'asc' },
        },
        shoppingLists: {
          select: {
            id: true,
            title: true,
            totalCost: true,
            items: true,
          },
        },
        _count: {
          select: {
            likedBy: true,
            savedBy: true,
            comments: true,
          },
        },
      },
    });

    // Add user interaction data if logged in
    let userInteractions = null;
    if (session?.user?.id) {
      const [liked, saved] = await Promise.all([
        prisma.mealPlanLike.findFirst({
          where: {
            mealPlanId: id,
            userId: session.user.id,
          },
        }),
        prisma.savedMealPlan.findFirst({
          where: {
            mealPlanId: id,
            userId: session.user.id,
          },
        }),
      ]);

      userInteractions = {
        liked: !!liked,
        saved: !!saved,
      };
    }

    return NextResponse.json({
      data: {
        ...fullMealPlan,
        userInteractions,
      },
    });

  } catch (error) {
    console.error('Error fetching meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plan' },
      { status: 500 }
    );
  }
}

// PUT - Update specific meal plan by ID (alternative to main route)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Meal plan ID is required' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingPlan = await prisma.mealPlan.findUnique({
      where: { id },
      select: { 
        userId: true,
        visibility: true,
        publishedAt: true,
      },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    if (existingPlan.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this meal plan' },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      visibility,
      tags,
      status,
      customInstructions,
      dietaryRestrictions,
      focusSystems,
      defaultServings,
    } = body;

    // Validate fields if provided
    if (title && (typeof title !== 'string' || title.length > 200)) {
      return NextResponse.json(
        { error: 'Title must be a string with 200 characters or less' },
        { status: 400 }
      );
    }

    if (visibility && !['PRIVATE', 'PUBLIC', 'FRIENDS'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility value. Must be PRIVATE, PUBLIC, or FRIENDS' },
        { status: 400 }
      );
    }

    if (status && !['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value. Must be DRAFT, ACTIVE, or ARCHIVED' },
        { status: 400 }
      );
    }

    if (defaultServings && (typeof defaultServings !== 'number' || defaultServings < 1 || defaultServings > 20)) {
      return NextResponse.json(
        { error: 'Default servings must be a number between 1 and 20' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (status !== undefined) updateData.status = status;
    if (customInstructions !== undefined) updateData.customInstructions = customInstructions;
    if (dietaryRestrictions !== undefined) updateData.dietaryRestrictions = Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [];
    if (focusSystems !== undefined) updateData.focusSystems = Array.isArray(focusSystems) ? focusSystems : [];
    if (defaultServings !== undefined) updateData.defaultServings = defaultServings;

    // Set publishedAt if changing from private to public for first time
    if (visibility === 'PUBLIC' && existingPlan.visibility !== 'PUBLIC' && !existingPlan.publishedAt) {
      updateData.publishedAt = new Date();
    }

    // Update the meal plan
    const updatedPlan = await prisma.mealPlan.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        dailyMenus: {
          include: {
            meals: {
              include: {
                generatedRecipe: true,
              },
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { date: 'asc' },
        },
        _count: {
          select: {
            likedBy: true,
            savedBy: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: updatedPlan,
      message: 'Meal plan updated successfully',
    });

  } catch (error) {
    console.error('Error updating meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to update meal plan' },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific meal plan by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Meal plan ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingPlan = await prisma.mealPlan.findUnique({
      where: { id },
      select: { 
        userId: true,
        title: true,
        status: true,
      },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    if (existingPlan.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this meal plan' },
        { status: 403 }
      );
    }

    // Optional: Prevent deletion of published meal plans with interactions
    const interactions = await prisma.mealPlan.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            likedBy: true,
            savedBy: true,
            comments: true,
          },
        },
      },
    });

    const hasInteractions = interactions?._count && (
      interactions._count.likedBy > 0 ||
      interactions._count.savedBy > 0 ||
      interactions._count.comments > 0
    );

    // Warn about deletion of plans with interactions
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (hasInteractions && !force) {
      return NextResponse.json(
        {
          error: 'This meal plan has user interactions (likes, saves, comments)',
          warning: true,
          message: 'Add ?force=true to delete anyway',
          interactions: interactions?._count,
        },
        { status: 409 }
      );
    }

    // Delete the meal plan (cascade will handle related data)
    await prisma.mealPlan.delete({
      where: { id },
    });

    return NextResponse.json({
      message: `Meal plan "${existingPlan.title}" deleted successfully`,
    });

  } catch (error) {
    console.error('Error deleting meal plan:', error);
    
    // Handle foreign key constraint errors
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        { error: 'Cannot delete meal plan with existing dependencies. Try archiving instead.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete meal plan' },
      { status: 500 }
    );
  }
}