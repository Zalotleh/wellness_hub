'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, User, Users, Globe, ChefHat, AlertCircle } from 'lucide-react';
import { DefenseSystem } from '@/types';
import SystemSelector from './SystemSelector';

interface ConfigurationData {
  title: string;
  description: string;
  servings: number;
  duration: 1 | 2 | 3 | 4; // Number of weeks
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
  const [showTips, setShowTips] = useState(true);

  // Quality Score Calculator for Meal Plans
  const calculateQualityScore = () => {
    let score = 0;
    let tips: string[] = [];

    // Duration scoring (always has a value, but preference matters)
    if (configuration.duration >= 2) {
      score += 1;
      tips.push('Great! Longer plans provide better variety and balance');
    } else {
      tips.push('Consider a 2+ week plan for better nutritional variety');
    }

    // Servings specified (not default)
    if (configuration.servings && configuration.servings !== 2) {
      score += 1;
      tips.push('Servings customized for accurate portions');
    } else {
      tips.push('Adjust servings to match your household size');
    }

    // Defense systems selected
    if (configuration.focusSystems && configuration.focusSystems.length > 0) {
      if (configuration.focusSystems.length >= 2) {
        score += 1;
        tips.push('Excellent! Multiple systems ensure balanced nutrition');
      } else {
        score += 0.5;
        tips.push('Add 1-2 more defense systems for better balance');
      }
    } else {
      tips.push('Select 2-3 defense systems for targeted health benefits');
    }

    // Dietary restrictions
    if (configuration.dietaryRestrictions && configuration.dietaryRestrictions.length > 0) {
      score += 1;
      tips.push('Dietary preferences help personalize your plan');
    } else {
      tips.push('Add dietary restrictions to ensure all recipes match your needs');
    }

    // Title and description
    if (configuration.title && configuration.title.trim().length > 0) {
      score += 1;
      tips.push('Good! A clear title helps you organize your plans');
    } else {
      tips.push('Add a descriptive title for your meal plan');
    }

    return { score, maxScore: 5, tips };
  };

  const qualityData = calculateQualityScore();
  const qualityPercentage = (qualityData.score / qualityData.maxScore) * 100;
  const qualityColor = 
    qualityPercentage >= 80 ? 'text-green-600 dark:text-green-400' :
    qualityPercentage >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
    'text-orange-600 dark:text-orange-400';
  const qualityBgColor = 
    qualityPercentage >= 80 ? 'bg-green-100 dark:bg-green-900/20' :
    qualityPercentage >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/20' :
    'bg-orange-100 dark:bg-orange-900/20';
  const qualityBarColor = 
    qualityPercentage >= 80 ? 'bg-green-500' :
    qualityPercentage >= 60 ? 'bg-yellow-500' :
    'bg-orange-500';

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

