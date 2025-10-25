import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting migration of existing explainers to library...')

    // Get all completed explainers
    const { data: allExplainers, error: allExplainersError } = await supabase
      .from('explainers')
      .select('id, user_id, created_at')
      .eq('status', 'completed')

    if (allExplainersError) {
      console.error('Error fetching explainers:', allExplainersError)
      return NextResponse.json({ error: 'Failed to fetch explainers' }, { status: 500 })
    }

    // Get existing library items for explainers
    const { data: existingLibraryItems, error: libraryError } = await supabase
      .from('library_items')
      .select('content_id')
      .eq('content_type', 'explainers')

    if (libraryError) {
      console.error('Error fetching existing library items:', libraryError)
      return NextResponse.json({ error: 'Failed to fetch existing library items' }, { status: 500 })
    }

    // Filter out explainers that are already in library
    const existingIds = new Set(existingLibraryItems?.map(item => item.content_id) || [])
    const explainers = allExplainers?.filter(explainer => !existingIds.has(explainer.id)) || []

    if (!explainers || explainers.length === 0) {
      return NextResponse.json({ 
        message: 'No explainers need to be migrated',
        migrated: 0
      })
    }

    // Insert into library_items
    const libraryItems = explainers.map(explainer => ({
      user_id: explainer.user_id,
      content_type: 'explainers',
      content_id: explainer.id,
      date_added_to_library: explainer.created_at
    }))

    const { error: insertError } = await supabase
      .from('library_items')
      .insert(libraryItems)

    if (insertError) {
      console.error('Error inserting into library_items:', insertError)
      return NextResponse.json({ error: 'Failed to migrate explainers' }, { status: 500 })
    }

    console.log(`✅ Successfully migrated ${explainers.length} explainers to library`)

    return NextResponse.json({ 
      message: `Successfully migrated ${explainers.length} explainers to library`,
      migrated: explainers.length
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
