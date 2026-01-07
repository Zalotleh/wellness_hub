'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import MultiSystemBadge from '@/components/ui/MultiSystemBadge';
import { DefenseSystem } from '@/types';

interface FoodDatabaseEntry {
  id: string;
  name: string;
  category: string;
  defenseSystems: DefenseSystem[];
  servingSize?: string;
  nutritionPer100g?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fiber?: number;
  };
}

interface FoodSelectorProps {
  onSelect: (food: FoodDatabaseEntry) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  onClose?: () => void;
}

export default function FoodSelector({
  onSelect,
  placeholder = 'Search for a food...',
  autoFocus = false,
  className = '',
  onClose,
}: FoodSelectorProps) {
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<FoodDatabaseEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch foods from database
  const searchFoods = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/progress/food-database?search=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch foods');
      }

      const data = await response.json();
      setFoods(data.foods || []);
      setIsOpen(true);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Error fetching foods:', error);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim() || isOpen) {
        searchFoods(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Auto-focus on mount (but don't load foods yet)
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || foods.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % foods.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + foods.length) % foods.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (foods[selectedIndex]) {
          handleSelect(foods[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        onClose?.();
        break;
    }
  };

  const handleSelect = (food: FoodDatabaseEntry) => {
    onSelect(food);
    setQuery('');
    setFoods([]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    setFoods([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getSystemBenefits = (systems: DefenseSystem[]) => {
    return systems.map((system) => ({ system }));
  };

  // Categorize foods
  const superfoods = foods.filter((f) => f.defenseSystems.length >= 3);
  const regularFoods = foods.filter((f) => f.defenseSystems.length < 3);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (foods.length === 0 && !loading) {
              searchFoods(query);
            } else {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && foods.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto"
        >
          {/* Superfoods Section */}
          {superfoods.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⭐</span>
                  <span className="text-sm font-semibold text-purple-700">
                    Multi-System Superfoods
                  </span>
                </div>
              </div>
              {superfoods.map((food, index) => (
                <button
                  key={food.id}
                  onClick={() => handleSelect(food)}
                  className={`w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 ${
                    selectedIndex === index ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">
                        {food.name}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {food.category}
                        {food.servingSize && ` • ${food.servingSize}`}
                      </div>
                      <MultiSystemBadge
                        systems={getSystemBenefits(food.defenseSystems)}
                        size="sm"
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                        {food.defenseSystems.length} systems
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Regular Foods Section */}
          {regularFoods.length > 0 && (
            <div>
              {superfoods.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">
                    Other Foods
                  </span>
                </div>
              )}
              {regularFoods.map((food, index) => {
                const actualIndex = superfoods.length + index;
                return (
                  <button
                    key={food.id}
                    onClick={() => handleSelect(food)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      selectedIndex === actualIndex ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          {food.name}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {food.category}
                          {food.servingSize && ` • ${food.servingSize}`}
                        </div>
                        {food.defenseSystems.length > 0 && (
                          <MultiSystemBadge
                            systems={getSystemBenefits(food.defenseSystems)}
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {isOpen && !loading && query && foods.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-6 text-center">
          <div className="text-gray-400 text-4xl mb-2">🔍</div>
          <p className="text-gray-600 font-medium mb-1">No foods found</p>
          <p className="text-sm text-gray-500">
            Try searching for a different food name
          </p>
        </div>
      )}
    </div>
  );
}
