import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { POST as voiceDesignHandler } from '@/app/api/elevenlabs/voice-design/route'

// Cache for 30 seconds
export const revalidate = 30

// Validation schema for voice creation
const createVoiceCreationSchema = z.object({
  prompt: z.string().min(1),
  name: z.string().optional(),
  purpose: z.string().optional(),
  language: z.string().optional().default('English'),
  gender: z.string().optional(),
  age: z.string().optional(),
  accent: z.string().optional(),
  tone: z.string().optional(),
  pitch: z.number().min(0).max(100).optional().default(50),
  pacing: z.string().optional(),
  fidelity: z.string().optional(),
  mood: z.string().optional(),
  emotional_weight: z.number().min(0).max(100).optional().default(50),
  role: z.string().optional(),
  style: z.string().optional(),
  audio_quality: z.string().optional(),
  guidance_scale: z.number().min(0).max(100).optional().default(50),
  preview_text: z.string().optional(),
  is_asmr_voice: z.boolean().optional().default(false),
  asmr_intensity: z.number().min(0).max(100).optional().default(50),
  asmr_triggers: z.array(z.string()).optional().default([]),
  asmr_background: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  voice_id: z.string().optional(),
  auto_generate_text: z.boolean().optional().default(false),
  category: z.string().optional(),
  created_at: z.string().optional(),
  content: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
})

