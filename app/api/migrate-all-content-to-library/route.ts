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

    console.log('🔄 Starting migration of all existing content to library...')

    const migrationResults = {
      product_mockups: 0,
      concept_worlds: 0,
      illustrations: 0,
      comics: 0,
      explainers: 0,
      watermarks: 0,
      subtitles: 0,
      video_translations: 0,
      sound_to_video: 0,
      total: 0
    }

    // Get existing library items to avoid duplicates
    const { data: existingLibraryItems, error: libraryError } = await supabase
      .from('library_items')
      .select('content_type, content_id')

    if (libraryError) {
      console.error('Error fetching existing library items:', libraryError)
      return NextResponse.json({ error: 'Failed to fetch existing library items' }, { status: 500 })
    }

    const existingItems = new Set(
      existingLibraryItems?.map(item => `${item.content_type}:${item.content_id}`) || []
    )

    // Migrate product_mockups
    console.log('📦 Migrating product_mockups...')
    const { data: productMockups, error: productMockupsError } = await supabase
      .from('product_mockups')
      .select('id, user_id, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (!productMockupsError && productMockups) {
      const newProductMockups = productMockups.filter(
        item => !existingItems.has(`product_mockups:${item.id}`)
      )
      
      if (newProductMockups.length > 0) {
        const libraryItems = newProductMockups.map(item => ({
          user_id: item.user_id,
          content_type: 'product_mockups',
          content_id: item.id,
          date_added_to_library: item.created_at
        }))

        const { error: insertError } = await supabase
          .from('library_items')
          .insert(libraryItems)

        if (!insertError) {
          migrationResults.product_mockups = newProductMockups.length
          console.log(`✅ Migrated ${newProductMockups.length} product_mockups`)
        }
      }
    }

    // Migrate concept_worlds
    console.log('🌍 Migrating concept_worlds...')
    const { data: conceptWorlds, error: conceptWorldsError } = await supabase
      .from('concept_worlds')
      .select('id, user_id, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (!conceptWorldsError && conceptWorlds) {
      const newConceptWorlds = conceptWorlds.filter(
        item => !existingItems.has(`concept_worlds:${item.id}`)
      )
      
      if (newConceptWorlds.length > 0) {
        const libraryItems = newConceptWorlds.map(item => ({
          user_id: item.user_id,
          content_type: 'concept_worlds',
          content_id: item.id,
          date_added_to_library: item.created_at
        }))

        const { error: insertError } = await supabase
          .from('library_items')
          .insert(libraryItems)

        if (!insertError) {
          migrationResults.concept_worlds = newConceptWorlds.length
          console.log(`✅ Migrated ${newConceptWorlds.length} concept_worlds`)
        }
      }
    }

    // Migrate illustrations
    console.log('🎨 Migrating illustrations...')
    const { data: illustrations, error: illustrationsError } = await supabase
      .from('illustrations')
      .select('id, user_id, created_at')
      .eq('user_id', user.id)

    if (!illustrationsError && illustrations) {
      const newIllustrations = illustrations.filter(
        item => !existingItems.has(`illustrations:${item.id}`)
      )
      
      if (newIllustrations.length > 0) {
        const libraryItems = newIllustrations.map(item => ({
          user_id: item.user_id,
          content_type: 'illustrations',
          content_id: item.id,
          date_added_to_library: item.created_at
        }))

        const { error: insertError } = await supabase
          .from('library_items')
          .insert(libraryItems)

        if (!insertError) {
          migrationResults.illustrations = newIllustrations.length
          console.log(`✅ Migrated ${newIllustrations.length} illustrations`)
        }
      }
    }

    // Migrate comics
    console.log('📚 Migrating comics...')
    const { data: comics, error: comicsError } = await supabase
      .from('comics')
      .select('id, user_id, created_at')
      .eq('user_id', user.id)

    if (!comicsError && comics) {
      const newComics = comics.filter(
        item => !existingItems.has(`comics:${item.id}`)
      )
      
      if (newComics.length > 0) {
        const libraryItems = newComics.map(item => ({
          user_id: item.user_id,
          content_type: 'comics',
          content_id: item.id,
          date_added_to_library: item.created_at
        }))

        const { error: insertError } = await supabase
          .from('library_items')
          .insert(libraryItems)

        if (!insertError) {
          migrationResults.comics = newComics.length
          console.log(`✅ Migrated ${newComics.length} comics`)
        }
      }
    }

    // Migrate explainers (already handled by existing migration, but check for any missed)
    console.log('🎬 Checking explainers...')
    const { data: explainers, error: explainersError } = await supabase
      .from('explainers')
      .select('id, user_id, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (!explainersError && explainers) {
      const newExplainers = explainers.filter(
        item => !existingItems.has(`explainers:${item.id}`)
      )
      
      if (newExplainers.length > 0) {
        const libraryItems = newExplainers.map(item => ({
          user_id: item.user_id,
          content_type: 'explainers',
          content_id: item.id,
          date_added_to_library: item.created_at
        }))

        const { error: insertError } = await supabase
          .from('library_items')
          .insert(libraryItems)

        if (!insertError) {
          migrationResults.explainers = newExplainers.length
          console.log(`✅ Migrated ${newExplainers.length} explainers`)
        }
      }
    }

    // Migrate watermarks
    console.log('🏷️ Migrating watermarks...')
    const { data: watermarks, error: watermarksError } = await supabase
      .from('watermarks')
      .select('id, user_id, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (!watermarksError && watermarks) {
      const newWatermarks = watermarks.filter(
        item => !existingItems.has(`watermarks:${item.id}`)
      )
      
      if (newWatermarks.length > 0) {
        const libraryItems = newWatermarks.map(item => ({
          user_id: item.user_id,
          content_type: 'watermarks',
          content_id: item.id,
          date_added_to_library: item.created_at
        }))

        const { error: insertError } = await supabase
          .from('library_items')
          .insert(libraryItems)

        if (!insertError) {
          migrationResults.watermarks = newWatermarks.length
          console.log(`✅ Migrated ${newWatermarks.length} watermarks`)
        }
      }
    }

    // Migrate subtitles
    console.log('📝 Migrating subtitles...')
    const { data: subtitles, error: subtitlesError } = await supabase
      .from('subtitles')
      .select('id, user_id, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (!subtitlesError && subtitles) {
      const newSubtitles = subtitles.filter(
        item => !existingItems.has(`subtitles:${item.id}`)
      )
      
      if (newSubtitles.length > 0) {
        const libraryItems = newSubtitles.map(item => ({
          user_id: item.user_id,
          content_type: 'subtitles',
          content_id: item.id,
          date_added_to_library: item.created_at
        }))

        const { error: insertError } = await supabase
          .from('library_items')
          .insert(libraryItems)

        if (!insertError) {
          migrationResults.subtitles = newSubtitles.length
          console.log(`✅ Migrated ${newSubtitles.length} subtitles`)
        }
      }
    }

    // Migrate video_translations
    console.log('🌐 Migrating video_translations...')
    const { data: videoTranslations, error: videoTranslationsError } = await supabase
      .from('video_translations')
      .select('id, user_id, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (!videoTranslationsError && videoTranslations) {
      const newVideoTranslations = videoTranslations.filter(
        item => !existingItems.has(`video_translations:${item.id}`)
      )
      
      if (newVideoTranslations.length > 0) {
        const libraryItems = newVideoTranslations.map(item => ({
          user_id: item.user_id,
          content_type: 'video_translations',
          content_id: item.id,
          date_added_to_library: item.created_at
        }))

        const { error: insertError } = await supabase
          .from('library_items')
          .insert(libraryItems)

        if (!insertError) {
          migrationResults.video_translations = newVideoTranslations.length
          console.log(`✅ Migrated ${newVideoTranslations.length} video_translations`)
        }
      }
    }

    // Migrate sound_to_video
    console.log('🎵 Migrating sound_to_video...')
    const { data: soundToVideo, error: soundToVideoError } = await supabase
      .from('sound_to_video')
      .select('id, user_id, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (!soundToVideoError && soundToVideo) {
      const newSoundToVideo = soundToVideo.filter(
        item => !existingItems.has(`sound_to_video:${item.id}`)
      )
      
      if (newSoundToVideo.length > 0) {
        const libraryItems = newSoundToVideo.map(item => ({
          user_id: item.user_id,
          content_type: 'sound_to_video',
          content_id: item.id,
          date_added_to_library: item.created_at
        }))

        const { error: insertError } = await supabase
          .from('library_items')
          .insert(libraryItems)

        if (!insertError) {
          migrationResults.sound_to_video = newSoundToVideo.length
          console.log(`✅ Migrated ${newSoundToVideo.length} sound_to_video`)
        }
      }
    }

    // Calculate total
    migrationResults.total = Object.values(migrationResults).reduce((sum, count) => sum + count, 0)

    console.log(`✅ Migration complete: ${migrationResults.total} total items migrated`)

    return NextResponse.json({ 
      message: `Successfully migrated ${migrationResults.total} items to library`,
      results: migrationResults
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

