import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan, interval = 'monthly' } = body;

    // Validate plan
    if (!['premium', 'family'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // For testing purposes, directly update the user's subscription
    // In production, this would go through Stripe
    const subscriptionTier = plan.toUpperCase() as 'PREMIUM' | 'FAMILY';
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days trial
    const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days subscription

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        subscriptionTier,
        subscriptionStatus: 'active',
        trialEndsAt,
        subscriptionEndsAt,
        // Reset usage counters
        mealPlansThisMonth: 0,
        aiQuestionsThisMonth: 0,
        lastResetDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${plan} plan!`,
      user: {
        subscriptionTier: updatedUser.subscriptionTier,
        trialEndsAt: updatedUser.trialEndsAt,
        subscriptionEndsAt: updatedUser.subscriptionEndsAt,
      },
      // Return a mock success URL for redirect
      redirectUrl: '/dashboard?upgrade=success',
    });

  } catch (error) {
    console.error('Error in test upgrade:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}