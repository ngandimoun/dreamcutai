import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export interface AudioUploadResult {
  url: string
  path: string
  fileName: string
}

export interface VideoUploadResult {
  url: string
  path: string
  fileName: string
  sunoCdnUrl: string
}

/**
 * Upload audio file to Supabase Storage and return public URL for Suno API
 * @param file - The audio file to upload
 * @param userId - User ID for organizing files
 * @returns Object with public URL, storage path, and filename
 */
export async function uploadAudioForSuno(
  file: File, 
  userId: string
): Promise<AudioUploadResult> {
  const supabase = await createClient()
  
  // Generate unique filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileExtension = file.name.split('.').pop() || 'mp3'
  const fileName = `suno_upload_${timestamp}_${uuidv4()}.${fileExtension}`
  
  // Define storage path
  const storagePath = `renders/music-jingles/${userId}/uploads/${fileName}`
  
  try {
    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('dreamcut')
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      throw new Error(`Failed to upload audio file: ${error.message}`)
    }

    // Get public URL with long expiration for Suno processing (7 days)
    const { data: urlData } = supabase.storage
      .from('dreamcut')
      .createSignedUrl(storagePath, 7 * 24 * 60 * 60) // 7 days in seconds

    if (!urlData?.signedUrl) {
      throw new Error('Failed to generate signed URL for uploaded audio')
    }

    console.log('Audio uploaded successfully:', {
      fileName,
      storagePath,
      url: urlData.signedUrl,
      size: file.size
    })

    return {
      url: urlData.signedUrl,
      path: storagePath,
      fileName
    }
  } catch (error) {
    console.error('Audio upload error:', error)
    throw new Error(`Audio upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Download audio from Suno URL and upload to Supabase Storage
 * @param sunoAudioUrl - URL of the generated audio from Suno
 * @param userId - User ID for organizing files
 * @param taskId - Suno task ID for filename
 * @param audioIndex - Index of audio in case of multiple tracks
 * @returns Object with public URL and storage path
 */
export async function downloadAndStoreSunoAudio(
  sunoAudioUrl: string | undefined,
  userId: string | undefined,
  taskId: string | undefined,
  audioIndex: number = 0
): Promise<AudioUploadResult> {
  // Validate inputs before proceeding
  if (!sunoAudioUrl) {
    throw new Error('sunoAudioUrl is required but was undefined or empty')
  }
  if (!userId) {
    throw new Error('userId is required but was undefined or empty')
  }
  if (!taskId) {
    throw new Error('taskId is required but was undefined or empty')
  }
  
  const supabase = await createClient()
  
  try {
    console.log('📦 [STORAGE] Starting audio download and storage process')
    console.log('📦 [STORAGE] Input parameters:', {
      sunoAudioUrl: sunoAudioUrl.substring(0, 100) + '...',
      userId,
      taskId,
      audioIndex
    })

    // Download audio from Suno
    console.log('📦 [STORAGE] Downloading audio from Suno...')
    const response = await fetch(sunoAudioUrl)
    if (!response.ok) {
      throw new Error(`Failed to download audio from Suno: ${response.status} ${response.statusText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    console.log('📦 [STORAGE] Audio downloaded successfully:', {
      size: audioBuffer.byteLength,
      sizeMB: (audioBuffer.byteLength / 1024 / 1024).toFixed(2)
    })
    
    // Generate filename
    const fileName = `suno_generated_${taskId}_${audioIndex}.mp3`
    const storagePath = `renders/music-jingles/${userId}/generated/${fileName}`
    
    console.log('📦 [STORAGE] Attempting upload:', {
      bucket: 'dreamcut',
      path: storagePath,
      fileSize: audioBuffer.byteLength,
      contentType: 'audio/mpeg'
    })
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('dreamcut')
      .upload(storagePath, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('📦 [STORAGE] Upload error:', {
        message: error.message,
        code: error.name,
        details: error
      })
      throw new Error(`Failed to store Suno audio: ${error.message}`)
    }

    console.log('📦 [STORAGE] Upload successful:', {
      path: data.path,
      id: data.id
    })

    // Get public URL
    console.log('📦 [STORAGE] Generating signed URL...')
    const { data: urlData, error: urlError } = await supabase.storage
      .from('dreamcut')
      .createSignedUrl(storagePath, 30 * 24 * 60 * 60) // 30 days

    if (urlError) {
      console.error('📦 [STORAGE] Signed URL error:', {
        message: urlError.message,
        storagePath: storagePath,
        details: urlError
      })
      throw new Error(`Failed to generate signed URL: ${urlError.message}`)
    }

    if (!urlData?.signedUrl) {
      console.error('📦 [STORAGE] No signed URL returned:', urlData)
      throw new Error('Failed to generate signed URL for stored audio')
    }

    console.log('📦 [STORAGE] Signed URL generated successfully:', {
      url: urlData.signedUrl.substring(0, 100) + '...',
      expiresIn: '30 days'
    })

    console.log('Suno audio stored successfully:', {
      fileName,
      storagePath,
      url: urlData.signedUrl,
      size: audioBuffer.byteLength
    })

    return {
      url: urlData.signedUrl,
      path: storagePath,
      fileName
    }
  } catch (error) {
    console.error('Suno audio download/store error:', error)
    throw new Error(`Failed to download and store Suno audio: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate audio file before upload
 * @param file - File to validate
 * @returns Validation result with success boolean and error message
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const supportedTypes = [
    'audio/mpeg',      // MP3
    'audio/mp3',       // MP3
    'audio/wav',       // WAV
    'audio/wave',      // WAV
    'audio/x-wav',     // WAV
    'audio/ogg',       // OGG
    'audio/mp4',       // M4A
    'audio/aac',       // AAC
    'audio/webm',      // WebM
    'audio/flac'       // FLAC
  ]

  if (!supportedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported audio format: ${file.type}. Supported formats: MP3, WAV, OGG, M4A, AAC, WebM, FLAC`
    }
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 50MB`
    }
  }

  // Check minimum size (1KB)
  const minSize = 1024 // 1KB
  if (file.size < minSize) {
    return {
      valid: false,
      error: 'File too small. Please upload a valid audio file'
    }
  }

  return { valid: true }
}

/**
 * Get file extension from MIME type
 * @param mimeType - MIME type of the file
 * @returns File extension
 */
export function getFileExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
    'audio/webm': 'webm',
    'audio/flac': 'flac'
  }

  return mimeToExt[mimeType.toLowerCase()] || 'mp3'
}

/**
 * Download video from Suno CDN URL and upload to Supabase Storage
 * @param sunoVideoUrl - URL of the generated video from Suno
 * @param userId - User ID for organizing files
 * @param taskId - Suno task ID for filename
 * @returns Object with public URL, storage path, filename, and original Suno CDN URL
 */
export async function downloadAndStoreSunoVideo(
  sunoVideoUrl: string | undefined,
  userId: string | undefined,
  taskId: string | undefined
): Promise<VideoUploadResult> {
  // Validate inputs before proceeding
  if (!sunoVideoUrl) {
    throw new Error('sunoVideoUrl is required but was undefined or empty')
  }
  if (!userId) {
    throw new Error('userId is required but was undefined or empty')
  }
  if (!taskId) {
    throw new Error('taskId is required but was undefined or empty')
  }
  
  const supabase = await createClient()
  
  try {
    console.log('🎬 [VIDEO STORAGE] Starting video download and storage process')
    console.log('🎬 [VIDEO STORAGE] Input parameters:', {
      sunoVideoUrl: sunoVideoUrl.substring(0, 100) + '...',
      userId,
      taskId
    })

    // Download video from Suno
    console.log('🎬 [VIDEO STORAGE] Downloading video from Suno...')
    const response = await fetch(sunoVideoUrl)
    if (!response.ok) {
      throw new Error(`Failed to download video from Suno: ${response.status} ${response.statusText}`)
    }

    const videoBuffer = await response.arrayBuffer()
    console.log('🎬 [VIDEO STORAGE] Video downloaded successfully:', {
      size: videoBuffer.byteLength,
      sizeMB: (videoBuffer.byteLength / 1024 / 1024).toFixed(2)
    })
    
    // Generate filename
    const fileName = `suno_video_${taskId}.mp4`
    const storagePath = `renders/music-videos/${userId}/generated/${fileName}`
    
    console.log('🎬 [VIDEO STORAGE] Attempting upload:', {
      bucket: 'dreamcut',
      path: storagePath,
      fileSize: videoBuffer.byteLength,
      contentType: 'video/mp4'
    })
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('dreamcut')
      .upload(storagePath, videoBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('🎬 [VIDEO STORAGE] Upload error:', {
        message: error.message,
        code: error.name,
        details: error
      })
      throw new Error(`Failed to store Suno video: ${error.message}`)
    }

    console.log('🎬 [VIDEO STORAGE] Upload successful:', {
      path: data.path,
      id: data.id
    })

    // Get public URL
    console.log('🎬 [VIDEO STORAGE] Generating signed URL...')
    const { data: urlData, error: urlError } = await supabase.storage
      .from('dreamcut')
      .createSignedUrl(storagePath, 30 * 24 * 60 * 60) // 30 days

    if (urlError) {
      console.error('🎬 [VIDEO STORAGE] Signed URL error:', {
        message: urlError.message,
        storagePath: storagePath,
        details: urlError
      })
      throw new Error(`Failed to generate signed URL: ${urlError.message}`)
    }

    if (!urlData?.signedUrl) {
      console.error('🎬 [VIDEO STORAGE] No signed URL returned:', urlData)
      throw new Error('Failed to generate signed URL for stored video')
    }

    console.log('🎬 [VIDEO STORAGE] Signed URL generated successfully:', {
      url: urlData.signedUrl.substring(0, 100) + '...',
      expiresIn: '30 days'
    })

    const result = {
      url: urlData.signedUrl,
      path: storagePath,
      fileName,
      sunoCdnUrl: sunoVideoUrl
    }

    console.log('🎬 [VIDEO STORAGE] Video storage completed successfully:', {
      fileName,
      storagePath,
      sunoCdnUrl: sunoVideoUrl.substring(0, 100) + '...',
      signedUrl: urlData.signedUrl.substring(0, 100) + '...'
    })

    return result

  } catch (error) {
    console.error('🎬 [VIDEO STORAGE] Video storage error:', error)
    throw new Error(`Video storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

