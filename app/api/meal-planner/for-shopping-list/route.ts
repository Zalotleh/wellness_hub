import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get meal plans optimized for shopping list creation modal
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'weekStart'; // weekStart, title, createdAt
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc

    // Build search filter
    const searchFilter = search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    // Build sort order
    let orderBy: any = { weekStart: 'desc' };
    if (sortBy === 'title') {
      orderBy = { title: sortOrder };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    } else if (sortBy === 'weekStart') {
      orderBy = { weekStart: sortOrder };
    }

    // Fetch meal plans with minimal data needed for selection modal
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE', // Only show active meal plans
        ...searchFilter,
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        weekStart: true,
        weekEnd: true,
        defaultServings: true,
        dailyMenus: {
          select: {
            meals: {
              select: {
                id: true,
              }
            }
          }
        }
      },
      orderBy,
      take: limit,
    });

    // Transform data to include mealCount
    const transformedMealPlans = mealPlans.map(plan => {
      const mealCount = plan.dailyMenus.reduce((total, dailyMenu) => total + dailyMenu.meals.length, 0);
      
      return {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        createdAt: plan.createdAt.toISOString(),
        weekStart: plan.weekStart?.toISOString(),
        weekEnd: plan.weekEnd?.toISOString(),
        defaultServings: plan.defaultServings,
        mealCount,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedMealPlans,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('Error fetching meal plans for shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plans' },
      { status: 500 }
    );
  }
}