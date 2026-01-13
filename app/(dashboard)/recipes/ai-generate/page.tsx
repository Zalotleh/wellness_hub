'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AIRecipeGenerator from '@/components/recipes/AIRecipeGenerator';
import { RecipeSuccessModal } from '@/components/recipes/RecipeSuccessModal';
import { RecipeFormData } from '@/types';
import { recipeSchema } from '@/lib/validations';
import { Sparkles, ArrowLeft, Target } from 'lucide-react';
import Link from 'next/link';
import { DefenseSystem } from '@/types';
// Using window alerts for notifications

export default function AIGeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);
  const [savedRecipeName, setSavedRecipeName] = useState<string>('');
  const [savedRecipeMealType, setSavedRecipeMealType] = useState<string | null>(null);
  const [fromRecommendation, setFromRecommendation] = useState(false);
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const [initialParams, setInitialParams] = useState<any>(null);

  useEffect(() => {
    console.log('🔷 AI-GENERATE PAGE - useEffect running');
    console.log('🔷 searchParams:', Object.fromEntries(searchParams.entries()));
    
    // Parse URL params from recommendation
    const from = searchParams.get('from');
    const recId = searchParams.get('recId');
    const targetSystem = searchParams.get('targetSystem');
    const dietaryRestrictions = searchParams.get('dietaryRestrictions');
    const preferredMealTime = searchParams.get('preferredMealTime');
    const avoidIngredients = searchParams.get('avoidIngredients');

    console.log('🔷 Parsed params:', { from, recId, targetSystem, dietaryRestrictions, preferredMealTime, avoidIngredients });

    if ((from === 'recommendation' || from === 'variety' || from === 'missed-meal') && recId) {
      console.log('🔷 ✅ This is from a recommendation!');
      setFromRecommendation(true);
      setRecommendationId(recId);

      // Build initial params for generator
      const params: any = { from };
      
      if (targetSystem) {
        params.targetSystem = targetSystem as DefenseSystem;
        console.log('🔷 ✅ Setting targetSystem in params:', targetSystem);
      }
      if (dietaryRestrictions) {
        try {
          params.dietaryRestrictions = JSON.parse(dietaryRestrictions);
        } catch {
          params.dietaryRestrictions = dietaryRestrictions.split(',');
        }
        console.log('🔷 Setting dietaryRestrictions in params:', params.dietaryRestrictions);
      }
      if (preferredMealTime) {
        params.preferredMealTime = preferredMealTime;
        console.log('🔷 Setting preferredMealTime in params:', preferredMealTime);
      }
      if (avoidIngredients) {
        try {
          params.avoidIngredients = JSON.parse(avoidIngredients);
        } catch {
          params.avoidIngredients = avoidIngredients.split(',');
        }
        console.log('🔷 Setting avoidIngredients in params:', params.avoidIngredients);
      }

      console.log('🔷 Final initialParams being set:', params);
      setInitialParams(params);
    } else {
      console.log('🔷 ❌ Not from recommendation or missing recId');
    }
  }, [searchParams]);

  const handleSaveRecipe = async (recipe: RecipeFormData) => {
    console.log('handleSaveRecipe called with:', recipe);
    try {
      // API-level validation using Zod schema
      console.log('Attempting Zod validation');
      const validatedData = recipeSchema.parse(recipe);
      console.log('Validation successful:', validatedData);

      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to save recipe');
      }

      const { data: newRecipe } = await response.json();
      console.log('Recipe saved successfully:', newRecipe);
      setSavedRecipeId(newRecipe.id);
      setSavedRecipeName(newRecipe.title || newRecipe.name || 'Your Recipe');
      setSavedRecipeMealType(newRecipe.mealType || null);
      console.log('✅ Saved recipe mealType:', newRecipe.mealType);

      // Update recommendation status to ACTED_ON (user created recipe)
      if (fromRecommendation && recommendationId) {
        try {
          await fetch(`/api/recommendations/${recommendationId}/update-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'ACTED_ON',
              linkedRecipeId: newRecipe.id,
            }),
          });
        } catch (err) {
          console.error('Failed to update recommendation status:', err);
        }
      }

      // Show success modal instead of redirecting
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Save recipe error:', err);
      if (err.name === 'ZodError') {
        // Transform Zod validation errors into user-friendly messages
        const firstError = err.errors[0];
        const errorMessage = firstError?.message || 'Please check all required recipe fields';
        console.error('Validation error:', errorMessage, 'Path:', firstError?.path);
        throw new Error(errorMessage);
      }
      throw err;
    }
  };

  const handleCreateShoppingList = async () => {
    if (!savedRecipeId) return;
    
    try {
      const response = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: savedRecipeId,
          name: `Shopping list for ${savedRecipeName}`,
        }),
      });

      if (!response.ok) throw new Error('Failed to create shopping list');

      const { data: shoppingList } = await response.json();

      // Update recommendation to SHOPPED status
      if (recommendationId) {
        await fetch(`/api/recommendations/${recommendationId}/update-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'SHOPPED',
            linkedShoppingListId: shoppingList.id,
          }),
        });
      }

      router.push(`/shopping-lists/${shoppingList.id}`);
    } catch (error) {
      console.error('Error creating shopping list:', error);
      alert('Failed to create shopping list');
    }
  };

  const handleLogToMealPlanner = async () => {
    if (!savedRecipeId) {
      console.error('No savedRecipeId available');
      return;
    }

    try {
      console.log('Logging recipe to meal planner:', savedRecipeId);
      
      // Determine meal time to use
      // Priority: 1) Recipe's mealType, 2) Default to LUNCH
      let mealTimeToUse = 'LUNCH'; // Default fallback
      
      if (savedRecipeMealType) {
        // Convert mealType to uppercase enum (e.g., 'breakfast' -> 'BREAKFAST')
        mealTimeToUse = savedRecipeMealType.toUpperCase();
        console.log('✅ Using recipe mealType:', mealTimeToUse);
      } else {
        console.log('⚠️ No mealType in recipe, defaulting to LUNCH');
      }
      
      // Log the recipe to today's progress
      const response = await fetch(`/api/recipes/${savedRecipeId}/log-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealTime: mealTimeToUse,
          date: new Date().toISOString(),
        }),
      });

      console.log('Log meal response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Log meal error response:', errorData);
        throw new Error(errorData.error || 'Failed to log meal');
      }

      const result = await response.json();
      console.log('Log meal success:', result);

      // Refresh and navigate to progress page with timestamp to force data refetch
      router.refresh();
      router.push(`/progress?updated=${Date.now()}`);
    } catch (error) {
      console.error('Error logging meal:', error);
      alert(`Failed to log meal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleViewRecipe = () => {
    if (savedRecipeId) {
      router.push(`/recipes/${savedRecipeId}`);
    }
  };

  return (
    <>
      {/* Success Modal */}
      {savedRecipeId && (
        <RecipeSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          recipeId={savedRecipeId}
          recipeName={savedRecipeName}
          onCreateShoppingList={handleCreateShoppingList}
          onLogToMealPlanner={handleLogToMealPlanner}
          onViewRecipe={handleViewRecipe}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/recipes"
              className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4progress" />
              <span>Back to Recipes</span>
            </Link>

            {/* Recommendation Indicator */}
            {fromRecommendation && (
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <div className="flex-1">
                    <p className="font-semibold text-purple-900 dark:text-purple-100">
                      Smart Recommendation
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      This recipe will help strengthen your wellness goals
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                  AI Recipe Generator
                </h1>
                <p className="text-gray-600 dark:text-gray-200">
                  Let artificial intelligence create personalized recipes for your health goals
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Generator Component */}
        <AIRecipeGenerator 
          onSaveRecipe={handleSaveRecipe}
          initialParams={initialParams}
          fromRecommendation={fromRecommendation}
        />

        {/* Features Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-6">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">Defense System Focus</h3>
            <p className="text-sm text-gray-600 dark:text-gray-200">
              Recipes tailored to support specific health defense systems
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-6">
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🧪</span>
            </div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">Nutrient-Optimized</h3>
            <p className="text-sm text-gray-600 dark:text-gray-200">
              Every recipe includes key nutrients and their health benefits
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-6">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">Personalized</h3>
            <p className="text-sm text-gray-600 dark:text-gray-200">
              Customized based on your ingredients and dietary preferences
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-1">
                How does the AI generate recipes?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-200">
                Our AI is trained on nutritional science and the 5x5x5 system. It analyzes 
                defense system requirements, key nutrients, and your preferences to create 
                balanced, health-focused recipes.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-1">
                Are the recipes nutritionally accurate?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-200">
                Yes! All recipes are based on Dr. William Li's research and include foods 
                scientifically shown to support each defense system.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-1">
                Can I customize the generated recipes?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-200">
                Absolutely! After saving a recipe, you can edit it to adjust ingredients, 
                instructions, or any other details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}