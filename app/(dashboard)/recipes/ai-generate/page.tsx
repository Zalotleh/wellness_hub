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

interface AIGeneratorParams {
  from: string;
  targetSystem?: DefenseSystem;
  dietaryRestrictions?: string[];
  preferredMealTime?: string;
  avoidIngredients?: string[];
}

interface MealPlannerContext {
  planId: string;
  day: string;
  slot: string;
  date: string;
  week: number;
}

// Slot → FoodConsumption mealTime enum mapping
const SLOT_TO_MEAL_TIME: Record<string, string> = {
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
  snack: 'SNACK',
  'morning-snack': 'MORNING_SNACK',
  'afternoon-snack': 'AFTERNOON_SNACK',
  'evening-snack': 'SNACK',
};

export default function AIGeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);
  const [savedRecipeName, setSavedRecipeName] = useState<string>('');
  const [savedRecipeMealType, setSavedRecipeMealType] = useState<string | null>(null);
  const [fromRecommendation, setFromRecommendation] = useState(false);
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const [initialParams, setInitialParams] = useState<AIGeneratorParams | null>(null);
  // Meal-planner context — set when the user arrived via the Add Meal Choice Dialog
  const [mealPlannerContext, setMealPlannerContext] = useState<MealPlannerContext | null>(null);

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

    // Meal-planner context
    if (from === 'meal-planner') {
      const planId = searchParams.get('planId') || '';
      const day = searchParams.get('day') || '';
      const slot = searchParams.get('slot') || '';
      const date = searchParams.get('date') || '';
      const week = Number(searchParams.get('week') || '1');
      if (planId && day && slot) {
        setMealPlannerContext({ planId, day, slot, date, week });
      }
    }

    console.log('🔷 Parsed params:', { from, recId, targetSystem, dietaryRestrictions, preferredMealTime, avoidIngredients });

    // Recognised source values – some (e.g. meal-timeline) have no recId
    const knownSource = from === 'recommendation' || from === 'variety' ||
      from === 'missed-meal' || from === 'meal-timeline';
    const hasAnyParam = !!(targetSystem || preferredMealTime || avoidIngredients || dietaryRestrictions);

    if (knownSource || hasAnyParam) {
      // Only wire up recommendation-status tracking when we have an actual recId
      if (recId) {
        console.log('🔷 ✅ This is from a recommendation! recId:', recId);
        setFromRecommendation(true);
        setRecommendationId(recId);
      } else {
        console.log('🔷 ✅ Direct navigation with params (no recommendation tracking)');
      }

      // Build initial params for generator
      const params: AIGeneratorParams = { from: from || 'direct' };
      
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
      console.log('🔷 ❌ No recognised source or params – using user defaults');
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

      // Auto-link to the meal plan slot and log to dashboard when coming from the meal planner
      if (mealPlannerContext) {
        try {
          // Log to FoodConsumption so it shows in both the dashboard Daily view
          // and the meal planner day view (as a 'Logged from dashboard' card).
          // We do NOT create a separate Meal record in the plan — that would produce
          // a duplicate 'Generate Recipe' card alongside the logged card.
          const mealTime = SLOT_TO_MEAL_TIME[mealPlannerContext.slot] || 'LUNCH';
          await fetch(`/api/recipes/${newRecipe.id}/log-meal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mealTime,
              date: mealPlannerContext.date
                ? new Date(mealPlannerContext.date).toISOString()
                : new Date().toISOString(),
            }),
          });
        } catch (err) {
          console.error('Failed to log recipe to meal plan:', err);
          // Non-fatal — recipe was still created
        }
      }

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
    } catch (err: unknown) {
      console.error('Save recipe error:', err);
      const e = err as { name?: string; errors?: { message?: string; path?: unknown[] }[] };
      if (e.name === 'ZodError') {
        // Transform Zod validation errors into user-friendly messages
        const firstError = e.errors?.[0];
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
    // When coming from the meal planner, linking was already done — navigate back to the specific day view
    if (mealPlannerContext) {
      router.push(`/meal-planner/${mealPlannerContext.planId}?day=${mealPlannerContext.day}`);
      return;
    }

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

      // Refresh and navigate to dashboard page with timestamp to force data refetch
      router.refresh();
      router.push(`/dashboard?updated=${Date.now()}`);
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
          logToMealPlannerLabel={mealPlannerContext ? 'Back to Day View' : 'Log This Meal Now'}
          logToMealPlannerDescription={
            mealPlannerContext
              ? `Return to ${mealPlannerContext.day.charAt(0).toUpperCase() + mealPlannerContext.day.slice(1)}'s meal plan`
              : 'Track it in your progress today'
          }
          onViewRecipe={handleViewRecipe}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        {/* Sticky page header */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/recipes"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Recipes</span>
              </Link>
              <span className="text-gray-300 dark:text-gray-600">/</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">AI Generator</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-pink-500 rounded-md flex items-center justify-center shadow">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden sm:block">
                AI Recipe Generator
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Hero header */}
          <div className="mb-8 text-center">
            {fromRecommendation ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-700 rounded-full text-sm font-medium text-purple-700 dark:text-purple-300 mb-4">
                <Target className="w-4 h-4" />
                Smart Recommendation — this recipe targets your wellness goals
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 rounded-full text-sm font-medium text-violet-700 dark:text-violet-300 mb-4">
                <Sparkles className="w-4 h-4" />
                Powered by AI
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
              Create Your Perfect Recipe
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-base">
              Choose a defense system, add optional ingredients, and let AI craft a
              personalized, science-backed recipe just for you.
            </p>
          </div>

          {/* Generator Component */}
          <AIRecipeGenerator
            onSaveRecipe={handleSaveRecipe}
            initialParams={initialParams ?? undefined}
            fromRecommendation={fromRecommendation}
          />
        </div>
      </div>
    </>
  );
}