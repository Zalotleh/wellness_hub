/**
 * Generation statistics interface
 */
export interface GenerationStats {
  totalAttempts: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageQualityScore: number;
  lastGenerationDate: string | null;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  bestQualityScore: number;
  generationHistory: GenerationRecord[];
}

/**
 * Individual generation record
 */
export interface GenerationRecord {
  timestamp: string;
  success: boolean;
  qualityScore: number;
  ingredientCount: number;
  hasRestrictions: boolean;
  hasMealType: boolean;
  generationType: 'recipe' | 'mealplan';
}

const STATS_KEY = 'ai_generation_stats';
const ONBOARDING_KEY = 'ai_onboarding_completed';
const MAX_HISTORY = 50; // Keep last 50 generations

/**
 * Get current generation statistics from localStorage
 */
export function getGenerationStats(): GenerationStats {
  if (typeof window === 'undefined') {
    return getDefaultStats();
  }

  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (!stored) {
      return getDefaultStats();
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading generation stats:', error);
    return getDefaultStats();
  }
}

/**
 * Get default statistics object
 */
function getDefaultStats(): GenerationStats {
  return {
    totalAttempts: 0,
    successfulGenerations: 0,
    failedGenerations: 0,
    averageQualityScore: 0,
    lastGenerationDate: null,
    consecutiveSuccesses: 0,
    consecutiveFailures: 0,
    bestQualityScore: 0,
    generationHistory: [],
  };
}

/**
 * Track a new generation attempt
 */
export function trackGeneration(
  success: boolean,
  qualityScore: number,
  ingredientCount: number,
  hasRestrictions: boolean,
  hasMealType: boolean,
  generationType: 'recipe' | 'mealplan' = 'recipe'
): GenerationStats {
  const stats = getGenerationStats();

  // Create new record
  const record: GenerationRecord = {
    timestamp: new Date().toISOString(),
    success,
    qualityScore,
    ingredientCount,
    hasRestrictions,
    hasMealType,
    generationType,
  };

  // Update stats
  stats.totalAttempts += 1;
  stats.lastGenerationDate = record.timestamp;

  if (success) {
    stats.successfulGenerations += 1;
    stats.consecutiveSuccesses += 1;
    stats.consecutiveFailures = 0;

    // Update best quality score
    if (qualityScore > stats.bestQualityScore) {
      stats.bestQualityScore = qualityScore;
    }
  } else {
    stats.failedGenerations += 1;
    stats.consecutiveFailures += 1;
    stats.consecutiveSuccesses = 0;
  }

  // Recalculate average quality score
  const totalScore = stats.generationHistory.reduce(
    (sum, r) => sum + r.qualityScore,
    0
  );
  stats.averageQualityScore =
    stats.totalAttempts > 0
      ? (totalScore + qualityScore) / (stats.generationHistory.length + 1)
      : qualityScore;

  // Add to history (keep last MAX_HISTORY)
  stats.generationHistory.push(record);
  if (stats.generationHistory.length > MAX_HISTORY) {
    stats.generationHistory = stats.generationHistory.slice(-MAX_HISTORY);
  }

  // Save to localStorage
  saveStats(stats);

  return stats;
}

/**
 * Save statistics to localStorage
 */
function saveStats(stats: GenerationStats): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving generation stats:', error);
  }
}

/**
 * Check if user should see onboarding
 */
export function shouldShowOnboarding(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    return completed !== 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Mark onboarding as completed
 */
export function markOnboardingCompleted(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.error('Error marking onboarding completed:', error);
  }
}

/**
 * Reset onboarding flag (for testing)
 */
export function resetOnboarding(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
  }
}

/**
 * Check if user should see encouragement message
 */
