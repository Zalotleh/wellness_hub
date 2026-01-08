import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/user/delete-account
 * 
 * Request account deletion (30-day grace period)
 * Compliant with GDPR Article 17 (Right to erasure)
 * 
 * Body:
 * - confirm: boolean (must be true)
 * - reason: string (optional feedback)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { confirm, reason } = body;

    if (!confirm) {
      return NextResponse.json(
        { error: 'Confirmation required to delete account' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check if already scheduled for deletion
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        anonymized: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.anonymized) {
      return NextResponse.json(
        { error: 'Account already scheduled for deletion' },
        { status: 400 }
      );
    }

    // Calculate deletion date (30 days from now)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    // Mark account for deletion
    await prisma.user.update({
      where: { id: userId },
      data: {
        anonymized: true,
        updatedAt: new Date(),
        // Store deletion request metadata in notificationPreferences
        notificationPreferences: {
          deletionRequested: true,
          deletionRequestDate: new Date().toISOString(),
          deletionScheduledDate: deletionDate.toISOString(),
          deletionReason: reason || null,
        },
      },
    });

    // Log the deletion request (for audit trail)
    console.log(`Account deletion requested for user ${userId}`, {
      email: user.email,
      reason,
      scheduledDate: deletionDate,
    });

    return NextResponse.json({
      success: true,
      message: 'Account deletion scheduled',
      deletionDate: deletionDate.toISOString(),
      gracePeriodDays: 30,
      cancellationInfo: 'You can cancel this request within 30 days by logging in',
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process deletion request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/delete-account
 * 
 * Cancel a pending account deletion
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if scheduled for deletion
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        anonymized: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.anonymized) {
      return NextResponse.json(
        { error: 'No pending deletion to cancel' },
        { status: 400 }
      );
    }

    // Cancel deletion
    await prisma.user.update({
      where: { id: userId },
      data: {
        anonymized: false,
        notificationPreferences: {
          ...(user.notificationPreferences as object || {}),
          deletionRequested: false,
          deletionCancelledDate: new Date().toISOString(),
        },
      },
    });

    console.log(`Account deletion cancelled for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Account deletion cancelled successfully',
    });
  } catch (error) {
    console.error('Deletion cancellation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel deletion',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
