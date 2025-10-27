// app/(dashboard)/meal-planner/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import EnhancedMealPlanner from '@/components/meal-planner/EnhancedMealPlanner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function MealPlanViewPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            const dayName = dayNames[dayIndex % 7] || 'monday';
            
            dailyMenu.meals.forEach((meal: any) => {
              // Map database meal structure to frontend expected structure
              flattenedMeals.push({
                id: meal.id || `${dayName}-${meal.mealType}`,
                mealName: meal.mealName || 'Unnamed Meal',
                mealType: meal.mealType || 'breakfast',
                day: dayName,
                slot: meal.mealType || 'breakfast',
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
    } catch (error) {
      console.error('Error fetching meal plan:', error);
      setError('Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meal plan...</p>
        </div>
      </div>
    );
  }

  if (error || !mealPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Meal plan not found'}</p>
          <Link href="/saved-plans" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Back to Saved Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link 
              href="/saved-plans"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Saved Plans
            </Link>
          </div>
          
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
    </div>
  );
}