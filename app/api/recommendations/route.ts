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

    // Verify user exists in database
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!userExists) {
      console.error('User not found in database:', session.user.id);
      return NextResponse.json(
        { error: 'User not found in database. Please sign out and sign in again.' },
        { status: 404 }
      );
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

    const response = NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
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
