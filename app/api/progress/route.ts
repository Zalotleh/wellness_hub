import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { progressSchema } from '@/lib/validations';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

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

    if (range === 'today') {
      startDate = startOfDay(new Date());
      endDate = endOfDay(new Date());
    } else if (range === 'week') {
      startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
      endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
    } else if (startDateParam && endDateParam) {
      startDate = startOfDay(new Date(startDateParam));
      endDate = endOfDay(new Date(endDateParam));
    } else {
      // Default to today
      startDate = startOfDay(new Date());
      endDate = endOfDay(new Date());
    }

    const progress = await prisma.progress.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [
        { date: 'desc' },
        { defenseSystem: 'asc' },
      ],
    });

    return NextResponse.json({ data: progress });
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

    // Set date to start of day to avoid duplicates
    const progressDate = validatedData.date
      ? startOfDay(new Date(validatedData.date))
      : startOfDay(new Date());

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