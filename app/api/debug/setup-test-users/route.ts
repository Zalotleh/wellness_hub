import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('Setting up test users...');

    // Set Emma to FREE
    const emma = await prisma.user.update({
      where: { email: 'emma@example.com' },
      data: {
        subscriptionTier: 'FREE',
        subscriptionStatus: null,
        trialEndsAt: null,
        subscriptionEndsAt: null,
        mealPlansThisMonth: 0,
        aiQuestionsThisMonth: 0,
        lastResetDate: new Date(),
      },
    });

    // Set John to PREMIUM
    const john = await prisma.user.update({
      where: { email: 'john@example.com' },
      data: {
        subscriptionTier: 'PREMIUM',
        subscriptionStatus: 'active',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        mealPlansThisMonth: 0,
        aiQuestionsThisMonth: 0,
        lastResetDate: new Date(),
      },
    });

    // Set Sarah to FAMILY
    const sarah = await prisma.user.update({
      where: { email: 'sarah@example.com' },
      data: {
        subscriptionTier: 'FAMILY',
        subscriptionStatus: 'active',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        mealPlansThisMonth: 0,
        aiQuestionsThisMonth: 0,
        lastResetDate: new Date(),
      },
    });

    console.log('Test users updated:', { emma: emma.subscriptionTier, john: john.subscriptionTier, sarah: sarah.subscriptionTier });

    return NextResponse.json({
      success: true,
      message: 'Test users configured successfully',
      users: {
        emma: { email: emma.email, tier: emma.subscriptionTier },
        john: { email: john.email, tier: john.subscriptionTier },
        sarah: { email: sarah.email, tier: sarah.subscriptionTier },
      }
    });

  } catch (error) {
    console.error('Error setting up test users:', error);
    return NextResponse.json(
      { error: 'Failed to set up test users', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}