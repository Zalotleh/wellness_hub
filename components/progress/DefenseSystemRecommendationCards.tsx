'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChefHat,
  ShoppingCart,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Target,
  Shield,
} from 'lucide-react';

interface Recommendation {
  id: string;
  type: 'RECIPE' | 'MEAL_PLAN' | 'FOOD_SUGGESTION' | 'WORKFLOW_STEP';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'ACTED_ON' | 'SHOPPED' | 'COMPLETED' | 'DISMISSED';
  title: string;
  description: string;
  reasoning: string;
  actionLabel: string;
  actionUrl: string;
  actionData?: Record<string, unknown>;
  targetSystem?: string;
  linkedRecipeId?: string;
  linkedShoppingListId?: string;
  actedAt?: string;
  shoppedAt?: string;
  completedAt?: string;
}

interface DefenseSystemRecommendationCardsProps {
  recommendations: Recommendation[];
  onRefresh: () => void;
}

const DEFENSE_SYSTEM_COLORS: Record<string, string> = {
  ANGIOGENESIS:   'from-red-500 to-rose-500',
  REGENERATION:   'from-green-500 to-emerald-500',
  MICROBIOME:     'from-amber-500 to-yellow-500',
  DNA_PROTECTION: 'from-blue-500 to-indigo-500',
  IMMUNITY:       'from-purple-500 to-violet-500',
};

const DEFENSE_SYSTEM_LABELS: Record<string, string> = {
  ANGIOGENESIS:   'Angiogenesis',
  REGENERATION:   'Regeneration',
  MICROBIOME:     'Microbiome',
  DNA_PROTECTION: 'DNA Protection',
  IMMUNITY:       'Immunity',
};

export function DefenseSystemRecommendationCards({
  recommendations,
  onRefresh,
}: DefenseSystemRecommendationCardsProps) {
  const router = useRouter();
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  // Deduplicate by system + type
  const unique = recommendations.reduce<Recommendation[]>((acc, rec) => {
    const isDuplicate = acc.some(
      e => e.targetSystem === rec.targetSystem && e.type === rec.type
    );
    return isDuplicate ? acc : [...acc, rec];
  }, []);

  const pendingRecs = unique.filter(r => r.status === 'PENDING');
  const inProgressRecs = unique.filter(r =>
    ['ACTED_ON', 'SHOPPED'].includes(r.status)
  );

  const getGradient = (rec: Recommendation) => {
    if (rec.targetSystem && DEFENSE_SYSTEM_COLORS[rec.targetSystem]) {
      return DEFENSE_SYSTEM_COLORS[rec.targetSystem];
    }
    switch (rec.priority) {
      case 'CRITICAL': return 'from-red-500 to-orange-500';
      case 'HIGH':     return 'from-orange-500 to-yellow-500';
      case 'MEDIUM':   return 'from-blue-500 to-indigo-500';
      default:         return 'from-gray-500 to-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RECIPE':         return <ChefHat className="w-6 h-6 text-white" />;
      case 'MEAL_PLAN':      return <Target className="w-6 h-6 text-white" />;
      case 'FOOD_SUGGESTION': return <Sparkles className="w-6 h-6 text-white" />;
      default:               return <Shield className="w-6 h-6 text-white" />;
    }
  };

  const getStatusInfo = (rec: Recommendation) => {
    if (rec.status === 'SHOPPED')  return { icon: ShoppingCart, text: 'Ready to cook',  color: 'text-blue-600' };
    if (rec.status === 'ACTED_ON') return { icon: ChefHat,      text: 'Recipe created', color: 'text-purple-600' };
    return { icon: CheckCircle, text: 'New', color: 'text-gray-600' };
  };

  const handleAction = (rec: Recommendation) => {
    const url = new URL(rec.actionUrl, window.location.origin);
    url.searchParams.set('from', 'defense-system-recommendation');
    url.searchParams.set('recId', rec.id);
    if (rec.actionData) {
      Object.entries(rec.actionData).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
        }
      });
    }
    router.push(url.pathname + url.search);
  };

  const handleDismiss = async (recId: string) => {
    setDismissingId(recId);
    try {
      const response = await fetch(`/api/recommendations/${recId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISMISSED' }),
      });
      if (!response.ok) throw new Error('Failed to dismiss');
      onRefresh();
    } catch (err) {
      console.error('Error dismissing recommendation:', err);
    } finally {
      setDismissingId(null);
    }
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (pendingRecs.length === 0 && inProgressRecs.length === 0) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-8 text-center border border-emerald-200 dark:border-emerald-800 shadow-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-md mx-auto mb-4">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          All Defense Systems on Track! 🛡️
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          You&apos;re covering all 5 defense systems today. Keep logging meals to
          maintain your progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pendingRecs.map(rec => {
          const gradient = getGradient(rec);
          const systemLabel = rec.targetSystem
            ? DEFENSE_SYSTEM_LABELS[rec.targetSystem] ?? rec.targetSystem
            : null;

          return (
            <div
              key={rec.id}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col"
            >
              {/* Priority accent bar */}
              <div className={`h-1 bg-gradient-to-r ${gradient}`} />

              <div className="p-5 flex flex-col flex-1">
                {/* Icon + header */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`inline-flex items-center justify-center w-11 h-11 bg-gradient-to-r ${gradient} rounded-xl shadow flex-shrink-0`}
                  >
                    {getTypeIcon(rec.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-1">
                      {rec.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                </div>

                {/* Defense system badge */}
                {systemLabel && (
                  <div className="mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${gradient} text-white`}
                    >
                      <Shield className="w-3 h-3" />
                      {systemLabel}
                    </span>
                  </div>
                )}

                <div className="flex-1" />

                {/* CTA */}
                <button
                  onClick={() => handleAction(rec)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r ${gradient} text-white rounded-xl font-semibold text-sm hover:opacity-90 hover:shadow-md transition-all`}
                >
                  {rec.actionLabel}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Dismiss */}
                <button
                  onClick={() => handleDismiss(rec.id)}
                  disabled={dismissingId === rec.id}
                  className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50 py-1"
                >
                  {dismissingId === rec.id ? 'Dismissing…' : 'Not interested'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* In-progress section */}
      {inProgressRecs.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </span>
            In Progress
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressRecs.map(rec => {
              const statusInfo = getStatusInfo(rec);
              const StatusIcon = statusInfo.icon;
              return (
                <div
                  key={rec.id}
                  className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <StatusIcon className={`w-7 h-7 flex-shrink-0 ${statusInfo.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{rec.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{statusInfo.text}</p>
                    </div>
                  </div>

                  {rec.status === 'ACTED_ON' && rec.linkedRecipeId && (
                    <button
                      onClick={() => router.push(`/recipes/${rec.linkedRecipeId}`)}
                      className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-semibold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      View Recipe <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {rec.status === 'SHOPPED' && rec.linkedShoppingListId && (
                    <button
                      onClick={() => router.push(`/shopping-lists/${rec.linkedShoppingListId}`)}
                      className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      View Shopping List <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
