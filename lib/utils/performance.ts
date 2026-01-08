/**
 * Performance Optimization Utilities
 * Caching, memoization, and performance monitoring
 */

/**
 * Simple in-memory cache with TTL
 */
export class MemoryCache<T> {
  private cache: Map<string, { value: T; expiry: number }> = new Map();
  private defaultTTL: number;

  constructor(defaultTTLSeconds: number = 300) {
    this.defaultTTL = defaultTTLSeconds * 1000; // Convert to milliseconds
  }

  set(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Remove expired entries first
    this.cleanExpired();
    return this.cache.size;
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Run cleanup periodically
  startAutoCleanup(intervalSeconds: number = 60): () => void {
    const interval = setInterval(() => {
      this.cleanExpired();
    }, intervalSeconds * 1000);

    return () => clearInterval(interval);
  }
}

/**
 * Browser storage cache with TTL
 */
export class LocalStorageCache<T> {
  private prefix: string;
  private defaultTTL: number;

  constructor(prefix: string = 'cache_', defaultTTLSeconds: number = 300) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  set(key: string, value: T, ttlSeconds?: number): void {
    if (typeof window === 'undefined') return;

    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    const expiry = Date.now() + ttl;
    
    try {
      const item = {
        value,
        expiry,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('LocalStorage cache set failed:', error);
    }
  }

  get(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const itemStr = localStorage.getItem(this.prefix + key);
      
      if (!itemStr) {
        return null;
      }

      const item = JSON.parse(itemStr);
      
      // Check if expired
      if (Date.now() > item.expiry) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return item.value as T;
    } catch (error) {
      console.warn('LocalStorage cache get failed:', error);
      return null;
    }
  }

  delete(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  start(label: string): void {
    this.marks.set(label, performance.now());
  }

  end(label: string): number {
    const startTime = this.marks.get(label);
    
    if (!startTime) {
      console.warn(`No start mark found for: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(label);
    
    return duration;
  }

  endAndLog(label: string): number {
    const duration = this.end(label);
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.endAndLog(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}

/**
 * Lazy load image utility
 */
export function setupLazyLoading(): void {
  if (typeof window === 'undefined') return;
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          imageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Batch API calls
 */
export class RequestBatcher<T, R> {
  private queue: Array<{
    request: T;
    resolve: (result: R) => void;
    reject: (error: Error) => void;
  }> = [];
  private batchSize: number;
  private flushDelay: number;
  private timeoutId: NodeJS.Timeout | null = null;
  private processor: (batch: T[]) => Promise<R[]>;

  constructor(
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = 10,
    flushDelayMs: number = 100
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.flushDelay = flushDelayMs;
  }

  async add(request: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ request, resolve, reject });

      // Flush if batch size reached
      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else {
        // Schedule flush
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(() => this.flush(), this.flushDelay);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    const requests = batch.map((item) => item.request);

    try {
      const results = await this.processor(requests);
      
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach((item) => {
        item.reject(error as Error);
      });
    }
  }
}

// Export singleton instances
export const scoreCache = new MemoryCache(300); // 5 minutes
export const recommendationCache = new MemoryCache(300); // 5 minutes
export const perfMonitor = new PerformanceMonitor();
