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
  duration?: number; // Number of weeks (1-4)
  onMealUpdate: (mealId: string, updates: Partial<Meal>) => void;
  onMealDelete: (mealId: string) => void;
  onMealCopy: (meal: Meal) => void;
  onAddMeal: (day: string, slot: string, mealType?: string, week?: number) => void;
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
  duration = 1,
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
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'day' | 'calendar' | 'month'>('calendar');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Detect if it's a multi-week plan
  const isMultiWeek = duration > 1;

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
    // Snack is now handled separately in dedicated section below
  ];

  // Group meals by week and day
  // Normalize snack slots (morning-snack, afternoon-snack, evening-snack → snack)
  const mealsByWeekAndDay = meals.reduce((acc, meal) => {
    const week = meal.week || 1;
    if (!acc[week]) {
      acc[week] = {};
    }
    if (!acc[week][meal.day]) {
      acc[week][meal.day] = {};
    }
    
    // Normalize all snack types to 'snack' for display grouping
    const displaySlot = meal.slot?.includes('snack') ? 'snack' : (meal.slot || 'breakfast');
    
    if (!acc[week][meal.day][displaySlot]) {
      acc[week][meal.day][displaySlot] = [];
    }
    acc[week][meal.day][displaySlot].push(meal);
    return acc;
  }, {} as Record<number, Record<string, Record<string, Meal[]>>>);

  // Debug logging
  console.log('📊 MealPlanView - Total meals received:', meals.length);
  console.log('📊 MealPlanView - Weeks in grouped data:', Object.keys(mealsByWeekAndDay));
  console.log('📊 MealPlanView - Duration (weeks):', duration);
  console.log('📊 MealPlanView - Sample meals:', meals.slice(0, 5).map(m => ({ week: m.week, day: m.day, slot: m.slot, name: m.mealName })));

  // Also keep the old structure for backward compatibility (first week only)
  const mealsByDay = mealsByWeekAndDay[selectedWeek] || {};

  // Calculate day statistics for a specific week
  const calculateDayStats = (day: string, week: number = selectedWeek): DayStats => {
    const dayMeals = mealsByWeekAndDay[week]?.[day] || {};
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

  // Helper function to get snack type icon for compact views
  const getSnackTypeIcon = (slot?: string) => {
    if (!slot || !slot.includes('snack')) return null;
    
    switch (slot) {
      case 'morning-snack':
        return '☀️';
      case 'afternoon-snack':
        return '🌤️';
      case 'evening-snack':
        return '🌙';
      case 'snack':
        return '⏰';
      default:
        return null;
    }
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
            // Cycle through view modes - include month for multi-week plans
            const modes: Array<'day' | 'calendar' | 'month'> = isMultiWeek 
              ? ['day', 'calendar', 'month']
              : ['day', 'calendar'];
            const currentIndex = modes.indexOf(viewMode);
            const nextIndex = (currentIndex + 1) % modes.length;
            setViewMode(modes[nextIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDay, viewMode]);

  const navigateDay = (direction: number) => {
    // Calculate current absolute day index (0-based): week * 7 + day_of_week
    const currentDayIndex = daysOfWeek.findIndex(day => day.key === selectedDay);
    const currentAbsoluteDay = (selectedWeek - 1) * 7 + currentDayIndex;
    
    // Calculate new absolute day index
    const totalDays = duration * 7;
    const newAbsoluteDay = (currentAbsoluteDay + direction + totalDays) % totalDays;
    
    // Convert back to week and day
    const newWeek = Math.floor(newAbsoluteDay / 7) + 1;
    const newDayIndex = newAbsoluteDay % 7;
    
    setSelectedWeek(newWeek);
    setSelectedDay(daysOfWeek[newDayIndex].key);
  };

  const renderEmptySlot = (day: string, slot: string, weekNum: number = selectedWeek) => {
    const slotInfo = mealSlots.find(s => s.key === slot);
    const slotLabel = slotInfo?.label || slot;
    const slotIcon = slotInfo?.icon || '🍽️';
    
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center group hover:border-green-200 hover:bg-green-50/50 transition-all">
        <div className="text-gray-400 dark:text-gray-300 group-hover:text-green-500 mb-3 transition-colors">
          <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-700 group-hover:bg-green-100 rounded-full flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6" />
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-300 text-sm mb-1">No {slotLabel.toLowerCase()} planned</p>
        <p className="text-xs text-gray-400 dark:text-gray-300 mb-3">Click below to add a meal or snack</p>
        <button
          onClick={() => onAddMeal(day, slot, undefined, weekNum)}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm hover:shadow-md"
        >
          <span className="text-base">{slotIcon}</span>
          <Plus className="w-4 h-4" />
          <span>Add Meal or Snack</span>
        </button>
      </div>
    );
  };

  const renderDayColumn = (day: typeof daysOfWeek[0], dayMealsOverride?: Record<string, Meal[]>, weekNum: number = selectedWeek) => {
    const dayMealsToUse = dayMealsOverride || mealsByDay[day.key] || {};
    const dayStats = calculateDayStats(day.key, weekNum);
    const hasAnyMeals = dayStats.totalMeals > 0;

    return (
      <div key={day.key} className="flex-1 min-w-0">
        {/* Day Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{day.label}</h3>
            <div className="flex items-center gap-2">
              {hasAnyMeals && (
                <button
                  onClick={() => onBulkRegenerate(day.key)}
                  disabled={isGenerating}
                  className="p-1 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:text-gray-200 transition-colors"
                  title="Regenerate all meals for this day"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Meal Slots */}
        <div className="space-y-4">
          {mealSlots.map((slot) => {
            const slotMeals = dayMealsToUse[slot.key] || [];

            return (
              <div key={slot.key} className="space-y-3">
                {/* Slot Header */}
                <div className="flex items-center gap-2 px-2">
                  <span className="text-lg">{slot.icon}</span>
                  <h4 className="font-medium text-gray-900 dark:text-white">{slot.label}</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
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
                        isPrimary={index === 0} // First meal is primary
                        onMealUpdate={(dayIndex: number, mealIndex: number, updates: any) => {
                          onMealUpdate(meal.id, updates);
                        }}
                        onGenerateRecipe={() => onRegenerateMeal(meal.id)}
                        onViewRecipe={onViewRecipe}
                        isGeneratingRecipe={isGenerating}
                      />
                    ))}
                    
                    {/* Add Another Meal Button */}
                    <button
                      onClick={() => onAddMeal(day.key, slot.key, undefined, weekNum)}
                      disabled={isGenerating}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-200 hover:border-green-500 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                    >
                      <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 group-hover:bg-green-200 dark:group-hover:bg-green-800 rounded-full flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Add Extra Meal</span>
                    </button>
                  </div>
                ) : (
                  renderEmptySlot(day.key, slot.key, weekNum)
                )}
              </div>
            );
          })}

          {/* Dedicated Snacks Section */}
          <div className="space-y-3 pt-4 border-t-2 border-gray-300 dark:border-gray-600 mt-6">
            {/* Snacks Header */}
            <div className="flex items-center gap-2 px-2">
              <span className="text-lg">🍎</span>
              <h4 className="font-medium text-gray-900 dark:text-white">Snacks</h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">Throughout the day</span>
            </div>

            {/* Snacks */}
            {dayMealsToUse['snack'] && dayMealsToUse['snack'].length > 0 ? (
              <div className="space-y-3">
                {dayMealsToUse['snack'].map((meal, index) => (
                  <MealCard
                    key={meal.id}
                    meal={{
                      ...meal,
                      mealType: 'snack',
                      prepTime: meal.prepTime?.toString(),
                      cookTime: meal.cookTime?.toString(),
                    }}
                    dayIndex={daysOfWeek.findIndex(d => d.key === day.key)}
                    mealIndex={index}
                    isPrimary={true} // All snacks are primary (show MAIN badge)
                    onMealUpdate={(dayIndex: number, mealIndex: number, updates: any) => {
                      onMealUpdate(meal.id, updates);
                    }}
                    onGenerateRecipe={() => onRegenerateMeal(meal.id)}
                    onViewRecipe={onViewRecipe}
                    isGeneratingRecipe={isGenerating}
                  />
                ))}
                
                {/* Add Another Snack Button */}
                <button
                  onClick={() => onAddMeal(day.key, 'snack', undefined, weekNum)}
                  disabled={isGenerating}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-200 hover:border-green-500 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 group-hover:bg-green-200 dark:group-hover:bg-green-800 rounded-full flex items-center justify-center transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Add Snack</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddMeal(day.key, 'snack', undefined, weekNum)}
                disabled={isGenerating}
                className="w-full px-6 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 group-hover:bg-green-200 dark:group-hover:bg-green-800 rounded-full flex items-center justify-center transition-colors">
                    <span className="text-2xl">🍎</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white mb-1">Add Your First Snack</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Keep your energy up throughout the day</div>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const currentDay = daysOfWeek.find(day => day.key === selectedDay);
    if (!currentDay) return null;

    // Calculate day number for multi-week plans
    const currentDayIndex = daysOfWeek.findIndex(day => day.key === selectedDay);
    const absoluteDayNumber = (selectedWeek - 1) * 7 + currentDayIndex + 1;

    return (
      <div className="max-w-2xl mx-auto">
        {/* Day Navigation */}
        <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <button
            onClick={() => navigateDay(-1)}
            className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Previous day"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{currentDay.label}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {duration > 1 ? `Week ${selectedWeek} • Day ${absoluteDayNumber}/${duration * 7}` : 'Use arrow keys to navigate'}
            </p>
          </div>

          <button
            onClick={() => navigateDay(1)}
            className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:text-gray-200 transition-colors"
            aria-label="Next day"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {renderDayColumn(currentDay, mealsByWeekAndDay[selectedWeek]?.[currentDay.key], selectedWeek)}
      </div>
    );
  };

  const renderWeekView = () => (
    <div className="space-y-6">
      {/* Iterate through all weeks */}
      {Array.from({ length: duration }, (_, weekIndex) => {
        const weekNum = weekIndex + 1;
        
        return (
          <div key={weekNum}>
            {/* Week Header (only show for multi-week plans) */}
            {duration > 1 && (
              <div className="sticky top-0 z-[1] bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Week {weekNum}
                </h3>
              </div>
            )}
            
            {/* Week scroll container */}
            <div 
              ref={weekNum === 1 ? scrollRef : undefined}
              className="overflow-x-auto"
            >
              <div className="flex gap-4 min-w-max pb-4">
                {daysOfWeek.map((day) => {
                  // Temporarily override selectedWeek for rendering this week
                  const originalWeek = selectedWeek;
                  const dayMeals = mealsByWeekAndDay[weekNum]?.[day.key] || {};
                  
                  return (
                    <div key={`${weekNum}-${day.key}`}>
                      {renderDayColumn(day, dayMeals, weekNum)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => {
    // Create a chronological list of all meals across all weeks
    const allMeals: Array<{ week: number; day: string; dayLabel: string; slot: string; slotInfo: any; meal: Meal; isPrimary: boolean }> = [];
    
    // All meal/snack slots to iterate through
    const allSlots = [
      { key: 'breakfast', label: 'Breakfast', icon: '🌅', time: '8:00 AM' },
      { key: 'lunch', label: 'Lunch', icon: '☀️', time: '12:30 PM' },
      { key: 'dinner', label: 'Dinner', icon: '🌙', time: '6:30 PM' },
      { key: 'snack', label: 'Snack', icon: '🍎', time: 'Anytime' },
    ];
    
    // Iterate through all weeks
    for (let weekNum = 1; weekNum <= duration; weekNum++) {
      daysOfWeek.forEach((day) => {
        allSlots.forEach((slot) => {
          const slotMeals = mealsByWeekAndDay[weekNum]?.[day.key]?.[slot.key] || [];
          slotMeals.forEach((meal, index) => {
            // All snacks are primary, meals use index === 0
            const isPrimary = slot.key === 'snack' ? true : index === 0;
            allMeals.push({
              week: weekNum,
              day: day.key,
              dayLabel: day.label,
              slot: slot.key,
              slotInfo: slot,
              meal,
              isPrimary,
            });
          });
        });
      });
    }

    if (allMeals.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-300 mb-4">
            <Utensils className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No meals planned yet</h3>
          <p className="text-gray-600 dark:text-gray-200 mb-4">Start by adding meals to your weekly plan</p>
        </div>
      );
    }

    // Group meals by week for better organization
    const mealsByWeek = allMeals.reduce((acc, item) => {
      if (!acc[item.week]) {
        acc[item.week] = [];
      }
      acc[item.week].push(item);
      return acc;
    }, {} as Record<number, typeof allMeals>);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {Object.entries(mealsByWeek).map(([weekNumStr, weekMeals]) => {
          const weekNum = parseInt(weekNumStr);
          return (
            <div key={weekNum} className="space-y-3">
              {/* Week Header (only show for multi-week plans) */}
              {duration > 1 && (
                <div className="sticky top-0 z-[1] bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Week {weekNum}
                  </h3>
                </div>
              )}

              {weekMeals.map(({ week, day, dayLabel, slot, slotInfo, meal, isPrimary }, index) => (
                <div 
                  key={`${week}-${day}-${slot}-${meal.id}-${index}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Day & Time Info */}
                    <div className="flex-shrink-0 text-center min-w-[80px]">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{dayLabel}</div>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="text-base">{slotInfo.icon}</span>
                        <Clock className="w-3 h-3" />
                        {slotInfo.time}
                      </div>
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-200 mt-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {slotInfo.label}
                      </div>
                    </div>

                    {/* Meal Card */}
                    <div className="flex-1 min-w-0">
                      <MealCard
                        meal={{
                          ...meal,
                          mealType: slot,
                          prepTime: meal.prepTime?.toString(),
                          cookTime: meal.cookTime?.toString(),
                        }}
                        dayIndex={daysOfWeek.findIndex(d => d.key === day)}
                        mealIndex={index}
                        isPrimary={isPrimary}
                        onMealUpdate={(dayIndex: number, mealIndex: number, updates: any) => {
                          onMealUpdate(meal.id, updates);
                        }}
                        onGenerateRecipe={() => onRegenerateMeal(meal.id)}
                        onViewRecipe={onViewRecipe}
                        isGeneratingRecipe={isGenerating}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const renderCalendarView = () => {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Iterate through all weeks */}
        {Array.from({ length: duration }, (_, weekIndex) => {
          const weekNum = weekIndex + 1;
          
          return (
            <div key={weekNum}>
              {/* Week Header (only show for multi-week plans) */}
              {duration > 1 && (
                <div className="sticky top-0 z-[1] bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Week {weekNum}
                  </h3>
                </div>
              )}

              {/* Calendar Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {daysOfWeek.map((day) => {
                  const dayStats = calculateDayStats(day.key, weekNum);
                  const hasAnyMeals = dayStats.totalMeals > 0;

                  return (
                    <div 
                      key={`${weekNum}-${day.key}`}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Day Header */}
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{day.label}</h3>
                            {hasAnyMeals && (
                              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <Utensils className="w-3 h-3" />
                                  {dayStats.totalMeals}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Timer className="w-3 h-3" />
                                  {dayStats.totalTime}m
                                </span>
                              </div>
                            )}
                          </div>
                          {hasAnyMeals && (
                            <button
                              onClick={() => onBulkRegenerate(day.key)}
                              disabled={isGenerating}
                              className="p-1.5 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all"
                              title="Regenerate all meals"
                            >
                              <Shuffle className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Defense Systems Indicators */}
                        {dayStats.defenseSystems.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            {dayStats.defenseSystems.slice(0, 5).map((system) => (
                              <div
                                key={system.id}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                                style={{ 
                                  backgroundColor: `${system.color}20`,
                                  color: system.color
                                }}
                                title={system.name}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: system.color }} />
                                <span className="font-medium">{system.name.slice(0, 3)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Meals Compact View */}
                      <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
                        {mealSlots.map((slot) => {
                          const slotMeals = mealsByWeekAndDay[weekNum]?.[day.key]?.[slot.key] || [];
                    
                          if (slotMeals.length === 0) {
                            return (
                              <button
                                key={slot.key}
                                onClick={() => onAddMeal(day.key, slot.key, undefined, weekNum)}
                                disabled={isGenerating}
                                className="w-full px-3 py-2 border border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                <span>{slot.icon}</span>
                                <Plus className="w-3 h-3" />
                                <span>Add {slot.label}</span>
                              </button>
                            );
                          }

                          return (
                            <div key={slot.key} className="space-y-2">
                              {slotMeals.map((meal, index) => (
                                <div
                                  key={meal.id}
                                  className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 hover:border-gray-200 dark:hover:border-gray-500 transition-colors group cursor-pointer"
                                  onClick={() => meal.recipeId && onViewRecipe(meal.recipeId)}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="text-sm flex-shrink-0">{slot.icon}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-semibold text-gray-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400">
                                        {meal.mealName}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {meal.cookTime && (
                                          <span className="flex items-center gap-0.5">
                                            <Clock className="w-2.5 h-2.5" />
                                            {meal.cookTime}m
                                          </span>
                                        )}
                                        {meal.defenseSystems && meal.defenseSystems.length > 0 && (
                                          <span className="flex items-center gap-0.5">
                                            <Target className="w-2.5 h-2.5" />
                                            {meal.defenseSystems.length}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {!meal.recipeGenerated && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onRegenerateMeal(meal.id);
                                        }}
                                        disabled={isGenerating}
                                        className="flex-shrink-0 p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                                        title="Generate recipe"
                                      >
                                        <Sparkles className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}

                        {/* Dedicated Snacks Section in Calendar */}
                        {(() => {
                          const snackMeals = mealsByWeekAndDay[weekNum]?.[day.key]?.['snack'] || [];
                          
                          if (snackMeals.length === 0) {
                            return (
                              <button
                                key="snack-section"
                                onClick={() => onAddMeal(day.key, 'snack', undefined, weekNum)}
                                disabled={isGenerating}
                                className="w-full px-3 py-2 border border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mt-2 border-t-2"
                              >
                                <span>🍎</span>
                                <Plus className="w-3 h-3" />
                                <span>Add Snack</span>
                              </button>
                            );
                          }

                          return (
                            <div key="snack-section" className="space-y-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                              {snackMeals.map((meal) => {
                                const snackTypeIcon = getSnackTypeIcon(meal.slot);
                                return (
                                  <div
                                    key={meal.id}
                                    className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 hover:border-gray-200 dark:hover:border-gray-500 transition-colors group cursor-pointer"
                                    onClick={() => meal.recipeId && onViewRecipe(meal.recipeId)}
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="text-sm flex-shrink-0">{snackTypeIcon || '🍎'}</span>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-gray-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400">
                                        {meal.mealName}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {meal.cookTime && (
                                          <span className="flex items-center gap-0.5">
                                            <Clock className="w-2.5 h-2.5" />
                                            {meal.cookTime}m
                                          </span>
                                        )}
                                        {meal.defenseSystems && meal.defenseSystems.length > 0 && (
                                          <span className="flex items-center gap-0.5">
                                            <Target className="w-2.5 h-2.5" />
                                            {meal.defenseSystems.length}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {!meal.recipeGenerated && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onRegenerateMeal(meal.id);
                                        }}
                                        disabled={isGenerating}
                                        className="flex-shrink-0 p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                                        title="Generate recipe"
                                      >
                                        <Sparkles className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    if (!isMultiWeek) return null;
    
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Week Tabs */}
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: duration }, (_, i) => i + 1).map((weekNum) => (
            <button
              key={weekNum}
              onClick={() => setSelectedWeek(weekNum)}
              className={`
                px-6 py-3 rounded-lg font-semibold transition-all
                ${selectedWeek === weekNum
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              Week {weekNum}
            </button>
          ))}
        </div>

        {/* Week Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {daysOfWeek.map((day) => {
              const dayMeals = meals.filter(m => m.day === day.key && (m.week || 1) === selectedWeek);
              const dayStats = calculateDayStats(day.key, selectedWeek);
              
              return (
                <div
                  key={day.key}
                  className="border-2 border-gray-100 dark:border-gray-700 rounded-lg p-4 hover:border-green-200 dark:hover:border-green-700 hover:shadow-md transition-all bg-white dark:bg-gray-800"
                >
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">{day.label}</h4>
                  
                  {/* Meal slots */}
                  <div className="space-y-2">
                    {mealSlots.map((slot) => {
                      const slotMeals = dayMeals.filter(m => m.slot === slot.key);
                      
                      if (slotMeals.length === 0) {
                        return (
                          <button
                            key={slot.key}
                            onClick={() => onAddMeal(day.key, slot.key, undefined, selectedWeek)}
                            className="w-full text-left px-2 py-1.5 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-500 dark:text-gray-300 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-1"
                          >
                            <span>{slot.icon}</span>
                            <Plus className="w-3 h-3" />
                            <span>Add Meal or Snack</span>
                          </button>
                        );
                      }
                      
                      return (
                        <div key={slot.key} className="space-y-1">
                          {slotMeals.map((meal) => (
                            <div
                              key={meal.id}
                              className="px-2 py-1.5 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded text-xs cursor-pointer hover:shadow-sm transition-shadow border dark:border-gray-700"
                              onClick={() => meal.recipeId && onViewRecipe(meal.recipeId)}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                <span>{slot.icon}</span>
                                <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                                  {slot.label}
                                </span>
                              </div>
                              <div className="text-gray-900 dark:text-white font-semibold truncate">
                                {meal.mealName}
                              </div>
                              {meal.cookTime && (
                                <div className="text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {meal.cookTime}m
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Week Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">Total Meals</div>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              {meals.filter(m => (m.week || 1) === selectedWeek).length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">Avg Cook Time</div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {Math.round(
                meals.filter(m => (m.week || 1) === selectedWeek && m.cookTime)
                  .reduce((sum, m) => sum + (m.cookTime || 0), 0) /
                (meals.filter(m => (m.week || 1) === selectedWeek && m.cookTime).length || 1)
              )}m
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-1">This Week</div>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              Week {selectedWeek}/{duration}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`${className}`}>
      {/* View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
          {/* View Mode Tabs */}
          <div className="flex flex-wrap bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('day')}
              className={`
                px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                ${viewMode === 'day'
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'
                }
              `}
              title="View one day at a time"
            >
              📅 Day
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`
                px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                ${viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'
                }
              `}
              title="View week in calendar grid"
            >
              🗓️ Week
            </button>
            {isMultiWeek && (
              <button
                onClick={() => setViewMode('month')}
                className={`
                  px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                  ${viewMode === 'month'
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
                title="View multi-week plan by month"
              >
                📖 Month
              </button>
            )}
          </div>

          {/* Day Selector for Day View */}
          {viewMode === 'day' && (
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-medium"
            >
              {daysOfWeek.map((day) => (
                <option key={day.key} value={day.key}>
                  {day.label}
                </option>
              ))}
            </select>
          )}

          {/* View Description */}
          <div className="text-xs text-gray-500 dark:text-gray-300 hidden lg:block">
            {viewMode === 'day' && '← Navigate through each day'}
            {viewMode === 'calendar' && '← Week overview at a glance'}
            {viewMode === 'month' && '← Multiple weeks view'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 border dark:border-gray-700 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400 animate-pulse" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Generating Meals</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Creating your personalized meal plan...
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`rounded-xl ${viewMode === 'month' ? 'bg-transparent' : 'bg-gray-50 dark:bg-gray-700 p-4 sm:p-6'}`}>
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'calendar' && renderCalendarView()}
        {viewMode === 'month' && renderMonthView()}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-300 text-center space-y-1">
        <div>
          <span className="hidden sm:inline">
            {viewMode === 'day' && '⬅️ ➡️ Navigate days • '}
            {viewMode === 'month' && 'Multi-week planning • '}
            Shift+Tab to cycle views
          </span>
        </div>
        <div className="text-green-600 dark:text-green-400 font-medium">
          {viewMode === 'day' && '✨ Focus on one day at a time'}
          {viewMode === 'calendar' && '✨ Quick overview of the entire week'}
          {viewMode === 'month' && '✨ View multiple weeks with week selector'}
        </div>
      </div>
    </div>
  );
}