import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🎵 [VOICEOVER STREAM] Proxy endpoint called')
    console.log('🎵 [VOICEOVER STREAM] Request URL:', request.url)
    console.log('🎵 [VOICEOVER STREAM] Request headers:', Object.fromEntries(request.headers.entries()))
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🎵 [VOICEOVER STREAM] Auth check:', { user: !!user, error: authError?.message })
    
    if (authError || !user) {
      console.error('❌ [VOICEOVER STREAM] Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get storage path from query params
    const { searchParams } = new URL(request.url)
    const storagePath = searchParams.get('path')

    if (!storagePath) {
      console.error('❌ [VOICEOVER STREAM] Missing path parameter')
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
    }

    console.log('🎵 [VOICEOVER STREAM] Streaming audio from:', storagePath)

    // Download the file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('dreamcut')
      .download(storagePath)

    if (error || !data) {
      console.error('❌ [VOICEOVER STREAM] Failed to download audio:', error)
      return NextResponse.json({ 
        error: 'File not found',
        details: error?.message 
      }, { status: 404 })
    }

    // Log detailed file information
    console.log('✅ [VOICEOVER STREAM] Audio file downloaded')
    console.log('📊 [VOICEOVER STREAM] Blob size:', data.size, 'bytes')
    console.log('📊 [VOICEOVER STREAM] Blob type:', data.type)

    // Check if file is empty
    if (data.size === 0) {
      console.error('❌ [VOICEOVER STREAM] File is empty!')
      return NextResponse.json({ 
        error: 'File is empty',
        details: 'The audio file in storage has 0 bytes'
      }, { status: 404 })
    }

    // Convert Blob to ArrayBuffer to get proper content length
    const arrayBuffer = await data.arrayBuffer()
    console.log('📊 [VOICEOVER STREAM] ArrayBuffer size:', arrayBuffer.byteLength, 'bytes')

    console.log('✅ [VOICEOVER STREAM] Audio file downloaded, streaming to client...')

    // Stream the audio file to the browser
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': data.type || 'audio/mpeg',
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600',
        'Accept-Ranges': 'bytes'
      }
    })
  } catch (error) {
    console.error('❌ [VOICEOVER STREAM] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
