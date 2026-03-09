import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recommendationEngine } from '@/lib/recommendations/engine';
import { calculate5x5x5Score } from '@/lib/tracking/5x5x5-score';

export const dynamic = 'force-dynamic';

/**
 * GET /api/recommendations/next-action
 * Get the next recommended action for the user
 * 
 * Query params:
 * - date: ISO date string (optional, defaults to today)
 * 
 * Returns:
 * - recommendation: SmartRecommendation object or null
 * - cached: boolean (whether result was from cache)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    // Parse and validate date
    let date: Date;
    try {
      const rawDate = dateParam ? new Date(dateParam) : new Date();
      if (isNaN(rawDate.getTime())) {
        throw new Error('Invalid date');
      }
      // Normalize to UTC date at noon to prevent timezone shifting
      const year = rawDate.getUTCFullYear();
      const month = rawDate.getUTCMonth();
      const day = rawDate.getUTCDate();
      date = new Date(Date.UTC(year, month, day, 12, 0, 0));
    } catch (err) {
      return NextResponse.json(
        { 
          error: 'Invalid date format',
          details: err instanceof Error ? err.message : 'Date parsing failed'
        },
        { status: 400 }
      );
    }
    
    const dateKey = date;

    // Always calculate the current score first so we can dismiss stale
    // recommendations (e.g. a system the user has now fully covered).
    let score;
    try {
      score = await calculate5x5x5Score(userId, dateKey);
    } catch (err) {
      console.error('Error calculating score for recommendations:', err);
      return NextResponse.json(
        { 
          error: 'Failed to calculate score',
          details: err instanceof Error ? err.message : 'Score calculation failed'
        },
        { status: 500 }
      );
    }

    if (!score) {
      return NextResponse.json({
        recommendation: null,
        cached: false,
        message: 'No progress data found for this date',
        allSystemsComplete: false,
        missedMainMeals: [],
      });
    }

    // ── Score context sent with every response so the UI can adapt ────────
    const allSystemsComplete = score.defenseSystems.every(s => s.foodsConsumed >= 5);
    const missedMainMeals = score.mealTimes
      .filter(mt =>
        !mt.hasFood &&
        (mt.mealTime === 'BREAKFAST' || mt.mealTime === 'LUNCH' || mt.mealTime === 'DINNER')
      )
      .map(mt => mt.mealTime);

    // Build a quick lookup: system → foods consumed today
    const systemFoodsConsumed = new Map<string, number>(
      score.defenseSystems.map(s => [s.system as string, s.foodsConsumed])
    );

    // Auto-dismiss any PENDING recommendations whose target system is now
    // fully covered (≥5 foods) or fully sufficient (for non-system recs).
    const pendingRecs = await prisma.recommendation.findMany({
      where: {
        userId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    const staleIds: string[] = [];
    for (const rec of pendingRecs) {
      if (rec.targetSystem) {
        const consumed = systemFoodsConsumed.get(rec.targetSystem) ?? 0;
        if (consumed >= 5) {
          staleIds.push(rec.id);
        }
      }
    }

    if (staleIds.length > 0) {
      await prisma.recommendation.updateMany({
        where: { id: { in: staleIds } },
        data: { status: 'DISMISSED', dismissedAt: new Date() },
      });
      console.log(`✅ Auto-dismissed ${staleIds.length} stale recommendation(s) in next-action`);
    }

    // Now fetch the next valid PENDING recommendation (after stale ones removed)
    const existingRec = await prisma.recommendation.findFirst({
      where: {
        userId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: [
        { priority: 'asc' }, // CRITICAL=0, HIGH=1, MEDIUM=2, LOW=3
        { createdAt: 'desc' },
      ],
    });

    if (existingRec) {
      // Increment view count
      await prisma.recommendation.update({
        where: { id: existingRec.id },
        data: { viewCount: { increment: 1 } },
      });

      return NextResponse.json({
        recommendation: {
          id: existingRec.id,
          type: existingRec.type,
          priority: existingRec.priority,
          status: existingRec.status,
          title: existingRec.title,
          description: existingRec.description,
          reasoning: existingRec.reasoning,
          actionLabel: existingRec.actionLabel,
          actionUrl: existingRec.actionUrl,
          actionData: existingRec.actionData,
          targetSystem: existingRec.targetSystem,
          targetMealTime: existingRec.targetMealTime,
          expiresAt: existingRec.expiresAt,
          createdAt: existingRec.createdAt,
        },
        cached: true,
        allSystemsComplete,
        missedMainMeals,
      });
    }

    // No existing (non-stale) recommendations — generate new ones
    let recommendations;
    try {
      recommendations = await recommendationEngine.generateDefenseSystemRecommendations(
        userId,
        date,
        score
      );
    } catch (err) {
      console.error('Error generating recommendations:', err);
      return NextResponse.json(
        { 
          error: 'Failed to generate recommendations',
          details: err instanceof Error ? err.message : 'Generation failed'
        },
        { status: 500 }
      );
    }

    if (recommendations.length === 0) {
      return NextResponse.json({
        recommendation: null,
        cached: false,
        message: 'No recommendations needed at this time',
        allSystemsComplete,
        missedMainMeals,
      });
    }

    // Save all generated recommendations to database
    const savedRecs = await Promise.all(
      recommendations.map(rec =>
        prisma.recommendation.create({
          data: {
            userId,
            type: rec.type,
            priority: rec.priority,
            status: rec.status,
            title: rec.title,
            description: rec.description,
            reasoning: rec.reasoning,
            actionLabel: rec.actionLabel,
            actionUrl: rec.actionUrl,
            actionData: rec.actionData || {},
            targetSystem: rec.targetSystem,
            targetMealTime: rec.targetMealTime as any, // Type assertion for enum
            expiresAt: rec.expiresAt,
            viewCount: 1, // First view
          },
        })
      )
    );

    // Return the highest priority recommendation
    const topRec = savedRecs[0];

    return NextResponse.json({
      recommendation: {
        id: topRec.id,
        type: topRec.type,
        priority: topRec.priority,
        status: topRec.status,
        title: topRec.title,
        description: topRec.description,
        reasoning: topRec.reasoning,
        actionLabel: topRec.actionLabel,
        actionUrl: topRec.actionUrl,
        actionData: topRec.actionData,
        targetSystem: topRec.targetSystem,
        targetMealTime: topRec.targetMealTime,
        expiresAt: topRec.expiresAt,
        createdAt: topRec.createdAt,
      },
      cached: false,
      allSystemsComplete,
      missedMainMeals,
    });
  } catch (error) {
    console.error('Error fetching next action:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendation' },
      { status: 500 }
    );
  }
}
