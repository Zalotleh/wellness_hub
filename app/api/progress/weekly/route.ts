import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserLocalDateNoonUTC } from '@/lib/utils/timezone';
import { eachDayOfInterval, format } from 'date-fns';

/**
 * GET /api/progress/weekly
 * 
 * Get progress data for a week range
 * Returns daily summaries for each day in the range
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
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'startDate and endDate parameters are required' },
        { status: 400 }
      );
    }

    // Get user's timezone (default to UTC if not set)
    const userTimezone = user.timezone || 'UTC';

    // Parse dates with timezone awareness
    const startDate = getUserLocalDateNoonUTC(userTimezone, new Date(startDateParam));
    const endDate = getUserLocalDateNoonUTC(userTimezone, new Date(endDateParam));

    // Get all days in the range
    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });

    // Fetch all daily progress scores for the range
    const dailyScores = await prisma.dailyProgressScore.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Fetch all food consumptions for the range to get meal counts
    const consumptions = await prisma.foodConsumption.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        mealTime: true,
        id: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Build daily summaries
    const days = daysInRange.map(day => {
      // Normalize day to midnight UTC for consistent comparison
      const dayNormalized = new Date(day);
      dayNormalized.setUTCHours(12, 0, 0, 0); // Use noon to avoid timezone issues
      const dayString = format(dayNormalized, 'yyyy-MM-dd');

      // Find score for this day by comparing date strings
      const dayScore = dailyScores.find(score => {
        const scoreString = format(new Date(score.date), 'yyyy-MM-dd');
        return scoreString === dayString;
      });

      // Count meals for this day
      const dayConsumptions = consumptions.filter(c => {
        const consumptionString = format(new Date(c.date), 'yyyy-MM-dd');
        return consumptionString === dayString;
      });

      // Count unique meal times
      const uniqueMealTimes = new Set(dayConsumptions.map(c => c.mealTime));
      const mealsLogged = uniqueMealTimes.size;

      // Count systems covered (from gaps field)
      let systemsCovered = 0;
      if (dayScore) {
        const gaps = dayScore.gaps as any;
        const missingSystems = gaps?.missingSystems || [];
        systemsCovered = 5 - missingSystems.length;
      }

      return {
        date: dayNormalized.toISOString(),
        score: dayScore?.overallScore || 0,
        mealsLogged,
        systemsCovered,
        hasData: !!dayScore || dayConsumptions.length > 0,
        details: {
          totalFoods: dayScore?.uniqueFoodsCount || 0,
          systemBreakdown: {
            angiogenesis: dayScore?.angiogenesisCount || 0,
            regeneration: dayScore?.regenerationCount || 0,
            microbiome: dayScore?.microbiomeCount || 0,
            dnaProtection: dayScore?.dnaProtectionCount || 0,
            immunity: dayScore?.immunityCount || 0,
          },
        },
      };
    });

    // Calculate week summary stats
    const daysWithData = days.filter(d => d.hasData);
    const totalScore = daysWithData.reduce((sum, d) => sum + d.score, 0);
    const averageScore = daysWithData.length > 0 ? totalScore / daysWithData.length : 0;
    const totalMeals = daysWithData.reduce((sum, d) => sum + d.mealsLogged, 0);

    const summary = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      averageScore: Math.round(averageScore),
      totalMeals,
      daysWithData: daysWithData.length,
      totalDays: days.length,
      completionRate: Math.round((daysWithData.length / days.length) * 100),
    };

    const response = NextResponse.json({
      success: true,
      summary,
      days,
    });

    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('Error fetching weekly progress:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch weekly progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