export function shouldShowEncouragement(): {
  show: boolean;
  message: string;
  type: 'success' | 'milestone' | 'improvement';
} {
  const stats = getGenerationStats();

  // No generations yet
  if (stats.totalAttempts === 0) {
    return { show: false, message: '', type: 'success' };
  }

  // Consecutive successes milestones
  if (stats.consecutiveSuccesses === 3) {
    return {
      show: true,
      message: "🎉 You're on a roll! 3 successful recipes in a row!",
      type: 'milestone',
    };
  }

  if (stats.consecutiveSuccesses === 5) {
    return {
      show: true,
      message: "🌟 Amazing! 5 consecutive successful generations!",
      type: 'milestone',
    };
  }

  if (stats.consecutiveSuccesses === 10) {
    return {
      show: true,
      message: "🏆 Incredible! You're a recipe generation master!",
      type: 'milestone',
    };
  }

  // Quality score improvement
  const recentGenerations = stats.generationHistory.slice(-5);
  if (recentGenerations.length === 5) {
    const avgRecent =
      recentGenerations.reduce((sum, r) => sum + r.qualityScore, 0) / 5;
    const previousGenerations = stats.generationHistory.slice(-10, -5);
    if (previousGenerations.length === 5) {
      const avgPrevious =
        previousGenerations.reduce((sum, r) => sum + r.qualityScore, 0) / 5;
      if (avgRecent > avgPrevious + 1) {
        return {
          show: true,
          message: "📈 Great progress! Your quality scores are improving!",
          type: 'improvement',
        };
      }
    }
  }

  // Perfect quality score
  const lastGeneration =
    stats.generationHistory[stats.generationHistory.length - 1];
  if (lastGeneration && lastGeneration.qualityScore === 5) {
    return {
      show: true,
      message: "⭐ Perfect quality score! Excellent input!",
      type: 'success',
    };
  }

  return { show: false, message: '', type: 'success' };
}

/**
 * Get personalized tips based on user's history
 */
export function getPersonalizedTips(): string[] {
  const stats = getGenerationStats();
  const tips: string[] = [];

  if (stats.totalAttempts === 0) {
    return [
      'Welcome! Start by selecting your health goal.',
      'Adding 3+ ingredients leads to better results.',
      'Try specifying dietary restrictions for more accurate recipes.',
    ];
  }

  const recentGenerations = stats.generationHistory.slice(-10);

  // Analyze patterns
  const lowIngredientCount = recentGenerations.filter(
    (r) => r.ingredientCount < 3
  ).length;
  const noRestrictions = recentGenerations.filter(
    (r) => !r.hasRestrictions
  ).length;
  const noMealType = recentGenerations.filter((r) => !r.hasMealType).length;

  // Generate personalized tips
  if (lowIngredientCount > 5) {
    tips.push(
      '💡 Tip: Try adding more ingredients (3+) for better recipe variety'
    );
  }

  if (noRestrictions > 7) {
    tips.push(
      '💡 Tip: Adding dietary restrictions helps generate more relevant recipes'
    );
  }

  if (noMealType > 7) {
    tips.push('💡 Tip: Selecting a specific meal type improves accuracy');
  }

  if (stats.averageQualityScore < 3) {
    tips.push(
      '💡 Tip: Aim for a quality score of 4+ for best AI results'
    );
  }

  if (stats.consecutiveFailures > 2) {
    tips.push(
      '💡 Having trouble? Try our examples for inspiration'
    );
  }

  // Success encouragement
  if (stats.successfulGenerations > stats.failedGenerations * 2) {
    tips.push('✨ You\'re doing great! Keep up the good work!');
  }

  return tips;
}

/**
 * Get generation statistics summary
 */
export function getStatsSummary(): {
  totalGenerations: number;
  successRate: number;
  averageQuality: number;
  streak: number;
} {
  const stats = getGenerationStats();

  const successRate =
    stats.totalAttempts > 0
      ? (stats.successfulGenerations / stats.totalAttempts) * 100
      : 0;

  return {
    totalGenerations: stats.totalAttempts,
    successRate: Math.round(successRate),
    averageQuality: Math.round(stats.averageQualityScore * 10) / 10,
    streak: stats.consecutiveSuccesses,
  };
}

/**
 * Reset all statistics (for testing)
 */
export function resetStats(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STATS_KEY);
  } catch (error) {
    console.error('Error resetting stats:', error);
  }
}
