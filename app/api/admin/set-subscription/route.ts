import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // For testing purposes, allow any authenticated user to set subscriptions
    // In production, you'd want proper admin authentication
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, subscriptionTier, trialEndsAt } = body;

    // Validate subscription tier
    if (!['FREE', 'PREMIUM', 'FAMILY'].includes(subscriptionTier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier. Must be FREE, PREMIUM, or FAMILY' },
        { status: 400 }
      );
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, subscriptionTier: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update the user's subscription
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        subscriptionTier: subscriptionTier as any,
        subscriptionStatus: subscriptionTier === 'FREE' ? null : 'active',
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
        subscriptionEndsAt: subscriptionTier === 'FREE' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        // Reset usage counters
        mealPlansThisMonth: 0,
        aiQuestionsThisMonth: 0,
        lastResetDate: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Subscription updated successfully',
      user: {
        email: updatedUser.email,
        subscriptionTier: updatedUser.subscriptionTier,
        subscriptionStatus: updatedUser.subscriptionStatus,
        trialEndsAt: updatedUser.trialEndsAt,
        subscriptionEndsAt: updatedUser.subscriptionEndsAt,
      }
    });

  } catch (error) {
    console.error('Error setting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// GET endpoint to check current subscriptions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['emma@example.com', 'john@example.com', 'sarah@example.com']
        }
      },
      select: {
        email: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        mealPlansThisMonth: true,
        aiQuestionsThisMonth: true,
      }
    });

    return NextResponse.json({
      users
    });

  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}