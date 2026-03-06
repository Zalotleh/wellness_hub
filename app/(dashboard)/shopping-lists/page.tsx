// app/(dashboard)/shopping-lists/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Plus,
  Search,
  ChevronRight,
  ExternalLink,
  Clock,
  ChevronDown,
  Book,
  UtensilsCrossed,
  Trash2,
  PackageCheck,
} from 'lucide-react';
import MealPlanSelectionModal from '@/components/shopping-lists/MealPlanSelectionModal';
import RecipeSelectionModal from '@/components/shopping-lists/RecipeSelectionModal';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import Footer from '@/components/layout/Footer';

interface ShoppingListItem {
  ingredient: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  estimatedCost?: number;
}

interface ShoppingList {
  id: string;
  title: string;
  mealPlanId: string;
  mealPlan?: {
    id: string;
    title: string;
    description: string;
    createdAt: string;
  };
  sourceType?: string; // 'meal-plans' or 'recipes'
  sourceIds?: string[]; // Array of source IDs
  totalItems: number;
  checkedItems: number;
  pendingItems: number;
  totalCost?: number;
  currency?: string;
  pantryFiltered: boolean;
  lastExported?: string;
  createdAt: string;
  updatedAt: string;
  items: ShoppingListItem[];
}

interface ShoppingListStats {
  totalLists: number;
  totalItems: number;
  completedItems: number;
  thisWeekLists: number;
}

