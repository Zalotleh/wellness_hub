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