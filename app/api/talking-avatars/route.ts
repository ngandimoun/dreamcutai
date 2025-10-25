import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Cache for 30 seconds
export const revalidate = 30

// Validation schema for talking avatar creation
const createTalkingAvatarSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  avatar_type: z.string().optional(),
  gender: z.string().optional(),
  age_range: z.string().optional(),
  ethnicity: z.string().optional(),
  voice_characteristics: z.record(z.any()).optional(),
  personality: z.string().optional(),
  clothing_style: z.string().optional(),
  background_type: z.string().optional(),
  script: z.string().min(1),
  language: z.string().optional().default('en'),
  duration_estimate: z.number().optional(),
  lip_sync_quality: z.string().optional(),
  facial_expressions: z.record(z.any()).optional(),
  gestures: z.record(z.any()).optional(),
  use_case: z.string().optional(),
  content: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  is_template: z.boolean().optional().default(false),
})

// GET /api/talking-avatars - Get user's talking avatars
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
      .from('talking_avatars')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination (use range instead of limit to avoid conflicts)
    query = query.range(offset, offset + limit - 1)

    const { data: dbRecords, error } = await query

    if (error) {
      console.error('Error fetching talking avatars:', error)
      return NextResponse.json({ error: 'Failed to fetch talking avatars' }, { status: 500 })
    }

    // Fetch storage files to find orphaned videos
    const { data: storageFiles } = await supabase.storage
      .from('dreamcut')
      .list(`renders/talking-avatars/${user.id}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    // Find orphaned files (files in storage but not in database)
    const dbPaths = new Set((dbRecords || []).map(r => r.storage_path).filter(Boolean))
    const orphanedFiles = (storageFiles || []).filter(file => {
      const fullPath = `renders/talking-avatars/${user.id}/${file.name}`
      return !dbPaths.has(fullPath) && file.name.endsWith('.mp4')
    })

    // Create records for orphaned files
    const orphanedRecords = await Promise.all(
      orphanedFiles.map(async (file) => {
        const fullPath = `renders/talking-avatars/${user.id}/${file.name}`
        try {
          const { data: signedUrl } = await supabase.storage
            .from('dreamcut')
            .createSignedUrl(fullPath, 86400)
          
          // Extract UUID from filename (format: uuid-generated.mp4 or uuid-multi-generated.mp4)
          const filename = file.name.replace(/-generated\.mp4$/, '').replace(/-multi-generated\.mp4$/, '')
          
          return {
            id: filename,
            title: 'Untitled (Orphaned)',
            mode: file.name.includes('multi') ? 'multi' : 'describe',
            status: 'orphaned',
            storage_path: fullPath,
            generated_video_url: signedUrl?.signedUrl,
            created_at: file.created_at,
            metadata: { orphaned: true, original_filename: file.name }
          }
        } catch (urlError) {
          console.error('Error generating signed URL for orphaned file:', file.name, urlError)
          return null
        }
      })
    )

    // Filter out null results and combine with database records
    const validOrphanedRecords = orphanedRecords.filter(Boolean)
    const allVideos = [...(dbRecords || []), ...validOrphanedRecords]

    // Generate fresh signed URLs for videos that have storage_path
    const talkingAvatarsWithFreshUrls = await Promise.all(
      allVideos.map(async (avatar) => {
        if (avatar.storage_path && (avatar.status === 'completed' || avatar.status === 'orphaned')) {
          try {
            const { data: signedUrl } = await supabase.storage
              .from('dreamcut')
              .createSignedUrl(avatar.storage_path, 86400) // 24 hours
            
            if (signedUrl?.signedUrl) {
              return {
                ...avatar,
                generated_video_url: signedUrl.signedUrl
              }
            }
          } catch (urlError) {
            console.error('Error generating signed URL for avatar:', avatar.id, urlError)
          }
        }
        return avatar
      })
    )

    return NextResponse.json({ talkingAvatars: talkingAvatarsWithFreshUrls }, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'max-age=30'
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/talking-avatars:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/talking-avatars - Create new talking avatar
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createTalkingAvatarSchema.parse(body)

    // Create talking avatar
    const { data: talkingAvatar, error } = await supabase
      .from('talking_avatars')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        avatar_type: validatedData.avatar_type,
        gender: validatedData.gender,
        age_range: validatedData.age_range,
        ethnicity: validatedData.ethnicity,
        voice_characteristics: validatedData.voice_characteristics,
        personality: validatedData.personality,
        clothing_style: validatedData.clothing_style,
        background_type: validatedData.background_type,
        script: validatedData.script,
        language: validatedData.language,
        duration_estimate: validatedData.duration_estimate,
        lip_sync_quality: validatedData.lip_sync_quality,
        facial_expressions: validatedData.facial_expressions,
        gestures: validatedData.gestures,
        use_case: validatedData.use_case,
        content: validatedData.content,
        metadata: validatedData.metadata,
        is_template: validatedData.is_template,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating talking avatar:', error)
      return NextResponse.json({ error: 'Failed to create talking avatar' }, { status: 500 })
    }

    return NextResponse.json({ talkingAvatar }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/talking-avatars:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
