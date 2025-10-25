import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createVoiceInElevenLabs, type CreateVoiceRequest } from '@/lib/utils/elevenlabs'

// POST /api/voice-creation/bulk-add-to-library - Add existing voices to ElevenLabs library
export async function POST(request: NextRequest) {
  try {
    console.log('📚 [BULK ADD TO LIBRARY] Request received')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query all completed voices that haven't been added to ElevenLabs library yet
    const { data: voices, error: queryError } = await supabase
      .from('voices_creations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .not('voice_id', 'is', null)
      .or('added_to_elevenlabs_library.is.null,added_to_elevenlabs_library.eq.false')

    if (queryError) {
      console.error('❌ [BULK ADD TO LIBRARY] Error querying voices:', queryError)
      return NextResponse.json({ error: 'Failed to query voices' }, { status: 500 })
    }

    console.log(`📊 [BULK ADD TO LIBRARY] Found ${voices?.length || 0} voices to process`)

    if (!voices || voices.length === 0) {
      return NextResponse.json({ 
        message: 'No voices found to add to library',
        processed: 0,
        successful: 0,
        failed: 0
      })
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    }

    // Track generated_voice_id values that have been successfully added in this batch
    const processedVoiceIds = new Set<string>()

    // Process each voice
    for (const voice of voices) {
      console.log(`\n📝 [BULK ADD TO LIBRARY] Processing voice: ${voice.name || voice.title || 'Unnamed'}`)
      
      const allPreviews = voice.content?.all_previews
      if (!allPreviews || !Array.isArray(allPreviews) || allPreviews.length === 0) {
        console.log(`⚠️ [BULK ADD TO LIBRARY] Voice ${voice.id} has no preview variations, skipping`)
        results.details.push({
          voice_id: voice.id,
          voice_name: voice.name || voice.title,
          status: 'skipped',
          reason: 'No preview variations found'
        })
        continue
      }

      const voiceResults = []
      let hasSuccess = false

      // Add each variation to ElevenLabs library
      for (let i = 0; i < allPreviews.length; i++) {
        const preview = allPreviews[i]
        const variationName = `${voice.name || voice.title || 'Voice'} - Variation ${i + 1}`
        
        // Check if this generated_voice_id has already been processed in this batch
        if (processedVoiceIds.has(preview.generated_voice_id)) {
          console.log(`⏭️ [BULK ADD TO LIBRARY] Skipping variation ${i + 1}/${allPreviews.length}: ${variationName} (already added in this batch)`)
          voiceResults.push({ 
            variation: i + 1, 
            success: false, 
            skipped: true, 
            reason: 'Already processed in this batch' 
          })
          continue
        }
        
        try {
          console.log(`📚 [BULK ADD TO LIBRARY] Adding variation ${i + 1}/${allPreviews.length}: ${variationName}`)
          
          // Call ElevenLabs Create Voice API using shared utility
          const result = await createVoiceInElevenLabs({
            voice_name: variationName,
            voice_description: voice.prompt || voice.description || 'Generated voice variation',
            generated_voice_id: preview.generated_voice_id
          })
          
          if (result.success) {
            preview.elevenlabs_library_voice_id = result.data.voice_id
            voiceResults.push({ variation: i + 1, success: true, voice_id: result.data.voice_id })
            hasSuccess = true
            
            // Track this generated_voice_id as processed
            processedVoiceIds.add(preview.generated_voice_id)
            
            console.log(`✅ [BULK ADD TO LIBRARY] Variation ${i + 1} added with ID: ${result.data.voice_id}`)
          } else {
            // Check if this is an "already created" error from a previous run
            const isAlreadyCreated = result.error.details?.includes('has already been created')
            
            if (isAlreadyCreated) {
              console.log(`⏭️ [BULK ADD TO LIBRARY] Variation ${i + 1} already exists in ElevenLabs library`)
              voiceResults.push({ 
                variation: i + 1, 
                success: false, 
                skipped: true, 
                reason: 'Already exists in ElevenLabs library' 
              })
              // Track it to avoid retrying in this batch
              processedVoiceIds.add(preview.generated_voice_id)
            } else {
              console.error(`❌ [BULK ADD TO LIBRARY] Failed to add variation ${i + 1}:`, result.error)
              voiceResults.push({ variation: i + 1, success: false, error: result.error.error })
            }
          }
        } catch (error) {
          console.error(`❌ [BULK ADD TO LIBRARY] Exception adding variation ${i + 1}:`, error)
          voiceResults.push({ variation: i + 1, success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }

      // Update the voice creation record
      const { error: updateError } = await supabase
        .from('voices_creations')
        .update({
          content: {
            ...voice.content,
            all_previews: allPreviews,
            elevenlabs_library_results: voiceResults
          },
          added_to_elevenlabs_library: hasSuccess,
          elevenlabs_library_added_at: hasSuccess ? new Date().toISOString() : null
        })
        .eq('id', voice.id)

      if (updateError) {
        console.error(`❌ [BULK ADD TO LIBRARY] Failed to update voice ${voice.id}:`, updateError)
        results.details.push({
          voice_id: voice.id,
          voice_name: voice.name || voice.title,
          status: 'failed',
          reason: 'Database update failed',
          variations: voiceResults
        })
        results.failed++
      } else {
        console.log(`✅ [BULK ADD TO LIBRARY] Voice ${voice.id} updated successfully`)
        
        // Count skipped variations
        const skippedCount = voiceResults.filter(r => r.skipped).length
        const failedCount = voiceResults.filter(r => !r.success && !r.skipped).length
        
        results.details.push({
          voice_id: voice.id,
          voice_name: voice.name || voice.title,
          status: hasSuccess ? 'success' : (skippedCount > 0 ? 'skipped' : 'failed'),
          variations: voiceResults
        })
        
        if (hasSuccess) {
          results.successful++
        } else if (skippedCount > 0 && failedCount === 0) {
          results.skipped++
        } else {
          results.failed++
        }
      }

      results.processed++
    }

    console.log(`\n📊 [BULK ADD TO LIBRARY] Summary: ${results.processed} processed, ${results.successful} successful, ${results.skipped} skipped, ${results.failed} failed`)

    return NextResponse.json({
      message: 'Bulk add to library completed',
      ...results
    }, { status: 200 })

  } catch (error) {
    console.error('❌ [BULK ADD TO LIBRARY] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
