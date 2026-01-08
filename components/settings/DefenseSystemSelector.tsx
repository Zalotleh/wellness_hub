'use client';

import { DefenseSystem } from '@/types';
import { Heart, Sparkles, Bug, Shield, Activity } from 'lucide-react';

interface DefenseSystemSelectorProps {
  value: DefenseSystem[];
  onChange: (systems: DefenseSystem[]) => void;
  label?: string;
  maxSelections?: number;
  className?: string;
}

// Defense system metadata
const DEFENSE_SYSTEMS = [
  {
    id: DefenseSystem.ANGIOGENESIS,
    name: 'Angiogenesis',
    icon: Heart,
    description: 'Grows healthy blood vessels',
    color: 'red',
    examples: 'Tomatoes, berries, green tea',
  },
  {
    id: DefenseSystem.REGENERATION,
    name: 'Regeneration',
    icon: Sparkles,
    description: 'Heals and renews cells',
    color: 'purple',
    examples: 'Seafood, nuts, whole grains',
  },
  {
    id: DefenseSystem.MICROBIOME,
    name: 'Microbiome',
    icon: Bug,
    description: 'Balances gut bacteria',
    color: 'yellow',
    examples: 'Yogurt, kimchi, fiber-rich foods',
  },
  {
    id: DefenseSystem.DNA_PROTECTION,
    name: 'DNA Protection',
    icon: Shield,
    description: 'Protects genetic material',
    color: 'blue',
    examples: 'Broccoli, kale, citrus fruits',
  },
  {
    id: DefenseSystem.IMMUNITY,
    name: 'Immunity',
    icon: Activity,
    description: 'Strengthens immune response',
    color: 'green',
    examples: 'Mushrooms, ginger, garlic',
  },
];

const COLOR_CLASSES = {
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    bgSelected: 'bg-red-600',
    text: 'text-red-700 dark:text-red-300',
    textSelected: 'text-white',
    border: 'border-red-300 dark:border-red-700',
    borderSelected: 'border-red-600',
    hover: 'hover:bg-red-200 dark:hover:bg-red-800/40',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    bgSelected: 'bg-purple-600',
    text: 'text-purple-700 dark:text-purple-300',
    textSelected: 'text-white',
    border: 'border-purple-300 dark:border-purple-700',
    borderSelected: 'border-purple-600',
    hover: 'hover:bg-purple-200 dark:hover:bg-purple-800/40',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    bgSelected: 'bg-yellow-600',
    text: 'text-yellow-700 dark:text-yellow-300',
    textSelected: 'text-white',
    border: 'border-yellow-300 dark:border-yellow-700',
    borderSelected: 'border-yellow-600',
    hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-800/40',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    bgSelected: 'bg-blue-600',
    text: 'text-blue-700 dark:text-blue-300',
    textSelected: 'text-white',
    border: 'border-blue-300 dark:border-blue-700',
    borderSelected: 'border-blue-600',
    hover: 'hover:bg-blue-200 dark:hover:bg-blue-800/40',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    bgSelected: 'bg-green-600',
    text: 'text-green-700 dark:text-green-300',
    textSelected: 'text-white',
    border: 'border-green-300 dark:border-green-700',
    borderSelected: 'border-green-600',
    hover: 'hover:bg-green-200 dark:hover:bg-green-800/40',
  },
};

export default function DefenseSystemSelector({
  value,
  onChange,
  label = 'Focus Defense Systems',
  maxSelections = 5,
  className = '',
}: DefenseSystemSelectorProps) {
  const handleToggle = (system: DefenseSystem) => {
    if (value.includes(system)) {
      onChange(value.filter((s) => s !== system));
    } else {
      if (value.length < maxSelections) {
        onChange([...value, system]);
      }
    }
  };

  return (
    <div className={className}>
      {label && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Select up to {maxSelections} systems you want to focus on ({value.length}/{maxSelections} selected)
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {DEFENSE_SYSTEMS.map((system) => {
          const isSelected = value.includes(system.id);
          const colors = COLOR_CLASSES[system.color as keyof typeof COLOR_CLASSES];
          const Icon = system.icon;
          const isDisabled = !isSelected && value.length >= maxSelections;

          return (
            <button
              key={system.id}
              type="button"
              onClick={() => handleToggle(system.id)}
              disabled={isDisabled}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? `${colors.bgSelected} ${colors.borderSelected} shadow-md transform scale-[1.02]`
                  : `${colors.bg} ${colors.border} ${!isDisabled && colors.hover}`
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Icon */}
              <div className="mb-3">
                <Icon
                  className={`w-8 h-8 ${
                    isSelected ? colors.textSelected : colors.text
                  }`}
                />
              </div>

              {/* Name */}
              <h3
                className={`font-semibold text-sm mb-1 ${
                  isSelected ? colors.textSelected : colors.text
                }`}
              >
                {system.name}
              </h3>

              {/* Description */}
              <p
                className={`text-xs mb-2 ${
                  isSelected
                    ? 'text-white/90'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {system.description}
              </p>

              {/* Examples */}
              <p
                className={`text-xs italic ${
                  isSelected
                    ? 'text-white/75'
                    : 'text-gray-500 dark:text-gray-500'
                }`}
              >
                {system.examples}
              </p>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <svg
                      className={colors.text}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      width="16"
                      height="16"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        💡 Your focus systems will be prioritized in meal plans and recipe recommendations
      </p>
    </div>
  );
}
