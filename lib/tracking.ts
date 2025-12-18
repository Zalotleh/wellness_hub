/**
 * User progress tracking utilities using localStorage
 * Tracks generation attempts, successes, failures, and provides analytics
 */

export interface GenerationAttempt {
  timestamp: number;
  success: boolean;
  type: 'recipe' | 'meal-plan';
  qualityScore?: number;
  errorMessage?: string;
}

export interface UserProgress {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  averageQualityScore: number;
  lastAttemptTimestamp: number;
  attempts: GenerationAttempt[];
}

const STORAGE_KEY = 'wellness_hub_user_progress';
const MAX_STORED_ATTEMPTS = 100; // Keep only last 100 attempts

/**
 * Get user progress from localStorage
 */
export function getUserProgress(): UserProgress {
  if (typeof window === 'undefined') {
    return getDefaultProgress();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultProgress();
    }

    const progress = JSON.parse(stored) as UserProgress;
    return progress;
  } catch (error) {
    console.error('Error reading user progress:', error);
    return getDefaultProgress();
  }
}

/**
 * Record a generation attempt
 */
export function recordGenerationAttempt(
  type: 'recipe' | 'meal-plan',
  success: boolean,
  qualityScore?: number,
  errorMessage?: string
): void {
  if (typeof window === 'undefined') return;

  try {
    const progress = getUserProgress();

    const attempt: GenerationAttempt = {
      timestamp: Date.now(),
      success,
      type,
      qualityScore,
      errorMessage,
    };

    // Add new attempt
    progress.attempts.push(attempt);

    // Keep only last N attempts
    if (progress.attempts.length > MAX_STORED_ATTEMPTS) {
      progress.attempts = progress.attempts.slice(-MAX_STORED_ATTEMPTS);
    }

    // Update statistics
    progress.totalAttempts = progress.attempts.length;
    progress.successfulAttempts = progress.attempts.filter((a) => a.success).length;
    progress.failedAttempts = progress.attempts.filter((a) => !a.success).length;
    progress.lastAttemptTimestamp = Date.now();

    // Calculate average quality score
    const attemptsWithScore = progress.attempts.filter((a) => a.qualityScore !== undefined);
    if (attemptsWithScore.length > 0) {
      const sum = attemptsWithScore.reduce((acc, a) => acc + (a.qualityScore || 0), 0);
      progress.averageQualityScore = sum / attemptsWithScore.length;
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error recording generation attempt:', error);
  }
}

/**
 * Get success rate percentage
 */
export function getSuccessRate(): number {
  const progress = getUserProgress();
  if (progress.totalAttempts === 0) return 0;
  return (progress.successfulAttempts / progress.totalAttempts) * 100;
}

/**
 * Get recent attempts (last N)
 */
export function getRecentAttempts(count: number = 10): GenerationAttempt[] {
  const progress = getUserProgress();
  return progress.attempts.slice(-count);
}

/**
 * Check if user is a first-timer (no successful attempts)
 */
export function isFirstTimer(): boolean {
  const progress = getUserProgress();
  return progress.successfulAttempts === 0;
}

/**
 * Check if user is struggling (low success rate after multiple attempts)
 */
export function isStruggling(): boolean {
  const progress = getUserProgress();
  if (progress.totalAttempts < 3) return false; // Need at least 3 attempts
  return getSuccessRate() < 50; // Less than 50% success rate
}

/**
 * Get personalized encouragement message based on progress
 */
export function getEncouragementMessage(): string | null {
  const progress = getUserProgress();
  const successRate = getSuccessRate();

  // First timer
  if (isFirstTimer() && progress.totalAttempts === 0) {
    return "💫 Ready to create your first AI recipe? Let's make it great!";
  }

  // Struggling user
  if (isStruggling()) {
    return "💪 We've noticed you're having some trouble. Try adding more specific details to improve your results!";
  }

  // Recent failure after successes
  const recentAttempts = getRecentAttempts(3);
  const recentFailures = recentAttempts.filter((a) => !a.success).length;
  if (successRate > 70 && recentFailures >= 2) {
    return "🔍 Having trouble? Remember to include specific ingredients and cooking methods for best results.";
  }

  // High performer
  if (successRate > 80 && progress.totalAttempts >= 5) {
    return "🌟 You're doing great! Your recipes are consistently high quality.";
  }

  // Milestone celebrations
  if (progress.successfulAttempts === 5) {
    return "🎉 Congrats on your 5th successful recipe! You're becoming an expert!";
  }
  if (progress.successfulAttempts === 10) {
    return "🏆 10 successful recipes! You've mastered the AI recipe generator!";
  }

  return null;
}

/**
 * Get smart tips based on user's history
 */
export function getSmartTips(): string[] {
  const progress = getUserProgress();
  const tips: string[] = [];

  // Analyze quality scores
  if (progress.averageQualityScore < 3 && progress.totalAttempts > 0) {
    tips.push('Try to reach at least 3/5 quality score before generating');
  }

  // Check for common patterns in failed attempts
  const recentAttempts = getRecentAttempts(10);
  const recentFailures = recentAttempts.filter((a) => !a.success);

  if (recentFailures.length > 0) {
    tips.push('Make sure to select at least one defense system');
    tips.push('Include at least 5-8 specific ingredients');
    tips.push('Add dietary restrictions if you have any');
  }

  // Time-based tips
  const lastAttempt = progress.attempts[progress.attempts.length - 1];
  if (lastAttempt) {
    const hoursSinceLastAttempt = (Date.now() - lastAttempt.timestamp) / (1000 * 60 * 60);
    if (hoursSinceLastAttempt > 24) {
      tips.push('Welcome back! Ready to create another amazing recipe?');
    }
  }

  return tips;
}

/**
 * Reset user progress (for testing or user request)
 */
export function resetUserProgress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get default progress object
 */
function getDefaultProgress(): UserProgress {
  return {
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    averageQualityScore: 0,
    lastAttemptTimestamp: 0,
    attempts: [],
  };
}

/**
 * Export user data for debugging
 */
export function exportUserProgress(): string {
  const progress = getUserProgress();
  return JSON.stringify(progress, null, 2);
}
