'use client';

import { useState, useCallback, useEffect } from 'react';

interface ShoppingListItem {
  id: string;
  ingredient: string;
  quantity: number;
  unit: string;
  originalUnit?: string;
  category: string;
  checked: boolean;
  estimatedCost?: number;
  notes?: string;
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    defenseSystems?: string[];
  };
}

interface ShoppingList {
  id: string;
  title: string;
  items: ShoppingListItem[];
  totalItems: number;
  totalCost: number;
  pantryFiltered: boolean;
  progress: number;
  checkedItems: number;
  lastUpdated: Date;
}

interface UseShoppingListOptions {
  mealPlanId: string;
  onItemChecked?: (itemId: string, checked: boolean) => void;
  onError?: (error: string) => void;
}

interface UseShoppingListReturn {
  shoppingList: ShoppingList | null;
  isLoading: boolean;
  error: string | null;
  isGenerating: boolean;
  isUpdating: boolean;
  generateList: (options?: { filterPantry?: boolean; includeNutrition?: boolean }) => Promise<void>;
  updateItemChecked: (itemId: string, checked: boolean) => Promise<void>;
  updateMultipleItems: (items: ShoppingListItem[]) => Promise<void>;
  deleteList: () => Promise<void>;
  refetch: () => Promise<void>;
  clearError: () => void;
  // Utility functions
  getItemsByCategory: () => Record<string, ShoppingListItem[]>;
  getTotalByCategory: () => Record<string, { items: number; cost: number }>;
  getProgress: () => { checked: number; total: number; percentage: number };
}

export function useShoppingList({
  mealPlanId,
  onItemChecked,
  onError,
}: UseShoppingListOptions): UseShoppingListReturn {
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    onError?.(errorMessage);
  }, [onError]);

  // Fetch shopping list
  const fetchShoppingList = useCallback(async () => {
    if (!mealPlanId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/meal-planner/${mealPlanId}/shopping-list`);
      
      if (response.status === 404) {
        setShoppingList(null);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch shopping list');
      }

      const data = await response.json();
      setShoppingList(data.data);
    } catch (err: any) {
      handleError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [mealPlanId, handleError]);

  // Generate shopping list
  const generateList = useCallback(async (options?: { filterPantry?: boolean; includeNutrition?: boolean }) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/meal-planner/${mealPlanId}/shopping-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterPantry: options?.filterPantry || false,
          includeNutrition: options?.includeNutrition || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.upgrade) {
          throw new Error(errorData.message || errorData.error);
        }
        throw new Error(errorData.error || 'Failed to generate shopping list');
      }

      const data = await response.json();
      setShoppingList(data.data);
    } catch (err: any) {
      handleError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [mealPlanId, handleError]);

  // Update single item checked status with optimistic updates
  const updateItemChecked = useCallback(async (itemId: string, checked: boolean) => {
    if (!shoppingList) return;

    // Optimistic update
    const optimisticItems = shoppingList.items.map(item =>
      item.id === itemId ? { ...item, checked } : item
    );
    const checkedCount = optimisticItems.filter(item => item.checked).length;
    const progress = Math.round((checkedCount / optimisticItems.length) * 100);

    setShoppingList(prev => prev ? {
      ...prev,
      items: optimisticItems,
      checkedItems: checkedCount,
      progress,
    } : null);

    // Notify parent component immediately
    onItemChecked?.(itemId, checked);

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/meal-planner/${mealPlanId}/shopping-list`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          checked,
        }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        const revertedItems = shoppingList.items.map(item =>
          item.id === itemId ? { ...item, checked: !checked } : item
        );
        const revertedCheckedCount = revertedItems.filter(item => item.checked).length;
        const revertedProgress = Math.round((revertedCheckedCount / revertedItems.length) * 100);

        setShoppingList(prev => prev ? {
          ...prev,
          items: revertedItems,
          checkedItems: revertedCheckedCount,
          progress: revertedProgress,
        } : null);

        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update item');
      }

      const data = await response.json();
      setShoppingList(data.data);
    } catch (err: any) {
      handleError(err.message);
    } finally {
      setIsUpdating(false);
    }
  }, [shoppingList, mealPlanId, onItemChecked, handleError]);

  // Update multiple items (bulk operations)
  const updateMultipleItems = useCallback(async (items: ShoppingListItem[]) => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/meal-planner/${mealPlanId}/shopping-list`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update shopping list');
      }

      const data = await response.json();
      setShoppingList(data.data);
    } catch (err: any) {
      handleError(err.message);
    } finally {
      setIsUpdating(false);
    }
  }, [mealPlanId, handleError]);

  // Delete shopping list
  const deleteList = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/meal-planner/${mealPlanId}/shopping-list`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete shopping list');
      }

      setShoppingList(null);
    } catch (err: any) {
      handleError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [mealPlanId, handleError]);

  // Utility: Group items by category
  const getItemsByCategory = useCallback(() => {
    if (!shoppingList) return {};

    return shoppingList.items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ShoppingListItem[]>);
  }, [shoppingList]);

  // Utility: Calculate totals by category
  const getTotalByCategory = useCallback(() => {
    if (!shoppingList) return {};

    return shoppingList.items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { items: 0, cost: 0 };
      }
      acc[item.category].items += 1;
      acc[item.category].cost += item.estimatedCost || 0;
      return acc;
    }, {} as Record<string, { items: number; cost: number }>);
  }, [shoppingList]);

  // Utility: Get progress information
  const getProgress = useCallback(() => {
    if (!shoppingList) {
      return { checked: 0, total: 0, percentage: 0 };
    }

    const checked = shoppingList.checkedItems;
    const total = shoppingList.totalItems;
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

    return { checked, total, percentage };
  }, [shoppingList]);

  // Initial fetch on mount
  useEffect(() => {
    fetchShoppingList();
  }, [fetchShoppingList]);

  return {
    shoppingList,
    isLoading,
    error,
    isGenerating,
    isUpdating,
    generateList,
    updateItemChecked,
    updateMultipleItems,
    deleteList,
    refetch: fetchShoppingList,
    clearError,
    getItemsByCategory,
    getTotalByCategory,
    getProgress,
  };
}

