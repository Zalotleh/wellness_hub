'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle, UtensilsCrossed } from 'lucide-react';

interface MealLoggingRec {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  actionData?: Record<string, unknown>;
  targetMealTime?: string;
}

interface MealLoggingRecommendationCardsProps {
  recommendations: MealLoggingRec[];
  /** Called after user navigates so parent can refresh on return */
  onAction?: () => void;
}

// Visual config per meal time
const MEAL_CONFIG: Record<
  string,
  { emoji: string; gradient: string; bgLight: string; label: string; time: string }
> = {
  BREAKFAST: {
    emoji: '🌅',
    gradient: 'from-amber-400 to-orange-500',
    bgLight: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    label: 'Breakfast',
    time: 'Morning',
  },
  MORNING_SNACK: {
    emoji: '🍎',
    gradient: 'from-green-400 to-emerald-500',
    bgLight: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    label: 'Morning Snack',
    time: 'Mid-morning',
  },
  LUNCH: {
    emoji: '☀️',
    gradient: 'from-sky-400 to-blue-500',
    bgLight: 'from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20',
    label: 'Lunch',
    time: 'Midday',
  },
  AFTERNOON_SNACK: {
    emoji: '🍊',
    gradient: 'from-orange-400 to-amber-500',
    bgLight: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    label: 'Afternoon Snack',
    time: 'Afternoon',
  },
  DINNER: {
    emoji: '🌙',
    gradient: 'from-indigo-400 to-purple-500',
    bgLight: 'from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
    label: 'Dinner',
    time: 'Evening',
  },
};

const MEAL_ORDER = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER'];

export function MealLoggingRecommendationCards({
  recommendations,
  onAction,
}: MealLoggingRecommendationCardsProps) {
  const router = useRouter();

  // Sort by canonical meal order
  const sorted = [...recommendations].sort((a, b) => {
    const ai = MEAL_ORDER.indexOf(a.targetMealTime ?? '');
    const bi = MEAL_ORDER.indexOf(b.targetMealTime ?? '');
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Distinguish celebration recs (all systems complete) from regular nudges
  const isCelebration = sorted.some(r => r.title.includes('All 5 Systems Covered'));

  const handleAction = (rec: MealLoggingRec) => {
    const url = new URL(rec.actionUrl, window.location.origin);
    url.searchParams.set('from', 'meal-logging-recommendation');
    url.searchParams.set('recId', rec.id);
    if (rec.actionData) {
      Object.entries(rec.actionData).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
        }
      });
    }
    onAction?.();
    router.push(url.pathname + url.search);
  };

  // ── All meals logged ────────────────────────────────────────────────────
  if (sorted.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-2xl p-7 text-center border border-green-200 dark:border-green-800 shadow-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl shadow-md mx-auto mb-3">
          <CheckCircle className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          All Meals Logged Today! 🎉
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          Great job tracking every meal. Your 5x5x5 journey is looking strong today!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Celebration banner when all defense systems are covered */}
      {isCelebration && (
        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl">
          <span className="text-2xl flex-shrink-0">🎉</span>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">
              All 5 Defense Systems Covered!
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Incredible work! Create recipes for the remaining meals to round out your day.
            </p>
          </div>
        </div>
      )}

      {/* Meal nudge cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(rec => {
          const mealTime = rec.targetMealTime ?? '';
          const config = MEAL_CONFIG[mealTime] ?? {
            emoji: '🍽️',
            gradient: 'from-gray-400 to-gray-500',
            bgLight: 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700',
            label: mealTime.replace(/_/g, ' '),
            time: '',
          };

          return (
            <div
              key={rec.id}
              className={`bg-gradient-to-br ${config.bgLight} rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col`}
            >
              {/* Top accent */}
              <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />

              <div className="p-5 flex flex-col flex-1">
                {/* Meal time header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r ${config.gradient} rounded-xl shadow flex-shrink-0`}
                  >
                    <span className="text-lg leading-none">{config.emoji}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {config.label}
                    </p>
                    {config.time && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{config.time}</p>
                    )}
                  </div>
                  {/* "Not logged" badge */}
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex-shrink-0">
                    Not logged
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4 flex-1">
                  {rec.description}
                </p>

                {/* CTA */}
                <button
                  onClick={() => handleAction(rec)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r ${config.gradient} text-white rounded-xl font-semibold text-sm hover:opacity-90 hover:shadow-md transition-all`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  {rec.actionLabel}
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
