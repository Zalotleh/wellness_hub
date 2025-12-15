'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DefenseSystem, Meal } from '@/types';
import SystemSelector from './SystemSelector';
import MealCard from './MealCard';
import ShareMenu from './ShareMenu';
import MealPlanHeader from './MealPlanHeader';
import PlanConfiguration from './PlanConfiguration';
import MealPlanView from './MealPlanView';
import {
  GeneratingOverlay,
  OptimisticUpdate,
  ErrorState,
  EmptyState,
  WeekViewSkeleton,
} from './LoadingStates';
import { useResponsive, cn } from './ResponsiveUtils';

interface ConfigurationData {
  title: string;
  description: string;
  servings: number;
  duration: 1 | 2 | 3 | 4; // Number of weeks
  dietaryRestrictions: string[];
  focusSystems: DefenseSystem[];
  customInstructions: string;
  visibility: 'PRIVATE' | 'PUBLIC' | 'FRIENDS';
  tags: string[];
}

interface MealPlan {
  id?: string;
  title: string;
  description: string;
  visibility: 'PRIVATE' | 'PUBLIC' | 'FRIENDS';
  meals: Meal[];
  tags: string[];
  weekStart?: string | Date;
  weekEnd?: string | Date;
  defaultServings?: number;
  duration?: number; // Number of weeks (for in-memory state)
  durationWeeks?: number; // Number of weeks (from database)
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}

interface EnhancedMealPlannerProps {
  className?: string;
  onPlanSave?: (plan: MealPlan) => void;
  onPlanShare?: (plan: MealPlan) => void;
  initialPlan?: MealPlan;
}

