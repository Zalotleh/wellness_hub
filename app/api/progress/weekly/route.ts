import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserLocalDateNoonUTC } from '@/lib/utils/timezone';
import { getCachedOrCalculateScore } from '@/lib/tracking/score-cache';
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

    // Build daily summaries — compute missing scores for days that have
    // food logged but no cached dailyProgressScore (lazy cache miss)
    const days = await Promise.all(daysInRange.map(async day => {
      // Normalize day to noon UTC for consistent comparison
      const dayNormalized = new Date(day);
      dayNormalized.setUTCHours(12, 0, 0, 0);
      const dayString = format(dayNormalized, 'yyyy-MM-dd');

      // Find cached score for this day
      const dayScore = dailyScores.find(score => {
        const scoreString = format(new Date(score.date), 'yyyy-MM-dd');
        return scoreString === dayString;
      });

      // Count consumptions for this day
      const dayConsumptions = consumptions.filter(c => {
        const consumptionString = format(new Date(c.date), 'yyyy-MM-dd');
        return consumptionString === dayString;
      });

      // Count unique meal times
      const uniqueMealTimes = new Set(dayConsumptions.map(c => c.mealTime));
      const mealsLogged = uniqueMealTimes.size;

      // If food was logged but no score is cached, calculate it now and cache it
      // This fixes the case where a user logged food but never opened the daily view
      type GapsShape = { missingSystems?: string[]; missedSystems?: string[] };
      type ResolvedScore = {
        overallScore: number;
        uniqueFoodsCount: number;
        angiogenesisCount: number;
        regenerationCount: number;
        microbiomeCount: number;
        dnaProtectionCount: number;
        immunityCount: number;
        gaps: GapsShape;
      };
      let resolvedScore: ResolvedScore | null = dayScore
        ? {
            overallScore: dayScore.overallScore,
            uniqueFoodsCount: dayScore.uniqueFoodsCount,
            angiogenesisCount: dayScore.angiogenesisCount,
            regenerationCount: dayScore.regenerationCount,
            microbiomeCount: dayScore.microbiomeCount,
            dnaProtectionCount: dayScore.dnaProtectionCount,
            immunityCount: dayScore.immunityCount,
            gaps: dayScore.gaps as GapsShape,
          }
        : null;

      if (!resolvedScore && dayConsumptions.length > 0) {
        try {
          const computed = await getCachedOrCalculateScore(user.id, dayNormalized);
          const sysCounts: Record<string, number> = {};
          computed.defenseSystems.forEach(s => { sysCounts[s.system] = s.foodsConsumed; });
          resolvedScore = {
            overallScore: computed.overallScore,
            uniqueFoodsCount: computed.foodVariety.totalUniqueFoods,
            angiogenesisCount: sysCounts['ANGIOGENESIS'] || 0,
            regenerationCount: sysCounts['REGENERATION'] || 0,
            microbiomeCount: sysCounts['MICROBIOME'] || 0,
            dnaProtectionCount: sysCounts['DNA_PROTECTION'] || 0,
            immunityCount: sysCounts['IMMUNITY'] || 0,
            gaps: {
              missingSystems: computed.defenseSystems
                .filter(s => s.foodsConsumed === 0)
                .map(s => s.system),
            },
          };
        } catch (err) {
          console.error(`Failed to compute score for ${dayString}:`, err);
        }
      }

      // Count systems covered
      let systemsCovered = 0;
      if (resolvedScore) {
        const missingSystems = resolvedScore.gaps?.missingSystems ?? resolvedScore.gaps?.missedSystems ?? [];
        systemsCovered = 5 - missingSystems.length;
      }

      return {
        date: dayNormalized.toISOString(),
        score: resolvedScore?.overallScore || 0,
        mealsLogged,
        systemsCovered,
        hasData: dayConsumptions.length > 0,
        details: {
          totalFoods: resolvedScore?.uniqueFoodsCount || 0,
          systemBreakdown: {
            angiogenesis: resolvedScore?.angiogenesisCount || 0,
            regeneration: resolvedScore?.regenerationCount || 0,
            microbiome: resolvedScore?.microbiomeCount || 0,
            dnaProtection: resolvedScore?.dnaProtectionCount || 0,
            immunity: resolvedScore?.immunityCount || 0,
          },
        },
      };
    }));

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
