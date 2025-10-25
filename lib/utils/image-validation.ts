/**
 * Image validation utilities for fal.ai integration
 * Ensures uploaded images are valid and accessible before sending to external services
 */

export interface ImageValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
}

export interface ImageUrlValidationResult {
  accessible: boolean
  error?: string
  statusCode?: number
}

/**
 * Supported image formats for fal.ai
 */
const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
]

const SUPPORTED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp'
]

/**
 * Maximum file size in bytes (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Validate image file format, size, and basic integrity
 */
export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  const warnings: string[] = []

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)})`
    }
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty'
    }
  }

  // Check MIME type
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`
    }
  }

  // Check file extension
  const fileName = file.name.toLowerCase()
  const hasValidExtension = SUPPORTED_EXTENSIONS.some(ext => fileName.endsWith(ext))
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Unsupported file extension. Supported extensions: ${SUPPORTED_EXTENSIONS.join(', ')}`
    }
  }

  // Warn for large files
  if (file.size > 5 * 1024 * 1024) { // 5MB
    warnings.push(`Large file size (${formatFileSize(file.size)}) may cause slower processing`)
  }

  // Basic image integrity check
  try {
    const isValidImage = await checkImageIntegrity(file)
    if (!isValidImage) {
      return {
        valid: false,
        error: 'File appears to be corrupted or not a valid image'
      }
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate image integrity'
    }
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Validate that an image URL is accessible by external services
 */
export async function validateImageUrl(url: string): Promise<ImageUrlValidationResult> {
  try {
    // Use HEAD request to check accessibility without downloading the full image
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'DreamCut-ImageValidator/1.0'
      }
    })

    if (!response.ok) {
      return {
        accessible: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status
      }
    }

    // Check content type
    const contentType = response.headers.get('content-type')
    if (contentType && !SUPPORTED_FORMATS.includes(contentType)) {
      return {
        accessible: false,
        error: `Invalid content type: ${contentType}`
      }
    }

    // Check content length
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return {
        accessible: false,
        error: `File too large: ${formatFileSize(parseInt(contentLength))}`
      }
    }

    return {
      accessible: true
    }

  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Check if file has a valid image format
 */
export function isValidImageFormat(file: File): boolean {
  return SUPPORTED_FORMATS.includes(file.type) && 
         SUPPORTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
}

/**
 * Check basic image integrity using magic bytes (server-safe)
 */
async function checkImageIntegrity(file: File): Promise<boolean> {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Check file signature (magic bytes) for common image formats
    return isValidImageBuffer(buffer, file.type)
  } catch {
    return false
  }
}

/**
 * Validate image buffer by checking magic bytes (file signature)
 */
function isValidImageBuffer(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false
  
  // Check magic bytes for different formats
  const header = buffer.subarray(0, 12)
  
  // JPEG: FF D8 FF
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return mimeType.includes('jpeg') || mimeType.includes('jpg')
  }
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
    return mimeType.includes('png')
  }
  
  // GIF: 47 49 46 38
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
    return mimeType.includes('gif')
  }
  
  // WebP: RIFF ... WEBP
  if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
      header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) {
    return mimeType.includes('webp')
  }
  
  return false
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate multiple image files
 */
export async function validateImageFiles(files: File[]): Promise<{
  valid: boolean
  results: ImageValidationResult[]
  errors: string[]
}> {
  const results: ImageValidationResult[] = []
  const errors: string[] = []

  for (const file of files) {
    const result = await validateImageFile(file)
    results.push(result)
    
    if (!result.valid) {
      errors.push(`${file.name}: ${result.error}`)
    }
  }

  return {
    valid: errors.length === 0,
    results,
    errors
  }
}

/**
 * Validate multiple image URLs
 */
export async function validateImageUrls(urls: string[]): Promise<{
  accessible: boolean
  results: ImageUrlValidationResult[]
  errors: string[]
}> {
  const results: ImageUrlValidationResult[] = []
  const errors: string[] = []

  for (const url of urls) {
    const result = await validateImageUrl(url)
    results.push(result)
    
    if (!result.accessible) {
      errors.push(`${url}: ${result.error}`)
    }
  }

  return {
    accessible: errors.length === 0,
    results,
    errors
  }
}
