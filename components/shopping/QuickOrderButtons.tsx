'use client';

import React, { useState } from 'react';
import { ExternalLink, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import {
  generateInstacartLink,
  generateAmazonFreshLink,
  generateWalmartLink,
  generateTargetLink,
  generateKrogerLink,
  generateWholeFoodsLink,
} from '@/lib/utils/sharing';

interface QuickOrderButtonsProps {
  items: Array<{
    ingredient: string;
    quantity: number;
    unit: string;
    checked?: boolean;
  }>;
  className?: string;
  onlyUnchecked?: boolean;
}

interface PlatformConfig {
  name: string;
  icon: string;
  color: string;
  hoverColor: string;
  description: string;
  linkGenerator: (items: string[]) => string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    name: 'Instacart',
    icon: '🛒',
    color: 'bg-green-600',
    hoverColor: 'hover:bg-green-700',
    description: 'Same-day delivery from local stores',
    linkGenerator: generateInstacartLink,
  },
  {
    name: 'Amazon Fresh',
    icon: '📦',
    color: 'bg-orange-600',
    hoverColor: 'hover:bg-orange-700',
    description: 'Free delivery for Prime members',
    linkGenerator: generateAmazonFreshLink,
  },
  {
    name: 'Walmart',
    icon: '🏪',
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    description: 'Pickup & delivery, everyday low prices',
    linkGenerator: generateWalmartLink,
  },
  {
    name: 'Target',
    icon: '🎯',
    color: 'bg-red-600',
    hoverColor: 'hover:bg-red-700',
    description: 'Drive up, pickup, or same-day delivery',
    linkGenerator: generateTargetLink,
  },
  {
    name: 'Kroger',
    icon: '🛍️',
    color: 'bg-indigo-600',
    hoverColor: 'hover:bg-indigo-700',
    description: 'Pickup or delivery from Kroger family stores',
    linkGenerator: generateKrogerLink,
  },
  {
    name: 'Whole Foods',
    icon: '🥬',
    color: 'bg-emerald-600',
    hoverColor: 'hover:bg-emerald-700',
    description: 'Organic & natural products via Amazon',
    linkGenerator: generateWholeFoodsLink,
  },
];

export default function QuickOrderButtons({
  items,
  className = '',
  onlyUnchecked = true,
}: QuickOrderButtonsProps) {
  const [showAll, setShowAll] = useState(false);

  // Filter items and format for links
  const filteredItems = items.filter(item => 
    onlyUnchecked ? !item.checked : true
  );

  const itemStrings = filteredItems.map(item => {
    // Build string with only non-empty parts
    const parts = [item.ingredient];
    if (item.quantity && item.quantity > 0) {
      parts.push(item.quantity.toString());
    }
    if (item.unit && item.unit.trim()) {
      parts.push(item.unit);
    }
    return parts.join(' ');
  });

  const itemCount = filteredItems.length;

  if (itemCount === 0) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center ${className}`}>
        <ShoppingBag className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          No items to order. Add items to your shopping list to get started!
        </p>
      </div>
    );
  }

  const handlePlatformClick = (platform: PlatformConfig) => {
    const url = platform.linkGenerator(itemStrings);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Show top 2 platforms by default, all when expanded
  const visiblePlatforms = showAll ? PLATFORMS : PLATFORMS.slice(0, 2);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-green-600" />
            Quick Order Options
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Shop {itemCount} {itemCount === 1 ? 'item' : 'items'} on your favorite platform
          </p>
        </div>
      </div>

      {/* Platform buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visiblePlatforms.map((platform) => (
          <button
            key={platform.name}
            onClick={() => handlePlatformClick(platform)}
            className={`
              ${platform.color} ${platform.hoverColor}
              text-white rounded-lg p-4 transition-all duration-200
              hover:shadow-lg hover:scale-105 active:scale-100
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${platform.color}
              group relative overflow-hidden
            `}
          >
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative flex items-center gap-3">
              <span className="text-3xl">{platform.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-semibold text-lg flex items-center gap-2">
                  {platform.name}
                  <ExternalLink className="w-4 h-4 opacity-75" />
                </div>
                <div className="text-sm opacity-90 mt-0.5">
                  {platform.description}
                </div>
              </div>
              <div className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                {itemCount}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Show more/less toggle */}
      {PLATFORMS.length > 2 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full flex items-center justify-center gap-2 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show {PLATFORMS.length - 2} More Platforms
            </>
          )}
        </button>
      )}

      {/* Info message */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="text-blue-600 dark:text-blue-400 text-2xl">ℹ️</div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              How it works
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Clicking a button opens the platform with your first item pre-searched. 
              Once there, you can search for and add all your other items to your cart. 
              We don't charge any fees - shop at regular prices!
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
              💡 <strong>Tip:</strong> Most platforms don't support multi-item deep links, so we start 
              with your first item to get you shopping quickly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
