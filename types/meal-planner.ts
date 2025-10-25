// types/meal-planner.ts
import { DefenseSystem } from './index';

export interface MealPlan {
  id: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  meals: WeeklyMeals;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyMeals {
  monday: DayMeals;
  tuesday: DayMeals;
  wednesday: DayMeals;
  thursday: DayMeals;
  friday: DayMeals;
  saturday: DayMeals;
  sunday: DayMeals;
}

export interface DayMeals {
  breakfast?: PlannedMeal;
  lunch?: PlannedMeal;
  dinner?: PlannedMeal;
  snacks?: PlannedMeal[];
}

export interface PlannedMeal {
  id: string;
  recipeId?: string;
  recipeName: string;
  defenseSystems: DefenseSystem[];
  notes?: string;
  prepTime?: string;
  servings?: number;
}

export interface MealPlannerFilters {
  dietaryRestrictions?: string[];
  maxPrepTime?: number;
  focusSystems?: DefenseSystem[];
}