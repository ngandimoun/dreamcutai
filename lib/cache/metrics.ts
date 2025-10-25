/**
 * Performance metrics for cache and storage operations
 */

interface PerformanceMetrics {
  cacheHitRate: number
  averageResponseTime: number
  urlsRefreshedPerHour: number
  cacheSize: number
  totalRequests: number
  lastUpdated: number
}

interface ResponseTimeEntry {
  timestamp: number
  duration: number
}

class MetricsCollector {
  private responseTimes: ResponseTimeEntry[] = []
  private refreshCount: number = 0
  private requestCount: number = 0
  private lastResetTime: number = Date.now()
  
  // Keep response times for the last hour
  private readonly MAX_AGE_MS = 60 * 60 * 1000

  /**
   * Record a response time
   */
  recordResponseTime(durationMs: number): void {
    const now = Date.now()
    this.responseTimes.push({
      timestamp: now,
      duration: durationMs
    })
    this.requestCount++
    
    // Clean up old entries
    this.cleanOldEntries()
  }

  /**
   * Record a URL refresh
   */
  recordRefresh(): void {
    this.refreshCount++
  }

  /**
   * Get average response time for the last hour
   */
  getAverageResponseTime(): number {
    this.cleanOldEntries()
    
    if (this.responseTimes.length === 0) {
      return 0
    }

    const sum = this.responseTimes.reduce((acc, entry) => acc + entry.duration, 0)
    return sum / this.responseTimes.length
  }

  /**
   * Get URLs refreshed per hour
   */
  getUrlsRefreshedPerHour(): number {
    const now = Date.now()
    const hoursSinceReset = (now - this.lastResetTime) / (60 * 60 * 1000)
    
    if (hoursSinceReset === 0) {
      return 0
    }

    return this.refreshCount / hoursSinceReset
  }

  /**
   * Get total requests
   */
  getTotalRequests(): number {
    return this.requestCount
  }

  /**
   * Clean up entries older than MAX_AGE_MS
   */
  private cleanOldEntries(): void {
    const now = Date.now()
    const cutoff = now - this.MAX_AGE_MS
    
    this.responseTimes = this.responseTimes.filter(
      entry => entry.timestamp >= cutoff
    )
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.responseTimes = []
    this.refreshCount = 0
    this.requestCount = 0
    this.lastResetTime = Date.now()
  }

  /**
   * Get a snapshot of current metrics
   */
  getSnapshot(cacheHitRate: number, cacheSize: number): PerformanceMetrics {
    return {
      cacheHitRate,
      averageResponseTime: this.getAverageResponseTime(),
      urlsRefreshedPerHour: this.getUrlsRefreshedPerHour(),
      cacheSize,
      totalRequests: this.getTotalRequests(),
      lastUpdated: Date.now()
    }
  }
}

// Singleton instance
const metricsCollector = new MetricsCollector()

export { metricsCollector, MetricsCollector }
export type { PerformanceMetrics }



