'use client';

import React from 'react';
import { X } from 'lucide-react';

interface MealTypeSelectorProps {
  onSelect: (mealType: string) => void;
  onCancel: () => void;
  position?: { top: number; left: number };
}

const mealTypes = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅', color: 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300' },
  { key: 'lunch', label: 'Lunch', icon: '☀️', color: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300' },
  { key: 'dinner', label: 'Dinner', icon: '🌙', color: 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300' },
  { key: 'snack', label: 'Snack', icon: '🍎', color: 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300' },
];

export default function MealTypeSelector({ onSelect, onCancel, position }: MealTypeSelectorProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 animate-in fade-in duration-200"
        onClick={onCancel}
      />
      
      {/* Selector Popover */}
      <div 
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 p-4 animate-in zoom-in-95 duration-200"
        style={position ? {
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translate(-50%, -50%)'
        } : {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Choose Meal Type</h3>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meal Type Options */}
        <div className="grid grid-cols-2 gap-3 min-w-[300px]">
          {mealTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => onSelect(type.key)}
              className={`
                flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 
                transition-all duration-200 transform hover:scale-105 hover:shadow-lg
                ${type.color}
              `}
            >
              <span className="text-3xl" role="img" aria-label={type.label}>
                {type.icon}
              </span>
              <span className="font-semibold text-sm">
                {type.label}
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
          Select the type of meal you want to add
        </p>
      </div>
    </>
  );
}
