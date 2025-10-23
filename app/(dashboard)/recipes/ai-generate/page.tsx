'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AIRecipeGenerator from '@/components/recipes/AIRecipeGenerator';
import { RecipeFormData } from '@/types';
import { recipeSchema } from '@/lib/validations';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AIGeneratorPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);

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
        throw new Error(errorData.error || 'Failed to save recipe');
      }

      const { data: newRecipe } = await response.json();
      setSavedRecipeId(newRecipe.id);
      setShowSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/recipes/${newRecipe.id}`);
      }, 2000);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        // Transform Zod validation errors into user-friendly messages
        const firstError = err.errors[0];
        throw new Error(
          firstError?.message || 'Please check all required recipe fields'
        );
      }
      throw err;
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Recipe Saved Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            Your AI-generated recipe has been added to your collection.
          </p>
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/recipes"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Recipes</span>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                AI Recipe Generator
              </h1>
              <p className="text-gray-600">
                Let artificial intelligence create personalized recipes for your health goals
              </p>
            </div>
          </div>
        </div>

        {/* Generator Component */}
        <AIRecipeGenerator onSaveRecipe={handleSaveRecipe} />

        {/* Features Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Defense System Focus</h3>
            <p className="text-sm text-gray-600">
              Recipes tailored to support specific health defense systems
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🧪</span>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Nutrient-Optimized</h3>
            <p className="text-sm text-gray-600">
              Every recipe includes key nutrients and their health benefits
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Personalized</h3>
            <p className="text-sm text-gray-600">
              Customized based on your ingredients and dietary preferences
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-gray-800 mb-1">
                How does the AI generate recipes?
              </h4>
              <p className="text-sm text-gray-600">
                Our AI is trained on nutritional science and the 5x5x5 system. It analyzes 
                defense system requirements, key nutrients, and your preferences to create 
                balanced, health-focused recipes.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-1">
                Are the recipes nutritionally accurate?
              </h4>
              <p className="text-sm text-gray-600">
                Yes! All recipes are based on Dr. William Li's research and include foods 
                scientifically shown to support each defense system.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-1">
                Can I customize the generated recipes?
              </h4>
              <p className="text-sm text-gray-600">
                Absolutely! After saving a recipe, you can edit it to adjust ingredients, 
                instructions, or any other details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}