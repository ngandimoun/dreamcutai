import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Cache for 30 seconds
export const revalidate = 30

// Validation schema for social cut creation
const createSocialCutSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  platform: z.string().optional(),
  format: z.string().optional(),
  content_type: z.string().optional(),
  duration: z.number().optional(),
  style: z.string().optional(),
  target_audience: z.string().optional(),
  engagement_goal: z.string().optional(),
  hashtags: z.record(z.any()).optional(),
  call_to_action: z.string().optional(),
  music_trend: z.string().optional(),
  visual_effects: z.record(z.any()).optional(),
  text_overlay: z.record(z.any()).optional(),
  brand_elements: z.record(z.any()).optional(),
  content: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  is_template: z.boolean().optional().default(false),
})

// GET /api/social-cuts - Get user's social cuts
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
      .from('social_cuts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination (use range instead of limit to avoid conflicts)
    query = query.range(offset, offset + limit - 1)

    const { data: socialCuts, error } = await query

    if (error) {
      console.error('Error fetching social cuts:', error)
      return NextResponse.json({ error: 'Failed to fetch social cuts' }, { status: 500 })
    }

    return NextResponse.json({ socialCuts }, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'max-age=30'
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/social-cuts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/social-cuts - Create new social cut
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
    const validatedData = createSocialCutSchema.parse(body)

    // Create social cut
    const { data: socialCut, error } = await supabase
      .from('social_cuts')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        platform: validatedData.platform,
        format: validatedData.format,
        content_type: validatedData.content_type,
        duration: validatedData.duration,
        style: validatedData.style,
        target_audience: validatedData.target_audience,
        engagement_goal: validatedData.engagement_goal,
        hashtags: validatedData.hashtags,
        call_to_action: validatedData.call_to_action,
        music_trend: validatedData.music_trend,
        visual_effects: validatedData.visual_effects,
        text_overlay: validatedData.text_overlay,
        brand_elements: validatedData.brand_elements,
        content: validatedData.content,
        metadata: validatedData.metadata,
        is_template: validatedData.is_template,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating social cut:', error)
      return NextResponse.json({ error: 'Failed to create social cut' }, { status: 500 })
    }

    return NextResponse.json({ socialCut }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/social-cuts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
