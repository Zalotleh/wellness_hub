import { useState, useEffect, useCallback } from 'react';
import { RecipeWithRelations, RecipeFilters, PaginatedResponse } from '@/types';

export function useRecipes(filters?: RecipeFilters) {
  const [recipes, setRecipes] = useState<RecipeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchRecipes = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Build query string
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (filters?.system) params.append('system', filters.system);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);

      const response = await fetch(`/api/recipes?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const data: PaginatedResponse<RecipeWithRelations> = await response.json();
      
      setRecipes(data.data);
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize]);

  useEffect(() => {
    fetchRecipes(1);
  }, [filters?.system, filters?.search, filters?.userId, filters?.sortBy]);

  const createRecipe = async (recipeData: any) => {
    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create recipe');
      }

      const { data: newRecipe } = await response.json();
      
      // Add new recipe to the beginning of the list
      setRecipes((prev) => [newRecipe, ...prev]);
      
      return newRecipe;
    } catch (err) {
      throw err;
    }
  };

  const updateRecipe = async (id: string, recipeData: any) => {
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update recipe');
      }

      const { data: updatedRecipe } = await response.json();
      
      // Update recipe in the list
      setRecipes((prev) =>
        prev.map((recipe) => (recipe.id === id ? updatedRecipe : recipe))
      );
      
      return updatedRecipe;
    } catch (err) {
      throw err;
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete recipe');
      }

      // Remove recipe from the list
      setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const rateRecipe = async (recipeId: string, value: number) => {
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, value }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rate recipe');
      }

      const { averageRating, totalRatings } = await response.json();

      // Update recipe rating in the list
      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === recipeId
            ? { ...recipe, averageRating, _count: { ...recipe._count } }
            : recipe
        )
      );

      return { averageRating, totalRatings };
    } catch (err) {
      throw err;
    }
  };

  const nextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchRecipes(pagination.page + 1);
    }
  };

  const prevPage = () => {
    if (pagination.page > 1) {
      fetchRecipes(pagination.page - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchRecipes(page);
    }
  };

  return {
    recipes,
    loading,
    error,
    pagination,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    rateRecipe,
    refetch: () => fetchRecipes(pagination.page),
    nextPage,
    prevPage,
    goToPage,
  };
}

// Hook for fetching a single recipe
export function useRecipe(id: string) {
  const [recipe, setRecipe] = useState<RecipeWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/recipes/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recipe');
      }

      const data = await response.json();
      setRecipe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchRecipe();
    }
  }, [id, fetchRecipe]);

  return {
    recipe,
    loading,
    error,
    refetch: fetchRecipe,
  };
}