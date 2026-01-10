import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { foodConsumptionSchema } from '@/lib/validations';
import { matchIngredientToFood } from '@/lib/utils/food-matcher';
import { ConsumptionSource, DefenseSystem } from '@prisma/client';

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

    // Normalize date to UTC noon to prevent timezone shifting
    let consumptionDate: Date;
    if (validatedData.date) {
      const rawDate = new Date(validatedData.date);
      const year = rawDate.getUTCFullYear();
      const month = rawDate.getUTCMonth();
      const day = rawDate.getUTCDate();
      consumptionDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
    } else {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      const day = now.getUTCDate();
      consumptionDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
    }

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

    // Build where clause
    const where: any = {
      userId: user.id,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
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

    return NextResponse.json({
      consumptions,
      count: consumptions.length,
    });
  } catch (error: any) {
    console.error('Error fetching consumption history:', error);

    return NextResponse.json(
      { error: 'Failed to fetch consumption history' },
      { status: 500 }
    );
  }
}
