/**
 * In-memory cache for Supabase Storage signed URLs
 * Automatically refreshes URLs before they expire
 */

interface CachedUrl {
  url: string
  expiresAt: number
  storagePath: string
}

interface CacheMetrics {
  hits: number
  misses: number
  refreshes: number
  evictions: number
}

class SignedUrlCache {
  private cache: Map<string, CachedUrl> = new Map()
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    refreshes: 0,
    evictions: 0
  }
  
  // Refresh URLs when they have less than 20% of their TTL remaining
  // For 1-hour URLs, this means refreshing at the 48-minute mark
  private readonly REFRESH_THRESHOLD = 0.2

  /**
   * Get a signed URL from cache
   * @param storagePath The storage path (e.g., "renders/comics/user_id/file.png")
   * @returns The cached signed URL or null if not found/expired
   */
  get(storagePath: string): string | null {
    const cached = this.cache.get(storagePath)
    
    if (!cached) {
      this.metrics.misses++
      return null
    }

    const now = Date.now()
    
    // Check if URL is expired
    if (now >= cached.expiresAt) {
      this.cache.delete(storagePath)
      this.metrics.evictions++
      this.metrics.misses++
      return null
    }

    this.metrics.hits++
    return cached.url
  }

  /**
   * Set a signed URL in cache
   * @param storagePath The storage path
   * @param url The signed URL
   * @param expiresInSeconds How long the URL is valid (default 86400 = 24 hours)
   */
  set(storagePath: string, url: string, expiresInSeconds: number = 86400): void {
    const expiresAt = Date.now() + (expiresInSeconds * 1000)
    
    this.cache.set(storagePath, {
      url,
      expiresAt,
      storagePath
    })
  }

  /**
   * Check if a URL needs to be refreshed
   * Returns true if the URL has less than 20% of its TTL remaining
   */
  needsRefresh(storagePath: string, ttlSeconds: number = 86400): boolean {
    const cached = this.cache.get(storagePath)
    
    if (!cached) {
      return false
    }

    const now = Date.now()
    const totalTtl = ttlSeconds * 1000
    const timeRemaining = cached.expiresAt - now
    const refreshTime = totalTtl * this.REFRESH_THRESHOLD

    return timeRemaining <= refreshTime && timeRemaining > 0
  }

  /**
   * Get all storage paths that need to be refreshed
   */
  getPathsNeedingRefresh(ttlSeconds: number = 86400): string[] {
    const paths: string[] = []
    
    for (const [storagePath, cached] of this.cache.entries()) {
      const now = Date.now()
      const totalTtl = ttlSeconds * 1000
      const timeRemaining = cached.expiresAt - now
      const refreshTime = totalTtl * this.REFRESH_THRESHOLD

      if (timeRemaining <= refreshTime && timeRemaining > 0) {
        paths.push(storagePath)
      }
    }

    return paths
  }

  /**
   * Update a cached URL (used by refresh job)
   */
  refresh(storagePath: string, newUrl: string, expiresInSeconds: number = 86400): void {
    this.set(storagePath, newUrl, expiresInSeconds)
    this.metrics.refreshes++
  }

  /**
   * Delete a cached URL
   */
  delete(storagePath: string): boolean {
    return this.cache.delete(storagePath)
  }

  /**
   * Clear all expired entries
   */
  clearExpired(): number {
    const now = Date.now()
    let cleared = 0

    for (const [storagePath, cached] of this.cache.entries()) {
      if (now >= cached.expiresAt) {
        this.cache.delete(storagePath)
        cleared++
        this.metrics.evictions++
      }
    }

    return cleared
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear()
    this.metrics = {
      hits: 0,
      misses: 0,
      refreshes: 0,
      evictions: 0
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.metrics.hits + this.metrics.misses
    return total === 0 ? 0 : this.metrics.hits / total
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      refreshes: 0,
      evictions: 0
    }
  }

  /**
   * Get all cached entries (for debugging)
   */
  entries(): Array<[string, CachedUrl]> {
    return Array.from(this.cache.entries())
  }
}

// Singleton instance
const signedUrlCache = new SignedUrlCache()

export { signedUrlCache, SignedUrlCache }
export type { CachedUrl, CacheMetrics }



