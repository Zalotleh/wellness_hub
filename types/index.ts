// Type definitions for the Wellness Hub application

// Base types
export type Rating = {
  id: string;
  value: number;
  recipeId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Comment = {
  id: string;
  content: string;
  recipeId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

// Defense System enum
export enum DefenseSystem {
  ANGIOGENESIS = 'ANGIOGENESIS',
  REGENERATION = 'REGENERATION',
  MICROBIOME = 'MICROBIOME',
  DNA_PROTECTION = 'DNA_PROTECTION',
  IMMUNITY = 'IMMUNITY'
}

// New enums for progress tracking redesign
export enum MealTime {
  BREAKFAST = 'BREAKFAST',
  MORNING_SNACK = 'MORNING_SNACK',
  LUNCH = 'LUNCH',
  AFTERNOON_SNACK = 'AFTERNOON_SNACK',
  DINNER = 'DINNER',
  EVENING_SNACK = 'EVENING_SNACK',
  CUSTOM = 'CUSTOM'
}

export enum ConsumptionSource {
  MANUAL = 'MANUAL',
  RECIPE = 'RECIPE',
  MEAL_PLAN = 'MEAL_PLAN'
}

export enum BenefitStrength {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

// Extended Recipe type with relations
export type RecipeWithRelations = {
  id: string;
  title: string;
  description: string | null;
  ingredients: any[];
  instructions: string[];
  prepTime: string | null;
  cookTime: string | null;
  servings: number | null;
  defenseSystems: DefenseSystem[];
  nutrients: any;
  imageUrl: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  ratings: {
    id: string;
    value: number;
    recipeId: string;
    userId: string;
    createdAt: Date;
  }[];
  comments: {
    id: string;
    content: string;
    recipeId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }[];
  _count: {
    comments: number;
    favorites: number;
  };
  averageRating?: number;
  isFavorited?: boolean;
};

// Recipe form data
export interface RecipeFormData {
  title: string;
  description?: string;
  ingredients: { name: string; quantity: string; unit: string }[];
  instructions: string;
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  defenseSystems: DefenseSystem[];
  nutrients?: Record<string, string>;
  imageUrl?: string;
}

// Progress tracking types
export interface DailyProgress {
  date: Date;
  systems: {
    [key in DefenseSystem]: {
      foods: string[];
      count: number;
      target: number;
      percentage: number;
    };
  };
  totalCompletion: number;
}

export interface WeeklyProgress {
  startDate: Date;
  endDate: Date;
  dailyProgress: DailyProgress[];
  systemAverages: {
    [key in DefenseSystem]: number;
  };
  overallCompletion: number;
}

// Progress log entry
export interface ProgressLogEntry {
  defenseSystem: DefenseSystem;
  foods: string[];
  date?: Date;
  notes?: string;
}

// Defense system info
export interface DefenseSystemInfo {
  id: string;
  name: DefenseSystem;
  displayName: string;
  icon: string;
  description: string;
  keyFoods: string[];
  nutrients: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

// User session type extension
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Search and filter types
export interface RecipeFilters {
  system?: DefenseSystem;
  search?: string;
  userId?: string;
  sortBy?: 'recent' | 'popular' | 'rating';
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Meal planner types
export interface Meal {
  id: string;
  mealType: string;
  mealName: string;
  day: string;
  week?: number; // Week number for multi-week plans (1-4)
  slot: string;
  defenseSystems: DefenseSystem[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  recipeGenerated?: boolean;
  recipeId?: string;
  customInstructions?: string;
  ingredients?: string[];
  instructions?: string[];
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  defenseSystems: DefenseSystem[];
  nutrients?: Record<string, any>;
  imageUrl?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
// ============================================
// NEW TYPES FOR PROGRESS TRACKING REDESIGN
// ============================================

// Food consumption entry with meal timing
export interface FoodConsumption {
  id: string;
  userId: string;
  date: Date;
  mealTime: MealTime;
  timeConsumed?: Date | null;
  sourceType: ConsumptionSource;
  recipeId?: string | null;
  mealId?: string | null;
  mealPlanId?: string | null;
  servings: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  foodItems?: FoodItem[];
}

// Individual food item with multi-system tracking
export interface FoodItem {
  id: string;
  consumptionId: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  defenseSystems?: DefenseSystemBenefit[];
}

// Defense system benefit with strength
export interface DefenseSystemBenefit {
  id: string;
  foodItemId: string;
  defenseSystem: DefenseSystem;
  strength: BenefitStrength;
}

// Food database entry
export interface FoodDatabaseEntry {
  id: string;
  name: string;
  category: string;
  defenseSystems: DefenseSystem[];
  nutrients: string[];
  description?: string | null;
  systemBenefits: Record<DefenseSystem, BenefitStrength>;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced daily progress with all 3 dimensions
export interface DailyProgress5x5x5 {
  date: Date;
  
  // Dimension 1: Defense Systems (5 systems)
  systemProgress: {
    [key in DefenseSystem]: {
      foodCount: number;
      uniqueFoods: string[];
      target: number;
      percentage: number;
      topFoods: Array<{
        name: string;
        count: number;
        benefitStrength: BenefitStrength;
      }>;
    };
  };
  
  // Dimension 2: Food Variety (5 foods per system)
  foodVariety: {
    totalUniqueFoods: number;
    totalFoodServings: number;
    foodsBySystem: {
      [key in DefenseSystem]: string[];
    };
  };
  
  // Dimension 3: Meal Frequency (5 times per day)
  mealFrequency: {
    mealsConsumed: number;
    target: number;
    percentage: number;
    mealTimes: Array<{
      mealTime: MealTime;
      timeConsumed: Date | null;
      foods: string[];
      defenseSystems: DefenseSystem[];
      sourceType: ConsumptionSource;
    }>;
    missedMealTimes: MealTime[];
  };
  
  // Overall 5x5x5 score
  overall: {
    systemsComplete: number;
    foodsPerSystemAvg: number;
    mealsConsumed: number;
    overallPercentage: number;
    streak: number;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';
  };
}

// Weekly progress summary
export interface WeeklyProgress5x5x5 {
  startDate: Date;
  endDate: Date;
  dailySummaries: DailyProgress5x5x5[];
  weeklyAverages: {
    avgSystemCompletion: number;
    avgFoodsPerDay: number;
    avgMealsPerDay: number;
    bestDay: Date;
    worstDay: Date;
  };
  systemTrends: {
    [key in DefenseSystem]: {
      avgCompletion: number;
      trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
      daysCompleted: number;
    };
  };
  achievements: Array<{
    type: string;
    description: string;
    earnedAt: Date;
  }>;
}

// Food recommendation
export interface FoodRecommendation {
  food: string;
  systems: DefenseSystem[];
  systemBenefits: Partial<Record<DefenseSystem, BenefitStrength>>;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  nutrients: string[];
}

// Mark recipe as consumed request
export interface MarkRecipeConsumedRequest {
  recipeId: string;
  date: string;
  mealTime: MealTime;
  servings?: number;
  notes?: string;
}

// Sync meal plan request
export interface SyncMealPlanRequest {
  mealPlanId: string;
  syncType: 'DAY' | 'WEEK' | 'FULL_PLAN';
  startDate?: string;
  endDate?: string;
  markAllConsumed?: boolean;
}