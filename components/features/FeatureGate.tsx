// components/features/FeatureGate.tsx
'use client';

import { ReactNode } from 'react';
import { Feature } from '@/lib/features/feature-flags';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Lock, Crown, Users } from 'lucide-react';

interface FeatureGateProps {
  feature: Feature;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

/**
 * Component to gate features based on subscription tier
 * 
 * @example
 * ```tsx
 * <FeatureGate feature={Feature.DRAG_DROP_MEALS}>
 *   <DraggableMealList />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}: FeatureGateProps) {
  const { hasFeature, getUpgradeMessage, getRequiredTier, tier } = useFeatureAccess();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const requiredTier = getRequiredTier(feature);
  const message = getUpgradeMessage(feature);

  return (
    <div className="relative">
      {/* Blurred/Locked Content */}
      <div className="opacity-50 pointer-events-none blur-sm">
        {children}
      </div>

      {/* Upgrade Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/20 to-transparent">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm text-center">
          <div className="mb-4">
            {requiredTier === 'PREMIUM' && (
              <Crown className="w-12 h-12 mx-auto text-amber-500" />
            )}
            {requiredTier === 'FAMILY' && (
              <Users className="w-12 h-12 mx-auto text-blue-500" />
            )}
            {!requiredTier && (
              <Lock className="w-12 h-12 mx-auto text-gray-500" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          
          <button className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all">
            Upgrade to {requiredTier}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Component to show usage limits with progress bar
 * 
 * @example
 * ```tsx
 * <UsageLimitBar
 *   limitKey="meal_plans_per_month"
 *   currentUsage={userMealPlans}
 *   showWarning
 * />
 * ```
 */
interface UsageLimitBarProps {
  limitKey: string;
  currentUsage: number;
  showWarning?: boolean;
  className?: string;
}

export function UsageLimitBar({
  limitKey,
  currentUsage,
  showWarning = true,
  className = '',
}: UsageLimitBarProps) {
  const {
    getLimit,
    getRemainingUsage,
    getUsagePercentage,
    isApproachingLimit,
  } = useFeatureAccess();

  const limit = getLimit(limitKey);
  const remaining = getRemainingUsage(limitKey, currentUsage);
  const percentage = getUsagePercentage(limitKey, currentUsage);
  const approaching = isApproachingLimit(limitKey, currentUsage);

  if (limit === Infinity) return null;
  if (typeof limit === 'boolean') return null;

  const limitNum = limit as number;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          {currentUsage} / {limitNum} used this month
        </span>
        {remaining !== null && (
          <span className={`font-medium ${approaching ? 'text-amber-600' : 'text-gray-700'}`}>
            {remaining} remaining
          </span>
        )}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            percentage >= 100
              ? 'bg-red-500'
              : approaching
              ? 'bg-amber-500'
              : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {showWarning && approaching && percentage < 100 && (
        <p className="text-xs text-amber-600">
          ⚠️ You're approaching your monthly limit
        </p>
      )}

      {showWarning && percentage >= 100 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800 font-medium">
            Monthly limit reached
          </p>
          <button className="text-sm text-red-600 underline hover:text-red-800 mt-1">
            Upgrade for unlimited access
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Simple badge to show subscription tier
 */
interface TierBadgeProps {
  className?: string;
}

export function TierBadge({ className = '' }: TierBadgeProps) {
  const { tier, isTrialing } = useFeatureAccess();

  const colors = {
    FREE: 'bg-gray-100 text-gray-700 border-gray-300',
    PREMIUM: 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-300',
    FAMILY: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-300',
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${colors[tier]} ${className}`}>
      {tier === 'PREMIUM' && <Crown className="w-4 h-4" />}
      {tier === 'FAMILY' && <Users className="w-4 h-4" />}
      <span className="text-sm font-medium">{tier}</span>
      {isTrialing && <span className="text-xs">(Trial)</span>}
    </div>
  );
}
