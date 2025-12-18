/**
 * Batch Operation Optimizer
 * Provides utilities for optimized batch processing with rate limiting and parallel execution
 */

export interface BatchTask<T> {
  execute: () => Promise<T>;
  id: string;
}

export interface BatchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  id: string;
  duration: number;
}

/**
 * Execute tasks in parallel with concurrency limit
 * @param tasks Array of tasks to execute
 * @param concurrency Maximum number of concurrent executions
 * @param delayBetweenBatches Delay in ms between batches
 */
export async function executeBatch<T>(
  tasks: BatchTask<T>[],
  concurrency: number = 3,
  delayBetweenBatches: number = 100
): Promise<BatchResult<T>[]> {
  const results: BatchResult<T>[] = [];
  const batches: BatchTask<T>[][] = [];

  // Split tasks into batches
  for (let i = 0; i < tasks.length; i += concurrency) {
    batches.push(tasks.slice(i, i + concurrency));
  }

  // Execute batches sequentially
  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map(async (task) => {
        const startTime = Date.now();
        try {
          const data = await task.execute();
          return {
            success: true,
            data,
            id: task.id,
            duration: Date.now() - startTime,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || 'Unknown error',
            id: task.id,
            duration: Date.now() - startTime,
          };
        }
      })
    );

    // Extract results from settled promises
    results.push(
      ...batchResults.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            success: false,
            error: result.reason?.message || 'Promise rejected',
            id: 'unknown',
            duration: 0,
          };
        }
      })
    );

    // Add delay between batches (except for the last one)
    if (batch !== batches[batches.length - 1]) {
      await delay(delayBetweenBatches);
    }
  }

  return results;
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute tasks with retry logic
 */
export async function executeWithRetry<T>(
  task: () => Promise<T>,
  maxRetries: number = 2,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await task();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on validation errors (400-level)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Don't retry on rate limiting (let the caller handle it)
      if (error.status === 429) {
        throw error;
      }

      if (attempt < maxRetries) {
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${retryDelay}ms`);
        await delay(retryDelay);
        retryDelay *= 2; // Exponential backoff
      }
    }
  }

  throw lastError || new Error('Max retries reached');
}

/**
 * Rate limiter class for controlling API call frequency
 */
export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(maxTokens: number, refillRate: number) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = refillRate; // tokens per second
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.refillRate);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  async acquire(tokens: number = 1): Promise<void> {
    while (true) {
      this.refill();

      if (this.tokens >= tokens) {
        this.tokens -= tokens;
        return;
      }

      // Wait before checking again
      await delay(100);
    }
  }
}

/**
 * Cache for deduplicating similar requests
 */
export class RequestCache<T> {
  private cache: Map<string, { data: T; timestamp: number }> = new Map();
  private ttl: number;

  constructor(ttlMs: number = 60000) {
    this.ttl = ttlMs;
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Progress tracker for batch operations
 */
export class BatchProgressTracker {
  private total: number;
  private completed: number = 0;
  private successful: number = 0;
  private failed: number = 0;
  private onProgress?: (progress: BatchProgress) => void;

  constructor(total: number, onProgress?: (progress: BatchProgress) => void) {
    this.total = total;
    this.onProgress = onProgress;
  }

  recordSuccess(): void {
    this.completed++;
    this.successful++;
    this.notify();
  }

  recordFailure(): void {
    this.completed++;
    this.failed++;
    this.notify();
  }

  private notify(): void {
    if (this.onProgress) {
      this.onProgress({
        total: this.total,
        completed: this.completed,
        successful: this.successful,
        failed: this.failed,
        percentage: (this.completed / this.total) * 100,
      });
    }
  }

  getProgress(): BatchProgress {
    return {
      total: this.total,
      completed: this.completed,
      successful: this.successful,
      failed: this.failed,
      percentage: (this.completed / this.total) * 100,
    };
  }
}

export interface BatchProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  percentage: number;
}