// Hook for pantry management
interface PantryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minimumStock: number;
  alwaysHave: boolean;
  expiryDate?: Date;
  cost?: number;
  location?: string;
  notes?: string;
}

interface UsePantryReturn {
  pantryItems: PantryItem[];
  isLoading: boolean;
  error: string | null;
  addItem: (item: Omit<PantryItem, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<PantryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  checkStock: (ingredientName: string) => PantryItem | null;
  getLowStockItems: () => PantryItem[];
  getExpiringItems: (days?: number) => PantryItem[];
  refetch: () => Promise<void>;
  clearError: () => void;
}

export function usePantry(): UsePantryReturn {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  // Fetch pantry items
  const fetchPantryItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pantry');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pantry items');
      }

      const data = await response.json();
      setPantryItems(data.items || []);
    } catch (err: any) {
      handleError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Add pantry item
  const addItem = useCallback(async (item: Omit<PantryItem, 'id'>) => {
    setError(null);

    try {
      const response = await fetch('/api/pantry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add pantry item');
      }

      const data = await response.json();
      setPantryItems(prev => [...prev, data.item]);
    } catch (err: any) {
      handleError(err.message);
    }
  }, [handleError]);

  // Update pantry item
  const updateItem = useCallback(async (id: string, updates: Partial<PantryItem>) => {
    setError(null);

    try {
      const response = await fetch(`/api/pantry/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update pantry item');
      }

      const data = await response.json();
      setPantryItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...data.item } : item
      ));
    } catch (err: any) {
      handleError(err.message);
    }
  }, [handleError]);

  // Delete pantry item
  const deleteItem = useCallback(async (id: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/pantry/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete pantry item');
      }

      setPantryItems(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      handleError(err.message);
    }
  }, [handleError]);

  // Check if ingredient is in stock
  const checkStock = useCallback((ingredientName: string): PantryItem | null => {
    return pantryItems.find(item => 
      item.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
      ingredientName.toLowerCase().includes(item.name.toLowerCase())
    ) || null;
  }, [pantryItems]);

  // Get low stock items
  const getLowStockItems = useCallback(() => {
    return pantryItems.filter(item => 
      item.currentStock <= item.minimumStock
    );
  }, [pantryItems]);

  // Get expiring items
  const getExpiringItems = useCallback((days: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return pantryItems.filter(item => 
      item.expiryDate && new Date(item.expiryDate) <= cutoffDate
    );
  }, [pantryItems]);

  // Initial fetch
  useEffect(() => {
    fetchPantryItems();
  }, [fetchPantryItems]);

  return {
    pantryItems,
    isLoading,
    error,
    addItem,
    updateItem,
    deleteItem,
    checkStock,
    getLowStockItems,
    getExpiringItems,
    refetch: fetchPantryItems,
    clearError,
  };
}