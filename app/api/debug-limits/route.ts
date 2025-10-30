// API endpoint to debug limits for Sarah
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserFeatureAccess } from '@/lib/features/feature-flags';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = session.user as any;
    const subscriptionTier = user.subscriptionTier || 'FREE';
    const trialEndsAt = user.trialEndsAt;
    const isTrialing = trialEndsAt ? new Date(trialEndsAt) > new Date() : false;

    const featureAccess = getUserFeatureAccess({
      subscriptionTier,
      trialEndsAt,
    });

    const userMealPlans = user.mealPlansThisMonth || 0;
    const userAIQuestions = user.aiQuestionsThisMonth || 0;

    const mealPlanLimit = featureAccess.getLimit('meal_plans_per_month');
    const aiLimit = featureAccess.getLimit('ai_questions_per_month');
    const mealPlanRemaining = featureAccess.getRemainingUsage('meal_plans_per_month', userMealPlans);
    const aiRemaining = featureAccess.getRemainingUsage('ai_questions_per_month', userAIQuestions);

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        subscriptionTier,
        isTrialing,
        trialEndsAt,
        mealPlansThisMonth: userMealPlans,
        aiQuestionsThisMonth: userAIQuestions,
      },
      limits: {
        mealPlan: {
          maxLimit: mealPlanLimit,
          currentUsage: userMealPlans,
          remaining: mealPlanRemaining,
        },
        ai: {
          maxLimit: aiLimit,
          currentUsage: userAIQuestions,
          remaining: aiRemaining,
        }
      }
    });

  } catch (error) {
    console.error('Debug limits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}