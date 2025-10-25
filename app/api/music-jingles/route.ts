import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { sunoClient } from '@/lib/suno/client'
import { SunoApiError, SUNO_CHARACTER_LIMITS } from '@/lib/suno/types'
import { uploadAudioForSuno, validateAudioFile } from '@/lib/utils/audio-upload'
import { signedUrlCache } from '@/lib/cache/signed-url-cache'
import { buildStyleEnhancement, buildSimplePrompt } from '@/lib/utils/music-prompt-builder'

// Validate model compatibility with action
function validateModelForAction(model: string, audioAction?: string): boolean {
  if (audioAction === 'add_instrumental' || audioAction === 'add_vocals') {
    return model === 'V4_5PLUS' || model === 'V5'
  }
  return true
}

// Cache for 30 seconds
export const revalidate = 30

// Validation schema for music/jingle creation
const createMusicJingleSchema = z.object({
  // Core parameters
  prompt: z.string().min(1).max(5000),
  title: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  description: z.string().optional(),
  
  // Mode settings - accept both string and boolean
  customMode: z.union([z.string(), z.boolean()]).transform(val => {
    if (typeof val === 'boolean') return val
    return val === 'true'
  }).default(false),
  
  instrumental: z.union([z.string(), z.boolean()]).transform(val => {
    if (typeof val === 'boolean') return val
    return val === 'true'
  }).default(false),
  
  model: z.enum(['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5']).default('V5'),
  
  // Advanced parameters - accept both string and number
  style: z.string().max(1000).optional(),
  vocalGender: z.enum(['m', 'f', 'auto']).optional(),
  
  styleWeight: z.union([z.string(), z.number()]).transform(val => {
    const num = typeof val === 'number' ? val : parseFloat(val)
    return num
  }).pipe(z.number().min(0).max(1)).optional(),
  
  weirdnessConstraint: z.union([z.string(), z.number()]).transform(val => {
    const num = typeof val === 'number' ? val : parseFloat(val)
    return num
  }).pipe(z.number().min(0).max(1)).optional(),
  
  audioWeight: z.union([z.string(), z.number()]).transform(val => {
    const num = typeof val === 'number' ? val : parseFloat(val)
    return num
  }).pipe(z.number().min(0).max(1)).optional(),
  
  negativeTags: z.string().optional(),
  
  // Audio action (for uploads)
  audioAction: z.enum(['generate', 'cover', 'extend', 'add_instrumental', 'add_vocals']).optional(),
  
  continueAt: z.union([z.string(), z.number()]).transform(val => {
    const num = typeof val === 'number' ? val : parseFloat(val)
    return num
  }).pipe(z.number().min(0)).optional(),
  
  tags: z.string().max(1000).optional(),
  
  // Legacy fields - accept both string and native types
  styles: z.union([z.string(), z.array(z.string())]).transform(val => {
    if (Array.isArray(val)) return val
    if (!val) return []
    try {
      return JSON.parse(val)
    } catch {
      return val.split(',').map(s => s.trim()).filter(Boolean)
    }
  }).optional(),
  
  duration: z.union([z.string(), z.number()]).transform(val => {
    const num = typeof val === 'number' ? val : parseFloat(val)
    return num
  }).pipe(z.number()).optional(),
  
  volume: z.union([z.string(), z.number()]).transform(val => {
    const num = typeof val === 'number' ? val : parseFloat(val)
    return num
  }).pipe(z.number()).optional(),
  
  fade_in: z.union([z.string(), z.number()]).transform(val => {
    const num = typeof val === 'number' ? val : parseFloat(val)
    return num
  }).pipe(z.number()).optional(),
  
  fade_out: z.union([z.string(), z.number()]).transform(val => {
    const num = typeof val === 'number' ? val : parseFloat(val)
    return num
  }).pipe(z.number()).optional(),
  
  loop_mode: z.union([z.string(), z.boolean()]).transform(val => {
    if (typeof val === 'boolean') return val
    return val === 'true'
  }).optional(),
  
  stereo_mode: z.enum(['mono', 'stereo', 'wide']).optional(),
  
  created_at: z.string().optional(),
})

