import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/watermarks/[id] - Delete watermark project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const watermarkId = params.id

    if (!watermarkId) {
      return NextResponse.json({ error: 'Watermark ID is required' }, { status: 400 })
    }

    // Delete watermark
    const { error } = await supabase
      .from('watermarks')
      .delete()
      .eq('id', watermarkId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting watermark:', error)
      return NextResponse.json({ error: 'Failed to delete watermark' }, { status: 500 })
    }

    // Also remove from library if it exists
    await supabase
      .from('library_items')
      .delete()
      .eq('content_type', 'watermarks')
      .eq('content_id', watermarkId)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/watermarks/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
