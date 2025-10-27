import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch current user data from database
    const userData = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        mealPlansThisMonth: true,
        aiQuestionsThisMonth: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      sessionData: {
        user: session.user,
        sessionTier: (session.user as any)?.subscriptionTier,
      },
      databaseData: userData,
      match: userData.subscriptionTier === (session.user as any)?.subscriptionTier,
    });

  } catch (error) {
    console.error('Error checking user data:', error);
    return NextResponse.json(
      { error: 'Failed to check user data' },
      { status: 500 }
    );
  }
}