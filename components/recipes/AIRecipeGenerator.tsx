'use client';

import React, { useState } from 'react';
import { DefenseSystem, RecipeFormData } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { Sparkles, Loader2, Plus, X, Wand2 } from 'lucide-react';

interface AIRecipeGeneratorProps {
  onRecipeGenerated?: (recipe: RecipeFormData) => void;
  onSaveRecipe?: (recipe: RecipeFormData) => Promise<void>;
}

export default function AIRecipeGenerator({
  onRecipeGenerated,
  onSaveRecipe,
}: AIRecipeGeneratorProps) {
  const [defenseSystem, setDefenseSystem] = useState<DefenseSystem>(
    DefenseSystem.ANGIOGENESIS
  );
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [mealType, setMealType] = useState('any');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeFormData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mealTypes = ['any', 'breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
  const commonRestrictions = [
    'vegetarian',
    'vegan',
    'gluten-free',
    'dairy-free',
    'nut-free',
    'low-carb',
  ];

  const handleAddIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const toggleRestriction = (restriction: string) => {
    if (dietaryRestrictions.includes(restriction)) {
      setDietaryRestrictions(dietaryRestrictions.filter((r) => r !== restriction));
    } else {
      setDietaryRestrictions([...dietaryRestrictions, restriction]);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const validIngredients = ingredients.filter((ing) => ing.trim() !== '');

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defenseSystem,
          ingredients: validIngredients,
          dietaryRestrictions,
          mealType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate recipe');
      }

      const { data: recipe } = await response.json();
      setGeneratedRecipe(recipe);

      if (onRecipeGenerated) {
        onRecipeGenerated(recipe);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate recipe');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    console.log('Save button clicked');
    console.log('generatedRecipe:', generatedRecipe);
    console.log('onSaveRecipe exists:', !!onSaveRecipe);
    
    if (!generatedRecipe || !onSaveRecipe) {
      console.log('Early return - missing generatedRecipe or onSaveRecipe');
      return;
    }

    // Component-level validation and data transformation
    console.log('Raw generated recipe:', generatedRecipe);
    
    // Use the title from the API response, or generate one if missing
    let recipeTitle = generatedRecipe.title;
    if (!recipeTitle) {
      // Fallback title based on defense system
      recipeTitle = `${DEFENSE_SYSTEMS[defenseSystem].displayName} Recipe`;
    }

    const recipeData: RecipeFormData = {
      title: recipeTitle,
      ingredients: Array.isArray(generatedRecipe.ingredients) 
        ? generatedRecipe.ingredients.map(ing => {
            if (typeof ing === 'string') {
              return { name: ing, amount: '1' };
            }
            // Ensure both name and amount are strings
            return {
              name: String(ing.name || '').trim(),
              amount: String(ing.amount || '').trim() || '1'
            };
          })
        : [],
      instructions: generatedRecipe.instructions || '',
      defenseSystem: generatedRecipe.defenseSystem || defenseSystem,
      // Optional fields
      description: generatedRecipe.description,
      prepTime: generatedRecipe.prepTime,
      cookTime: generatedRecipe.cookTime,
      servings: typeof generatedRecipe.servings === 'number' ? generatedRecipe.servings : undefined,
      nutrients: generatedRecipe.nutrients,
    };
    
    console.log('Transformed recipe data:', recipeData);

    // UI-level validation with detailed checks
    if (!recipeData.title?.trim() || recipeData.title.length < 3) {
      setError('Recipe title must be at least 3 characters long');
      return;
    }

    if (!recipeData.ingredients?.length) {
      setError('At least one ingredient is required');
      return;
    }

    // Validate each ingredient has both name and amount
    const invalidIngredient = recipeData.ingredients.find(
      ing => !ing.name?.trim() || !ing.amount?.trim()
    );
    if (invalidIngredient) {
      setError('Each ingredient must have both a name and amount');
      return;
    }

    if (!recipeData.instructions?.trim() || recipeData.instructions.length < 20) {
      setError('Recipe instructions must be at least 20 characters long');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveRecipe(recipeData);
      setGeneratedRecipe(null);
      setIngredients(['']);
      setDietaryRestrictions([]);
      setError(null); // Clear any previous errors on success
    } catch (err: any) {
      setError(err.message || 'Failed to save recipe');
    } finally {
      setIsSaving(false);
    }
  };

  const systemInfo = DEFENSE_SYSTEMS[defenseSystem];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <Sparkles className="w-8 h-8" />
          <h2 className="text-2xl font-bold">AI Recipe Generator</h2>
        </div>
        <p className="text-purple-100">
          Let AI create personalized health-boosting recipes based on your preferences!
        </p>
      </div>

      {!generatedRecipe ? (
        /* Configuration Form */
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Defense System Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Which defense system would you like to support?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.values(DefenseSystem).map((system) => {
                const info = DEFENSE_SYSTEMS[system];
                const isSelected = defenseSystem === system;

                return (
                  <button
                    key={system}
                    type="button"
                    onClick={() => setDefenseSystem(system)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? `${info.borderColor} ${info.bgColor} scale-105`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">{info.icon}</span>
                      <span className="font-bold text-sm">{info.displayName}</span>
                    </div>
                    <p className="text-xs text-gray-600">{info.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* System Info */}
          <div className={`p-4 rounded-lg ${systemInfo.bgColor}`}>
            <h4 className="font-bold text-sm mb-2">Key Foods for {systemInfo.displayName}:</h4>
            <div className="flex flex-wrap gap-2">
              {systemInfo.keyFoods.map((food) => (
                <span key={food} className="text-xs bg-white px-2 py-1 rounded">
                  {food}
                </span>
              ))}
            </div>
          </div>

          {/* Ingredients Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Ingredients you'd like to use (optional)
            </label>
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => handleIngredientChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="e.g., Salmon, Broccoli, Tomatoes"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddIngredient}
                className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add ingredient</span>
              </button>
            </div>
          </div>

          {/* Meal Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Meal Type
            </label>
            <div className="flex flex-wrap gap-2">
              {mealTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                    mealType === type
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Dietary Restrictions (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {commonRestrictions.map((restriction) => (
                <button
                  key={restriction}
                  type="button"
                  onClick={() => toggleRestriction(restriction)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                    dietaryRestrictions.includes(restriction)
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {restriction}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Generating your recipe...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-6 h-6" />
                <span>Generate Recipe with AI</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Generated Recipe Display */
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800">
              🎉 Your AI-Generated Recipe
            </h3>
            <button
              type="button"
              onClick={() => setGeneratedRecipe(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Recipe Content */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-bold text-gray-800">
                {generatedRecipe.title}
              </h4>
              <div
                className={`inline-flex items-center space-x-2 mt-2 px-3 py-1 rounded-full text-sm font-medium ${systemInfo.bgColor} ${systemInfo.textColor}`}
              >
                <span>{systemInfo.icon}</span>
                <span>{systemInfo.displayName}</span>
              </div>
            </div>

            {generatedRecipe.description && (
              <p className="text-gray-600">{generatedRecipe.description}</p>
            )}

            <div className="flex items-center space-x-6 text-sm text-gray-600">
              {generatedRecipe.prepTime && (
                <span>⏱️ Prep: {generatedRecipe.prepTime}</span>
              )}
              {generatedRecipe.cookTime && (
                <span>🔥 Cook: {generatedRecipe.cookTime}</span>
              )}
              {generatedRecipe.servings && (
                <span>🍽️ Servings: {generatedRecipe.servings}</span>
              )}
            </div>

            <div>
              <h5 className="font-bold text-gray-800 mb-2">Ingredients</h5>
              <ul className="space-y-1">
                {generatedRecipe.ingredients.map((ing, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span className="font-medium">{ing.amount}</span>
                    <span>{ing.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-gray-800 mb-2">Instructions</h5>
              <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-line text-sm">
                {generatedRecipe.instructions}
              </div>
            </div>

            {generatedRecipe.nutrients && Object.keys(generatedRecipe.nutrients).length > 0 && (
              <div>
                <h5 className="font-bold text-gray-800 mb-2">Key Nutrients</h5>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(generatedRecipe.nutrients).map(([nutrient, value]) => (
                    <span
                      key={nutrient}
                      className="bg-purple-50 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {nutrient}: {value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setGeneratedRecipe(null)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Generate Another
            </button>
            {onSaveRecipe && (
              <button
                type="button"
                onClick={() => {
                  console.log('Save button clicked');
                  handleSave();
                }}
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save to My Recipes</span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-blue-900 mb-2">💡 How it works</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• AI analyzes the defense system and its key nutrients</li>
          <li>• Creates recipes using foods that support your health goals</li>
          <li>• Considers your ingredients and dietary restrictions</li>
          <li>• Generates complete recipes with instructions and nutrition info</li>
        </ul>
      </div>
    </div>
  );
}