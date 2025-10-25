import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes a filename for use in storage systems like Supabase
 * Removes special characters, accented letters, and ensures valid characters only
 */
export function sanitizeFilename(filename: string): string {
  // Remove file extension to work with it separately
  const lastDotIndex = filename.lastIndexOf('.')
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : ''
  
  // Normalize and remove accented characters
  const normalized = name
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_') // Replace invalid characters with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
  
  // Ensure we have a valid name
  const sanitizedName = normalized || 'file'
  
  return sanitizedName + extension
}
