import { NextRequest, NextResponse } from 'next/server'

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

// GET /api/elevenlabs/voices/preview - Proxy audio preview with authentication
export async function GET(request: NextRequest) {
  try {
    console.log('🎵 [VOICE PREVIEW PROXY] Request received')

    if (!ELEVENLABS_API_KEY) {
      console.error('❌ [VOICE PREVIEW PROXY] API key not configured')
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' }, 
        { status: 500 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const voiceId = searchParams.get('voice_id')
    const previewUrl = searchParams.get('preview_url')

    if (!voiceId) {
      console.error('❌ [VOICE PREVIEW PROXY] Missing voice_id parameter')
      return NextResponse.json(
        { error: 'voice_id parameter is required' }, 
        { status: 400 }
      )
    }

    if (!previewUrl) {
      console.error('❌ [VOICE PREVIEW PROXY] Missing preview_url parameter')
      return NextResponse.json(
        { error: 'preview_url parameter is required' }, 
        { status: 400 }
      )
    }

    console.log('🎵 [VOICE PREVIEW PROXY] Fetching preview for voice:', voiceId)
    console.log('🎵 [VOICE PREVIEW PROXY] Preview URL:', previewUrl)

    // Fetch the audio file from ElevenLabs
    const audioResponse = await fetch(previewUrl, {
      method: 'GET',
      headers: {
        'Accept': 'audio/mpeg, audio/*',
        'xi-api-key': ELEVENLABS_API_KEY
      }
    })

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text()
      console.error('❌ [VOICE PREVIEW PROXY] Failed to fetch audio:', {
        status: audioResponse.status,
        error: errorText
      })
      return NextResponse.json(
        { 
          error: 'Failed to fetch audio preview', 
          details: errorText,
          status: audioResponse.status 
        }, 
        { status: audioResponse.status }
      )
    }

    // Get the audio data
    const audioBuffer = await audioResponse.arrayBuffer()
    const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg'
    
    console.log('✅ [VOICE PREVIEW PROXY] Successfully proxied audio:', {
      size: audioBuffer.byteLength,
      content_type: contentType
    })

    // Return the audio data with proper headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    console.error('❌ [VOICE PREVIEW PROXY] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
