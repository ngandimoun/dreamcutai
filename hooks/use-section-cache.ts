"use client"

import useSWR from 'swr'
import { getContentTypeApiRoute } from '@/lib/types/content-types'

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

interface UseSectionCacheOptions {
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  dedupingInterval?: number
  shouldRetryOnError?: boolean
  keepPreviousData?: boolean
}

interface SectionCacheResult<T = any> {
  data: T[] | undefined
  error: any
  isLoading: boolean
  mutate: () => Promise<T[] | undefined>
  isValidating: boolean
}

/**
 * Custom hook for caching section data using SWR
 * Provides optimized caching for content type data across the application
 */
export function useSectionCache(
  contentType: string,
  userId: string | null,
  options: UseSectionCacheOptions = {}
): SectionCacheResult {
  const {
    revalidateOnFocus = false,
    revalidateOnReconnect = false,
    dedupingInterval = 60000, // 1 minute
    shouldRetryOnError = false,
    keepPreviousData = true
  } = options

  // Build cache key
  const cacheKey = userId ? getContentTypeApiRoute(contentType) : null

  // Use SWR for data fetching with caching
  const { data, error, isLoading, mutate, isValidating } = useSWR(
    cacheKey,
    fetcher,
    {
      revalidateOnFocus,
      revalidateOnReconnect,
      dedupingInterval,
      shouldRetryOnError,
      keepPreviousData,
      onSuccess: (data) => {
        console.log(`📚 Section Cache: ${contentType} data loaded:`, {
          itemsCount: data ? Object.values(data)[0]?.length || 0 : 0,
          cacheKey
        })
      },
      onError: (error) => {
        console.error(`❌ Section Cache: ${contentType} fetch error:`, error)
      }
    }
  )

  // Extract the array from the wrapped response
  // API routes return data wrapped in objects with keys like {watermarks: [...], illustrations: [...]}
  const getResponseKey = (contentType: string): string => {
    const keyMap: Record<string, string> = {
      'watermarks': 'watermarks',
      'video_translations': 'videoTranslations', 
      'subtitles': 'subtitles',
      'illustrations': 'illustrations',
      'explainers': 'explainers',
      'avatars_personas': 'avatars',
      'product_mockups': 'productMockups',
      'concept_worlds': 'conceptWorlds',
      'charts_infographics': 'chartsInfographics',
      'voices_creations': 'voiceCreations',
      'voiceovers': 'voiceovers',
      'music_jingles': 'musicJingles',
      'music_videos': 'musicVideos',
      'sound_fx': 'soundFx',
      'talking_avatars': 'talkingAvatars',
      'social_cuts': 'socialCuts',
      'diverse_motion_single': 'diverseMotionSingle',
      'diverse_motion_dual': 'diverseMotionDual'
    }
    return keyMap[contentType] || contentType
  }

  // Extract items from API response
  const responseKey = getResponseKey(contentType)
  const extractedItems = data?.[responseKey]
  const items = Array.isArray(extractedItems) ? extractedItems : []

  // For voice creations, deduplicate by generation_batch_id
  let processedItems = items
  if (contentType === 'voices_creations' && Array.isArray(items) && items.length > 0) {
    const groupedByBatch = new Map()
    
    for (const item of items) {
      const batchId = item.metadata?.generation_batch_id || item.id
      
      if (!groupedByBatch.has(batchId)) {
        groupedByBatch.set(batchId, item)
      } else {
        // If this item is marked as primary, replace the existing one
        if (item.metadata?.is_primary === true) {
          groupedByBatch.set(batchId, item)
        }
      }
    }
    
    processedItems = Array.from(groupedByBatch.values())
  }

  return {
    data: processedItems,
    error,
    isLoading,
    mutate,
    isValidating
  }
}
