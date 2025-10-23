'use client';

import React, { useState } from 'react';
import { DefenseSystem, RecipeFormData } from '@/types';
import { Plus, X, Clock, Users, ChefHat, Loader2 } from 'lucide-react';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';

interface RecipeFormProps {
  initialData?: Partial<RecipeFormData>;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  onCancel?: () => void;
  showCancelButton?: boolean;
  submitButtonText?: string;
}

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

  const [formData, setFormData] = useState<RecipeFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    ingredients: initialData?.ingredients || [{ name: '', amount: '' }],
    instructions: initialData?.instructions || '',
    prepTime: initialData?.prepTime || '',
    cookTime: initialData?.cookTime || '',
    servings: initialData?.servings || undefined,
    defenseSystem: initialData?.defenseSystem || DefenseSystem.ANGIOGENESIS,
    nutrients: initialData?.nutrients || {},
    imageUrl: initialData?.imageUrl || '',
  });

  // Validation functions
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim() || formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description is too long (max 500 characters)';
    }

    if (!formData.defenseSystem) {
      newErrors.defenseSystem = 'Please select a defense system';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    const validIngredients = formData.ingredients.filter(
      (ing) => ing.name.trim() && ing.amount.trim()
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
      ingredients: [...prev.ingredients, { name: '', amount: '' }],
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
    field: 'name' | 'amount',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      ),
    }));
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
          (ing) => ing.name.trim() && ing.amount.trim()
        ),
      };

      await onSubmit(cleanedData);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to save recipe' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSystemInfo = DEFENSE_SYSTEMS[formData.defenseSystem];

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
                    : 'bg-gray-200 text-gray-500'
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
          <span className={currentStep >= 1 ? 'text-green-600 font-medium' : 'text-gray-500'}>
            Basic Info
          </span>
          <span className={currentStep >= 2 ? 'text-green-600 font-medium' : 'text-gray-500'}>
            Ingredients
          </span>
          <span className={currentStep >= 3 ? 'text-green-600 font-medium' : 'text-gray-500'}>
            Instructions
          </span>
          <span className={currentStep >= 4 ? 'text-green-600 font-medium' : 'text-gray-500'}>
            Review
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Basic Information</h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Recipe Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.title
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-300 focus:border-green-500'
                }`}
                placeholder="e.g., Mediterranean Salmon Bowl"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.description
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-300 focus:border-green-500'
                }`}
                placeholder="Briefly describe your recipe and its health benefits..."
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.description?.length || 0}/500 characters
              </p>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Defense System */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Defense System *
              </label>
              <select
                name="defenseSystem"
                value={formData.defenseSystem}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.defenseSystem
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-300 focus:border-green-500'
                }`}
              >
                {Object.values(DefenseSystem).map((system) => {
                  const info = DEFENSE_SYSTEMS[system];
                  return (
                    <option key={system} value={system}>
                      {info.icon} {info.displayName}
                    </option>
                  );
                })}
              </select>
              {errors.defenseSystem && (
                <p className="mt-1 text-sm text-red-600">{errors.defenseSystem}</p>
              )}
              {selectedSystemInfo && (
                <div
                  className={`mt-3 p-4 rounded-lg border-2 ${selectedSystemInfo.bgColor} ${selectedSystemInfo.borderColor}`}
                >
                  <p className="text-sm font-medium">{selectedSystemInfo.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSystemInfo.keyFoods.slice(0, 5).map((food) => (
                      <span
                        key={food}
                        className="text-xs bg-white px-2 py-1 rounded-full"
                      >
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Time and Servings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Prep Time
                </label>
                <input
                  type="text"
                  name="prepTime"
                  value={formData.prepTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="e.g., 15 min"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <ChefHat className="w-4 h-4 inline mr-1" />
                  Cook Time
                </label>
                <input
                  type="text"
                  name="cookTime"
                  value={formData.cookTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="e.g., 30 min"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Servings
                </label>
                <input
                  type="number"
                  name="servings"
                  value={formData.servings || ''}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="e.g., 4"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Ingredients */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Ingredients</h2>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Ingredient</span>
              </button>
            </div>

            {errors.ingredients && (
              <p className="text-sm text-red-600 mb-4">{errors.ingredients}</p>
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
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                      placeholder="Ingredient name (e.g., Salmon)"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="text"
                      value={ingredient.amount}
                      onChange={(e) =>
                        updateIngredient(index, 'amount', e.target.value)
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                      placeholder="Amount"
                    />
                  </div>
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-600 mt-4">
              💡 Tip: Include ingredients that support the {selectedSystemInfo?.displayName} system
            </p>
          </div>
        )}

        {/* Step 3: Instructions */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Cooking Instructions
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Step-by-Step Instructions *
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={12}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors font-mono text-sm ${
                  errors.instructions
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-300 focus:border-green-500'
                }`}
                placeholder="1. Preheat oven to 375°F&#10;2. Season the salmon with salt and pepper&#10;3. Place on baking sheet&#10;..."
              />
              {errors.instructions && (
                <p className="mt-1 text-sm text-red-600">{errors.instructions}</p>
              )}
              <p className="mt-2 text-sm text-gray-600">
                💡 Tip: Number each step and be specific with temperatures, times, and techniques
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Review Your Recipe</h2>

            <div className="space-y-6">
              {/* Title & System */}
              <div>
                <h3 className="text-xl font-bold text-gray-800">{formData.title}</h3>
                <div
                  className={`inline-flex items-center space-x-2 mt-2 px-3 py-1 rounded-full text-sm font-medium ${selectedSystemInfo?.bgColor} ${selectedSystemInfo?.textColor}`}
                >
                  <span>{selectedSystemInfo?.icon}</span>
                  <span>{selectedSystemInfo?.displayName}</span>
                </div>
              </div>

              {/* Description */}
              {formData.description && (
                <p className="text-gray-600">{formData.description}</p>
              )}

              {/* Meta Info */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
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
                <h4 className="font-bold text-gray-800 mb-3">Ingredients</h4>
                <ul className="space-y-2">
                  {formData.ingredients
                    .filter((ing) => ing.name.trim() && ing.amount.trim())
                    .map((ingredient, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="font-medium">{ingredient.amount}</span>
                        <span>{ingredient.name}</span>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3">Instructions</h4>
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-line text-sm">
                  {formData.instructions}
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
                <p className="text-red-600 font-medium">{errors.submit}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
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