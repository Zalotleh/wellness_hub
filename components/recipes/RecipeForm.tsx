'use client';

import React, { useState, useEffect } from 'react';
import { DefenseSystem, RecipeFormData } from '@/types';
import { Plus, X, Clock, Users, ChefHat, Loader2 } from 'lucide-react';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { getUnitsBySystem, getSuggestedUnitsBySystem, getUnitLabel } from '@/lib/constants/measurement-units';
import { getMeasurementPreference } from '@/lib/shopping/measurement-system';

interface RecipeFormProps {
  onSubmit: (data: RecipeFormData) => Promise<void>;
  initialData?: Partial<RecipeFormData>;
  submitButtonText?: string;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

export default function RecipeForm({
  onSubmit,
  initialData,
  submitButtonText = 'Create Recipe',
  onCancel,
  showCancelButton = false,
}: RecipeFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [measurementSystem, setMeasurementSystem] = useState<'imperial' | 'metric'>('imperial');

  // Get user's measurement preference on mount
  useEffect(() => {
    const preference = getMeasurementPreference();
    setMeasurementSystem(preference.system);
  }, []);

  const [formData, setFormData] = useState<RecipeFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    ingredients: initialData?.ingredients || [{ name: '', quantity: '', unit: '' }],
    instructions: initialData?.instructions || '',
    prepTime: initialData?.prepTime || '',
    cookTime: initialData?.cookTime || '',
    servings: initialData?.servings || undefined,
    defenseSystems: initialData?.defenseSystems || [],
    nutrients: initialData?.nutrients || {},
    imageUrl: initialData?.imageUrl || '',
  });

  // Validation functions
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.defenseSystems || formData.defenseSystems.length === 0) {
      newErrors.defenseSystems = 'Please select at least one defense system';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    const validIngredients = formData.ingredients.filter(
      (ing) => ing.name.trim() && ing.quantity.trim() && ing.unit.trim()
    );

    if (validIngredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.instructions.trim() || formData.instructions.length < 20) {
      newErrors.instructions = 'Instructions must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'servings' ? (value ? parseInt(value) : undefined) : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Ingredient management
  const addIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: '' }],
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const updateIngredient = (
    index: number,
    field: 'name' | 'quantity' | 'unit',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      ),
    }));
  };

  // Defense systems management
  const toggleDefenseSystem = (system: DefenseSystem) => {
    setFormData((prev) => {
      const isSelected = prev.defenseSystems.includes(system);
      return {
        ...prev,
        defenseSystems: isSelected
          ? prev.defenseSystems.filter((s) => s !== system)
          : [...prev.defenseSystems, system],
      };
    });
  };

  // Navigation
  const nextStep = () => {
    let isValid = false;
    if (currentStep === 1) isValid = validateStep1();
    if (currentStep === 2) isValid = validateStep2();
    if (currentStep === 3) isValid = validateStep3();

    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep3()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out empty ingredients
      const cleanedData = {
        ...formData,
        ingredients: formData.ingredients.filter(
          (ing) => ing.name.trim() && ing.quantity.trim() && ing.unit.trim()
        ),
      };

      await onSubmit(cleanedData);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to save recipe' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className="flex items-center"
              style={{ width: step < 4 ? '25%' : 'auto' }}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  currentStep >= step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {step}
              </div>
              {step < 4 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-colors ${
                    currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className={currentStep >= 1 ? 'text-green-600 font-medium' : 'text-gray-500 dark:text-gray-300'}>
            Basic Info
          </span>
          <span className={currentStep >= 2 ? 'text-green-600 font-medium' : 'text-gray-500 dark:text-gray-300'}>
            Ingredients
          </span>
          <span className={currentStep >= 3 ? 'text-green-600 font-medium' : 'text-gray-500 dark:text-gray-300'}>
            Instructions
          </span>
          <span className={currentStep >= 4 ? 'text-green-600 font-medium' : 'text-gray-500 dark:text-gray-300'}>
            Review
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Basic Information</h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Recipe Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors dark:bg-gray-700 dark:text-white ${
                  errors.title
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-300 dark:border-gray-600 focus:border-green-500'
                }`}
                placeholder="e.g., Mediterranean Salmon Bowl"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors dark:bg-gray-700 dark:text-white ${
                  errors.description
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-300 dark:border-gray-600 focus:border-green-500'
                }`}
                placeholder="Briefly describe your recipe and its health benefits..."
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                {formData.description?.length || 0}/500 characters
              </p>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
              )}
            </div>

            {/* Defense Systems - Multiple Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                Defense Systems * (Select all that apply)
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Choose which defense systems this recipe supports
              </p>
              {errors.defenseSystems && (
                <p className="mb-3 text-sm text-red-600 dark:text-red-400">{errors.defenseSystems}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(DefenseSystem).map((system) => {
                  const info = DEFENSE_SYSTEMS[system];
                  const isSelected = formData.defenseSystems.includes(system);
                  
                  return (
                    <button
                      key={system}
                      type="button"
                      onClick={() => toggleDefenseSystem(system)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? `${info.bgColor} ${info.borderColor} ring-2 ring-offset-2 ring-green-500`
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                          isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-2xl">{info.icon}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 dark:text-gray-200">{info.displayName}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{info.description.slice(0, 50)}...</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Show key foods for selected systems */}
              {formData.defenseSystems.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Key Foods for Selected Systems:</h4>
                  <div className="space-y-2">
                    {formData.defenseSystems.map((system) => {
                      const info = DEFENSE_SYSTEMS[system];
                      return (
                        <div key={system} className="flex items-start space-x-2">
                          <span className="text-lg">{info.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{info.displayName}:</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {info.keyFoods.slice(0, 5).map((food) => (
                                <span key={food} className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600 dark:text-gray-200">
                                  {food}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Time and Servings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Prep Time
                </label>
                <input
                  type="text"
                  name="prepTime"
                  value={formData.prepTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 15 min"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <ChefHat className="w-4 h-4 inline mr-1" />
                  Cook Time
                </label>
                <input
                  type="text"
                  name="cookTime"
                  value={formData.cookTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 30 min"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Servings
                </label>
                <input
                  type="number"
                  name="servings"
                  value={formData.servings || ''}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 4"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Ingredients */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Ingredients</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Add all ingredients needed for your recipe</p>
            </div>

            {errors.ingredients && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">{errors.ingredients}</p>
            )}

            <div className="space-y-3">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={(e) =>
                        updateIngredient(index, 'name', e.target.value)
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                      placeholder="Ingredient name (e.g., Salmon)"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="text"
                      value={ingredient.quantity}
                      onChange={(e) =>
                        updateIngredient(index, 'quantity', e.target.value)
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                      placeholder="Qty"
                    />
                  </div>
                  <div className="w-32">
                    <select
                      value={ingredient.unit}
                      onChange={(e) =>
                        updateIngredient(index, 'unit', e.target.value)
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:outline-none bg-white dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select unit</option>
                      {(() => {
                        // Get units filtered by measurement system
                        const systemUnits = getUnitsBySystem(measurementSystem);
                        const suggestedUnitValues = getSuggestedUnitsBySystem(ingredient.name, measurementSystem);
                        const suggested = systemUnits.filter(u => suggestedUnitValues.includes(u.value));
                        const others = systemUnits.filter(u => !suggestedUnitValues.includes(u.value));
                        
                        return (
                          <>
                            {suggested.length > 0 && (
                              <>
                                <optgroup label="⭐ Suggested">
                                  {suggested.map((unit) => (
                                    <option key={unit.value} value={unit.value}>
                                      {unit.label}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="Other Units">
                                  {others.map((unit) => (
                                    <option key={unit.value} value={unit.value}>
                                      {unit.label}
                                    </option>
                                  ))}
                                </optgroup>
                              </>
                            )}
                            {suggested.length === 0 && systemUnits.map((unit) => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </>
                        );
                      })()}
                    </select>
                  </div>
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Ingredient Button - Enhanced Card Style */}
            <button
              type="button"
              onClick={addIngredient}
              className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center group-hover:bg-green-500 transition-colors">
                  <Plus className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-200 group-hover:text-green-600 transition-colors">
                  Add Another Ingredient
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-400">Click to add more ingredients to your recipe</span>
              </div>
            </button>

            <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
              💡 Tip: Include ingredients that support your selected defense systems
            </p>
          </div>
        )}

        {/* Step 3: Instructions */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Cooking Instructions
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Step-by-Step Instructions *
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={12}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors font-mono text-sm dark:bg-gray-700 dark:text-white ${
                  errors.instructions
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-300 dark:border-gray-600 focus:border-green-500'
                }`}
                placeholder="1. Preheat oven to 375°F&#10;2. Season the salmon with salt and pepper&#10;3. Place on baking sheet&#10;..."
              />
              {errors.instructions && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.instructions}</p>
              )}
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                💡 Tip: Number each step and be specific with temperatures, times, and techniques
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Review Your Recipe</h2>

            <div className="space-y-6">
              {/* Title & Systems */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{formData.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.defenseSystems.map((system) => {
                    const info = DEFENSE_SYSTEMS[system];
                    return (
                      <div
                        key={system}
                        className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${info.bgColor} ${info.textColor}`}
                      >
                        <span>{info.icon}</span>
                        <span>{info.displayName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              {formData.description && (
                <p className="text-gray-600 dark:text-gray-300">{formData.description}</p>
              )}

              {/* Meta Info */}
              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
                {formData.prepTime && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Prep: {formData.prepTime}</span>
                  </div>
                )}
                {formData.cookTime && (
                  <div className="flex items-center space-x-1">
                    <ChefHat className="w-4 h-4" />
                    <span>Cook: {formData.cookTime}</span>
                  </div>
                )}
                {formData.servings && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{formData.servings} servings</span>
                  </div>
                )}
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white mb-3">Ingredients</h4>
                <ul className="space-y-2">
                  {formData.ingredients
                    .filter((ing) => ing.name.trim() && ing.quantity.trim() && ing.unit.trim())
                    .map((ingredient, index) => (
                      <li key={index} className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="font-medium">{ingredient.quantity} {getUnitLabel(ingredient.unit)}</span>
                        <span>{ingredient.name}</span>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white mb-3">Instructions</h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg whitespace-pre-line text-sm text-gray-700 dark:text-gray-200">
                  {formData.instructions}
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400 font-medium">{errors.submit}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t dark:border-gray-700">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors font-medium"
              >
                Cancel
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{submitButtonText}</span>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}