  const durationOptions = [
    { value: 1 as const, label: '1 Week', description: '7 days of meals', icon: '📅' },
    { value: 2 as const, label: '2 Weeks', description: '14 days of meals', icon: '📆' },
    { value: 3 as const, label: '3 Weeks', description: '21 days of meals', icon: '🗓️' },
    { value: 4 as const, label: '4 Weeks', description: 'Full month plan', icon: '📊' },
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 border dark:border-gray-700">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <ChefHat className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Your Meal Plan
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Customize your weekly meal plan with AI-generated recipes tailored to your preferences and dietary needs.
          </p>
        </div>

        {/* Quality Score Indicator */}
        <div className={`${qualityBgColor} border-2 ${qualityPercentage >= 80 ? 'border-green-300 dark:border-green-700' : qualityPercentage >= 60 ? 'border-yellow-300 dark:border-yellow-700' : 'border-orange-300 dark:border-orange-700'} rounded-lg p-4 mb-6 space-y-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">
                {qualityPercentage >= 80 ? '🌟' : qualityPercentage >= 60 ? '⭐' : '💡'}
              </span>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Plan Quality Score</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {qualityPercentage >= 80 ? 'Excellent! Your plan is well-configured' : 
                   qualityPercentage >= 60 ? 'Good start! A few tweaks will optimize it' : 
                   'Add more details for a better meal plan'}
                </p>
              </div>
            </div>
            <div className={`text-2xl font-bold ${qualityColor}`}>
              {qualityData.score.toFixed(1)}/{qualityData.maxScore}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full ${qualityBarColor} transition-all duration-500 ease-out`}
              style={{ width: `${qualityPercentage}%` }}
            ></div>
          </div>

          {/* Tips */}
          {qualityData.tips.length > 0 && qualityData.score < qualityData.maxScore && (
            <div className="pt-2 border-t border-current/20">
              <button
                onClick={() => setShowTips(!showTips)}
                className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
              >
                <span>💡 Tips to improve your plan ({qualityData.tips.length})</span>
                <span className="transform transition-transform">{showTips ? '▼' : '▶'}</span>
              </button>
              {showTips && (
                <ul className="mt-2 space-y-1">
                  {qualityData.tips.map((tip, index) => (
                    <li key={index} className="text-xs text-gray-600 dark:text-gray-300 flex items-start space-x-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Quick Examples Section */}
        <details className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <summary className="cursor-pointer font-semibold text-blue-900 dark:text-blue-200 flex items-center space-x-2 hover:text-blue-700 dark:hover:text-blue-100">
            <span>📚</span>
            <span>Quick Examples: What Makes a Great Meal Plan?</span>
          </summary>
          <div className="mt-4 space-y-4 text-sm">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-green-500">
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span className="font-bold text-gray-900 dark:text-white">Good Example</span>
                </div>
                <ul className="space-y-1 text-gray-600 dark:text-gray-300 text-xs">
                  <li><strong>Title:</strong> "Family Microbiome Boost Plan"</li>
                  <li><strong>Duration:</strong> 2 weeks</li>
                  <li><strong>Servings:</strong> 4 people</li>
                  <li><strong>Systems:</strong> Microbiome + Immunity</li>
                  <li><strong>Restrictions:</strong> Dairy-free, nut-free</li>
                  <li className="pt-1 text-green-600 dark:text-green-400"><strong>Result:</strong> Balanced, personalized plan</li>
                </ul>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-red-500">
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span className="font-bold text-gray-900 dark:text-white">Common Mistake</span>
                </div>
                <ul className="space-y-1 text-gray-600 dark:text-gray-300 text-xs">
                  <li><strong>Title:</strong> "Meal Plan"</li>
                  <li><strong>Duration:</strong> 1 week</li>
                  <li><strong>Servings:</strong> Default (2)</li>
                  <li><strong>Systems:</strong> None selected</li>
                  <li><strong>Restrictions:</strong> None</li>
                  <li className="pt-1 text-red-600 dark:text-red-400"><strong>Result:</strong> Generic, may not fit needs</li>
                </ul>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 text-xs text-gray-700 dark:text-gray-200">
              <p className="font-semibold mb-1">💡 Pro Tips:</p>
              <ul className="space-y-1 pl-4 list-disc">
                <li>Choose 2+ defense systems for balanced nutrition across the week</li>
                <li>Longer plans (2-4 weeks) provide better variety and reduce repetition</li>
                <li>Specify servings accurately for correct shopping list quantities</li>
                <li>Add all dietary restrictions upfront to ensure every recipe matches</li>
                <li>Give your plan a descriptive name for easy organization</li>
              </ul>
            </div>
          </div>
        </details>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                  Please fix the following issues:
                </h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Basic Information
            </h3>

            {/* Plan Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Plan Title *
              </label>
              <input
                type="text"
                value={configuration.title}
                onChange={(e) => onConfigurationChange({ title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="e.g., My Weekly Plan, Keto Week 1, Family Meals"
                maxLength={100}
              />
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {configuration.title.length}/100 characters
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={configuration.description}
                onChange={(e) => onConfigurationChange({ description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                placeholder="Any notes about this meal plan..."
                rows={3}
                maxLength={500}
              />
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {configuration.description.length}/500 characters
              </div>
            </div>

            {/* Servings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
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
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
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

            {/* Plan Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                Plan Duration
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                  (Choose how many weeks to plan)
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {durationOptions.map((option) => {
                  const isSelected = configuration.duration === option.value;
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => onConfigurationChange({ duration: option.value })}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{option.icon}</span>
                        <div className="flex-1">
                          <div className={`font-semibold mb-1 ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                            {option.label}
                          </div>
                          <div className={`text-xs ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {option.description}
                          </div>
                          {isSelected && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300">
                              <Sparkles className="w-3 h-3" />
                              <span>Selected</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <strong>Note:</strong> Multi-week plans (2-4 weeks) will include a special monthly view for easier navigation.
              </div>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Dietary Preferences
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
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
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                        }
                      `}
                      title={restriction.description}
                    >
                      <div className={`font-medium ${isSelected ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'}`}>
                        {restriction.label}
                      </div>
                      <div className={`text-xs mt-1 ${isSelected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
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
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
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
              <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Custom Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Additional Instructions
                  </label>
                  <textarea
                    value={configuration.customInstructions}
                    onChange={(e) => onConfigurationChange({ customInstructions: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                    placeholder="e.g., Include more fish, avoid mushrooms, prefer quick meals, focus on one-pot dishes..."
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {configuration.customInstructions.length}/1000 characters
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
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
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`} />
                          <div className="flex-1">
                            <div className={`font-medium ${isSelected ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'}`}>
                              {option.label}
                            </div>
                            <div className={`text-sm ${isSelected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Tags (Optional)
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      onKeyDown={handleTagAdd}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Add tags (press Enter)... e.g., quick, budget-friendly, meal-prep"
                    />
                    {configuration.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {configuration.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                          >
                            {tag}
                            <button
                              onClick={() => handleTagRemove(tag)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                              aria-label={`Remove ${tag} tag`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {configuration.tags.length}/10 tags
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !configuration.title.trim()}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 text-lg"
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
              <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-3">
                This may take up to 30 seconds while we create your personalized meal plan...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}