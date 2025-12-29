'use client';

import React from 'react';
import { X, Coffee, Sun, Moon, Apple } from 'lucide-react';

interface AddMealOption {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  mealType: string;
  slot: string;
}

interface AddMealModalProps {
  currentSlot: string;
  onSelect: (mealType: string, slot: string) => void;
  onCancel: () => void;
}

export default function AddMealModal({ currentSlot, onSelect, onCancel }: AddMealModalProps) {
  // Define options based on current context
  const getOptions = (): AddMealOption[] => {
    const baseOptions: AddMealOption[] = [];

    // For meal sections (breakfast/lunch/dinner), only show extra meal option
    if (currentSlot === 'breakfast') {
      baseOptions.push({
        key: 'alt-breakfast',
        label: 'Extra Breakfast',
        description: 'Additional breakfast option for variety',
        icon: <Coffee className="w-6 h-6" />,
        mealType: 'breakfast',
        slot: 'breakfast',
      });
    } else if (currentSlot === 'lunch') {
      baseOptions.push({
        key: 'alt-lunch',
        label: 'Extra Lunch',
        description: 'Additional lunch option for variety',
        icon: <Sun className="w-6 h-6" />,
        mealType: 'lunch',
        slot: 'lunch',
      });
    } else if (currentSlot === 'dinner') {
      baseOptions.push({
        key: 'alt-dinner',
        label: 'Extra Dinner',
        description: 'Additional dinner option for variety',
        icon: <Moon className="w-6 h-6" />,
        mealType: 'dinner',
        slot: 'dinner',
      });
    }

    // For snack section, show all snack options
    if (currentSlot === 'snack' || currentSlot.includes('snack')) {
      baseOptions.push({
        key: 'morning-snack',
        label: 'Morning Snack',
        description: 'Light snack between breakfast and lunch (~10am)',
        icon: <Apple className="w-6 h-6" />,
        mealType: 'snack',
        slot: 'morning-snack',
      });

      baseOptions.push({
        key: 'afternoon-snack',
        label: 'Afternoon Snack',
        description: 'Energy boost between lunch and dinner (~3pm)',
        icon: <Apple className="w-6 h-6" />,
        mealType: 'snack',
        slot: 'afternoon-snack',
      });

      baseOptions.push({
        key: 'evening-snack',
        label: 'Evening Snack',
        description: 'Light bite after dinner (~8pm)',
        icon: <Apple className="w-6 h-6" />,
        mealType: 'snack',
        slot: 'evening-snack',
      });

      baseOptions.push({
        key: 'snack',
        label: 'Snack (Anytime)',
        description: 'Flexible snack at any time of day',
        icon: <Apple className="w-6 h-6" />,
        mealType: 'snack',
        slot: 'snack',
      });
    }

    return baseOptions;
  };

  const options = getOptions();

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div 
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 w-full max-w-md animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add to Your Day</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose what you'd like to add</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            {options.map((option) => (
              <button
                key={option.key}
                onClick={() => onSelect(option.mealType, option.slot)}
                className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 text-left group"
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                  {option.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>

                {/* Arrow indicator */}
                <div className="flex-shrink-0 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            💡 Tip: Alternatives give you meal variety. Snacks help balance your energy throughout the day.
          </p>
        </div>
      </div>
    </>
  );
}
