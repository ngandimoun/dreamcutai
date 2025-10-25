import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/templates/[id]/favorite - Toggle favorite status
export async function POST(
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

    const templateId = params.id
    console.log('⭐ Toggling favorite for template:', templateId)

    // Get current favorite status
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select('is_favorite')
      .eq('id', templateId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !template) {
      console.error('❌ Template not found:', fetchError)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Toggle favorite status
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('templates')
      .update({ is_favorite: !template.is_favorite })
      .eq('id', templateId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating template favorite:', updateError)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    console.log('✅ Template favorite toggled successfully:', updatedTemplate.is_favorite)
    return NextResponse.json({ 
      template: updatedTemplate,
      is_favorite: updatedTemplate.is_favorite 
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/templates/[id]/favorite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
