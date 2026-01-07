'use client';

import React, { useState, useMemo } from 'react';
import { DefenseSystem } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { Plus, X, Check, Loader2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { Calendar } from '@/components/ui/Calendar';

interface ProgressTrackerProps {
  currentProgress?: {
    [key in DefenseSystem]?: {
      foods: string[];
      count: number;
      target?: number;
      percentage?: number;
    };
  };
  onLogFood?: (system: DefenseSystem, foods: string[], notes?: string) => Promise<void>;
  date?: Date;
  onDateChange?: (date: Date) => void;
  isHistoricalView?: boolean;
  daysWithProgress?: Date[];
}

export default function ProgressTracker({
  currentProgress = {},
  onLogFood,
  date = new Date(),
  onDateChange,
  isHistoricalView = false,
  daysWithProgress = [],
}: ProgressTrackerProps) {
  const [selectedSystem, setSelectedSystem] = useState<DefenseSystem | null>(null);
  const [foodInputs, setFoodInputs] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [foodSearch, setFoodSearch] = useState('');
  const [showAllFoods, setShowAllFoods] = useState(false);

  // Type guard for DEFENSE_SYSTEMS access
  const getSystemInfo = (system: DefenseSystem | null) => {
    if (!system) return null;
    return DEFENSE_SYSTEMS[system];
  };

  const handleAddFoodInput = () => {
    if (foodInputs.length < 5) {
      setFoodInputs([...foodInputs, '']);
    }
  };

  const handleRemoveFoodInput = (index: number) => {
    setFoodInputs(foodInputs.filter((_, i) => i !== index));
  };

  const handleFoodChange = (index: number, value: string) => {
    const newInputs = [...foodInputs];
    newInputs[index] = value;
    setFoodInputs(newInputs);
  };

  // Filter foods based on search
  const filteredFoods = useMemo(() => {
    if (!selectedSystem) return [];
    const systemInfo = DEFENSE_SYSTEMS[selectedSystem];
    if (!foodSearch.trim()) return systemInfo.keyFoods;
    
    const searchLower = foodSearch.toLowerCase();
    return systemInfo.keyFoods.filter(food => 
      food.toLowerCase().includes(searchLower)
    );
  }, [selectedSystem, foodSearch]);

  // Add a food from suggestions
  const handleAddSuggestedFood = (food: string) => {
    const emptyIndex = foodInputs.findIndex((f) => f === '');
    if (emptyIndex !== -1) {
      handleFoodChange(emptyIndex, food);
    } else if (foodInputs.length < 5) {
      setFoodInputs([...foodInputs, food]);
    }
    setFoodSearch(''); // Clear search after adding
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSystem || !onLogFood) {
      console.warn('onLogFood is not provided or selectedSystem is null');
      return;
    }

    const validFoods = foodInputs.filter((food) => food.trim() !== '');

    if (validFoods.length === 0) return;

    setIsSubmitting(true);

    try {
      await onLogFood(selectedSystem, validFoods, notes);

      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // Reset form
      setSelectedSystem(null);
      setFoodInputs(['']);
      setNotes('');
      setFoodSearch('');
      setShowAllFoods(false);
    } catch (error) {
      console.error('Error logging food:', error);
      alert('Failed to log food. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSystemProgress = (system: DefenseSystem) => {
    const progress = currentProgress[system];
    return {
      count: progress?.count || 0,
      foods: progress?.foods || [],
      percentage: ((progress?.count || 0) / 5) * 100,
    };
  };

  // Get progress bar color class based on system
  const getProgressBarColor = (system: DefenseSystem, isComplete: boolean) => {
    if (isComplete) return 'bg-green-500';
    
    switch (system) {
      case DefenseSystem.ANGIOGENESIS:
        return 'bg-red-500';
      case DefenseSystem.REGENERATION:
        return 'bg-blue-500';
      case DefenseSystem.MICROBIOME:
        return 'bg-green-600';
      case DefenseSystem.DNA_PROTECTION:
        return 'bg-purple-500';
      case DefenseSystem.IMMUNITY:
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const totalCompletion = Object.values(DefenseSystem).reduce((sum, system) => {
    return sum + getSystemProgress(system).percentage;
  }, 0) / 5;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 dark:from-green-600 dark:to-blue-600 rounded-lg p-6 text-white shadow-lg border border-green-400 dark:border-green-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Progress Information */}
          <div>
            <h3 className="text-lg font-bold mb-2">
              {isToday(date) ? "Today's Progress" : "Progress for Selected Date"}
            </h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold">{Math.round(totalCompletion)}%</span>
              <span className="text-sm opacity-90">
                {format(date, 'EEEE, MMMM d')}
              </span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all duration-500"
                style={{ width: `${totalCompletion}%` }}
              />
            </div>
            {!isToday(date) && (
              <button
                onClick={() => onDateChange?.(new Date())}
                className="mt-4 text-sm bg-white/20 px-4 py-2 rounded hover:bg-white/30 transition-colors"
              >
                Return to Today
              </button>
            )}
          </div>

          {/* Calendar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="min-w-[280px]">
              <Calendar
                selected={date}
                onSelect={(newDate: Date) => onDateChange?.(newDate)}
                daysWithProgress={daysWithProgress}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* System Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(DefenseSystem).map((system) => {
          const systemInfo = DEFENSE_SYSTEMS[system];
          const progress = getSystemProgress(system);
          const isComplete = progress.count >= 5;
          const isSelected = selectedSystem === system;

          return (
            <div
              key={system}
              className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                isSelected
                  ? `${systemInfo.borderColor} ${systemInfo.bgColor} scale-105 shadow-lg`
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md'
              } ${isComplete ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setSelectedSystem(isSelected ? null : system)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{systemInfo.icon}</span>
                  <span className="font-bold text-sm dark:text-white">{systemInfo.displayName}</span>
                </div>
                {isComplete && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium dark:text-gray-300">
                    {progress.count}/5 foods
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">{Math.round(progress.percentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(system, isComplete)}`}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>

              {/* Foods Logged */}
              {progress.foods.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {progress.foods.map((food, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-white dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-600"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Food Logging Form */}
      {selectedSystem && (
        <div className="bg-white dark:bg-gray-800 border-2 border-green-500 dark:border-green-600 rounded-lg p-6 shadow-lg">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Log Foods for {getSystemInfo(selectedSystem)?.displayName}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedSystem(null);
                  setFoodSearch('');
                  setShowAllFoods(false);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* System Info with Food Suggestions */}
            <div
              className={`mb-4 p-4 rounded-lg ${getSystemInfo(selectedSystem)?.bgColor}`}
            >
              <p className="text-sm font-medium mb-3 dark:text-gray-800">
                {getSystemInfo(selectedSystem)?.description}
              </p>
              
              {/* Food Search */}
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={foodSearch}
                    onChange={(e) => setFoodSearch(e.target.value)}
                    placeholder="Search foods..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:outline-none text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Food Suggestions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-800">
                    {foodSearch ? `Found ${filteredFoods.length} foods:` : 'Suggested foods:'} 
                    <span className="ml-1 text-gray-500">
                      (Click to add)
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAllFoods(!showAllFoods)}
                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <span>{showAllFoods ? 'Show Less' : `Show All (${getSystemInfo(selectedSystem)?.keyFoods.length})`}</span>
                    {showAllFoods ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
                
                <div className={`flex flex-wrap gap-2 ${showAllFoods ? 'max-h-64 overflow-y-auto' : 'max-h-32 overflow-y-auto'}`}>
                  {(filteredFoods.length > 0 ? filteredFoods : getSystemInfo(selectedSystem)?.keyFoods || [])
                    .slice(0, showAllFoods ? undefined : 15)
                    .map((food: string) => (
                      <button
                        key={food}
                        type="button"
                        onClick={() => handleAddSuggestedFood(food)}
                        className="text-xs bg-white px-3 py-1.5 rounded-full border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all shadow-sm hover:shadow"
                        disabled={foodInputs.length >= 5 && !foodInputs.includes('')}
                      >
                        {food}
                      </button>
                    ))}
                </div>
                
                {!showAllFoods && filteredFoods.length > 15 && (
                  <p className="text-xs text-gray-500 dark:text-gray-700 text-center mt-2">
                    + {filteredFoods.length - 15} more foods available
                  </p>
                )}
                
                {foodSearch && filteredFoods.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-700 text-center py-2">
                    No foods found. Try a different search or type your own food below.
                  </p>
                )}
              </div>
            </div>

            {/* Food Inputs */}
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                What did you eat? (Max 5 foods)
              </label>
              {foodInputs.map((food, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={food}
                    onChange={(e) => handleFoodChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                    placeholder={`Food ${index + 1} (e.g., Tomatoes)`}
                  />
                  {foodInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFoodInput(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}

              {foodInputs.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddFoodInput}
                  className="flex items-center space-x-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add another food</span>
                </button>
              )}
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                placeholder="How did you feel? Any observations?"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isSubmitting ||
                foodInputs.filter((f) => f.trim()).length === 0
              }
              className="w-full bg-green-500 dark:bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-600 dark:hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <span>Log Foods</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-up">
          <Check className="w-5 h-5" />
          <span className="font-medium">Foods logged successfully!</span>
        </div>
      )}
    </div>
  );
}