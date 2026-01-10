import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/recommendations
 * Fetch active recommendations for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active recommendations (PENDING, ACTED_ON, SHOPPED)
    const recommendations = await prisma.recommendation.findMany({
      where: {
        userId: session.user.id,
        status: {
          in: ['PENDING', 'ACTED_ON', 'SHOPPED'],
        },
        expiresAt: {
          gte: new Date(), // Not expired
        },
      },
      orderBy: [
        { priority: 'asc' }, // CRITICAL first
        { createdAt: 'desc' }, // Newest first
      ],
    });

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });

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
