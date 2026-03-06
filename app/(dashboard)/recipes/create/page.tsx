'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RecipeForm from '@/components/recipes/RecipeForm';
import { RecipeFormData } from '@/types';
import { ChefHat, ArrowLeft, CheckCircle2, PenLine, CalendarDays } from 'lucide-react';
import Link from 'next/link';

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

function CreateRecipePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdRecipeId, setCreatedRecipeId] = useState<string | null>(null);

  // Meal-planner context (if user came from the Add Meal dialog)
  const fromMealPlanner = searchParams.get('from') === 'meal-planner';
  const mealPlannerPlanId = searchParams.get('planId') || '';
  const mealPlannerDay = searchParams.get('day') || '';
  const mealPlannerSlot = searchParams.get('slot') || '';
  const mealPlannerDate = searchParams.get('date') || '';
  const mealPlannerWeek = Number(searchParams.get('week') || '1');

  const handleSubmit = async (data: RecipeFormData) => {
    const response = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create recipe');
    }

    const { data: newRecipe } = await response.json();
    setCreatedRecipeId(newRecipe.id);

    // If coming from the meal planner, link the recipe to the requested slot
    if (fromMealPlanner && mealPlannerPlanId && mealPlannerDay && mealPlannerSlot) {
      try {
        // Log to FoodConsumption so it shows in both the dashboard Daily view
        // and the meal planner day view (as a 'Logged from dashboard' card).
        // We do NOT create a separate Meal record in the plan — that would produce
        // a duplicate 'Generate Recipe' card alongside the logged card.
        const mealTime = SLOT_TO_MEAL_TIME[mealPlannerSlot] || 'LUNCH';
        await fetch(`/api/recipes/${newRecipe.id}/log-meal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mealTime,
            date: mealPlannerDate ? new Date(mealPlannerDate).toISOString() : new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error('Failed to log recipe to meal plan:', err);
        // Non-fatal — recipe was still created
      }
    }

    setShowSuccess(true);

    if (!fromMealPlanner) {
      setTimeout(() => {
        router.push(`/recipes/${newRecipe.id}`);
      }, 2500);
    }
  };

  const handleCancel = () => {
    router.push(fromMealPlanner ? '/meal-planner' : '/recipes');
  };

  const handleViewNow = () => {
    if (createdRecipeId) {
      router.push(`/recipes/${createdRecipeId}`);
    }
  };

  const handleGoToMealPlanner = () => {
    router.push('/meal-planner');
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/25">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
            Recipe Saved!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {fromMealPlanner
              ? 'Your recipe has been added to your meal plan and logged for the day.'
              : 'Your recipe has been added to your collection.'}
          </p>
          <div className="space-y-3">
            {fromMealPlanner && (
              <button
                onClick={handleGoToMealPlanner}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98]"
              >
                <CalendarDays className="w-5 h-5" />
                Go to Meal Planner
              </button>
            )}
            <button
              onClick={handleViewNow}
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              View Recipe
            </button>
          </div>
          {!fromMealPlanner && <p className="mt-4 text-xs text-gray-400">Redirecting automatically in a moment…</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Sticky page header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={fromMealPlanner ? '/meal-planner' : '/recipes'}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{fromMealPlanner ? 'Meal Planner' : 'Recipes'}</span>
            </Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Create Recipe</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-md flex items-center justify-center shadow">
              <ChefHat className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden sm:block">
              Recipe Builder
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-full text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-4">
            <PenLine className="w-4 h-4" />
            {fromMealPlanner
              ? `Adding meal to ${mealPlannerDay}'s ${mealPlannerSlot}`
              : 'Built by hand, powered by your knowledge'}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
            Create a New Recipe
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-base">
            Add ingredients, instructions, and nutrition info to build a health-boosting recipe
            that supports the 5x5x5 defense systems.
          </p>
        </div>

        {/* Form */}
        <RecipeForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}

export default function CreateRecipePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>}>
      <CreateRecipePageInner />
    </Suspense>
  );
}