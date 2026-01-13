import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { foodConsumptionSchema } from '@/lib/validations';
import { matchIngredientToFood } from '@/lib/utils/food-matcher';
import { ConsumptionSource, DefenseSystem } from '@prisma/client';
import { invalidateScoreCache } from '@/lib/tracking/score-cache';
import { getUserLocalDateNoonUTC, getUserDayRangeUTC } from '@/lib/utils/timezone';

/**
 * POST /api/progress/consumption
 * 
 * Log a food consumption entry with meal timing
 * Automatically matches foods to database and extracts defense system benefits
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = foodConsumptionSchema.parse(body);

    // Get user's timezone (default to UTC if not set)
    const userTimezone = user.timezone || 'UTC';

    // Use timezone-aware date handling
    // Converts user's local date to noon UTC to prevent timezone shifting
    const consumptionDate = validatedData.date
      ? getUserLocalDateNoonUTC(userTimezone, new Date(validatedData.date))
      : getUserLocalDateNoonUTC(userTimezone);

    // Load food database once for all matching
    const foodDatabase = await prisma.foodDatabase.findMany();

    // Create the food consumption entry with all food items and benefits
    const consumption = await prisma.foodConsumption.create({
      data: {
        userId: user.id,
        mealTime: validatedData.mealTime,
        sourceType: ConsumptionSource.MANUAL,
        date: consumptionDate,
        notes: validatedData.notes,
        foodItems: {
          create: await Promise.all(
            validatedData.foodItems.map(async (item) => {
              // Match food to database
              const match = await matchIngredientToFood(item.name, foodDatabase);

              // Create food item with defense system benefits
              return {
                name: item.name,
                quantity: item.servings,
                unit: item.portion || 'serving',
                defenseSystems: {
                  create: match.defenseSystems.length > 0
                    ? match.defenseSystems.map(benefit => ({
                        defenseSystem: benefit.system,
                        strength: benefit.strength,
                      }))
                    : // If no match, use custom systems if provided
                      (item.customDefenseSystems || []).map(system => ({
                        defenseSystem: system,
                        strength: 'MEDIUM' as const,
                      })),
                },
              };
            })
          ),
        },
      },
      include: {
        foodItems: {
          include: {
            defenseSystems: true,
          },
        },
      },
    });

    // Invalidate the score cache for this date to ensure fresh calculations
    await invalidateScoreCache(user.id, consumptionDate);

    // Clean up stale or invalid recommendations
    // Dismiss recommendations for systems that are now complete
    const dayRange = getUserDayRangeUTC(userTimezone, consumptionDate);
    const todayProgress = await prisma.foodConsumption.findMany({
      where: {
        userId: user.id,
        date: {
          gte: dayRange.startOfDay,
          lte: dayRange.endOfDay,
        },
      },
      include: {
        foodItems: {
          include: {
            defenseSystems: true,
          },
        },
      },
    });

    // Count foods per system for today
    const systemCounts: Record<string, Set<string>> = {};
    todayProgress.forEach(consumption => {
      consumption.foodItems.forEach(item => {
        item.defenseSystems.forEach(ds => {
          if (!systemCounts[ds.defenseSystem]) {
            systemCounts[ds.defenseSystem] = new Set();
          }
          systemCounts[ds.defenseSystem].add(item.name.toLowerCase());
        });
      });
    });

    // Dismiss recommendations for systems that now have 5+ foods
    const completedSystems = Object.entries(systemCounts)
      .filter(([_, foods]) => foods.size >= 5)
      .map(([system]) => system);

    if (completedSystems.length > 0) {
      await prisma.recommendation.updateMany({
        where: {
          userId: user.id,
          status: 'PENDING',
          targetSystem: { in: completedSystems },
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json(
      {
        message: 'Food consumption logged successfully',
        consumption,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error logging food consumption:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to log food consumption' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/progress/consumption
 * 
 * Get food consumption history with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const mealTime = searchParams.get('mealTime');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get user's timezone (default to UTC if not set)
    const userTimezone = user.timezone || 'UTC';

    // Build where clause
    const where: any = {
      userId: user.id,
    };

    // Use timezone-aware date ranges
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const startDateObj = getUserLocalDateNoonUTC(userTimezone, new Date(startDate));
        where.date.gte = startDateObj;
      }
      if (endDate) {
        const endDateObj = getUserLocalDateNoonUTC(userTimezone, new Date(endDate));
        where.date.lte = endDateObj;
      }
    }

    if (mealTime) {
      where.mealTime = mealTime;
    }

    const consumptions = await prisma.foodConsumption.findMany({
      where,
      include: {
        foodItems: {
          include: {
            defenseSystems: true,
          },
        },
        recipe: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
        meal: {
          select: {
            id: true,
            mealType: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    const response = NextResponse.json({
      consumptions,
      count: consumptions.length,
    });

    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error: any) {
    console.error('Error fetching consumption history:', error);

    return NextResponse.json(
      { error: 'Failed to fetch consumption history' },
      { status: 500 }
    );
  }
}
