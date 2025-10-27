'use client';

import React, { useState } from 'react';
import ShoppingList from './ShoppingList';
import { Plus, RefreshCw, Download, Share2 } from 'lucide-react';

// Sample data for demonstration
const sampleItems = [
  {
    id: '1',
    ingredient: 'Organic Spinach',
    quantity: 2,
    unit: 'bunches',
    category: 'Produce',
    checked: false,
    estimatedCost: 5.98,
    notes: 'Fresh, not frozen',
    priority: 'high' as const,
  },
  {
    id: '2',
    ingredient: 'Salmon Fillets',
    quantity: 1.5,
    unit: 'lbs',
    category: 'Proteins',
    checked: false,
    estimatedCost: 18.99,
    priority: 'high' as const,
  },
  {
    id: '3',
    ingredient: 'Greek Yogurt',
    quantity: 1,
    unit: 'container',
    category: 'Dairy',
    checked: true,
    estimatedCost: 4.99,
  },
  {
    id: '4',
    ingredient: 'Quinoa',
    quantity: 2,
    unit: 'cups',
    category: 'Grains',
    checked: false,
    estimatedCost: 3.49,
  },
  {
    id: '5',
    ingredient: 'Olive Oil',
    quantity: 1,
    unit: 'bottle',
    category: 'Pantry',
    checked: false,
    estimatedCost: 8.99,
    notes: 'Extra virgin',
  },
  {
    id: '6',
    ingredient: 'Frozen Blueberries',
    quantity: 1,
    unit: 'bag',
    category: 'Frozen',
    checked: false,
    estimatedCost: 4.49,
  },
  {
    id: '7',
    ingredient: 'Almond Milk',
    quantity: 1,
    unit: 'carton',
    category: 'Beverages',
    checked: false,
    estimatedCost: 3.29,
  },
  {
    id: '8',
    ingredient: 'Mixed Nuts',
    quantity: 1,
    unit: 'bag',
    category: 'Snacks',
    checked: true,
    estimatedCost: 6.99,
  },
  {
    id: '9',
    ingredient: 'Avocados',
    quantity: 4,
    unit: 'pieces',
    category: 'Produce',
    checked: false,
    estimatedCost: 3.96,
    priority: 'medium' as const,
  },
  {
    id: '10',
    ingredient: 'Chicken Breast',
    quantity: 2,
    unit: 'lbs',
    category: 'Proteins',
    checked: false,
    estimatedCost: 12.99,
    priority: 'high' as const,
  },
];

interface ShoppingListExampleProps {
  initialItems?: typeof sampleItems;
  className?: string;
}

export default function ShoppingListExample({ 
  initialItems = sampleItems, 
  className = '' 
}: ShoppingListExampleProps) {
  const [items, setItems] = useState(initialItems);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    ingredient: '',
    quantity: 1,
    unit: '',
    category: 'Other',
    notes: '',
    priority: 'medium' as const,
  });

  // Handle item updates
  const handleItemUpdate = (itemId: string, updates: any) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  // Handle item deletion
  const handleItemDelete = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Handle adding new item
  const handleItemAdd = (itemData: any) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setItems(prev => [...prev, {
      ...itemData,
      id: newId,
      checked: false,
      estimatedCost: Math.random() * 10 + 1, // Random price for demo
    }]);
  };

  // Handle form submission for new item
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.ingredient.trim()) return;

    handleItemAdd(newItem);
    setNewItem({
      ingredient: '',
      quantity: 1,
      unit: '',
      category: 'Other',
      notes: '',
      priority: 'medium',
    });
    setIsAdding(false);
  };

  // Demo actions
  const handleRefresh = () => {
    setItems(sampleItems);
  };

  const handleExport = () => {
    const exportData = {
      title: 'My Shopping List',
      createdAt: new Date().toISOString(),
      items: items,
      totalItems: items.length,
      totalCost: items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const shareText = items
      .filter(item => !item.checked)
      .map(item => `• ${item.ingredient} (${item.quantity} ${item.unit})`)
      .join('\n');

    if (navigator.share) {
      navigator.share({
        title: 'My Shopping List',
        text: `Shopping List:\n\n${shareText}`,
      });
    } else {
      navigator.clipboard.writeText(`Shopping List:\n\n${shareText}`);
      alert('Shopping list copied to clipboard!');
    }
  };

  const categories = ['Produce', 'Proteins', 'Dairy', 'Grains', 'Pantry', 'Frozen', 'Beverages', 'Snacks', 'Other'];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Demo Controls */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Demo Controls</h3>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
          
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Demo
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share List
          </button>
        </div>

        {/* Add item form */}
        {isAdding && (
          <form onSubmit={handleAddSubmit} className="bg-white p-4 rounded-lg border border-gray-300 space-y-3">
            <h4 className="font-medium text-gray-900">Add New Item</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Item name"
                value={newItem.ingredient}
                onChange={(e) => setNewItem(prev => ({ ...prev, ingredient: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Qty"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.1"
                  required
                />
                
                <input
                  type="text"
                  placeholder="Unit"
                  value={newItem.unit}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <select
                value={newItem.category}
                onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Notes (optional)"
                value={newItem.notes}
                onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <select
                value={newItem.priority}
                onChange={(e) => setNewItem(prev => ({ ...prev, priority: e.target.value as any }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Item
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Shopping List Component */}
      <ShoppingList
        items={items}
        onItemUpdate={handleItemUpdate}
        onItemDelete={handleItemDelete}
        onItemAdd={handleItemAdd}
        showPricing={true}
        enableSwipeGestures={true}
        persistState={true}
        className="max-w-2xl mx-auto"
      />

      {/* Usage Information */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Features Demonstrated:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✅ <strong>Category Grouping:</strong> Items organized by Produce, Proteins, Dairy, etc.</li>
          <li>✅ <strong>Persistent Checkboxes:</strong> State saved to localStorage</li>
          <li>✅ <strong>Price Estimates:</strong> Running total and category totals</li>
          <li>✅ <strong>Service Integration:</strong> Instacart and Amazon Fresh buttons</li>
          <li>✅ <strong>Mobile Swipe:</strong> Swipe right to check, left to delete</li>
          <li>✅ <strong>Search & Filter:</strong> Find items and hide/show completed</li>
          <li>✅ <strong>Inline Editing:</strong> Click edit icon to modify items</li>
          <li>✅ <strong>Priority Levels:</strong> Visual indicators for item priority</li>
        </ul>
      </div>
    </div>
  );
}

// Provider component for integration with larger app
export function ShoppingListProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}