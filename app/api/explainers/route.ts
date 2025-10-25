import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Cache for 30 seconds
export const revalidate = 30

// Validation schema for explainer creation
const createExplainerSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  explainer_type: z.string().optional(),
  style: z.string().optional(),
  duration: z.number().optional(),
  complexity: z.string().optional(),
  target_audience: z.string().optional(),
  topic_category: z.string().optional(),
  visual_elements: z.record(z.any()).optional(),
  narration_style: z.string().optional(),
  call_to_action: z.string().optional(),
  key_points: z.record(z.any()).optional(),
  content: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  is_template: z.boolean().optional().default(false),
})

// GET /api/explainers - Get user's explainers
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
      .from('explainers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination (use range instead of limit to avoid conflicts)
    query = query.range(offset, offset + limit - 1)

    const { data: explainers, error } = await query

    if (error) {
      console.error('Error fetching explainers:', error)
      return NextResponse.json({ error: 'Failed to fetch explainers' }, { status: 500 })
    }

    // Generate fresh signed URLs for completed explainers
    const explainersWithFreshUrls = await Promise.all(
      (explainers || []).map(async (explainer) => {
        if (explainer.status === 'completed') {
          try {
            // Try to get storage_path from metadata or construct it
            let storagePath = explainer.metadata?.storage_path
            
            if (!storagePath) {
              // Construct storage path following the pattern: renders/explainers/{user_id}/{id}.mp4
              storagePath = `renders/explainers/${user.id}/${explainer.id}.mp4`
            }
            
            const { data: signedUrl } = await supabase.storage
              .from('dreamcut')
              .createSignedUrl(storagePath, 86400) // 24 hours
            
            if (signedUrl?.signedUrl) {
              return {
                ...explainer,
                content: {
                  ...explainer.content,
                  video_url: signedUrl.signedUrl
                }
              }
            }
          } catch (urlError) {
            console.error('Error generating signed URL for explainer:', explainer.id, urlError)
          }
        }
        return explainer
      })
    )

    return NextResponse.json({ explainers: explainersWithFreshUrls }, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'max-age=30'
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/explainers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/explainers - Create new explainer
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
    const validatedData = createExplainerSchema.parse(body)

    // Create explainer
    const { data: explainer, error } = await supabase
      .from('explainers')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        explainer_type: validatedData.explainer_type,
        style: validatedData.style,
        duration: validatedData.duration,
        complexity: validatedData.complexity,
        target_audience: validatedData.target_audience,
        topic_category: validatedData.topic_category,
        visual_elements: validatedData.visual_elements,
        narration_style: validatedData.narration_style,
        call_to_action: validatedData.call_to_action,
        key_points: validatedData.key_points,
        content: validatedData.content,
        metadata: validatedData.metadata,
        is_template: validatedData.is_template,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating explainer:', error)
      return NextResponse.json({ error: 'Failed to create explainer' }, { status: 500 })
    }

    return NextResponse.json({ explainer }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/explainers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
