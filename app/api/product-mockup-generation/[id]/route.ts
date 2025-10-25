import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// DELETE /api/product-mockup-generation/[id] - Delete a specific generation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const generationId = params.id

    if (!generationId) {
      return NextResponse.json({ error: 'Generation ID is required' }, { status: 400 })
    }

    // Delete the generation (only if it belongs to the user)
    const { error: deleteError } = await supabase
      .from('product_mockup_generations')
      .delete()
      .eq('id', generationId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ Error deleting product mockup generation:', deleteError)
      return NextResponse.json({ error: 'Failed to delete generation' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Unexpected error in DELETE /api/product-mockup-generation/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/product-mockup-generation/[id] - Get a specific generation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const generationId = params.id

    if (!generationId) {
      return NextResponse.json({ error: 'Generation ID is required' }, { status: 400 })
    }

    // Fetch the specific generation
    const { data: generation, error } = await supabase
      .from('product_mockup_generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('❌ Error fetching product mockup generation:', error)
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    return NextResponse.json({ generation }, { status: 200 })

  } catch (error) {
    console.error('Unexpected error in GET /api/product-mockup-generation/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


