import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Cache for 30 seconds
export const revalidate = 30

// Validation schema for concept world creation
const createConceptWorldSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  world_type: z.string().optional(),
  setting: z.string().optional(),
  time_period: z.string().optional(),
  atmosphere: z.string().optional(),
  color_scheme: z.record(z.any()).optional(),
  architectural_style: z.string().optional(),
  technology_level: z.string().optional(),
  population_density: z.string().optional(),
  weather_conditions: z.string().optional(),
  key_landmarks: z.record(z.any()).optional(),
  content: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  is_template: z.boolean().optional().default(false),
})

// GET /api/concept-worlds - Get user's concept worlds
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
      .from('concept_worlds')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination (use range instead of limit to avoid conflicts)
    query = query.range(offset, offset + limit - 1)

    const { data: conceptWorlds, error } = await query

    if (error) {
      console.error('Error fetching concept worlds:', error)
      return NextResponse.json({ error: 'Failed to fetch concept worlds' }, { status: 500 })
    }

    return NextResponse.json({ conceptWorlds }, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'max-age=30'
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/concept-worlds:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/concept-worlds - Create new concept world
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
    const validatedData = createConceptWorldSchema.parse(body)

    // Create concept world
    const { data: conceptWorld, error } = await supabase
      .from('concept_worlds')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        world_type: validatedData.world_type,
        setting: validatedData.setting,
        time_period: validatedData.time_period,
        atmosphere: validatedData.atmosphere,
        color_scheme: validatedData.color_scheme,
        architectural_style: validatedData.architectural_style,
        technology_level: validatedData.technology_level,
        population_density: validatedData.population_density,
        weather_conditions: validatedData.weather_conditions,
        key_landmarks: validatedData.key_landmarks,
        content: validatedData.content,
        metadata: validatedData.metadata,
        is_template: validatedData.is_template,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating concept world:', error)
      return NextResponse.json({ error: 'Failed to create concept world' }, { status: 500 })
    }

    return NextResponse.json({ conceptWorld }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/concept-worlds:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
