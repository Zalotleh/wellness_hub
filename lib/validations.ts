import { z } from 'zod';
import { DefenseSystem, MealTime, ConsumptionSource } from '@prisma/client';
import { isValidUnit } from '@/lib/constants/measurement-units';

// Recipe validation schema
export const recipeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  ingredients: z.array(
    z.object({
      name: z.string().min(1, 'Ingredient name required'),
      quantity: z.string().min(1, 'Quantity required'),
      unit: z.string().min(1, 'Unit required').refine((unit) => isValidUnit(unit), {
        message: 'Invalid measurement unit',
      }),
    })
  ).min(1, 'At least one ingredient required'),
  instructions: z.string().min(20, 'Instructions must be at least 20 characters'),
  prepTime: z.string().optional(),
  cookTime: z.string().optional(),
  servings: z.number().int().positive().optional(),
  defenseSystems: z.array(z.nativeEnum(DefenseSystem)).min(1, 'Please select at least one defense system'),
  nutrients: z.record(z.string()).optional(),
  imageUrl: z.union([
    z.string().url('Invalid image URL'), // Full URLs (https://...)
    z.string().startsWith('/uploads/', 'Invalid image path'), // Local uploads (/uploads/...)
    z.literal('') // Empty string
  ]).optional(),
});

export type RecipeSchemaType = z.infer<typeof recipeSchema>;

// Progress validation schema
export const progressSchema = z.object({
  defenseSystem: z.nativeEnum(DefenseSystem),
  foods: z.array(z.string().min(1)).min(1).max(5, 'Maximum 5 foods per system'),
  date: z.string().datetime().or(z.date()).optional(),
  notes: z.string().max(500).optional(),
});

export type ProgressSchemaType = z.infer<typeof progressSchema>;

// Rating validation schema
export const ratingSchema = z.object({
  recipeId: z.string().cuid(),
  value: z.number().int().min(1).max(5),
});

export type RatingSchemaType = z.infer<typeof ratingSchema>;

// Comment validation schema
export const commentSchema = z.object({
  recipeId: z.string().cuid(),
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
});

export type CommentSchemaType = z.infer<typeof commentSchema>;

// User registration schema
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  measurementSystem: z.enum(['imperial', 'metric']).default('imperial'),
  language: z.string().default('en'),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms of Service and Privacy Policy',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegisterSchemaType = z.infer<typeof registerSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;

// User profile update schema
export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  image: z.string().url().optional(),
});

export type ProfileUpdateSchemaType = z.infer<typeof profileUpdateSchema>;

// ============================================
// NEW 5x5x5 PROGRESS TRACKING SCHEMAS
// ============================================

// Food consumption validation schema
export const foodConsumptionSchema = z.object({
  mealTime: z.nativeEnum(MealTime),
  customMealName: z.string().max(50).optional(),
  foodItems: z.array(
    z.object({
      name: z.string().min(1, 'Food name required'),
      portion: z.string().optional(),
      servings: z.number().positive().default(1),
      customDefenseSystems: z.array(z.nativeEnum(DefenseSystem)).optional(),
    })
  ).min(1, 'At least one food item required'),
  notes: z.string().max(500).optional(),
  date: z.string().datetime().or(z.date()).optional(),
});

export type FoodConsumptionSchemaType = z.infer<typeof foodConsumptionSchema>;

// Mark recipe consumed validation schema
export const markRecipeConsumedSchema = z.object({
  recipeId: z.string().cuid(),
  mealTime: z.nativeEnum(MealTime),
  customMealName: z.string().max(50).optional(),
  servingsConsumed: z.number().positive().default(1),
  notes: z.string().max(500).optional(),
  date: z.string().datetime().or(z.date()).optional(),
});

export type MarkRecipeConsumedSchemaType = z.infer<typeof markRecipeConsumedSchema>;

// Mark meal consumed validation schema
export const markMealConsumedSchema = z.object({
  mealId: z.string().cuid(),
  mealPlanId: z.string().cuid(),
  customMealName: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  date: z.string().datetime().or(z.date()).optional(),
});

export type MarkMealConsumedSchemaType = z.infer<typeof markMealConsumedSchema>;

// Sync meal plan validation schema
export const syncMealPlanSchema = z.object({
  mealPlanId: z.string().cuid(),
  scope: z.enum(['DAY', 'WEEK', 'FULL']),
  targetDate: z.string().datetime().or(z.date()).optional(), // Required for DAY scope
});

export type SyncMealPlanSchemaType = z.infer<typeof syncMealPlanSchema>;

// Daily summary query params
export const dailySummaryQuerySchema = z.object({
  date: z.string().datetime().or(z.date()).optional(),
  includeRecommendations: z.boolean().optional(),
});

export type DailySummaryQuerySchemaType = z.infer<typeof dailySummaryQuerySchema>;

// Weekly summary query params
export const weeklySummaryQuerySchema = z.object({
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
});

export type WeeklySummaryQuerySchemaType = z.infer<typeof weeklySummaryQuerySchema>;

// Food database search params
export const foodDatabaseSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  defenseSystems: z.array(z.nativeEnum(DefenseSystem)).optional(),
  minSystemCount: z.number().int().min(1).max(5).optional(),
  limit: z.number().int().positive().max(100).default(50),
});

export type FoodDatabaseSearchSchemaType = z.infer<typeof foodDatabaseSearchSchema>;
