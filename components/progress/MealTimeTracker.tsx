'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, Check, Clock } from 'lucide-react';

export type MealTime = 'BREAKFAST' | 'MORNING_SNACK' | 'LUNCH' | 'AFTERNOON_SNACK' | 'DINNER';

interface FoodConsumption {
  id: string;
  foodName: string;
  mealTime: MealTime;
  consumedAt: Date;
  quantity?: number;
  unit?: string;
  systemBenefits: {
    system: string;
    strength: string;
  }[];
}

interface MealTimeTrackerProps {
  date: Date;
  consumptions?: FoodConsumption[];
  onMealClick?: (mealTime: MealTime) => void;
  className?: string;
}

const mealTimeConfig = {
  BREAKFAST: {
    label: 'Breakfast',
    icon: '🌅',
    time: '7-9 AM',
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    activeColor: 'bg-orange-500 text-white',
    hoverColor: 'hover:bg-orange-200',
  },
  MORNING_SNACK: {
    label: 'Morning Snack',
    icon: '☕',
    time: '10-11 AM',
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    activeColor: 'bg-amber-500 text-white',
    hoverColor: 'hover:bg-amber-200',
  },
  LUNCH: {
    label: 'Lunch',
    icon: '🌞',
    time: '12-2 PM',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    activeColor: 'bg-yellow-500 text-white',
    hoverColor: 'hover:bg-yellow-200',
  },
  AFTERNOON_SNACK: {
    label: 'Afternoon Snack',
    icon: '🍎',
    time: '3-4 PM',
    color: 'bg-lime-100 text-lime-700 border-lime-300',
    activeColor: 'bg-lime-500 text-white',
    hoverColor: 'hover:bg-lime-200',
  },
  DINNER: {
    label: 'Dinner',
    icon: '🌙',
    time: '6-8 PM',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    activeColor: 'bg-indigo-500 text-white',
    hoverColor: 'hover:bg-indigo-200',
  },
} as const;

const mealTimeOrder: MealTime[] = [
  'BREAKFAST',
  'MORNING_SNACK',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER',
];

export default function MealTimeTracker({
  date,
  consumptions = [],
  onMealClick,
  className = '',
}: MealTimeTrackerProps) {
  // Use useMemo to calculate stats without causing re-renders
  const mealStats = useMemo(() => {
    const stats: Record<MealTime, { count: number; foods: string[] }> = {
      BREAKFAST: { count: 0, foods: [] },
      MORNING_SNACK: { count: 0, foods: [] },
      LUNCH: { count: 0, foods: [] },
      AFTERNOON_SNACK: { count: 0, foods: [] },
      DINNER: { count: 0, foods: [] },
    };

    consumptions.forEach((consumption) => {
      const mealTime = consumption.mealTime as MealTime;
      if (stats[mealTime]) {
        stats[mealTime].count++;
        if (!stats[mealTime].foods.includes(consumption.foodName)) {
          stats[mealTime].foods.push(consumption.foodName);
        }
      }
    });

    return stats;
  }, [consumptions]);

  const handleMealClick = (mealTime: MealTime) => {
    onMealClick?.(mealTime);
  };

  const completedMeals = mealTimeOrder.filter(
    (mealTime) => mealStats[mealTime].count > 0
  ).length;
  const completionPercentage = (completedMeals / mealTimeOrder.length) * 100;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily Meal Timeline</h2>
          <p className="text-sm text-gray-500 mt-1">
            {format(date, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            {completedMeals}<span className="text-xl text-gray-500">/5</span>
          </div>
          <div className="text-xs text-gray-500">meals logged</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 via-yellow-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Meal Time Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {mealTimeOrder.map((mealTime, index) => {
          const config = mealTimeConfig[mealTime];
          const stats = mealStats[mealTime];
          const isCompleted = stats.count > 0;
          const isClickable = !!onMealClick;

          return (
            <button
              key={mealTime}
              onClick={() => handleMealClick(mealTime)}
              disabled={!isClickable}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                ${isCompleted ? config.activeColor : config.color}
                ${isClickable && !isCompleted ? config.hoverColor : ''}
                ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                ${isClickable ? 'transform hover:scale-105' : ''}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              `}
            >
              {/* Completion Check */}
              {isCompleted && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Icon */}
              <div className="text-3xl mb-2">{config.icon}</div>

              {/* Label */}
              <div className={`font-semibold text-sm mb-1 ${isCompleted ? 'text-white' : ''}`}>
                {config.label}
              </div>

              {/* Time */}
              <div className={`flex items-center justify-center gap-1 text-xs mb-2 ${isCompleted ? 'text-white/90' : 'text-gray-600'}`}>
                <Clock className="w-3 h-3" />
                <span>{config.time}</span>
              </div>

              {/* Stats */}
              {isCompleted ? (
                <div className="space-y-1">
                  <div className={`text-xs font-medium ${isCompleted ? 'text-white' : 'text-gray-700'}`}>
                    {stats.count} {stats.count === 1 ? 'food' : 'foods'}
                  </div>
                  {stats.foods.length > 0 && (
                    <div className={`text-xs ${isCompleted ? 'text-white/80' : 'text-gray-500'} truncate`}>
                      {stats.foods.slice(0, 2).join(', ')}
                      {stats.foods.length > 2 && '...'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                  <Plus className="w-3 h-3" />
                  <span>Add Food</span>
                </div>
              )}

              {/* Connection Line (except last one) */}
              {index < mealTimeOrder.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-[0.65rem] w-3 h-0.5 bg-gray-300 z-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {completedMeals === 0 && 'No meals logged yet'}
            {completedMeals > 0 && completedMeals < 5 && `${5 - completedMeals} meal${5 - completedMeals === 1 ? '' : 's'} remaining`}
            {completedMeals === 5 && '🎉 All meals logged!'}
          </span>
          {completedMeals === 5 && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              5×5×5 Complete
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
