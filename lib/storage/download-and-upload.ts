import { createClient } from '@/lib/supabase/server'

export interface UploadResult {
  success: boolean
  storagePath?: string
  error?: string
}

/**
 * Downloads content from a URL and uploads it to Supabase Storage
 * @param url - The URL to download from (e.g., fal.ai temporary URL)
 * @param storagePath - The path in Supabase Storage (e.g., 'renders/comics/user_id/file.png')
 * @param contentType - The MIME type of the content
 * @returns Promise<UploadResult>
 */
export async function downloadAndUploadToStorage(
  url: string,
  storagePath: string,
  contentType: string
): Promise<UploadResult> {
  try {
    console.log(`📥 Downloading from: ${url}`)
    console.log(`📤 Uploading to: ${storagePath}`)
    
    // Download the content
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download from ${url}: ${response.status} ${response.statusText}`)
    }
    
    const blob = await response.blob()
    console.log(`📦 Downloaded ${blob.size} bytes`)
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('dreamcut')
      .upload(storagePath, blob, {
        contentType,
        upsert: false // Don't overwrite existing files
      })
    
    if (error) {
      console.error(`❌ Upload error:`, error)
      return {
        success: false,
        error: `Upload failed: ${error.message}`
      }
    }
    
    console.log(`✅ Successfully uploaded to ${storagePath}`)
    return {
      success: true,
      storagePath
    }
    
  } catch (error) {
    console.error(`❌ Download/Upload error:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Downloads multiple images from fal.ai URLs and uploads them to Supabase Storage
 * @param urls - Array of URLs to download from
 * @param baseStoragePath - Base path for storage (e.g., 'renders/comics/user_id')
 * @param recordId - The record ID to use in filenames
 * @param contentType - The MIME type of the content (default: 'image/png')
 * @returns Promise<UploadResult[]>
 */
export async function downloadAndUploadMultipleImages(
  urls: string[],
  baseStoragePath: string,
  recordId: string,
  contentType: string = 'image/png'
): Promise<UploadResult[]> {
  console.log(`📥 Downloading ${urls.length} images for record ${recordId}`)
  
  const uploadPromises = urls.map(async (url, index) => {
    const fileName = `${recordId}_${index}.${contentType.split('/')[1]}`
    const storagePath = `${baseStoragePath}/${fileName}`
    
    return downloadAndUploadToStorage(url, storagePath, contentType)
  })
  
  const results = await Promise.all(uploadPromises)
  
  const successCount = results.filter(r => r.success).length
  console.log(`✅ Successfully uploaded ${successCount}/${urls.length} images`)
  
  return results
}

/**
 * Downloads a single image from fal.ai URL and uploads it to Supabase Storage
 * @param url - The URL to download from
 * @param baseStoragePath - Base path for storage (e.g., 'renders/comics/user_id')
 * @param recordId - The record ID to use in filename
 * @param contentType - The MIME type of the content (default: 'image/png')
 * @returns Promise<UploadResult>
 */
export async function downloadAndUploadSingleImage(
  url: string,
  baseStoragePath: string,
  recordId: string,
  contentType: string = 'image/png'
): Promise<UploadResult> {
  const fileName = `${recordId}.${contentType.split('/')[1]}`
  const storagePath = `${baseStoragePath}/${fileName}`
  
  return downloadAndUploadToStorage(url, storagePath, contentType)
}

/**
 * Downloads audio content and uploads to Supabase Storage
 * @param url - The URL to download from
 * @param baseStoragePath - Base path for storage (e.g., 'renders/voiceovers/user_id')
 * @param recordId - The record ID to use in filename
 * @param contentType - The MIME type of the content (default: 'audio/mpeg')
 * @returns Promise<UploadResult>
 */
export async function downloadAndUploadAudio(
  url: string,
  baseStoragePath: string,
  recordId: string,
  contentType: string = 'audio/mpeg'
): Promise<UploadResult> {
  const fileName = `${recordId}.${contentType.split('/')[1]}`
  const storagePath = `${baseStoragePath}/${fileName}`
  
  return downloadAndUploadToStorage(url, storagePath, contentType)
}

/**
 * Downloads video content and uploads to Supabase Storage
 * @param url - The URL to download from
 * @param baseStoragePath - Base path for storage (e.g., 'renders/ugc-ads/user_id')
 * @param recordId - The record ID to use in filename
 * @param contentType - The MIME type of the content (default: 'video/mp4')
 * @returns Promise<UploadResult>
 */
export async function downloadAndUploadVideo(
  url: string,
  baseStoragePath: string,
  recordId: string,
  contentType: string = 'video/mp4'
): Promise<UploadResult> {
  const fileName = `${recordId}.${contentType.split('/')[1]}`
  const storagePath = `${baseStoragePath}/${fileName}`
  
  return downloadAndUploadToStorage(url, storagePath, contentType)
}