// GET /api/voice-creation - Get user's voice creations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query with filters
    let query = supabase
      .from('voices_creations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination (use range instead of limit to avoid conflicts)
    query = query.range(offset, offset + limit - 1)

    const { data: voiceCreations, error } = await query

    if (error) {
      console.error('Error fetching voice creations:', error)
      return NextResponse.json({ error: 'Failed to fetch voice creations' }, { status: 500 })
    }

    // Regenerate expired signed URLs (avatar-persona pattern)
    if (voiceCreations && voiceCreations.length > 0) {
      for (const voice of voiceCreations) {
        // Regenerate primary voice URL
        if (voice.storage_path) {
          const { data: signedUrlData } = await supabase.storage
            .from('dreamcut')
            .createSignedUrl(voice.storage_path, 86400) // 24 hour expiry
          if (signedUrlData?.signedUrl) {
            voice.generated_audio_path = signedUrlData.signedUrl
          }
        }
        
        // Regenerate all preview URLs
        if (voice.content?.all_previews) {
          for (const preview of voice.content.all_previews) {
            if (preview.storage_path) {
              const { data: signedUrlData } = await supabase.storage
                .from('dreamcut')
                .createSignedUrl(preview.storage_path, 86400)
              if (signedUrlData?.signedUrl) {
                preview.signed_url = signedUrlData.signedUrl
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ voiceCreations: voiceCreations }, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'max-age=30'
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/voice-creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/voice-creation - Create new voice creation
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Voice creation API called')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createVoiceCreationSchema.parse(body)

    // Generate unique ID for this generation
    const generationId = `vc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const generationTimestamp = new Date().toISOString()

    // Generate voice_id (will be set after insert)
    const voiceId = validatedData.voice_id || `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Determine category based on purpose
    const getCategoryFromPurpose = (purpose: string | undefined): string => {
      if (!purpose) return 'General'
      const purposeLower = purpose.toLowerCase()
      if (purposeLower.includes('narrator') || purposeLower.includes('storyteller')) return 'Narration'
      if (purposeLower.includes('character') || purposeLower.includes('game')) return 'Character'
      if (purposeLower.includes('brand') || purposeLower.includes('commercial')) return 'Brand'
      if (purposeLower.includes('educational') || purposeLower.includes('instructor')) return 'Educational'
      if (purposeLower.includes('asmr') || purposeLower.includes('meditation')) return 'ASMR'
      if (purposeLower.includes('podcast') || purposeLower.includes('radio')) return 'Podcast'
      return 'General'
    }

    const category = validatedData.category || getCategoryFromPurpose(validatedData.purpose)

    console.log('📝 Voice creation data:', {
      prompt: validatedData.prompt,
      name: validatedData.name,
      purpose: validatedData.purpose,
      language: validatedData.language,
      gender: validatedData.gender,
      age: validatedData.age,
      accent: validatedData.accent,
      tone: validatedData.tone,
      pitch: validatedData.pitch,
      pacing: validatedData.pacing,
      fidelity: validatedData.fidelity,
      mood: validatedData.mood,
      emotional_weight: validatedData.emotional_weight,
      role: validatedData.role,
      style: validatedData.style,
      audio_quality: validatedData.audio_quality,
      guidance_scale: validatedData.guidance_scale,
      preview_text: validatedData.preview_text,
      is_asmr_voice: validatedData.is_asmr_voice,
      asmr_intensity: validatedData.asmr_intensity,
      asmr_triggers: validatedData.asmr_triggers,
      asmr_background: validatedData.asmr_background,
      voice_id: voiceId,
      auto_generate_text: validatedData.auto_generate_text,
      category: category,
      tags: validatedData.tags
    })

    // Call ElevenLabs Voice Design API directly (no HTTP overhead)
    console.log('🎨 [VOICE CREATION API] Calling voice design handler...')
    console.log('📦 [VOICE CREATION API] Voice design request:', {
      voice_description: validatedData.prompt.substring(0, 100) + '...',
      text_length: validatedData.preview_text?.length || 0,
      guidance_scale: validatedData.guidance_scale,
      loudness: (validatedData.pitch - 50) / 50
    })

    // Build request body conditionally
    const voiceDesignRequestBody: any = {
      voice_description: validatedData.prompt, // Enhanced prompt
      guidance_scale: validatedData.guidance_scale,
      loudness: (validatedData.pitch - 50) / 50, // Map 0-100 to -1 to 1
      model_id: 'eleven_ttv_v3',
      output_format: 'mp3_44100_192'
    }

    // If preview text is provided, use it. Otherwise, auto-generate
    if (validatedData.preview_text && validatedData.preview_text.trim()) {
      voiceDesignRequestBody.text = validatedData.preview_text
      voiceDesignRequestBody.auto_generate_text = false
    } else {
      voiceDesignRequestBody.auto_generate_text = true
    }

    const voiceDesignRequest = new Request('http://localhost/api/elevenlabs/voice-design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voiceDesignRequestBody)
    })
    
    const voiceDesignResponse = await voiceDesignHandler(voiceDesignRequest)

    console.log('📡 [VOICE CREATION API] Voice design response status:', voiceDesignResponse.status)

    if (!voiceDesignResponse.ok) {
      const errorData = await voiceDesignResponse.json()
      console.error('❌ [VOICE CREATION API] Voice design failed:', errorData)
      throw new Error(`Voice design generation failed: ${errorData.error || 'Unknown error'}`)
    }

    const { previews, text } = await voiceDesignResponse.json()
    console.log('✅ [VOICE CREATION API] Voice design success:', {
      previews_count: previews?.length || 0,
      text_used: text?.length || 0
    })

    // Upload ALL 3 previews to Supabase Storage
    console.log('📤 [VOICE CREATION API] Starting upload of', previews.length, 'voice previews...')
    const uploadedPreviews = []
    for (let i = 0; i < previews.length; i++) {
      const preview = previews[i]
      console.log(`📤 [VOICE CREATION API] Uploading voice ${i + 1}/3...`)
      
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(preview.audio_base_64, 'base64')
      console.log(`📦 [VOICE CREATION API] Audio buffer size: ${audioBuffer.length} bytes`)
      
      // Upload to Supabase
      const fileName = `${uuidv4()}-voice_${i + 1}.mp3`
      const filePath = `renders/voice-creation/${user.id}/generated/${fileName}`
      console.log(`📁 [VOICE CREATION API] Upload path: ${filePath}`)
      
      const { error: uploadError } = await supabase.storage
        .from('dreamcut')
        .upload(filePath, audioBuffer, {
          contentType: 'audio/mpeg',
          cacheControl: '3600'
        })
      
      if (uploadError) {
        console.error(`❌ [VOICE CREATION API] Error uploading voice ${i + 1}:`, uploadError)
        throw new Error(`Failed to upload voice ${i + 1}`)
      }
      
      // Get signed URL (24 hour expiry)
      const { data: signedUrlData } = await supabase.storage
        .from('dreamcut')
        .createSignedUrl(filePath, 86400)
      
      uploadedPreviews.push({
        generated_voice_id: preview.generated_voice_id, // THE VOICE ID!
        audio_base_64: preview.audio_base_64,
        storage_path: filePath,
        signed_url: signedUrlData?.signedUrl,
        media_type: preview.media_type,
        duration_secs: preview.duration_secs,
        language: preview.language,
        is_primary: i === 0 // First one is primary by default
      })
      
      console.log(`✅ [VOICE CREATION API] Uploaded voice ${i + 1}/3: ${filePath}`)
    }

    // Use primary voice (first variation)
    const primaryVoice = uploadedPreviews[0]
    const generatedAudioUrl = primaryVoice.signed_url
    const generatedStoragePath = primaryVoice.storage_path
    const actualVoiceId = primaryVoice.generated_voice_id

    console.log('🎵 [VOICE CREATION API] Generated audio:', generatedAudioUrl)

    // Create single voice creation record with all 3 variations
    console.log('💾 [VOICE CREATION API] Creating single record with all 3 voice variations...')
    const { data: voiceCreation, error } = await supabase
      .from('voices_creations')
      .insert({
        user_id: user.id,
        title: validatedData.name || `Voice_${Date.now()}`,
        description: validatedData.prompt,
        prompt: validatedData.prompt,
        
        // Voice Identity
        name: validatedData.name,
        purpose: validatedData.purpose,
        language: validatedData.language,
        gender: validatedData.gender,
        age: validatedData.age,
        accent: validatedData.accent,
        tone: validatedData.tone,
        pitch: validatedData.pitch,
        pacing: validatedData.pacing,
        fidelity: validatedData.fidelity,
        
        // Emotional DNA
        mood: validatedData.mood,
        emotional_weight: validatedData.emotional_weight,
        role: validatedData.role,
        style: validatedData.style,
        audio_quality: validatedData.audio_quality,
        guidance_scale: validatedData.guidance_scale,
        preview_text: validatedData.preview_text,
        
        // ASMR Voice Options
        is_asmr_voice: validatedData.is_asmr_voice,
        asmr_intensity: validatedData.asmr_intensity,
        asmr_triggers: validatedData.asmr_triggers,
        asmr_background: validatedData.asmr_background,
        
        // New Fields
        voice_id: actualVoiceId, // Primary voice ID
        auto_generate_text: validatedData.auto_generate_text,
        category: category,
        
        // Generated Content
        generated_audio_path: generatedAudioUrl,
        storage_path: generatedStoragePath,
        
        // Metadata
        tags: validatedData.tags,
        status: 'completed',
        metadata: {
          generationTimestamp,
          generationId,
          generation_batch_id: generationId,
          voice_id: actualVoiceId,
          prompt: validatedData.prompt,
          name: validatedData.name,
          purpose: validatedData.purpose,
          language: validatedData.language,
          gender: validatedData.gender,
          age: validatedData.age,
          accent: validatedData.accent,
          tone: validatedData.tone,
          pitch: validatedData.pitch,
          pacing: validatedData.pacing,
          fidelity: validatedData.fidelity,
          mood: validatedData.mood,
          emotional_weight: validatedData.emotional_weight,
          role: validatedData.role,
          style: validatedData.style,
          audio_quality: validatedData.audio_quality,
          guidance_scale: validatedData.guidance_scale,
          preview_text: validatedData.preview_text,
          is_asmr_voice: validatedData.is_asmr_voice,
          asmr_intensity: validatedData.asmr_intensity,
          asmr_triggers: validatedData.asmr_triggers,
          asmr_background: validatedData.asmr_background,
          auto_generate_text: validatedData.auto_generate_text,
          category: category,
          tags: validatedData.tags,
          generated_via: 'voice-creation'
        },
        content: {
          audio_url: generatedAudioUrl,
          generation_id: generationId,
          voice_id: actualVoiceId,
          full_prompt: validatedData.prompt,
          settings: validatedData,
          auto_generate_text: validatedData.auto_generate_text,
          category: category,
          created_at: validatedData.created_at || generationTimestamp,
          all_previews: uploadedPreviews, // ALL 3 variations with unique voice_ids
          selected_preview_index: 0,
          text_used: text
        }
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [VOICE CREATION API] Error creating voice creation:', error)
      return NextResponse.json({ error: 'Failed to create voice creation' }, { status: 500 })
    }

    console.log('✅ [VOICE CREATION API] Voice creation saved to voices_creations table:', voiceCreation.id)

    // Add all 3 variations to ElevenLabs library
    console.log('📚 [VOICE CREATION API] Adding all 3 variations to ElevenLabs library...')
    const libraryResults = []
    
    for (let i = 0; i < uploadedPreviews.length; i++) {
      const preview = uploadedPreviews[i]
      const variationName = `${validatedData.name || 'Voice'} - Variation ${i + 1}`
      
      try {
        console.log(`📚 [VOICE CREATION API] Adding variation ${i + 1}/3 to ElevenLabs library: ${variationName}`)
        
        // Call ElevenLabs Create Voice API
        const createVoiceResponse = await fetch('http://localhost/api/elevenlabs/create-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voice_name: variationName,
            voice_description: validatedData.prompt,
            generated_voice_id: preview.generated_voice_id
          })
        })
        
        if (createVoiceResponse.ok) {
          const { voice_id } = await createVoiceResponse.json()
          preview.elevenlabs_library_voice_id = voice_id
          libraryResults.push({ variation: i + 1, success: true, voice_id })
          console.log(`✅ [VOICE CREATION API] Variation ${i + 1} added to ElevenLabs library with ID: ${voice_id}`)
        } else {
          const errorText = await createVoiceResponse.text()
          console.error(`❌ [VOICE CREATION API] Failed to add variation ${i + 1} to ElevenLabs library:`, errorText)
          libraryResults.push({ variation: i + 1, success: false, error: errorText })
        }
      } catch (error) {
        console.error(`❌ [VOICE CREATION API] Exception adding variation ${i + 1} to ElevenLabs library:`, error)
        libraryResults.push({ variation: i + 1, success: false, error: error.message })
      }
    }

    // Update the voice creation record with library results
    const { error: updateError } = await supabase
      .from('voices_creations')
      .update({
        content: {
          ...voiceCreation.content,
          all_previews: uploadedPreviews,
          elevenlabs_library_results: libraryResults
        },
        added_to_elevenlabs_library: libraryResults.some(r => r.success),
        elevenlabs_library_added_at: libraryResults.some(r => r.success) ? new Date().toISOString() : null
      })
      .eq('id', voiceCreation.id)

    if (updateError) {
      console.error('❌ [VOICE CREATION API] Failed to update voice creation with library results:', updateError)
    } else {
      console.log('✅ [VOICE CREATION API] Voice creation updated with ElevenLabs library results')
    }

    // Add to library_items table
    const { error: libraryError } = await supabase
      .from('library_items')
      .insert({
        user_id: user.id,
        content_type: 'voices_creations',
        content_id: voiceCreation.id,
        date_added_to_library: new Date().toISOString()
      })

    if (libraryError) {
      console.error('Failed to add voice creation to library:', libraryError)
    } else {
      console.log(`✅ Voice creation ${voiceCreation.id} added to library`)
    }

    return NextResponse.json({ 
      message: 'Voice created with 3 variations', 
      voiceCreation,
      variations: uploadedPreviews.length
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/voice-creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
