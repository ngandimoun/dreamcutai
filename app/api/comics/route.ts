import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Cache for 30 seconds
export const revalidate = 30

// Validation schema for comic creation
const createComicSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  comic_type: z.string().optional(), // black-white, color
  vibe: z.array(z.string()).optional(), // Array of vibe options
  inspiration_style: z.array(z.string()).optional(), // Array of inspiration styles
  characters: z.array(z.any()).optional(), // Array of character objects
  character_variations: z.array(z.string()).optional(), // Generated character variation URLs
  selected_character_variations: z.array(z.any()).optional(), // Selected character variations with metadata
  panel_count: z.number().optional().default(1),
  style: z.string().optional(),
  genre: z.string().optional(),
  dialogue: z.record(z.any()).optional(),
  panels: z.record(z.any()).optional(),
  color_scheme: z.string().optional(),
  aspect_ratio: z.string().optional().default('16:9'),
  content: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  is_template: z.boolean().optional().default(false),
})

// GET /api/comics - Get user's comics
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
      .from('comics')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination (use range instead of limit to avoid conflicts)
    query = query.range(offset, offset + limit - 1)

    const { data: comics, error } = await query

    if (error) {
      console.error('Error fetching comics:', error)
      return NextResponse.json({ error: 'Failed to fetch comics' }, { status: 500 })
    }

    return NextResponse.json({ comics }, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'max-age=30'
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/comics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/comics - Create new comic
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
    const validatedData = createComicSchema.parse(body)

    // Create comic
    const { data: comic, error } = await supabase
      .from('comics')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        comic_type: validatedData.comic_type,
        vibe: validatedData.vibe,
        inspiration_style: validatedData.inspiration_style,
        characters: validatedData.characters,
        character_variations: validatedData.character_variations,
        selected_character_variations: validatedData.selected_character_variations,
        panel_count: validatedData.panel_count,
        style: validatedData.style,
        genre: validatedData.genre,
        dialogue: validatedData.dialogue,
        panels: validatedData.panels,
        color_scheme: validatedData.color_scheme,
        aspect_ratio: validatedData.aspect_ratio,
        content: validatedData.content,
        metadata: validatedData.metadata,
        is_template: validatedData.is_template,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating comic:', error)
      return NextResponse.json({ error: 'Failed to create comic' }, { status: 500 })
    }

    // Add to library_items table
    const { error: libraryError } = await supabase
      .from('library_items')
      .insert({
        user_id: user.id,
        content_type: 'comics',
        content_id: comic.id,
        date_added_to_library: new Date().toISOString()
      })

    if (libraryError) {
      console.error('Failed to add comic to library:', libraryError)
    } else {
      console.log(`✅ Comic ${comic.id} added to library`)
    }

    return NextResponse.json({ comic }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/comics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
