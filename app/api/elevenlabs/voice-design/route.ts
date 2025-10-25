import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_DESIGN_URL = 'https://api.elevenlabs.io/v1/text-to-voice/design'

// Request validation schema - matches ElevenLabs Voice Design API specification
const voiceDesignSchema = z.object({
  voice_description: z.string().min(20).max(1000),
  text: z.string().min(1).max(1000).optional(),
  auto_generate_text: z.boolean().optional().default(false),
  model_id: z.enum(['eleven_multilingual_ttv_v2', 'eleven_ttv_v3']).optional().default('eleven_multilingual_ttv_v2'),
  loudness: z.number().min(-1).max(1).optional().default(0.5),
  seed: z.number().min(0).max(2147483647).optional(),
  guidance_scale: z.number().min(0).max(100).optional().default(5),
  stream_previews: z.boolean().optional().default(false),
  quality: z.number().min(-1).max(1).optional(),
  reference_audio_base64: z.string().optional(),
  prompt_strength: z.number().min(0).max(1).optional(),
  output_format: z.string().optional().default('mp3_44100_192')
})

export async function POST(request: NextRequest) {
  try {
    console.log('🎙️ [VOICE DESIGN API] Request received')
    
    // Validate request body
    const body = await request.json()
    console.log('📝 [VOICE DESIGN API] Request body:', JSON.stringify(body, null, 2))
    
    const validatedData = voiceDesignSchema.parse(body)
    console.log('✅ [VOICE DESIGN API] Validation passed')

    if (!ELEVENLABS_API_KEY) {
      console.error('❌ [VOICE DESIGN API] API key missing')
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' }, 
        { status: 500 }
      )
    }
    
    console.log('🔑 [VOICE DESIGN API] API key present:', ELEVENLABS_API_KEY ? 'YES' : 'NO')
    console.log('🔑 [VOICE DESIGN API] API key length:', ELEVENLABS_API_KEY?.length || 0)

    // Prepare ElevenLabs API request
    const elevenLabsRequest: any = {
      voice_description: validatedData.voice_description,
      model_id: validatedData.model_id,
      auto_generate_text: validatedData.auto_generate_text,
      loudness: validatedData.loudness,
      guidance_scale: validatedData.guidance_scale,
      stream_previews: validatedData.stream_previews
    }

    // Add optional parameters if provided
    if (validatedData.text) {
      elevenLabsRequest.text = validatedData.text
    }

    if (validatedData.seed !== undefined) {
      elevenLabsRequest.seed = validatedData.seed
    }

    if (validatedData.quality !== undefined) {
      elevenLabsRequest.quality = validatedData.quality
    }

    if (validatedData.reference_audio_base64) {
      elevenLabsRequest.reference_audio_base64 = validatedData.reference_audio_base64
    }

    if (validatedData.prompt_strength !== undefined) {
      elevenLabsRequest.prompt_strength = validatedData.prompt_strength
    }

    // Build query parameters
    const queryParams = new URLSearchParams()
    if (validatedData.output_format) {
      queryParams.append('output_format', validatedData.output_format)
    }

    const apiUrl = `${ELEVENLABS_VOICE_DESIGN_URL}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    console.log('🌐 [VOICE DESIGN API] Calling ElevenLabs:', apiUrl)
    console.log('📦 [VOICE DESIGN API] Payload:', JSON.stringify(elevenLabsRequest, null, 2))

    // Call ElevenLabs Voice Design API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify(elevenLabsRequest)
    })

    console.log('📡 [VOICE DESIGN API] ElevenLabs response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [VOICE DESIGN API] ElevenLabs error:', errorText)
      
      return NextResponse.json(
        { 
          error: 'ElevenLabs Voice Design API call failed', 
          details: errorText,
          status: response.status 
        }, 
        { status: response.status }
      )
    }

    // Parse the response
    const voiceDesignResult = await response.json()
    
    console.log('✅ [VOICE DESIGN API] Success:', { 
      previews_count: voiceDesignResult.previews?.length || 0,
      text_used: voiceDesignResult.text?.length || 0
    })

    // Return the voice design result
    return NextResponse.json(voiceDesignResult, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('❌ [VOICE DESIGN API] Exception:', error)
    console.error('❌ [VOICE DESIGN API] Stack:', error.stack)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters', 
          details: error.errors 
        }, 
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    )
  }
}
