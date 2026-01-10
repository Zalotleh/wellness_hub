'use client';

import { useState } from 'react';
import { CheckCircle, ShoppingCart, ClipboardList, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecipeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeName: string;
  onCreateShoppingList: () => Promise<void>;
  onLogToMealPlanner: () => Promise<void>;
  onViewRecipe: () => void;
}

export function RecipeSuccessModal({
  isOpen,
  onClose,
  recipeId,
  recipeName,
  onCreateShoppingList,
  onLogToMealPlanner,
  onViewRecipe,
}: RecipeSuccessModalProps) {
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  const handleCreateShoppingList = async () => {
    setIsCreatingList(true);
    try {
      await onCreateShoppingList();
      onClose();
    } catch (error) {
      console.error('Error creating shopping list:', error);
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleLogToMealPlanner = async () => {
    setIsLogging(true);
    try {
      await onLogToMealPlanner();
      onClose();
    } catch (error) {
      console.error('Error logging to meal planner:', error);
    } finally {
      setIsLogging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm" 
        onClick={onClose}
        aria-hidden="true" 
      />

      {/* Modal */}
      <div className="relative mx-auto max-w-lg w-full bg-white rounded-xl shadow-xl m-4">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-8 rounded-t-xl border-b border-green-100">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-12 h-12 text-green-600" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  Recipe Created! 🎉
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {recipeName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-700">
              What would you like to do next?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="p-6 space-y-3">
            {/* Option 1: Create Shopping List */}
            <button
              onClick={handleCreateShoppingList}
              disabled={isCreatingList}
              className="w-full flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Create Shopping List</h3>
                <p className="text-sm text-gray-600">
                  {isCreatingList ? 'Creating list...' : 'Get all ingredients ready to shop'}
                </p>
              </div>
            </button>

            {/* Option 2: Log to Meal Planner */}
            <button
              onClick={handleLogToMealPlanner}
              disabled={isLogging}
              className="w-full flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Log This Meal Now</h3>
                <p className="text-sm text-gray-600">
                  {isLogging ? 'Logging meal...' : 'Track it in your progress today'}
                </p>
              </div>
            </button>

            {/* Option 3: View Recipe */}
            <button
              onClick={() => {
                onViewRecipe();
                onClose();
              }}
              className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 rounded-lg transition-colors group"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">View Recipe</h3>
                <p className="text-sm text-gray-600">
                  See the full recipe details
                </p>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
            <button
              onClick={onClose}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              I'll do this later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
