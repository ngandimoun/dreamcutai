import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { generateSpeech, isValidVoice } from '@/lib/openai/text-to-speech'
import { buildOpenAIInstructions } from '@/lib/utils/openai-voice-instructions-builder'
import { enhanceVoiceInstructions, shouldEnhanceInstructions } from '@/lib/openai/enhance-voice-instructions'

// Cache for 30 seconds
export const revalidate = 30

// Validation schema for voiceover creation
const createVoiceoverSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  prompt: z.string().min(1),
  language: z.string().optional().default('English'),
  voice_id: z.string().optional(),
  emotion: z.string().optional(),
  use_case: z.string().optional(),
  audio_url: z.string().optional(),
  content: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
})

// GET /api/voiceovers - Get user's voiceovers
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
      .from('voiceovers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination (use range instead of limit to avoid conflicts)
    query = query.range(offset, offset + limit - 1)

    const { data: voiceovers, error } = await query

    if (error) {
      console.error('Error fetching voiceovers:', error)
      return NextResponse.json({ error: 'Failed to fetch voiceovers' }, { status: 500 })
    }

    // Regenerate expired signed URLs (matching voice creation pattern)
    if (voiceovers && voiceovers.length > 0) {
      console.log(`🔄 [VOICEOVER GET] Regenerating signed URLs for ${voiceovers.length} voiceovers`)
      
      for (const voiceover of voiceovers) {
        if (voiceover.storage_path) {
          try {
            console.log(`🔄 [VOICEOVER GET] Regenerating URL for: ${voiceover.storage_path}`)
            
            const { data: signedUrlData, error: urlError } = await supabase.storage
              .from('dreamcut')
              .createSignedUrl(voiceover.storage_path, 86400) // 24 hour expiry
            
            if (urlError) {
              console.error(`❌ [VOICEOVER GET] URL generation error for ${voiceover.id}:`, urlError)
              continue
            }
            
            if (signedUrlData?.signedUrl) {
              voiceover.generated_audio_path = signedUrlData.signedUrl
              console.log(`✅ [VOICEOVER GET] Regenerated URL for voiceover ${voiceover.id}:`, signedUrlData.signedUrl.substring(0, 100) + '...')
            } else {
              console.error(`❌ [VOICEOVER GET] No signed URL returned for voiceover ${voiceover.id}`)
            }
          } catch (urlError) {
            console.error(`❌ [VOICEOVER GET] Failed to regenerate URL for voiceover ${voiceover.id}:`, urlError)
            // Continue with other voiceovers even if one fails
          }
        } else {
          console.warn(`⚠️ [VOICEOVER GET] No storage_path for voiceover ${voiceover.id}`)
        }
      }
    }

    return NextResponse.json({ voiceovers }, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'max-age=30'
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/voiceovers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/voiceovers - Create new voiceover
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Voiceover generation API called')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createVoiceoverSchema.parse(body)

    console.log('📝 Voiceover generation data:', {
      title: validatedData.title,
      description: validatedData.description,
      prompt: validatedData.prompt,
      language: validatedData.language,
      voice_id: validatedData.voice_id,
      emotion: validatedData.emotion,
      use_case: validatedData.use_case
    })

    // Generate unique ID for this generation
    const generationId = `vo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const generationTimestamp = new Date().toISOString()

    // Extract ElevenLabs settings from content
    const elevenLabsSettings = validatedData.content?.elevenlabs_settings || {}
    const dreamcutVoice = validatedData.content?.dreamcut_voice || {}

    // Validate that we have a voice_id
    if (!validatedData.voice_id) {
      return NextResponse.json({ error: 'Voice ID is required' }, { status: 400 })
    }

    // Validate OpenAI voice
    if (!isValidVoice(validatedData.voice_id)) {
      return NextResponse.json({ 
        error: 'Invalid voice. Must be one of: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse' 
      }, { status: 400 })
    }

    console.log('🎤 [VOICEOVER API] Generating audio with OpenAI TTS...')
    console.log('📝 [VOICEOVER API] Voice:', validatedData.voice_id)
    console.log('📝 [VOICEOVER API] Text length:', validatedData.prompt.length)

    // Build instructions from voice parameters
    const voiceParameters = validatedData.content?.voice_identity || {}
    const emotionalDNA = validatedData.content?.emotional_dna || {}
    
    const voiceParams = {
      gender: voiceParameters.gender,
      age: voiceParameters.age,
      accent: voiceParameters.accent,
      tone: voiceParameters.tone,
      pitch: voiceParameters.pitch,
      pacing: voiceParameters.pacing,
      mood: emotionalDNA.mood,
      emotionalWeight: emotionalDNA.emotional_weight,
      role: emotionalDNA.role,
      style: emotionalDNA.style,
      useCase: validatedData.use_case,
      language: validatedData.language
    }
    
    // Use enhanced instructions if we have meaningful parameters
    const instructions = shouldEnhanceInstructions(voiceParams)
      ? await enhanceVoiceInstructions(voiceParams)
      : buildOpenAIInstructions(voiceParams)

    console.log('📝 [VOICEOVER API] Generated instructions:', instructions.substring(0, 100) + '...')

    // Generate speech using OpenAI TTS
    const ttsResult = await generateSpeech({
      text: validatedData.prompt,
      voice: validatedData.voice_id,
      instructions,
      response_format: 'mp3'
    })

    if (!ttsResult.success) {
      console.error('❌ [VOICEOVER API] OpenAI TTS failed:', ttsResult.error)
      return NextResponse.json({ 
        error: 'Failed to generate audio', 
        details: ttsResult.error 
      }, { status: 500 })
    }

    const audioBuffer = ttsResult.audioBuffer!
    console.log('✅ [VOICEOVER API] Audio generated, size:', audioBuffer.length, 'bytes')

    // Upload to Supabase Storage
    const fileName = `${uuidv4()}-voiceover.mp3`
    const filePath = `renders/voiceovers/${user.id}/generated/${fileName}`
    
    console.log('📤 [VOICEOVER API] Uploading to storage:', filePath)
    console.log('📊 [VOICEOVER API] Buffer size:', audioBuffer.length, 'bytes')
    
    const { error: uploadError } = await supabase.storage
      .from('dreamcut')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('❌ [VOICEOVER API] Storage upload failed:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload audio to storage',
        details: uploadError.message 
      }, { status: 500 })
    }

    console.log('✅ [VOICEOVER API] File uploaded successfully')

    // Get signed URL
    const { data: signedUrlData } = await supabase.storage
      .from('dreamcut')
      .createSignedUrl(filePath, 86400) // 24 hour expiry

    if (!signedUrlData?.signedUrl) {
      console.error('❌ [VOICEOVER API] Failed to generate signed URL')
      return NextResponse.json({ 
        error: 'Failed to generate audio URL' 
      }, { status: 500 })
    }

    const generatedAudioUrl = signedUrlData.signedUrl
    const generatedStoragePath = filePath

    console.log('✅ [VOICEOVER API] Audio uploaded and URL generated:', generatedAudioUrl)

    // Create voiceover
    const { data: voiceover, error } = await supabase
      .from('voiceovers')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        prompt: validatedData.prompt,
        
        // Voice Settings
        voice_id: validatedData.voice_id,
        language: validatedData.language,
        use_case: validatedData.use_case,
        
        // OpenAI TTS Settings
        model_id: 'gpt-4o-mini-tts',
        
        // Generated Content
        generated_audio_path: generatedAudioUrl,
        storage_path: generatedStoragePath,
        
        // Metadata
        api_version: 'v2',
        status: 'completed',
        metadata: {
          generationTimestamp,
          generationId,
          title: validatedData.title,
          description: validatedData.description,
          prompt: validatedData.prompt,
          language: validatedData.language,
          voice_id: validatedData.voice_id,
          use_case: validatedData.use_case,
          generated_via: 'openai-tts-generation',
          ...validatedData.metadata
        },
        content: {
          audio_url: generatedAudioUrl,
          generation_id: generationId,
          full_prompt: validatedData.prompt,
          instructions: instructions,
          voice_identity: voiceParameters,
          emotional_dna: emotionalDNA,
          openai_settings: {
            model: 'gpt-4o-mini-tts',
            voice: validatedData.voice_id,
            response_format: 'mp3'
          },
          settings: validatedData
        }
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating voiceover:', error)
      return NextResponse.json({ error: 'Failed to create voiceover' }, { status: 500 })
    }

    console.log('✅ Voiceover saved to voiceovers table:', voiceover.id)

    // Add to library_items table
    const { error: libraryError } = await supabase
      .from('library_items')
      .insert({
        user_id: user.id,
        content_type: 'voiceovers',
        content_id: voiceover.id,
        date_added_to_library: new Date().toISOString()
      })

    if (libraryError) {
      console.error('Failed to add voiceover to library:', libraryError)
    } else {
      console.log(`✅ Voiceover ${voiceover.id} added to library`)
    }

    return NextResponse.json({ 
      message: 'Voiceover generated and saved successfully', 
      voiceover 
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/voiceovers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

