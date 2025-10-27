'use client';

import { useState, useCallback } from 'react';

// Type definition for GeneratedRecipe
interface GeneratedRecipe {
  id: string;
  userId: string;
  mealId: string;
  name: string;
  description?: string;
  servings: number;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  difficulty?: string;
  ingredients: any; // JSON array
  instructions: any; // JSON array
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  defenseSystems: string[];
  tags: string[];
  isPublic: boolean;
  likes: number;
  saves: number;
  generatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RecipeGenerationProgress {
  current: number;
  total: number;
  currentMeal?: string;
}

interface RecipeGenerationError {
  type: 'API_KEY' | 'RATE_LIMIT' | 'TIMEOUT' | 'PARSE_ERROR' | 'NETWORK' | 'UNKNOWN';
  message: string;
  retryAfter?: number;
}

interface UseRecipeGenerationOptions {
  mealPlanId: string;
  onSuccess?: (recipes: GeneratedRecipe[]) => void;
  onError?: (error: RecipeGenerationError) => void;
}

interface UseRecipeGenerationReturn {
  generateRecipes: (mealIds: string[]) => Promise<void>;
  isGenerating: boolean;
  progress: RecipeGenerationProgress | null;
  error: RecipeGenerationError | null;
  generatedRecipes: GeneratedRecipe[];
  clearError: () => void;
  cancelGeneration: () => void;
}

export function useRecipeGeneration({
  mealPlanId,
  onSuccess,
  onError,
}: UseRecipeGenerationOptions): UseRecipeGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<RecipeGenerationProgress | null>(null);
  const [error, setError] = useState<RecipeGenerationError | null>(null);
  const [generatedRecipes, setGeneratedRecipes] = useState<GeneratedRecipe[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const cancelGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsGenerating(false);
    setProgress(null);
  }, [abortController]);

  const parseApiError = useCallback((error: any): RecipeGenerationError => {
    // Handle fetch/network errors
    if (error.name === 'AbortError') {
      return {
        type: 'TIMEOUT',
        message: 'Request was cancelled',
      };
    }

    if (!error.status) {
      return {
        type: 'NETWORK',
        message: error.message || 'Network connection failed',
      };
    }

    // Handle HTTP errors
    switch (error.status) {
      case 401:
        return {
          type: 'API_KEY',
          message: 'Authentication failed',
        };
      case 429:
        return {
          type: 'RATE_LIMIT',
          message: error.message || 'Rate limit exceeded',
          retryAfter: error.retryAfter,
        };
      case 408:
      case 504:
        return {
          type: 'TIMEOUT',
          message: 'Request timed out',
        };
      case 422:
        return {
          type: 'PARSE_ERROR',
          message: error.message || 'Failed to process recipe data',
        };
      default:
        return {
          type: 'UNKNOWN',
          message: error.message || 'An unexpected error occurred',
        };
    }
  }, []);

  const generateRecipes = useCallback(async (mealIds: string[]) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setProgress({
      current: 0,
      total: mealIds.length,
    });

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch(`/api/meal-planner/${mealPlanId}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mealIds }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        throw {
          status: response.status,
          message: errorData.message || errorData.error,
          retryAfter: response.headers.get('Retry-After') 
            ? parseInt(response.headers.get('Retry-After')!, 10)
            : undefined,
        };
      }

      const data = await response.json();

      if (!data.success) {
        throw {
          status: 422,
          message: data.message || 'Failed to generate recipes',
        };
      }

      setGeneratedRecipes(data.recipes);
      setProgress({
        current: mealIds.length,
        total: mealIds.length,
      });

      onSuccess?.(data.recipes);
    } catch (err: any) {
      const apiError = parseApiError(err);
      setError(apiError);
      onError?.(apiError);
    } finally {
      setIsGenerating(false);
      setAbortController(null);
      // Keep progress visible for a moment after completion
      setTimeout(() => setProgress(null), 2000);
    }
  }, [mealPlanId, isGenerating, onSuccess, onError, parseApiError]);

  return {
    generateRecipes,
    isGenerating,
    progress,
    error,
    generatedRecipes,
    clearError,
    cancelGeneration,
  };
}

// Hook for fetching existing recipes
export function useGeneratedRecipes(mealPlanId: string) {
  const [recipes, setRecipes] = useState<GeneratedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/meal-planner/${mealPlanId}/recipes`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const data = await response.json();
      setRecipes(data.recipes || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [mealPlanId]);

  return {
    recipes,
    isLoading,
    error,
    fetchRecipes,
    setRecipes,
  };
}