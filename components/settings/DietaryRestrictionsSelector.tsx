'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface DietaryRestrictionsSelectorProps {
  value: string[];
  onChange: (restrictions: string[]) => void;
  label?: string;
  className?: string;
}

// Common dietary restrictions
const COMMON_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Egg-Free',
  'Soy-Free',
  'Shellfish-Free',
  'Kosher',
  'Halal',
  'Low-Carb',
  'Keto',
  'Paleo',
  'Mediterranean',
  'Low-Sodium',
  'Low-Fat',
  'Sugar-Free',
  'Pescatarian',
];

export default function DietaryRestrictionsSelector({
  value,
  onChange,
  label = 'Dietary Restrictions & Preferences',
  className = '',
}: DietaryRestrictionsSelectorProps) {
  const [customRestriction, setCustomRestriction] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleToggle = (restriction: string) => {
    if (value.includes(restriction)) {
      onChange(value.filter((r) => r !== restriction));
    } else {
      onChange([...value, restriction]);
    }
  };

  const handleAddCustom = () => {
    const trimmed = customRestriction.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setCustomRestriction('');
      setShowCustomInput(false);
    }
  };

  const handleRemove = (restriction: string) => {
    onChange(value.filter((r) => r !== restriction));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {label}
        </label>
      )}

      {/* Selected Restrictions */}
      {value.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Selected ({value.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {value.map((restriction) => (
              <span
                key={restriction}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium"
              >
                {restriction}
                <button
                  type="button"
                  onClick={() => handleRemove(restriction)}
                  className="hover:bg-green-200 dark:hover:bg-green-800/50 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${restriction}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Common Options Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        {COMMON_RESTRICTIONS.map((restriction) => {
          const isSelected = value.includes(restriction);
          return (
            <button
              key={restriction}
              type="button"
              onClick={() => handleToggle(restriction)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {restriction}
            </button>
          );
        })}
      </div>

      {/* Add Custom Restriction */}
      {showCustomInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={customRestriction}
            onChange={(e) => setCustomRestriction(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter custom restriction..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            autoFocus
            maxLength={100}
          />
          <button
            type="button"
            onClick={handleAddCustom}
            disabled={!customRestriction.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(false);
              setCustomRestriction('');
            }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Custom Restriction
        </button>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        💡 These preferences help personalize your recipe recommendations and meal plans
      </p>
    </div>
  );
}
