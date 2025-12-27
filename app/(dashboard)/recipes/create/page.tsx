'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RecipeForm from '@/components/recipes/RecipeForm';
import { RecipeFormData } from '@/types';
import { ChefHat, ArrowLeft, CheckCircle2 } from 'lucide-react';
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

    // Store the recipe ID and show success message
    setCreatedRecipeId(newRecipe.id);
    setShowSuccess(true);

    // Redirect after 3 seconds to give user time to see success
    setTimeout(() => {
      router.push(`/recipes/${newRecipe.id}`);
    }, 3000);
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
            Recipe Created Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
            Your recipe has been saved and is now visible to the community.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleViewNow}
              className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
            >
              View Recipe Now
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Auto-redirecting in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/recipes"
            className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Recipes</span>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Create New Recipe
              </h1>
              <p className="text-gray-600 dark:text-gray-200">
                Share your health-boosting recipe with the 5x5x5 community
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <RecipeForm onSubmit={handleSubmit} onCancel={handleCancel} />

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3">💡 Tips for Great Recipes</h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>
                <strong>Be specific:</strong> Include exact measurements and cooking times
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>
                <strong>Explain benefits:</strong> Mention how your recipe supports the defense system
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>
                <strong>Use key foods:</strong> Incorporate foods known to boost your chosen defense system
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>
                <strong>Number your steps:</strong> Make instructions easy to follow
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}