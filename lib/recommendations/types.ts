import { DefenseSystem } from '@/types';

export type RecommendationType = 'RECIPE' | 'MEAL_PLAN' | 'FOOD_SUGGESTION' | 'WORKFLOW_STEP';

export type RecommendationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RecommendationStatus = 'PENDING' | 'ACCEPTED' | 'DISMISSED' | 'EXPIRED';

export interface GapAnalysis {
  // Defense System gaps
  missingSystems: DefenseSystem[]; // Systems with 0-1 foods
  weakSystems: DefenseSystem[]; // Systems with 2-3 foods
  
  // Meal time gaps
  missedMeals: Array<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'>;
  
  // Variety gaps
  varietyScore: number; // 0-100
  repeatedFoods: string[]; // Foods eaten multiple times
  
  // Overall assessment
  overallScore: number; // 0-100
  systemBalance: number; // 0-100 (how evenly distributed)
}

export interface UserBehaviorProfile {
  userId: string;
  // Consumption patterns
  preferredMealTimes: string[];
  favoriteFoods: Array<{ name: string; frequency: number }>;
  dietaryRestrictions: string[];
  
  // Engagement metrics
  averageDailyScore: number;
  consistency: number; // Days tracked / Total days
  
  // Recommendation history
  acceptanceRate: number; // % of recommendations accepted
  dismissedTypes: RecommendationType[]; // Recently dismissed types
  lastRecommendationDate: Date | null;
}

export interface SmartRecommendation {
  id: string;
  userId: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  
  // Content
  title: string;
  description: string;
  reasoning: string; // Why this recommendation
  
  // Action details
  actionLabel: string; // e.g., "Generate Recipe", "Create Meal Plan"
  actionUrl: string; // Deep link with pre-filled data
  actionData: Record<string, any>; // Data to pre-populate
  
  // Targeting
  targetSystem?: DefenseSystem; // If system-specific
  targetMealTime?: string; // If meal-specific
  
  // Metadata
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
  dismissedAt?: Date;
  
  // Analytics
  viewCount: number;
  dismissCount: number; // Times shown but dismissed
}

export interface RecommendationContext {
  userId: string;
  date: Date;
  score: any; // Score5x5x5 from scoring engine
  gaps: GapAnalysis;
  userProfile: UserBehaviorProfile;
  existingRecommendations: SmartRecommendation[];
}
