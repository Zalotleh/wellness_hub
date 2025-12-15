'use client';

import React, { useState, useCallback } from 'react';
import { usePantry } from '@/hooks/useShoppingList';
import { cn } from '@/lib/utils';

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

interface PantryManagementProps {
  className?: string;
  onStockAlert?: (lowStockItems: PantryItem[], expiringItems: PantryItem[]) => void;
}

export default function PantryManagement({
  className,
  onStockAlert,
}: PantryManagementProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpiring, setShowExpiring] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    pantryItems,
    isLoading,
    error,
    addItem,
    updateItem,
    deleteItem,
    getLowStockItems,
    getExpiringItems,
    clearError,
  } = usePantry();

  const categories = [
    'all',
    'Produce',
    'Proteins',
    'Dairy',
    'Grains & Pasta',
    'Pantry',
    'Frozen',
    'Beverages',
    'Snacks',
    'Other',
  ];

  // Filter items based on current filters
  const getFilteredItems = useCallback(() => {
    let filtered = pantryItems;

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    // Low stock filter
    if (showLowStock) {
      filtered = filtered.filter(item => item.currentStock <= item.minimumStock);
    }

    // Expiring items filter
    if (showExpiring) {
      const expiringItems = getExpiringItems();
      const expiringIds = new Set(expiringItems.map(item => item.id));
      filtered = filtered.filter(item => expiringIds.has(item.id));
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [pantryItems, filterCategory, showLowStock, showExpiring, searchTerm, getExpiringItems]);

  const lowStockItems = getLowStockItems();
  const expiringItems = getExpiringItems();
  const filteredItems = getFilteredItems();

  // Notify parent of alerts
  React.useEffect(() => {
    if (onStockAlert && (lowStockItems.length > 0 || expiringItems.length > 0)) {
      onStockAlert(lowStockItems, expiringItems);
    }
  }, [lowStockItems, expiringItems, onStockAlert]);

  if (isLoading) {
    return (
      <div className={cn('p-6', className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
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
          <h2 className="text-2xl font-bold text-gray-900">Pantry Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-200">
            {pantryItems.length} items • {lowStockItems.length} low stock • {expiringItems.length} expiring soon
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Item
        </button>
      </div>

      {/* Alerts */}
      {(lowStockItems.length > 0 || expiringItems.length > 0) && (
        <div className="space-y-3">
          {lowStockItems.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Low Stock Alert</h3>
                  <p className="text-sm text-yellow-700">
                    {lowStockItems.length} items are running low: {lowStockItems.slice(0, 3).map(item => item.name).join(', ')}
                    {lowStockItems.length > 3 && ` and ${lowStockItems.length - 3} more`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {expiringItems.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Expiring Soon</h3>
                  <p className="text-sm text-red-700">
                    {expiringItems.length} items expire within 7 days: {expiringItems.slice(0, 3).map(item => item.name).join(', ')}
                    {expiringItems.length > 3 && ` and ${expiringItems.length - 3} more`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search pantry items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Low stock only</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showExpiring}
              onChange={(e) => setShowExpiring(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Expiring soon</span>
          </label>

          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700"
          >
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 text-sm text-red-600 hover:text-red-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pantry Items */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Items Found</h3>
          <p className="text-gray-600 dark:text-gray-200">
            {searchTerm || showLowStock || showExpiring || filterCategory !== 'all'
              ? 'No items match your current filters.'
              : 'Start by adding items to your pantry.'
            }
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <PantryItemCard
              key={item.id}
              item={item}
              onUpdate={updateItem}
              onDelete={deleteItem}
            />
          ))}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
          {filteredItems.map((item) => (
            <PantryItemRow
              key={item.id}
              item={item}
              onUpdate={updateItem}
              onDelete={deleteItem}
            />
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddForm && (
        <AddPantryItemModal
          onAdd={addItem}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}

// Pantry Item Card Component
interface PantryItemCardProps {
  item: PantryItem;
  onUpdate: (id: string, updates: Partial<PantryItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function PantryItemCard({ item, onUpdate, onDelete }: PantryItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStock, setEditedStock] = useState(item.currentStock);

  const isLowStock = item.currentStock <= item.minimumStock;
  const isExpiring = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const handleStockUpdate = async () => {
    await onUpdate(item.id, { currentStock: editedStock });
    setIsEditing(false);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Produce': 'bg-green-100 text-green-800',
      'Proteins': 'bg-red-100 text-red-800',
      'Dairy': 'bg-blue-100 text-blue-800',
      'Grains & Pasta': 'bg-yellow-100 text-yellow-800',
      'Pantry': 'bg-purple-100 text-purple-800',
      'Frozen': 'bg-cyan-100 text-cyan-800',
      'Beverages': 'bg-orange-100 text-orange-800',
      'Snacks': 'bg-pink-100 text-pink-800',
      'Other': 'bg-gray-100 dark:bg-gray-700 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 dark:bg-gray-700 text-gray-800';
  };

  return (
    <div className={cn(
      'border rounded-lg p-4 transition-all duration-200',
      isLowStock ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{item.name}</h3>
          <span className={cn(
            'inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full',
            getCategoryColor(item.category)
          )}>
            {item.category}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {item.alwaysHave && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Always Have
            </span>
          )}
          
          {isLowStock && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Low Stock
            </span>
          )}
          
          {isExpiring && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              Expiring
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-200">Current Stock:</span>
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={editedStock}
                onChange={(e) => setEditedStock(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                min="0"
                step="0.1"
              />
              <button
                onClick={handleStockUpdate}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedStock(item.currentStock);
                }}
                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-100"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium text-gray-900 hover:text-blue-600"
            >
              {item.currentStock} {item.unit}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-200">
          <span>Minimum:</span>
          <span>{item.minimumStock} {item.unit}</span>
        </div>

        {item.expiryDate && (
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-200">
            <span>Expires:</span>
            <span className={isExpiring ? 'text-red-600 font-medium' : ''}>
              {new Date(item.expiryDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {item.location && (
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-200">
            <span>Location:</span>
            <span>{item.location}</span>
          </div>
        )}

        {item.cost && (
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-200">
            <span>Cost:</span>
            <span>${item.cost.toFixed(2)}</span>
          </div>
        )}
      </div>

      {item.notes && (
        <p className="text-xs text-gray-500 dark:text-gray-300 mt-2 italic">{item.notes}</p>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={() => onUpdate(item.id, { alwaysHave: !item.alwaysHave })}
          className={cn(
            'text-xs px-2 py-1 rounded transition-colors',
            item.alwaysHave
              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200'
          )}
        >
          {item.alwaysHave ? 'Always Have ✓' : 'Mark Always Have'}
        </button>

        <button
          onClick={() => onDelete(item.id)}
          className="text-xs text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// Pantry Item Row Component (for list view)
function PantryItemRow({ item, onUpdate, onDelete }: PantryItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStock, setEditedStock] = useState(item.currentStock);

  const isLowStock = item.currentStock <= item.minimumStock;
  const isExpiring = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const handleStockUpdate = async () => {
    await onUpdate(item.id, { currentStock: editedStock });
    setIsEditing(false);
  };

  return (
    <div className={cn(
      'px-4 py-3 flex items-center justify-between',
      isLowStock ? 'bg-yellow-50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
    )}>
      <div className="flex items-center space-x-4 flex-1">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{item.name}</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-200">
            <span>{item.category}</span>
            {item.location && (
              <>
                <span>•</span>
                <span>{item.location}</span>
              </>
            )}
            {item.expiryDate && (
              <>
                <span>•</span>
                <span className={isExpiring ? 'text-red-600' : ''}>
                  Expires {new Date(item.expiryDate).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={editedStock}
                onChange={(e) => setEditedStock(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                min="0"
                step="0.1"
              />
              <span className="text-sm text-gray-600 dark:text-gray-200">{item.unit}</span>
              <button
                onClick={handleStockUpdate}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-gray-900 hover:text-blue-600"
            >
              {item.currentStock} {item.unit}
            </button>
          )}

          <div className="flex items-center space-x-2">
            {isLowStock && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                Low
              </span>
            )}
            {item.alwaysHave && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Always
              </span>
            )}
          </div>

          <button
            onClick={() => onDelete(item.id)}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Pantry Item Modal
interface AddPantryItemModalProps {
  onAdd: (item: Omit<PantryItem, 'id'>) => Promise<void>;
  onClose: () => void;
}

function AddPantryItemModal({ onAdd, onClose }: AddPantryItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Other',
    currentStock: 0,
    unit: '',
    minimumStock: 0,
    alwaysHave: false,
    expiryDate: '',
    cost: '',
    location: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onAdd({
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error adding pantry item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add Pantry Item</h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Olive Oil"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Produce">Produce</option>
                  <option value="Proteins">Proteins</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Grains & Pasta">Grains & Pasta</option>
                  <option value="Pantry">Pantry</option>
                  <option value="Frozen">Frozen</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <input
                  type="text"
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., bottle, lb, cup"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.1"
                  value={formData.currentStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentStock: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.minimumStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimumStock: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Pantry, Fridge, Freezer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="alwaysHave"
                checked={formData.alwaysHave}
                onChange={(e) => setFormData(prev => ({ ...prev, alwaysHave: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="alwaysHave" className="ml-2 text-sm text-gray-700">
                Always keep in stock
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}