'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, User, Users, Globe, ChefHat, AlertCircle } from 'lucide-react';
import { DefenseSystem } from '@/types';
import SystemSelector from './SystemSelector';

interface ConfigurationData {
  title: string;
  description: string;
  servings: number;
  dietaryRestrictions: string[];
  focusSystems: DefenseSystem[];
  customInstructions: string;
  visibility: 'PRIVATE' | 'PUBLIC' | 'FRIENDS';
  tags: string[];
}

interface PlanConfigurationProps {
  configuration: ConfigurationData;
  onConfigurationChange: (updates: Partial<ConfigurationData>) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  className?: string;
}

export default function PlanConfiguration({
  configuration,
  onConfigurationChange,
  onGenerate,
  isGenerating = false,
  className = '',
}: PlanConfigurationProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const restrictions = [
    { id: 'vegetarian', label: 'Vegetarian', description: 'No meat or fish' },
    { id: 'vegan', label: 'Vegan', description: 'No animal products' },
    { id: 'gluten-free', label: 'Gluten-Free', description: 'No wheat, barley, or rye' },
    { id: 'dairy-free', label: 'Dairy-Free', description: 'No milk products' },
    { id: 'nut-free', label: 'Nut-Free', description: 'No nuts or tree nuts' },
    { id: 'low-carb', label: 'Low-Carb', description: 'Reduced carbohydrates' },
    { id: 'keto', label: 'Keto', description: 'High fat, very low carb' },
    { id: 'paleo', label: 'Paleo', description: 'Whole foods, no processed' },
  ];

  const servingOptions = [
    { value: 1, label: '1 person', icon: User },
    { value: 2, label: '2 people', icon: Users },
    { value: 3, label: '3 people', icon: Users },
    { value: 4, label: '4 people', icon: Users },
    { value: 5, label: '5 people', icon: Users },
    { value: 6, label: '6 people', icon: Users },
    { value: 7, label: '7 people', icon: Users },
    { value: 8, label: '8 people', icon: Users },
  ];

  const visibilityOptions = [
    {
      value: 'PRIVATE' as const,
      label: 'Private',
      description: 'Only you can see this plan',
      icon: User,
    },
    {
      value: 'FRIENDS' as const,
      label: 'Friends Only',
      description: 'Your friends can see this plan',
      icon: Users,
    },
    {
      value: 'PUBLIC' as const,
      label: 'Public',
      description: 'Anyone with the link can see this plan',
      icon: Globe,
    },
  ];

  const validateConfiguration = (): boolean => {
    const errors: string[] = [];

    if (!configuration.title.trim()) {
      errors.push('Plan title is required');
    }

    if (configuration.title.length > 100) {
      errors.push('Plan title must be less than 100 characters');
    }

    if (configuration.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }

    if (configuration.customInstructions.length > 1000) {
      errors.push('Custom instructions must be less than 1000 characters');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleGenerate = () => {
    if (validateConfiguration()) {
      onGenerate();
    }
  };

  const handleRestrictionToggle = (restriction: string) => {
    const current = configuration.dietaryRestrictions;
    const updated = current.includes(restriction)
      ? current.filter(r => r !== restriction)
      : [...current, restriction];
    
    onConfigurationChange({ dietaryRestrictions: updated });
  };

  const handleTagAdd = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const input = event.currentTarget;
      const tag = input.value.trim();
      
      if (tag && !configuration.tags.includes(tag) && configuration.tags.length < 10) {
        onConfigurationChange({ tags: [...configuration.tags, tag] });
        input.value = '';
      }
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    onConfigurationChange({ 
      tags: configuration.tags.filter(tag => tag !== tagToRemove) 
    });
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <ChefHat className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Create Your Meal Plan
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Customize your weekly meal plan with AI-generated recipes tailored to your preferences and dietary needs.
          </p>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Please fix the following issues:
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
            </h3>

            {/* Plan Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Title *
              </label>
              <input
                type="text"
                value={configuration.title}
                onChange={(e) => onConfigurationChange({ title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="e.g., My Weekly Plan, Keto Week 1, Family Meals"
                maxLength={100}
              />
              <div className="mt-1 text-xs text-gray-500">
                {configuration.title.length}/100 characters
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={configuration.description}
                onChange={(e) => onConfigurationChange({ description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                placeholder="Any notes about this meal plan..."
                rows={3}
                maxLength={500}
              />
              <div className="mt-1 text-xs text-gray-500">
                {configuration.description.length}/500 characters
              </div>
            </div>

            {/* Servings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Default Servings
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {servingOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = configuration.servings === option.value;
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => onConfigurationChange({ servings: option.value })}
                      className={`
                        flex items-center gap-2 p-3 rounded-lg border-2 transition-all
                        ${isSelected
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Dietary Preferences
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Dietary Restrictions
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {restrictions.map((restriction) => {
                  const isSelected = configuration.dietaryRestrictions.includes(restriction.id);
                  
                  return (
                    <button
                      key={restriction.id}
                      onClick={() => handleRestrictionToggle(restriction.id)}
                      className={`
                        p-3 rounded-lg border-2 text-left transition-all
                        ${isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}
                      title={restriction.description}
                    >
                      <div className={`font-medium ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                        {restriction.label}
                      </div>
                      <div className={`text-xs mt-1 ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
                        {restriction.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Defense Systems */}
          <SystemSelector
            selectedSystems={configuration.focusSystems}
            onSelectionChange={(systems) => onConfigurationChange({ focusSystems: systems })}
            maxSelections={5}
            showDescription={true}
          />

          {/* Advanced Options */}
          <div className="space-y-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span>Advanced Options</span>
              <svg 
                className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvanced && (
              <div className="space-y-6 pt-4 border-t border-gray-200">
                {/* Custom Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Instructions
                  </label>
                  <textarea
                    value={configuration.customInstructions}
                    onChange={(e) => onConfigurationChange({ customInstructions: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                    placeholder="e.g., Include more fish, avoid mushrooms, prefer quick meals, focus on one-pot dishes..."
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    {configuration.customInstructions.length}/1000 characters
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Plan Visibility
                  </label>
                  <div className="space-y-3">
                    {visibilityOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = configuration.visibility === option.value;
                      
                      return (
                        <button
                          key={option.value}
                          onClick={() => onConfigurationChange({ visibility: option.value })}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all
                            ${isSelected
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
                          <div className="flex-1">
                            <div className={`font-medium ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                              {option.label}
                            </div>
                            <div className={`text-sm ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
                              {option.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (Optional)
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      onKeyDown={handleTagAdd}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Add tags (press Enter)... e.g., quick, budget-friendly, meal-prep"
                    />
                    {configuration.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {configuration.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {tag}
                            <button
                              onClick={() => handleTagRemove(tag)}
                              className="text-blue-600 hover:text-blue-800"
                              aria-label={`Remove ${tag} tag`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {configuration.tags.length}/10 tags
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !configuration.title.trim()}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating Your Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Generate Meal Plan
                </>
              )}
            </button>
            
            {isGenerating && (
              <p className="text-center text-sm text-gray-600 mt-3">
                This may take up to 30 seconds while we create your personalized meal plan...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}