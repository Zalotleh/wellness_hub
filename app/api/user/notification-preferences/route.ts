/**
 * Notification Preferences API
 * 
 * GET: Retrieve user notification preferences
 * PUT: Update notification preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/notifications/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        notificationPreferences: true,
      },
    });

    const preferences = user?.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES;

    return NextResponse.json({
      success: true,
      preferences,
      learnedTimes: {}, // TODO: Get from notification service
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { preferences } = await req.json();

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences required' },
        { status: 400 }
      );
    }

    // Update preferences
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notificationPreferences: preferences,
      },
    });

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
