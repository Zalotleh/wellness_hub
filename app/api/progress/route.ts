import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { progressSchema } from '@/lib/validations';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { recalculateScoreAfterFoodLog } from '@/lib/tracking/score-calculator';

// GET /api/progress - Get progress entries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const range = searchParams.get('range'); // 'today', 'week', 'month'

    let startDate: Date;
    let endDate: Date;

    // Helper function to parse dates consistently using UTC
    const parseAndNormalizeDate = (dateString?: string | null) => {
      if (!dateString) {
        const now = new Date();
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));
      }
      const date = new Date(dateString);
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0));
    };

    if (startDateParam && endDateParam) {
      // If specific dates are provided, use those (already normalized to noon UTC)
      startDate = parseAndNormalizeDate(startDateParam);
      endDate = parseAndNormalizeDate(endDateParam);
    } else if (range === 'week') {
      // For week range, we need to calculate start and end dates
      const today = parseAndNormalizeDate();
      // Calculate week start/end in UTC
      const dayOfWeek = today.getUTCDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      startDate = new Date(Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() - daysToMonday,
        12, 0, 0
      ));
      endDate = new Date(Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() + daysToSunday,
        12, 0, 0
      ));
    } else {
      // Default to today (already normalized to noon UTC)
      const today = parseAndNormalizeDate();
      startDate = today;
      endDate = today;
    }

    const progress = await prisma.foodConsumption.findMany({
      where: {
        userId: session.user.id,
        date: startDate.getTime() === endDate.getTime() 
          ? startDate  // Single date query
          : {          // Date range query
              gte: startDate,
              lte: endDate,
            },
      },
      include: {
        foodItems: {
          include: {
            defenseSystems: true,
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { mealTime: 'asc' },
      ],
    });

    // Transform FoodConsumption data to match old Progress format for backward compatibility
    const transformedProgress = progress.flatMap(consumption => {
      // Group food items by defense system
      const systemGroups = new Map<string, string[]>();
      
      consumption.foodItems.forEach(foodItem => {
        foodItem.defenseSystems.forEach(sysBenefit => {
          const system = sysBenefit.defenseSystem;
          if (!systemGroups.has(system)) {
            systemGroups.set(system, []);
          }
          systemGroups.get(system)!.push(foodItem.name);
        });
      });
      
      // Create a progress entry for each defense system
      return Array.from(systemGroups.entries()).map(([system, foods]) => ({
        id: `${consumption.id}-${system}`,
        userId: consumption.userId,
        date: consumption.date,
        defenseSystem: system,
        foodsConsumed: foods,
        count: foods.length,
        notes: consumption.notes,
        createdAt: consumption.createdAt,
        updatedAt: consumption.updatedAt,
      }));
    });

    return NextResponse.json({ data: transformedProgress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

// POST /api/progress - Log food consumption
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
    const validatedData = progressSchema.parse(body);

    // Parse the date and normalize it
    // Convert the input date to the user's local timezone and strip time
    const normalizeDate = (dateInput?: string | Date | null) => {
      const date = dateInput ? new Date(dateInput) : new Date();
      // Create a new date using local components to avoid timezone offset
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        12  // Set to noon to avoid any timezone issues
      );
    };

    const progressDate = normalizeDate(validatedData.date);

    // Upsert progress entry (update if exists, create if not)
    const progress = await prisma.progress.upsert({
      where: {
        userId_date_defenseSystem: {
          userId: session.user.id,
          date: progressDate,
          defenseSystem: validatedData.defenseSystem,
        },
      },
      update: {
        foodsConsumed: validatedData.foods,
        count: validatedData.foods.length,
        notes: validatedData.notes,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        date: progressDate,
        defenseSystem: validatedData.defenseSystem,
        foodsConsumed: validatedData.foods,
        count: validatedData.foods.length,
        notes: validatedData.notes,
      },
    });

    // Recalculate 5x5x5 score for this date in the background
    // This updates the cached score automatically
    recalculateScoreAfterFoodLog(session.user.id, progressDate).catch((error) => {
      console.error('Failed to recalculate score:', error);
      // Don't fail the request if score calculation fails
    });

    return NextResponse.json({
      data: progress,
      message: 'Progress logged successfully',
    });
  } catch (error: any) {
    console.error('Error logging progress:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid progress data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to log progress' },
      { status: 500 }
    );
  }
}

// DELETE /api/progress - Delete progress entry
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Progress ID required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const progress = await prisma.progress.findUnique({
      where: { id },
    });

    if (!progress) {
      return NextResponse.json(
        { error: 'Progress entry not found' },
        { status: 404 }
      );
    }

    if (progress.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await prisma.progress.delete({
      where: { id },
    });

    // Recalculate score for the date of the deleted entry
    recalculateScoreAfterFoodLog(session.user.id, progress.date).catch((error) => {
      console.error('Failed to recalculate score after deletion:', error);
    });

    return NextResponse.json({
      message: 'Progress entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting progress:', error);
    return NextResponse.json(
      { error: 'Failed to delete progress' },
      { status: 500 }
    );
  }
}