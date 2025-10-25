"use client"

import { createContext, useContext, ReactNode, useCallback } from "react"
import { mutate } from 'swr'
import { getContentTypeApiRoute } from '@/lib/types/content-types'

interface CacheContextType {
  invalidateSection: (contentType: string) => Promise<void>
  invalidateAll: () => Promise<void>
  getCacheStats: () => { cachedSections: string[], totalCached: number }
}

const CacheContext = createContext<CacheContextType | undefined>(undefined)

interface CacheProviderProps {
  children: ReactNode
}

export function CacheProvider({ children }: CacheProviderProps) {
  // Track which sections have been cached
  const cachedSections = new Set<string>()

  /**
   * Invalidate cache for a specific content type
   */
  const invalidateSection = useCallback(async (contentType: string) => {
    try {
      const apiRoute = getContentTypeApiRoute(contentType)
      console.log(`🔄 Cache: Invalidating section ${contentType} at ${apiRoute}`)
      
      // Use SWR's mutate to revalidate the cache
      await mutate(apiRoute)
      
      // Track this section as cached
      cachedSections.add(contentType)
      
      console.log(`✅ Cache: Section ${contentType} invalidated successfully`)
    } catch (error) {
      console.error(`❌ Cache: Failed to invalidate section ${contentType}:`, error)
    }
  }, [])

  /**
   * Invalidate cache for all content types
   */
  const invalidateAll = useCallback(async () => {
    try {
      console.log(`🔄 Cache: Invalidating all sections`)
      
      const contentTypes = [
        'watermarks',
        'video_translations',
        'subtitles',
        'illustrations',
        'explainers',
        'avatars_personas',
        'product_mockups',
        'concept_worlds',
        'charts_infographics',
        'voices_creations',
        'voiceovers',
        'music_jingles',
        'music_videos',
        'sound_fx',
        'talking_avatars',
        'social_cuts',
        'diverse_motion_single',
        'diverse_motion_dual'
      ]

      // Invalidate all sections in parallel
      await Promise.all(
        contentTypes.map(contentType => invalidateSection(contentType))
      )
      
      console.log(`✅ Cache: All sections invalidated successfully`)
    } catch (error) {
      console.error(`❌ Cache: Failed to invalidate all sections:`, error)
    }
  }, [invalidateSection])

  /**
   * Get cache statistics for debugging
   */
  const getCacheStats = useCallback(() => {
    return {
      cachedSections: Array.from(cachedSections),
      totalCached: cachedSections.size
    }
  }, [])

  const value: CacheContextType = {
    invalidateSection,
    invalidateAll,
    getCacheStats
  }

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  )
}

export function useCacheContext() {
  const context = useContext(CacheContext)
  if (context === undefined) {
    throw new Error('useCacheContext must be used within a CacheProvider')
  }
  return context
}
