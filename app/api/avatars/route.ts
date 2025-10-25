import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Cache for 30 seconds
export const revalidate = 30

// Validation schema for avatar creation
const createAvatarSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  character_type: z.string().optional(),
  gender: z.string().optional(),
  age_range: z.string().optional(),
  ethnicity: z.string().optional(),
  hair_style: z.string().optional(),
  hair_color: z.string().optional(),
  eye_color: z.string().optional(),
  skin_tone: z.string().optional(),
  clothing_style: z.string().optional(),
  accessories: z.record(z.any()).optional(),
  personality_traits: z.record(z.any()).optional(),
  expression: z.string().optional(),
  pose: z.string().optional(),
  background_type: z.string().optional(),
  content: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  is_template: z.boolean().optional().default(false),
})

// GET /api/avatars - Get user's avatars
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
      .from('avatars_personas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination (use range instead of limit to avoid conflicts)
    query = query.range(offset, offset + limit - 1)

    const { data: avatars, error } = await query

    if (error) {
      console.error('Error fetching avatars:', error)
      return NextResponse.json({ error: 'Failed to fetch avatars' }, { status: 500 })
    }

    // Regenerate expired signed URLs from storage_paths
    if (avatars && avatars.length > 0) {
      for (const avatar of avatars) {
        if (avatar.storage_paths && avatar.storage_paths.length > 0) {
          // Regenerate fresh signed URLs from storage paths
          const freshUrls: string[] = []
          for (const storagePath of avatar.storage_paths) {
            const { data: signedUrlData } = await supabase.storage
              .from('dreamcut')
              .createSignedUrl(storagePath, 86400) // 24 hour expiry
            if (signedUrlData?.signedUrl) {
              freshUrls.push(signedUrlData.signedUrl)
            }
          }
          // Replace expired URLs with fresh ones
          if (freshUrls.length > 0) {
            avatar.generated_images = freshUrls
          }
        }
      }
    }

    return NextResponse.json({ avatars }, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'max-age=30'
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/avatars:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/avatars - Create new avatar
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
    const validatedData = createAvatarSchema.parse(body)

    // Create avatar
    const { data: avatar, error } = await supabase
      .from('avatars_personas')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        character_type: validatedData.character_type,
        gender: validatedData.gender,
        age_range: validatedData.age_range,
        ethnicity: validatedData.ethnicity,
        hair_style: validatedData.hair_style,
        hair_color: validatedData.hair_color,
        eye_color: validatedData.eye_color,
        skin_tone: validatedData.skin_tone,
        clothing_style: validatedData.clothing_style,
        accessories: validatedData.accessories,
        personality_traits: validatedData.personality_traits,
        expression: validatedData.expression,
        pose: validatedData.pose,
        background_type: validatedData.background_type,
        content: validatedData.content,
        metadata: validatedData.metadata,
        is_template: validatedData.is_template,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating avatar:', error)
      return NextResponse.json({ error: 'Failed to create avatar' }, { status: 500 })
    }

    return NextResponse.json({ avatar }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/avatars:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
