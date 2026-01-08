import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

/**
 * GET /api/recommendations/history
 * Get recommendation history with stats
 * 
 * Query params:
 * - days: Number of days to look back (default: 30)
 * - limit: Max number of recommendations to return (default: 20)
 * - type: Filter by recommendation type (optional)
 * 
 * Returns:
 * - recommendations: Array of recommendations
 * - stats: Aggregated statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || undefined;

    const startDate = subDays(new Date(), days);

    // Build where clause
    const where: any = {
      userId,
      createdAt: { gte: startDate },
    };

    if (type) {
      where.type = type;
    }

    // Fetch recommendations
    const recommendations = await prisma.recommendation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Calculate stats for the entire period (not just limited results)
    const allRecs = await prisma.recommendation.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        type: true,
        priority: true,
        status: true,
        createdAt: true,
        acceptedAt: true,
        dismissedAt: true,
        viewCount: true,
      },
    });

    const stats = {
      total: allRecs.length,
      pending: allRecs.filter(r => r.status === 'PENDING').length,
      accepted: allRecs.filter(r => r.status === 'ACCEPTED').length,
      dismissed: allRecs.filter(r => r.status === 'DISMISSED').length,
      expired: allRecs.filter(r => r.status === 'EXPIRED').length,
      
      // Acceptance rate
      acceptanceRate: allRecs.length > 0
        ? Math.round((allRecs.filter(r => r.status === 'ACCEPTED').length / allRecs.length) * 100)
        : 0,
      
      // Dismissal rate
      dismissalRate: allRecs.length > 0
        ? Math.round((allRecs.filter(r => r.status === 'DISMISSED').length / allRecs.length) * 100)
        : 0,
      
      // Total views
      totalViews: allRecs.reduce((sum, r) => sum + r.viewCount, 0),
      
      // Average views per recommendation
      avgViews: allRecs.length > 0
        ? Math.round(allRecs.reduce((sum, r) => sum + r.viewCount, 0) / allRecs.length)
        : 0,
      
      // Breakdown by type
      byType: {
        RECIPE: {
          total: allRecs.filter(r => r.type === 'RECIPE').length,
          accepted: allRecs.filter(r => r.type === 'RECIPE' && r.status === 'ACCEPTED').length,
          dismissed: allRecs.filter(r => r.type === 'RECIPE' && r.status === 'DISMISSED').length,
        },
        MEAL_PLAN: {
          total: allRecs.filter(r => r.type === 'MEAL_PLAN').length,
          accepted: allRecs.filter(r => r.type === 'MEAL_PLAN' && r.status === 'ACCEPTED').length,
          dismissed: allRecs.filter(r => r.type === 'MEAL_PLAN' && r.status === 'DISMISSED').length,
        },
        FOOD_SUGGESTION: {
          total: allRecs.filter(r => r.type === 'FOOD_SUGGESTION').length,
          accepted: allRecs.filter(r => r.type === 'FOOD_SUGGESTION' && r.status === 'ACCEPTED').length,
          dismissed: allRecs.filter(r => r.type === 'FOOD_SUGGESTION' && r.status === 'DISMISSED').length,
        },
        WORKFLOW_STEP: {
          total: allRecs.filter(r => r.type === 'WORKFLOW_STEP').length,
          accepted: allRecs.filter(r => r.type === 'WORKFLOW_STEP' && r.status === 'ACCEPTED').length,
          dismissed: allRecs.filter(r => r.type === 'WORKFLOW_STEP' && r.status === 'DISMISSED').length,
        },
      },
      
      // Breakdown by priority
      byPriority: {
        CRITICAL: allRecs.filter(r => r.priority === 'CRITICAL').length,
        HIGH: allRecs.filter(r => r.priority === 'HIGH').length,
        MEDIUM: allRecs.filter(r => r.priority === 'MEDIUM').length,
        LOW: allRecs.filter(r => r.priority === 'LOW').length,
      },
      
      // Time to action (average hours to accept/dismiss)
      avgTimeToAction: (() => {
        const actioned = allRecs.filter(r => r.acceptedAt || r.dismissedAt);
        if (actioned.length === 0) return 0;
        
        const totalHours = actioned.reduce((sum, r) => {
          const actionTime = r.acceptedAt || r.dismissedAt;
          if (!actionTime) return sum;
          const hours = (actionTime.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0);
        
        return Math.round(totalHours / actioned.length);
      })(),
    };

    return NextResponse.json({
      recommendations: recommendations.map(r => ({
        id: r.id,
        type: r.type,
        priority: r.priority,
        status: r.status,
        title: r.title,
        description: r.description,
        reasoning: r.reasoning,
        actionLabel: r.actionLabel,
        actionUrl: r.actionUrl,
        actionData: r.actionData,
        targetSystem: r.targetSystem,
        targetMealTime: r.targetMealTime,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
        acceptedAt: r.acceptedAt,
        dismissedAt: r.dismissedAt,
        viewCount: r.viewCount,
        dismissCount: r.dismissCount,
      })),
      stats,
      period: {
        days,
        startDate,
        endDate: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching recommendation history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
