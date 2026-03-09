import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculate5x5x5Score } from '@/lib/tracking/5x5x5-score';
import { recommendationEngine } from '@/lib/recommendations/engine';

/**
 * GET /api/recommendations
 * Fetch active recommendations for the current user.
 * Auto-dismisses any recommendations whose target defense systems
 * are now fully covered (≥ 5 foods) so stale cards never appear.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify user exists in database
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      console.error('User not found in database:', userId);
      return NextResponse.json(
        { error: 'User not found in database. Please sign out and sign in again.' },
        { status: 404 }
      );
    }

    // ── Auto-dismiss stale recommendations ────────────────────────────────
    // Calculate today's score to know which systems are now fully covered.
    // We do this silently — if the score call fails we still return recs.
    try {
      const today = new Date();
      const dateKey = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12, 0, 0));
      const score = await calculate5x5x5Score(userId, dateKey);

      if (score) {
        // Map system → foods consumed today
        const systemFoodsConsumed = new Map<string, number>(
          score.defenseSystems.map(s => [s.system as string, s.foodsConsumed])
        );

        // Find PENDING recommendations whose system is now complete
        const pendingRecs = await prisma.recommendation.findMany({
          where: {
            userId,
            status: 'PENDING',
            expiresAt: { gt: new Date() },
            targetSystem: { not: null },
          },
          select: { id: true, targetSystem: true },
        });

        const staleIds = pendingRecs
          .filter(r => r.targetSystem && (systemFoodsConsumed.get(r.targetSystem) ?? 0) >= 5)
          .map(r => r.id);

        if (staleIds.length > 0) {
          await prisma.recommendation.updateMany({
            where: { id: { in: staleIds } },
            data: { status: 'DISMISSED', dismissedAt: new Date() },
          });
          console.log(`✅ Auto-dismissed ${staleIds.length} stale recommendation(s) in GET /api/recommendations`);
        }
      }
    } catch (scoreErr) {
      // Non-fatal — continue and return whatever is in the DB
      console.warn('Could not calculate score for stale-rec dismissal:', scoreErr);
    }
    // ── End auto-dismiss ───────────────────────────────────────────────────

    // ── Section 1: Defense-system recommendations (DB-backed) ──────────────
    // Only return RECIPE / MEAL_PLAN / FOOD_SUGGESTION types from DB.
    let dbRecommendations = await prisma.recommendation.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'ACTED_ON', 'SHOPPED'] },
        expiresAt: { gte: new Date() },
        // Explicitly exclude WORKFLOW_STEP from the DB — those live in Section 2
        type: { in: ['RECIPE', 'MEAL_PLAN', 'FOOD_SUGGESTION'] },
      },
      orderBy: [
        { priority: 'asc' }, // CRITICAL first
        { createdAt: 'desc' },
      ],
    });

    // ── Generate if the DB has no active defense-system recommendations ───
    // This handles: new users, expired recs, dismissed recs, and any gap
    // between the last generation and now.
    if (dbRecommendations.length === 0) {
      try {
        const today = new Date();
        const dateKey = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12, 0, 0));
        const scoreForGen = await calculate5x5x5Score(userId, dateKey);

        if (scoreForGen) {
          const generated = await recommendationEngine.generateDefenseSystemRecommendations(
            userId,
            dateKey,
            scoreForGen
          );

          if (generated.length > 0) {
            const saved = await Promise.all(
              generated.map(rec =>
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
                    actionData: rec.actionData ?? {},
                    targetSystem: rec.targetSystem,
                    targetMealTime: rec.targetMealTime as any,
                    expiresAt: rec.expiresAt,
                    viewCount: 0,
                  },
                })
              )
            );
            console.log(`✅ Generated ${saved.length} defense-system recommendation(s) in GET /api/recommendations`);
            dbRecommendations = saved;
          }
        }
      } catch (genErr) {
        // Non-fatal — return empty rather than a 500
        console.warn('Could not generate defense-system recommendations:', genErr);
      }
    }

    // ── Section 2: Meal-logging recommendations (computed fresh) ─────────────
    // Derived from today's score — never persisted to DB.
    let mealLoggingRecs: ReturnType<typeof recommendationEngine.generateMealLoggingRecommendations> = [];
    try {
      const today = new Date();
      const dateKey = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12, 0, 0));
      const freshScore = await calculate5x5x5Score(userId, dateKey);
      if (freshScore) {
        mealLoggingRecs = recommendationEngine.generateMealLoggingRecommendations(
          userId,
          dateKey,
          freshScore
        );
      }
    } catch (mealErr) {
      console.warn('Could not compute meal-logging recommendations:', mealErr);
    }

    const response = NextResponse.json({
      success: true,
      // Scoped arrays used by the two dashboard sections
      defenseSystem: dbRecommendations,
      mealLogging: mealLoggingRecs,
      // Legacy combined field — kept for backward compatibility
      data: dbRecommendations,
      count: dbRecommendations.length,
    });

    // Prevent caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
