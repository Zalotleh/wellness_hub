'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RecipeFormData, RecipeWithRelations } from '@/types';
import RecipeForm from './RecipeForm';
import { CheckCircle2 } from 'lucide-react';

interface EditRecipeFormProps {
  recipe: RecipeWithRelations;
  onCancel?: () => void;
}

export default function EditRecipeForm({ recipe }: EditRecipeFormProps) {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  
  const handleCancel = () => {
    router.push(`/recipes/${recipe.id}`);
  };

  const handleViewNow = () => {
    router.push(`/recipes/${recipe.id}`);
  };

  // Transform recipe data for the form
  const formData: Partial<RecipeFormData> = {
    title: recipe.title,
    description: recipe.description || '',
    ingredients: Array.isArray(recipe.ingredients) 
      ? recipe.ingredients.map((ing: any) => {
          // Handle old format with 'amount' field
          if (ing.amount && !ing.quantity && !ing.unit) {
            // Try to parse "2 cups" format into quantity and unit
            const amountMatch = ing.amount.match(/^(\d+\.?\d*)\s+(.+)$/);
            if (amountMatch) {
              return {
                name: ing.name || '',
                quantity: amountMatch[1],
                unit: amountMatch[2]
              };
            }
            // If can't parse, default to unit-less
            return {
              name: ing.name || '',
              quantity: ing.amount || '1',
              unit: 'piece'
            };
          }
          // Handle new format with separate quantity and unit
          return {
            name: ing.name || '',
            quantity: ing.quantity || '1',
            unit: ing.unit || 'piece'
          };
        })
      : [],
    instructions: Array.isArray(recipe.instructions) 
      ? recipe.instructions.join('\n')
      : typeof recipe.instructions === 'string'
      ? recipe.instructions
      : '',
    prepTime: recipe.prepTime || '',
    cookTime: recipe.cookTime || '',
    servings: recipe.servings || undefined,
    defenseSystems: recipe.defenseSystems,
    nutrients: typeof recipe.nutrients === 'object' && recipe.nutrients !== null
      ? Object.entries(recipe.nutrients).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      : undefined,
    imageUrl: recipe.imageUrl || undefined,  // Only include if it exists
  };

  const handleSubmit = async (formData: RecipeFormData) => {
    try {
      // Clean up the form data
      const cleanedData = {
        ...formData,
        // Only include imageUrl if it's a valid URL
        imageUrl: formData.imageUrl?.trim() || undefined,
      };

      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update recipe');
      }

      // Show success message
      setShowSuccess(true);

      // Redirect after 3 seconds to give user time to see success
      setTimeout(() => {
        router.push(`/recipes/${recipe.id}`);
        router.refresh();
      }, 3000);
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error; // Re-throw so RecipeForm can handle it
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
            Recipe Updated Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
            Your changes have been saved.
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Recipe</h1>
      <RecipeForm 
        initialData={formData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        showCancelButton={true}
        submitButtonText="Update Recipe"
      />
    </div>
  );
}