import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/templates/[id]/pin - Toggle pin status
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
    console.log('📌 Toggling pin for template:', templateId)

    // Get current pin status
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select('is_pinned')
      .eq('id', templateId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !template) {
      console.error('❌ Template not found:', fetchError)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Toggle pin status
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('templates')
      .update({ is_pinned: !template.is_pinned })
      .eq('id', templateId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating template pin:', updateError)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    console.log('✅ Template pin toggled successfully:', updatedTemplate.is_pinned)
    return NextResponse.json({ 
      template: updatedTemplate,
      is_pinned: updatedTemplate.is_pinned 
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/templates/[id]/pin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
