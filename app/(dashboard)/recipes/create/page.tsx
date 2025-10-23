'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RecipeForm from '@/components/recipes/RecipeForm';
import { RecipeFormData } from '@/types';
import { ChefHat, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateRecipePage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);

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

    // Show success message
    setShowSuccess(true);

    // Redirect after 2 seconds
    setTimeout(() => {
      router.push(`/recipes/${newRecipe.id}`);
    }, 2000);
  };

  const handleCancel = () => {
    router.push('/recipes');
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Recipe Created Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            Your recipe has been saved and is now visible to the community.
          </p>
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
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
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Create New Recipe
              </h1>
              <p className="text-gray-600">
                Share your health-boosting recipe with the 5x5x5 community
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <RecipeForm onSubmit={handleSubmit} onCancel={handleCancel} />

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">💡 Tips for Great Recipes</h3>
          <ul className="space-y-2 text-sm text-blue-800">
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