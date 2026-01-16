'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { DefenseSystem, Meal } from '@/types';
import SystemSelector from './SystemSelector';
import MealCard from './MealCard';
import ShareMenu from './ShareMenu';
import MealPlanHeader from './MealPlanHeader';
import PlanConfiguration from './PlanConfiguration';
import MealPlanView from './MealPlanView';
import AddMealModal from './AddMealModal';
import { ConfirmDialog } from '@/components/ui/DialogComponents';
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
  initialParams?: {
    targetSystems?: DefenseSystem[];
    dietaryRestrictions?: string[];
    duration?: number;
  };
  fromRecommendation?: boolean;
}

export default function EnhancedMealPlanner({
  className = '',
  onPlanSave,
  onPlanShare,
  initialPlan,
  initialParams,
  fromRecommendation = false,
}: EnhancedMealPlannerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();

  // Main state
  const [currentStep, setCurrentStep] = useState<'configure' | 'view' | 'edit'>('configure');
  const [isGenerating, setIsGenerating] = useState(false);
  const [optimisticAction, setOptimisticAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Shopping List Dialog states
  const [shoppingListDialog, setShoppingListDialog] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm' | 'info';
    title: string;
    message: string;
    shoppingListId?: string;
    itemCount?: number;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  // Save/Update Dialog states
  const [saveDialog, setSaveDialog] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    mealPlanId?: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  // Configuration state
  const [configuration, setConfiguration] = useState<ConfigurationData>({
    title: initialPlan?.title || '',
    description: initialPlan?.description || '',
    servings: 4,
    duration: (initialPlan?.duration as 1 | 2 | 3 | 4) || (initialParams?.duration as 1 | 2 | 3 | 4) || 1,
    dietaryRestrictions: initialParams?.dietaryRestrictions || [],
    focusSystems: initialParams?.targetSystems || [],
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
  const [loggedDates, setLoggedDates] = useState<Set<string>>(new Set());
  const [shoppingListGenerated, setShoppingListGenerated] = useState(0); // Counter to trigger refresh

  // Meal type selector state
  const [showMealTypeSelector, setShowMealTypeSelector] = useState(false);
  const [pendingMealAdd, setPendingMealAdd] = useState<{ day: string; slot: string; week?: number } | null>(null);

  // Load user preferences and initialize plan
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          if (data.preferences) {
            // Only update configuration if not overridden by initialParams or initialPlan
            setConfiguration(prev => ({
              ...prev,
              servings: initialPlan?.defaultServings || data.preferences.defaultServings || 4,
              dietaryRestrictions: initialParams?.dietaryRestrictions || initialPlan ? prev.dietaryRestrictions : data.preferences.defaultDietaryRestrictions || [],
              focusSystems: initialParams?.targetSystems || initialPlan ? prev.focusSystems : data.preferences.defaultFocusSystems || [],
            }));
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadUserPreferences();

    if (initialPlan) {
      setCurrentStep('view');
      setMealPlan(initialPlan);
      setConfiguration({
        title: initialPlan.title,
        description: initialPlan.description,
        servings: initialPlan.defaultServings || 4,
        duration: (initialPlan.duration as 1 | 2 | 3 | 4) || 1,
        dietaryRestrictions: [], // Could be derived from meals
        focusSystems: [], // Could be derived from meals
        customInstructions: '',
        visibility: initialPlan.visibility,
        tags: initialPlan.tags,
      });
    }
  }, [initialPlan, initialParams]);

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
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
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
      
      console.log(`🔍 [handleGenerateMealPlan] Received savedPlan:`, savedPlan);
      console.log(`🔍 [handleGenerateMealPlan] dailyMenus count: ${savedPlan.dailyMenus?.length || 0}`);
      
      if (savedPlan.dailyMenus) {
        // Sort daily menus by date to ensure correct day mapping
        const sortedDailyMenus = savedPlan.dailyMenus.sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        console.log(`🔍 [handleGenerateMealPlan] Sorted dailyMenus:`, sortedDailyMenus.map((dm: any) => ({ date: dm.date, mealsCount: dm.meals?.length })));
        
        sortedDailyMenus.forEach((dailyMenu: any, dayIndex: number) => {
          if (dailyMenu.meals && Array.isArray(dailyMenu.meals)) {
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            // Use the actual date from the dailyMenu to determine the day
            const menuDate = new Date(dailyMenu.date);
            const dayOfWeek = menuDate.getDay(); // 0=Sunday, 1=Monday, etc.
            const dayName = dayNames[dayOfWeek] || 'monday';
            // Calculate week number based on position in the meal plan
            const weekNumber = Math.floor(dayIndex / 7) + 1;
            
            console.log(`🔍 [handleGenerateMealPlan] Processing ${dayName} (index ${dayIndex}, week ${weekNumber})`);
            console.log(`🔍 [handleGenerateMealPlan] ${dailyMenu.meals.length} meals:`, dailyMenu.meals.map((m: any) => ({ name: m.mealName, type: m.mealType })));
            
            dailyMenu.meals.forEach((meal: any) => {
              const transformedMeal = {
                id: meal.id || `week${weekNumber}-${dayName}-${meal.mealType}`,
                mealName: meal.mealName || 'Unnamed Meal',
                mealType: meal.mealType || 'breakfast',
                day: dayName,
                week: weekNumber,
                slot: meal.mealType ? meal.mealType.toLowerCase() : 'breakfast',
                defenseSystems: meal.defenseSystems || [],
              };
              console.log(`🔍 [handleGenerateMealPlan] Transformed:`, transformedMeal);
              flattenedMeals.push(transformedMeal as any);
              transformedMeal.prepTime = meal.prepTime ? (typeof meal.prepTime === 'string' ? parseInt(meal.prepTime) : meal.prepTime) : 30;
              transformedMeal.cookTime = meal.cookTime ? (typeof meal.cookTime === 'string' ? parseInt(meal.cookTime) : meal.cookTime) : 0;
              transformedMeal.servings = meal.servings || savedPlan.defaultServings || 2;
              transformedMeal.recipeGenerated = !!meal.generatedRecipe;
              transformedMeal.recipeId = meal.generatedRecipe?.id;
              transformedMeal.customInstructions = meal.customInstructions;
            });
          }
        });
      }

      console.log(`🎯 [handleGenerateMealPlan] Total flattened meals: ${flattenedMeals.length}`);
      console.log(`🎯 [handleGenerateMealPlan] Sample meals:`, flattenedMeals.slice(0, 3));

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
    
    // Store original meal for potential rollback
    const originalMeal = mealPlan.meals.find(m => m.id === mealId);
    
    // Optimistic update - preserve all fields, only update what's changed
    setMealPlan(prev => ({
      ...prev,
      meals: prev.meals.map(meal => 
        meal.id === mealId ? { ...meal, ...updates } : meal
      ),
    }));

    try {
      // Server expects PATCH to /api/meals with body { mealId, updates }
      const response = await fetch(`/api/meals`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mealId, updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update meal');
      }

      const updatedMeal = await response.json();
      
      // Update with actual server response (includes day, slot, week from server)
      setMealPlan(prev => ({
        ...prev,
        meals: prev.meals.map(meal => 
          meal.id === mealId ? updatedMeal : meal
        ),
      }));

    } catch (error) {
      console.error('Error updating meal:', error);
      
      // Revert optimistic update to original state
      if (originalMeal) {
        setMealPlan(prev => ({
          ...prev,
          meals: prev.meals.map(meal => 
            meal.id === mealId ? originalMeal : meal
          ),
        }));
      }
      
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
      // Server expects DELETE to /api/meals?mealId=<id>
      const response = await fetch(`/api/meals?mealId=${encodeURIComponent(mealId)}`, {
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
  const handleAddMeal = useCallback(async (day: string, slot: string, mealType?: string, week?: number) => {
    // If no mealType provided, show selector
    if (!mealType) {
      setPendingMealAdd({ day, slot, week });
      setShowMealTypeSelector(true);
      return;
    }

    setOptimisticAction('Adding meal');
    
    const newMeal: Meal = {
      id: `temp-${Date.now()}`,
      mealType: mealType,
      mealName: `New ${ mealType.charAt(0).toUpperCase() + mealType.slice(1) }`,
      day,
      slot,
      week: week || 1,
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

  // Handle meal type selection from modal
  const handleMealTypeSelected = useCallback((selectedMealType: string, selectedSlot: string) => {
    setShowMealTypeSelector(false);
    if (pendingMealAdd) {
      handleAddMeal(pendingMealAdd.day, selectedSlot, selectedMealType, pendingMealAdd.week);
      setPendingMealAdd(null);
    }
  }, [pendingMealAdd, handleAddMeal]);

  const handleMealTypeSelectorCancel = useCallback(() => {
    setShowMealTypeSelector(false);
    setPendingMealAdd(null);
  }, []);  // Regenerate meal
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
        setShoppingListDialog({
          isOpen: true,
          type: 'error',
          title: 'Save Required',
          message: 'Please save your meal plan before generating a shopping list.',
        });
        return;
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
          setShoppingListDialog({
            isOpen: true,
            type: 'error',
            title: 'No Recipes Found',
            message: 'Please generate recipes for your meals before creating a shopping list.',
          });
        } else {
          setShoppingListDialog({
            isOpen: true,
            type: 'error',
            title: 'Generation Failed',
            message: errorData.error || 'Failed to generate shopping list. Please try again.',
          });
        }
        return;
      }

      const shoppingListData = await response.json();
      const itemCount = shoppingListData.data?.items?.length || 0;
      const listId = shoppingListData.data?.id || shoppingListData.id;
      
      // Show success dialog
      setShoppingListDialog({
        isOpen: true,
        type: 'success',
        title: 'Shopping List Created!',
        message: `Your shopping list has been generated with ${itemCount} item${itemCount !== 1 ? 's' : ''}. Would you like to view it now?`,
        shoppingListId: listId,
        itemCount,
      });
      
      // Trigger header refresh for shopping list status
      setShoppingListGenerated(prev => prev + 1);

    } catch (error) {
      console.error('Error generating shopping list:', error);
      setShoppingListDialog({
        isOpen: true,
        type: 'error',
        title: 'Unexpected Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred while generating the shopping list.',
      });
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
      const isUpdate = !!mealPlan.id;
      let response;
      
      if (isUpdate) {
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
          setSaveDialog({
            isOpen: true,
            type: 'error',
            title: 'Meal Plan Limit Reached',
            message: errorData.message || 'You have reached your meal plan limit. Please upgrade to create more plans.',
          });
          // Revert optimistic update
          setMealPlan(mealPlan);
          return;
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
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            // Use the actual date from the dailyMenu to determine the day
            const menuDate = new Date(dailyMenu.date);
            const dayOfWeek = menuDate.getDay(); // 0=Sunday, 1=Monday, etc.
            const dayName = dayNames[dayOfWeek] || 'monday';
            // Calculate week number based on position in the meal plan
            const weekNumber = Math.floor(dayIndex / 7) + 1;
            
            console.log(`🔍 [handleSaveMealPlan] Processing dailyMenu for ${dayName} (date: ${dailyMenu.date}, dayOfWeek: ${dayOfWeek})`);
            console.log(`🔍 [handleSaveMealPlan] ${dailyMenu.meals.length} meals in this day:`, dailyMenu.meals.map((m: any) => ({ name: m.mealName, type: m.mealType })));
            
            dailyMenu.meals.forEach((meal: any) => {
              const transformedMeal = {
                id: meal.id || `week${weekNumber}-${dayName}-${meal.mealType}`,
                mealName: meal.mealName || 'Unnamed Meal',
                mealType: meal.mealType || 'breakfast',
                day: dayName,
                slot: meal.mealType ? meal.mealType.toLowerCase() : 'breakfast',
                week: weekNumber,
                defenseSystems: meal.defenseSystems || [],
              };
              console.log(`🔍 [handleSaveMealPlan] Transformed meal:`, transformedMeal);
              flattenedMeals.push(transformedMeal as any);
              transformedMeal.prepTime = meal.prepTime ? (typeof meal.prepTime === 'string' ? parseInt(meal.prepTime) : meal.prepTime) : 30;
              transformedMeal.cookTime = meal.cookTime ? (typeof meal.cookTime === 'string' ? parseInt(meal.cookTime) : meal.cookTime) : 0;
              transformedMeal.servings = meal.servings || rawPlan.defaultServings || 2;
              transformedMeal.recipeGenerated = !!meal.generatedRecipe;
              transformedMeal.recipeId = meal.generatedRecipe?.id;
              transformedMeal.customInstructions = meal.customInstructions;
            });
          }
        });
      }

      console.log(`🎯 [handleSaveMealPlan] Total flattened meals: ${flattenedMeals.length}`);
      console.log(`🎯 [handleSaveMealPlan] Meals by day:`, flattenedMeals.reduce((acc: any, m: any) => {
        acc[m.day] = (acc[m.day] || 0) + 1;
        return acc;
      }, {}));

      const transformedSavedPlan: MealPlan = {
        ...rawPlan,
        meals: flattenedMeals,
      };
      
      console.log(`✅ [handleSaveMealPlan] Setting meal plan with ${transformedSavedPlan.meals.length} meals`);
      
      setMealPlan(transformedSavedPlan);

      if (onPlanSave) {
        onPlanSave(transformedSavedPlan);
      }

      // Show success dialog
      const mealCount = flattenedMeals.length;
      setSaveDialog({
        isOpen: true,
        type: 'success',
        title: isUpdate ? 'Meal Plan Updated!' : 'Meal Plan Saved!',
        message: isUpdate 
          ? `Your meal plan "${transformedSavedPlan.title}" has been successfully updated with ${mealCount} meal${mealCount !== 1 ? 's' : ''}.`
          : `Your meal plan "${transformedSavedPlan.title}" has been successfully saved with ${mealCount} meal${mealCount !== 1 ? 's' : ''}.`,
        mealPlanId: transformedSavedPlan.id,
      });

    } catch (error) {
      console.error('Error saving plan:', error);
      
      // Show error dialog
      setSaveDialog({
        isOpen: true,
        type: 'error',
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred while saving your meal plan. Please try again.',
      });
      
      // Revert optimistic update
      setMealPlan(mealPlan);
    } finally {
      setOptimisticAction(null);
    }
  }, [mealPlan, onPlanSave]);

  // Log meal plan
  const handleLogMealPlan = useCallback(async () => {
    if (!mealPlan.id) {
      setShoppingListDialog({
        isOpen: true,
        type: 'error',
        title: 'Save Required',
        message: 'Please save the meal plan first',
      });
      return;
    }

    // Show confirmation dialog
    setShoppingListDialog({
      isOpen: true,
      type: 'success',
      title: 'Log Meal Plan',
      message: 'This will log all meals with recipes from your meal plan to track your progress. This helps you monitor your adherence to your wellness goals!',
      onConfirm: async () => {
        setShoppingListDialog({ isOpen: false, type: 'info', title: '', message: '' });
        setOptimisticAction('logging');
        
        try {
          console.log('🔍 [EnhancedMealPlanner] Logging meal plan:', mealPlan.id);
          console.log('🔍 [EnhancedMealPlanner] Meals in plan:', mealPlan.meals.length);
          console.log('🔍 [EnhancedMealPlanner] Meals with recipes:', mealPlan.meals.filter(m => m.recipeGenerated).length);
          
          const response = await fetch('/api/meal-planner/log-week-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mealPlanId: mealPlan.id }),
          });

          const result = await response.json();
          console.log('🔍 [EnhancedMealPlanner] Log result:', result);

          if (!response.ok) {
            throw new Error(result.message || 'Failed to log meal plan');
          }

          if (result.logged > 0) {
            // Close dialog first, then redirect to progress page
            setShoppingListDialog({ isOpen: false, type: 'info', title: '', message: '' });
            setOptimisticAction(null);
            
            // Small delay to ensure dialog closes before redirect
            setTimeout(() => {
              router.push('/progress');
            }, 100);
          } else {
            setShoppingListDialog({
              isOpen: true,
              type: 'error',
              title: 'No Meals Logged',
              message: result.message || 'No meals were logged. Make sure you have generated recipes for your meals.',
            });
            setOptimisticAction(null);
          }
        } catch (error) {
          console.error('Error logging meal plan:', error);
          setShoppingListDialog({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: error instanceof Error ? error.message : 'Failed to log meal plan',
          });
          setOptimisticAction(null);
        }
      },
      onCancel: () => {
        setShoppingListDialog({ isOpen: false, type: 'info', title: '', message: '' });
      },
    });
  }, [mealPlan.id, mealPlan.meals]);

  // Share plan
  const handleSharePlan = useCallback(() => {
    if (onPlanShare) {
      onPlanShare(mealPlan);
    }
  }, [mealPlan, onPlanShare]);

  // Fetch logged dates for this meal plan
  useEffect(() => {
    const fetchLoggedDates = async () => {
      if (!mealPlan.id) return;

      try {
        const response = await fetch(`/api/meal-planner/${mealPlan.id}/logged-dates`);
        if (response.ok) {
          const data = await response.json();
          setLoggedDates(new Set(data.loggedDates || []));
        }
      } catch (error) {
        console.error('Error fetching logged dates:', error);
      }
    };

    fetchLoggedDates();
  }, [mealPlan.id]);

  // Configuration step
  if (currentStep === 'configure') {
    return (
      <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
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
      <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center', className)}>
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
      <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center', className)}>
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
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
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
            isLoggingPlan={optimisticAction === 'logging'}
            mealsWithRecipes={mealPlan.meals.filter(m => m.recipeGenerated).length}
            totalMeals={mealPlan.meals.length}
            onSave={() => handleSavePlan({})}
            onUpdate={(updates) => handleSavePlan(updates)}
            onGenerateShoppingList={handleGenerateShoppingList}
            onViewShoppingList={handleViewShoppingList}
            onShoppingListGenerated={shoppingListGenerated}
            onLogMealPlan={handleLogMealPlan}
            onNewPlan={() => {
              // Redirect to main meal planner page to create a new plan
              router.push('/meal-planner');
            }}
            onShare={handleSharePlan}
            onExportPDF={() => {}} // TODO: Implement PDF export
          />
        </div>
      </div>

      {/* Guidance Banner */}
      {mealPlan.id && mealPlan.meals.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className={cn(
            'mx-auto px-4 sm:px-6 lg:px-8 py-4',
            isMobile ? 'max-w-full' : isTablet ? 'max-w-4xl' : 'max-w-7xl'
          )}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <span className="text-lg">💡</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Complete Your Meal Plan
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {mealPlan.meals.filter(m => m.recipeGenerated).length === 0 ? (
                    <>Generate recipes for your meals by clicking the "+" button on each meal card, then use the <strong>Log Plan</strong> button above to track your progress.</>
                  ) : mealPlan.meals.filter(m => m.recipeGenerated).length < mealPlan.meals.length ? (
                    <>You have <strong>{mealPlan.meals.filter(m => m.recipeGenerated).length}/{mealPlan.meals.length} meals</strong> with recipes. Generate the remaining recipes, then click <strong>Log Plan</strong> to track them.</>
                  ) : (
                    <>🎉 All meals have recipes! Click <strong>Log Plan ({mealPlan.meals.filter(m => m.recipeGenerated).length})</strong> above to track your meals and monitor your progress.</>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    {mealPlan.meals.filter(m => m.recipeGenerated).length} with recipes
                  </span>
                  {mealPlan.meals.filter(m => !m.recipeGenerated).length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-orange-400 dark:border-orange-500"></span>
                      {mealPlan.meals.filter(m => !m.recipeGenerated).length} need recipes
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            weekStart={mealPlan.weekStart}
            loggedDates={loggedDates}
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

      {/* Meal Add Modal */}
      {showMealTypeSelector && pendingMealAdd && (
        <AddMealModal
          currentSlot={pendingMealAdd.slot}
          onSelect={handleMealTypeSelected}
          onCancel={handleMealTypeSelectorCancel}
        />
      )}

      {/* Error display */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="text-red-500 dark:text-red-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shopping List Dialog */}
      <ConfirmDialog
        isOpen={shoppingListDialog.isOpen}
        onClose={() => {
          if (shoppingListDialog.onCancel) {
            shoppingListDialog.onCancel();
          } else {
            setShoppingListDialog({ ...shoppingListDialog, isOpen: false });
          }
        }}
        onConfirm={() => {
          if (shoppingListDialog.onConfirm) {
            shoppingListDialog.onConfirm();
          } else if (shoppingListDialog.type === 'success' && shoppingListDialog.shoppingListId) {
            router.push(`/shopping-lists/${shoppingListDialog.shoppingListId}`);
            setShoppingListDialog({ ...shoppingListDialog, isOpen: false });
          } else {
            setShoppingListDialog({ ...shoppingListDialog, isOpen: false });
          }
        }}
        title={shoppingListDialog.title}
        message={shoppingListDialog.message}
        confirmText={
          shoppingListDialog.type === 'success' && shoppingListDialog.shoppingListId ? 'View Shopping List' :
          shoppingListDialog.type === 'success' && shoppingListDialog.onConfirm ? 'Log Meals' :
          shoppingListDialog.type === 'confirm' ? 'Continue' :
          'OK'
        }
        cancelText={
          (shoppingListDialog.type === 'success' || shoppingListDialog.type === 'confirm') ? 'Cancel' : 
          undefined
        }
        type={shoppingListDialog.type === 'success' ? 'success' : shoppingListDialog.type === 'error' ? 'danger' : 'info'}
        icon={shoppingListDialog.type === 'success' && shoppingListDialog.onConfirm ? <CheckCircle2 className="w-6 h-6" /> : undefined}
      />

      {/* Save/Update Dialog */}
      <ConfirmDialog
        isOpen={saveDialog.isOpen}
        onClose={() => setSaveDialog({ ...saveDialog, isOpen: false })}
        onConfirm={() => {
          setSaveDialog({ ...saveDialog, isOpen: false });
        }}
        title={saveDialog.title}
        message={saveDialog.message}
        confirmText="OK"
        type={saveDialog.type === 'success' ? 'success' : 'danger'}
      />
    </div>
  );
}