/**
 * Image URL Processor for Multi Avatar REFERENCE_2_VIDEO
 * 
 * Handles fetching avatar images from database and uploading temporary images
 * to get public URLs for KIE Veo REFERENCE_2_VIDEO generation.
 */

import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

/**
 * Fetch avatar image URL from character_designs table
 */
export async function getAvatarImageUrl(avatarId: string): Promise<string | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('character_designs')
      .select('generated_image_url, storage_path')
      .eq('id', avatarId)
      .single()
    
    if (error) {
      console.error('Error fetching avatar image:', error)
      return null
    }
    
    if (!data) {
      console.error('Avatar not found:', avatarId)
      return null
    }
    
    // Return the generated image URL if available
    if (data.generated_image_url) {
      return data.generated_image_url
    }
    
    // If no generated_image_url, try to create signed URL from storage_path
    if (data.storage_path) {
      const { data: signedUrlData } = await supabase.storage
        .from('dreamcut')
        .createSignedUrl(data.storage_path, 3600) // 1 hour expiry
      
      return signedUrlData?.signedUrl || null
    }
    
    return null
  } catch (error) {
    console.error('Error in getAvatarImageUrl:', error)
    return null
  }
}

/**
 * Upload temporary image to Supabase storage for REFERENCE_2_VIDEO
 */
export async function uploadTempImage(file: File, userId: string): Promise<string | null> {
  try {
    const supabase = createClient()
    
    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${uuidv4()}-avatar.${fileExtension}`
    const storagePath = `temp/talking-avatars/${userId}/${fileName}`
    
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from('dreamcut')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Error uploading temp image:', error)
      return null
    }
    
    // Create signed URL for public access
    const { data: signedUrlData } = await supabase.storage
      .from('dreamcut')
      .createSignedUrl(storagePath, 3600) // 1 hour expiry
    
    if (!signedUrlData?.signedUrl) {
      console.error('Error creating signed URL for temp image')
      return null
    }
    
    return signedUrlData.signedUrl
  } catch (error) {
    console.error('Error in uploadTempImage:', error)
    return null
  }
}

/**
 * Get public URL for Supabase storage path
 */
export async function getPublicImageUrl(storagePath: string): Promise<string | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.storage
      .from('dreamcut')
      .createSignedUrl(storagePath, 3600) // 1 hour expiry
    
    if (error) {
      console.error('Error creating signed URL:', error)
      return null
    }
    
    return data?.signedUrl || null
  } catch (error) {
    console.error('Error in getPublicImageUrl:', error)
    return null
  }
}

/**
 * Process scene slots to get image URLs for REFERENCE_2_VIDEO
 */
export async function processSceneSlotImages(
  sceneSlots: Array<{
    id: string
    source: 'library' | 'upload'
    file?: File
    avatarId?: string
  }>,
  userId: string
): Promise<string[]> {
  const imageUrls: string[] = []
  
  for (const slot of sceneSlots) {
    if (slot.source === 'library' && slot.avatarId) {
      // Fetch from database
      const imageUrl = await getAvatarImageUrl(slot.avatarId)
      if (imageUrl) {
        imageUrls.push(imageUrl)
      }
    } else if (slot.source === 'upload' && slot.file) {
      // Upload temporary file
      const imageUrl = await uploadTempImage(slot.file, userId)
      if (imageUrl) {
        imageUrls.push(imageUrl)
      }
    }
  }
  
  return imageUrls
}

/**
 * Clean up temporary images after generation
 */
export async function cleanupTempImages(
  tempImagePaths: string[]
): Promise<void> {
  try {
    const supabase = createClient()
    
    for (const path of tempImagePaths) {
      await supabase.storage
        .from('dreamcut')
        .remove([path])
    }
  } catch (error) {
    console.error('Error cleaning up temp images:', error)
    // Don't throw - cleanup is not critical
  }
}
