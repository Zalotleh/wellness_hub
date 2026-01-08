/**
 * Notification System Types
 * 
 * Defines interfaces and types for the notification system
 * including preferences, notification types, and tracking
 */

export type NotificationType =
  | 'RECIPE_TO_SHOPPING_LIST'
  | 'SHOPPING_LIST_REMINDER'
  | 'MEAL_LOGGING_REMINDER'
  | 'DAILY_SUMMARY'
  | 'STREAK_REMINDER'
  | 'WEEKLY_PLANNING'
  | 'ACHIEVEMENT';

export type MealTime = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
export type DayOfWeek = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

/**
 * Notification preferences stored in User.notificationPreferences JSON field
 */
export interface NotificationPreferences {
  // Master toggle
  enabled: boolean;

  // Workflow notifications
  workflow: {
    recipeToShoppingList: boolean;
    shoppingListReminder: boolean;
    mealLoggingReminder: boolean;
  };

  // Progress notifications
  progress: {
    dailySummary: boolean;
    dailySummaryTime: string; // "20:00"
    streakReminders: boolean;
    weeklyPlanning: boolean;
    weeklyPlanningDay: DayOfWeek; // "SUNDAY"
    weeklyPlanningTime: string; // "19:00"
  };

  // Meal reminders with learned times
  mealReminders: {
    enabled: boolean;
    breakfast: boolean;
    breakfastTime?: string; // Learned from user behavior
    lunch: boolean;
    lunchTime?: string;
    dinner: boolean;
    dinnerTime?: string;
  };

  // Achievements always enabled
  achievements: {
    enabled: boolean;
  };

  // Do Not Disturb mode
  doNotDisturb: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string; // "07:00"
  };

  // Rate limits (hardcoded but stored for reference)
  maxPerDay: number; // 3
  minGapMinutes: number; // 120 (2 hours)
}

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  workflow: {
    recipeToShoppingList: false,
    shoppingListReminder: false,
    mealLoggingReminder: false,
  },
  progress: {
    dailySummary: false,
    dailySummaryTime: '20:00',
    streakReminders: false,
    weeklyPlanning: false,
    weeklyPlanningDay: 'SUNDAY',
    weeklyPlanningTime: '19:00',
  },
  mealReminders: {
    enabled: false,
    breakfast: false,
    lunch: false,
    dinner: false,
  },
  achievements: {
    enabled: true,
  },
  doNotDisturb: {
    enabled: true,
    startTime: '22:00',
    endTime: '07:00',
  },
  maxPerDay: 3,
  minGapMinutes: 120,
};

/**
 * Notification data payloads for each type
 */
export interface NotificationData {
  type: NotificationType;
  userId: string;
  data: any;
}

export interface RecipeToShoppingListData {
  recipeName: string;
  recipeId: string;
  ingredientCount: number;
}

export interface ShoppingListReminderData {
  listName: string;
  listId: string;
  itemCount: number;
}

export interface MealLoggingReminderData {
  mealTime: MealTime;
  missedMeals: number;
}

export interface DailySummaryData {
  date: string;
  score: number;
  systemsCovered: number;
  mealsLogged: number;
  insights: string;
  nextSteps: string[];
}

export interface StreakReminderData {
  streakDays: number;
  lastLogDate: string;
}

export interface WeeklyPlanningData {
  weekNumber: number;
  weeklyAverage: number;
  lastWeekScore: number;
}

export interface AchievementData {
  achievementType: string;
  title: string;
  description: string;
  icon: string;
}

/**
 * Notification log entry for tracking sent notifications
 */
export interface NotificationLog {
  id: string;
  userId: string;
  type: NotificationType;
  sentAt: Date;
  metadata?: any;
}

/**
 * Learned notification times from user behavior
 */
export interface NotificationTimes {
  breakfast?: string;
  lunch?: string;
  dinner?: string;
}

/**
 * Notification send result
 */
export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
}