export default function ShoppingListsPage() {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [stats, setStats] = useState<ShoppingListStats>({
    totalLists: 0,
    totalItems: 0,
    completedItems: 0,
    thisWeekLists: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; listId: string; listTitle: string }>({
    isOpen: false,
    listId: '',
    listTitle: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchShoppingLists();
  }, []);

  // Debug effect to log shopping list data
  useEffect(() => {
    if (shoppingLists.length > 0) {
      console.log('🛒 Shopping Lists Data:', shoppingLists.map(list => ({
        id: list.id,
        title: list.title,
        hasMealPlan: !!list.mealPlan,
        sourceType: list.sourceType,
        sourceIds: list.sourceIds,
        sourceIdsType: typeof list.sourceIds,
        sourceIdsIsArray: Array.isArray(list.sourceIds),
      })));
    }
  }, [shoppingLists]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCreateDropdown(false);
      }
    }

    if (showCreateDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCreateDropdown]);

  const fetchShoppingLists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shopping-lists');
      const data = await response.json();

      if (data.success) {
        setShoppingLists(data.data);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch shopping lists');
      }
    } catch (err) {
      setError('Failed to fetch shopping lists');
      console.error('Error fetching shopping lists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchShoppingLists();
  };

  const handleDeleteClick = (listId: string, listTitle: string) => {
    setDeleteDialog({
      isOpen: true,
      listId,
      listTitle,
    });
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/shopping-lists/${deleteDialog.listId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove from local state
        setShoppingLists(prev => prev.filter(list => list.id !== deleteDialog.listId));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalLists: prev.totalLists - 1,
        }));

        // Close dialog
        setDeleteDialog({ isOpen: false, listId: '', listTitle: '' });
      } else {
        alert(data.error || 'Failed to delete shopping list');
      }
    } catch (err) {
      console.error('Error deleting shopping list:', err);
      alert('Failed to delete shopping list');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, listId: '', listTitle: '' });
  };

  const filteredLists = shoppingLists.filter(list =>
    list.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.mealPlan?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Skeleton nav */}
        <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200/60 dark:border-gray-700/60" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* ── Sticky Top Nav ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center shadow flex-shrink-0">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">Shopping Lists</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Smart lists from your meal plans &amp; recipes</p>
            </div>
          </div>

          {/* Create dropdown */}
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setShowCreateDropdown(!showCreateDropdown)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white text-sm font-semibold rounded-xl shadow shadow-green-500/20 hover:shadow-md hover:shadow-green-500/30 hover:from-green-600 hover:to-teal-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create List</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCreateDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCreateDropdown && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 overflow-hidden">
                <div className="p-1.5">
                  <button
                    onClick={() => { setShowCreateDropdown(false); setShowMealPlanModal(true); }}
                    className="w-full text-left px-3 py-3 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 dark:group-hover:bg-teal-800/40 transition-colors">
                      <UtensilsCrossed className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-white">From Meal Plan</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Generate from existing plans</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setShowCreateDropdown(false); setShowRecipeModal(true); }}
                    className="w-full text-left px-3 py-3 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/40 transition-colors">
                      <Book className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-white">From Recipes</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Pick recipes to shop for</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Hero / Stats banner ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-teal-500 to-emerald-600 p-6 text-white shadow-lg shadow-green-500/20">
          {/* background blobs */}
          <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-36 h-36 bg-emerald-300/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Your Shopping Hub</p>
              <h2 className="text-2xl font-bold">Ready to shop smarter? 🛒</h2>
              <p className="text-green-100 text-sm mt-1 max-w-md">
                All your lists in one place — generated from meal plans &amp; recipes.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold">{stats.totalLists}</p>
                <p className="text-xs text-green-100 mt-0.5">Active Lists</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold">{stats.completedItems}</p>
                <p className="text-xs text-green-100 mt-0.5">Purchased</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold">{stats.thisWeekLists}</p>
                <p className="text-xs text-green-100 mt-0.5">This Week</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Search bar ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-700 p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search shopping lists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* ── Error state ─────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            <button onClick={fetchShoppingLists} className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline">
              Try again
            </button>
          </div>
        )}

        {/* ── Lists content ────────────────────────────────────────────── */}
        {filteredLists.length === 0 ? (
          /* Empty state */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-700 p-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 flex items-center justify-center">
                <ShoppingCart className="w-9 h-9 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No matching lists' : 'No shopping lists yet'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                {searchTerm
                  ? 'Try a different search term.'
                  : 'Generate your first smart list from a meal plan or recipe selection.'}
              </p>
              {!searchTerm && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setShowMealPlanModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-teal-600 text-white text-sm font-semibold rounded-xl shadow shadow-green-500/20 hover:shadow-md transition-all"
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                    From Meal Plan
                  </button>
                  <button
                    onClick={() => setShowRecipeModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                  >
                    <Book className="w-4 h-4" />
                    From Recipes
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLists.map((list) => {
              const progress = list.totalItems > 0
                ? Math.round((list.checkedItems / list.totalItems) * 100)
                : 0;
              const isComplete = progress === 100;

              return (
                <div
                  key={list.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl dark:hover:shadow-2xl ring-1 ring-gray-100 dark:ring-gray-700 hover:ring-green-200 dark:hover:ring-green-800 transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  {/* Accent strip — green when complete, teal otherwise */}
                  <div className={`h-1.5 w-full ${isComplete ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-green-400 to-teal-500'}`} />

                  <div className="flex flex-col flex-1 p-5 gap-3">

                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight line-clamp-1">
                            {list.title}
                          </h3>
                          {isComplete && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full">
                              <PackageCheck className="w-3 h-3" /> Done
                            </span>
                          )}
                        </div>
                        {/* Source label */}
                        {list.mealPlan ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <UtensilsCrossed className="w-3 h-3" />
                            {list.mealPlan.title}
                          </p>
                        ) : list.sourceType?.toLowerCase().includes('recipe') ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Book className="w-3 h-3" />
                            Recipe list
                          </p>
                        ) : list.sourceType?.toLowerCase().includes('meal') ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <UtensilsCrossed className="w-3 h-3" />
                            Meal plan list
                          </p>
                        ) : null}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteClick(list.id, list.title)}
                        className="flex-shrink-0 p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-gray-500 dark:text-gray-400">
                          {list.checkedItems} / {list.totalItems} items
                        </span>
                        <span className={`font-semibold ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-teal-600 dark:text-teal-400'}`}>
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete
                              ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                              : 'bg-gradient-to-r from-green-400 to-teal-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex-1" />

                    {/* Footer row */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/60">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(list.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        {list.mealPlan && (
                          <>
                            <span>·</span>
                            <Link
                              href={`/meal-planner/${list.mealPlan.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-0.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                            >
                              View plan <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </>
                        )}
                        {!list.mealPlan && list.sourceType?.toLowerCase().includes('recipe') && list.sourceIds?.[0] && (
                          <>
                            <span>·</span>
                            <Link
                              href={`/recipes/${list.sourceIds[0]}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-0.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                            >
                              View recipe <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </>
                        )}
                      </div>

                      <Link
                        href={`/shopping-lists/${list.id}`}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-green-500 to-teal-600 text-white text-xs font-semibold rounded-full shadow-sm shadow-green-500/20 hover:shadow-md hover:shadow-green-500/30 hover:from-green-600 hover:to-teal-700 transition-all group-hover/btn:translate-x-0"
                      >
                        Open <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <MealPlanSelectionModal
        isOpen={showMealPlanModal}
        onClose={() => setShowMealPlanModal(false)}
        onSuccess={handleRefresh}
      />
      
      <RecipeSelectionModal
        isOpen={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        onSuccess={handleRefresh}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Shopping List"
        message={`Are you sure you want to delete "${deleteDialog.listTitle}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
        details={
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-800">
              This action cannot be undone. All items in this shopping list will be permanently deleted.
            </p>
          </div>
        }
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}