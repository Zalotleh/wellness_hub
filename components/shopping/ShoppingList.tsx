'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingCart,
  Check,
  Plus,
  Minus,
  ExternalLink,
  DollarSign,
  Filter,
  Search,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { generateInstacartLink, generateAmazonFreshLink } from '@/lib/utils/sharing';

// Types
interface ShoppingListItem {
  id: string;
  ingredient: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  estimatedCost?: number;
  notes?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface ShoppingListProps {
  items: ShoppingListItem[];
  onItemUpdate: (itemId: string, updates: Partial<ShoppingListItem>) => void;
  onItemDelete: (itemId: string) => void;
  onItemAdd: (item: Omit<ShoppingListItem, 'id'>) => void;
  className?: string;
  showPricing?: boolean;
  enableSwipeGestures?: boolean;
  persistState?: boolean;
}

// Shopping categories with icons and colors
const CATEGORIES = {
  'Produce': { icon: '🥕', color: 'bg-green-100 text-green-800', lightColor: 'bg-green-50' },
  'Proteins': { icon: '🥩', color: 'bg-red-100 text-red-800', lightColor: 'bg-red-50' },
  'Dairy': { icon: '🥛', color: 'bg-blue-100 text-blue-800', lightColor: 'bg-blue-50' },
  'Grains': { icon: '🌾', color: 'bg-yellow-100 text-yellow-800', lightColor: 'bg-yellow-50' },
  'Pantry': { icon: '🏺', color: 'bg-purple-100 text-purple-800', lightColor: 'bg-purple-50' },
  'Frozen': { icon: '❄️', color: 'bg-cyan-100 text-cyan-800', lightColor: 'bg-cyan-50' },
  'Beverages': { icon: '🥤', color: 'bg-indigo-100 text-indigo-800', lightColor: 'bg-indigo-50' },
  'Snacks': { icon: '🍿', color: 'bg-orange-100 text-orange-800', lightColor: 'bg-orange-50' },
  'Other': { icon: '📦', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800', lightColor: 'bg-gray-50' },
} as const;

// Custom hook for touch/swipe gestures
function useSwipeGestures(enabled: boolean, onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  const elementRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const element = elementRef.current;
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      touchStartX.current = startX;
      touchStartY.current = startY;
      isSwiping.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping.current) {
        const deltaX = Math.abs(e.touches[0].clientX - startX);
        const deltaY = Math.abs(e.touches[0].clientY - startY);
        
        // Start swiping if horizontal movement is greater than vertical
        if (deltaX > deltaY && deltaX > 10) {
          isSwiping.current = true;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping.current) return;

      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - startX;
      const minSwipeDistance = 50;

      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }

      isSwiping.current = false;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onSwipeLeft, onSwipeRight]);

  return elementRef;
}

// Custom hook for state persistence
function usePersistentState<T>(key: string, defaultValue: T, persist: boolean): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (!persist || typeof window === 'undefined') return defaultValue;
    
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setPersistentState = useCallback((value: T) => {
    setState(value);
    if (persist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Silently fail if localStorage is not available
      }
    }
  }, [key, persist]);

  return [state, setPersistentState];
}

// Individual shopping list item component
interface ShoppingItemProps {
  item: ShoppingListItem;
  onUpdate: (updates: Partial<ShoppingListItem>) => void;
  onDelete: () => void;
  showPricing?: boolean;
  enableSwipe?: boolean;
}

