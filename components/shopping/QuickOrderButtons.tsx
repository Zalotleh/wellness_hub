'use client';

import React, { useState } from 'react';
import { ExternalLink, ShoppingBag, Loader2, AlertCircle } from 'lucide-react';

interface ShoppingItem {
  ingredient: string;
  quantity: number;
  unit: string;
  checked?: boolean;
}

interface QuickOrderButtonsProps {
  items: ShoppingItem[];
  className?: string;
  onlyUnchecked?: boolean;
  /** Title of the shopping list — sent as the "recipe" title to Instacart */
  title?: string;
  /** ID of the current shopping list — used to build the linkback URL */
  listId?: string;
}

type PlatformStatus = 'idle' | 'loading' | 'error';

interface PlatformState {
  status: PlatformStatus;
  error?: string;
}

export default function QuickOrderButtons({
  items,
  className = '',
  onlyUnchecked = true,
  title = 'Shopping List',
  listId,
}: QuickOrderButtonsProps) {
  const [instacartState, setInstacartState] = useState<PlatformState>({ status: 'idle' });

  // Filter items
  const filteredItems = items.filter((item) =>
    onlyUnchecked ? !item.checked : true
  );

  const itemCount = filteredItems.length;

  if (itemCount === 0) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center ${className}`}>
        <ShoppingBag className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          No items to order. Uncheck some items or add more to get started!
        </p>
      </div>
    );
  }

  /**
   * Real Instacart integration via the Developer Platform API.
   * Calls our backend /api/instacart/create-cart which sends all items
   * to Instacart and returns a hosted cart URL with every item pre-loaded.
   */
  const handleInstacartClick = async () => {
    if (instacartState.status === 'loading') return;

    setInstacartState({ status: 'loading' });

    try {
      const linkbackUrl = listId
        ? `${window.location.origin}/shopping-lists/${listId}`
        : window.location.href;

      const response = await fetch('/api/instacart/create-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: filteredItems,
          title,
          linkbackUrl,
          onlyUnchecked: false, // Already filtered above
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to create Instacart cart');
      }

      console.log(`✅ Instacart cart URL (${data.env}):`, data.url);

      // Open Instacart page with all items pre-loaded
      window.open(data.url, '_blank', 'noopener,noreferrer');
      setInstacartState({ status: 'idle' });
    } catch (error) {
      console.error('Instacart error:', error);
      setInstacartState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to connect to Instacart',
      });
      // Auto-clear error after 6s
      setTimeout(() => setInstacartState({ status: 'idle' }), 6000);
    }
  };

  const isLoading = instacartState.status === 'loading';
  const hasError = instacartState.status === 'error';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-green-600" />
          Quick Order Options
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Shop {itemCount} {itemCount === 1 ? 'item' : 'items'} on your favorite platform
        </p>
      </div>

      {/* ── Instacart — Real API integration ─────────────────────────── */}
      <div className="space-y-2">
        <button
          onClick={handleInstacartClick}
          disabled={isLoading}
          className={`
            w-full text-white rounded-xl p-4 transition-all duration-200
            active:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
            group relative overflow-hidden
            ${isLoading
              ? 'bg-green-500 cursor-wait opacity-90'
              : hasError
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700 hover:shadow-lg hover:scale-[1.015]'
            }
          `}
        >
          {!isLoading && !hasError && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          <div className="relative flex items-center gap-3">
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin flex-shrink-0" />
            ) : hasError ? (
              <AlertCircle className="w-8 h-8 flex-shrink-0" />
            ) : (
              <span className="text-3xl flex-shrink-0">🛒</span>
            )}
            <div className="flex-1 text-left">
              <div className="font-semibold text-lg flex items-center gap-2">
                {isLoading
                  ? 'Creating Instacart Cart…'
                  : hasError
                    ? 'Instacart Error — Tap to Retry'
                    : 'Order on Instacart'}
                {!isLoading && !hasError && <ExternalLink className="w-4 h-4 opacity-75" />}
              </div>
              <div className="text-sm opacity-90 mt-0.5">
                {isLoading
                  ? `Adding all ${itemCount} items to your cart…`
                  : hasError
                    ? instacartState.error
                    : 'All items pre-loaded — same-day delivery from local stores'}
              </div>
            </div>
            {!isLoading && !hasError && (
              <div className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full flex-shrink-0">
                {itemCount} items
              </div>
            )}
          </div>
        </button>

        {/* "Powered by real Instacart API" badge */}
        {!hasError && (
          <p className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 font-medium px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            All {itemCount} items sent directly to Instacart Marketplace via API
          </p>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="text-2xl flex-shrink-0">ℹ️</div>
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              All your unchecked items are sent directly to Instacart via their API. You&apos;ll land on a cart page with everything ready to checkout.
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
              💡 Check off items you already have at home — only unchecked items are sent to the store.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
