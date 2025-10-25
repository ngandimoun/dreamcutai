import { z } from 'zod'

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_CREATE_VOICE_URL = 'https://api.elevenlabs.io/v1/text-to-voice'

// TypeScript interface for ElevenLabs default voice
export interface ElevenLabsDefaultVoice {
  voice_id: string
  name: string
  preview_url: string
  category: string
  description?: string
  labels?: Record<string, string>
  settings?: {
    stability: number
    similarity_boost: number
    style: number
    use_speaker_boost: boolean
  }
  verified_languages?: Array<{
    language: string
    model_id: string
    accent: string
    locale: string
    preview_url: string
  }>
}

// Request validation schema - matches ElevenLabs Create Voice API specification
const createVoiceSchema = z.object({
  voice_name: z.string().min(1).max(255),
  voice_description: z.string().min(20).max(1000),
  generated_voice_id: z.string().min(1),
  labels: z.record(z.string(), z.string().nullable()).optional(),
  played_not_selected_voice_ids: z.array(z.string()).optional()
})

export type CreateVoiceRequest = z.infer<typeof createVoiceSchema>

export interface CreateVoiceResponse {
  voice_id: string
  name: string
  preview_url?: string
}

export interface CreateVoiceError {
  error: string
  details?: string
  status?: number
}

/**
 * Creates a voice in ElevenLabs library using the Create Voice API
 * @param params - Voice creation parameters
 * @returns Promise with voice creation result or error
 */
export async function createVoiceInElevenLabs(
  params: CreateVoiceRequest
): Promise<{ success: true; data: CreateVoiceResponse } | { success: false; error: CreateVoiceError }> {
  try {
    console.log('🎤 [ELEVENLABS UTILITY] Creating voice:', params.voice_name)
    
    // Validate input parameters
    const validatedData = createVoiceSchema.parse(params)
    console.log('✅ [ELEVENLABS UTILITY] Validation passed')

    if (!ELEVENLABS_API_KEY) {
      console.error('❌ [ELEVENLABS UTILITY] API key missing')
      return {
        success: false,
        error: {
          error: 'ElevenLabs API key not configured',
          status: 500
        }
      }
    }
    
    console.log('🔑 [ELEVENLABS UTILITY] API key present:', ELEVENLABS_API_KEY ? 'YES' : 'NO')

    // Prepare ElevenLabs API request
    const elevenLabsRequest: any = {
      voice_name: validatedData.voice_name,
      voice_description: validatedData.voice_description,
      generated_voice_id: validatedData.generated_voice_id
    }

    // Add optional parameters if provided
    if (validatedData.labels) {
      elevenLabsRequest.labels = validatedData.labels
    }

    if (validatedData.played_not_selected_voice_ids) {
      elevenLabsRequest.played_not_selected_voice_ids = validatedData.played_not_selected_voice_ids
    }

    console.log('🌐 [ELEVENLABS UTILITY] Calling ElevenLabs:', ELEVENLABS_CREATE_VOICE_URL)
    console.log('📦 [ELEVENLABS UTILITY] Payload:', JSON.stringify(elevenLabsRequest, null, 2))

    // Call ElevenLabs Create Voice API
    const response = await fetch(ELEVENLABS_CREATE_VOICE_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify(elevenLabsRequest)
    })

    console.log('📡 [ELEVENLABS UTILITY] ElevenLabs response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [ELEVENLABS UTILITY] ElevenLabs error:', errorText)
      
      return {
        success: false,
        error: {
          error: 'ElevenLabs Create Voice API call failed',
          details: errorText,
          status: response.status
        }
      }
    }

    // Parse the response
    const voiceResult = await response.json()
    
    console.log('✅ [ELEVENLABS UTILITY] Success:', { 
      voice_id: voiceResult.voice_id,
      name: voiceResult.name,
      preview_url: voiceResult.preview_url ? 'YES' : 'NO'
    })

    return {
      success: true,
      data: voiceResult
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [ELEVENLABS UTILITY] Validation error:', error.errors)
      return {
        success: false,
        error: {
          error: 'Invalid request data',
          details: JSON.stringify(error.errors),
          status: 400
        }
      }
    }

    console.error('❌ [ELEVENLABS UTILITY] Exception:', error)
    return {
      success: false,
      error: {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 500
      }
    }
  }
}

/**
 * Fetches ElevenLabs default voices from our API endpoint
 * @param searchQuery Optional search query to filter voices
 * @returns Promise with default voices or error
 */
export async function fetchDefaultVoices(searchQuery?: string): Promise<{ 
  success: true; 
  data: ElevenLabsDefaultVoice[] 
} | { 
  success: false; 
  error: string 
}> {
  try {
    console.log('🎤 [ELEVENLABS UTILITY] Fetching default voices', searchQuery ? `with search: "${searchQuery}"` : '')
    
    // Build URL with optional search parameter
    const url = new URL('/api/elevenlabs/voices', window.location.origin)
    url.searchParams.set('voice_type', 'default')
    url.searchParams.set('page_size', '100')
    if (searchQuery && searchQuery.trim()) {
      url.searchParams.set('search', searchQuery.trim())
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ [ELEVENLABS UTILITY] API error:', errorData)
      return {
        success: false,
        error: errorData.error || 'Failed to fetch default voices'
      }
    }

    const data = await response.json()
    console.log('✅ [ELEVENLABS UTILITY] Successfully fetched default voices:', {
      count: data.voices?.length || 0
    })

    return {
      success: true,
      data: data.voices || []
    }

  } catch (error) {
    console.error('❌ [ELEVENLABS UTILITY] Exception fetching default voices:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
