'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Clock, Edit2, Check, X, Sparkles, Loader2, Eye, Timer,
  MoreHorizontal, Trash2, Copy, Target, AlertCircle
} from 'lucide-react';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { DefenseSystem } from '@/types';

interface Meal {
  id?: string;
  mealType: string;
  mealName: string;
  defenseSystems: DefenseSystem[];
  prepTime?: string;
  cookTime?: string;
  recipeGenerated?: boolean;
  recipeId?: string;
  customInstructions?: string;
  servings?: number;
}

interface MealCardProps {
  meal: Meal;
  dayIndex: number;
  mealIndex: number;
  isGeneratingRecipe?: boolean;
  onMealUpdate: (dayIndex: number, mealIndex: number, updates: Partial<Meal>) => void;
  onGenerateRecipe: (mealId: string) => void;
  onViewRecipe?: (recipeId: string) => void;
  className?: string;
  showCompact?: boolean;
}

export default function MealCard({
  meal,
  dayIndex,
  mealIndex,
  isGeneratingRecipe = false,
  onMealUpdate,
  onGenerateRecipe,
  onViewRecipe,
  className = '',
  showCompact = false,
}: MealCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(meal.mealName);
  const [editedPrepTime, setEditedPrepTime] = useState(meal.prepTime || '');
  const [showMenu, setShowMenu] = useState(false);
  const [isOptimisticLoading, setIsOptimisticLoading] = useState(false);
  const [recipeGenerationProgress, setRecipeGenerationProgress] = useState(0);
  
  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleSaveEdit = () => {
    const updates: Partial<Meal> = {};
    
    if (editedName.trim() && editedName !== meal.mealName) {
      updates.mealName = editedName.trim();
    }
    
    if (editedPrepTime !== meal.prepTime) {
      updates.prepTime = editedPrepTime || undefined;
    }
    
    if (Object.keys(updates).length > 0) {
      onMealUpdate(dayIndex, mealIndex, updates);
    } else {
      setEditedName(meal.mealName);
      setEditedPrepTime(meal.prepTime || '');
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedName(meal.mealName);
    setEditedPrepTime(meal.prepTime || '');
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        handleSaveEdit();
        break;
      case 'Escape':
        event.preventDefault();
        handleCancelEdit();
        break;
    }
  };

  const handleGenerateRecipe = async () => {
    if (!meal.id) return;
    
    setIsOptimisticLoading(true);
    setRecipeGenerationProgress(0);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setRecipeGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 300);
    
    try {
      await onGenerateRecipe(meal.id);
      setRecipeGenerationProgress(100);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsOptimisticLoading(false);
        setRecipeGenerationProgress(0);
      }, 500);
    }
  };

  const handleCopyMeal = () => {
    navigator.clipboard.writeText(meal.mealName);
    setShowMenu(false);
  };

  const handleDeleteMeal = () => {
    if (confirm('Are you sure you want to remove this meal?')) {
      onMealUpdate(dayIndex, mealIndex, { mealName: '', defenseSystems: [] });
    }
    setShowMenu(false);
  };

  const getMealTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '☀️';
      case 'dinner':
        return '🌙';
      case 'snack':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  const getMealTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'lunch':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'dinner':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'snack':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 border-gray-200';
    }
  };

  const isLoading = isGeneratingRecipe || isOptimisticLoading;
  const hasRecipe = meal.recipeGenerated && meal.recipeId;
  const isEmpty = !meal.mealName.trim();

  // Recipe generation status
  const getRecipeStatus = () => {
    if (isLoading) return 'generating';
    if (hasRecipe) return 'ready';
    if (isEmpty) return 'empty';
    return 'pending';
  };

  const recipeStatus = getRecipeStatus();

  return (
    <div className={`
      group relative border border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-300
      hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden
      ${isEmpty ? 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50' : ''}
      ${isLoading ? 'ring-2 ring-blue-500/20' : ''}
      ${hasRecipe ? 'ring-1 ring-green-500/30 bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-900/10' : ''}
      ${className}
    `}>
      {/* Loading Progress Bar */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${recipeGenerationProgress}%` }}
          />
        </div>
      )}

      {/* Recipe Status Indicator */}
      <div className="absolute top-3 right-3">
        <div className={`
          w-3 h-3 rounded-full transition-all duration-300
          ${recipeStatus === 'ready' ? 'bg-green-500 shadow-lg shadow-green-500/50' : ''}
          ${recipeStatus === 'generating' ? 'bg-blue-500 animate-pulse' : ''}
          ${recipeStatus === 'pending' ? 'bg-gray-300 dark:bg-gray-600' : ''}
          ${recipeStatus === 'empty' ? 'bg-gray-200 dark:bg-gray-700' : ''}
        `} />
      </div>

      <div className={`p-4 ${showCompact ? 'sm:p-3' : 'sm:p-5'}`}>
        <div className="flex items-start justify-between gap-3">
          {/* Left Content */}
          <div className="flex-1 min-w-0">
            {/* Meal Type Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                ${getMealTypeColor(meal.mealType)}
              `}>
                <span className="text-lg" role="img" aria-label={meal.mealType}>
                  {getMealTypeIcon(meal.mealType)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                    ${getMealTypeColor(meal.mealType)}
                  `}>
                    {meal.mealType}
                  </span>
                  {!showCompact && meal.servings && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {meal.servings} servings
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Meal Name with Inline Editing */}
            <div className="mb-3">
              {isEditing ? (
                <div className="space-y-3">
                  {/* Meal Name Input */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 text-lg font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-2 border-blue-500 dark:border-blue-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      placeholder="Enter meal name..."
                    />
                  </div>
                  
                  {/* Prep Time Input */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={editedPrepTime}
                      onChange={(e) => setEditedPrepTime(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 15 min"
                    />
                  </div>
                  
                  {/* Edit Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                      aria-label="Save changes"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2"
                      aria-label="Cancel editing"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group/title">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white flex-1 min-w-0 break-words leading-tight">
                      {meal.mealName || (
                        <span className="text-gray-400 dark:text-gray-500 italic">No meal planned</span>
                      )}
                    </h4>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="opacity-0 group-hover/title:opacity-100 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                      aria-label="Edit meal"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Prep Time Display */}
                  {meal.prepTime && !showCompact && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Clock className="w-4 h-4" />
                      <span>Prep: {meal.prepTime}</span>
                      {meal.cookTime && (
                        <>
                          <Timer className="w-4 h-4 ml-2" />
                          <span>Cook: {meal.cookTime}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Defense Systems */}
            {meal.defenseSystems.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {meal.defenseSystems.map(system => {
                  const systemInfo = DEFENSE_SYSTEMS[system];
                  if (!systemInfo) return null;
                  
                  return (
                    <span 
                      key={system}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 hover:shadow-sm transition-shadow"
                      title={systemInfo.description}
                    >
                      <span className="text-sm">{systemInfo.icon}</span>
                      {!showCompact && (
                        <span className="hidden sm:inline">{systemInfo.displayName}</span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Custom Instructions */}
            {meal.customInstructions && !showCompact && (
              <div className="text-sm text-gray-600 dark:text-gray-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-amber-800 dark:text-amber-300">Note: </span>
                    <span className="text-amber-700 dark:text-amber-400">{meal.customInstructions}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {/* Enhanced Generate Recipe Button with Loading States */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleGenerateRecipe}
                disabled={Boolean(!meal.id || isLoading || hasRecipe || isEmpty)}
                className={`
                  px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300
                  flex items-center gap-2 min-w-max shadow-sm
                  ${hasRecipe
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/25'
                    : isLoading
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-blue-500/25'
                      : isEmpty
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-blue-500/25 hover:shadow-lg transform hover:scale-105'
                  }
                `}
                aria-label={
                  hasRecipe
                    ? 'Recipe ready'
                    : isLoading
                      ? 'Generating recipe...'
                      : isEmpty
                        ? 'Add meal name first'
                        : 'Generate recipe with AI'
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span className="hidden sm:inline">Generating...</span>
                  </>
                ) : hasRecipe ? (
                  <>
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Recipe Ready</span>
                  </>
                ) : isEmpty ? (
                  <>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Add Meal</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Generate Recipe</span>
                  </>
                )}
              </button>

              {/* Progress Text */}
              {isLoading && recipeGenerationProgress > 0 && (
                <div className="text-xs text-center text-gray-600 dark:text-gray-200">
                  {Math.round(recipeGenerationProgress)}% complete
                </div>
              )}

              {/* View Recipe Button */}
              {hasRecipe && onViewRecipe && (
                <button
                  onClick={() => onViewRecipe(meal.recipeId!)}
                  className="px-3 py-2 bg-white dark:bg-gray-700 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 transition-all duration-200 flex items-center gap-2 shadow-sm"
                  aria-label="View recipe details"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">View Recipe</span>
                </button>
              )}
            </div>

            {/* More Menu */}
            {!isEmpty && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="More options"
                  aria-expanded={showMenu}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-20">
                    <button
                      onClick={handleCopyMeal}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Meal Name
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Details
                    </button>
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={handleDeleteMeal}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Meal
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-gray-700 dark:text-gray-200">
              <div className="relative">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-blue-200 dark:border-blue-800 rounded-full animate-ping" />
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold">Generating Recipe</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Using AI to create your personalized meal...</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}