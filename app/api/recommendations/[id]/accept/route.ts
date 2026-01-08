import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/recommendations/[id]/accept
 * Mark a recommendation as accepted
 * 
 * Body (optional):
 * - metadata: Additional metadata to store (e.g., which recipe was generated)
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

    // Parse optional metadata from body
    let metadata = {};
    try {
      const body = await request.json();
      metadata = body.metadata || {};
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

    // Update recommendation to ACCEPTED
    const updated = await prisma.recommendation.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        actionData: {
          ...(recommendation.actionData as object),
          ...metadata,
        },
      },
    });

    return NextResponse.json({
      success: true,
      recommendation: {
        id: updated.id,
        status: updated.status,
        acceptedAt: updated.acceptedAt,
      },
    });
  } catch (error) {
    console.error('Error accepting recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to accept recommendation' },
      { status: 500 }
    );
  }
}
