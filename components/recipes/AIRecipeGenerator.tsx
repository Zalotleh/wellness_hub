'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DefenseSystem, RecipeFormData } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { Sparkles, Loader2, Plus, X, Wand2, Info, ChevronDown } from 'lucide-react';
import { getMeasurementPreference } from '@/lib/shopping/measurement-system';
import { getSmartSuggestions } from '@/lib/suggestions/ingredient-suggestions';
import {
  trackGeneration,
  shouldShowOnboarding,
  shouldShowEncouragement,
} from '@/lib/tracking/generation-stats';
import AIGeneratorOnboarding from '@/components/onboarding/AIGeneratorOnboarding';

interface GeneratedIngredient {
  name: string;
  amount?: string;
  quantity?: string;
  unit?: string;
}

interface AIRecipeGeneratorProps {
  onRecipeGenerated?: (recipe: RecipeFormData) => void;
  onSaveRecipe?: (recipe: RecipeFormData) => Promise<void>;
  initialParams?: {
    from?: string;
    targetSystem?: DefenseSystem;
    dietaryRestrictions?: string[];
    preferredMealTime?: string;
    avoidIngredients?: string[];
  };
  fromRecommendation?: boolean;
}

export default function AIRecipeGenerator({
  onRecipeGenerated,
  onSaveRecipe,
  initialParams,
  fromRecommendation = false,
}: AIRecipeGeneratorProps) {
  const [defenseSystems, setDefenseSystems] = useState<DefenseSystem[]>(
    initialParams?.targetSystem ? [initialParams.targetSystem] : [DefenseSystem.ANGIOGENESIS]
  );
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(
    initialParams?.dietaryRestrictions || []
  );
  const preferencesLoadedRef = useRef(false);
  const [mealType, setMealType] = useState(
    initialParams?.preferredMealTime?.toLowerCase() || 'breakfast'
  );
  const [measurementSystem, setMeasurementSystem] = useState<'imperial' | 'metric'>('imperial');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeFormData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<{
    defenseSystems: DefenseSystem[];
    ingredients: string[];
    dietaryRestrictions: string[];
    mealType: string;
    measurementSystem: 'imperial' | 'metric';
  } | null>(null);
  const [wasNotCounted, setWasNotCounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [encouragementMsg, setEncouragementMsg] = useState<string | null>(null);
  const [ingredientSuggestions, setIngredientSuggestions] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [expandedSystems, setExpandedSystems] = useState<Record<string, boolean>>({});

  // Quality Score Calculator
  const calculateQualityScore = () => {
    const validIngredients = ingredients.filter((ing) => ing.trim() !== '');
    let score = 0;
    const tips: string[] = [];

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
  const qualityBarColor = 
    qualityPercentage >= 80 ? 'bg-green-500' :
    qualityPercentage >= 60 ? 'bg-yellow-500' :
    'bg-orange-500';

  // Update meal type when initialParams changes (for missed-meal recommendations)
  useEffect(() => {
    if (initialParams?.preferredMealTime) {
      const mealTimeLower = initialParams.preferredMealTime.toLowerCase();
      console.log('🎯 Setting meal type from recommendation:', mealTimeLower);
      setMealType(mealTimeLower);
    }
  }, [initialParams?.preferredMealTime]);

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
        console.log('🔍 AIRecipeGenerator - preferencesLoaded:', preferencesLoadedRef.current);
        
        // Set measurement system
        setMeasurementSystem(measurementPref.system);

        // Defense system from recommendation ALWAYS wins – checked BEFORE the
        // preferencesLoaded guard so it applies even on re-runs of this effect.
        if (initialParams?.targetSystem) {
          console.log('🎯 Using recommended defense system (overriding user settings):', initialParams.targetSystem);
          setDefenseSystems([initialParams.targetSystem]);
        }

        // Load user preferences only on first run (or when no override exists)
        if (userPrefs?.preferences && !preferencesLoadedRef.current) {
          console.log('✅ Loading preferences from API...');
          
          // Dietary restrictions: Only set if not provided via initialParams
          if (!initialParams?.dietaryRestrictions || initialParams.dietaryRestrictions.length === 0) {
            if (userPrefs.preferences.defaultDietaryRestrictions?.length > 0) {
              console.log('✅ Setting dietary restrictions:', userPrefs.preferences.defaultDietaryRestrictions);
              setDietaryRestrictions(userPrefs.preferences.defaultDietaryRestrictions);
            }
          }
          
          // Defense Systems from user preferences (only when no recommendation override)
          if (!initialParams?.targetSystem && userPrefs.preferences.defaultFocusSystems?.length > 0) {
            console.log('✅ Setting defense systems from user preferences:', userPrefs.preferences.defaultFocusSystems);
            setDefenseSystems(userPrefs.preferences.defaultFocusSystems as DefenseSystem[]);
          }
          
          preferencesLoadedRef.current = true;
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
      defenseSystems[0],
      mealType,
      dietaryRestrictions,
      validIngredients
    );
    setIngredientSuggestions(suggestions.slice(0, 8)); // Limit to 8 suggestions
  }, [defenseSystems, mealType, dietaryRestrictions, ingredients]);

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
  const commonRestrictions = [
    'vegetarian',
    'vegan',
    'gluten-free',
    'dairy-free',
    'nut-free',
    'low-carb',
  ];

  const handleAddIngredientFromInput = () => {
    const val = ingredientInput.trim();
    if (!val) return;
    if (!ingredients.some(i => i.toLowerCase() === val.toLowerCase())) {
      setIngredients([...ingredients, val]);
    }
    setIngredientInput('');
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const toggleRestriction = (restriction: string) => {
    // Normalize to lowercase for comparison
    const normalizedRestriction = restriction.toLowerCase();
    const hasRestriction = dietaryRestrictions.some(r => r.toLowerCase() === normalizedRestriction);
    
    if (hasRestriction) {
      setDietaryRestrictions(dietaryRestrictions.filter((r) => r.toLowerCase() !== normalizedRestriction));
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
        defenseSystems,
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
        hasDefenseSystems: !!recipe.defenseSystems && recipe.defenseSystems.length > 0,
      });
      
      // Ensure the recipe has required fields
      // Note: If validation passed, title should be good. Only add fallback for display safety.
      const validatedRecipe = {
        ...recipe,
        title: recipe.title || 'Recipe', // Minimal fallback (shouldn't happen after validation)
        description: recipe.description || 'A delicious and healthy recipe.',
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        instructions: recipe.instructions || 'Instructions not available.',
        defenseSystems: recipe.defenseSystems || defenseSystems,
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
    } catch (err: unknown) {
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
      
      setError(err instanceof Error ? err.message : 'Failed to generate recipe');
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
        defenseSystems: recipe.defenseSystems || lastRequest.defenseSystems,
      };
      
      console.log('✅ Validated recipe:', validatedRecipe);
      setGeneratedRecipe(validatedRecipe);

      if (onRecipeGenerated) {
        onRecipeGenerated(validatedRecipe);
      }
    } catch (err: unknown) {
      console.error('❌ Error in handleRetry:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate recipe');
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
      recipeTitle = defenseSystems.length > 1 
        ? `Multi-System Superfood Recipe`
        : `${DEFENSE_SYSTEMS[defenseSystems[0]].displayName} Recipe`;
    }

    const recipeData: RecipeFormData = {
      title: recipeTitle,
      ingredients: Array.isArray(generatedRecipe.ingredients) 
        ? generatedRecipe.ingredients.map((ing: GeneratedIngredient) => {
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
      defenseSystems: generatedRecipe.defenseSystems || defenseSystems,
      // Optional fields - truncate description to max 500 chars
      description: generatedRecipe.description?.substring(0, 500),
      prepTime: generatedRecipe.prepTime,
      cookTime: generatedRecipe.cookTime,
      servings: typeof generatedRecipe.servings === 'number' ? generatedRecipe.servings : undefined,
      mealType: mealType,
      dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : [],
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
      setIngredients([]);
      setIngredientInput('');
      setDietaryRestrictions([]);
      setError(null); // Clear any previous errors on success
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOnboardingComplete = (selectedSystem?: DefenseSystem) => {
    if (selectedSystem) {
      setDefenseSystems([selectedSystem]);
    }
    setShowOnboarding(false);
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

      {/* Context Banner for Recommendations */}
      {initialParams?.from === 'variety' && (
        <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-4 rounded-lg shadow-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Let&apos;s Add More Variety! 🌈</p>
              <p className="text-sm text-white/90">
                Try new ingredients you haven&apos;t used before. The AI will suggest creative recipes with diverse foods.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {initialParams?.from === 'missed-meal' && initialParams?.preferredMealTime && (
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-4 rounded-lg shadow-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Plan Your {initialParams.preferredMealTime}! 🍳</p>
              <p className="text-sm text-white/90">
                Create a healthy {initialParams.preferredMealTime.toLowerCase()} recipe to keep your nutrition on track.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay - Covers entire component during generation */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:border dark:border-gray-700 p-8 max-w-md mx-4 text-center">
            <div className="relative">
              {/* Animated gradient circle */}
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-teal-500 to-green-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-green-500 animate-pulse" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Generating Your Recipe
              </h3>
              <p className="text-gray-600 dark:text-gray-200 mb-4">
                AI is crafting a personalized {defenseSystems.length > 1 ? `multi-system superfood (${defenseSystems.map(s => DEFENSE_SYSTEMS[s].displayName).join(' + ')})` : DEFENSE_SYSTEMS[defenseSystems[0]].displayName} recipe...
              </p>
              
              {/* Progress indicators */}
              <div className="space-y-2 text-left">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-200">Analyzing defense system requirements</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse delay-100"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-200">Selecting optimal ingredients</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-200"></div>
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
              <div className="absolute inset-0 border-4 border-green-200 dark:border-green-900 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
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

      {!generatedRecipe && (
        /* Slim quality score bar */
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg flex-shrink-0">
              {qualityPercentage >= 80 ? '🌟' : qualityPercentage >= 60 ? '⭐' : '💡'}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                {qualityPercentage >= 80
                  ? 'Ready to generate a great recipe!'
                  : qualityPercentage >= 60
                  ? 'Add a few more details for better results'
                  : 'Add ingredients or a meal type to improve quality'}
              </p>
              {qualityData.tips.length > 0 && qualityData.score < qualityData.maxScore && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{qualityData.tips[0]}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${qualityBarColor} rounded-full transition-all duration-500`}
                style={{ width: `${qualityPercentage}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${qualityColor}`}>{qualityData.score}/{qualityData.maxScore}</span>
          </div>
        </div>
      )}

      {!generatedRecipe ? (
        /* Configuration Form */
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 sm:p-8 space-y-7">
          {/* Defense System Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Which defense systems would you like to support? {fromRecommendation && <span className="text-xs text-green-600 dark:text-green-400">(Pre-selected from recommendation, add more if you&apos;d like)</span>}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.values(DefenseSystem).map((system) => {
                const info = DEFENSE_SYSTEMS[system];
                const isSelected = defenseSystems.includes(system);

                return (
                  <button
                    key={system}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        // Prevent deselecting if it's the only one
                        if (defenseSystems.length > 1) {
                          setDefenseSystems(defenseSystems.filter(s => s !== system));
                        }
                      } else {
                        setDefenseSystems([...defenseSystems, system]);
                      }
                    }}
                    disabled={isGenerating || isSaving}
                    className={`relative p-4 border-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-green-500 to-teal-500 border-green-400 shadow-lg ring-2 ring-green-400'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                    } ${isGenerating || isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">{info.icon}</span>
                      <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                        {info.displayName}
                      </span>
                    </div>
                    <p className={`text-xs line-clamp-2 ${isSelected ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>{info.description}</p>
                  </button>
                );
              })}
            </div>
            {defenseSystems.length > 1 && (
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                💡 Selected {defenseSystems.length} systems - AI will create a multi-system superfood recipe!
              </p>
            )}
          </div>

          {/* Meal Type & Dietary Restrictions */}
          <div className="space-y-6">
            {/* Meal Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                Meal Type *
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
                        ? 'bg-green-500 text-white'
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
                      dietaryRestrictions.some(r => r.toLowerCase() === restriction.toLowerCase())
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {restriction}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredient Selection Instructions */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-1">
                  Choose Your Ingredients or Let AI Surprise You! 🎨
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Click the sections below to explore recommended foods for each defense system and add them to your recipe, or skip this step and trust our AI&apos;s creativity to craft something amazing for you!
                </p>
              </div>
            </div>
          </div>

          {/* System Info - Collapsible */}
          {defenseSystems.map((system) => {
            const systemInfo = DEFENSE_SYSTEMS[system];
            const isExpanded = expandedSystems[system] || false;
            const sortedFoods = [...systemInfo.keyFoods].sort((a, b) => a.localeCompare(b));
            
            return (
              <div key={system} className={`border-2 rounded-lg overflow-hidden ${systemInfo.borderColor} dark:opacity-95`}>
                <button
                  type="button"
                  onClick={() => setExpandedSystems({ ...expandedSystems, [system]: !isExpanded })}
                  className={`w-full p-4 ${systemInfo.bgColor} flex items-center justify-between transition-all hover:opacity-90`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{systemInfo.icon}</span>
                    <div className="text-left">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                        Key Foods for {systemInfo.displayName}
                      </h4>
                      <p className="text-xs text-gray-700 dark:text-gray-800">
                        {sortedFoods.length} ingredients available
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-700 dark:text-gray-800 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {isExpanded && (
                  <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Click any food below to add it to your ingredients list
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sortedFoods.map((food) => {
                        const isSelected = ingredients.some(ing => ing.trim().toLowerCase() === food.toLowerCase());
                        
                        return (
                          <div key={food} className="relative group">
                            <button
                              type="button"
                              onClick={() => {
                                if (!isSelected) {
                                  setIngredients([...ingredients, food]);
                                }
                              }}
                              disabled={isGenerating || isSaving}
                              className={`text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium ${
                                isSelected
                                  ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white ring-2 ring-green-400 shadow-md'
                                  : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-700 text-gray-900 dark:text-gray-100 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-800/40 dark:hover:to-emerald-800/40 hover:ring-2 hover:ring-green-500'
                              }`}
                              title={isSelected ? `${food} is in your ingredients` : `Click to add ${food} to ingredients`}
                            >
                              {!isSelected && <Plus className="w-3 h-3" />}
                              {food}
                            </button>
                            
                            {/* Remove button for selected items */}
                            {isSelected && (
                              <button
                                type="button"
                                onClick={() => {
                                  const index = ingredients.findIndex(ing => ing.trim().toLowerCase() === food.toLowerCase());
                                  if (index >= 0) {
                                    setIngredients(ingredients.filter((_, i) => i !== index));
                                  }
                                }}
                                disabled={isGenerating || isSaving}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                title={`Remove ${food} from ingredients`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Ingredients Input */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Ingredients you&apos;d like to use (optional)
              </label>
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                ingredients.length >= 3
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : ingredients.length > 0
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}
                {ingredients.length < 3 && ' (add 3+ recommended)'}
              </span>
            </div>

            {/* Chip list of confirmed ingredients */}
            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm font-medium rounded-full border border-green-200 dark:border-green-700"
                  >
                    {ingredient}
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      disabled={isGenerating || isSaving}
                      className="ml-0.5 w-4 h-4 rounded-full hover:bg-green-200 dark:hover:bg-green-700 flex items-center justify-center transition-colors disabled:opacity-50"
                      aria-label={`Remove ${ingredient}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Single text input to add a new ingredient */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddIngredientFromInput(); }
                }}
                disabled={isGenerating || isSaving}
                placeholder="e.g. Salmon — press Enter or click +"
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-green-500 focus:outline-none text-sm dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
              <button
                type="button"
                onClick={handleAddIngredientFromInput}
                disabled={!ingredientInput.trim() || isGenerating || isSaving}
                className="p-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 text-white disabled:text-gray-400 rounded-xl transition-colors disabled:cursor-not-allowed"
                aria-label="Add ingredient"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Smart Ingredient Suggestions */}
            {ingredientSuggestions.length > 0 && ingredients.length < 5 && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Wand2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-200">
                    Smart Suggestions for {defenseSystems.length > 1 ? 'Multi-System Recipe' : DEFENSE_SYSTEMS[defenseSystems[0]].displayName}
                    {mealType !== 'any' && ` ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`}
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ingredientSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (!ingredients.some(i => i.toLowerCase() === suggestion.toLowerCase())) {
                          setIngredients([...ingredients, suggestion]);
                        }
                      }}
                      disabled={isGenerating || isSaving}
                      className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-green-300 dark:border-green-600 rounded-full text-sm text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {suggestion}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  Click any suggestion to add it to your recipe
                </p>
              </div>
            )}
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
                                <span className="font-medium">Defense Systems:</span>
                                <div className="flex flex-wrap gap-1">
                                  {lastRequest.defenseSystems.map(system => (
                                    <span key={system} className={`px-2 py-0.5 rounded-full text-xs ${DEFENSE_SYSTEMS[system].bgColor} ${DEFENSE_SYSTEMS[system].textColor}`}>
                                      {DEFENSE_SYSTEMS[system].displayName}
                                    </span>
                                  ))}
                                </div>
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
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-xl font-bold hover:from-green-700 hover:to-teal-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg shadow-green-500/20 text-base"
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
        /* ── Generated Recipe Display ────────────────────────────────── */
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          {/* Gradient hero header */}
          <div className="relative bg-gradient-to-br from-green-600 via-teal-600 to-emerald-600 px-6 py-8 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-28 translate-x-28 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full translate-y-20 -translate-x-20 pointer-events-none" />

            {/* Close / try again */}
            <button
              type="button"
              onClick={() => setGeneratedRecipe(null)}
              title="Try another recipe"
              className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/25 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white/80" />
            </button>

            {/* Generated badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              AI Generated
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 leading-tight">
              {generatedRecipe.title}
            </h3>

            {/* Defense system badges */}
            {(() => {
              const recipeSystems: DefenseSystem[] = generatedRecipe.defenseSystems || defenseSystems;
              return recipeSystems?.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {recipeSystems.map((system) => {
                    const si = DEFENSE_SYSTEMS[system];
                    return si ? (
                      <span key={system} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-semibold">
                        <span>{si.icon}</span>
                        {si.displayName}
                      </span>
                    ) : null;
                  })}
                </div>
              ) : null;
            })()}

            {/* Meta row */}
            <div className="flex items-center flex-wrap gap-4 text-sm text-white/75">
              {generatedRecipe.prepTime && (
                <span>⏱️ <strong className="text-white">{generatedRecipe.prepTime}</strong> prep</span>
              )}
              {generatedRecipe.cookTime && (
                <span>🔥 <strong className="text-white">{generatedRecipe.cookTime}</strong> cook</span>
              )}
              {generatedRecipe.servings && (
                <span>🍽️ <strong className="text-white">{generatedRecipe.servings}</strong> servings</span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {generatedRecipe.description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-l-2 border-green-300 dark:border-green-600 pl-4">
                {generatedRecipe.description}
              </p>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Ingredients */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                  Ingredients
                </h5>
                <ul className="space-y-2">
                  {generatedRecipe.ingredients.map((ing: GeneratedIngredient, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-200">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      <span>
                        {ing.quantity && ing.unit ? (
                          <>
                            <span className="font-semibold text-gray-900 dark:text-white">{ing.quantity} {ing.unit}</span>
                            {' '}{ing.name}
                          </>
                        ) : (
                          ing.name
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Nutrients */}
              {generatedRecipe.nutrients && Object.keys(generatedRecipe.nutrients).length > 0 && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    Key Nutrients
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(generatedRecipe.nutrients).map(([nutrient, value]) => (
                      <span
                        key={nutrient}
                        className="px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-semibold"
                      >
                        {nutrient}: {value as string}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                Instructions
              </h5>
              <ol className="space-y-3">
                {String(generatedRecipe.instructions)
                  .split(/\n+/)
                  .filter((line: string) => line.trim())
                  .map((step: string, i: number) => {
                    const cleaned = step.replace(/^(step\s*\d+[:\.\s]+|\d+[:\.\s]+)/i, '').trim();
                    return (
                      <li key={i} className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-xs font-bold text-green-600 dark:text-green-400 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{cleaned}</p>
                      </li>
                    );
                  })}
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-5 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setGeneratedRecipe(null)}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Try Again
              </button>
              {onSaveRecipe && (
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl transition-all font-semibold text-sm shadow-md shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Save to My Recipes
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fair usage note — minimal, only shown before generation */}
      {!generatedRecipe && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 pb-2">
          ✓ Incomplete generations are <strong>never</strong> counted against your monthly limit.
        </p>
      )}
    </div>
  );
}