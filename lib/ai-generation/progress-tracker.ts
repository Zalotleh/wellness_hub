/**
 * Progress Tracker - Tracks user generation statistics in localStorage
 */

export interface GenerationStats {
  totalAttempts: number;
  successfulGenerations: number;
  failedAttempts: number;
  averageQualityScore: number;
  qualityHistory: number[];
  lastGenerationDate: string;
}

const STORAGE_KEY_PREFIX = 'ai_generation_stats_';

/**
 * Track a generation attempt
 */
export function trackGeneration(
  success: boolean,
  qualityScore: number,
  ingredientCount?: number,
  hasRestrictions?: boolean,
  hasMealType?: boolean,
  context: 'recipe' | 'mealplan' = 'recipe'
): void {
  const storageKey = `${STORAGE_KEY_PREFIX}${context}`;
  
  // Get existing stats
  const existingStats = getStats(context);
  
  // Update stats
  const updatedStats: GenerationStats = {
    totalAttempts: existingStats.totalAttempts + 1,
    successfulGenerations: success 
      ? existingStats.successfulGenerations + 1 
      : existingStats.successfulGenerations,
    failedAttempts: success 
      ? existingStats.failedAttempts 
      : existingStats.failedAttempts + 1,
    qualityHistory: [...existingStats.qualityHistory, qualityScore].slice(-10), // Keep last 10
    averageQualityScore: 0, // Will calculate below
    lastGenerationDate: new Date().toISOString(),
  };
  
  // Calculate average quality score
  updatedStats.averageQualityScore = 
    updatedStats.qualityHistory.reduce((sum, score) => sum + score, 0) / 
    updatedStats.qualityHistory.length;
  
  // Save to localStorage
  try {
    localStorage.setItem(storageKey, JSON.stringify(updatedStats));
  } catch (error) {
    console.error('Failed to save generation stats:', error);
  }
}

/**
 * Get generation statistics
 */
export function getStats(context: 'recipe' | 'mealplan' = 'recipe'): GenerationStats {
  const storageKey = `${STORAGE_KEY_PREFIX}${context}`;
  
  const defaultStats: GenerationStats = {
    totalAttempts: 0,
    successfulGenerations: 0,
    failedAttempts: 0,
    averageQualityScore: 0,
    qualityHistory: [],
    lastGenerationDate: '',
  };
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return defaultStats;
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load generation stats:', error);
    return defaultStats;
  }
}

/**
 * Get encouragement message based on stats
 */
export function getEncouragementMessage(stats: GenerationStats): string {
  const { totalAttempts, successfulGenerations, averageQualityScore, qualityHistory } = stats;
  
  // First generation
  if (totalAttempts === 1) {
    return "Great start! Keep refining your inputs to get even better results.";
  }
  
  // Success rate
  const successRate = successfulGenerations / totalAttempts;
  
  // Check if improving
  const recentQuality = qualityHistory.slice(-3);
  const isImproving = recentQuality.length >= 2 && 
    recentQuality[recentQuality.length - 1] > recentQuality[0];
  
  // High success rate
  if (successRate >= 0.8) {
    if (averageQualityScore >= 4.0) {
      return "🌟 Excellent! You're a master at crafting quality inputs!";
    }
    return "👏 Great work! Your success rate is impressive!";
  }
  
  // Improving trend
  if (isImproving) {
    return "📈 You're improving! Keep following the tips for better results.";
  }
  
  // Moderate success
  if (successRate >= 0.5) {
    return "💪 Good progress! Try adding more details for even better results.";
  }
  
  // Needs improvement
  if (successRate < 0.5 && totalAttempts >= 3) {
    return "💡 Tip: Focus on the quality score tips below to improve your results.";
  }
  
  // Default
  return "Keep going! Each attempt helps you learn what works best.";
}

/**
 * Reset stats (useful for testing or user preference)
 */
export function resetStats(context: 'recipe' | 'mealplan' = 'recipe'): void {
  const storageKey = `${STORAGE_KEY_PREFIX}${context}`;
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to reset generation stats:', error);
  }
}