function ShoppingItem({ item, onUpdate, onDelete, showPricing = true, enableSwipe = true }: ShoppingItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(item);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const swipeRef = useSwipeGestures(
    enableSwipe,
    () => {
      // Swipe left - show delete action
      setSwipeOffset(-80);
      setTimeout(() => setSwipeOffset(0), 2000);
    },
    () => {
      // Swipe right - toggle check
      onUpdate({ checked: !item.checked });
    }
  );

  const handleSave = () => {
    onUpdate({
      ingredient: editedItem.ingredient,
      quantity: editedItem.quantity,
      unit: editedItem.unit,
      notes: editedItem.notes,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedItem(item);
    setIsEditing(false);
  };

  const priorityColors = {
    high: 'border-l-red-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-green-500',
  };

  return (
    <div 
      ref={swipeRef}
      className={`
        relative overflow-hidden transition-transform duration-200
        ${swipeOffset !== 0 ? 'transform' : ''}
      `}
      style={{ transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined }}
    >
      {/* Swipe actions background */}
      {swipeOffset !== 0 && (
        <div className="absolute inset-y-0 right-0 w-20 bg-red-500 flex items-center justify-center">
          <button
            onClick={onDelete}
            className="text-white p-2"
            aria-label="Delete item"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}

      <div 
        className={`
          flex items-center gap-3 p-4 bg-white border-b border-gray-100
          ${item.priority ? `border-l-4 ${priorityColors[item.priority]}` : ''}
          ${item.checked ? 'opacity-60 bg-gray-50' : ''}
          transition-all duration-200
        `}
      >
        {/* Checkbox */}
        <button
          onClick={() => onUpdate({ checked: !item.checked })}
          className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
            ${item.checked 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300 hover:border-green-400'
            }
          `}
          aria-label={item.checked ? 'Uncheck item' : 'Check item'}
        >
          {item.checked && <Check className="w-4 h-4" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editedItem.ingredient}
                  onChange={(e) => setEditedItem(prev => ({ ...prev, ingredient: e.target.value }))}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Item name"
                />
                <input
                  type="number"
                  value={editedItem.quantity}
                  onChange={(e) => setEditedItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  min="0"
                  step="0.1"
                />
                <input
                  type="text"
                  value={editedItem.unit}
                  onChange={(e) => setEditedItem(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="unit"
                />
              </div>
              {editedItem.notes !== undefined && (
                <input
                  type="text"
                  value={editedItem.notes || ''}
                  onChange={(e) => setEditedItem(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Notes (optional)"
                />
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${item.checked ? 'line-through text-gray-500 dark:text-gray-300' : 'text-gray-900'}`}>
                    {item.ingredient}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-300">
                    {item.quantity} {item.unit}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-200 truncate">{item.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Price */}
                {showPricing && item.estimatedCost && (
                  <span className="text-sm font-medium text-green-600">
                    ${item.estimatedCost.toFixed(2)}
                  </span>
                )}

                {/* Edit button */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Edit item"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main ShoppingList component
export default function ShoppingList({
  items,
  onItemUpdate,
  onItemDelete,
  onItemAdd,
  className = '',
  showPricing = true,
  enableSwipeGestures = true,
  persistState = true,
}: ShoppingListProps) {
  const [collapsedCategories, setCollapsedCategories] = usePersistentState(
    'shopping-list-collapsed', 
    {} as Record<string, boolean>, 
    persistState
  );
  const [showCompleted, setShowCompleted] = usePersistentState(
    'shopping-list-show-completed', 
    true, 
    persistState
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'category' | 'price' | 'priority'>('category');

  // Group items by category
  const itemsByCategory = useCallback(() => {
    let filteredItems = items;

    // Apply search filter
    if (searchTerm) {
      filteredItems = filteredItems.filter(item =>
        item.ingredient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply completed filter
    if (!showCompleted) {
      filteredItems = filteredItems.filter(item => !item.checked);
    }

    // Group by category
    const grouped = filteredItems.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, ShoppingListItem[]>);

    // Sort items within each category
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        if (sortBy === 'price' && a.estimatedCost && b.estimatedCost) {
          return b.estimatedCost - a.estimatedCost;
        }
        if (sortBy === 'priority') {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const aVal = priorityOrder[a.priority || 'low'];
          const bVal = priorityOrder[b.priority || 'low'];
          return bVal - aVal;
        }
        return a.ingredient.localeCompare(b.ingredient);
      });
    });

    return grouped;
  }, [items, searchTerm, showCompleted, sortBy]);

  // Calculate totals
  const totals = useCallback(() => {
    const uncheckedItems = items.filter(item => !item.checked);
    const checkedItems = items.filter(item => item.checked);
    const totalCost = items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
    const uncheckedCost = uncheckedItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

    return {
      total: items.length,
      checked: checkedItems.length,
      unchecked: uncheckedItems.length,
      progress: items.length > 0 ? (checkedItems.length / items.length) * 100 : 0,
      totalCost,
      uncheckedCost,
    };
  }, [items]);

  const stats = totals();
  const categorizedItems = itemsByCategory();

  // Toggle category collapse
  const toggleCategory = (category: string) => {
    setCollapsedCategories({
      ...collapsedCategories,
      [category]: !collapsedCategories[category]
    });
  };

  // Generate service links
  const handleInstacartExport = () => {
    const itemNames = items
      .filter(item => !item.checked)
      .map(item => `${item.ingredient} ${item.quantity} ${item.unit}`.trim());
    
    const url = generateInstacartLink(itemNames);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAmazonExport = () => {
    const itemNames = items
      .filter(item => !item.checked)
      .map(item => `${item.ingredient} ${item.quantity} ${item.unit}`.trim());
    
    const url = generateAmazonFreshLink(itemNames);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6" />
            <h2 className="text-xl font-bold">Shopping List</h2>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {stats.checked}/{stats.total}
            </div>
            <div className="text-sm opacity-90">items completed</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/20 rounded-full h-2 mb-4">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.progress}%` }}
          />
        </div>

        {/* Price summary */}
        {showPricing && (
          <div className="flex justify-between text-sm">
            <span>Remaining: ${stats.uncheckedCost.toFixed(2)}</span>
            <span>Total: ${stats.totalCost.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 w-4 h-4" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="category">Sort by Category</option>
              <option value="price">Sort by Price</option>
              <option value="priority">Sort by Priority</option>
            </select>

            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`
                px-3 py-2 rounded-lg border transition-colors flex items-center gap-2
                ${showCompleted 
                  ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 text-gray-700' 
                  : 'bg-blue-50 border-blue-200 text-blue-700'
                }
              `}
            >
              {showCompleted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {showCompleted ? 'Hide' : 'Show'} Completed
              </span>
            </button>
          </div>
        </div>

        {/* Service integration buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleInstacartExport}
            disabled={stats.unchecked === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Shop on Instacart</span>
            <span className="text-sm opacity-75">({stats.unchecked} items)</span>
          </button>

          <button
            onClick={handleAmazonExport}
            disabled={stats.unchecked === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Shop on Amazon Fresh</span>
            <span className="text-sm opacity-75">({stats.unchecked} items)</span>
          </button>
        </div>
      </div>

      {/* Items by category */}
      <div className="max-h-96 overflow-y-auto">
        {Object.keys(categorizedItems).length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-300">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No items found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          Object.entries(categorizedItems).map(([category, categoryItems]) => {
            const categoryInfo = CATEGORIES[category as keyof typeof CATEGORIES] || CATEGORIES['Other'];
            const isCollapsed = collapsedCategories[category];
            const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
            const checkedCount = categoryItems.filter(item => item.checked).length;

            return (
              <div key={category} className="border-b border-gray-100 last:border-b-0">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className={`
                    w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:bg-gray-700 transition-colors
                    ${categoryInfo.lightColor}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span className="text-lg">{categoryInfo.icon}</span>
                    <span className="font-semibold text-gray-900">{category}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${categoryInfo.color}`}>
                      {checkedCount}/{categoryItems.length}
                    </span>
                  </div>
                  
                  {showPricing && categoryTotal > 0 && (
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-200">
                      ${categoryTotal.toFixed(2)}
                    </span>
                  )}
                </button>

                {/* Category items */}
                {!isCollapsed && (
                  <div className="divide-y divide-gray-100">
                    {categoryItems.map(item => (
                      <div key={item.id} className="group">
                        <ShoppingItem
                          item={item}
                          onUpdate={(updates) => onItemUpdate(item.id, updates)}
                          onDelete={() => onItemDelete(item.id)}
                          showPricing={showPricing}
                          enableSwipe={enableSwipeGestures}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer with running total */}
      {showPricing && stats.totalCost > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-200">
              {stats.unchecked} items remaining
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                ${stats.uncheckedCost.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300">
                of ${stats.totalCost.toFixed(2)} total
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}