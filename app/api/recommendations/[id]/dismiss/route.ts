import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/recommendations/[id]/dismiss
 * Mark a recommendation as dismissed
 * 
 * Body (optional):
 * - reason: String reason for dismissal (for analytics)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = params;

    // Parse optional reason from body
    let reason = null;
    try {
      const body = await request.json();
      reason = body.reason || null;
    } catch {
      // No body is fine
    }

    // Find the recommendation
    const recommendation = await prisma.recommendation.findUnique({
      where: { id },
    });

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (recommendation.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if already accepted or dismissed
    if (recommendation.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Recommendation already ${recommendation.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Update recommendation to DISMISSED
    const updated = await prisma.recommendation.update({
      where: { id },
      data: {
        status: 'DISMISSED',
        dismissedAt: new Date(),
        dismissCount: { increment: 1 },
        actionData: {
          ...(recommendation.actionData as object),
          dismissReason: reason,
        },
      },
    });

    return NextResponse.json({
      success: true,
      recommendation: {
        id: updated.id,
        status: updated.status,
        dismissedAt: updated.dismissedAt,
        dismissCount: updated.dismissCount,
      },
    });
  } catch (error) {
    console.error('Error dismissing recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss recommendation' },
      { status: 500 }
    );
  }
}
