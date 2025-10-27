// lib/features/api-access.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { Feature, getUserFeatureAccess } from './feature-flags';
import { prisma } from '@/lib/prisma';

/**
 * Get feature access for the current session in API routes
 * 
 * @example
 * ```ts
 * export async function POST(req: Request) {
 *   const access = await getApiFeatureAccess();
 *   
 *   if (!access) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   
 *   if (!access.hasFeature(Feature.UNLIMITED_MEAL_PLANS)) {
 *     return NextResponse.json(
 *       { error: access.getUpgradeMessage(Feature.UNLIMITED_MEAL_PLANS) },
 *       { status: 403 }
 *     );
 *   }
 *   
 *   // Create meal plan...
 * }
 * ```
 */
export async function getApiFeatureAccess() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      subscriptionTier: true,
      trialEndsAt: true,
      mealPlansThisMonth: true,
      aiQuestionsThisMonth: true,
      lastResetDate: true,
    },
  });

  if (!user) {
    return null;
  }

  const featureAccess = getUserFeatureAccess({
    subscriptionTier: user.subscriptionTier,
    trialEndsAt: user.trialEndsAt,
  });

  return {
    userId: user.id,
    usage: {
      mealPlans: user.mealPlansThisMonth,
      aiQuestions: user.aiQuestionsThisMonth,
      lastReset: user.lastResetDate,
    },
    // Include all FeatureAccess methods
    hasFeature: featureAccess.hasFeature.bind(featureAccess),
    getLimit: featureAccess.getLimit.bind(featureAccess),
    canUse: featureAccess.canUse.bind(featureAccess),
    getUpgradeMessage: featureAccess.getUpgradeMessage.bind(featureAccess),
    getRequiredTier: featureAccess.getRequiredTier.bind(featureAccess),
    getRemainingUsage: featureAccess.getRemainingUsage.bind(featureAccess),
    getUsagePercentage: featureAccess.getUsagePercentage.bind(featureAccess),
    isApproachingLimit: featureAccess.isApproachingLimit.bind(featureAccess),
    tier: featureAccess.getTier,
    isTrialing: featureAccess.getIsTrialing,
  };
}

/**
 * Require a specific feature for an API route
 * Returns error response if feature not available
 * 
 * @example
 * ```ts
 * export async function POST(req: Request) {
 *   const featureCheck = await requireFeature(Feature.BATCH_RECIPE_GENERATION);
 *   if (featureCheck.error) return featureCheck.error;
 *   
 *   const access = featureCheck.access;
 *   // Feature is available, proceed...
 * }
 * ```
 */
export async function requireFeature(feature: Feature) {
  const access = await getApiFeatureAccess();

  if (!access) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      access: null,
    };
  }

  if (!access.hasFeature(feature)) {
    return {
      error: NextResponse.json(
        {
          error: 'Feature not available',
          message: access.getUpgradeMessage(feature),
          requiredTier: access.getRequiredTier(feature),
          feature,
        },
        { status: 403 }
      ),
      access: null,
    };
  }

  return {
    error: null,
    access,
  };
}

/**
 * Check usage limit for an API route
 * Returns error response if limit exceeded
 * 
 * @example
 * ```ts
 * export async function POST(req: Request) {
 *   const limitCheck = await checkUsageLimit('meal_plans_per_month', async (access) => {
 *     // Fetch current usage
 *     return access.usage.mealPlans;
 *   });
 *   
 *   if (limitCheck.error) return limitCheck.error;
 *   
 *   const access = limitCheck.access;
 *   // Under limit, proceed...
 *   
 *   // Don't forget to increment usage!
 *   await incrementUsage(access.userId, 'mealPlans');
 * }
 * ```
 */
export async function checkUsageLimit(
  limitKey: string,
  getCurrentUsage: (access: Awaited<ReturnType<typeof getApiFeatureAccess>>) => Promise<number> | number
) {
  const access = await getApiFeatureAccess();

  if (!access) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      access: null,
    };
  }

  const currentUsage = await getCurrentUsage(access);

  if (!access.canUse(limitKey, currentUsage)) {
    const limit = access.getLimit(limitKey);
    
    return {
      error: NextResponse.json(
        {
          error: 'Usage limit exceeded',
          message: `You've reached your monthly limit of ${limit} for this feature`,
          limitKey,
          currentUsage,
          limit,
        },
        { status: 429 }
      ),
      access: null,
    };
  }

  return {
    error: null,
    access,
    currentUsage,
  };
}

/**
 * Increment usage counter for a user
 * Should be called after successfully using a limited feature
 * 
 * @example
 * ```ts
 * // After creating a meal plan
 * await incrementUsage(userId, 'mealPlans');
 * 
 * // After asking AI a question
 * await incrementUsage(userId, 'aiQuestions');
 * ```
 */
export async function incrementUsage(
  userId: string,
  usageType: 'mealPlans' | 'aiQuestions'
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastResetDate: true },
  });

  if (!user) return;

  // Check if we need to reset monthly counters
  const now = new Date();
  const lastReset = new Date(user.lastResetDate);
  const shouldReset = now.getMonth() !== lastReset.getMonth() || 
                      now.getFullYear() !== lastReset.getFullYear();

  if (shouldReset) {
    // Reset all monthly counters
    await prisma.user.update({
      where: { id: userId },
      data: {
        mealPlansThisMonth: usageType === 'mealPlans' ? 1 : 0,
        aiQuestionsThisMonth: usageType === 'aiQuestions' ? 1 : 0,
        lastResetDate: now,
      },
    });
  } else {
    // Increment the appropriate counter
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(usageType === 'mealPlans' && {
          mealPlansThisMonth: { increment: 1 },
        }),
        ...(usageType === 'aiQuestions' && {
          aiQuestionsThisMonth: { increment: 1 },
        }),
      },
    });
  }
}

/**
 * Combined helper for feature + limit checking
 * Most common pattern in API routes
 * 
 * @example
 * ```ts
 * export async function POST(req: Request) {
 *   const check = await requireFeatureAndLimit(
 *     Feature.UNLIMITED_MEAL_PLANS,
 *     'meal_plans_per_month',
 *     async (access) => access.usage.mealPlans
 *   );
 *   
 *   if (check.error) return check.error;
 *   
 *   // Create meal plan...
 *   
 *   // Increment usage
 *   await incrementUsage(check.access.userId, 'mealPlans');
 * }
 * ```
 */
export async function requireFeatureAndLimit(
  feature: Feature,
  limitKey: string,
  getCurrentUsage: (access: Awaited<ReturnType<typeof getApiFeatureAccess>>) => Promise<number> | number
) {
  // First check feature access
  const featureCheck = await requireFeature(feature);
  if (featureCheck.error) return featureCheck;

  // Then check usage limit
  const limitCheck = await checkUsageLimit(limitKey, getCurrentUsage);
  if (limitCheck.error) return limitCheck;

  return {
    error: null,
    access: limitCheck.access!,
    currentUsage: limitCheck.currentUsage,
  };
}
