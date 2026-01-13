import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserDayRangeUTC } from '@/lib/utils/timezone';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    });

    const userTimezone = user?.timezone || 'UTC';
    const today = new Date();
    const { start, end } = getUserDayRangeUTC(userTimezone, today);

    // Get all food consumptions for today
    const foodConsumptions = await prisma.foodConsumption.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: start,
          lt: end,
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

    // Group by meal time
    const mealTimeGroups: Record<string, any[]> = {};
    foodConsumptions.forEach((consumption) => {
      const mealTime = consumption.mealTime;
      if (!mealTimeGroups[mealTime]) {
        mealTimeGroups[mealTime] = [];
      }
      mealTimeGroups[mealTime].push(consumption);
    });

    return NextResponse.json({
      userId: session.user.id,
      timezone: userTimezone,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      totalConsumptions: foodConsumptions.length,
      mealTimes: Object.keys(mealTimeGroups),
      uniqueMealTimes: [...new Set(foodConsumptions.map(c => c.mealTime))],
      mealTimeGroups: Object.entries(mealTimeGroups).map(([mealTime, consumptions]) => ({
        mealTime,
        count: consumptions.length,
        totalFoodItems: consumptions.reduce((sum, c) => sum + c.foodItems.length, 0),
      })),
      rawData: foodConsumptions.map(c => ({
        id: c.id,
        mealTime: c.mealTime,
        date: c.date,
        foodItemsCount: c.foodItems.length,
      })),
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
