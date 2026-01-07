'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import FoodSelector from './FoodSelector';
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

interface SelectedFood {
  food: FoodDatabaseEntry;
  quantity: number;
  unit: string;
}

interface FoodLogModalProps {
  isOpen: boolean;
  defaultMealTime?: MealTime;
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

export default function FoodLogModal({
  isOpen,
  defaultMealTime = 'BREAKFAST',
  onClose,
  onSuccess,
}: FoodLogModalProps) {
  const [mealTime, setMealTime] = useState<MealTime>(defaultMealTime);
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [notes, setNotes] = useState('');
  const [showFoodSelector, setShowFoodSelector] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens and update meal time
  React.useEffect(() => {
    if (isOpen) {
      setMealTime(defaultMealTime);
      setSelectedFoods([]);
      setNotes('');
      setShowFoodSelector(true);
      setError(null);
    }
  }, [isOpen, defaultMealTime]);

  const handleFoodSelect = (food: FoodDatabaseEntry) => {
    const newFood: SelectedFood = {
      food,
      quantity: 1,
      unit: food.servingSize || 'serving',
    };
    setSelectedFoods([...selectedFoods, newFood]);
    setShowFoodSelector(false);
  };

  const handleRemoveFood = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...selectedFoods];
    updated[index].quantity = Math.max(0.1, quantity);
    setSelectedFoods(updated);
  };

  const handleUnitChange = (index: number, unit: string) => {
    const updated = [...selectedFoods];
    updated[index].unit = unit;
    setSelectedFoods(updated);
  };

  const handleSubmit = async () => {
    if (selectedFoods.length === 0) {
      setError('Please add at least one food item');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const foodItems = selectedFoods.map((item) => ({
        name: item.food.name,
        portion: item.unit,
        servings: item.quantity,
      }));

      const response = await fetch('/api/progress/consumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mealTime,
          foodItems,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log food');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log food');
    } finally {
      setSubmitting(false);
    }
  };

  // Get all unique defense systems from selected foods
  const allSystems = Array.from(
    new Set(selectedFoods.flatMap((item) => item.food.defenseSystems))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Log Food</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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

          {/* Meal Time Display */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Logging for
            </label>
            <div className="flex items-center gap-3 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
              <div className="text-3xl">
                {mealTimeOptions.find(opt => opt.value === mealTime)?.icon}
              </div>
              <div>
                <div className="font-semibold text-blue-900">
                  {mealTimeOptions.find(opt => opt.value === mealTime)?.label}
                </div>
                <div className="text-xs text-blue-700">
                  Click foods below to add to this meal
                </div>
              </div>
            </div>
          </div>

          {/* Selected Foods */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Foods
              </label>
              {allSystems.length > 0 && (
                <MultiSystemBadge
                  systems={allSystems.map((system) => ({ system }))}
                  size="sm"
                />
              )}
            </div>

            {selectedFoods.length > 0 && (
              <div className="space-y-2 mb-3">
                {selectedFoods.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">
                        {item.food.name}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(index, parseFloat(e.target.value))
                          }
                          min="0.1"
                          step="0.1"
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleUnitChange(index, e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <MultiSystemBadge
                        systems={item.food.defenseSystems.map((system) => ({
                          system,
                        }))}
                        size="sm"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveFood(index)}
                      className="p-2 hover:bg-red-100 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Food Selector */}
            {showFoodSelector ? (
              <FoodSelector
                onSelect={handleFoodSelect}
                onClose={() => setShowFoodSelector(false)}
                autoFocus
              />
            ) : (
              <button
                onClick={() => setShowFoodSelector(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-600 hover:text-blue-600"
              >
                <div className="flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add Food</span>
                </div>
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this meal..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
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
            disabled={submitting || selectedFoods.length === 0}
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
                <span>Log {selectedFoods.length} Food{selectedFoods.length !== 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
