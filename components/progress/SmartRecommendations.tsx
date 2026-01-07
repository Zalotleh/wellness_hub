'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Sparkles, TrendingUp, Clock, Target, RefreshCw, ChevronRight } from 'lucide-react';
import MultiSystemBadge from '@/components/ui/MultiSystemBadge';
import { DefenseSystem } from '@/types';

type MealTime = 'BREAKFAST' | 'MORNING_SNACK' | 'LUNCH' | 'AFTERNOON_SNACK' | 'DINNER';

interface FoodDatabaseEntry {
  id: string;
  name: string;
  category: string;
  defenseSystems: DefenseSystem[];
  servingSize?: string;
}

interface RecommendationData {
  currentProgress: {
    overall: number;
    systemsCovered: number;
    totalSystems: number;
    mealTimesCovered: number;
    totalMealTimes: number;
    foodsConsumed: number;
  };
  gaps: {
    systems: DefenseSystem[];
    mealTimes: MealTime[];
  };
  recommendations: {
    bySystem: Array<{
      system: DefenseSystem;
      reason: string;
      priority: string;
      suggestedFoods: Array<{
        id: string;
        name: string;
        category: string;
        benefits: number;
        isMultiSystem: boolean;
      }>;
    }>;
    byMealTime: Array<{
      mealTime: MealTime;
      reason: string;
      priority: string;
      suggestion: string;
    }>;
    multiSystemFoods: Array<{
      id: string;
      name: string;
      category: string;
      systemsCovered: number;
      systems: Array<{
        system: DefenseSystem;
        strength: string;
      }>;
    }>;
  };
  insights?: {
    favoriteFoods: Array<{ name: string; timesConsumed: number }>;
    consistency: {
      daysTracked: number;
      totalDays: number;
    };
  };
}

interface SmartRecommendationsProps {
  date: Date;
  onFoodClick?: (food: FoodDatabaseEntry) => void;
  className?: string;
}

const mealTimeLabels: Record<MealTime, { label: string; icon: string }> = {
  BREAKFAST: { label: 'Breakfast', icon: '🌅' },
  MORNING_SNACK: { label: 'Morning Snack', icon: '☕' },
  LUNCH: { label: 'Lunch', icon: '🌞' },
  AFTERNOON_SNACK: { label: 'Afternoon Snack', icon: '🍎' },
  DINNER: { label: 'Dinner', icon: '🌙' },
};

export default function SmartRecommendations({
  date,
  onFoodClick,
  className = '',
}: SmartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await fetch(`/api/progress/recommendations?date=${dateStr}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      
      // Check if we got valid data
      if (!data.gaps || !data.recommendations || !data.currentProgress) {
        throw new Error('Invalid response format');
      }
      
      setRecommendations(data);
    } catch (err) {
      console.error('Recommendations error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !recommendations) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="mb-4">{error || 'Failed to load recommendations'}</p>
          <button
            onClick={fetchRecommendations}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const missingSystems = recommendations.gaps.systems;
  const missingMealTimes = recommendations.gaps.mealTimes;
  const superfoodHighlights = recommendations.recommendations.multiSystemFoods;
  const currentProgress = recommendations.currentProgress;
  
  // Get suggested foods from system recommendations
  const suggestedFoods = recommendations.recommendations.bySystem.flatMap(
    (rec) => rec.suggestedFoods.map((food) => ({
      id: food.id,
      name: food.name,
      category: food.category,
      defenseSystems: [rec.system],
      servingSize: undefined,
    }))
  );

  const isComplete = missingSystems.length === 0 && missingMealTimes.length === 0;

  return (
    <div className={`bg-gradient-to-br from-white to-purple-50 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-full">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Smart Recommendations</h2>
            <p className="text-sm text-gray-600">AI-powered suggestions for optimal nutrition</p>
          </div>
        </div>
        <button
          onClick={fetchRecommendations}
          className="p-2 hover:bg-purple-100 rounded-full transition-colors"
          title="Refresh recommendations"
        >
          <RefreshCw className="w-5 h-5 text-purple-600" />
        </button>
      </div>

      {/* Perfect Day Achievement */}
      {isComplete && (
        <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-5xl">🎉</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-green-900 mb-1">
                Perfect 5×5×5 Day!
              </h3>
              <p className="text-green-700">
                You've covered all 5 defense systems across all 5 meal times. Outstanding work!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Summary */}
      {!isComplete && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-red-500" />
              <span className="text-xs font-semibold text-gray-600">Systems</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {currentProgress.systemsCovered}<span className="text-lg text-gray-500">/{currentProgress.totalSystems}</span>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs font-semibold text-gray-600">Foods</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {currentProgress.foodsConsumed}
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-gray-600">Meals</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {currentProgress.mealTimesCovered}<span className="text-lg text-gray-500">/{currentProgress.totalMealTimes}</span>
            </div>
          </div>
        </div>
      )}

      {/* Missing Systems */}
      {missingSystems.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Missing Defense Systems ({missingSystems.length})
          </h3>
          <MultiSystemBadge
            systems={missingSystems.map((system) => ({ system }))}
            size="md"
            variant="full"
          />
        </div>
      )}

      {/* Missing Meal Times */}
      {missingMealTimes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Missing Meal Times ({missingMealTimes.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {missingMealTimes.map((mealTime) => {
              const mealInfo = mealTimeLabels[mealTime];
              return (
                <div
                  key={mealTime}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                >
                  <span className="text-lg">{mealInfo.icon}</span>
                  <span className="font-medium text-blue-700">{mealInfo.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Superfood Highlights */}
      {superfoodHighlights.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-lg">⭐</span>
            Multi-System Superfoods
          </h3>
          <div className="space-y-2">
            {superfoodHighlights.slice(0, 3).map((food) => (
              <button
                key={food.id}
                onClick={() => onFoodClick?.({
                  id: food.id,
                  name: food.name,
                  category: food.category,
                  defenseSystems: food.systems.map(s => s.system),
                  servingSize: undefined,
                })}
                disabled={!onFoodClick}
                className={`w-full p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg text-left transition-all ${
                  onFoodClick ? 'hover:shadow-md hover:border-purple-300 cursor-pointer' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">{food.name}</span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                        {food.systemsCovered} systems
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {food.category}
                    </div>
                    <MultiSystemBadge
                      systems={food.systems.map((s) => ({ system: s.system }))}
                      size="sm"
                    />
                  </div>
                  {onFoodClick && (
                    <ChevronRight className="w-5 h-5 text-purple-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Foods */}
      {suggestedFoods.length > 0 && missingSystems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Suggested Foods to Complete Missing Systems
          </h3>
          <div className="space-y-2">
            {suggestedFoods.slice(0, 5).map((food) => (
              <button
                key={food.id}
                onClick={() => onFoodClick?.(food)}
                disabled={!onFoodClick}
                className={`w-full p-3 bg-white border border-gray-200 rounded-lg text-left transition-all ${
                  onFoodClick ? 'hover:shadow-md hover:border-gray-300 cursor-pointer' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{food.name}</div>
                    <div className="text-xs text-gray-500 mb-2">
                      {food.category}
                    </div>
                    {food.defenseSystems && food.defenseSystems.length > 0 && (
                      <MultiSystemBadge
                        systems={food.defenseSystems.map((system) => ({ system }))}
                        size="sm"
                      />
                    )}
                  </div>
                  {onFoodClick && (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {suggestedFoods.length === 0 && superfoodHighlights.length === 0 && !isComplete && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-gray-600">
            Log some foods to get personalized recommendations
          </p>
        </div>
      )}
    </div>
  );
}
