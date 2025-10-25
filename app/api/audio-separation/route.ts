import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sunoClient } from '@/lib/suno/client'
import { SunoApiError } from '@/lib/suno/types'
import { uploadAudioForSuno } from '@/lib/utils/audio-upload'

// Cache for 30 seconds
export const revalidate = 30

// Validation schema for audio separation
const separateAudioSchema = z.object({
  audioFile: z.any(), // File object from FormData
  separationType: z.enum(['separate_vocal', 'split_stem']).default('separate_vocal')
})

export async function POST(request: NextRequest) {
  try {
    console.log('🎵 [SEPARATION API] Audio separation API called')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse FormData
    const formData = await request.formData()
    const audioFile = formData.get('audioFile') as File
    const separationType = formData.get('separationType') as string || 'separate_vocal'

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'File must be an audio file' }, { status: 400 })
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (audioFile.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 50MB' }, { status: 400 })
    }

    console.log('📁 [SEPARATION API] Processing audio file:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      separationType
    })

    // Upload audio to Supabase Storage
    console.log('☁️ [SEPARATION API] Uploading audio to Supabase Storage...')
    const audioUpload = await uploadAudioForSuno(audioFile, user.id)
    
    if (!audioUpload.success || !audioUpload.url) {
      console.error('❌ [SEPARATION API] Failed to upload audio:', audioUpload.error)
      return NextResponse.json({ 
        error: 'Failed to upload audio file',
        details: audioUpload.error
      }, { status: 500 })
    }

    console.log('✅ [SEPARATION API] Audio uploaded successfully:', audioUpload.url)

    // Generate callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const callbackUrl = `${baseUrl}/api/suno/callback`

    // Call Suno audio separation API
    console.log('🎵 [SEPARATION API] Calling Suno audio separation endpoint...')
    const sunoTaskId = await sunoClient.separateAudio({
      uploadUrl: audioUpload.url,
      callBackUrl: callbackUrl,
      type: separationType as 'separate_vocal' | 'split_stem'
    })

    console.log('✅ [SEPARATION API] Suno task created:', sunoTaskId)

    // Save task to database with pending status
    const { data: audioSeparation, error } = await supabase
      .from('audio_separations')
      .insert({
        user_id: user.id,
        source_audio_url: audioUpload.url,
        separation_type: separationType,
        suno_task_id: sunoTaskId,
        status: 'pending',
        metadata: {
          generation_timestamp: new Date().toISOString(),
          suno_task_id: sunoTaskId,
          callback_url: callbackUrl,
          original_filename: audioFile.name,
          file_size: audioFile.size,
          file_type: audioFile.type,
          generated_via: 'suno-api-integration'
        }
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [SEPARATION API] Error creating audio separation:', error)
      return NextResponse.json({ error: 'Failed to create audio separation' }, { status: 500 })
    }

    console.log('✅ [SEPARATION API] Audio separation saved:', audioSeparation.id)

    return NextResponse.json({ 
      message: 'Audio separation started successfully', 
      audioSeparation: {
        id: audioSeparation.id,
        suno_task_id: sunoTaskId,
        status: 'pending',
        separationType: separationType,
        sourceAudioUrl: audioUpload.url
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [SEPARATION API] Validation error:', error.errors)
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    
    if (error instanceof SunoApiError) {
      console.error('❌ [SEPARATION API] Suno API error:', error.message, error.code)
      return NextResponse.json({ 
        error: 'Suno API error', 
        details: error.message,
        code: error.code
      }, { status: 500 })
    }
    
    console.error('❌ [SEPARATION API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🎵 [SEPARATION API] Get audio separations called')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's audio separations
    const { data: audioSeparations, error } = await supabase
      .from('audio_separations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('❌ [SEPARATION API] Error fetching audio separations:', error)
      return NextResponse.json({ error: 'Failed to fetch audio separations' }, { status: 500 })
    }

    return NextResponse.json({ 
      audioSeparations: audioSeparations || []
    })

  } catch (error) {
    console.error('❌ [SEPARATION API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
