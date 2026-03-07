'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ChefHat,
  Calendar,
  ShoppingCart,
  CheckCircle2,
  X,
  TrendingUp,
  AlertCircle,
  Info,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBreakpoint, getSpacing } from '@/lib/utils/mobile-responsive';

interface SmartRecommendation {
  id: string;
  type: 'RECIPE' | 'MEAL_PLAN' | 'FOOD_SUGGESTION' | 'WORKFLOW_STEP';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  title: string;
  description: string;
  reasoning: string;
  actionLabel: string;
  actionUrl: string;
  actionData?: any;
  targetSystem?: string;
  targetMealTime?: string;
  expiresAt: string;
  createdAt: string;
}

interface SmartActionsPanelProps {
  date?: Date;
  className?: string;
}

export default function SmartActionsPanel({ date, className }: SmartActionsPanelProps) {
  const router = useRouter();
  const [recommendation, setRecommendation] = useState<SmartRecommendation | null>(null);
  const [allSystemsComplete, setAllSystemsComplete] = useState(false);
  const [missedMainMeals, setMissedMainMeals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  
  const breakpoint = useBreakpoint();
  const spacing = getSpacing(breakpoint);

  useEffect(() => {
    fetchRecommendation();
  }, [date]);

  const fetchRecommendation = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (date) {
        params.set('date', date.toISOString());
      }

      const response = await fetch(`/api/recommendations/next-action?${params}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recommendation');
      }

      const data = await response.json();
      setRecommendation(data.recommendation || null);
      setAllSystemsComplete(data.allSystemsComplete ?? false);
      setMissedMainMeals(data.missedMainMeals ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!recommendation) return;

    try {
      setActioning(true);

      // Don't mark as ACTED_ON yet - wait until user actually completes the action
      // Just navigate to the action URL with tracking params
      
      // Build action URL with query params
      const url = new URL(recommendation.actionUrl, window.location.origin);
      
      if (recommendation.actionData) {
        // Add action data as query params
        Object.entries(recommendation.actionData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            // Serialize arrays as JSON for proper parsing
            if (Array.isArray(value)) {
              url.searchParams.set(key, JSON.stringify(value));
            } else {
              url.searchParams.set(key, String(value));
            }
          }
        });
      }

      // Add source tracking
      url.searchParams.set('from', 'recommendation');
      url.searchParams.set('recId', recommendation.id);

      // Navigate to the action URL
      router.push(url.pathname + url.search);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to navigate');
    } finally {
      setActioning(false);
    }
  };

  const handleDismiss = async () => {
    if (!recommendation) return;

    try {
      setActioning(true);

      const response = await fetch(`/api/recommendations/${recommendation.id}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss recommendation');
      }

      // Fetch next recommendation
      await fetchRecommendation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss');
    } finally {
      setActioning(false);
    }
  };

  const getIcon = () => {
    if (!recommendation) return <Lightbulb className="h-5 w-5" />;

    switch (recommendation.type) {
      case 'RECIPE':
        return <ChefHat className="h-5 w-5" />;
      case 'MEAL_PLAN':
        return <Calendar className="h-5 w-5" />;
      case 'FOOD_SUGGESTION':
        return <ShoppingCart className="h-5 w-5" />;
      case 'WORKFLOW_STEP':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          badge: 'bg-red-500 text-white hover:bg-red-600',
          card: 'border-red-200 bg-red-50/50',
          button: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'HIGH':
        return {
          badge: 'bg-orange-500 text-white hover:bg-orange-600',
          card: 'border-orange-200 bg-orange-50/50',
          button: 'bg-orange-600 hover:bg-orange-700 text-white',
        };
      case 'MEDIUM':
        return {
          badge: 'bg-blue-500 text-white hover:bg-blue-600',
          card: 'border-blue-200 bg-blue-50/50',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      case 'LOW':
        return {
          badge: 'bg-gray-500 text-white hover:bg-gray-600',
          card: 'border-gray-200 bg-gray-50/50',
          button: 'bg-gray-600 hover:bg-gray-700 text-white',
        };
      default:
        return {
          badge: 'bg-primary text-primary-foreground',
          card: 'border-primary/20 bg-primary/5',
          button: 'bg-primary hover:bg-primary/90 text-primary-foreground',
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg p-6">
        <div className="animate-pulse flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/5" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
            <div className="flex gap-3 pt-2">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-1" />
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (!recommendation) {
    // ── All systems fully covered + missing main meals → celebration + nudge ──
    if (allSystemsComplete && missedMainMeals.length > 0) {
      const mealMeta: Record<string, { label: string; icon: string; emoji: string }> = {
        BREAKFAST: { label: 'Breakfast', icon: '🌅', emoji: '🍳' },
        LUNCH:     { label: 'Lunch',     icon: '🌞', emoji: '🥗' },
        DINNER:    { label: 'Dinner',    icon: '🌙', emoji: '🍽️' },
      };
      return (
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-green-200 dark:border-green-800 shadow-lg overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400" />
          <div className="p-6">
            {/* Celebration header */}
            <div className="flex items-start gap-4 mb-5">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-md flex-shrink-0">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">All 5 Defense Systems Covered! 🎉</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Amazing work today! You&apos;re hitting all your nutrition targets.
                </p>
              </div>
            </div>

            {/* Missing main meal nudge cards */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Want to plan {missedMainMeals.length === 1 ? 'this meal' : 'these meals'} too?
              </p>
              {missedMainMeals.map(meal => {
                const meta = mealMeta[meal] ?? { label: meal, icon: '🍴', emoji: '🍴' };
                return (
                  <div
                    key={meal}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-gray-800 border border-green-100 dark:border-green-900/40 shadow-sm"
                  >
                    <span className="text-2xl flex-shrink-0">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {meta.label} <span className="font-normal text-gray-500 dark:text-gray-400">not logged yet</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Create a healthy {meta.label.toLowerCase()} recipe to complete your day
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        router.push(
                          `/recipes/ai-generate?preferredMealTime=${meal}&from=celebration-nudge`
                        )
                      }
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold shadow hover:opacity-90 transition-opacity flex-shrink-0"
                    >
                      <ChefHat className="h-3.5 w-3.5" />
                      Create
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // ── Truly all done → simple All Caught Up ─────────────────────────────
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800 shadow-lg p-6 flex items-center gap-5">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-md flex-shrink-0">
          <CheckCircle2 className="h-7 w-7 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">All Caught Up! 🏆</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            You&apos;ve covered all 5 defense systems across all your meals. Outstanding work!
          </p>
        </div>
      </div>
    );
  }

  const styles = getPriorityStyles(recommendation.priority);

  const priorityGradient: Record<string, string> = {
    CRITICAL: 'from-red-500 to-orange-500',
    HIGH: 'from-orange-500 to-amber-500',
    MEDIUM: 'from-blue-500 to-indigo-500',
    LOW: 'from-gray-400 to-gray-500',
  };
  const iconGradient = priorityGradient[recommendation.priority] ?? 'from-blue-500 to-indigo-500';

  return (
    <div className={cn(
      'bg-white dark:bg-gray-900 rounded-2xl border shadow-lg hover:shadow-xl transition-shadow overflow-hidden',
      recommendation.priority === 'CRITICAL' ? 'border-red-200 dark:border-red-800' :
      recommendation.priority === 'HIGH' ? 'border-orange-200 dark:border-orange-800' :
      'border-gray-100 dark:border-gray-700',
      className
    )}>
      {/* Top accent bar */}
      <div className={`h-1 bg-gradient-to-r ${iconGradient}`} />

      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${iconGradient} rounded-xl shadow-md flex-shrink-0`}>
            <div className="text-white">{getIcon()}</div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg">
                {recommendation.title}
              </h3>
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', styles.badge)}>
                {recommendation.priority}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {recommendation.description}
            </p>

            {/* Reasoning toggle */}
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors mt-2"
            >
              <Info className="h-3 w-3" />
              {showReasoning ? 'Hide details' : 'Why this recommendation?'}
            </button>

            {showReasoning && (
              <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
                {recommendation.reasoning}
              </div>
            )}

            {/* Target badges */}
            {(recommendation.targetSystem || recommendation.targetMealTime) && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {recommendation.targetSystem && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
                    {recommendation.targetSystem}
                  </span>
                )}
                {recommendation.targetMealTime && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                    {recommendation.targetMealTime}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className={`flex gap-3 mt-5 ${breakpoint.mobile ? 'flex-col' : ''}`}>
          <button
            onClick={handleAccept}
            disabled={actioning}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60',
              `bg-gradient-to-r ${iconGradient} text-white hover:opacity-90`
            )}
          >
            <Sparkles className="h-4 w-4" />
            {recommendation.actionLabel}
          </button>
          <button
            onClick={handleDismiss}
            disabled={actioning}
            className="px-5 py-2.5 rounded-xl font-medium text-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {breakpoint.mobile ? (
              <span className="flex items-center justify-center gap-1.5"><X className="h-4 w-4" /> Dismiss</span>
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>  );
}