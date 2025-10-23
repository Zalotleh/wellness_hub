import { z } from 'zod';
import { DefenseSystem } from '@/types';

// Recipe validation schema
export const recipeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  ingredients: z.array(
    z.object({
      name: z.string().min(1, 'Ingredient name required'),
      amount: z.string().min(1, 'Amount required'),
    })
  ).min(1, 'At least one ingredient required'),
  instructions: z.string().min(20, 'Instructions must be at least 20 characters'),
  prepTime: z.string().optional(),
  cookTime: z.string().optional(),
  servings: z.number().int().positive().optional(),
  defenseSystem: z.nativeEnum(DefenseSystem, {
    errorMap: () => ({ message: 'Please select a valid defense system' }),
  }),
  nutrients: z.record(z.string()).optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
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