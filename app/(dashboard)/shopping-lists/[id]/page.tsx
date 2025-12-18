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
  Trash2,
  Calendar,
  Users,
  ExternalLink,
  Share2,
  Download,
  CheckCircle2,
  Circle,
  Loader2,
  Mail,
  MessageCircle,
  Copy,
  Smartphone,
  Info
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/DialogComponents';

interface ShoppingListItem {
  ingredient: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  estimatedCost?: number;
  // E-commerce fields
  retailQuantity?: number;
  retailUnit?: string;
  retailDescription?: string;
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
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, itemIndex: number, itemName: string}>({
    show: false,
    itemIndex: -1,
    itemName: ''
  });
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newItem, setNewItem] = useState({
    ingredient: '',
    quantity: 1,
    unit: '',
    category: 'Other'
  });
  const [copyDialog, setCopyDialog] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
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

  const addItem = async () => {
    if (!shoppingList || updating || !newItem.ingredient.trim()) return;

    try {
      setUpdating(true);
      const itemToAdd: ShoppingListItem = {
        ingredient: newItem.ingredient.trim(),
        quantity: newItem.quantity || 1,
        unit: newItem.unit.trim() || 'unit',
        category: newItem.category || 'Other',
        checked: false,
      };

      const updatedItems = [...shoppingList.items, itemToAdd];

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
        
        // Reset form and close modal
        setNewItem({
          ingredient: '',
          quantity: 1,
          unit: '',
          category: 'Other'
        });
        setShowAddItemModal(false);
      } else {
        throw new Error('Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      setError('Failed to add item');
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

  const exportList = () => {
    if (!shoppingList) return;

    // Group items by category
    const groupedItems = groupItemsByCategory(shoppingList.items);
    
    // Create text content
    let content = `${shoppingList.title}\n`;
    content += `${'='.repeat(shoppingList.title.length)}\n\n`;
    
    if (shoppingList.mealPlan) {
      content += `From Meal Plan: ${shoppingList.mealPlan.title}\n`;
    }
    content += `Created: ${new Date(shoppingList.createdAt).toLocaleDateString()}\n`;
    content += `Total Items: ${shoppingList.totalItems}\n`;
    if (shoppingList.totalCost) {
      content += `Estimated Cost: $${shoppingList.totalCost.toFixed(2)}\n`;
    }
    content += `\n`;

    // Add items by category
    Object.entries(groupedItems).forEach(([category, items]) => {
      content += `\n${category}\n`;
      content += `${'-'.repeat(category.length)}\n`;
      items.forEach((item) => {
        const checkbox = item.checked ? '☑' : '☐';
        content += `${checkbox} ${item.ingredient} - ${item.quantity} ${item.unit}`;
        if (item.estimatedCost) {
          content += ` ($${item.estimatedCost.toFixed(2)})`;
        }
        content += '\n';
      });
    });

    // Add summary
    const stats = getCompletionStats();
    content += `\n\nProgress: ${stats.completed}/${stats.total} items purchased (${stats.percentage}%)\n`;

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${shoppingList.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateShareText = () => {
    if (!shoppingList) return '';

    const groupedItems = groupItemsByCategory(shoppingList.items);
    const stats = getCompletionStats();
    
    let text = `🛒 ${shoppingList.title}\n\n`;
    
    if (shoppingList.mealPlan) {
      text += `📋 From: ${shoppingList.mealPlan.title}\n`;
    }
    text += `📅 Created: ${new Date(shoppingList.createdAt).toLocaleDateString()}\n`;
    text += `📊 Progress: ${stats.completed}/${stats.total} items\n\n`;

    // Add items by category
    Object.entries(groupedItems).forEach(([category, items]) => {
      text += `\n${category.toUpperCase()}\n`;
      items.forEach((item) => {
        const checkbox = item.checked ? '✅' : '⬜';
        text += `${checkbox} ${item.ingredient} - ${item.quantity} ${item.unit}\n`;
      });
    });

    return text;
  };

  const shareViaWhatsApp = () => {
    const text = generateShareText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareViaSMS = () => {
    const text = generateShareText();
    const url = `sms:?body=${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  const shareViaEmail = () => {
    const text = generateShareText();
    const subject = `Shopping List: ${shoppingList?.title}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  const copyToClipboard = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      
      // Show success dialog
      const itemCount = shoppingList?.items.length || 0;
      setCopyDialog({
        isOpen: true,
        type: 'success',
        title: 'Copied to Clipboard!',
        message: `Your shopping list "${shoppingList?.title}" with ${itemCount} item${itemCount !== 1 ? 's' : ''} has been copied to your clipboard. You can now paste it anywhere you like!`,
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      
      // Show error dialog
      setCopyDialog({
        isOpen: true,
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy the shopping list to your clipboard. Please try again or use a different sharing method.',
      });
    }
  };

  const shareNative = async () => {
    // @ts-ignore - navigator.share exists in modern browsers
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shoppingList?.title,
          text: generateShareText(),
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      alert('Sharing is not supported on this device');
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <X className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              {error === 'Shopping list not found' ? 'Shopping List Not Found' : 'Error Loading Shopping List'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-500 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
              <Link
                href="/shopping-lists"
                className="inline-block px-6 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{shoppingList.title}</h1>
              {shoppingList.mealPlan && (
                <p className="text-gray-600 dark:text-gray-400">From: {shoppingList.mealPlan.title}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Prominent Share Button */}
            <button 
              onClick={() => setShowShareModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              title="Share shopping list"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">Share</span>
            </button>
            
            {/* Download Button */}
            <button 
              onClick={exportList}
              className="p-2.5 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700"
              title="Download shopping list"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Shopping Progress</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {stats.completed} of {stats.total} items purchased
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.percentage}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">purchased</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-green-400 to-green-500 dark:from-green-500 dark:to-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${stats.percentage}%` }}
            ></div>
          </div>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
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
                className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
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
            <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                {category}
              </h3>
              
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.originalIndex}
                    className={`group flex items-center space-x-4 p-4 rounded-lg border-2 transition-all ${
                      item.checked
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800'
                        : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                    }`}
                  >
                    {/* Checkbox to mark as purchased */}
                    <button
                      onClick={() => toggleItem(item.originalIndex)}
                      disabled={updating}
                      className={`flex-shrink-0 w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all ${
                        item.checked
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-400 dark:border-gray-500 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30'
                      } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={item.checked ? 'Mark as not purchased' : 'Mark as purchased'}
                    >
                      {updating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : item.checked ? (
                        <Check className="w-5 h-5 font-bold" />
                      ) : null}
                    </button>
                    
                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-lg ${item.checked ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                        {item.ingredient}
                      </div>
                      <div className="space-y-1 mt-1">
                        {/* Retail/Shopping quantity (prominent) */}
                        {item.retailDescription && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded font-medium">
                              🛒 Buy: {item.retailDescription}
                            </span>
                            {/* Info icon with tooltip */}
                            <div className="relative">
                              <button
                                onMouseEnter={() => setTooltipIndex(item.originalIndex)}
                                onMouseLeave={() => setTooltipIndex(null)}
                                className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title="Conversion details"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                              
                              {/* Tooltip */}
                              {tooltipIndex === item.originalIndex && (
                                <div className="absolute left-0 top-6 z-50 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-xl whitespace-nowrap border border-gray-800 dark:border-gray-600">
                                  <div className="font-semibold mb-1">Conversion Details:</div>
                                  <div className="space-y-1">
                                    {(() => {
                                      const qty = String(item.quantity || '').trim();
                                      const unit = String(item.unit || '').trim();
                                      
                                      if (qty && qty !== '0' && unit && unit !== '0' && isNaN(Number(unit))) {
                                        return (
                                          <>
                                            <div>📖 Recipe needs: <span className="font-medium">{qty} {unit}</span></div>
                                            <div>→</div>
                                            <div>🛒 Buy: <span className="font-medium">{item.retailDescription}</span></div>
                                          </>
                                        );
                                      }
                                      return <div>No conversion needed</div>;
                                    })()}
                                  </div>
                                  {/* Arrow pointer */}
                                  <div className="absolute -top-1 left-2 w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Original recipe quantity (secondary) */}
                        {(item.quantity || item.unit) && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium whitespace-nowrap">
                              Recipe: {
                                (() => {
                                  const qty = String(item.quantity || '').trim();
                                  const unit = String(item.unit || '').trim();
                                  
                                  // Skip if unit is '0' or just numbers
                                  if (unit === '0' || unit === '' || !isNaN(Number(unit))) {
                                    // Only show quantity if it exists and is not '0'
                                    if (qty && qty !== '0') {
                                      return qty;
                                    }
                                    return 'as needed';
                                  }
                                  
                                  // Combine quantity and unit properly
                                  if (qty && qty !== '0' && unit) {
                                    return `${qty} ${unit}`;
                                  }
                                  
                                  if (unit) {
                                    return unit;
                                  }
                                  
                                  if (qty && qty !== '0') {
                                    return qty;
                                  }
                                  
                                  return 'as needed';
                                })()
                              }
                            </span>
                            {item.estimatedCost && item.estimatedCost > 0 && (
                              <>
                                <span className="text-gray-400 dark:text-gray-500">•</span>
                                <span className="text-green-600 dark:text-green-400">${item.estimatedCost.toFixed(2)}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    {item.checked && (
                      <div className="hidden sm:flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                        <ShoppingCart className="w-3 h-3" />
                        <span>Purchased</span>
                      </div>
                    )}
                    
                    {/* Delete Button - shows on hover */}
                    <button
                      onClick={() => deleteItem(item.originalIndex)}
                      disabled={updating}
                      className="flex-shrink-0 p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove from list"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
          
          <div className="flex flex-wrap gap-3">
            {/* Share Button - Most Prominent with Pulse Animation */}
            <button 
              onClick={() => setShowShareModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium animate-pulse hover:animate-none"
              style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 3',
              }}
            >
              <Share2 className="w-5 h-5" />
              <span>Share List</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">New!</span>
            </button>
            
            {/* Add Item */}
            <button 
              onClick={() => setShowAddItemModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
            
            {/* Mark All as Purchased */}
            <button 
              onClick={markAllComplete}
              disabled={updating || shoppingList.items.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
              title="Mark all items as purchased"
            >
              {updating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Mark All Purchased</span>
            </button>
            
            {/* Unmark All */}
            <button 
              onClick={markAllIncomplete}
              disabled={updating || shoppingList.items.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
              title="Mark all items as not purchased"
            >
              {updating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
              <span>Reset All</span>
            </button>
            
            {/* Export List */}
            <button 
              onClick={exportList}
              disabled={shoppingList.items.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-500 dark:bg-purple-600 text-white rounded-lg hover:bg-purple-600 dark:hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
              title="Export shopping list as text file"
            >
              <Download className="w-4 h-4" />
              <span>Export List</span>
            </button>
          </div>
          
          {/* Helper Text - Updated to highlight sharing */}
          <div className="mt-4 space-y-3">
            {/* Share Feature Highlight */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 p-2 rounded-lg mt-0.5">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    📲 Share Your Shopping List!
                  </p>
                  <p className="text-sm text-blue-800">
                    Click <strong>"Share List"</strong> to send via WhatsApp, text message, email, or copy to clipboard. 
                    Perfect for coordinating shopping with family members!
                  </p>
                </div>
              </div>
            </div>
            
            {/* General Tip */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Click the checkbox next to each item to mark it as purchased. 
                Purchased items will be crossed out and highlighted. Hover over items to see the delete button.
              </p>
            </div>
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
                <p className="text-gray-600 dark:text-gray-200">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.itemName}"</strong> from your shopping list?
            </p>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setDeleteConfirm({show: false, itemIndex: -1, itemName: ''})}
                disabled={updating}
                className="px-4 py-2 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-50 transition-colors"
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

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
                <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Add New Item</h3>
                <p className="text-gray-600 dark:text-gray-400">Add an item to your shopping list</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={newItem.ingredient}
                  onChange={(e) => setNewItem({...newItem, ingredient: e.target.value})}
                  placeholder="e.g., Tomatoes"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 1})}
                    min="0.1"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    placeholder="e.g., lbs, cups"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="Produce">Produce</option>
                  <option value="Protein">Protein</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Grains">Grains</option>
                  <option value="Spices">Spices</option>
                  <option value="Condiments">Condiments</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Frozen">Frozen</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setShowAddItemModal(false);
                  setNewItem({
                    ingredient: '',
                    quantity: 1,
                    unit: '',
                    category: 'Other'
                  });
                }}
                disabled={updating}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addItem}
                disabled={updating || !newItem.ingredient.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
                  <Share2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Share Shopping List</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Choose how to share</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-3">
              {/* WhatsApp */}
              <button
                onClick={() => {
                  shareViaWhatsApp();
                  setShowShareModal(false);
                }}
                className="w-full flex items-center space-x-4 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-lg transition-all group"
              >
                <div className="bg-green-500 p-3 rounded-full group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-800 dark:text-white">WhatsApp</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Share via WhatsApp</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>

              {/* SMS */}
              <button
                onClick={() => {
                  shareViaSMS();
                  setShowShareModal(false);
                }}
                className="w-full flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-lg transition-all group"
              >
                <div className="bg-blue-500 p-3 rounded-full group-hover:scale-110 transition-transform">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-800 dark:text-white">Text Message</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Share via SMS</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>

              {/* Email */}
              <button
                onClick={() => {
                  shareViaEmail();
                  setShowShareModal(false);
                }}
                className="w-full flex items-center space-x-4 p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 rounded-lg transition-all group"
              >
                <div className="bg-purple-500 p-3 rounded-full group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-800 dark:text-white">Email</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Share via email</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>

              {/* Copy to Clipboard */}
              <button
                onClick={async () => {
                  await copyToClipboard();
                  setShowShareModal(false);
                }}
                className="w-full flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg transition-all group"
              >
                <div className="bg-gray-500 dark:bg-gray-600 p-3 rounded-full group-hover:scale-110 transition-transform">
                  <Copy className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-800 dark:text-white">Copy to Clipboard</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Copy list as text</div>
                </div>
              </button>

              {/* Native Share (Mobile) - Only show if supported */}
              {typeof window !== 'undefined' && typeof (window.navigator as any).share === 'function' && (
                <button
                  onClick={async () => {
                    await shareNative();
                    setShowShareModal(false);
                  }}
                  className="w-full flex items-center space-x-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700 rounded-lg transition-all group"
                >
                  <div className="bg-indigo-500 p-3 rounded-full group-hover:scale-110 transition-transform">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-800 dark:text-white">More Options</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Use device share menu</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>
              )}
            </div>

            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-400">
                <strong>💡 Tip:</strong> The shopping list will be formatted with emojis and checkboxes for easy reading.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Copy to Clipboard Dialog */}
      <ConfirmDialog
        isOpen={copyDialog.isOpen}
        onClose={() => setCopyDialog({ ...copyDialog, isOpen: false })}
        onConfirm={() => setCopyDialog({ ...copyDialog, isOpen: false })}
        title={copyDialog.title}
        message={copyDialog.message}
        confirmText="OK"
        type={copyDialog.type === 'success' ? 'success' : 'danger'}
      />
    </div>
  );
}