import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sunoClient } from '@/lib/suno/client'
import { SunoApiError } from '@/lib/suno/types'
import { downloadAndStoreSunoAudio } from '@/lib/utils/audio-upload'

// Rate limiting configuration
const MAX_CONCURRENT_REQUESTS = 5
const REQUEST_DELAY_MS = 200

interface RecoveryResult {
  id: string
  taskId: string
  status: 'recovered' | 'failed' | 'still_processing' | 'error'
  message: string
  audioCount?: number
  error?: string
}

interface RecoveryResponse {
  success: boolean
  totalProcessed: number
  successful: number
  failed: number
  stillProcessing: number
  errors: number
  results: RecoveryResult[]
  duration: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🔧 [BATCH RECOVERY] Starting batch recovery of stuck Suno generations')
    console.log('📅 [BATCH RECOVERY] Timestamp:', new Date().toISOString())
    
    const supabase = await createClient()
    
    // Step 1: Fetch all processing music jingles
    console.log('📋 [BATCH RECOVERY] Fetching processing music jingles...')
    const { data: musicJingles, error: fetchError } = await supabase
      .from('music_jingles')
      .select('*')
      .eq('status', 'processing')
      .not('suno_task_id', 'is', null)

    if (fetchError) {
      console.error('❌ [BATCH RECOVERY] Failed to fetch music jingles:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch processing music jingles',
        details: fetchError.message
      }, { status: 500 })
    }

    const totalCount = musicJingles.length
    console.log(`📊 [BATCH RECOVERY] Found ${totalCount} processing music jingles`)

    if (totalCount === 0) {
      return NextResponse.json({
        success: true,
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        stillProcessing: 0,
        errors: 0,
        results: [],
        duration: Date.now() - startTime,
        message: 'No stuck music generations found'
      })
    }

    // Step 2: Process in batches with rate limiting
    const results: RecoveryResult[] = []
    let successful = 0
    let failed = 0
    let stillProcessing = 0
    let errors = 0

    // Process in batches of MAX_CONCURRENT_REQUESTS
    for (let i = 0; i < musicJingles.length; i += MAX_CONCURRENT_REQUESTS) {
      const batch = musicJingles.slice(i, i + MAX_CONCURRENT_REQUESTS)
      console.log(`🔄 [BATCH RECOVERY] Processing batch ${Math.floor(i / MAX_CONCURRENT_REQUESTS) + 1}/${Math.ceil(musicJingles.length / MAX_CONCURRENT_REQUESTS)}`)

      // Process batch concurrently
      const batchPromises = batch.map(async (musicJingle) => {
        return processMusicJingle(supabase, musicJingle)
      })

      const batchResults = await Promise.allSettled(batchPromises)
      
      // Process results
      batchResults.forEach((result, index) => {
        const musicJingle = batch[index]
        
        if (result.status === 'fulfilled') {
          const recoveryResult = result.value
          results.push(recoveryResult)
          
          switch (recoveryResult.status) {
            case 'recovered':
              successful++
              break
            case 'failed':
              failed++
              break
            case 'still_processing':
              stillProcessing++
              break
            case 'error':
              errors++
              break
          }
        } else {
          console.error(`❌ [BATCH RECOVERY] Promise rejected for ${musicJingle.suno_task_id}:`, result.reason)
          results.push({
            id: musicJingle.id,
            taskId: musicJingle.suno_task_id,
            status: 'error',
            message: 'Promise rejected',
            error: result.reason?.message || 'Unknown error'
          })
          errors++
        }
      })

      // Add delay between batches to avoid rate limiting
      if (i + MAX_CONCURRENT_REQUESTS < musicJingles.length) {
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS))
      }
    }

    const duration = Date.now() - startTime
    console.log(`✅ [BATCH RECOVERY] Completed in ${duration}ms`)
    console.log(`📊 [BATCH RECOVERY] Results: ${successful} successful, ${failed} failed, ${stillProcessing} still processing, ${errors} errors`)

    const response: RecoveryResponse = {
      success: true,
      totalProcessed: totalCount,
      successful,
      failed,
      stillProcessing,
      errors,
      results,
      duration
    }

    return NextResponse.json(response)

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ [BATCH RECOVERY] Batch recovery failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Batch recovery failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration
    }, { status: 500 })
  }
}

