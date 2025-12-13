'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Clock, Users, Search, Check, Loader2, Book, ChefHat } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  difficulty?: string;
  cuisine?: string;
  ingredientCount?: number;
}

interface RecipeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Called when shopping list is successfully created
}

export default function RecipeSelectionModal({
  isOpen,
  onClose,
  onSuccess,
}: RecipeSelectionModalProps) {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filterPantry, setFilterPantry] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRecipes();
      setSelectedRecipes(new Set());
      setSearchTerm('');
      setError(null);
    }
  }, [isOpen]);

  // Debounced search effect
  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(() => {
      fetchRecipes();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isOpen]);

  const fetchRecipes = async () => {
    try {
      setFetchLoading(true);
      const searchParam = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`/api/recipes/for-shopping-list${searchParam}`);
      const data = await response.json();

      if (data.success) {
        setRecipes(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch recipes');
      }
    } catch (err) {
      setError('Failed to fetch recipes');
      console.error('Error fetching recipes:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  const toggleSelection = (recipeId: string) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(recipeId)) {
      newSelected.delete(recipeId);
    } else {
      newSelected.add(recipeId);
    }
    setSelectedRecipes(newSelected);
  };

  const handleConfirm = async () => {
    if (selectedRecipes.size === 0) return;
    
    setCreating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/shopping-lists/create-from-sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'recipes',
          sourceIds: Array.from(selectedRecipes),
          filterPantry,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create shopping list');
      }

      const result = await response.json();
      
      console.log('✅ Shopping list created:', result);
      
      // Close modal and navigate to the new shopping list
      onClose();
      if (onSuccess) onSuccess();
      
      // Use result.data.id since API returns { success, data: { ...shoppingList }, message }
      const shoppingListId = result.data?.id || result.id;
      if (shoppingListId) {
        router.push(`/shopping-lists/${shoppingListId}`);
      } else {
        console.error('No shopping list ID in response:', result);
        setError('Shopping list created but could not navigate to it');
      }
      
    } catch (error) {
      console.error('Error creating shopping list:', error);
      setError(error instanceof Error ? error.message : 'Failed to create shopping list');
    } finally {
      setCreating(false);
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    return time.includes('min') ? time : `${time} min`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Book className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Select Recipes</h2>
              <p className="text-gray-600">Choose recipes to create shopping list from</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search recipes by name, description, or cuisine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          {/* Pantry Filter */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="filterPantryRecipes"
              checked={filterPantry}
              onChange={(e) => setFilterPantry(e.target.checked)}
              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            />
            <label htmlFor="filterPantryRecipes" className="text-sm text-gray-700">
              Filter out items I already have in pantry
            </label>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {fetchLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <span className="ml-3 text-gray-600">Loading recipes...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Error Loading Recipes</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchRecipes}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Book className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {searchTerm ? 'No matching recipes' : 'No recipes found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms.'
                  : 'Create your first recipe to get started.'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    onClose();
                    window.open('/recipes/create', '_blank');
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Create Recipe
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => toggleSelection(recipe.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedRecipes.has(recipe.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800 mb-1">{recipe.title}</h3>
                      {recipe.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{recipe.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {recipe.prepTime && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Prep: {formatTime(recipe.prepTime)}</span>
                          </div>
                        )}
                        {recipe.cookTime && (
                          <div className="flex items-center space-x-1">
                            <ChefHat className="w-3 h-3" />
                            <span>Cook: {formatTime(recipe.cookTime)}</span>
                          </div>
                        )}
                        {recipe.servings && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{recipe.servings} serving{recipe.servings === 1 ? '' : 's'}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {recipe.cuisine && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {recipe.cuisine}
                          </span>
                        )}
                        {recipe.difficulty && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            recipe.difficulty.toLowerCase() === 'easy' 
                              ? 'bg-green-100 text-green-800'
                              : recipe.difficulty.toLowerCase() === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {recipe.difficulty}
                          </span>
                        )}
                        {recipe.ingredientCount && (
                          <span className="text-xs text-gray-500">
                            {recipe.ingredientCount} ingredient{recipe.ingredientCount === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ml-3 ${
                      selectedRecipes.has(recipe.id)
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300'
                    }`}>
                      {selectedRecipes.has(recipe.id) && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedRecipes.size > 0 ? `${selectedRecipes.size} recipe${selectedRecipes.size === 1 ? '' : 's'} selected` : 'No recipes selected'}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedRecipes.size === 0 || creating}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{creating ? 'Creating...' : 'Create Shopping List'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}