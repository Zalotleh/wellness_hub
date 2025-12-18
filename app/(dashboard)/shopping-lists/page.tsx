// app/(dashboard)/shopping-lists/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter,
  CheckCircle2,
  ListTodo,
  Calendar,
  ChevronRight,
  ExternalLink,
  Clock,
  Users,
  ChevronDown,
  Book,
  UtensilsCrossed,
  Trash2
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
      <div className="p-8 min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Shopping Lists</h1>
                <p className="text-gray-600 dark:text-gray-300">Smart shopping lists from your meal plans</p>
              </div>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Shopping List</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showCreateDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowCreateDropdown(false);
                        setShowMealPlanModal(true);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                    >
                      <UtensilsCrossed className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="font-medium text-gray-800 dark:text-white">From Meal Plans</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Generate from existing meal plans</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowCreateDropdown(false);
                        setShowRecipeModal(true);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                    >
                      <Book className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <div>
                        <div className="font-medium text-gray-800 dark:text-white">From Recipes</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Generate from selected recipes</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalLists}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Lists</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.completedItems}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Items Purchased</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.thisWeekLists}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search shopping lists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button 
              onClick={fetchShoppingLists}
              className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Shopping Lists Content */}
        {filteredLists.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                {searchTerm ? 'No matching lists found' : 'No shopping lists yet!'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                {searchTerm 
                  ? 'Try adjusting your search terms to find what you\'re looking for.'
                  : 'Start by creating a meal plan or generate your first smart shopping list.'
                }
              </p>
              {!searchTerm && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 dark:text-white mb-2">Get started by:</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• Creating a meal plan and generating a shopping list</li>
                      <li>• Adding a custom shopping list</li>
                      <li>• Importing from your favorite recipes</li>
                    </ul>
                  </div>
                  <Link 
                    href="/meal-planner"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Meal Plan</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLists.map((list) => (
              <div key={list.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-1">{list.title}</h3>
                    {list.mealPlan && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        From: {list.mealPlan.title}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{list.totalItems} items</span>
                      <span>{list.checkedItems} completed</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {Math.round((list.checkedItems / list.totalItems) * 100) || 0}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">complete</div>
                    </div>
                    <button
                      onClick={() => handleDeleteClick(list.id, list.title)}
                      className="p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete shopping list"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 dark:from-green-500 dark:to-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(list.checkedItems / list.totalItems) * 100 || 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(list.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Link
                    href={`/shopping-lists/${list.id}`}
                    className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                  >
                    <span>View</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {list.mealPlan && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Link
                      href={`/meal-planner/${list.mealPlan.id}`}
                      className="inline-flex items-center space-x-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      <span>View Meal Plan</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
                
                {!list.mealPlan && list.sourceType === 'recipes' && list.sourceIds && list.sourceIds.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Link
                      href={`/recipes/${list.sourceIds[0]}`}
                      className="inline-flex items-center space-x-1 text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                    >
                      <Book className="w-4 h-4" />
                      <span>View Recipe</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
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