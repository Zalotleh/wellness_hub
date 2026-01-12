'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Target, 
  ChefHat, 
  ShoppingCart, 
  CheckCircle, 
  Clock,
  ArrowRight,
  Sparkles,
  UtensilsCrossed
} from 'lucide-react';
// Using window alerts for notifications

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
  actionData?: any;
  targetSystem?: string;
  linkedRecipeId?: string;
  linkedShoppingListId?: string;
  actedAt?: string;
  shoppedAt?: string;
  completedAt?: string;
}

interface RecommendationCardsProps {
  recommendations: Recommendation[];
  onRefresh: () => void;
}

export function RecommendationCards({ recommendations, onRefresh }: RecommendationCardsProps) {
  const router = useRouter();
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  // Deduplicate recommendations by system + type to prevent redundancy
  const uniqueRecommendations = recommendations.reduce<Recommendation[]>((acc, rec) => {
    const isDuplicate = acc.some(existing => 
      existing.targetSystem === rec.targetSystem &&
      existing.type === rec.type
    );
    if (!isDuplicate) {
      acc.push(rec);
    }
    return acc;
  }, []);

  // Separate recommendations by status
  const pendingRecs = uniqueRecommendations.filter(r => r.status === 'PENDING');
  const inProgressRecs = uniqueRecommendations.filter(r => 
    ['ACTED_ON', 'SHOPPED'].includes(r.status)
  );

  const handleAction = (rec: Recommendation) => {
    // Build URL with recommendation tracking
    const url = new URL(rec.actionUrl, window.location.origin);
    url.searchParams.set('from', 'recommendation');
    url.searchParams.set('recId', rec.id);
    
    if (rec.actionData) {
      Object.entries(rec.actionData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
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
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
      alert('Failed to dismiss recommendation');
    } finally {
      setDismissingId(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'from-red-500 to-orange-500';
      case 'HIGH': return 'from-orange-500 to-yellow-500';
      case 'MEDIUM': return 'from-blue-500 to-indigo-500';
      case 'LOW': return 'from-gray-500 to-gray-600';
      default: return 'from-blue-500 to-indigo-500';
    }
  };

  const getStatusInfo = (rec: Recommendation) => {
    if (rec.status === 'COMPLETED') {
      return { icon: CheckCircle, text: 'Completed', color: 'text-green-600' };
    }
    if (rec.status === 'SHOPPED') {
      return { icon: ShoppingCart, text: 'Ready to cook', color: 'text-blue-600' };
    }
    if (rec.status === 'ACTED_ON') {
      return { icon: ChefHat, text: 'Recipe created', color: 'text-purple-600' };
    }
    return { icon: Target, text: 'New', color: 'text-gray-600' };
  };

  if (pendingRecs.length === 0 && inProgressRecs.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-8 text-center border border-green-200 dark:border-green-800">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          All Caught Up! 🎉
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          You're doing great! Keep tracking your meals to get personalized recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600" />
            Your Action Items
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
            Smart recommendations based on your progress
          </p>
        </div>
        {(pendingRecs.length + inProgressRecs.length) > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {pendingRecs.length + inProgressRecs.length} active
          </div>
        )}
      </div>

      {/* Pending Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingRecs.map((rec) => {
          const StatusIcon = getStatusInfo(rec).icon;
          
          return (
            <div
              key={rec.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Priority Banner */}
              <div className={`h-1 bg-gradient-to-r ${getPriorityColor(rec.priority)}`} />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getPriorityColor(rec.priority)} flex items-center justify-center flex-shrink-0`}>
                    {rec.type === 'RECIPE' && <ChefHat className="w-5 h-5 text-white" />}
                    {rec.type === 'WORKFLOW_STEP' && <UtensilsCrossed className="w-5 h-5 text-white" />}
                    {rec.type === 'FOOD_SUGGESTION' && <Sparkles className="w-5 h-5 text-white" />}
                    {rec.type === 'MEAL_PLAN' && <Target className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                      {rec.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                      {rec.description}
                    </p>
                  </div>
                </div>

                {/* Target System Badge */}
                {rec.targetSystem && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                      {rec.targetSystem}
                    </span>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleAction(rec)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r ${getPriorityColor(rec.priority)} text-white rounded-lg font-medium text-sm hover:shadow-md transition-shadow`}
                >
                  {rec.actionLabel}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Dismiss Button */}
                <button
                  onClick={() => handleDismiss(rec.id)}
                  disabled={dismissingId === rec.id}
                  className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium disabled:opacity-50"
                >
                  {dismissingId === rec.id ? 'Dismissing...' : 'Not interested'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* In Progress Section */}
      {inProgressRecs.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            In Progress
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressRecs.map((rec) => {
              const statusInfo = getStatusInfo(rec);
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={rec.id}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-5"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <StatusIcon className={`w-8 h-8 ${statusInfo.color}`} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                        {rec.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {statusInfo.text}
                      </p>
                    </div>
                  </div>

                  {/* Next Step */}
                  {rec.status === 'ACTED_ON' && rec.linkedRecipeId && (
                    <button
                      onClick={() => router.push(`/recipes/${rec.linkedRecipeId}`)}
                      className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      View Recipe
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {rec.status === 'SHOPPED' && rec.linkedShoppingListId && (
                    <button
                      onClick={() => router.push(`/shopping-lists/${rec.linkedShoppingListId}`)}
                      className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-medium text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      View Shopping List
                      <ArrowRight className="w-4 h-4" />
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
