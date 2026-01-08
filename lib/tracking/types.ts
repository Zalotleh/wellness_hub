import { DefenseSystem } from '@/types';

/**
 * Comprehensive 5x5x5 score for a specific date
 */
export interface Score5x5x5 {
  overallScore: number; // 0-100
  defenseSystems: SystemScore[];
  mealTimes: MealTimeScore[];
  foodVariety: FoodVarietyScore;
  insights: ScoreInsights;
}

/**
 * Score for a single defense system
 */
export interface SystemScore {
  system: DefenseSystem;
  foodsConsumed: number; // 0-5
  uniqueFoods: string[];
  coveragePercent: number; // 0-100
  score: number; // 0-100
}

/**
 * Score for a single meal time
 */
export interface MealTimeScore {
  mealTime: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  hasFood: boolean;
  foodCount: number;
  systemsCovered: DefenseSystem[];
  score: number; // 0-100
}

/**
 * Food variety metrics
 */
export interface FoodVarietyScore {
  totalUniqueFoods: number;
  varietyScore: number; // 0-100
  repeatedFoods: string[];
  diversityIndex: number; // 0-1
}

/**
 * Actionable insights from score analysis
 */
export interface ScoreInsights {
  strongestSystem: DefenseSystem | null;
  weakestSystem: DefenseSystem | null;
  missedMealTimes: string[];
  systemBalance: number; // 0-100 (how evenly distributed)
  recommendation: string;
  nextSteps: string[];
}

/**
 * Weekly score aggregation
 */
export interface WeeklyScore {
  weekStart: Date;
  weekEnd: Date;
  averageScore: number;
  dailyScores: Score5x5x5[];
  trend: 'improving' | 'declining' | 'stable';
  bestDay: Date;
  worstDay: Date;
}

/**
 * Monthly score aggregation
 */
export interface MonthlyScore {
  month: Date;
  averageScore: number;
  weeklyScores: WeeklyScore[];
  trend: 'improving' | 'declining' | 'stable';
  bestWeek: Date;
  worstWeek: Date;
}

/**
 * Food consumption data for scoring
 */
export interface FoodConsumptionData {
  id: string;
  userId: string;
  date: Date;
  defenseSystem: DefenseSystem;
  foodsConsumed: string[];
  count: number;
  mealTime?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
}
