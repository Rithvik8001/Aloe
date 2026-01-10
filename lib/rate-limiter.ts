/**
 * In-memory rate limiter using token bucket algorithm
 * For production, consider using Upstash Redis for distributed rate limiting
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup stale entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a request is allowed based on rate limit
   * Returns true if allowed, false if rate limit exceeded
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<boolean> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      // First request from this key
      this.store.set(key, {
        tokens: limit - 1,
        lastRefill: now,
      });
      return true;
    }

    // Calculate how many tokens to refill based on time passed
    const timePassed = now - entry.lastRefill;
    const refillRate = limit / windowMs; // tokens per millisecond
    const tokensToAdd = Math.floor(timePassed * refillRate);

    // Refill tokens (up to the limit)
    const newTokens = Math.min(limit, entry.tokens + tokensToAdd);

    if (newTokens >= 1) {
      // Allow the request and consume a token
      this.store.set(key, {
        tokens: newTokens - 1,
        lastRefill: tokensToAdd > 0 ? now : entry.lastRefill,
      });
      return true;
    }

    // Rate limit exceeded
    return false;
  }

  /**
   * Remove stale entries older than 1 hour
   */
  private cleanup(): void {
    const now = Date.now();
    const staleThreshold = 60 * 60 * 1000; // 1 hour

    for (const [key, entry] of this.store.entries()) {
      if (now - entry.lastRefill > staleThreshold) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all rate limit entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Stop the cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

export { rateLimiter };

/**
 * Rate limit middleware for API routes
 */
export async function checkUserRateLimit(userId: string): Promise<boolean> {
  const key = `user:${userId}`;
  const limit = 30; // 30 requests
  const windowMs = 60 * 1000; // per minute

  return rateLimiter.checkRateLimit(key, limit, windowMs);
}

/**
 * Rate limit by IP address
 */
export async function checkIPRateLimit(ip: string): Promise<boolean> {
  const key = `ip:${ip}`;
  const limit = 60; // 60 requests
  const windowMs = 60 * 1000; // per minute

  return rateLimiter.checkRateLimit(key, limit, windowMs);
}
