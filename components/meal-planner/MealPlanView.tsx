'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  ChefHat, 
  Plus, 
  Shuffle, 
  MoreVertical,
  Copy,
  Trash2,
  ShoppingCart,
  Utensils,
  Timer,
  Target,
  Sparkles
} from 'lucide-react';
import { DefenseSystem, Meal, DefenseSystemInfo } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import MealCard from './MealCard';

interface MealPlanViewProps {
  meals: Meal[];
  onMealUpdate: (mealId: string, updates: Partial<Meal>) => void;
  onMealDelete: (mealId: string) => void;
  onMealCopy: (meal: Meal) => void;
  onAddMeal: (day: string, slot: string) => void;
  onRegenerateMeal: (mealId: string) => void;
  onViewRecipe: (recipeId: string) => void;
  onGenerateShoppingList: () => void;
  onBulkRegenerate: (day: string) => void;
  isGenerating?: boolean;
  className?: string;
}

interface DayStats {
  totalMeals: number;
  totalTime: number;
  totalServings: number;
  defenseSystems: DefenseSystemInfo[];
}

export default function MealPlanView({
  meals,
  onMealUpdate,
  onMealDelete,
  onMealCopy,
  onAddMeal,
  onRegenerateMeal,
  onViewRecipe,
  onGenerateShoppingList,
  onBulkRegenerate,
  isGenerating = false,
  className = '',
}: MealPlanViewProps) {
  const [selectedDay, setSelectedDay] = useState<string>('monday');
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [showStats, setShowStats] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const daysOfWeek = [
    { key: 'monday', label: 'Monday', short: 'Mon' },
    { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { key: 'thursday', label: 'Thursday', short: 'Thu' },
    { key: 'friday', label: 'Friday', short: 'Fri' },
    { key: 'saturday', label: 'Saturday', short: 'Sat' },
    { key: 'sunday', label: 'Sunday', short: 'Sun' },
  ];

  const mealSlots = [
    { key: 'breakfast', label: 'Breakfast', icon: '🌅', time: '8:00 AM' },
    { key: 'lunch', label: 'Lunch', icon: '☀️', time: '12:30 PM' },
    { key: 'dinner', label: 'Dinner', icon: '🌙', time: '6:30 PM' },
    { key: 'snack', label: 'Snack', icon: '🍎', time: 'Anytime' },
  ];

  // Group meals by day
  const mealsByDay = meals.reduce((acc, meal) => {
    if (!acc[meal.day]) {
      acc[meal.day] = {};
    }
    if (!acc[meal.day][meal.slot]) {
      acc[meal.day][meal.slot] = [];
    }
    acc[meal.day][meal.slot].push(meal);
    return acc;
  }, {} as Record<string, Record<string, Meal[]>>);

  // Calculate day statistics
  const calculateDayStats = (day: string): DayStats => {
    const dayMeals = mealsByDay[day] || {};
    const allMeals = Object.values(dayMeals).flat();
    
    // Get unique defense systems from all meals
    const uniqueSystemIds = new Set<DefenseSystem>();
    allMeals.forEach(meal => {
      meal.defenseSystems?.forEach(system => uniqueSystemIds.add(system));
    });
    
    const systemInfos = Array.from(uniqueSystemIds).map(systemId => {
      const systemInfo = Object.values(DEFENSE_SYSTEMS).find(info => info.name === systemId);
      return systemInfo ? { ...systemInfo, id: systemId } : null;
    }).filter(Boolean) as DefenseSystemInfo[];
    
    return {
      totalMeals: allMeals.length,
      totalTime: allMeals.reduce((sum: number, meal: Meal) => sum + (meal.cookTime || 0), 0),
      totalServings: allMeals.reduce((sum: number, meal: Meal) => sum + (meal.servings || 1), 0),
      defenseSystems: systemInfos,
    };
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          navigateDay(-1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigateDay(1);
          break;
        case 'Tab':
          if (event.shiftKey) {
            event.preventDefault();
            setViewMode(viewMode === 'week' ? 'day' : 'week');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDay, viewMode]);

  const navigateDay = (direction: number) => {
    const currentIndex = daysOfWeek.findIndex(day => day.key === selectedDay);
    const newIndex = (currentIndex + direction + daysOfWeek.length) % daysOfWeek.length;
    setSelectedDay(daysOfWeek[newIndex].key);
  };

  const renderEmptySlot = (day: string, slot: string) => {
    const slotInfo = mealSlots.find(s => s.key === slot);
    const slotLabel = slotInfo?.label || slot;
    const slotIcon = slotInfo?.icon || '🍽️';
    
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center group hover:border-green-200 hover:bg-green-50/50 transition-all">
        <div className="text-gray-400 group-hover:text-green-500 mb-3 transition-colors">
          <div className="w-12 h-12 mx-auto bg-gray-100 group-hover:bg-green-100 rounded-full flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6" />
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-1">No {slotLabel.toLowerCase()} planned</p>
        <p className="text-xs text-gray-400 mb-3">Click below to add a meal or snack</p>
        <button
          onClick={() => onAddMeal(day, slot)}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm hover:shadow-md"
        >
          <span className="text-base">{slotIcon}</span>
          <Plus className="w-4 h-4" />
          <span>Add {slotLabel}</span>
        </button>
      </div>
    );
  };

  const renderDayColumn = (day: typeof daysOfWeek[0]) => {
    const dayStats = calculateDayStats(day.key);
    const hasAnyMeals = dayStats.totalMeals > 0;

    return (
      <div key={day.key} className="flex-1 min-w-0">
        {/* Day Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{day.label}</h3>
            <div className="flex items-center gap-2">
              {hasAnyMeals && (
                <button
                  onClick={() => onBulkRegenerate(day.key)}
                  disabled={isGenerating}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Regenerate all meals for this day"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Show day statistics"
              >
                <Target className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day Stats */}
          {showStats && hasAnyMeals && (
            <div className="text-xs text-gray-600 space-y-1 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Utensils className="w-3 h-3" />
                <span>{dayStats.totalMeals} meals</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-3 h-3" />
                <span>{dayStats.totalTime} min total</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3" />
                <span>{dayStats.totalServings} servings</span>
              </div>
              {dayStats.defenseSystems.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Target className="w-3 h-3" />
                  <div className="flex gap-1 flex-wrap">
                    {dayStats.defenseSystems.slice(0, 3).map((system) => (
                      <span
                        key={system.id}
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: system.color }}
                        title={system.name}
                      />
                    ))}
                    {dayStats.defenseSystems.length > 3 && (
                      <span className="text-xs">+{dayStats.defenseSystems.length - 3}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Meal Slots */}
        <div className="space-y-4">
          {mealSlots.map((slot) => {
            const slotMeals = mealsByDay[day.key]?.[slot.key] || [];

            return (
              <div key={slot.key} className="space-y-3">
                {/* Slot Header */}
                <div className="flex items-center gap-2 px-2">
                  <span className="text-lg">{slot.icon}</span>
                  <h4 className="font-medium text-gray-900">{slot.label}</h4>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {slot.time}
                  </span>
                </div>

                {/* Meals or Empty Slot */}
                {slotMeals.length > 0 ? (
                  <div className="space-y-3">
                    {slotMeals.map((meal, index) => (
                      <MealCard
                        key={meal.id}
                        meal={{
                          ...meal,
                          mealType: slot.key,
                          prepTime: meal.prepTime?.toString(),
                          cookTime: meal.cookTime?.toString(),
                        }}
                        dayIndex={daysOfWeek.findIndex(d => d.key === day.key)}
                        mealIndex={index}
                        onMealUpdate={(dayIndex: number, mealIndex: number, updates: any) => {
                          onMealUpdate(meal.id, updates);
                        }}
                        onGenerateRecipe={() => onRegenerateMeal(meal.id)}
                        onViewRecipe={onViewRecipe}
                        isGeneratingRecipe={isGenerating}
                      />
                    ))}
                    
                    {/* Add Another Meal Button (especially useful for snacks) */}
                    <button
                      onClick={() => onAddMeal(day.key, slot.key)}
                      disabled={isGenerating}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-600 hover:border-green-500 hover:bg-green-50 hover:text-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                    >
                      <div className="w-6 h-6 bg-gray-100 group-hover:bg-green-200 rounded-full flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Add Another {slot.label}</span>
                    </button>
                  </div>
                ) : (
                  renderEmptySlot(day.key, slot.key)
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const currentDay = daysOfWeek.find(day => day.key === selectedDay);
    if (!currentDay) return null;

    return (
      <div className="max-w-2xl mx-auto">
        {/* Day Navigation */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <button
            onClick={() => navigateDay(-1)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Previous day"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900">{currentDay.label}</h3>
            <p className="text-sm text-gray-500">Use arrow keys to navigate</p>
          </div>

          <button
            onClick={() => navigateDay(1)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Next day"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {renderDayColumn(currentDay)}
      </div>
    );
  };

  const renderWeekView = () => (
    <div 
      ref={scrollRef}
      className="overflow-x-auto"
    >
      <div className="flex gap-4 min-w-max pb-4">
        {daysOfWeek.map(renderDayColumn)}
      </div>
    </div>
  );

  return (
    <div className={`${className}`}>
      {/* View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {/* View Mode Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${viewMode === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              Week View
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${viewMode === 'day'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              Day View
            </button>
          </div>

          {/* Day Selector for Mobile */}
          {viewMode === 'day' && (
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="sm:hidden px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {daysOfWeek.map((day) => (
                <option key={day.key} value={day.key}>
                  {day.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${showStats
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Stats
          </button>

          <button
            onClick={onGenerateShoppingList}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Shopping List
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-green-600 animate-pulse" />
              <h3 className="font-semibold text-gray-900">Generating Meals</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Creating your personalized meal plan...
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
        {viewMode === 'week' ? renderWeekView() : renderDayView()}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <span className="hidden sm:inline">
          Use arrow keys to navigate days • 
        </span>
        <span className="hidden sm:inline"> Shift+Tab to switch views • </span>
        Scroll horizontally in week view on mobile
      </div>
    </div>
  );
}