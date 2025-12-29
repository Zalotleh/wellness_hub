// app/(dashboard)/meal-planner/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import EnhancedMealPlanner from '@/components/meal-planner/EnhancedMealPlanner';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/ui/ConfirmationDialog';

export default function MealPlanViewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (params.id && session?.user) {
      fetchMealPlan();
    }
  }, [params.id, session]);

  const fetchMealPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/meal-planner/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch meal plan');
      }

      const data = await response.json();
      console.log('📥 Raw meal plan data from API:', data);
      
      // Transform nested database structure to flat structure expected by EnhancedMealPlanner
      const rawPlan = data.data || data;
      const flattenedMeals: any[] = [];
      
      if (rawPlan.dailyMenus) {
        // Sort daily menus by date to ensure correct day mapping
        const sortedDailyMenus = rawPlan.dailyMenus.sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        sortedDailyMenus.forEach((dailyMenu: any, dayIndex: number) => {
          if (dailyMenu.meals && Array.isArray(dailyMenu.meals)) {
            const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            // Calculate week number (1-based) and day of week (0-6)
            const weekNumber = Math.floor(dayIndex / 7) + 1;
            const dayOfWeek = dayIndex % 7;
            const dayName = dayNames[dayOfWeek] || 'monday';
            
            dailyMenu.meals.forEach((meal: any) => {
              // Map database meal structure to frontend expected structure
              flattenedMeals.push({
                id: meal.id || `week${weekNumber}-${dayName}-${meal.mealType}`,
                mealName: meal.mealName || 'Unnamed Meal',
                mealType: meal.mealType || 'breakfast',
                day: dayName,
                slot: meal.slot || meal.mealType || 'breakfast', // Use persisted slot, fallback to mealType
                week: weekNumber,
                defenseSystems: meal.defenseSystems || [],
                prepTime: meal.prepTime ? (typeof meal.prepTime === 'string' ? parseInt(meal.prepTime) : meal.prepTime) : 30,
                cookTime: meal.cookTime ? (typeof meal.cookTime === 'string' ? parseInt(meal.cookTime) : meal.cookTime) : 0,
                servings: rawPlan.defaultServings || 2,
                recipeGenerated: !!meal.generatedRecipe,
                recipeId: meal.generatedRecipe?.id,
                customInstructions: meal.customInstructions,
              });
            });
          }
        });
      }

      console.log('🔄 Flattened meals:', flattenedMeals);

      const transformedPlan = {
        ...rawPlan,
        meals: flattenedMeals,
      };
      
      console.log('✅ Transformed meal plan:', transformedPlan);
      setMealPlan(transformedPlan);
      
      // Scroll to top to show calendar view at the top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error fetching meal plan:', error);
      setError('Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/meal-planner/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409 && errorData.warning) {
          // Plan has interactions, ask for force delete
          const forceResponse = await fetch(`/api/meal-planner/${params.id}?force=true`, {
            method: 'DELETE',
          });
          
          if (!forceResponse.ok) {
            const forceErrorData = await forceResponse.json();
            throw new Error(forceErrorData.error || 'Failed to delete meal plan');
          }
        } else {
          throw new Error(errorData.error || 'Failed to delete meal plan');
        }
      }

      // Redirect to saved plans page after successful deletion
      router.push('/saved-plans');
      
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete meal plan');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading meal plan...</p>
        </div>
      </div>
    );
  }

  if (error || !mealPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Meal plan not found'}</p>
          <Link href="/saved-plans" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Back to Saved Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link 
              href="/saved-plans"
              className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Saved Plans
            </Link>
            
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Plan
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
          )}
          
          <EnhancedMealPlanner
            initialPlan={mealPlan}
            onPlanSave={(plan) => {
              console.log('Plan updated:', plan);
              setMealPlan(plan);
            }}
            onPlanShare={(plan) => {
              console.log('Plan shared:', plan);
            }}
          />
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeletePlan}
        itemName={mealPlan?.name}
        itemType="meal plan"
        isLoading={isDeleting}
      />
    </div>
  );
}