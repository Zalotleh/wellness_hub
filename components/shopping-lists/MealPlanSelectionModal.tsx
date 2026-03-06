'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, Users, Search, Check, Loader2, UtensilsCrossed, RefreshCw } from 'lucide-react';
import { getMeasurementPreference } from '@/lib/shopping/measurement-system';

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
      // Get user's measurement preference
      const preference = getMeasurementPreference();
      
      const response = await fetch('/api/shopping-lists/create-from-sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meal-plans',
          sourceIds: Array.from(selectedPlans),
          filterPantry,
          measurementSystem: preference.system,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create shopping list');
      }

      const result = await response.json();
      
      console.log('✅ Shopping list created:', result);
      
      // Close modal and navigate to the new shopping list
      onClose();
      if (onSuccess) onSuccess();
      
      // Use result.data.id since API returns { success, data: { ...shoppingList }, message }
      const shoppingListId = result.data?.id || result.id;
      if (shoppingListId) {
        router.push(`/shopping-lists/${shoppingListId}`);
      } else {
        console.error('No shopping list ID in response:', result);
        setError('Shopping list created but could not navigate to it');
      }
      
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

  const selectedCount = selectedPlans.size;

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-sm shadow-green-500/20">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Select Meal Plans</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pick one or more plans to generate a shopping list</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Search + pantry toggle ───────────────────────────────── */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search meal plans…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <div
              onClick={() => setFilterPantry(!filterPantry)}
              className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                filterPantry ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  filterPantry ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              Filter out items I already have in my pantry
            </span>
          </label>
        </div>

        {/* ── Content ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {fetchLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Loading your meal plans…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <X className="w-7 h-7 text-red-500" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Couldn't load meal plans</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
              </div>
              <button
                onClick={fetchMealPlans}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white text-sm font-semibold rounded-xl shadow shadow-green-500/20 hover:shadow-md transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          ) : mealPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 flex items-center justify-center">
                <UtensilsCrossed className="w-7 h-7 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {searchTerm ? 'No matching meal plans' : 'No meal plans yet'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Try a different search term.' : 'Create a meal plan first, then come back to build your list.'}
                </p>
              </div>
              {!searchTerm && (
                <button
                  onClick={() => { onClose(); window.open('/meal-planner', '_blank'); }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white text-sm font-semibold rounded-xl shadow shadow-green-500/20 hover:shadow-md transition-all"
                >
                  <UtensilsCrossed className="w-4 h-4" /> Create Meal Plan
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mealPlans.map((plan) => {
                const selected = selectedPlans.has(plan.id);
                return (
                  <div
                    key={plan.id}
                    onClick={() => toggleSelection(plan.id)}
                    className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 ${
                      selected
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm shadow-green-500/20'
                        : 'border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm'
                    }`}
                  >
                    {/* Checkmark */}
                    <div className={`absolute top-3.5 right-3.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selected
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    }`}>
                      {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>

                    {/* Top accent */}
                    {selected && <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-green-400 to-teal-500" />}

                    <h3 className={`font-semibold pr-7 mb-1 text-sm leading-snug ${
                      selected ? 'text-green-900 dark:text-green-100' : 'text-gray-900 dark:text-white'
                    }`}>
                      {plan.title}
                    </h3>

                    {plan.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5 line-clamp-2">{plan.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-400 dark:text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateRange(plan.weekStart, plan.weekEnd) || new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {plan.defaultServings && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {plan.defaultServings} {plan.defaultServings === 1 ? 'person' : 'people'}
                        </span>
                      )}
                      {!!plan.mealCount && (
                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700/60 rounded-md font-medium">
                          {plan.mealCount} meals
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedCount > 0
              ? <span><span className="font-semibold text-green-600 dark:text-green-400">{selectedCount}</span> plan{selectedCount !== 1 ? 's' : ''} selected</span>
              : 'Select at least one plan'}
          </p>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0 || creating}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-teal-600 rounded-xl shadow shadow-green-500/20 hover:shadow-md hover:from-green-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {creating ? 'Creating list…' : 'Create Shopping List'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}