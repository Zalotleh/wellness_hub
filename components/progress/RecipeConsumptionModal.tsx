'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, ChefHat, Users } from 'lucide-react';
import MultiSystemBadge from '@/components/ui/MultiSystemBadge';
import { DefenseSystem } from '@/types';

type MealTime = 'BREAKFAST' | 'MORNING_SNACK' | 'LUNCH' | 'AFTERNOON_SNACK' | 'DINNER';

interface Recipe {
  id: string;
  title: string;
  description?: string;
  servings?: number;
  ingredients?: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  foodItems?: Array<{
    food: {
      name: string;
      defenseSystems: DefenseSystem[];
    };
  }>;
}

interface RecipeConsumptionModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const mealTimeOptions: { value: MealTime; label: string; icon: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast', icon: '🌅' },
  { value: 'MORNING_SNACK', label: 'Morning Snack', icon: '☕' },
  { value: 'LUNCH', label: 'Lunch', icon: '🌞' },
  { value: 'AFTERNOON_SNACK', label: 'Afternoon Snack', icon: '🍎' },
  { value: 'DINNER', label: 'Dinner', icon: '🌙' },
];

export default function RecipeConsumptionModal({
  recipe,
  isOpen,
  onClose,
  onSuccess,
}: RecipeConsumptionModalProps) {
  const [mealTime, setMealTime] = useState<MealTime>('LUNCH');
  const [servingsConsumed, setServingsConsumed] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMealTime('LUNCH');
      setServingsConsumed(1);
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  // Get unique defense systems from recipe
  const getRecipeSystems = (): DefenseSystem[] => {
    if (!recipe.foodItems) return [];
    
    const systems = new Set<DefenseSystem>();
    recipe.foodItems.forEach((item) => {
      item.food.defenseSystems.forEach((system) => systems.add(system));
    });
    
    return Array.from(systems);
  };

  const recipeSystems = getRecipeSystems();

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/progress/mark-recipe-consumed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: recipe.id,
          mealTime,
          servingsConsumed,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log recipe consumption');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log recipe consumption');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const recipeServings = recipe.servings || 4;
  const ingredientCount = recipe.ingredients?.length || recipe.foodItems?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-full shadow-sm">
              <ChefHat className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Log Recipe Consumption</h2>
              <p className="text-sm text-gray-600">{recipe.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Recipe Info */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-3">
              {recipe.description && (
                <p className="text-sm text-gray-700">{recipe.description}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{recipeServings} servings</span>
                </div>
                {ingredientCount > 0 && (
                  <div className="flex items-center gap-1">
                    <span>🥕</span>
                    <span>{ingredientCount} ingredients</span>
                  </div>
                )}
              </div>

              {recipeSystems.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    Defense Systems
                  </div>
                  <MultiSystemBadge
                    systems={recipeSystems.map((system) => ({ system }))}
                    size="md"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Servings Consumed */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              How many servings did you consume?
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setServingsConsumed(Math.max(0.25, servingsConsumed - 0.5))}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-700 transition-colors"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <input
                  type="number"
                  value={servingsConsumed}
                  onChange={(e) => setServingsConsumed(Math.max(0.25, parseFloat(e.target.value) || 0.25))}
                  min="0.25"
                  step="0.25"
                  className="w-24 px-4 py-2 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-sm text-gray-500 mt-1">
                  out of {recipeServings} servings
                </div>
              </div>
              <button
                onClick={() => setServingsConsumed(servingsConsumed + 0.5)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-700 transition-colors"
              >
                +
              </button>
            </div>
            
            {/* Portion Indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {[0.25, 0.5, 0.75, 1, 1.5, 2].map((portion) => (
                <button
                  key={portion}
                  onClick={() => setServingsConsumed(portion)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    servingsConsumed === portion
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {portion}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Time Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Which meal was this?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {mealTimeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMealTime(option.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    mealTime === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="text-xs font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was it? Any modifications?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Impact Preview */}
          {recipeSystems.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✨</div>
                <div>
                  <div className="font-semibold text-green-900 mb-1">
                    Defense System Impact
                  </div>
                  <p className="text-sm text-green-700">
                    This meal will contribute to <strong>{recipeSystems.length}</strong> defense system
                    {recipeSystems.length !== 1 ? 's' : ''} in your 5×5×5 progress.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Logging...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Log Consumption</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
