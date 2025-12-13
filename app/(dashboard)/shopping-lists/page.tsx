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
  UtensilsCrossed
} from 'lucide-react';
import MealPlanSelectionModal from '@/components/shopping-lists/MealPlanSelectionModal';
import RecipeSelectionModal from '@/components/shopping-lists/RecipeSelectionModal';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchShoppingLists();
  }, []);

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

  const filteredLists = shoppingLists.filter(list =>
    list.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.mealPlan?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Shopping Lists</h1>
                <p className="text-gray-600">Smart shopping lists from your meal plans</p>
              </div>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Shopping List</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showCreateDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowCreateDropdown(false);
                        setShowMealPlanModal(true);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                    >
                      <UtensilsCrossed className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-800">From Meal Plans</div>
                        <div className="text-sm text-gray-600">Generate from existing meal plans</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowCreateDropdown(false);
                        setShowRecipeModal(true);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                    >
                      <Book className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-800">From Recipes</div>
                        <div className="text-sm text-gray-600">Generate from selected recipes</div>
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalLists}</p>
                <p className="text-sm text-gray-600">Active Lists</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.completedItems}</p>
                <p className="text-sm text-gray-600">Items Purchased</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.thisWeekLists}</p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search shopping lists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchShoppingLists}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Shopping Lists Content */}
        {filteredLists.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {searchTerm ? 'No matching lists found' : 'No shopping lists yet!'}
              </h2>
              <p className="text-gray-600 mb-8">
                {searchTerm 
                  ? 'Try adjusting your search terms to find what you\'re looking for.'
                  : 'Start by creating a meal plan or generate your first smart shopping list.'
                }
              </p>
              {!searchTerm && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">Get started by:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
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
              <div key={list.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-1">{list.title}</h3>
                    {list.mealPlan && (
                      <p className="text-sm text-gray-600 mb-2">
                        From: {list.mealPlan.title}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{list.totalItems} items</span>
                      <span>{list.checkedItems} completed</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {Math.round((list.checkedItems / list.totalItems) * 100) || 0}%
                      </div>
                      <div className="text-xs text-gray-500">complete</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(list.checkedItems / list.totalItems) * 100 || 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(list.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Link
                    href={`/shopping-lists/${list.id}`}
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>View</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {list.mealPlan && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Link
                      href={`/meal-planner/${list.mealPlan.id}`}
                      className="inline-flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      <span>View Meal Plan</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
                
                {!list.mealPlan && list.title.toLowerCase().includes('recipe') && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Link
                      href="/recipes"
                      className="inline-flex items-center space-x-1 text-sm text-green-600 hover:text-green-800 transition-colors"
                    >
                      <Book className="w-4 h-4" />
                      <span>View Recipes</span>
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
    </div>
  );
}