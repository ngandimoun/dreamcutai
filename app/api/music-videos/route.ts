import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sunoClient } from '@/lib/suno/client'
import { SunoApiError } from '@/lib/suno/types'
import { signedUrlCache } from '@/lib/cache/signed-url-cache'

// Cache for 30 seconds
export const revalidate = 30

// Validation schema for music video creation
const createMusicVideoSchema = z.object({
  taskId: z.string().min(1),
  audioId: z.string().min(1),
  author: z.string().max(50).optional(),
  domainName: z.string().max(50).optional(),
  musicJingleId: z.string().uuid().optional()
})

export async function POST(request: NextRequest) {
  try {
    console.log('🎬 [MUSIC VIDEO API] Music video generation API called')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const validatedData = createMusicVideoSchema.parse(body)

    console.log('📝 [MUSIC VIDEO API] Validated data:', {
      taskId: validatedData.taskId,
      audioId: validatedData.audioId,
      author: validatedData.author,
      domainName: validatedData.domainName,
      musicJingleId: validatedData.musicJingleId
    })

    // Validate that audioId is a Suno audio ID (not a database UUID)
    // Suno audio IDs are UUIDs but we need to distinguish them from database UUIDs
    // Database UUIDs are typically longer and have different patterns
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validatedData.audioId)
    
    // Check if this looks like a database UUID (typically longer, more structured)
    // Suno audio IDs are also UUIDs but shorter and more compact
    const isLikelyDatabaseUuid = validatedData.audioId.length > 36 || 
                                 validatedData.audioId.includes('0000') ||
                                 validatedData.audioId.startsWith('0000')
    
    if (isLikelyDatabaseUuid) {
      console.error('❌ [MUSIC VIDEO API] Invalid audioId: received database UUID instead of Suno audio ID')
      return NextResponse.json({ 
        error: 'Invalid audioId: Please use a valid Suno audio ID, not a database UUID' 
      }, { status: 400 })
    }
    
    if (!isUuid) {
      console.warn('⚠️ [MUSIC VIDEO API] audioId format may be invalid:', validatedData.audioId)
    } else {
      console.log('✅ [MUSIC VIDEO API] Valid Suno audio ID format:', validatedData.audioId)
    }

    // Generate callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const callbackUrl = `${baseUrl}/api/suno/callback`

    // Call Suno music video generation API
    console.log('🎬 [MUSIC VIDEO API] Calling Suno music video generation endpoint...')
    const sunoTaskId = await sunoClient.createMusicVideo({
      taskId: validatedData.taskId,
      audioId: validatedData.audioId,
      callBackUrl: callbackUrl,
      author: validatedData.author,
      domainName: validatedData.domainName
    })

    console.log('✅ [MUSIC VIDEO API] Suno task created:', sunoTaskId)

    // Save task to database with pending status
    const { data: musicVideo, error } = await supabase
      .from('music_videos')
      .insert({
        user_id: user.id,
        music_jingle_id: validatedData.musicJingleId || null,
        source_task_id: validatedData.taskId,
        source_audio_id: validatedData.audioId,
        suno_task_id: sunoTaskId,
        status: 'pending',
        author: validatedData.author,
        domain_name: validatedData.domainName,
        metadata: {
          generation_timestamp: new Date().toISOString(),
          suno_task_id: sunoTaskId,
          callback_url: callbackUrl,
          generated_via: 'suno-api-integration'
        }
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [MUSIC VIDEO API] Error creating music video:', error)
      return NextResponse.json({ error: 'Failed to create music video' }, { status: 500 })
    }

    console.log('✅ [MUSIC VIDEO API] Music video saved:', musicVideo.id)

    // Start automatic polling as fallback (after 2 minutes)
    console.log('⏰ [MUSIC VIDEO API] Starting automatic polling fallback in 2 minutes...')
    const generationId = musicVideo.id
    
    setTimeout(async () => {
      try {
        console.log('🔍 [MUSIC VIDEO API] Starting automatic polling for task:', sunoTaskId)
        
        // Use service role key for server-side authentication
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        const pollResponse = await fetch(`${baseUrl}/api/suno/poll/${sunoTaskId}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'x-service-role': 'true'
          },
          body: JSON.stringify({
            generationId: generationId,
            updateOnFail: true,
            type: 'music_video'
          })
        })
        
        // Check if response is JSON before parsing
        const contentType = pollResponse.headers.get('content-type')
        if (!contentType?.includes('application/json')) {
          console.error('❌ [MUSIC VIDEO API] Polling returned non-JSON response (likely 404 or error page)')
          return
        }
        
        const pollResult = await pollResponse.json()
        console.log('📊 [MUSIC VIDEO API] Polling result:', pollResult)
      } catch (pollError) {
        console.error('❌ [MUSIC VIDEO API] Automatic polling failed:', pollError)
      }
    }, 2 * 60 * 1000) // 2 minutes

    return NextResponse.json({ 
      message: 'Music video generation started successfully', 
      musicVideo: {
        id: musicVideo.id,
        suno_task_id: sunoTaskId,
        status: 'pending',
        source_task_id: validatedData.taskId,
        source_audio_id: validatedData.audioId
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [MUSIC VIDEO API] Validation error:', error.errors)
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    
    if (error instanceof SunoApiError) {
      console.error('❌ [MUSIC VIDEO API] Suno API error:', error.message, error.code)
      return NextResponse.json({ 
        error: 'Suno API error', 
        details: error.message,
        code: error.code
      }, { status: 500 })
    }
    
    console.error('❌ [MUSIC VIDEO API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🎬 [MUSIC VIDEO API] Get music videos called')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's music videos
    const { data: musicVideos, error } = await supabase
      .from('music_videos')
      .select(`
        *,
        music_jingles (
          id,
          title,
          prompt,
          audio_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('❌ [MUSIC VIDEO API] Error fetching music videos:', error)
      return NextResponse.json({ error: 'Failed to fetch music videos' }, { status: 500 })
    }

    // Regenerate expired signed URLs with caching (matching music-jingles pattern)
    if (musicVideos && musicVideos.length > 0) {
      console.log(`🔄 [MUSIC VIDEO GET] Regenerating signed URLs for ${musicVideos.length} music videos`)
      
      let cacheHits = 0
      let cacheMisses = 0
      const urlsToGenerate: Array<{ video: any, storagePath: string }> = []
      
      // Check cache first
      for (const video of musicVideos) {
        if (video.storage_path) {
          // Video is stored in Supabase Storage
          const cachedUrl = signedUrlCache.get(video.storage_path)
          if (cachedUrl) {
            video.video_url = cachedUrl
            cacheHits++
          } else {
            urlsToGenerate.push({ video, storagePath: video.storage_path })
            cacheMisses++
          }
        } else if (video.suno_video_url) {
          // Fallback: Use Suno CDN URL directly
          video.video_url = video.suno_video_url
          console.log(`📊 [MUSIC VIDEO GET] Using Suno CDN URL for video ${video.id}`)
        } else {
          console.warn(`⚠️ [MUSIC VIDEO GET] No storage_path or suno_video_url for video ${video.id}`)
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
          const batchPromises = batch.map(async ({ video, storagePath }) => {
            try {
              const { data: signedUrlData, error: urlError } = await supabase.storage
                .from('dreamcut')
                .createSignedUrl(storagePath, 86400) // 24 hour expiry
              
              if (!urlError && signedUrlData?.signedUrl) {
                // Store in cache for future requests
                signedUrlCache.set(storagePath, signedUrlData.signedUrl, 86400)
                video.video_url = signedUrlData.signedUrl
                return { videoId: video.id, success: true }
              } else {
                console.error(`❌ [MUSIC VIDEO GET] URL generation error for ${video.id}:`, urlError)
                return { videoId: video.id, success: false }
              }
            } catch (urlError) {
              console.error(`❌ [MUSIC VIDEO GET] Failed to regenerate URL for video ${video.id}:`, urlError)
              return { videoId: video.id, success: false }
            }
          })
          
          const results = await Promise.all(batchPromises)
          return results.filter(r => r.success)
        })

        const signedUrlResults = await Promise.all(signedUrlPromises)
        const successfulResults = signedUrlResults.flat()
        console.log(`✅ [MUSIC VIDEO GET] Generated ${successfulResults.length} new signed URLs`)
      }
      
      // Log cache performance
      console.log(`📊 [MUSIC VIDEO GET] Cache performance: ${cacheHits} hits, ${cacheMisses} misses, ${((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1)}% hit rate`)
    }

    return NextResponse.json({ 
      musicVideos: musicVideos || []
    })

  } catch (error) {
    console.error('❌ [MUSIC VIDEO API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
