import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get the meal plan to verify ownership
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    if (mealPlan.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all food consumptions for this meal plan
    const consumptions = await prisma.foodConsumption.findMany({
      where: {
        mealPlanId: id,
      },
      select: {
        date: true,
      },
      distinct: ['date'],
    });

    // Extract unique dates and format them as YYYY-MM-DD
    const loggedDates = consumptions.map((c: { date: Date }) => {
      const date = new Date(c.date);
      return date.toISOString().split('T')[0];
    });

    // Remove duplicates
    const uniqueDates = Array.from(new Set(loggedDates));

    return NextResponse.json({
      loggedDates: uniqueDates,
    });
  } catch (error) {
    console.error('Error fetching logged dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logged dates' },
      { status: 500 }
    );
  }
}
