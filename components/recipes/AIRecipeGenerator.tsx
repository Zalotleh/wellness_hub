'use client';

import React, { useState, useEffect } from 'react';
import { DefenseSystem, RecipeFormData } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { Sparkles, Loader2, Plus, X, Wand2, Info } from 'lucide-react';
import { getMeasurementPreference } from '@/lib/shopping/measurement-system';
import { getSmartSuggestions } from '@/lib/suggestions/ingredient-suggestions';
import {
  trackGeneration,
  shouldShowOnboarding,
  shouldShowEncouragement,
  getPersonalizedTips,
} from '@/lib/tracking/generation-stats';
import AIGeneratorOnboarding from '@/components/onboarding/AIGeneratorOnboarding';

interface AIRecipeGeneratorProps {
  onRecipeGenerated?: (recipe: RecipeFormData) => void;
  onSaveRecipe?: (recipe: RecipeFormData) => Promise<void>;
  initialParams?: {
    targetSystem?: DefenseSystem;
    dietaryRestrictions?: string[];
    preferredMealTime?: string;
  };
  fromRecommendation?: boolean;
}

export default function AIRecipeGenerator({
  onRecipeGenerated,
  onSaveRecipe,
  initialParams,
  fromRecommendation = false,
}: AIRecipeGeneratorProps) {
  const [defenseSystem, setDefenseSystem] = useState<DefenseSystem>(
    initialParams?.targetSystem || DefenseSystem.ANGIOGENESIS
  );
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(
    initialParams?.dietaryRestrictions || []
  );
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [mealType, setMealType] = useState(
    initialParams?.preferredMealTime?.toLowerCase() || 'any'
  );
  const [measurementSystem, setMeasurementSystem] = useState<'imperial' | 'metric'>('imperial');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeFormData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<{
    defenseSystem: DefenseSystem;
    ingredients: string[];
    dietaryRestrictions: string[];
    mealType: string;
    measurementSystem: 'imperial' | 'metric';
  } | null>(null);
  const [wasNotCounted, setWasNotCounted] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [encouragementMsg, setEncouragementMsg] = useState<string | null>(null);
  const [ingredientSuggestions, setIngredientSuggestions] = useState<string[]>([]);

  // Quality Score Calculator
  const calculateQualityScore = () => {
    const validIngredients = ingredients.filter((ing) => ing.trim() !== '');
    let score = 0;
    let tips: string[] = [];

    // Defense system selected (always true)
    score += 1;

    // Ingredients scoring
    if (validIngredients.length === 0) {
      tips.push('Add at least 3 ingredients for better results');
    } else if (validIngredients.length < 3) {
      score += 1;
      tips.push(`Add ${3 - validIngredients.length} more ingredient${3 - validIngredients.length > 1 ? 's' : ''} for a creative recipe`);
    } else if (validIngredients.length >= 3 && validIngredients.length <= 5) {
      score += 2;
      tips.push('Great ingredient count! Perfect for a balanced recipe');
    } else {
      score += 2;
      tips.push('Excellent variety! This will create a unique recipe');
    }

    // Dietary restrictions
    if (dietaryRestrictions.length > 0) {
      score += 1;
      tips.push('Dietary restrictions help personalize your recipe');
    } else {
      tips.push('Add dietary restrictions to customize your recipe');
    }

    // Meal type specificity
    if (mealType !== 'any') {
      score += 1;
      tips.push('Specific meal type helps create targeted recipes');
    } else {
      tips.push('Select a specific meal type for better results');
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

  // Get user's measurement preference on mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const [measurementPref, userPrefs] = await Promise.all([
          getMeasurementPreference(),
          fetch('/api/user/preferences').then(res => res.ok ? res.json() : null)
        ]);
        
        console.log('🔍 AIRecipeGenerator - Loaded user preferences:', userPrefs);
        console.log('🔍 AIRecipeGenerator - initialParams:', initialParams);
        console.log('🔍 AIRecipeGenerator - preferencesLoaded:', preferencesLoaded);
        
        // Set measurement system
        setMeasurementSystem(measurementPref.system);

        // Load user preferences if not overridden by initialParams
        if (userPrefs?.preferences && !preferencesLoaded) {
          console.log('✅ Loading preferences from API...');
          // Only set if not already provided via initialParams
          if (!initialParams?.dietaryRestrictions || initialParams.dietaryRestrictions.length === 0) {
            if (userPrefs.preferences.defaultDietaryRestrictions?.length > 0) {
              console.log('✅ Setting dietary restrictions:', userPrefs.preferences.defaultDietaryRestrictions);
              setDietaryRestrictions(userPrefs.preferences.defaultDietaryRestrictions);
            }
          }
          if (!initialParams?.targetSystem && userPrefs.preferences.defaultFocusSystems?.length > 0) {
            console.log('✅ Setting defense system:', userPrefs.preferences.defaultFocusSystems[0]);
            setDefenseSystem(userPrefs.preferences.defaultFocusSystems[0] as DefenseSystem);
          }
          setPreferencesLoaded(true);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        // Fall back to defaults
        setMeasurementSystem(getMeasurementPreference().system);
      }
    };

    loadUserPreferences();

    // Check if should show onboarding
    setShowOnboarding(shouldShowOnboarding());
    
    // Check for encouragement message
    const encouragement = shouldShowEncouragement();
    if (encouragement.show) {
      setEncouragementMsg(encouragement.message);
      // Auto-hide after 5 seconds
      setTimeout(() => setEncouragementMsg(null), 5000);
    }
  }, [initialParams]);

  // Update ingredient suggestions when inputs change
  useEffect(() => {
    const validIngredients = ingredients.filter((ing) => ing.trim() !== '');
    const suggestions = getSmartSuggestions(
      defenseSystem,
      mealType,
      dietaryRestrictions,
      validIngredients
    );
    setIngredientSuggestions(suggestions.slice(0, 8)); // Limit to 8 suggestions
  }, [defenseSystem, mealType, dietaryRestrictions, ingredients]);

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
    setWasNotCounted(false);

    try {
      const validIngredients = ingredients.filter((ing) => ing.trim() !== '');

      // Save the current request parameters for potential retry
      const requestParams = {
        defenseSystem,
        ingredients: validIngredients,
        dietaryRestrictions,
        mealType,
        measurementSystem,
      };
      setLastRequest(requestParams);

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestParams),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if this was a quality validation failure (not counted against limit)
        if (errorData.countedAgainstLimit === false) {
          console.log('⚠️ Recipe generation failed quality check, not counted against limit');
          setWasNotCounted(true);
          throw new Error(
            errorData.message || 
            'The AI generated an incomplete recipe. Please try again - this attempt was not counted against your limit.'
          );
        }
        
        // Check if this is a limit reached error
        if (errorData.upgradeRequired) {
          throw new Error(errorData.message || 'Recipe generation limit reached');
        }
        
        throw new Error(errorData.error || 'Failed to generate recipe');
      }

      const responseData = await response.json();
      const recipe = responseData.data;
      
      console.log('✅ Received recipe from API:', recipe);
      console.log('📊 Counted against limit:', responseData.countedAgainstLimit);
      console.log('Recipe structure check:', {
        hasTitle: !!recipe.title,
        hasDescription: !!recipe.description,
        hasIngredients: !!recipe.ingredients,
        ingredientsCount: recipe.ingredients?.length,
        hasInstructions: !!recipe.instructions,
        hasDefenseSystem: !!recipe.defenseSystem,
      });
      
      // Ensure the recipe has required fields
      // Note: If validation passed, title should be good. Only add fallback for display safety.
      const validatedRecipe = {
        ...recipe,
        title: recipe.title || 'Recipe', // Minimal fallback (shouldn't happen after validation)
        description: recipe.description || 'A delicious and healthy recipe.',
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        instructions: recipe.instructions || 'Instructions not available.',
        defenseSystem: recipe.defenseSystem || defenseSystem,
      };
      
      console.log('✅ Validated recipe:', validatedRecipe);
      setGeneratedRecipe(validatedRecipe);

      // Track successful generation
      const nonEmptyIngredients = ingredients.filter((ing) => ing.trim() !== '');
      trackGeneration(
        true,
        qualityData.score,
        nonEmptyIngredients.length,
        dietaryRestrictions.length > 0,
        mealType !== 'any',
        'recipe'
      );

      // Check for encouragement after tracking
      const encouragement = shouldShowEncouragement();
      if (encouragement.show) {
        setEncouragementMsg(encouragement.message);
        setTimeout(() => setEncouragementMsg(null), 5000);
      }

      if (onRecipeGenerated) {
        onRecipeGenerated(validatedRecipe);
      }
    } catch (err: any) {
      console.error('❌ Error in handleGenerate:', err);
      
      // Track failed generation (only if it wasn't due to validation/not counted)
      if (!wasNotCounted) {
        const validIngredients = ingredients.filter((ing) => ing.trim() !== '');
        trackGeneration(
          false,
          qualityData.score,
          validIngredients.length,
          dietaryRestrictions.length > 0,
          mealType !== 'any',
          'recipe'
        );
      }
      
      setError(err.message || 'Failed to generate recipe');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = async () => {
    if (!lastRequest) {
      console.error('No previous request to retry');
      return;
    }

    console.log('🔄 Retrying last request:', lastRequest);
    setIsGenerating(true);
    setError(null);
    setWasNotCounted(false);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if this was a quality validation failure (not counted against limit)
        if (errorData.countedAgainstLimit === false) {
          console.log('⚠️ Recipe generation failed quality check, not counted against limit');
          setWasNotCounted(true);
          throw new Error(
            errorData.message || 
            'The AI generated an incomplete recipe. Please try again - this attempt was not counted against your limit.'
          );
        }
        
        // Check if this is a limit reached error
        if (errorData.upgradeRequired) {
          throw new Error(errorData.message || 'Recipe generation limit reached');
        }
        
        throw new Error(errorData.error || 'Failed to generate recipe');
      }

      const responseData = await response.json();
      const recipe = responseData.data;
      
      console.log('✅ Retry successful! Received recipe from API:', recipe);
      console.log('📊 Counted against limit:', responseData.countedAgainstLimit);
      
      // Ensure the recipe has required fields
      const validatedRecipe = {
        ...recipe,
        title: recipe.title || 'Recipe', // Minimal fallback (shouldn't happen after validation)
        description: recipe.description || 'A delicious and healthy recipe.',
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        instructions: recipe.instructions || 'Instructions not available.',
        defenseSystem: recipe.defenseSystem || lastRequest.defenseSystem,
      };
      
      console.log('✅ Validated recipe:', validatedRecipe);
      setGeneratedRecipe(validatedRecipe);

      if (onRecipeGenerated) {
        onRecipeGenerated(validatedRecipe);
      }
    } catch (err: any) {
      console.error('❌ Error in handleRetry:', err);
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
        ? generatedRecipe.ingredients.map((ing: any) => {
            if (typeof ing === 'string') {
              return { name: ing, quantity: '1', unit: 'piece' };
            }
            
            // Parse amount into quantity and unit
            const amountStr = String(ing.amount || ing.quantity || '').trim();
            const match = amountStr.match(/^(\d+\.?\d*)\s+(.+)$/);
            
            if (match) {
              return {
                name: String(ing.name || '').trim(),
                quantity: match[1],
                unit: match[2]
              };
            }
            
            // If no match, try to use existing quantity/unit or fallback
            return {
              name: String(ing.name || '').trim(),
              quantity: ing.quantity || amountStr || '1',
              unit: ing.unit || 'piece'
            };
          })
        : [],
      instructions: generatedRecipe.instructions || '',
      defenseSystems: generatedRecipe.defenseSystems || [defenseSystem],
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

    // Validate each ingredient has name, quantity, and unit
    const invalidIngredient = recipeData.ingredients.find(
      ing => !ing.name?.trim() || !ing.quantity?.trim() || !ing.unit?.trim()
    );
    if (invalidIngredient) {
      setError('Each ingredient must have a name, quantity, and unit');
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

  const handleOnboardingComplete = (selectedSystem?: DefenseSystem) => {
    if (selectedSystem) {
      setDefenseSystem(selectedSystem);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Onboarding Modal */}
      {showOnboarding && (
        <AIGeneratorOnboarding
          onClose={() => setShowOnboarding(false)}
          onComplete={handleOnboardingComplete}
          type="recipe"
        />
      )}

      {/* Encouragement Message */}
      {encouragementMsg && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-start gap-3 animate-slide-in">
          <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">{encouragementMsg}</p>
          </div>
          <button
            onClick={() => setEncouragementMsg(null)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Personalized Tips (from history) */}
      {!showOnboarding && getPersonalizedTips().length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Personalized Tips for You
          </h4>
          <ul className="space-y-2">
            {getPersonalizedTips().slice(0, 3).map((tip, index) => (
              <li key={index} className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">→</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Loading Overlay - Covers entire component during generation */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:border dark:border-gray-700 p-8 max-w-md mx-4 text-center">
            <div className="relative">
              {/* Animated gradient circle */}
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-purple-500 animate-pulse" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Generating Your Recipe
              </h3>
              <p className="text-gray-600 dark:text-gray-200 mb-4">
                AI is crafting a personalized {DEFENSE_SYSTEMS[defenseSystem].displayName} recipe...
              </p>
              
              {/* Progress indicators */}
              <div className="space-y-2 text-left">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-200">Analyzing defense system requirements</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse delay-100"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-200">Selecting optimal ingredients</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-200"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-200">Creating cooking instructions</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-400 mt-6">This usually takes 10-20 seconds</p>
            </div>
          </div>
        </div>
      )}

      {/* Saving Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:border dark:border-gray-700 p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-900 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Saving Recipe...
            </h3>
            <p className="text-gray-600 dark:text-gray-200">
              Adding to your collection
            </p>
          </div>
        </div>
      )}

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

      {!generatedRecipe && (
        <>
          {/* Quality Score Indicator */}
          <div className={`${qualityBgColor} border-2 ${qualityPercentage >= 80 ? 'border-green-300 dark:border-green-700' : qualityPercentage >= 60 ? 'border-yellow-300 dark:border-yellow-700' : 'border-orange-300 dark:border-orange-700'} rounded-lg p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">
                  {qualityPercentage >= 80 ? '🌟' : qualityPercentage >= 60 ? '⭐' : '💡'}
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Input Quality Score</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {qualityPercentage >= 80 ? 'Excellent! Ready for best results' : 
                     qualityPercentage >= 60 ? 'Good start! A few improvements will help' : 
                     'Add more details for better recipes'}
                  </p>
                </div>
              </div>
              <div className={`text-2xl font-bold ${qualityColor}`}>
                {qualityData.score}/{qualityData.maxScore}
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
                  <span>💡 Tips to improve your recipe ({qualityData.tips.length})</span>
                  <span className="transform transition-transform">{showTips ? '▼' : '▶'}</span>
                </button>
                {showTips && (
                  <ul className="mt-2 space-y-1">
                    {qualityData.tips.map((tip, index) => (
                      <li key={index} className="text-xs text-gray-600 dark:text-gray-300 flex items-start space-x-2">
                        <span className="text-purple-500 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Quick Examples Section - Collapsible */}
          <details className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <summary className="cursor-pointer font-semibold text-blue-900 dark:text-blue-200 flex items-center space-x-2 hover:text-blue-700 dark:hover:text-blue-100">
              <span>📚</span>
              <span>Quick Examples: What Makes a Great Recipe Request?</span>
            </summary>
            <div className="mt-4 space-y-4 text-sm">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-green-500">
                  <div className="flex items-start space-x-2 mb-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span className="font-bold text-gray-900 dark:text-white">Good Example</span>
                  </div>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-300 text-xs">
                    <li><strong>System:</strong> Microbiome</li>
                    <li><strong>Ingredients:</strong> Greek yogurt, kimchi, oats, blueberries</li>
                    <li><strong>Restrictions:</strong> Vegetarian</li>
                    <li><strong>Meal:</strong> Breakfast</li>
                    <li className="pt-1 text-green-600 dark:text-green-400"><strong>Result:</strong> "Probiotic Power Bowl"</li>
                  </ul>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-red-500">
                  <div className="flex items-start space-x-2 mb-2">
                    <span className="text-red-500 font-bold">✗</span>
                    <span className="font-bold text-gray-900 dark:text-white">Common Mistake</span>
                  </div>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-300 text-xs">
                    <li><strong>System:</strong> Any</li>
                    <li><strong>Ingredients:</strong> chicken</li>
                    <li><strong>Restrictions:</strong> None</li>
                    <li><strong>Meal:</strong> Any</li>
                    <li className="pt-1 text-red-600 dark:text-red-400"><strong>Result:</strong> Generic, wasted generation</li>
                  </ul>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-3 text-xs text-gray-700 dark:text-gray-200">
                <p className="font-semibold mb-1">💡 Pro Tips:</p>
                <ul className="space-y-1 pl-4 list-disc">
                  <li>Mix food types: 1 protein + 2 vegetables + 1 grain = variety</li>
                  <li>Be specific with restrictions: "low-sodium" works better than "healthy"</li>
                  <li>Choose a defense system that matches your health goals</li>
                  <li>3-5 ingredients work best for creative, balanced recipes</li>
                </ul>
              </div>
            </div>
          </details>
        </>
      )}

      {!generatedRecipe ? (
        /* Configuration Form */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-6 space-y-6">
          {/* Defense System Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
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
                    disabled={isGenerating || isSaving}
                    className={`relative p-4 border-2 rounded-lg text-left transition-all transform hover:scale-102 ${
                      isSelected
                        ? `${info.borderColor} ${info.bgColor} scale-105 shadow-lg ring-2 ring-offset-2`
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                    } ${isGenerating || isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">{info.icon}</span>
                      <span className={`font-bold text-sm ${isSelected ? info.textColor : 'text-gray-800 dark:text-gray-200'}`}>
                        {info.displayName}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{info.description}</p>
                    
                    {/* Active Glow Effect */}
                    {isSelected && (
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* System Info */}
          <div className={`p-4 rounded-lg ${systemInfo.bgColor} dark:opacity-90`}>
            <h4 className="font-bold text-sm mb-2 text-gray-900 dark:text-white">
              💡 Key Foods for {systemInfo.displayName}:
            </h4>
            <p className="text-xs text-gray-700 dark:text-gray-800 mb-3">
              Click any food to add it to your ingredients
            </p>
            <div className="flex flex-wrap gap-2">
              {systemInfo.keyFoods.map((food) => (
                <button
                  key={food}
                  type="button"
                  onClick={() => {
                    // Find first empty slot or add new
                    const emptyIndex = ingredients.findIndex(i => !i.trim());
                    if (emptyIndex >= 0) {
                      handleIngredientChange(emptyIndex, food);
                    } else {
                      setIngredients([...ingredients, food]);
                    }
                  }}
                  disabled={isGenerating || isSaving}
                  className="text-xs bg-white dark:bg-white/90 dark:text-gray-900 px-3 py-1.5 rounded-full hover:bg-green-50 dark:hover:bg-green-100 hover:ring-2 hover:ring-green-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
                  title={`Click to add ${food} to ingredients`}
                >
                  <Plus className="w-3 h-3" />
                  {food}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients Input */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Ingredients you'd like to use (optional)
              </label>
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                ingredients.filter(i => i.trim()).length >= 3 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : ingredients.filter(i => i.trim()).length > 0
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {ingredients.filter(i => i.trim()).length} ingredient{ingredients.filter(i => i.trim()).length !== 1 ? 's' : ''}
                {ingredients.filter(i => i.trim()).length < 3 && ' (add 3+ recommended)'}
              </span>
            </div>
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => handleIngredientChange(index, e.target.value)}
                    disabled={isGenerating || isSaving}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500"
                    placeholder="e.g., Salmon, Broccoli, Tomatoes"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      disabled={isGenerating || isSaving}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              
              {/* Add Ingredient Button - Enhanced Card Style */}
              <button
                type="button"
                onClick={handleAddIngredient}
                disabled={isGenerating || isSaving}
                className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group mt-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600 disabled:hover:bg-transparent"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                    <Plus className="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Add Another Ingredient
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">Optional: Specify more ingredients you want to use</span>
                </div>
              </button>
            </div>

            {/* Smart Ingredient Suggestions */}
            {ingredientSuggestions.length > 0 && ingredients.filter(i => i.trim()).length < 5 && (
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                    Smart Suggestions for {DEFENSE_SYSTEMS[defenseSystem].displayName}
                    {mealType !== 'any' && ` ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`}
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ingredientSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        // Find first empty slot or add new
                        const emptyIndex = ingredients.findIndex(i => !i.trim());
                        if (emptyIndex >= 0) {
                          handleIngredientChange(emptyIndex, suggestion);
                        } else {
                          setIngredients([...ingredients, suggestion]);
                        }
                      }}
                      disabled={isGenerating || isSaving}
                      className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-600 rounded-full text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {suggestion}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                  Click any suggestion to add it to your recipe
                </p>
              </div>
            )}
          </div>

          {/* Meal Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Meal Type
            </label>
            <div className="flex flex-wrap gap-2">
              {mealTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  disabled={isGenerating || isSaving}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    mealType === type
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Dietary Restrictions (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {commonRestrictions.map((restriction) => (
                <button
                  key={restriction}
                  type="button"
                  onClick={() => toggleRestriction(restriction)}
                  disabled={isGenerating || isSaving}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    dietaryRestrictions.includes(restriction)
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {restriction}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`border-2 rounded-lg p-4 ${
              error.includes('not counted against your limit') 
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 dark:border-amber-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-800'
            }`}>
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <p className={`font-medium mb-2 ${
                    error.includes('not counted against your limit')
                      ? 'text-amber-800 dark:text-amber-300'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {error}
                  </p>
                  {wasNotCounted && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                          ✓ Not Counted Against Your Limit
                        </span>
                        <span className="text-xs text-amber-700">
                          You can try again immediately
                        </span>
                      </div>
                      
                      {/* Retry Button */}
                          {lastRequest && (
                        <div className="space-y-2">
                          {/* Show what will be retried */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                            <p className="text-xs font-semibold text-amber-900 dark:text-amber-300 mb-2">Retry will use these settings:</p>
                            <div className="space-y-1 text-xs text-amber-800 dark:text-amber-300">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">Defense System:</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${DEFENSE_SYSTEMS[lastRequest.defenseSystem].bgColor} ${DEFENSE_SYSTEMS[lastRequest.defenseSystem].textColor}`}>
                                  {DEFENSE_SYSTEMS[lastRequest.defenseSystem].displayName}
                                </span>
                              </div>
                              {lastRequest.mealType !== 'any' && (
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">Meal Type:</span>
                                  <span className="capitalize">{lastRequest.mealType}</span>
                                </div>
                              )}
                              {lastRequest.ingredients.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">Ingredients:</span>
                                  <span>{lastRequest.ingredients.slice(0, 2).join(', ')}{lastRequest.ingredients.length > 2 ? `, +${lastRequest.ingredients.length - 2} more` : ''}</span>
                                </div>
                              )}
                              {lastRequest.dietaryRestrictions.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">Restrictions:</span>
                                  <span className="capitalize">{lastRequest.dietaryRestrictions.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={handleRetry}
                            disabled={isGenerating}
                            className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-bold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Retrying...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Retry with Same Settings</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
              🎉 Your AI-Generated Recipe
            </h3>
            <button
              type="button"
              onClick={() => setGeneratedRecipe(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            </button>
          </div>

          {/* Recipe Content */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white">
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
              <p className="text-gray-600 dark:text-gray-200">{generatedRecipe.description}</p>
            )}

            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-200">
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
              <h5 className="font-bold text-gray-800 dark:text-white mb-2">Ingredients</h5>
              <ul className="space-y-1">
                {generatedRecipe.ingredients.map((ing, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-200">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span className="font-medium">{ing.quantity} {ing.unit}</span>
                    <span>{ing.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-gray-800 dark:text-white mb-2">Instructions</h5>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg whitespace-pre-line text-sm text-gray-700 dark:text-gray-200">
                {generatedRecipe.instructions}
              </div>
            </div>

            {generatedRecipe.nutrients && Object.keys(generatedRecipe.nutrients).length > 0 && (
              <div>
                <h5 className="font-bold text-gray-800 dark:text-white mb-2">Key Nutrients</h5>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(generatedRecipe.nutrients).map(([nutrient, value]) => (
                    <span
                      key={nutrient}
                      className="bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {nutrient}: {value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setGeneratedRecipe(null)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
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
      <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">💡 How it works</h4>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
          <li>• AI analyzes the defense system and its key nutrients</li>
          <li>• Creates recipes using foods that support your health goals</li>
          <li>• Considers your ingredients and dietary restrictions</li>
          <li>• Generates complete recipes with instructions and nutrition info</li>
        </ul>
      </div>

      {/* Fairness Guarantee */}
      <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="font-bold text-green-900 dark:text-green-300 mb-2">✓ Fair Usage Guarantee</h4>
        <p className="text-sm text-green-800 dark:text-green-300">
          If the AI generates an incomplete or invalid recipe, <strong>it won't count against your monthly limit</strong>. 
          Only successfully generated, quality-validated recipes are counted. You can try again immediately at no cost.
        </p>
      </div>
    </div>
  );
}