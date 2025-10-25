// lib/features/feature-flags.ts
export enum Feature {
  // Meal Planning
  UNLIMITED_MEAL_PLANS = 'unlimited_meal_plans',
  MONTHLY_VIEW = 'monthly_view',
  DRAG_DROP_MEALS = 'drag_drop_meals',
  DUPLICATE_PLANS = 'duplicate_plans',
  PLAN_TEMPLATES = 'plan_templates',
  
  // Recipe Generation
  UNLIMITED_RECIPES = 'unlimited_recipes',
  BATCH_RECIPE_GENERATION = 'batch_recipe_generation',
  CUSTOM_RECIPE_INSTRUCTIONS = 'custom_recipe_instructions',
  RECIPE_LIBRARY = 'recipe_library',
  RECIPE_REGENERATION = 'recipe_regeneration',
  
  // Shopping Lists
  SMART_SHOPPING_LIST = 'smart_shopping_list',
  PANTRY_MANAGEMENT = 'pantry_management',
  PRICE_ESTIMATES = 'price_estimates',
  GROCERY_INTEGRATION = 'grocery_integration',
  
  // Progress Tracking
  ALL_TIME_HISTORY = 'all_time_history',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  DATA_EXPORT = 'data_export',
  HEALTH_APP_SYNC = 'health_app_sync',
  
  // AI Advisor
  UNLIMITED_AI_QUESTIONS = 'unlimited_ai_questions',
  CONVERSATION_HISTORY = 'conversation_history',
  SAVE_RESPONSES = 'save_responses',
  PRIORITY_RESPONSES = 'priority_responses',
  
  // Sharing
  PDF_EXPORT = 'pdf_export',
  IMAGE_GENERATION = 'image_generation',
  CALENDAR_INTEGRATION = 'calendar_integration',
  APPLE_NOTES_SYNC = 'apple_notes_sync',
  GOOGLE_KEEP_SYNC = 'google_keep_sync',
  QR_CODES = 'qr_codes',
  SOCIAL_TEMPLATES = 'social_templates',
  
  // Community
  PUBLIC_SHARING = 'public_sharing',
  COMMUNITY_BROWSE = 'community_browse',
  PLAN_COMMENTS = 'plan_comments',
  PLAN_LIKES = 'plan_likes',
  
  // Smart Integrations
  VOICE_INPUT = 'voice_input',
  BARCODE_SCANNER = 'barcode_scanner',
  SMART_WATCH = 'smart_watch',
  MEAL_SWAPS = 'meal_swaps',
}

export type SubscriptionTier = 'FREE' | 'PREMIUM' | 'FAMILY';

export interface FeatureLimit {
  free: number | boolean;
  premium: number | boolean;
  family: number | boolean;
}

// Feature limits configuration
export const FEATURE_LIMITS: Record<string, FeatureLimit> = {
  // Meal Plans
  meal_plans_per_month: { free: 1, premium: Infinity, family: Infinity },
  saved_meal_plans: { free: 3, premium: Infinity, family: Infinity },
  
  // Recipes
  recipe_generations_per_month: { free: 7, premium: Infinity, family: Infinity },
  saved_recipes: { free: 10, premium: Infinity, family: Infinity },
  
  // AI Advisor
  ai_questions_per_month: { free: 10, premium: Infinity, family: Infinity },
  conversation_history_days: { free: 1, premium: Infinity, family: Infinity },
  
  // Sharing
  pdf_exports_per_month: { free: 0, premium: Infinity, family: Infinity },
  image_generations_per_month: { free: 0, premium: 10, family: Infinity },
  
  // Family specific
  family_members: { free: 1, premium: 1, family: 6 },
  shared_lists: { free: false, premium: false, family: true },
};

// Feature availability by tier
export const TIER_FEATURES: Record<SubscriptionTier, Feature[]> = {
  FREE: [
    // Basic features available to all
  ],
  PREMIUM: [
    Feature.UNLIMITED_MEAL_PLANS,
    Feature.DRAG_DROP_MEALS,
    Feature.DUPLICATE_PLANS,
    Feature.UNLIMITED_RECIPES,
    Feature.BATCH_RECIPE_GENERATION,
    Feature.CUSTOM_RECIPE_INSTRUCTIONS,
    Feature.RECIPE_LIBRARY,
    Feature.RECIPE_REGENERATION,
    Feature.SMART_SHOPPING_LIST,
    Feature.PANTRY_MANAGEMENT,
    Feature.PRICE_ESTIMATES,
    Feature.GROCERY_INTEGRATION,
    Feature.ALL_TIME_HISTORY,
    Feature.ADVANCED_ANALYTICS,
    Feature.DATA_EXPORT,
    Feature.UNLIMITED_AI_QUESTIONS,
    Feature.CONVERSATION_HISTORY,
    Feature.SAVE_RESPONSES,
    Feature.PDF_EXPORT,
    Feature.IMAGE_GENERATION,
    Feature.CALENDAR_INTEGRATION,
    Feature.APPLE_NOTES_SYNC,
    Feature.QR_CODES,
    Feature.SOCIAL_TEMPLATES,
    Feature.PUBLIC_SHARING,
    Feature.COMMUNITY_BROWSE,
    Feature.PLAN_COMMENTS,
    Feature.PLAN_LIKES,
    Feature.VOICE_INPUT,
    Feature.BARCODE_SCANNER,
    Feature.MEAL_SWAPS,
  ],
  FAMILY: [
    // All premium features plus:
    Feature.MONTHLY_VIEW,
    Feature.PLAN_TEMPLATES,
    Feature.HEALTH_APP_SYNC,
    Feature.PRIORITY_RESPONSES,
    Feature.GOOGLE_KEEP_SYNC,
    Feature.SMART_WATCH,
  ],
};

