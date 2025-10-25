import { SignedUrlCache } from '@/lib/cache/signed-url-cache'

describe('SignedUrlCache', () => {
  let cache: SignedUrlCache

  beforeEach(() => {
    cache = new SignedUrlCache()
  })

  afterEach(() => {
    cache.clear()
  })

  describe('Basic Operations', () => {
    test('should store and retrieve URLs', () => {
      const path = 'renders/comics/user1/test.png'
      const url = 'https://storage.url/test'
      
      cache.set(path, url, 3600)
      const retrieved = cache.get(path)
      
      expect(retrieved).toBe(url)
    })

    test('should return null for non-existent paths', () => {
      const retrieved = cache.get('non-existent-path')
      expect(retrieved).toBeNull()
    })

    test('should delete cached URLs', () => {
      const path = 'test-path'
      cache.set(path, 'test-url', 3600)
      
      const deleted = cache.delete(path)
      expect(deleted).toBe(true)
      expect(cache.get(path)).toBeNull()
    })
  })

  describe('Expiry Management', () => {
    test('should return null for expired URLs', () => {
      const path = 'test-path'
      cache.set(path, 'test-url', -1) // Already expired
      
      const retrieved = cache.get(path)
      expect(retrieved).toBeNull()
    })

    test('should identify URLs needing refresh', () => {
      const path = 'test-path'
      // Set with very short TTL (1 second) so it needs refresh immediately
      cache.set(path, 'test-url', 1)
      
      const needsRefresh = cache.needsRefresh(path, 1)
      expect(needsRefresh).toBe(true)
    })

    test('should clear expired entries', () => {
      cache.set('path1', 'url1', -1) // Expired
      cache.set('path2', 'url2', 3600) // Valid
      
      const cleared = cache.clearExpired()
      expect(cleared).toBe(1)
      expect(cache.size()).toBe(1)
    })
  })

  describe('Metrics', () => {
    test('should track cache hits and misses', () => {
      cache.set('path1', 'url1', 3600)
      
      cache.get('path1') // Hit
      cache.get('path2') // Miss
      
      const metrics = cache.getMetrics()
      expect(metrics.hits).toBe(1)
      expect(metrics.misses).toBe(1)
    })

    test('should calculate hit rate correctly', () => {
      cache.set('path1', 'url1', 3600)
      
      cache.get('path1') // Hit
      cache.get('path1') // Hit
      cache.get('path2') // Miss
      
      const hitRate = cache.getHitRate()
      expect(hitRate).toBeCloseTo(0.6667, 4)
    })

    test('should track refreshes', () => {
      cache.set('path1', 'url1', 3600)
      cache.refresh('path1', 'url2', 3600)
      
      const metrics = cache.getMetrics()
      expect(metrics.refreshes).toBe(1)
    })
  })

  describe('Refresh Detection', () => {
    test('should get paths needing refresh', () => {
      cache.set('path1', 'url1', 1) // Expires soon
      cache.set('path2', 'url2', 3600) // Expires later
      
      const paths = cache.getPathsNeedingRefresh(1)
      expect(paths).toContain('path1')
      expect(paths).not.toContain('path2')
    })
  })

  describe('Cache Management', () => {
    test('should report correct cache size', () => {
      expect(cache.size()).toBe(0)
      
      cache.set('path1', 'url1', 3600)
      cache.set('path2', 'url2', 3600)
      
      expect(cache.size()).toBe(2)
    })

    test('should clear all entries', () => {
      cache.set('path1', 'url1', 3600)
      cache.set('path2', 'url2', 3600)
      
      cache.clear()
      
      expect(cache.size()).toBe(0)
      expect(cache.getMetrics().hits).toBe(0)
    })
  })
})



