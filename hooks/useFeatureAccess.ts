// hooks/useFeatureAccess.ts
'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { Feature, FeatureAccess, getUserFeatureAccess } from '@/lib/features/feature-flags';

export interface UseFeatureAccessReturn {
  // Feature checking
  hasFeature: (feature: Feature) => boolean;
  canUse: (limitKey: string, currentUsage: number) => boolean;
  
  // Limit information
  getLimit: (limitKey: string) => number | boolean;
  getRemainingUsage: (limitKey: string, currentUsage: number) => number | null;
  getUsagePercentage: (limitKey: string, currentUsage: number) => number;
  isApproachingLimit: (limitKey: string, currentUsage: number) => boolean;
  
  // Upgrade helpers
  getUpgradeMessage: (feature: Feature) => string;
  getRequiredTier: (feature: Feature) => 'FREE' | 'PREMIUM' | 'FAMILY' | null;
  
  // User info
  tier: 'FREE' | 'PREMIUM' | 'FAMILY';
  isTrialing: boolean;
  isLoading: boolean;
  featureAccess: FeatureAccess | null;
}

/**
 * Hook to access feature flags and subscription limits
 * 
 * @example
 * ```tsx
 * function MealPlanButton() {
 *   const { hasFeature, canUse, getUpgradeMessage } = useFeatureAccess();
 *   const userMealPlans = 2;
 *   
 *   if (!canUse('meal_plans_per_month', userMealPlans)) {
 *     return <UpgradePrompt message="You've reached your monthly meal plan limit" />;
 *   }
 *   
 *   if (!hasFeature(Feature.DRAG_DROP_MEALS)) {
 *     return <LockedFeature message={getUpgradeMessage(Feature.DRAG_DROP_MEALS)} />;
 *   }
 *   
 *   return <CreateMealPlanButton />;
 * }
 * ```
 */
export function useFeatureAccess(): UseFeatureAccessReturn {
  const { data: session, status } = useSession();
  
  const featureAccess = useMemo(() => {
    if (!session?.user) return null;
    
    return getUserFeatureAccess({
      subscriptionTier: (session.user as any).subscriptionTier || 'FREE',
      trialEndsAt: (session.user as any).trialEndsAt,
    });
  }, [session]);

  const tier = useMemo(() => {
    return ((session?.user as any)?.subscriptionTier || 'FREE') as 'FREE' | 'PREMIUM' | 'FAMILY';
  }, [session]);

  const isTrialing = useMemo(() => {
    const trialEndsAt = (session?.user as any)?.trialEndsAt;
    return trialEndsAt ? new Date(trialEndsAt) > new Date() : false;
  }, [session]);

  return {
    hasFeature: (feature: Feature) => featureAccess?.hasFeature(feature) ?? false,
    canUse: (limitKey: string, currentUsage: number) => 
      featureAccess?.canUse(limitKey, currentUsage) ?? false,
    getLimit: (limitKey: string) => featureAccess?.getLimit(limitKey) ?? false,
    getRemainingUsage: (limitKey: string, currentUsage: number) => 
      featureAccess?.getRemainingUsage(limitKey, currentUsage) ?? null,
    getUsagePercentage: (limitKey: string, currentUsage: number) => 
      featureAccess?.getUsagePercentage(limitKey, currentUsage) ?? 100,
    isApproachingLimit: (limitKey: string, currentUsage: number) =>
      featureAccess?.isApproachingLimit(limitKey, currentUsage) ?? false,
    getUpgradeMessage: (feature: Feature) => 
      featureAccess?.getUpgradeMessage(feature) ?? 'Upgrade to unlock this feature',
    getRequiredTier: (feature: Feature) => 
      featureAccess?.getRequiredTier(feature) ?? null,
    tier,
    isTrialing,
    isLoading: status === 'loading',
    featureAccess,
  };
}

/**
 * Hook to check a single feature flag
 * Simpler version when you only need to check one feature
 * 
 * @example
 * ```tsx
 * function DragDropMeals() {
 *   const canDragDrop = useFeature(Feature.DRAG_DROP_MEALS);
 *   
 *   if (!canDragDrop) {
 *     return <UpgradePrompt />;
 *   }
 *   
 *   return <DraggableMealList />;
 * }
 * ```
 */
export function useFeature(feature: Feature): boolean {
  const { hasFeature } = useFeatureAccess();
  return hasFeature(feature);
}

/**
 * Hook to check usage limits
 * Returns both the check result and helpful metadata
 * 
 * @example
 * ```tsx
 * function MealPlanCreator() {
 *   const userMealPlans = 2;
 *   const limit = useLimit('meal_plans_per_month', userMealPlans);
 *   
 *   return (
 *     <div>
 *       {limit.isApproachingLimit && (
 *         <Alert>You're close to your limit!</Alert>
 *       )}
 *       <p>Used {userMealPlans} of {limit.maxLimit}</p>
 *       <ProgressBar value={limit.percentage} />
 *       {!limit.canUse && (
 *         <UpgradePrompt />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLimit(limitKey: string, currentUsage: number) {
  const {
    canUse,
    getLimit,
    getRemainingUsage,
    getUsagePercentage,
    isApproachingLimit,
  } = useFeatureAccess();

  return useMemo(() => ({
    canUse: canUse(limitKey, currentUsage),
    maxLimit: getLimit(limitKey),
    remaining: getRemainingUsage(limitKey, currentUsage),
    percentage: getUsagePercentage(limitKey, currentUsage),
    isApproachingLimit: isApproachingLimit(limitKey, currentUsage),
    currentUsage,
  }), [limitKey, currentUsage, canUse, getLimit, getRemainingUsage, getUsagePercentage, isApproachingLimit]);
}
