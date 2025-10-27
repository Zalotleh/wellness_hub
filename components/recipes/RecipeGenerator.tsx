'use client';

import React, { useState } from 'react';
import { useRecipeGeneration } from '@/hooks/useRecipeGeneration';
import RecipeGenerationLoading from './RecipeGenerationLoading';
import RecipeGenerationError from './RecipeGenerationError';
import { cn } from '@/lib/utils';

interface Meal {
  id: string;
  name: string;
  type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  description?: string;
}

interface RecipeGeneratorProps {
  mealPlanId: string;
  meals: Meal[];
  onRecipesGenerated?: (recipes: any[]) => void;
  className?: string;
}

export default function RecipeGenerator({
  mealPlanId,
  meals,
  onRecipesGenerated,
  className,
}: RecipeGeneratorProps) {
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const {
    generateRecipes,
    isGenerating,
    progress,
    error,
    generatedRecipes,
    clearError,
    cancelGeneration,
  } = useRecipeGeneration({
    mealPlanId,
    onSuccess: (recipes) => {
      setSelectedMeals([]);
      onRecipesGenerated?.(recipes);
    },
  });

  const handleMealSelect = (mealId: string, checked: boolean) => {
    setSelectedMeals(prev => 
      checked 
        ? [...prev, mealId]
        : prev.filter(id => id !== mealId)
    );
  };

  const handleSelectAll = () => {
    setSelectedMeals(selectedMeals.length === meals.length ? [] : meals.map(m => m.id));
  };

  const handleGenerateSelected = () => {
    if (selectedMeals.length > 0) {
      generateRecipes(selectedMeals);
    }
  };

  const handleGenerateSingle = (mealId: string) => {
    generateRecipes([mealId]);
  };

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case 'BREAKFAST':
        return '🌅';
      case 'LUNCH':
        return '☀️';
      case 'DINNER':
        return '🌙';
      case 'SNACK':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'BREAKFAST':
        return 'bg-orange-100 text-orange-800';
      case 'LUNCH':
        return 'bg-yellow-100 text-yellow-800';
      case 'DINNER':
        return 'bg-purple-100 text-purple-800';
      case 'SNACK':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasGeneratedRecipe = (mealId: string) => {
    return generatedRecipes.some(recipe => recipe.mealId === mealId);
  };

  if (meals.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4a2 2 0 00-2-2H8a2 2 0 00-2 2v2M7 6h10l1 10H6L7 6zM10 12h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Meals Found</h3>
        <p className="text-gray-600">Add some meals to your meal plan to generate recipes.</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn('space-y-4', className)}>
        {/* Header with bulk actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Generate AI Recipes
            </h3>
            {meals.length > 1 && (
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showBulkActions ? 'Hide' : 'Show'} bulk actions
              </button>
            )}
          </div>

          {showBulkActions && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                {selectedMeals.length === meals.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedMeals.length > 0 && (
                <button
                  onClick={handleGenerateSelected}
                  disabled={isGenerating}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate {selectedMeals.length} Recipe{selectedMeals.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Meals list */}
        <div className="space-y-3">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className={cn(
                'border rounded-lg p-4 transition-all duration-200',
                hasGeneratedRecipe(meal.id)
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {showBulkActions && (
                    <input
                      type="checkbox"
                      checked={selectedMeals.includes(meal.id)}
                      onChange={(e) => handleMealSelect(meal.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  )}

                  <div className="flex items-center space-x-3">
                    <span className="text-2xl" role="img" aria-label={meal.type}>
                      {getMealTypeIcon(meal.type)}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900">{meal.name}</h4>
                      {meal.description && (
                        <p className="text-sm text-gray-600">{meal.description}</p>
                      )}
                      <span className={cn(
                        'inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full',
                        getMealTypeColor(meal.type)
                      )}>
                        {meal.type.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {hasGeneratedRecipe(meal.id) && (
                    <div className="flex items-center text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">Recipe Generated</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleGenerateSingle(meal.id)}
                    disabled={isGenerating}
                    className={cn(
                      'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      hasGeneratedRecipe(meal.id)
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700',
                      isGenerating && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {hasGeneratedRecipe(meal.id) ? 'Regenerate' : 'Generate Recipe'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                AI Recipe Generation
              </h4>
              <p className="text-sm text-blue-800">
                Our AI chef will create personalized recipes using Dr. William Li's defense system foods,
                complete with ingredients, instructions, and nutritional information.
              </p>
              <p className="text-xs text-blue-700 mt-2">
                💡 Free users can generate up to 5 recipes at once. Premium users can generate unlimited batches.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Modal */}
      <RecipeGenerationLoading
        isGenerating={isGenerating}
        progress={progress || undefined}
        isBatch={selectedMeals.length > 1 || (progress?.total || 0) > 1}
        onCancel={cancelGeneration}
      />

      {/* Error Modal */}
      {error && (
        <RecipeGenerationError
          error={error}
          onRetry={() => {
            clearError();
            if (selectedMeals.length > 0) {
              generateRecipes(selectedMeals);
            }
          }}
          onClose={clearError}
        />
      )}
    </>
  );
}