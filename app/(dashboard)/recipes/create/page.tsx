'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RecipeForm from '@/components/recipes/RecipeForm';
import { RecipeFormData } from '@/types';
import { ChefHat, ArrowLeft, CheckCircle2, PenLine } from 'lucide-react';
import Link from 'next/link';

export default function CreateRecipePage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdRecipeId, setCreatedRecipeId] = useState<string | null>(null);

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
    setShowSuccess(true);

    setTimeout(() => {
      router.push(`/recipes/${newRecipe.id}`);
    }, 2500);
  };

  const handleCancel = () => {
    router.push('/recipes');
  };

  const handleViewNow = () => {
    if (createdRecipeId) {
      router.push(`/recipes/${createdRecipeId}`);
    }
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
            Your recipe has been added to your collection.
          </p>
          <button
            onClick={handleViewNow}
            className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
          >
            View Recipe
          </button>
          <p className="mt-4 text-xs text-gray-400">Redirecting automatically in a moment…</p>
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
              href="/recipes"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Recipes</span>
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
            Built by hand, powered by your knowledge
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