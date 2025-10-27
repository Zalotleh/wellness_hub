import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek, addDays } from 'date-fns';

// GET - List user's meal plans
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM format
    const status = searchParams.get('status'); // draft, active, archived
    const visibility = searchParams.get('visibility'); // private, public, friends
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const skip = (page - 1) * pageSize;

    const where: any = { userId: session.user.id };
    
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      if (!isNaN(year) && !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0);
        where.weekStart = { gte: startDate, lte: endDate };
      }
    }
    
    if (status && ['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }
    
    if (visibility && ['PRIVATE', 'PUBLIC', 'FRIENDS'].includes(visibility.toUpperCase())) {
      where.visibility = visibility.toUpperCase();
    }

    const [mealPlans, totalCount] = await Promise.all([
      prisma.mealPlan.findMany({
        where,
        include: {
          dailyMenus: {
            include: {
              meals: {
                include: {
                  generatedRecipe: {
                    select: {
                      id: true,
                      name: true,
                      prepTime: true,
                      cookTime: true,
                      defenseSystems: true,
                      ingredients: true,
                      instructions: true,
                    },
                  },
                },
                orderBy: { position: 'asc' },
              },
            },
            orderBy: { date: 'asc' },
          },
          shoppingLists: {
            select: {
              id: true,
              title: true,
              totalCost: true,
              createdAt: true,
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
        orderBy: { weekStart: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.mealPlan.count({ where }),
    ]);

    return NextResponse.json({
      data: mealPlans,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plans' },
      { status: 500 }
    );
  }
}

// POST - Create and save a meal plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const {
      title,
      description,
      weekStart,
      defaultServings = 2,
      visibility = 'PRIVATE',
      customInstructions,
      dietaryRestrictions = [],
      focusSystems = [],
      dailyMenus, // Array of {date, meals: [{mealType, mealName, defenseSystems, prepTime}]}
      tags = [],
    } = body;

    // Validate required fields
    if (!title || !weekStart || !dailyMenus || !Array.isArray(dailyMenus)) {
      return NextResponse.json(
        { error: 'Missing required fields: title, weekStart, dailyMenus (array)' },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      );
    }

    // Validate visibility
    if (!['PRIVATE', 'PUBLIC', 'FRIENDS'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility value. Must be PRIVATE, PUBLIC, or FRIENDS' },
        { status: 400 }
      );
    }

    // Validate daily menus structure
    if (dailyMenus.length === 0 || dailyMenus.length > 7) {
      return NextResponse.json(
        { error: 'Daily menus must contain 1-7 days' },
        { status: 400 }
      );
    }

    // Calculate week dates
    let weekStartDate;
    try {
      weekStartDate = new Date(weekStart);
      if (isNaN(weekStartDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (dateError) {
      return NextResponse.json(
        { error: 'Invalid weekStart date format' },
        { status: 400 }
      );
    }

    const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 }); // Monday as first day

    // Check for existing meal plan in the same week
    const existingPlan = await prisma.mealPlan.findFirst({
      where: {
        userId: session.user.id,
        weekStart: weekStartDate,
      },
    });

    if (existingPlan) {
      return NextResponse.json(
        { 
          error: 'A meal plan already exists for this week',
          conflictId: existingPlan.id,
        },
        { status: 409 }
      );
    }

    // Create meal plan with nested data in a transaction
    const mealPlan = await prisma.$transaction(async (tx: any) => {
      const createdPlan = await tx.mealPlan.create({
        data: {
          userId: session.user.id,
          title,
          description,
          weekStart: weekStartDate,
          weekEnd: weekEndDate,
          defaultServings: Math.min(Math.max(defaultServings, 1), 20), // Limit between 1-20
          visibility,
          customInstructions,
          dietaryRestrictions,
          focusSystems,
          tags,
          status: 'ACTIVE',
        },
      });

      // Create daily menus
      for (let dayIndex = 0; dayIndex < dailyMenus.length; dayIndex++) {
        const day = dailyMenus[dayIndex];
        const dayDate = addDays(weekStartDate, dayIndex);

        if (!day.meals || !Array.isArray(day.meals)) {
          throw new Error(`Day ${dayIndex + 1} must have a meals array`);
        }

        const dailyMenu = await tx.dailyMenu.create({
          data: {
            mealPlanId: createdPlan.id,
            date: dayDate,
            servings: day.servings || defaultServings,
            notes: day.notes,
          },
        });

        // Create meals for this day
        for (let mealIndex = 0; mealIndex < day.meals.length; mealIndex++) {
          const meal = day.meals[mealIndex];

          if (!meal.mealType || !meal.mealName) {
            throw new Error(`Meal ${mealIndex + 1} on day ${dayIndex + 1} must have mealType and mealName`);
          }

          await tx.meal.create({
            data: {
              dailyMenuId: dailyMenu.id,
              mealType: meal.mealType,
              mealName: meal.mealName,
              // Inherit meal plan's focus systems if meal doesn't have specific systems
              defenseSystems: meal.defenseSystems && meal.defenseSystems.length > 0 
                ? meal.defenseSystems 
                : focusSystems || [],
              prepTime: meal.prepTime ? String(meal.prepTime) : null,
              cookTime: meal.cookTime ? String(meal.cookTime) : null,
              calories: meal.calories,
              position: mealIndex,
              customInstructions: meal.customInstructions,
            },
          });
        }
      }

      return createdPlan;
    });

    // Fetch the complete meal plan with relations
    const completeMealPlan = await prisma.mealPlan.findUnique({
      where: { id: mealPlan.id },
      include: {
        dailyMenus: {
          include: {
            meals: {
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    return NextResponse.json({
      data: completeMealPlan,
      message: 'Meal plan saved successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating meal plan:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A meal plan with this configuration already exists' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Day') || error.message.includes('Meal')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create meal plan' },
      { status: 500 }
    );
  }
}

// PUT - Update meal plan
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const {
      id,
      title,
      description,
      visibility,
      tags,
      status,
      customInstructions,
      dietaryRestrictions,
      focusSystems,
    } = body;

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

    // Validate fields if provided
    if (title && title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      );
    }

    if (visibility && !['PRIVATE', 'PUBLIC', 'FRIENDS'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility value' },
        { status: 400 }
      );
    }

    if (status && !['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined) updateData.status = status;
    if (customInstructions !== undefined) updateData.customInstructions = customInstructions;
    if (dietaryRestrictions !== undefined) updateData.dietaryRestrictions = dietaryRestrictions;
    if (focusSystems !== undefined) updateData.focusSystems = focusSystems;

    // Set publishedAt if changing from private to public for first time
    if (visibility === 'PUBLIC' && existingPlan.visibility !== 'PUBLIC' && !existingPlan.publishedAt) {
      updateData.publishedAt = new Date();
    }

    // Update the meal plan
    const updatedPlan = await prisma.mealPlan.update({
      where: { id },
      data: updateData,
      include: {
        dailyMenus: {
          include: {
            meals: {
              include: {
                generatedRecipe: {
                  select: {
                    id: true,
                    name: true,
                    prepTime: true,
                    cookTime: true,
                    defenseSystems: true,
                    ingredients: true,
                    instructions: true,
                  },
                },
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

// DELETE - Delete meal plan(s) - supports both single and bulk deletion
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const idsParam = searchParams.get('ids'); // For bulk deletion
    const force = searchParams.get('force') === 'true';

    // Determine if single or bulk deletion
    let mealPlanIds: string[] = [];
    
    if (id) {
      // Single deletion
      mealPlanIds = [id];
    } else if (idsParam) {
      // Bulk deletion
      try {
        mealPlanIds = idsParam.split(',').filter(id => id.trim().length > 0);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid IDs format for bulk deletion' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Meal plan ID(s) required. Use ?id=single or ?ids=id1,id2,id3' },
        { status: 400 }
      );
    }

    if (mealPlanIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid meal plan IDs provided' },
        { status: 400 }
      );
    }

    // For bulk deletion, limit the number of plans that can be deleted at once
    if (mealPlanIds.length > 50) {
      return NextResponse.json(
        { error: 'Cannot delete more than 50 meal plans at once' },
        { status: 400 }
      );
    }

    // Verify ownership for all meal plans
    const existingPlans = await prisma.mealPlan.findMany({
      where: { 
        id: { in: mealPlanIds },
      },
      select: { 
        id: true,
        userId: true,
        title: true,
        _count: {
          select: {
            likedBy: true,
            savedBy: true,
            comments: true,
          },
        },
      },
    });

    // Check if all plans exist
    if (existingPlans.length !== mealPlanIds.length) {
      const foundIds = existingPlans.map(p => p.id);
      const missingIds = mealPlanIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { 
          error: 'Some meal plans not found',
          missingIds,
        },
        { status: 404 }
      );
    }

    // Check ownership for all plans
    const unauthorizedPlans = existingPlans.filter(plan => plan.userId !== session.user.id);
    if (unauthorizedPlans.length > 0) {
      return NextResponse.json(
        { 
          error: 'Unauthorized to delete some meal plans',
          unauthorizedIds: unauthorizedPlans.map(p => p.id),
        },
        { status: 403 }
      );
    }

    // Check for plans with interactions (likes, saves, comments)
    const plansWithInteractions = existingPlans.filter(plan => 
      plan._count.likedBy > 0 || plan._count.savedBy > 0 || plan._count.comments > 0
    );

    if (plansWithInteractions.length > 0 && !force) {
      return NextResponse.json(
        {
          error: 'Some meal plans have user interactions (likes, saves, comments)',
          warning: true,
          message: 'Add ?force=true to delete anyway',
          plansWithInteractions: plansWithInteractions.map(p => ({
            id: p.id,
            title: p.title,
            interactions: p._count,
          })),
        },
        { status: 409 }
      );
    }

    // Perform the deletion
    let deletedCount = 0;
    const deletedTitles: string[] = [];
    const errors: Array<{id: string, title: string, error: string}> = [];

    // Use transaction for bulk deletion
    await prisma.$transaction(async (tx) => {
      for (const plan of existingPlans) {
        try {
          await tx.mealPlan.delete({
            where: { id: plan.id },
          });
          deletedCount++;
          deletedTitles.push(plan.title);
        } catch (error) {
          console.error(`Error deleting meal plan ${plan.id}:`, error);
          errors.push({
            id: plan.id,
            title: plan.title,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    });

    // Prepare response
    const response: any = {
      message: `${deletedCount} meal plan(s) deleted successfully`,
      deletedCount,
      totalRequested: mealPlanIds.length,
    };

    if (deletedTitles.length > 0) {
      response.deletedPlans = deletedTitles;
    }

    if (errors.length > 0) {
      response.errors = errors;
      response.partialSuccess = true;
    }

    const statusCode = errors.length > 0 ? 207 : 200; // 207 Multi-Status for partial success

    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('Error deleting meal plan(s):', error);
    
    // Handle foreign key constraint errors
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        { error: 'Cannot delete meal plan(s) with existing dependencies' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete meal plan(s)' },
      { status: 500 }
    );
  }
}