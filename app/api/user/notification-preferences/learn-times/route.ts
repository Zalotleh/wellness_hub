/**
 * Learn Optimal Times API
 * 
 * POST: Analyze user behavior and learn optimal meal notification times
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/notifications/notification-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Learn optimal times from user behavior
    const learnedTimes = await notificationService.learnOptimalTimes(session.user.id);

    return NextResponse.json({
      success: true,
      learnedTimes,
    });
  } catch (error) {
    console.error('Error learning optimal times:', error);
    return NextResponse.json(
      { error: 'Failed to learn optimal times' },
      { status: 500 }
    );
  }
}