// Process individual music jingle
async function processMusicJingle(supabase: any, musicJingle: any): Promise<RecoveryResult> {
  try {
    console.log(`🔍 [BATCH RECOVERY] Checking: ${musicJingle.title} (${musicJingle.suno_task_id})`)

    // Check status with Suno API
    const sunoStatus = await sunoClient.getTaskStatus(musicJingle.suno_task_id)
    console.log(`📊 [BATCH RECOVERY] Suno status for ${musicJingle.suno_task_id}: ${sunoStatus.status}`)
    console.log(`📊 [BATCH RECOVERY] Full API response:`, JSON.stringify(sunoStatus, null, 2))
    
    // Extract audio data from correct nested structure
    const audioData = sunoStatus.response?.sunoData || []
    
    console.log(`📊 [BATCH RECOVERY] Audio data path check:`, {
      hasResponse: !!sunoStatus.response,
      hasSunoData: !!sunoStatus.response?.sunoData,
      audioCount: audioData.length
    })
    
    if (sunoStatus.status === 'SUCCESS' && audioData.length > 0) {
      console.log(`🎉 [BATCH RECOVERY] Task completed successfully! Processing ${audioData.length} audio file(s)...`)
      
      // Process each generated audio track
      const audioResults = []
      for (let i = 0; i < audioData.length; i++) {
        const audio = audioData[i]
        console.log(`📀 [BATCH RECOVERY] Processing audio ${i + 1}:`, audio.title || 'Untitled')

        try {
          // Try multiple URL fields with fallbacks (Suno uses camelCase)
          const audioUrl = audio.audioUrl || audio.sourceAudioUrl || audio.audio_url
          if (!audioUrl) {
            throw new Error('No audio URL found in Suno response')
          }
          
          if (!musicJingle.user_id) {
            throw new Error('Music jingle missing user_id')
          }
          
          const storedAudio = await downloadAndStoreSunoAudio(
            audioUrl,
            musicJingle.user_id,
            musicJingle.suno_task_id,
            i
          )

          // Use correct field names with fallbacks (camelCase from Suno API)
          audioResults.push({
            suno_audio_id: audio.id,
            title: audio.title || 'Untitled',
            duration: audio.duration,
            tags: audio.tags,
            audio_url: storedAudio.url,
            storage_path: storedAudio.path,
            suno_audio_url: audioUrl,
            image_url: audio.imageUrl || audio.sourceImageUrl || audio.image_url,
            prompt: audio.prompt,
            model_name: audio.modelName || audio.model_name,
            create_time: audio.createTime || audio.create_time
          })

          console.log(`✅ [BATCH RECOVERY] Audio ${i + 1} stored successfully`)
        } catch (audioError) {
          console.error(`❌ [BATCH RECOVERY] Failed to store audio ${i + 1}:`, audioError)
          console.log(`📊 [BATCH RECOVERY] Using Suno CDN URL as fallback`)
          
          // Use Suno's CDN URL directly as fallback
          const audioUrl = audio.audioUrl || audio.sourceAudioUrl || audio.audio_url
          audioResults.push({
            suno_audio_id: audio.id,
            title: audio.title || 'Untitled',
            duration: audio.duration,
            tags: audio.tags,
            audio_url: audioUrl,  // Use Suno CDN directly
            storage_path: null,   // No storage path since we didn't upload
            suno_audio_url: audioUrl,
            image_url: audio.imageUrl || audio.sourceImageUrl || audio.image_url,
            prompt: audio.prompt,
            model_name: audio.modelName || audio.model_name,
            create_time: audio.createTime || audio.create_time
          })
          
          console.log(`✅ [BATCH RECOVERY] Audio ${i + 1} using CDN fallback`)
        }
      }

      if (audioResults.length > 0) {
        // Update original row with first audio
        const { error: updateError } = await supabase
          .from('music_jingles')
          .update({
            status: 'completed',
            audio_url: audioResults[0].audio_url,
            storage_path: audioResults[0].storage_path,
            generated_audio_path: audioResults[0].audio_url,
            suno_audio_id: audioResults[0].suno_audio_id,
            callback_received_at: new Date().toISOString(),
            // Add Suno response metadata
            image_url: audioResults[0].image_url,
            tags: audioResults[0].tags,
            model_name: audioResults[0].model_name,
            actual_duration: audioResults[0].duration
          })
          .eq('id', musicJingle.id)

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`)
        }

        console.log(`✅ [BATCH RECOVERY] Original music jingle updated with first audio`)

        // Create additional rows for remaining audio files (if more than 1)
        if (audioResults.length > 1) {
          const additionalRows = audioResults.slice(1).map((audio, idx) => ({
            user_id: musicJingle.user_id,
            title: `${musicJingle.title} (Variant ${idx + 2})`,
            description: musicJingle.description,
            prompt: musicJingle.prompt,
            model: musicJingle.model,
            custom_mode: musicJingle.custom_mode,
            instrumental: musicJingle.instrumental,
            vocal_gender: musicJingle.vocal_gender,
            style_weight: musicJingle.style_weight,
            weirdness_constraint: musicJingle.weirdness_constraint,
            audio_weight: musicJingle.audio_weight,
            negative_tags: musicJingle.negative_tags,
            audio_action: musicJingle.audio_action,
            upload_url: musicJingle.upload_url,
            styles: musicJingle.styles,
            duration: musicJingle.duration,
            volume: musicJingle.volume,
            fade_in: musicJingle.fade_in,
            fade_out: musicJingle.fade_out,
            loop_mode: musicJingle.loop_mode,
            stereo_mode: musicJingle.stereo_mode,
            audio_url: audio.audio_url,
            storage_path: audio.storage_path,
            generated_audio_path: audio.audio_url,
            suno_task_id: musicJingle.suno_task_id,
            suno_audio_id: audio.suno_audio_id,
            status: 'completed',
            callback_received_at: new Date().toISOString(),
            content: musicJingle.content,
            metadata: {
              ...musicJingle.metadata,
              is_additional_variant: true,
              parent_generation_id: musicJingle.id,
              batch_recovery_completed_at: new Date().toISOString(),
              recovery_method: 'batch_api'
            }
          }))
          
          const { error: insertError } = await supabase
            .from('music_jingles')
            .insert(additionalRows)

          if (insertError) {
            throw new Error(`Database insert failed: ${insertError.message}`)
          }

          console.log(`✅ [BATCH RECOVERY] Created ${additionalRows.length} additional music jingle rows`)
        }

        console.log(`✅ [BATCH RECOVERY] Music jingle processing completed - ${audioResults.length} audio files stored`)
        
        return {
          id: musicJingle.id,
          taskId: musicJingle.suno_task_id,
          status: 'recovered',
          message: `Successfully recovered ${audioResults.length} audio file(s)`,
          audioCount: audioResults.length
        }
      } else {
        return {
          id: musicJingle.id,
          taskId: musicJingle.suno_task_id,
          status: 'failed',
          message: 'No audio files could be processed'
        }
      }

    } else if (sunoStatus.status === 'FAILED') {
      console.log(`❌ [BATCH RECOVERY] Task failed on Suno`)
      
      // Mark as failed
      const { error: updateError } = await supabase
        .from('music_jingles')
        .update({
          status: 'failed',
          callback_received_at: new Date().toISOString(),
          metadata: {
            ...musicJingle.metadata,
            batch_recovery_checked_at: new Date().toISOString(),
            suno_status: 'FAILED',
            recovery_method: 'batch_api'
          }
        })
        .eq('id', musicJingle.id)

      if (updateError) {
        console.error(`❌ [BATCH RECOVERY] Failed to update failed status:`, updateError)
      }
      
      return {
        id: musicJingle.id,
        taskId: musicJingle.suno_task_id,
        status: 'failed',
        message: 'Task failed on Suno'
      }

    } else if (sunoStatus.status === 'GENERATING' || sunoStatus.status === 'PENDING') {
      console.log(`⏳ [BATCH RECOVERY] Task still processing on Suno`)
      
      return {
        id: musicJingle.id,
        taskId: musicJingle.suno_task_id,
        status: 'still_processing',
        message: `Task still ${sunoStatus.status.toLowerCase()} on Suno`
      }

    } else if (sunoStatus.status === 'SENSITIVE_WORD_ERROR') {
      console.log(`🚫 [BATCH RECOVERY] Task rejected due to content policy: ${sunoStatus.errorMessage}`)
      
      // Mark as rejected in database
      const { error: updateError } = await supabase
        .from('music_jingles')
        .update({
          status: 'rejected',
          error_message: sunoStatus.errorMessage || 'Content rejected by Suno (likely artist names or policy violation)',
          callback_received_at: new Date().toISOString(),
          metadata: {
            ...musicJingle.metadata,
            batch_recovery_checked_at: new Date().toISOString(),
            suno_status: 'SENSITIVE_WORD_ERROR',
            recovery_method: 'batch_api'
          }
        })
        .eq('id', musicJingle.id)

      if (updateError) {
        console.error(`❌ [BATCH RECOVERY] Failed to update rejected status:`, updateError)
      }
      
      return {
        id: musicJingle.id,
        taskId: musicJingle.suno_task_id,
        status: 'failed',
        message: `Content rejected: ${sunoStatus.errorMessage}`
      }

    } else {
      console.log(`❓ [BATCH RECOVERY] Unknown status: ${sunoStatus.status}`)
      
      return {
        id: musicJingle.id,
        taskId: musicJingle.suno_task_id,
        status: 'error',
        message: `Unknown Suno status: ${sunoStatus.status}`
      }
    }

  } catch (error) {
    console.error(`❌ [BATCH RECOVERY] Error processing ${musicJingle.suno_task_id}:`, error)
    
    return {
      id: musicJingle.id,
      taskId: musicJingle.suno_task_id,
      status: 'error',
      message: 'Processing error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
