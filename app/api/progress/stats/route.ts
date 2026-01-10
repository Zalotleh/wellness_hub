import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { DefenseSystem } from '@/types';
import { transformFoodConsumptionToProgress } from '@/lib/utils/food-consumption-transformer';

interface ProgressEntry {
  id: string;
  userId: string;
  date: Date;
  defenseSystem: DefenseSystem;
  foodsConsumed: string[];
  count: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SystemAverage {
  average: number;
  percentage: number;
  daysLogged: number;
}

type SystemAverages = {
  [key in DefenseSystem]: SystemAverage;
};

type SystemStats = {
  count: number;
  foods: string[];
  isComplete: boolean;
  percentage: number;
};

type DailySystemStats = {
  [key in DefenseSystem]: SystemStats;
};

// GET /api/progress/stats - Get progress statistics
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
    const dateParam = searchParams.get('date');
    const range = searchParams.get('range') || 'week'; // 'week' or 'month'

    // Calculate date range based on provided date or current date using UTC
    const baseDate = dateParam ? new Date(dateParam) : new Date();
    const baseDateUTC = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 12, 0, 0));
    
    // Calculate week start/end in UTC
    const dayOfWeek = baseDateUTC.getUTCDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    
    const startDate = new Date(Date.UTC(
      baseDateUTC.getUTCFullYear(),
      baseDateUTC.getUTCMonth(),
      baseDateUTC.getUTCDate() - daysToMonday,
      12, 0, 0
    ));
    
    const endDate = new Date(Date.UTC(
      baseDateUTC.getUTCFullYear(),
      baseDateUTC.getUTCMonth(),
      baseDateUTC.getUTCDate() + daysToSunday,
      12, 0, 0
    ));

    // Fetch all progress for the range from FoodConsumption table
    const foodConsumptions = await prisma.foodConsumption.findMany({
      where: {
        userId: session.user.id,
        date: {
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
      orderBy: { date: 'asc' },
    });

    // Transform to old Progress format for backward compatibility
    const progressEntries = transformFoodConsumptionToProgress(foodConsumptions) as ProgressEntry[];

    // Calculate daily progress for each day
    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    const dailyStats = daysInRange.map((day) => {
      const dayString = format(day, 'yyyy-MM-dd');
      const dayEntries = progressEntries.filter(
        (entry: ProgressEntry) => {
          const entryString = format(new Date(entry.date), 'yyyy-MM-dd');
          return entryString === dayString;
        }
      );

      const systems: DailySystemStats = {} as DailySystemStats;
      let totalFoods = 0;
      let systemsCompleted = 0;

      Object.values(DefenseSystem).forEach((system: DefenseSystem) => {
        const entry = dayEntries.find((e: ProgressEntry) => e.defenseSystem === system);
        const count = entry?.count || 0;
        const isComplete = count >= 5;

        systems[system] = {
          count,
          foods: entry?.foodsConsumed || [],
          isComplete,
          percentage: (count / 5) * 100,
        };

        totalFoods += count;
        if (isComplete) systemsCompleted++;
      });

      const totalCompletion = (totalFoods / 25) * 100; // 5 systems × 5 foods

      return {
        date: format(day, 'yyyy-MM-dd'),
        systems,
        totalFoods,
        systemsCompleted,
        totalCompletion: Math.round(totalCompletion),
      };
    });

    // Calculate system averages for the week
    const systemAverages: SystemAverages = {} as SystemAverages;
    Object.values(DefenseSystem).forEach((system: DefenseSystem) => {
      const systemEntries = progressEntries.filter(
        (entry: ProgressEntry) => entry.defenseSystem === system
      );
      const avgCount =
        systemEntries.length > 0
          ? systemEntries.reduce((sum: number, entry: ProgressEntry) => sum + entry.count, 0) / daysInRange.length
          : 0;
      
      systemAverages[system] = {
        average: Math.round(avgCount * 10) / 10,
        percentage: Math.round((avgCount / 5) * 100),
        daysLogged: systemEntries.length,
      };
    });

    // Calculate overall weekly stats
    const totalFoodsLogged = progressEntries.reduce(
      (sum: number, entry: ProgressEntry) => sum + entry.count,
      0
    );
    const maxPossibleFoods = daysInRange.length * 5 * 5; // days × systems × foods
    const overallCompletion = Math.round((totalFoodsLogged / maxPossibleFoods) * 100);

    // Find best and worst performing systems
    const systemPerformance = Object.entries(systemAverages)
      .map(([system, data]: [string, SystemAverage]) => ({
        system,
        percentage: data.percentage,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const bestSystem = systemPerformance[0];
    const worstSystem = systemPerformance[systemPerformance.length - 1];

    return NextResponse.json({
      data: {
        dailyStats,
        systemAverages,
        weeklyStats: {
          totalFoodsLogged,
          overallCompletion,
          daysActive: progressEntries.length > 0 ? [...new Set(progressEntries.map((e: ProgressEntry) => e.date.getTime()))].length : 0,
          bestSystem: bestSystem.system,
          worstSystem: worstSystem.system,
        },
        dateRange: {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd'),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching progress stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress statistics' },
      { status: 500 }
    );
  }
}