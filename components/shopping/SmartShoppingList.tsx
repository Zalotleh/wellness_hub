'use client';

import React, { useState, useCallback } from 'react';
import { useShoppingList } from '@/hooks/useShoppingList';
import { cn } from '@/lib/utils';

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

interface SmartShoppingListProps {
  mealPlanId: string;
  className?: string;
  showNutrition?: boolean;
  showPricing?: boolean;
  onItemChecked?: (itemId: string, checked: boolean) => void;
}

export default function SmartShoppingList({
  mealPlanId,
  className,
  showNutrition = false,
  showPricing = true,
  onItemChecked,
}: SmartShoppingListProps) {
  const [viewMode, setViewMode] = useState<'category' | 'list'>('category');
  const [filterPantry, setFilterPantry] = useState(false);
  const [includeNutrition, setIncludeNutrition] = useState(showNutrition);
  const [showCompleted, setShowCompleted] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    shoppingList,
    isLoading,
    error,
    isGenerating,
    isUpdating,
    generateList,
    updateItemChecked,
    updateMultipleItems,
    deleteList,
    clearError,
    getItemsByCategory,
    getTotalByCategory,
    getProgress,
  } = useShoppingList({
    mealPlanId,
    onItemChecked,
  });

  // Filter items based on search and completion status
  const getFilteredItems = useCallback((items: ShoppingListItem[]) => {
    let filtered = items;

    if (!showCompleted) {
      filtered = filtered.filter(item => !item.checked);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.ingredient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [showCompleted, searchTerm]);

  const handleGenerateList = useCallback(async () => {
    await generateList({
      filterPantry,
      includeNutrition,
    });
  }, [generateList, filterPantry, includeNutrition]);

  const handleItemCheck = useCallback(async (itemId: string, checked: boolean) => {
    await updateItemChecked(itemId, checked);
  }, [updateItemChecked]);

  const handleSelectAll = useCallback(async () => {
    if (!shoppingList) return;

    const allChecked = shoppingList.items.every(item => item.checked);
    const updatedItems = shoppingList.items.map(item => ({
      ...item,
      checked: !allChecked,
    }));

    // Update all items at once for better performance
    await updateMultipleItems(updatedItems);
  }, [shoppingList]);

  const progress = getProgress();
  const itemsByCategory = getItemsByCategory();
  const totalsByCategory = getTotalByCategory();

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('p-6', className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // No shopping list state
  if (!shoppingList && !error) {
    return (
      <div className={cn('p-6 text-center', className)}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 5M7 13l-1.5-5m0 0L4 5H2m5 8h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Shopping List</h3>
        <p className="text-gray-600 mb-4">Generate a smart shopping list from your meal plan recipes.</p>
        
        <div className="space-y-4 max-w-sm mx-auto">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="filterPantry"
              checked={filterPantry}
              onChange={(e) => setFilterPantry(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="filterPantry" className="text-sm text-gray-700">
              Filter out pantry items
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeNutrition"
              checked={includeNutrition}
              onChange={(e) => setIncludeNutrition(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeNutrition" className="text-sm text-gray-700">
              Include nutrition info (Premium)
            </label>
          </div>

          <button
            onClick={handleGenerateList}
            disabled={isGenerating}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate Shopping List'}
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('p-6', className)}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Shopping List</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 text-sm text-red-600 hover:text-red-500"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{shoppingList?.title || 'Shopping List'}</h2>
          <p className="text-sm text-gray-600">
            {progress.checked} of {progress.total} items completed ({progress.percentage}%)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'category' ? 'list' : 'category')}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {viewMode === 'category' ? 'List View' : 'Category View'}
          </button>
          
          <button
            onClick={deleteList}
            className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
          >
            Delete List
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show completed</span>
          </label>

          <button
            onClick={handleSelectAll}
            disabled={isUpdating}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {shoppingList && shoppingList.items.every(item => item.checked) ? 'Uncheck All' : 'Check All'}
          </button>

          <button
            onClick={handleGenerateList}
            disabled={isGenerating}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Regenerate
          </button>
        </div>
      </div>

      {/* Shopping List Items */}
      {viewMode === 'category' ? (
        <CategoryView
          itemsByCategory={itemsByCategory}
          totalsByCategory={totalsByCategory}
          getFilteredItems={getFilteredItems}
          onItemCheck={handleItemCheck}
          showPricing={showPricing}
          showNutrition={showNutrition}
          isUpdating={isUpdating}
        />
      ) : (
        <ListView
          items={shoppingList ? getFilteredItems(shoppingList.items) : []}
          onItemCheck={handleItemCheck}
          showPricing={showPricing}
          showNutrition={showNutrition}
          isUpdating={isUpdating}
        />
      )}

      {/* Summary */}
      {showPricing && shoppingList && shoppingList.totalCost > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Estimated Total</h3>
              <p className="text-sm text-blue-700">
                {shoppingList.totalItems} items • {Object.keys(itemsByCategory).length} categories
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">
                ${shoppingList.totalCost.toFixed(2)}
              </div>
              <p className="text-xs text-blue-700">Estimated cost</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Category View Component
interface CategoryViewProps {
  itemsByCategory: Record<string, ShoppingListItem[]>;
  totalsByCategory: Record<string, { items: number; cost: number }>;
  getFilteredItems: (items: ShoppingListItem[]) => ShoppingListItem[];
  onItemCheck: (itemId: string, checked: boolean) => void;
  showPricing: boolean;
  showNutrition: boolean;
  isUpdating: boolean;
}

function CategoryView({
  itemsByCategory,
  totalsByCategory,
  getFilteredItems,
  onItemCheck,
  showPricing,
  showNutrition,
  isUpdating,
}: CategoryViewProps) {
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Produce': '🥬',
      'Proteins': '🥩',
      'Dairy': '🥛',
      'Grains & Pasta': '🌾',
      'Pantry': '🏺',
      'Frozen': '🧊',
      'Beverages': '🥤',
      'Snacks': '🍿',
      'Other': '📦',
    };
    return icons[category] || '📦';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Produce': 'bg-green-100 text-green-800 border-green-200',
      'Proteins': 'bg-red-100 text-red-800 border-red-200',
      'Dairy': 'bg-blue-100 text-blue-800 border-blue-200',
      'Grains & Pasta': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Pantry': 'bg-purple-100 text-purple-800 border-purple-200',
      'Frozen': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Beverages': 'bg-orange-100 text-orange-800 border-orange-200',
      'Snacks': 'bg-pink-100 text-pink-800 border-pink-200',
      'Other': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {Object.entries(itemsByCategory).map(([category, items]) => {
        const filteredItems = getFilteredItems(items);
        if (filteredItems.length === 0) return null;

        const totals = totalsByCategory[category];
        const completedItems = filteredItems.filter(item => item.checked).length;

        return (
          <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Category Header */}
            <div className={cn(
              'px-4 py-3 border-b border-gray-200 flex items-center justify-between',
              getCategoryColor(category)
            )}>
              <div className="flex items-center space-x-3">
                <span className="text-2xl" role="img" aria-label={category}>
                  {getCategoryIcon(category)}
                </span>
                <div>
                  <h3 className="font-medium">{category}</h3>
                  <p className="text-sm opacity-75">
                    {completedItems}/{filteredItems.length} completed
                  </p>
                </div>
              </div>
              
              {showPricing && (
                <div className="text-right">
                  <div className="font-medium">
                    ${totals.cost.toFixed(2)}
                  </div>
                  <p className="text-xs opacity-75">
                    {totals.items} items
                  </p>
                </div>
              )}
            </div>

            {/* Category Items */}
            <div className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <ShoppingListItemComponent
                  key={item.id}
                  item={item}
                  onCheck={onItemCheck}
                  showPricing={showPricing}
                  showNutrition={showNutrition}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// List View Component
interface ListViewProps {
  items: ShoppingListItem[];
  onItemCheck: (itemId: string, checked: boolean) => void;
  showPricing: boolean;
  showNutrition: boolean;
  isUpdating: boolean;
}

function ListView({
  items,
  onItemCheck,
  showPricing,
  showNutrition,
  isUpdating,
}: ListViewProps) {
  return (
    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
      {items.map((item) => (
        <ShoppingListItemComponent
          key={item.id}
          item={item}
          onCheck={onItemCheck}
          showPricing={showPricing}
          showNutrition={showNutrition}
          isUpdating={isUpdating}
          showCategory
        />
      ))}
    </div>
  );
}

// Individual Item Component
interface ShoppingListItemComponentProps {
  item: ShoppingListItem;
  onCheck: (itemId: string, checked: boolean) => void;
  showPricing: boolean;
  showNutrition: boolean;
  isUpdating: boolean;
  showCategory?: boolean;
}

function ShoppingListItemComponent({
  item,
  onCheck,
  showPricing,
  showNutrition,
  isUpdating,
  showCategory = false,
}: ShoppingListItemComponentProps) {
  const handleCheck = (checked: boolean) => {
    onCheck(item.id, checked);
  };

  return (
    <div className={cn(
      'px-4 py-3 flex items-center space-x-3 transition-all duration-200',
      item.checked ? 'bg-gray-50 opacity-75' : 'bg-white hover:bg-gray-50',
      isUpdating && 'pointer-events-none opacity-50'
    )}>
      <input
        type="checkbox"
        checked={item.checked}
        onChange={(e) => handleCheck(e.target.checked)}
        disabled={isUpdating}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className={cn(
              'font-medium text-gray-900',
              item.checked && 'line-through text-gray-500'
            )}>
              {item.ingredient}
            </h4>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>
                {item.quantity} {item.unit}
                {item.originalUnit && item.originalUnit !== item.unit && (
                  <span className="text-gray-400"> (was {item.originalUnit})</span>
                )}
              </span>
              
              {showCategory && (
                <>
                  <span>•</span>
                  <span>{item.category}</span>
                </>
              )}
            </div>

            {item.notes && (
              <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
            )}

            {showNutrition && item.nutritionInfo && (
              <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                {item.nutritionInfo.calories && (
                  <span>{item.nutritionInfo.calories} cal</span>
                )}
                {item.nutritionInfo.protein && (
                  <span>{item.nutritionInfo.protein}g protein</span>
                )}
                {item.nutritionInfo.defenseSystems && item.nutritionInfo.defenseSystems.length > 0 && (
                  <span className="text-green-600">
                    Defense: {item.nutritionInfo.defenseSystems.join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>

          {showPricing && item.estimatedCost && (
            <div className="text-right">
              <div className={cn(
                'font-medium',
                item.checked ? 'text-gray-400 line-through' : 'text-gray-900'
              )}>
                ${item.estimatedCost.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}