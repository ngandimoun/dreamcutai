import { NextRequest, NextResponse } from 'next/server'

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_VOICES_URL = 'https://api.elevenlabs.io/v2/voices'

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

// GET /api/elevenlabs/voices - Fetch ElevenLabs default voices
export async function GET(request: NextRequest) {
  try {
    console.log('🎤 [ELEVENLABS VOICES API] Fetching default voices')

    if (!ELEVENLABS_API_KEY) {
      console.error('❌ [ELEVENLABS VOICES API] API key not configured')
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' }, 
        { status: 500 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const voiceType = searchParams.get('voice_type') || 'default'
    const pageSize = searchParams.get('page_size') || '100'
    const search = searchParams.get('search')

    // Build ElevenLabs API URL with query parameters
    const queryParams = new URLSearchParams({
      voice_type: voiceType,
      page_size: pageSize
    })
    
    // Add search parameter if provided
    if (search && search.trim()) {
      queryParams.append('search', search.trim())
    }
    
    const apiUrl = `${ELEVENLABS_VOICES_URL}?${queryParams.toString()}`

    console.log('🌐 [ELEVENLABS VOICES API] Calling ElevenLabs:', apiUrl)

    // Call ElevenLabs API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [ELEVENLABS VOICES API] ElevenLabs error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      
      return NextResponse.json(
        { 
          error: 'ElevenLabs API call failed', 
          details: errorText,
          status: response.status 
        }, 
        { status: response.status }
      )
    }

    // Parse the response
    const data = await response.json()
    
    console.log('✅ [ELEVENLABS VOICES API] Success:', {
      total_voices: data.voices?.length || 0,
      has_more: data.has_more,
      total_count: data.total_count
    })

    // Transform the response to match our interface
    const defaultVoices: ElevenLabsDefaultVoice[] = (data.voices || []).map((voice: any) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      preview_url: voice.preview_url || '',
      category: voice.category || 'default',
      description: voice.description || '',
      labels: voice.labels || {},
      settings: voice.settings ? {
        stability: voice.settings.stability || 0.5,
        similarity_boost: voice.settings.similarity_boost || 0.75,
        style: voice.settings.style || 0.0,
        use_speaker_boost: voice.settings.use_speaker_boost || true
      } : undefined,
      verified_languages: voice.verified_languages || []
    }))

    return NextResponse.json({
      voices: defaultVoices,
      has_more: data.has_more,
      total_count: data.total_count,
      next_page_token: data.next_page_token
    })

  } catch (error) {
    console.error('❌ [ELEVENLABS VOICES API] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
