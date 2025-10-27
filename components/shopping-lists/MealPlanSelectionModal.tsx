'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, Users, Search, Check, Loader2, UtensilsCrossed } from 'lucide-react';

interface MealPlan {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  weekStart?: string;
  weekEnd?: string;
  defaultServings?: number;
  mealCount?: number;
}

interface MealPlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Called when shopping list is successfully created
}

export default function MealPlanSelectionModal({
  isOpen,
  onClose,
  onSuccess,
}: MealPlanSelectionModalProps) {
  const router = useRouter();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filterPantry, setFilterPantry] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMealPlans();
      setSelectedPlans(new Set());
      setSearchTerm('');
      setError(null);
    }
  }, [isOpen]);

  // Debounced search effect
  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(() => {
      fetchMealPlans();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isOpen]);

  const fetchMealPlans = async () => {
    try {
      setFetchLoading(true);
      const searchParam = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`/api/meal-planner/for-shopping-list${searchParam}`);
      const data = await response.json();

      if (data.success) {
        setMealPlans(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch meal plans');
      }
    } catch (err) {
      setError('Failed to fetch meal plans');
      console.error('Error fetching meal plans:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  const toggleSelection = (planId: string) => {
    const newSelected = new Set(selectedPlans);
    if (newSelected.has(planId)) {
      newSelected.delete(planId);
    } else {
      newSelected.add(planId);
    }
    setSelectedPlans(newSelected);
  };

  const handleConfirm = async () => {
    if (selectedPlans.size === 0) return;
    
    setCreating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/shopping-lists/create-from-sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meal-plans',
          sourceIds: Array.from(selectedPlans),
          filterPantry,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create shopping list');
      }

      const result = await response.json();
      
      // Close modal and navigate to the new shopping list
      onClose();
      if (onSuccess) onSuccess();
      router.push(`/shopping-lists/${result.id}`);
      
    } catch (error) {
      console.error('Error creating shopping list:', error);
      setError(error instanceof Error ? error.message : 'Failed to create shopping list');
    } finally {
      setCreating(false);
    }
  };

  const formatDateRange = (weekStart?: string, weekEnd?: string) => {
    if (!weekStart || !weekEnd) return '';
    const start = new Date(weekStart).toLocaleDateString();
    const end = new Date(weekEnd).toLocaleDateString();
    return `${start} - ${end}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <UtensilsCrossed className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Select Meal Plans</h2>
              <p className="text-gray-600">Choose meal plans to create shopping list from</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search meal plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Pantry Filter */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="filterPantry"
              checked={filterPantry}
              onChange={(e) => setFilterPantry(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="filterPantry" className="text-sm text-gray-700">
              Filter out items I already have in pantry
            </label>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {fetchLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading meal plans...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Error Loading Meal Plans</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchMealPlans}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : mealPlans.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <UtensilsCrossed className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {searchTerm ? 'No matching meal plans' : 'No meal plans found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms.'
                  : 'Create your first meal plan to get started.'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    onClose();
                    window.open('/meal-planner', '_blank');
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create Meal Plan
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mealPlans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => toggleSelection(plan.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPlans.has(plan.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800 mb-1">{plan.title}</h3>
                      {plan.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{plan.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateRange(plan.weekStart, plan.weekEnd) || new Date(plan.createdAt).toLocaleDateString()}</span>
                        </div>
                        {plan.defaultServings && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{plan.defaultServings} {plan.defaultServings === 1 ? 'person' : 'people'}</span>
                          </div>
                        )}
                        {plan.mealCount && (
                          <span>{plan.mealCount} meals</span>
                        )}
                      </div>
                    </div>
                    
                    <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ml-3 ${
                      selectedPlans.has(plan.id)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300'
                    }`}>
                      {selectedPlans.has(plan.id) && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedPlans.size > 0 ? `${selectedPlans.size} meal plan${selectedPlans.size === 1 ? '' : 's'} selected` : 'No meal plans selected'}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedPlans.size === 0 || creating}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{creating ? 'Creating...' : 'Create Shopping List'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}