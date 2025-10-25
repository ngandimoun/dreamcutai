import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for template creation
const createTemplateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  content: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  is_default: z.boolean().optional().default(false),
})

// GET /api/templates - Get user's templates
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
    const isPinned = searchParams.get('is_pinned')
    const isFavorite = searchParams.get('is_favorite')
    const isDefault = searchParams.get('is_default')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query with filters
    let query = supabase
      .from('templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (isPinned !== null) {
      query = query.eq('is_pinned', isPinned === 'true')
    }
    if (isFavorite !== null) {
      query = query.eq('is_favorite', isFavorite === 'true')
    }
    if (isDefault !== null) {
      query = query.eq('is_default', isDefault === 'true')
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }


    return NextResponse.json({ templates: data })
  } catch (error) {
    console.error('Unexpected error in GET /api/templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/templates - Create new template
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
    const validatedData = createTemplateSchema.parse(body)

    // Create template
    const { data: template, error } = await supabase
      .from('templates')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        content: validatedData.content,
        metadata: validatedData.metadata,
        is_default: validatedData.is_default,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating template:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
