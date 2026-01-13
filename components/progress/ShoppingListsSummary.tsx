'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingCart, ChevronRight, CheckCircle, Circle, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface ShoppingListItem {
  id: string;
  ingredient: string;
  quantity: string;
  unit: string;
  checked: boolean;
  category?: string;
}

interface ShoppingList {
  id: string;
  title: string;
  createdAt: string;
  items: ShoppingListItem[];
  totalItems: number;
  checkedItems: number;
  pendingItems: number;
  completionPercentage: number;
}

interface ShoppingListsSummaryProps {
  className?: string;
}

export default function ShoppingListsSummary({ className = '' }: ShoppingListsSummaryProps) {
  const router = useRouter();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShoppingLists();
  }, []);

  const fetchShoppingLists = async () => {
    try {
      const response = await fetch('/api/shopping-lists');
      if (response.ok) {
        const { data } = await response.json();
        setLists(data || []);
      }
    } catch (error) {
      console.error('Error fetching shopping lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    router.push('/shopping-lists');
  };

  const handleListClick = (listId: string) => {
    router.push(`/shopping-lists/${listId}`);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter for active lists (not 100% complete)
  const activeLists = lists.filter(list => list.completionPercentage < 100);
  const hasActiveLists = activeLists.length > 0;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Shopping Lists</h2>
            {hasActiveLists && (
              <p className="text-sm text-gray-500">
                {activeLists.length} active {activeLists.length === 1 ? 'list' : 'lists'}
              </p>
            )}
          </div>
        </div>
        {lists.length > 0 && (
          <button
            onClick={handleViewAll}
            className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {lists.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No shopping lists yet</p>
          <button
            onClick={() => router.push('/shopping-lists')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Create Shopping List
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Show up to 3 most recent active lists, or all lists if less than 3 */}
          {activeLists.slice(0, 3).map((list) => (
            <button
              key={list.id}
              onClick={() => handleListClick(list.id)}
              className="w-full bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors text-left border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{list.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Created {formatDistanceToNow(new Date(list.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-300"
                    style={{ width: `${list.completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">{list.checkedItems}</span>
                  <span className="text-gray-500">done</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Circle className="w-4 h-4" />
                  <span className="font-medium">{list.pendingItems}</span>
                  <span className="text-gray-500">pending</span>
                </div>
                <div className="ml-auto text-gray-500">
                  {list.completionPercentage}%
                </div>
              </div>
            </button>
          ))}

          {/* Show message if only completed lists exist */}
          {activeLists.length === 0 && lists.length > 0 && (
            <div className="text-center py-6 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-medium mb-1">All caught up!</p>
              <p className="text-sm text-green-600 mb-3">All your shopping lists are complete</p>
              <button
                onClick={() => router.push('/shopping-lists')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View Completed Lists
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