export class FeatureAccess {
  private tier: SubscriptionTier;
  private isTrialing: boolean;

  constructor(tier: SubscriptionTier, isTrialing: boolean = false) {
    this.tier = tier;
    this.isTrialing = isTrialing;
  }

  /**
   * Check if user has access to a specific feature
   */
  hasFeature(feature: Feature): boolean {
    // During trial, give premium access
    if (this.isTrialing) {
      return TIER_FEATURES.PREMIUM.includes(feature) || 
             TIER_FEATURES.FREE.includes(feature);
    }

    // Check tier-specific features
    const tierFeatures = TIER_FEATURES[this.tier];
    const familyFeatures = TIER_FEATURES.FAMILY;
    
    // Family tier gets all premium features too
    if (this.tier === 'FAMILY') {
      return tierFeatures.includes(feature) || 
             TIER_FEATURES.PREMIUM.includes(feature) ||
             TIER_FEATURES.FREE.includes(feature);
    }
    
    // Premium tier gets all free features too
    if (this.tier === 'PREMIUM') {
      return tierFeatures.includes(feature) || 
             TIER_FEATURES.FREE.includes(feature);
    }
    
    return tierFeatures.includes(feature);
  }

  /**
   * Get the limit for a specific feature
   */
  getLimit(limitKey: string): number | boolean {
    const limit = FEATURE_LIMITS[limitKey];
    if (!limit) return false;

    // During trial, give premium limits
    if (this.isTrialing) {
      return limit.premium;
    }

    return limit[this.tier.toLowerCase() as keyof FeatureLimit];
  }

  /**
   * Check if user can perform an action based on usage
   */
  canUse(limitKey: string, currentUsage: number): boolean {
    const limit = this.getLimit(limitKey);
    
    if (typeof limit === 'boolean') return limit;
    if (limit === Infinity) return true;
    
    return currentUsage < limit;
  }

  /**
   * Get upgrade message for a specific feature
   */
  getUpgradeMessage(feature: Feature): string {
    if (this.tier === 'FREE') {
      return 'Upgrade to Premium to unlock this feature';
    }
    if (this.tier === 'PREMIUM' && TIER_FEATURES.FAMILY.includes(feature)) {
      return 'Upgrade to Family plan to unlock this feature';
    }
    return 'This feature is not available on your plan';
  }

  /**
   * Get required tier for a feature
   */
  getRequiredTier(feature: Feature): SubscriptionTier | null {
    if (TIER_FEATURES.FREE.includes(feature)) return 'FREE';
    if (TIER_FEATURES.PREMIUM.includes(feature)) return 'PREMIUM';
    if (TIER_FEATURES.FAMILY.includes(feature)) return 'FAMILY';
    return null;
  }

  /**
   * Get remaining usage for a limit
   */
  getRemainingUsage(limitKey: string, currentUsage: number): number | null {
    const limit = this.getLimit(limitKey);
    
    if (typeof limit === 'boolean') return null;
    if (limit === Infinity) return Infinity;
    
    return Math.max(0, limit - currentUsage);
  }

  /**
   * Get usage percentage (0-100)
   */
  getUsagePercentage(limitKey: string, currentUsage: number): number {
    const limit = this.getLimit(limitKey);
    
    if (typeof limit === 'boolean') return limit ? 0 : 100;
    if (limit === Infinity) return 0;
    
    return Math.min(100, (currentUsage / limit) * 100);
  }

  /**
   * Check if user is approaching limit (>80%)
   */
  isApproachingLimit(limitKey: string, currentUsage: number): boolean {
    return this.getUsagePercentage(limitKey, currentUsage) > 80;
  }
}

/**
 * Helper to create FeatureAccess instance from user data
 */
export function getUserFeatureAccess(user: {
  subscriptionTier: string;
  trialEndsAt?: Date | null;
}): FeatureAccess {
  const isTrialing = user.trialEndsAt ? new Date(user.trialEndsAt) > new Date() : false;
  return new FeatureAccess(user.subscriptionTier as SubscriptionTier, isTrialing);
}
