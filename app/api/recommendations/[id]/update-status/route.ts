import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/recommendations/[id]/update-status
 * Update recommendation lifecycle status
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

    const recommendationId = params.id;
    const body = await request.json();
    const { status, linkedRecipeId, linkedShoppingListId, linkedMealLogId } = body;

    // Verify recommendation belongs to user
    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    if (recommendation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build update data based on status
    const updateData: any = { status };

    if (status === 'ACTED_ON') {
      updateData.actedAt = new Date();
      if (linkedRecipeId) updateData.linkedRecipeId = linkedRecipeId;
    } else if (status === 'SHOPPED') {
      updateData.shoppedAt = new Date();
      if (linkedShoppingListId) updateData.linkedShoppingListId = linkedShoppingListId;
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      if (linkedMealLogId) updateData.linkedMealLogId = linkedMealLogId;
    } else if (status === 'DISMISSED') {
      updateData.dismissedAt = new Date();
      updateData.dismissCount = { increment: 1 };
    }

    // Update recommendation
    const updated = await prisma.recommendation.update({
      where: { id: recommendationId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      recommendation: updated,
    });

  } catch (error) {
    console.error('Error updating recommendation status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update recommendation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
