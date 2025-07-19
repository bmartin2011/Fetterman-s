// Client-side caching utility for API responses and data

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
  storage?: 'memory' | 'sessionStorage' | 'localStorage';
}

class Cache<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: config.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: config.maxSize || 100,
      storage: config.storage || 'memory'
    };

    // Load from persistent storage if configured
    if (this.config.storage !== 'memory') {
      this.loadFromStorage();
    }
  }

  set(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.config.ttl;
    const now = Date.now();
    
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl
    };

    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, item);
    this.saveToStorage();
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if item has expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.saveToStorage();
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.saveToStorage();
    return result;
  }

  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    this.cache.forEach((item) => {
      if (now > item.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    });

    return {
      total: this.cache.size,
      valid,
      expired,
      maxSize: this.config.maxSize,
      ttl: this.config.ttl
    };
  }

  // Clean up expired items
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    this.cache.forEach((item, key) => {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    });

    if (removed > 0) {
      this.saveToStorage();
    }

    return removed;
  }

  private getOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    this.cache.forEach((item, key) => {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    });

    return oldestKey;
  }

  private loadFromStorage(): void {
    if (this.config.storage === 'memory') return;

    try {
      const storage = this.config.storage === 'localStorage' ? localStorage : sessionStorage;
      const cached = storage.getItem(`cache_${this.constructor.name}`);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        this.cache = new Map(parsed);
        // Clean up expired items on load
        this.cleanup();
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (this.config.storage === 'memory') return;

    try {
      const storage = this.config.storage === 'localStorage' ? localStorage : sessionStorage;
      const serialized = JSON.stringify(Array.from(this.cache.entries()));
      storage.setItem(`cache_${this.constructor.name}`, serialized);
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }
}

// Specialized caches for different data types
export const apiCache = new Cache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 50,
  storage: 'sessionStorage'
});

export const imageCache = new Cache({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 100,
  storage: 'localStorage'
});

export const userDataCache = new Cache({
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 20,
  storage: 'sessionStorage'
});

// Cache decorator for functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyGenerator?: (...args: Parameters<T>) => string;
    ttl?: number;
    cache?: Cache;
  } = {}
): T {
  const cache = options.cache || apiCache;
  const keyGenerator = options.keyGenerator || ((...args) => JSON.stringify(args));

  return (async (...args: Parameters<T>) => {
    const key = `${fn.name}_${keyGenerator(...args)}`;
    
    // Try to get from cache first
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await fn(...args);
      cache.set(key, result, options.ttl);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }) as T;
}

// Utility to create cache keys
export const createCacheKey = (...parts: (string | number | boolean)[]): string => {
  return parts.map(part => String(part)).join('_');
};

// Auto cleanup interval (runs every 5 minutes)
setInterval(() => {
  apiCache.cleanup();
  imageCache.cleanup();
  userDataCache.cleanup();
}, 5 * 60 * 1000);

export default Cache;