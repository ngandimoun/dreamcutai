import { createClient } from '@/lib/supabase/client'

/**
 * Generate signed URLs for Supabase Storage paths
 * This utility handles the conversion from storage paths to accessible URLs
 */
export async function generateSignedUrl(storagePath: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.storage
      .from('dreamcut')
      .createSignedUrl(storagePath, expiresIn)
    
    if (error) {
      console.error('Error generating signed URL:', error)
      return null
    }
    
    return data?.signedUrl || null
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return null
  }
}

/**
 * Generate multiple signed URLs for an array of storage paths
 */
export async function generateSignedUrls(storagePaths: string[], expiresIn: number = 3600): Promise<string[]> {
  const signedUrlPromises = storagePaths.map(path => generateSignedUrl(path, expiresIn))
  const signedUrls = await Promise.all(signedUrlPromises)
  
  // Filter out null values and return only valid URLs
  return signedUrls.filter((url): url is string => url !== null)
}

/**
 * Check if a URL is a Supabase Storage path (starts with 'renders/')
 */
export function isStoragePath(url: string): boolean {
  return url.startsWith('renders/')
}

/**
 * Convert storage paths to signed URLs, leave regular URLs unchanged
 */
export async function convertToSignedUrls(urls: string[]): Promise<string[]> {
  const results = await Promise.all(
    urls.map(async (url) => {
      if (isStoragePath(url)) {
        const signedUrl = await generateSignedUrl(url)
        return signedUrl || url // Fallback to original URL if signing fails
      }
      return url // Return as-is if not a storage path
    })
  )
  
  return results
}


