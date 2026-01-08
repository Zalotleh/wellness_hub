'use client';

import { Minus, Plus, Users } from 'lucide-react';

interface ServingsSelectorProps {
  value: number;
  onChange: (servings: number) => void;
  label?: string;
  min?: number;
  max?: number;
  className?: string;
}

const QUICK_OPTIONS = [1, 2, 4, 6, 8];

export default function ServingsSelector({
  value,
  onChange,
  label = 'Default Servings',
  min = 1,
  max = 12,
  className = '',
}: ServingsSelectorProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleQuickSelect = (servings: number) => {
    onChange(servings);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {label}
        </label>
      )}

      {/* Main Counter */}
      <div className="flex items-center gap-4 mb-4">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease servings"
        >
          <Minus className="w-5 h-5" />
        </button>

        {/* Display */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {value}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {value === 1 ? 'serving' : 'servings'}
          </p>
        </div>

        {/* Increment Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-12 h-12 flex items-center justify-center bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Increase servings"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Select Buttons */}
      <div className="mb-3">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Quick select:</p>
        <div className="flex gap-2">
          {QUICK_OPTIONS.map((servings) => (
            <button
              key={servings}
              type="button"
              onClick={() => handleQuickSelect(servings)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                value === servings
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {servings}
            </button>
          ))}
        </div>
      </div>

      {/* Range Slider */}
      <div className="mb-3">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        💡 This will be your default serving size for recipes and meal plans. You can always adjust it per recipe.
      </p>
    </div>
  );
}
