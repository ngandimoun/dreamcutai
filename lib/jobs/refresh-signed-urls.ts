/**
 * Background job to refresh expiring signed URLs
 * Runs periodically to ensure URLs are always valid
 */

import { signedUrlCache } from '@/lib/cache/signed-url-cache'
import { metricsCollector } from '@/lib/cache/metrics'
import { createClient } from '@/lib/supabase/server'

interface RefreshResult {
  refreshed: number
  failed: number
  skipped: number
  duration: number
}

/**
 * Refresh expiring signed URLs
 * This should be called periodically (e.g., every 5 minutes)
 */
export async function refreshExpiringUrls(): Promise<RefreshResult> {
  const startTime = Date.now()
  const result: RefreshResult = {
    refreshed: 0,
    failed: 0,
    skipped: 0,
    duration: 0
  }

  try {
    // Get paths that need refreshing (< 20% TTL remaining, default 1 hour TTL)
    const pathsToRefresh = signedUrlCache.getPathsNeedingRefresh(3600)
    
    if (pathsToRefresh.length === 0) {
      console.log('✅ No URLs need refreshing')
      return result
    }

    console.log(`🔄 Refreshing ${pathsToRefresh.length} expiring URLs...`)

    // Create Supabase client
    const supabase = await createClient()

    // Refresh URLs in batches of 10
    const batchSize = 10
    const batches: string[][] = []
    
    for (let i = 0; i < pathsToRefresh.length; i += batchSize) {
      batches.push(pathsToRefresh.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      const refreshPromises = batch.map(async (storagePath) => {
        try {
          // Generate new signed URL
          const { data, error } = await supabase.storage
            .from('dreamcut')
            .createSignedUrl(storagePath, 3600) // 1 hour expiry

          if (error || !data?.signedUrl) {
            console.warn(`Failed to refresh URL for ${storagePath}:`, error)
            result.failed++
            return false
          }

          // Update cache with new URL
          signedUrlCache.refresh(storagePath, data.signedUrl, 3600)
          metricsCollector.recordRefresh()
          result.refreshed++
          return true

        } catch (error) {
          console.error(`Error refreshing URL for ${storagePath}:`, error)
          result.failed++
          return false
        }
      })

      await Promise.all(refreshPromises)
    }

    // Clean up expired entries
    const expiredCount = signedUrlCache.clearExpired()
    if (expiredCount > 0) {
      console.log(`🗑️ Cleared ${expiredCount} expired entries`)
    }

    result.duration = Date.now() - startTime
    console.log(`✅ Refresh complete: ${result.refreshed} refreshed, ${result.failed} failed in ${result.duration}ms`)

    return result

  } catch (error) {
    console.error('Error in refreshExpiringUrls:', error)
    result.duration = Date.now() - startTime
    return result
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStatistics() {
  const metrics = signedUrlCache.getMetrics()
  const performanceMetrics = metricsCollector.getSnapshot(
    signedUrlCache.getHitRate(),
    signedUrlCache.size()
  )

  return {
    cache: {
      size: signedUrlCache.size(),
      hitRate: signedUrlCache.getHitRate(),
      hits: metrics.hits,
      misses: metrics.misses,
      refreshes: metrics.refreshes,
      evictions: metrics.evictions
    },
    performance: performanceMetrics
  }
}



