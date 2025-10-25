/**
 * GPT Image 1 Enhancement Service
 * 
 * Handles chart enhancement using GPT Image 1 via official OpenAI API.
 * Takes raw chart images and enhances them with beautiful styling.
 */

import OpenAI from 'openai'

export interface EnhancementConfig {
  rawChartBuffer: Buffer
  enhancementPrompt: string
  aspectRatio?: string
  quality?: 'low' | 'medium' | 'high' | 'auto'
  background?: 'auto' | 'transparent' | 'opaque'
}

export interface EnhancementResult {
  success: boolean
  enhancedImageUrl?: string
  error?: string
  metadata?: {
    model: string
    processingTime: number
    imageSize: string
  }
}

/**
 * Enhances a chart image using GPT Image 1 via official OpenAI API
 */
export async function enhanceChartWithGPTImage(
  config: EnhancementConfig
): Promise<EnhancementResult> {
  const startTime = Date.now()

  try {
    console.log('🎨 Starting GPT Image 1 chart enhancement...')
    
    const {
      rawChartBuffer,
      enhancementPrompt,
      aspectRatio = '16:9',
      quality = 'high',
      background = 'auto'
    } = config

    console.log(`📊 Enhancing chart (${rawChartBuffer.length} bytes) with prompt: ${enhancementPrompt.substring(0, 100)}...`)

    // Map aspect ratio to OpenAI format
    const imageSize = mapAspectRatioToOpenAIFormat(aspectRatio)
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Call OpenAI Images API edit endpoint
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: rawChartBuffer,
      prompt: enhancementPrompt,
      size: imageSize,
      quality: quality,
      n: 1
    })

    console.log('✅ GPT Image 1 enhancement completed')

    if (!result.data || result.data.length === 0) {
      throw new Error('No enhanced image was returned from GPT Image 1')
    }

    // Get the first (and typically only) enhanced image
    const enhancedImageUrl = result.data[0].url
    const processingTime = Date.now() - startTime

    console.log(`✅ Chart enhancement completed in ${processingTime}ms`)

    return {
      success: true,
      enhancedImageUrl,
      metadata: {
        model: 'gpt-image-1',
        processingTime,
        imageSize: aspectRatio
      }
    }

  } catch (error) {
    console.error('❌ GPT Image 1 chart enhancement failed:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Maps aspect ratio strings to OpenAI image size format
 */
function mapAspectRatioToOpenAIFormat(aspectRatio: string): string {
  switch (aspectRatio) {
    case '1:1':
      return '1024x1024'
    case '4:5':
      return '1024x1280'
    case '16:9':
      return '1536x1024'
    case '9:16':
      return '1024x1536'
    case '3:4':
      return '1024x1365'
    case '4:3':
      return '1365x1024'
    case '2:3':
      return '1024x1536'
    case '21:9':
      return '1792x1024'
    default:
      // Default to 16:9
      return '1536x1024'
  }
}

/**
 * Helper function to validate enhancement configuration
 */
export function validateEnhancementConfig(config: EnhancementConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.rawChartBuffer || config.rawChartBuffer.length === 0) {
    errors.push('Raw chart buffer is required')
  }

  if (!config.enhancementPrompt || config.enhancementPrompt.trim().length === 0) {
    errors.push('Enhancement prompt is required')
  }

  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY environment variable is required')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