export default function EnhancedMealPlanner({
  className = '',
  onPlanSave,
  onPlanShare,
  initialPlan,
}: EnhancedMealPlannerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();

  // Main state
  const [currentStep, setCurrentStep] = useState<'configure' | 'view' | 'edit'>('configure');
  const [isGenerating, setIsGenerating] = useState(false);
  const [optimisticAction, setOptimisticAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Configuration state
  const [configuration, setConfiguration] = useState<ConfigurationData>({
    title: initialPlan?.title || '',
    description: initialPlan?.description || '',
    servings: 4,
    duration: (initialPlan?.duration as 1 | 2 | 3 | 4) || 1,
    dietaryRestrictions: [],
    focusSystems: [],
    customInstructions: '',
    visibility: initialPlan?.visibility || 'PRIVATE',
    tags: initialPlan?.tags || [],
  });

  // Meal plan state
  const [mealPlan, setMealPlan] = useState<MealPlan>({
    id: initialPlan?.id,
    title: configuration.title,
    description: configuration.description,
    visibility: configuration.visibility,
    meals: initialPlan?.meals || [],
    tags: configuration.tags,
    createdAt: initialPlan?.createdAt,
    updatedAt: initialPlan?.updatedAt,
    userId: session?.user?.id,
  });

  // Progress tracking
  const [generationProgress, setGenerationProgress] = useState(0);
  const [shoppingListGenerated, setShoppingListGenerated] = useState(0); // Counter to trigger refresh

  // Initialize with existing plan if provided
  useEffect(() => {
    if (initialPlan) {
      setCurrentStep('view');
      setMealPlan(initialPlan);
      setConfiguration({
        title: initialPlan.title,
        description: initialPlan.description,
        servings: 4, // Default since not stored in plan
        duration: (initialPlan.duration as 1 | 2 | 3 | 4) || 1,
        dietaryRestrictions: [], // Could be derived from meals
        focusSystems: [], // Could be derived from meals
        customInstructions: '',
        visibility: initialPlan.visibility,
        tags: initialPlan.tags,
      });
    }
  }, [initialPlan]);

  // Generate meal plan
  const handleGeneratePlan = useCallback(async () => {
    if (!session?.user) {
      setError('Please sign in to generate meal plans');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Simulate progress updates
      progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 500);

      // Make API call to generate meal plan
      const response = await fetch('/api/meal-planner/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dietaryRestrictions: configuration.dietaryRestrictions,
          focusSystems: configuration.focusSystems,
          duration: configuration.duration,
          preferences: {
            title: configuration.title,
            description: configuration.description,
            servings: configuration.servings,
            customInstructions: configuration.customInstructions,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to generate meal plan');
      }

      const { data: mealPlanData } = await response.json();
      
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      setGenerationProgress(100);

      // Transform the meal plan data into the expected structure
      const meals: Meal[] = [];
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const mealTypes = ['breakfast', 'lunch', 'dinner'];

      // Handle both single-week (legacy) and multi-week format
      const isMultiWeek = mealPlanData.week1 !== undefined;
      const duration = configuration.duration || 1;
      
      if (isMultiWeek) {
        // Multi-week format: { week1: {...}, week2: {...}, ... }
        for (let weekNum = 1; weekNum <= duration; weekNum++) {
          const weekData = mealPlanData[`week${weekNum}`];
          if (!weekData) continue;
          
          days.forEach((day, dayIndex) => {
            const dayData = weekData[day];
            if (dayData) {
              mealTypes.forEach((mealType) => {
                const mealData = dayData[mealType];
                if (mealData) {
                  const prepTimeMatch = mealData.prepTime?.match(/(\d+)/);
                  const prepTime = prepTimeMatch ? parseInt(prepTimeMatch[1]) : 30;

                  meals.push({
                    id: `week${weekNum}-${day}-${mealType}`,
                    mealName: mealData.name,
                    mealType,
                    day: day,
                    week: weekNum,
                    slot: mealType,
                    defenseSystems: mealData.systems || [],
                    prepTime: prepTime,
                    cookTime: 0,
                    servings: configuration.servings,
                    recipeGenerated: false,
                    customInstructions: configuration.customInstructions,
                  });
                }
              });
            }
          });
        }
      } else {
        // Legacy single-week format: { monday: {...}, tuesday: {...}, ... }
        days.forEach((day, dayIndex) => {
          const dayData = mealPlanData[day];
          if (dayData) {
            mealTypes.forEach((mealType, mealIndex) => {
              const mealData = dayData[mealType];
              if (mealData) {
                const prepTimeMatch = mealData.prepTime?.match(/(\d+)/);
                const prepTime = prepTimeMatch ? parseInt(prepTimeMatch[1]) : 30;

                meals.push({
                  id: `${day}-${mealType}`,
                  mealName: mealData.name,
                  mealType,
                  day: day,
                  week: 1,
                  slot: mealType,
                  defenseSystems: mealData.systems || [],
                  prepTime: prepTime,
                  cookTime: 0,
                  servings: configuration.servings,
                  recipeGenerated: false,
                  customInstructions: configuration.customInstructions,
                });
              }
            });
          }
        });
      }

      // Update meal plan with generated data
      const newPlan: MealPlan = {
        id: undefined,
        title: configuration.title,
        description: configuration.description,
        visibility: configuration.visibility,
        meals: meals,
        tags: configuration.tags,
        duration: duration,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: session.user.id,
      };

      // Transform meal plan data to API format
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Start from Monday
      
      // Calculate week end based on duration
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + (duration * 7) - 1);
      
      // Group meals by day across all weeks
      const dailyMenus: any[] = [];
      const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      for (let weekNum = 1; weekNum <= duration; weekNum++) {
        dayNames.forEach((dayName, dayIndex) => {
          const dayMeals = meals.filter(meal => meal.day === dayName && meal.week === weekNum);
          if (dayMeals.length > 0) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + ((weekNum - 1) * 7) + dayIndex);
            
            dailyMenus.push({
              date: dayDate.toISOString(),
              meals: dayMeals.map(meal => ({
                mealType: meal.mealType,
                mealName: meal.mealName,
                defenseSystems: meal.defenseSystems,
                prepTime: meal.prepTime ? String(meal.prepTime) : null,
                cookTime: meal.cookTime ? String(meal.cookTime) : null,
                customInstructions: meal.customInstructions,
              }))
            });
          }
        });
      }

      const apiMealPlan = {
        title: configuration.title,
        description: configuration.description,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        durationWeeks: duration,
        defaultServings: configuration.servings,
        visibility: configuration.visibility,
        customInstructions: configuration.customInstructions,
        dietaryRestrictions: configuration.dietaryRestrictions,
        focusSystems: configuration.focusSystems,
        tags: configuration.tags,
        dailyMenus: dailyMenus,
      };

      // Save the generated meal plan to database
      console.log('🔄 Attempting to save meal plan to database...', apiMealPlan);
      
      const saveResponse = await fetch('/api/meal-planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiMealPlan),
      });

      console.log('📡 Save response status:', saveResponse.status);

      if (!saveResponse.ok) {
        const errorData = await saveResponse.text();
        console.error('❌ Failed to save meal plan:', errorData);
        throw new Error(`Failed to save meal plan to database: ${saveResponse.status}`);
      }

      const saveData = await saveResponse.json();
      console.log('✅ Meal plan saved successfully:', saveData);
      
      // Transform the nested structure to flat structure expected by frontend
      const savedPlan = saveData.data || saveData;
      const flattenedMeals: Meal[] = [];
      
      if (savedPlan.dailyMenus) {
        // Sort daily menus by date to ensure correct day mapping
        const sortedDailyMenus = savedPlan.dailyMenus.sort((a: any, b: any) => 
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
              flattenedMeals.push({
                id: meal.id || `week${weekNumber}-${dayName}-${meal.mealType}`,
                mealName: meal.mealName || 'Unnamed Meal',
                mealType: meal.mealType || 'breakfast',
                day: dayName,
                week: weekNumber,
                slot: meal.mealType || 'breakfast',
                defenseSystems: meal.defenseSystems || [],
                prepTime: meal.prepTime ? (typeof meal.prepTime === 'string' ? parseInt(meal.prepTime) : meal.prepTime) : 30,
                cookTime: meal.cookTime ? (typeof meal.cookTime === 'string' ? parseInt(meal.cookTime) : meal.cookTime) : 0,
                servings: meal.servings || savedPlan.defaultServings || 2,
                recipeGenerated: !!meal.generatedRecipe,
                recipeId: meal.generatedRecipe?.id,
                customInstructions: meal.customInstructions,
              });
            });
          }
        });
      }

      const transformedPlan: MealPlan = {
        ...savedPlan,
        meals: flattenedMeals,
      };
      
      setMealPlan(transformedPlan);
      
      // Call callback if provided
      if (onPlanSave) {
        console.log('🎉 Calling onPlanSave callback');
        onPlanSave(savedPlan);
        // Don't set view mode or scroll - let the redirect handle navigation
      } else {
        // Only set view mode if no callback (standalone usage)
        setCurrentStep('view');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

    } catch (error) {
      console.error('Error generating meal plan:', error);
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      setError(error instanceof Error ? error.message : 'Failed to generate meal plan');
      setGenerationProgress(0);
    } finally {
      setIsGenerating(false);
      // Don't reset progress here - keep it at 100% to show completion
      // It will be reset when starting a new generation
    }
  }, [configuration, session, onPlanSave]);

  // Update meal
  const handleMealUpdate = useCallback(async (mealId: string, updates: Partial<Meal>) => {
    setOptimisticAction('Updating meal');
    
    // Optimistic update
    setMealPlan(prev => ({
      ...prev,
      meals: prev.meals.map(meal => 
        meal.id === mealId ? { ...meal, ...updates } : meal
      ),
    }));

    try {
      const response = await fetch(`/api/meals/${mealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update meal');
      }

      const updatedMeal = await response.json();
      
      // Update with actual server response
      setMealPlan(prev => ({
        ...prev,
        meals: prev.meals.map(meal => 
          meal.id === mealId ? updatedMeal : meal
        ),
      }));

    } catch (error) {
      console.error('Error updating meal:', error);
      
      // Revert optimistic update
      setMealPlan(prev => ({
        ...prev,
        meals: prev.meals.map(meal => 
          meal.id === mealId ? meal : meal
        ),
      }));
      
      setError('Failed to update meal');
    } finally {
      setOptimisticAction(null);
    }
  }, []);

  // Delete meal
  const handleMealDelete = useCallback(async (mealId: string) => {
    setOptimisticAction('Deleting meal');
    
    // Store for potential rollback
    const mealToDelete = mealPlan.meals.find(meal => meal.id === mealId);
    
    // Optimistic update
    setMealPlan(prev => ({
      ...prev,
      meals: prev.meals.filter(meal => meal.id !== mealId),
    }));

    try {
      const response = await fetch(`/api/meals/${mealId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }

    } catch (error) {
      console.error('Error deleting meal:', error);
      
      // Revert optimistic update
      if (mealToDelete) {
        setMealPlan(prev => ({
          ...prev,
          meals: [...prev.meals, mealToDelete],
        }));
      }
      
      setError('Failed to delete meal');
    } finally {
      setOptimisticAction(null);
    }
  }, [mealPlan.meals]);

  // Copy meal
  const handleMealCopy = useCallback(async (meal: Meal) => {
    setOptimisticAction('Copying meal');
    
    const copiedMeal: Meal = {
      ...meal,
      id: `temp-${Date.now()}`, // Temporary ID
      mealName: `${meal.mealName} (Copy)`,
    };

    // Optimistic update
    setMealPlan(prev => ({
      ...prev,
      meals: [...prev.meals, copiedMeal],
    }));

    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...meal,
          mealName: `${meal.mealName} (Copy)`,
          id: undefined, // Let server generate new ID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to copy meal');
      }

      const newMeal = await response.json();
      
      // Replace temporary meal with actual server response
      setMealPlan(prev => ({
        ...prev,
        meals: prev.meals.map(m => 
          m.id === copiedMeal.id ? newMeal : m
        ),
      }));

    } catch (error) {
      console.error('Error copying meal:', error);
      
      // Remove optimistic update
      setMealPlan(prev => ({
        ...prev,
        meals: prev.meals.filter(m => m.id !== copiedMeal.id),
      }));
      
      setError('Failed to copy meal');
    } finally {
      setOptimisticAction(null);
    }
  }, []);

  // Add new meal
  const handleAddMeal = useCallback(async (day: string, slot: string) => {
    setOptimisticAction('Adding meal');
    
    const newMeal: Meal = {
      id: `temp-${Date.now()}`,
      mealType: slot,
      mealName: `New ${slot.charAt(0).toUpperCase() + slot.slice(1)}`,
      day,
      slot,
      defenseSystems: [],
      servings: configuration.servings,
    };

    // Optimistic update
    setMealPlan(prev => ({
      ...prev,
      meals: [...prev.meals, newMeal],
    }));

    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newMeal,
          id: undefined,
          planId: mealPlan.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add meal');
      }

      const createdMeal = await response.json();
      
      // Replace temporary meal with actual server response
      setMealPlan(prev => ({
        ...prev,
        meals: prev.meals.map(m => 
          m.id === newMeal.id ? createdMeal : m
        ),
      }));

    } catch (error) {
      console.error('Error adding meal:', error);
      
      // Remove optimistic update
      setMealPlan(prev => ({
        ...prev,
        meals: prev.meals.filter(m => m.id !== newMeal.id),
      }));
      
      setError('Failed to add meal');
    } finally {
      setOptimisticAction(null);
    }
  }, [configuration.servings, mealPlan.id]);

  // Regenerate meal
  const handleRegenerateMeal = useCallback(async (mealId: string) => {
    setOptimisticAction('Regenerating meal');
    
    try {
      if (!mealPlan.id) {
        throw new Error('Meal plan must be saved before generating recipes');
      }

      const response = await fetch(`/api/meal-planner/${mealPlan.id}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mealId,
          forceRegenerate: true,
          customInstructions: configuration.customInstructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate meal');
      }

      const responseData = await response.json();
      
      // The API returns the generated recipe
      const generatedRecipe = responseData.data;
      
      setMealPlan(prev => ({
        ...prev,
        meals: prev.meals.map(meal => 
          meal.id === mealId 
            ? { 
                ...meal, 
                recipeGenerated: true, 
                recipeId: generatedRecipe.id 
              } 
            : meal
        ),
      }));

    } catch (error) {
      console.error('Error regenerating meal:', error);
      setError('Failed to regenerate meal');
    } finally {
      setOptimisticAction(null);
    }
  }, [configuration]);

  // Bulk regenerate day
  const handleBulkRegenerate = useCallback(async (day: string) => {
    setOptimisticAction(`Regenerating ${day}'s meals`);
    
    try {
      if (!mealPlan.id) {
        throw new Error('Meal plan must be saved before generating recipes');
      }

      // Get meals for the specific day
      const dayMeals = mealPlan.meals.filter(meal => meal.day === day);
      const mealIds = dayMeals.map(meal => meal.id);

      if (mealIds.length === 0) {
        throw new Error(`No meals found for ${day}`);
      }

      const response = await fetch(`/api/meal-planner/${mealPlan.id}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mealIds,
          batch: true,
          forceRegenerate: true,
          customInstructions: configuration.customInstructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate day');
      }

      const responseData = await response.json();
      
      // The batch API returns an array of recipe results
      const recipeResults = responseData.data || [];
      
      // Update meals with generated recipes
      setMealPlan(prev => ({
        ...prev,
        meals: prev.meals.map(meal => {
          if (meal.day !== day) return meal;
          
          const recipeResult = recipeResults.find((result: any) => 
            result.success && result.mealId === meal.id
          );
          
          if (recipeResult) {
            return {
              ...meal,
              recipeGenerated: true,
              recipeId: recipeResult.data?.id,
            };
          }
          return meal;
        }),
      }));

    } catch (error) {
      console.error('Error regenerating day:', error);
      setError('Failed to regenerate day');
    } finally {
      setOptimisticAction(null);
    }
  }, [mealPlan.id, configuration]);

  // Handle view recipe
  const handleViewRecipe = useCallback((recipeId: string) => {
    // Navigate to the recipe view page with returnUrl to come back to meal plan
    const returnUrl = `/meal-planner/${mealPlan.id}`;
    router.push(`/recipes/${recipeId}?returnUrl=${encodeURIComponent(returnUrl)}`);
  }, [router, mealPlan.id]);

  // Generate shopping list
  const handleGenerateShoppingList = useCallback(async () => {
    setOptimisticAction('Generating shopping list');
    
    try {
      if (!mealPlan.id) {
        throw new Error('Meal plan must be saved before generating shopping list');
      }

      const response = await fetch(`/api/meal-planner/${mealPlan.id}/shopping-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterPantry: false, // Could be made configurable
          includeNutrition: true, // Include nutrition data
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'NO_RECIPES') {
          throw new Error('Please generate recipes for your meals before creating a shopping list.');
        }
        throw new Error(errorData.error || 'Failed to generate shopping list');
      }

      const shoppingListData = await response.json();
      
      // Handle shopping list (could open modal, download PDF, etc.)
      console.log('Shopping list generated:', shoppingListData);
      
      // TODO: Display shopping list in modal or redirect to shopping list page
      alert(`Shopping list generated with ${shoppingListData.data?.items?.length || 0} items!`);
      
      // Trigger header refresh for shopping list status
      setShoppingListGenerated(prev => prev + 1);

    } catch (error) {
      console.error('Error generating shopping list:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate shopping list');
    } finally {
      setOptimisticAction(null);
    }
  }, [mealPlan.id]);

  // View existing shopping list
  const handleViewShoppingList = useCallback(async () => {
    if (!mealPlan.id) {
      setError('Meal plan must be saved before viewing shopping list');
      return;
    }

    try {
      // Check if shopping list exists
      const response = await fetch(`/api/meal-planner/${mealPlan.id}/shopping-list`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.data?.id) {
          // Navigate to the shopping list page
          router.push(`/shopping-lists/${data.data.id}`);
        } else {
          setError('No shopping list found for this meal plan');
        }
      } else {
        setError('Shopping list not found');
      }
    } catch (error) {
      console.error('Error viewing shopping list:', error);
      setError('Failed to view shopping list');
    }
  }, [mealPlan.id, router]);

  // Save plan
  const handleSavePlan = useCallback(async (updates: Partial<MealPlan>) => {
    setOptimisticAction('Saving plan');
    
    const updatedPlan = { ...mealPlan, ...updates };
    
    // Optimistic update
    setMealPlan(updatedPlan);

    try {
      let response;
      
      if (mealPlan.id) {
        // Update existing meal plan
        response = await fetch(`/api/meal-planner/${mealPlan.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });
      } else {
        // Create new meal plan
        response = await fetch('/api/meal-planner', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedPlan),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle meal plan limit error
        if (response.status === 403 && errorData.upgradeRequired) {
          throw new Error(errorData.message || 'Meal plan limit reached. Please upgrade to create more plans.');
        }
        
        throw new Error(errorData.error || 'Failed to save plan');
      }

      const saveData = await response.json();
      
      // Transform the nested structure to flat structure expected by frontend
      const rawPlan = saveData.data || saveData;
      const flattenedMeals: Meal[] = [];
      
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
              flattenedMeals.push({
                id: meal.id || `week${weekNumber}-${dayName}-${meal.mealType}`,
                mealName: meal.mealName || 'Unnamed Meal',
                mealType: meal.mealType || 'breakfast',
                day: dayName,
                slot: meal.mealType || 'breakfast',
                week: weekNumber,
                defenseSystems: meal.defenseSystems || [],
                prepTime: meal.prepTime ? (typeof meal.prepTime === 'string' ? parseInt(meal.prepTime) : meal.prepTime) : 30,
                cookTime: meal.cookTime ? (typeof meal.cookTime === 'string' ? parseInt(meal.cookTime) : meal.cookTime) : 0,
                servings: meal.servings || rawPlan.defaultServings || 2,
                recipeGenerated: !!meal.generatedRecipe,
                recipeId: meal.generatedRecipe?.id,
                customInstructions: meal.customInstructions,
              });
            });
          }
        });
      }

      const transformedSavedPlan: MealPlan = {
        ...rawPlan,
        meals: flattenedMeals,
      };
      
      setMealPlan(transformedSavedPlan);

      if (onPlanSave) {
        onPlanSave(transformedSavedPlan);
      }

    } catch (error) {
      console.error('Error saving plan:', error);
      setError('Failed to save plan');
      
      // Revert optimistic update
      setMealPlan(mealPlan);
    } finally {
      setOptimisticAction(null);
    }
  }, [mealPlan, onPlanSave]);

  // Share plan
  const handleSharePlan = useCallback(() => {
    if (onPlanShare) {
      onPlanShare(mealPlan);
    }
  }, [mealPlan, onPlanShare]);

  // Configuration step
  if (currentStep === 'configure') {
    return (
      <div className={cn('min-h-screen bg-gray-50', className)}>
        <PlanConfiguration
          configuration={configuration}
          onConfigurationChange={(updates) => 
            setConfiguration(prev => ({ ...prev, ...updates }))
          }
          onGenerate={handleGeneratePlan}
          isGenerating={isGenerating}
          className="py-8"
        />
        
        <GeneratingOverlay
          isVisible={isGenerating}
          message="Creating your personalized meal plan with AI-generated recipes..."
          progress={generationProgress}
        />
      </div>
    );
  }

  // Error state
  if (error && (!mealPlan.meals || !mealPlan.meals.length)) {
    return (
      <div className={cn('min-h-screen bg-gray-50 flex items-center justify-center', className)}>
        <ErrorState
          message={error}
          onRetry={() => {
            setError(null);
            handleGeneratePlan();
          }}
        />
      </div>
    );
  }

  // Empty state
  if ((!mealPlan.meals || !mealPlan.meals.length) && !isGenerating) {
    return (
      <div className={cn('min-h-screen bg-gray-50 flex items-center justify-center', className)}>
        <EmptyState
          title="No meals planned yet"
          description="Start by configuring your meal plan preferences and generating your first weekly plan."
          action={{
            label: 'Create Meal Plan',
            onClick: () => setCurrentStep('configure'),
          }}
        />
      </div>
    );
  }

  // Main view
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className={cn(
          'mx-auto px-4 sm:px-6 lg:px-8',
          isMobile ? 'max-w-full' : isTablet ? 'max-w-4xl' : 'max-w-7xl'
        )}>
          <MealPlanHeader
            mealPlan={{
              ...mealPlan,
              weekStart: mealPlan.weekStart ? new Date(mealPlan.weekStart) : (() => {
                const start = new Date();
                start.setDate(start.getDate() - start.getDay() + 1); // Monday of current week
                return start;
              })(),
              weekEnd: mealPlan.weekEnd ? new Date(mealPlan.weekEnd) : (() => {
                const end = new Date();
                end.setDate(end.getDate() - end.getDay() + 7); // Sunday of current week
                return end;
              })(),
              defaultServings: mealPlan.defaultServings || 4,
            }}
            isEditing={currentStep === 'edit'}
            isSaving={optimisticAction === 'saving'}
            isGeneratingShoppingList={optimisticAction === 'shopping-list'}
            onSave={() => handleSavePlan({})}
            onUpdate={(updates) => handleSavePlan(updates)}
            onGenerateShoppingList={handleGenerateShoppingList}
            onViewShoppingList={handleViewShoppingList}
            onShoppingListGenerated={shoppingListGenerated}
            onNewPlan={() => {
              // Reset to configuration step to start a new meal plan
              setCurrentStep('configure');
              setMealPlan({
                title: '',
                description: '',
                meals: [],
                weekStart: new Date(),
                weekEnd: new Date(),
                defaultServings: 4,
                visibility: 'PRIVATE',
                tags: [],
              });
              setConfiguration({
                dietaryRestrictions: [],
                focusSystems: [],
                duration: 1,
                title: '',
                description: '',
                servings: 4,
                customInstructions: '',
                visibility: 'PRIVATE',
                tags: [],
              });
              setGenerationProgress(0);
            }}
            onShare={handleSharePlan}
            onExportPDF={() => {}} // TODO: Implement PDF export
          />
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        'mx-auto py-6',
        isMobile ? 'px-4 max-w-full' : isTablet ? 'px-6 max-w-4xl' : 'px-8 max-w-7xl'
      )}>
        {isGenerating ? (
          <WeekViewSkeleton />
        ) : (
          <MealPlanView
            meals={mealPlan.meals}
            duration={mealPlan.durationWeeks || mealPlan.duration || configuration.duration || 1}
            onMealUpdate={handleMealUpdate}
            onMealDelete={handleMealDelete}
            onMealCopy={handleMealCopy}
            onAddMeal={handleAddMeal}
            onRegenerateMeal={handleRegenerateMeal}
            onViewRecipe={handleViewRecipe}
            onGenerateShoppingList={handleGenerateShoppingList}
            onBulkRegenerate={handleBulkRegenerate}
            isGenerating={isGenerating}
          />
        )}
      </div>

      {/* Overlays */}
      <OptimisticUpdate
        isVisible={!!optimisticAction}
        action={optimisticAction || ''}
      />

      {/* Error display */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="text-red-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}