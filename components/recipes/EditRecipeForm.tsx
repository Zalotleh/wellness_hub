'use client';

import { useRouter } from 'next/navigation';
import type { RecipeFormData, RecipeWithRelations } from '@/types';
import RecipeForm from './RecipeForm';

interface EditRecipeFormProps {
  recipe: RecipeWithRelations;
  onCancel?: () => void;
}

export default function EditRecipeForm({ recipe }: EditRecipeFormProps) {
  const router = useRouter();
  
  const handleCancel = () => {
    router.push(`/recipes/${recipe.id}`);
  };

  // Transform recipe data for the form
  const formData: Partial<RecipeFormData> = {
    title: recipe.title,
    description: recipe.description || '',
    ingredients: Array.isArray(recipe.ingredients) 
      ? recipe.ingredients.map((ing: any) => ({
          name: ing.name || '',
          amount: ing.amount || ''
        }))
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

      router.refresh(); // Refresh the server components
      router.push(`/recipes/${recipe.id}`); // Redirect to recipe page
      router.refresh();
    } catch (error) {
      console.error('Error updating recipe:', error);
    }
  };

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