// GET /api/music-jingles - Get user's music/jingles
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
      .from('music_jingles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination (use range instead of limit to avoid conflicts)
    query = query.range(offset, offset + limit - 1)

    const { data: musicJingles, error } = await query

    if (error) {
      console.error('Error fetching music/jingles:', error)
      return NextResponse.json({ error: 'Failed to fetch music/jingles' }, { status: 500 })
    }

    // Regenerate expired signed URLs with caching (matching library pattern)
    if (musicJingles && musicJingles.length > 0) {
      console.log(`🔄 [MUSIC GET] Regenerating signed URLs for ${musicJingles.length} music jingles`)
      
      let cacheHits = 0
      let cacheMisses = 0
      const urlsToGenerate: Array<{ jingle: any, storagePath: string }> = []
      
      // Check cache first
      for (const jingle of musicJingles) {
        if (jingle.storage_path) {
          const cachedUrl = signedUrlCache.get(jingle.storage_path)
          if (cachedUrl) {
            jingle.generated_audio_path = cachedUrl
            jingle.audio_url = cachedUrl
            cacheHits++
          } else {
            urlsToGenerate.push({ jingle, storagePath: jingle.storage_path })
            cacheMisses++
          }
        } else {
          // This jingle uses Suno CDN URL directly (no local storage needed)
          console.log(`📊 [MUSIC GET] Using Suno CDN URL for jingle ${jingle.id}`)
        }
      }
      
      // Generate signed URLs only for cache misses in batches of 10
      if (urlsToGenerate.length > 0) {
        const batchSize = 10
        const batches = []
        for (let i = 0; i < urlsToGenerate.length; i += batchSize) {
          batches.push(urlsToGenerate.slice(i, i + batchSize))
        }

        const signedUrlPromises = batches.map(async (batch) => {
          const batchPromises = batch.map(async ({ jingle, storagePath }) => {
            try {
              const { data: signedUrlData, error: urlError } = await supabase.storage
                .from('dreamcut')
                .createSignedUrl(storagePath, 86400) // 24 hour expiry
              
              if (!urlError && signedUrlData?.signedUrl) {
                // Store in cache for future requests
                signedUrlCache.set(storagePath, signedUrlData.signedUrl, 86400)
                jingle.generated_audio_path = signedUrlData.signedUrl
                jingle.audio_url = signedUrlData.signedUrl
                return { jingleId: jingle.id, success: true }
              } else {
                console.error(`❌ [MUSIC GET] URL generation error for ${jingle.id}:`, urlError)
                return { jingleId: jingle.id, success: false }
              }
            } catch (urlError) {
              console.error(`❌ [MUSIC GET] Failed to regenerate URL for jingle ${jingle.id}:`, urlError)
              return { jingleId: jingle.id, success: false }
            }
          })
          
          const results = await Promise.all(batchPromises)
          return results.filter(r => r.success)
        })

        const signedUrlResults = await Promise.all(signedUrlPromises)
        const successfulResults = signedUrlResults.flat()
        console.log(`✅ [MUSIC GET] Generated ${successfulResults.length} new signed URLs`)
      }
      
      // Log cache performance
      console.log(`📊 [MUSIC GET] Cache performance: ${cacheHits} hits, ${cacheMisses} misses, ${((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1)}% hit rate`)
    }

    return NextResponse.json({ musicJingles }, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'max-age=30'
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/music-jingles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/music-jingles - Create new music/jingle
export async function POST(request: NextRequest) {
  try {
    console.log('🎵 [MUSIC API] Music jingle generation API called')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body (can be JSON or FormData)
    let validatedData: any
    let audioFile: File | null = null

    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with file upload)
      const formData = await request.formData()
      
      // Extract file if present
      const file = formData.get('audioFile') as File
      if (file && file.size > 0) {
        audioFile = file
        console.log('📁 [MUSIC API] Audio file received:', {
          name: file.name,
          size: file.size,
          type: file.type
        })
      }
      
      // Convert FormData to object for validation
      const data: any = {}
      for (const [key, value] of formData.entries()) {
        if (key !== 'audioFile') {
          // Convert string values to appropriate types
          if (value === 'true') data[key] = true
          else if (value === 'false') data[key] = false
          else if (!isNaN(Number(value)) && value !== '') data[key] = Number(value)
          else data[key] = value
        }
      }
      
      validatedData = createMusicJingleSchema.parse(data)
    } else {
      // Handle JSON
    const body = await request.json()
      validatedData = createMusicJingleSchema.parse(body)
    }

    console.log('📝 [MUSIC API] Validated data:', {
      // Core
      prompt: validatedData.prompt?.substring(0, 100) + '...',
      title: validatedData.title,
      customMode: validatedData.customMode,
      instrumental: validatedData.instrumental,
      model: validatedData.model,
      
      // Advanced Suno params
      style: validatedData.style,
      vocalGender: validatedData.vocalGender,
      styleWeight: validatedData.styleWeight,
      weirdnessConstraint: validatedData.weirdnessConstraint,
      audioWeight: validatedData.audioWeight,
      negativeTags: validatedData.negativeTags,
      
      // Tags/Styles
      tags: validatedData.tags,
      styles: validatedData.styles,
      
      // Legacy/Post-processing
      duration: validatedData.duration,
      volume: validatedData.volume,
      fade_in: validatedData.fade_in,
      fade_out: validatedData.fade_out,
      loop_mode: validatedData.loop_mode,
      stereo_mode: validatedData.stereo_mode,
      
      // Audio action
      audioAction: validatedData.audioAction,
      continueAt: validatedData.continueAt,
      hasAudioFile: !!audioFile
    })

    // Validate model compatibility with action
    if (validatedData.audioAction && !validateModelForAction(validatedData.model, validatedData.audioAction)) {
      return NextResponse.json({ 
        error: `Model ${validatedData.model} is not supported for ${validatedData.audioAction}. Please use V4_5PLUS or V5.` 
      }, { status: 400 })
    }

    // Validate character limits
    const limits = SUNO_CHARACTER_LIMITS[validatedData.model]
    if (validatedData.prompt.length > limits.prompt) {
      return NextResponse.json({ 
        error: `Prompt exceeds ${limits.prompt} character limit for ${validatedData.model}` 
      }, { status: 400 })
    }
    
    if (validatedData.title && validatedData.title.length > limits.title) {
      return NextResponse.json({ 
        error: `Title exceeds ${limits.title} character limit for ${validatedData.model}` 
      }, { status: 400 })
    }
    
    if (validatedData.style && validatedData.style.length > limits.style) {
      return NextResponse.json({ 
        error: `Style exceeds ${limits.style} character limit for ${validatedData.model}` 
      }, { status: 400 })
    }
    
    if (validatedData.tags && validatedData.tags.length > limits.style) {
      return NextResponse.json({ 
        error: `Tags exceeds ${limits.style} character limit for ${validatedData.model}` 
      }, { status: 400 })
    }

    // Validate audio file if present
    if (audioFile) {
      const validation = validateAudioFile(audioFile)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
    }

    // Generate callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const callbackUrl = `${baseUrl}/api/suno/callback`

    let sunoTaskId: string
    let uploadUrl: string | null = null

    // Determine which Suno endpoint to use and call it
    if (audioFile && validatedData.audioAction) {
      // Upload audio to Supabase Storage first
      console.log('📤 [MUSIC API] Uploading audio to Supabase Storage...')
      const audioUpload = await uploadAudioForSuno(audioFile, user.id)
      uploadUrl = audioUpload.url
      
      console.log('✅ [MUSIC API] Audio uploaded:', audioUpload.fileName)

      // Call appropriate Suno endpoint based on action
      if (validatedData.audioAction === 'cover') {
        console.log('🎨 [MUSIC API] Calling Suno upload-cover endpoint...')
        sunoTaskId = await sunoClient.uploadAndCover({
          uploadUrl: audioUpload.url,
          prompt: validatedData.prompt,
          customMode: validatedData.customMode,
          instrumental: validatedData.instrumental,
          model: validatedData.model,
          style: validatedData.style,
          title: validatedData.title,
          vocalGender: validatedData.vocalGender,
          styleWeight: validatedData.styleWeight,
          weirdnessConstraint: validatedData.weirdnessConstraint,
          audioWeight: validatedData.audioWeight,
          negativeTags: validatedData.negativeTags,
          callBackUrl: callbackUrl
        })
      } else if (validatedData.audioAction === 'extend') {
        console.log('⏩ [MUSIC API] Calling Suno upload-extend endpoint...')
        sunoTaskId = await sunoClient.uploadAndExtend({
          uploadUrl: audioUpload.url,
          defaultParamFlag: true,
          instrumental: validatedData.instrumental,
          prompt: validatedData.prompt,
          style: validatedData.style,
          title: validatedData.title,
          continueAt: validatedData.continueAt || 0,
          model: validatedData.model,
          vocalGender: validatedData.vocalGender,
          styleWeight: validatedData.styleWeight,
          weirdnessConstraint: validatedData.weirdnessConstraint,
          audioWeight: validatedData.audioWeight,
          negativeTags: validatedData.negativeTags,
          callBackUrl: callbackUrl
        })
      } else if (validatedData.audioAction === 'add_instrumental') {
        console.log('🎸 [MUSIC API] Calling Suno add-instrumental endpoint...')
        sunoTaskId = await sunoClient.addInstrumental({
          uploadUrl: audioUpload.url,
          title: validatedData.title || 'Untitled',
          negativeTags: validatedData.negativeTags || '',
          tags: validatedData.tags || validatedData.style || '',
          callBackUrl: callbackUrl,
          model: validatedData.model as 'V4_5PLUS' | 'V5',
          vocalGender: validatedData.vocalGender,
          styleWeight: validatedData.styleWeight,
          weirdnessConstraint: validatedData.weirdnessConstraint,
          audioWeight: validatedData.audioWeight
        })
      } else if (validatedData.audioAction === 'add_vocals') {
        console.log('🎤 [MUSIC API] Calling Suno add-vocals endpoint...')
        sunoTaskId = await sunoClient.addVocals({
          uploadUrl: audioUpload.url,
          prompt: validatedData.prompt,
          title: validatedData.title || 'Untitled',
          negativeTags: validatedData.negativeTags || '',
          style: validatedData.style || '',
          callBackUrl: callbackUrl,
          model: validatedData.model as 'V4_5PLUS' | 'V5',
          vocalGender: validatedData.vocalGender,
          styleWeight: validatedData.styleWeight,
          weirdnessConstraint: validatedData.weirdnessConstraint,
          audioWeight: validatedData.audioWeight
        })
      } else {
        // Default to cover for other actions
        console.log('🎨 [MUSIC API] Calling Suno upload-cover endpoint (default)...')
        sunoTaskId = await sunoClient.uploadAndCover({
          uploadUrl: audioUpload.url,
          prompt: validatedData.prompt,
          customMode: validatedData.customMode,
          instrumental: validatedData.instrumental,
          model: validatedData.model,
          style: validatedData.style,
          title: validatedData.title,
          vocalGender: validatedData.vocalGender,
          styleWeight: validatedData.styleWeight,
          weirdnessConstraint: validatedData.weirdnessConstraint,
          audioWeight: validatedData.audioWeight,
          negativeTags: validatedData.negativeTags,
          callBackUrl: callbackUrl
        })
      }
    } else {
      // Standard generation - use /api/v1/generate
      console.log('🎵 [MUSIC API] Calling Suno generate endpoint...')
      
      let finalPrompt: string
      let finalStyle: string | undefined
      
      if (validatedData.customMode) {
        // Custom Mode: Don't enhance prompt (it should contain raw lyrics)
        // Instead, enhance the style field with technical parameters
        finalPrompt = validatedData.prompt // Raw lyrics, no enhancement
        
        // Build enhanced style incorporating user parameters
        const enhancedStyle = buildStyleEnhancement({
          baseStyle: validatedData.style,
          duration: validatedData.duration,
          styles: validatedData.styles,
          loop_mode: validatedData.loop_mode,
          stereo_mode: validatedData.stereo_mode,
          instrumental: validatedData.instrumental,
          vocalGender: validatedData.vocalGender,
          negativeTags: validatedData.negativeTags
        })
        finalStyle = enhancedStyle
        
        console.log('📊 [MUSIC API] Custom Mode Enhancement Summary:')
        console.log('  Raw prompt (lyrics):', validatedData.prompt)
        console.log('  Enhanced style:', enhancedStyle)
      } else {
        // Simple Mode: Enhance prompt with technical parameters
        // Style should be empty (Suno auto-generates)
        finalPrompt = buildSimplePrompt({
          prompt: validatedData.prompt,
          duration: validatedData.duration,
          styles: validatedData.styles,
          loop_mode: validatedData.loop_mode,
          stereo_mode: validatedData.stereo_mode,
          instrumental: validatedData.instrumental,
          vocalGender: validatedData.vocalGender,
          negativeTags: validatedData.negativeTags
        })
        finalStyle = undefined // Simple mode doesn't use style field
        
        console.log('📊 [MUSIC API] Simple Mode Enhancement Summary:')
        console.log('  Original prompt:', validatedData.prompt)
        console.log('  Enhanced prompt:', finalPrompt)
      }
      
      const sunoRequestParams = {
        prompt: finalPrompt,
        customMode: validatedData.customMode,
        instrumental: validatedData.instrumental,
        model: validatedData.model,
        style: finalStyle, // Enhanced style in Custom Mode, undefined in Simple Mode
        title: validatedData.title,
        vocalGender: validatedData.vocalGender,
        styleWeight: validatedData.styleWeight,
        weirdnessConstraint: validatedData.weirdnessConstraint,
        audioWeight: validatedData.audioWeight,
        negativeTags: validatedData.negativeTags,
        callBackUrl: callbackUrl
      }
      console.log('📤 [MUSIC API] Suno request params:', sunoRequestParams)
      
      sunoTaskId = await sunoClient.generateMusic(sunoRequestParams)
    }

    console.log('✅ [MUSIC API] Suno task created:', sunoTaskId)

    // Save task to database with pending status
    const { data: musicJingle, error } = await supabase
      .from('music_jingles')
      .insert({
        user_id: user.id,
        title: validatedData.title || 'Untitled Music',
        description: validatedData.prompt,
        prompt: validatedData.prompt,
        
        // Suno API Settings
        model: validatedData.model,
        custom_mode: validatedData.customMode,
        instrumental: validatedData.instrumental,
        vocal_gender: validatedData.vocalGender || 'auto',
        style_weight: validatedData.styleWeight || 0.65,
        weirdness_constraint: validatedData.weirdnessConstraint || 0.65,
        audio_weight: validatedData.audioWeight || 0.65,
        negative_tags: validatedData.negativeTags,
        audio_action: validatedData.audioAction || 'generate',
        upload_url: uploadUrl,
        
        // Suno Task Tracking
        suno_task_id: sunoTaskId,
        
        // Legacy/Post-processing parameters (now enhanced into prompt)
        // These are saved to DB and ALSO woven into the natural language prompt:
        // - duration: Enhanced into prompt as "Create a X-second track..."
        // - styles[]: Enhanced into prompt as "with X, Y, and Z influences..."
        // - loop_mode: Enhanced into prompt as "designed to loop seamlessly..."
        // - stereo_mode: Enhanced into prompt as "Use wide stereo imaging..."
        // 
        // NOT enhanced (pure post-processing):
        // - volume, fade_in, fade_out: Audio post-processing only
        styles: validatedData.styles || [],
        duration: validatedData.duration || 30,
        volume: validatedData.volume || 50,
        fade_in: validatedData.fade_in || 0,
        fade_out: validatedData.fade_out || 0,
        loop_mode: validatedData.loop_mode || 'none',
        stereo_mode: validatedData.stereo_mode || 'stereo',
        
        // Status
        status: 'processing',
        
        // Metadata
        metadata: {
          generation_timestamp: new Date().toISOString(),
          suno_task_id: sunoTaskId,
          callback_url: callbackUrl,
          audio_file_name: audioFile?.name,
          audio_file_size: audioFile?.size,
          audio_file_type: audioFile?.type,
          continue_at: validatedData.continueAt,
          generated_via: 'suno-api-integration'
        },
        
        // Content
        content: {
          suno_request: {
            prompt: validatedData.prompt,
            customMode: validatedData.customMode,
            instrumental: validatedData.instrumental,
            model: validatedData.model,
            style: validatedData.style,
            title: validatedData.title,
            vocalGender: validatedData.vocalGender,
            styleWeight: validatedData.styleWeight,
            weirdnessConstraint: validatedData.weirdnessConstraint,
            audioWeight: validatedData.audioWeight,
            negativeTags: validatedData.negativeTags,
            audioAction: validatedData.audioAction,
            continueAt: validatedData.continueAt
          },
          suno_task_id: sunoTaskId,
          callback_url: callbackUrl,
          status: 'pending'
        }
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [MUSIC API] Error creating music jingle:', error)
      return NextResponse.json({ error: 'Failed to create music jingle' }, { status: 500 })
    }

    console.log('✅ [MUSIC API] Music jingle saved:', musicJingle.id)

    // Add to library_items table
    const { error: libraryError } = await supabase
      .from('library_items')
      .insert({
        user_id: user.id,
        content_type: 'music_jingles',
        content_id: musicJingle.id,
        date_added_to_library: new Date().toISOString()
      })

    if (libraryError) {
      console.error('❌ [MUSIC API] Failed to add to library:', libraryError)
    } else {
      console.log('✅ [MUSIC API] Added to library:', musicJingle.id)
    }

    // Start automatic polling as fallback (after 2 minutes)
    console.log('⏰ [MUSIC API] Starting automatic polling fallback in 2 minutes...')
    const generationId = musicJingle.id
    
    setTimeout(async () => {
      try {
        console.log('🔍 [MUSIC API] Starting automatic polling for task:', sunoTaskId)
        
        const pollResponse = await fetch(`${baseUrl}/api/suno/poll/${sunoTaskId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            generationId: generationId,
            updateOnFail: true
          })
        })
        
        // Check if response is JSON before parsing
        const contentType = pollResponse.headers.get('content-type')
        if (!contentType?.includes('application/json')) {
          console.error('❌ [MUSIC API] Polling returned non-JSON response (likely 404 or error page)')
          return
        }
        
        const pollResult = await pollResponse.json()
        console.log('📊 [MUSIC API] Polling result:', pollResult)
      } catch (pollError) {
        console.error('❌ [MUSIC API] Automatic polling failed:', pollError)
      }
    }, 2 * 60 * 1000) // 2 minutes

    return NextResponse.json({ 
      message: 'Music generation started successfully', 
      musicJingle: {
        id: musicJingle.id,
        suno_task_id: sunoTaskId,
        status: 'pending',
        title: musicJingle.title
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [MUSIC API] Validation error:', error.errors)
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    
    if (error instanceof SunoApiError) {
      console.error('❌ [MUSIC API] Suno API error:', error.message, error.code)
      return NextResponse.json({ 
        error: 'Suno API error', 
        details: error.message,
        code: error.code
      }, { status: 500 })
    }
    
    console.error('❌ [MUSIC API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
