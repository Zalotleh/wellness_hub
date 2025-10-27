'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Check, 
  X,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Users,
  Clock,
  ExternalLink,
  Share2,
  Download,
  CheckCircle2,
  Circle,
  Loader2,
  Square,
  CheckSquare,
  Target
} from 'lucide-react';

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
  mealPlanId: string | null;
  mealPlan?: {
    id: string;
    title: string;
    description: string;
    createdAt: string;
  };
  totalItems: number;
  totalCost?: number;
  currency?: string;
  pantryFiltered: boolean;
  lastExported?: string;
  createdAt: string;
  updatedAt: string;
  items: ShoppingListItem[];
}

export default function ShoppingListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, itemIndex: number, itemName: string}>({
    show: false,
    itemIndex: -1,
    itemName: ''
  });

  useEffect(() => {
    if (params.id) {
      fetchShoppingList();
    }
  }, [params.id]);

  const fetchShoppingList = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shopping-lists/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Shopping list not found');
        } else {
          setError('Failed to load shopping list');
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        setShoppingList(data.data);
      } else {
        setError(data.error || 'Failed to load shopping list');
      }
    } catch (err) {
      setError('Failed to load shopping list');
      console.error('Error fetching shopping list:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (itemIndex: number) => {
    if (!shoppingList || updating) return;

    try {
      setUpdating(true);
      const updatedItems = [...shoppingList.items];
      updatedItems[itemIndex].checked = !updatedItems[itemIndex].checked;

      const response = await fetch(`/api/shopping-lists/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: updatedItems,
        }),
      });

      if (response.ok) {
        setShoppingList(prev => prev ? {
          ...prev,
          items: updatedItems,
        } : null);
      } else {
        throw new Error('Failed to update item');
      }
    } catch (error) {
      console.error('Error toggling item:', error);
      setError('Failed to update item');
    } finally {
      setUpdating(false);
    }
  };

  const deleteItem = (itemIndex: number) => {
    if (!shoppingList || updating) return;
    
    const item = shoppingList.items[itemIndex];
    setDeleteConfirm({
      show: true,
      itemIndex,
      itemName: item.ingredient
    });
  };

  const confirmDeleteItem = async () => {
    if (!shoppingList || updating || deleteConfirm.itemIndex === -1) return;

    try {
      setUpdating(true);
      const updatedItems = shoppingList.items.filter((_, index) => index !== deleteConfirm.itemIndex);

      const response = await fetch(`/api/shopping-lists/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: updatedItems,
        }),
      });

      if (response.ok) {
        setShoppingList(prev => prev ? {
          ...prev,
          items: updatedItems,
          totalItems: updatedItems.length,
        } : null);
        
        // Close confirmation dialog
        setDeleteConfirm({
          show: false,
          itemIndex: -1,
          itemName: ''
        });
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item');
    } finally {
      setUpdating(false);
    }
  };

  const markAllComplete = async () => {
    if (!shoppingList || updating) return;

    try {
      setUpdating(true);
      const updatedItems = shoppingList.items.map(item => ({
        ...item,
        checked: true,
      }));

      const response = await fetch(`/api/shopping-lists/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: updatedItems,
        }),
      });

      if (response.ok) {
        setShoppingList(prev => prev ? {
          ...prev,
          items: updatedItems,
        } : null);
      } else {
        throw new Error('Failed to mark all items complete');
      }
    } catch (error) {
      console.error('Error marking all items complete:', error);
      setError('Failed to mark all items complete');
    } finally {
      setUpdating(false);
    }
  };

  const markAllIncomplete = async () => {
    if (!shoppingList || updating) return;

    try {
      setUpdating(true);
      const updatedItems = shoppingList.items.map(item => ({
        ...item,
        checked: false,
      }));

      const response = await fetch(`/api/shopping-lists/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: updatedItems,
        }),
      });

      if (response.ok) {
        setShoppingList(prev => prev ? {
          ...prev,
          items: updatedItems,
        } : null);
      } else {
        throw new Error('Failed to mark all items incomplete');
      }
    } catch (error) {
      console.error('Error marking all items incomplete:', error);
      setError('Failed to mark all items incomplete');
    } finally {
      setUpdating(false);
    }
  };

  // Bulk selection functions
  const toggleItemSelection = (itemIndex: number) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(itemIndex)) {
        newSelected.delete(itemIndex);
      } else {
        newSelected.add(itemIndex);
      }
      return newSelected;
    });
  };

  const selectAllItems = () => {
    if (!shoppingList) return;
    setSelectedItems(new Set(shoppingList.items.map((_, index) => index)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Bulk operations
  const bulkDeleteSelected = async () => {
    if (!shoppingList || updating || selectedItems.size === 0) return;

    try {
      setUpdating(true);
      const updatedItems = shoppingList.items.filter((_, index) => !selectedItems.has(index));

      const response = await fetch(`/api/shopping-lists/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: updatedItems,
        }),
      });

      if (response.ok) {
        setShoppingList(prev => prev ? {
          ...prev,
          items: updatedItems,
          totalItems: updatedItems.length,
        } : null);
        clearSelection();
      } else {
        throw new Error('Failed to delete selected items');
      }
    } catch (error) {
      console.error('Error deleting selected items:', error);
      setError('Failed to delete selected items');
    } finally {
      setUpdating(false);
    }
  };

  const bulkMarkComplete = async () => {
    if (!shoppingList || updating || selectedItems.size === 0) return;

    try {
      setUpdating(true);
      const updatedItems = shoppingList.items.map((item, index) => 
        selectedItems.has(index) ? { ...item, checked: true } : item
      );

      const response = await fetch(`/api/shopping-lists/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: updatedItems,
        }),
      });

      if (response.ok) {
        setShoppingList(prev => prev ? {
          ...prev,
          items: updatedItems,
        } : null);
        clearSelection();
      } else {
        throw new Error('Failed to mark selected items complete');
      }
    } catch (error) {
      console.error('Error marking selected items complete:', error);
      setError('Failed to mark selected items complete');
    } finally {
      setUpdating(false);
    }
  };

  const getCompletionStats = () => {
    if (!shoppingList) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = shoppingList.items.filter(item => item.checked).length;
    const total = shoppingList.items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  const groupItemsByCategory = (items: ShoppingListItem[]) => {
    const grouped = items.reduce((acc, item, index) => {
      const category = item.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({ ...item, originalIndex: index });
      return acc;
    }, {} as Record<string, Array<ShoppingListItem & { originalIndex: number }>>);

    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !shoppingList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <X className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {error === 'Shopping list not found' ? 'Shopping List Not Found' : 'Error Loading Shopping List'}
            </h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Go Back
              </button>
              <Link
                href="/shopping-lists"
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                View All Lists
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = getCompletionStats();
  const groupedItems = groupItemsByCategory(shoppingList.items);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{shoppingList.title}</h1>
              {shoppingList.mealPlan && (
                <p className="text-gray-600">From: {shoppingList.mealPlan.title}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:bg-white/50 rounded-lg transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-white/50 rounded-lg transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Shopping Progress</h2>
              <p className="text-gray-600">
                {stats.completed} of {stats.total} items completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">{stats.percentage}%</div>
              <div className="text-sm text-gray-500">complete</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${stats.percentage}%` }}
            ></div>
          </div>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Created {new Date(shoppingList.createdAt).toLocaleDateString()}</span>
            </div>
            {shoppingList.totalCost && (
              <div className="flex items-center space-x-2">
                <span>Est. Cost: ${shoppingList.totalCost.toFixed(2)}</span>
              </div>
            )}
            {shoppingList.mealPlan && (
              <Link
                href={`/meal-planner/${shoppingList.mealPlan.id}`}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>View Meal Plan</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Shopping List Items */}
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                {category}
              </h3>
              
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.originalIndex}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                      item.checked
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <button
                      onClick={() => toggleItem(item.originalIndex)}
                      disabled={updating}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        item.checked
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {updating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : item.checked ? (
                        <Check className="w-3 h-3" />
                      ) : null}
                    </button>
                    
                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.originalIndex)}
                      onChange={() => toggleItemSelection(item.originalIndex)}
                      disabled={updating}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                    />
                    
                    <div className="flex-1">
                      <div className={`font-medium ${item.checked ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {item.ingredient}
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.quantity} {item.unit}
                        {item.estimatedCost && (
                          <span className="ml-2">• ${item.estimatedCost.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteItem(item.originalIndex)}
                      disabled={updating}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
          
          {/* Selection Controls */}
          {selectedItems.size > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-800">
                    {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear selection
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={bulkMarkComplete}
                    disabled={updating}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Complete</span>
                  </button>
                  <button
                    onClick={bulkDeleteSelected}
                    disabled={updating}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:bg-gray-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3">
            {/* Individual Actions */}
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
            
            {/* Selection Actions */}
            <button
              onClick={selectedItems.size === shoppingList.items.length ? clearSelection : selectAllItems}
              disabled={updating || shoppingList.items.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {selectedItems.size === shoppingList.items.length ? (
                <>
                  <Square className="w-4 h-4" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" />
                  <span>Select All</span>
                </>
              )}
            </button>
            
            {/* List Actions */}
            <button 
              onClick={markAllComplete}
              disabled={updating}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Mark All Complete</span>
            </button>
            
            <button 
              onClick={markAllIncomplete}
              disabled={updating}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
              <span>Mark All Incomplete</span>
            </button>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Delete Item</h3>
                <p className="text-gray-600">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.itemName}"</strong> from your shopping list?
            </p>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setDeleteConfirm({show: false, itemIndex: -1, itemName: ''})}
                disabled={updating}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteItem}
                disabled={updating}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}