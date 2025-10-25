import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { downloadAndStoreSunoAudio, downloadAndStoreSunoVideo } from '@/lib/utils/audio-upload'
import { 
  SunoCallbackData, 
  LyricsCallbackData, 
  VocalSeparationCallback,
  MusicVideoCallbackData,
  SUNO_STATUS_CODES 
} from '@/lib/suno/types'

// Add retry logic with exponential backoff
async function processCallbackWithRetry(payload: any, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await processCallback(payload)
      return { success: true, attempt }
    } catch (error) {
      console.error(`[CALLBACK] Attempt ${attempt + 1} failed:`, error)
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw error
      }
    }
  }
}

// Main callback processing function
async function processCallback(payload: any) {
  // This will contain the existing callback logic
  // For now, we'll move the existing logic here
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎵 [SUNO CALLBACK] ===== CALLBACK RECEIVED =====')
    console.log('📅 [SUNO CALLBACK] Timestamp:', new Date().toISOString())
    console.log('🌐 [SUNO CALLBACK] Request URL:', request.url)
    console.log('📋 [SUNO CALLBACK] Request headers:', Object.fromEntries(request.headers.entries()))
    
    // Parse callback data - could be different types
    const rawData = await request.json()
    console.log('📝 [SUNO CALLBACK] ===== RAW CALLBACK DATA =====')
    console.log('📝 [SUNO CALLBACK] Complete payload:', JSON.stringify(rawData, null, 2))
    console.log('📝 [SUNO CALLBACK] Data type:', typeof rawData)
    console.log('📝 [SUNO CALLBACK] Data keys:', Object.keys(rawData))
    console.log('📝 [SUNO CALLBACK] Task ID fields:', {
      task_id: rawData.task_id,
      taskId: rawData.taskId,
      id: rawData.id
    })
    console.log('📝 [SUNO CALLBACK] Callback type fields:', {
      callbackType: rawData.callbackType,
      type: rawData.type,
      status: rawData.status
    })
    console.log('📝 [SUNO CALLBACK] Data structure:', {
      hasData: !!rawData.data,
      dataType: typeof rawData.data,
      dataLength: Array.isArray(rawData.data) ? rawData.data.length : 'not array',
      dataKeys: rawData.data ? Object.keys(rawData.data) : 'no data'
    })

    const supabase = await createClient()
    
    // Store callback in tracking table for debugging
    await storeCallbackForDebugging(supabase, rawData)
    
    console.log('🔍 [SUNO CALLBACK] ===== CALLBACK TYPE DETECTION =====')
    
    // Determine callback type and handle accordingly
    if (rawData.code !== undefined && rawData.data && rawData.data.task_id && rawData.data.video_url !== undefined) {
      console.log('🎬 [SUNO CALLBACK] Detected: Music Video Callback')
      await handleMusicVideoCallback(supabase, rawData as MusicVideoCallbackData)
    } else if (rawData.callbackType === 'complete' && rawData.data && Array.isArray(rawData.data)) {
      console.log('🎵 [SUNO CALLBACK] Detected: Lyrics Callback')
      await handleLyricsCallback(supabase, rawData as LyricsCallbackData)
    } else if (rawData.task_id && rawData.vocal_removal_info !== undefined) {
      console.log('🎵 [SUNO CALLBACK] Detected: Audio Separation Callback')
      await handleSeparationCallback(supabase, rawData as VocalSeparationCallback)
    } else if (rawData.task_id && rawData.callbackType) {
      console.log('🎵 [SUNO CALLBACK] Detected: Music Generation Callback')
      await handleMusicCallback(supabase, rawData as SunoCallbackData)
    } else if (rawData.task_id || rawData.taskId) {
      // Fallback: if we have a task ID but unclear type, try music callback
      console.log('🎵 [SUNO CALLBACK] Detected: Music Generation Callback (fallback)')
      const taskId = rawData.task_id || rawData.taskId
      const callbackData = {
        task_id: taskId,
        callbackType: rawData.callbackType || rawData.type || 'complete',
        data: rawData.data || rawData.result || []
      }
      await handleMusicCallback(supabase, callbackData as SunoCallbackData)
    } else {
      console.log('❓ [SUNO CALLBACK] ===== UNKNOWN CALLBACK TYPE =====')
      console.log('❓ [SUNO CALLBACK] No recognizable callback pattern found')
      console.log('❓ [SUNO CALLBACK] Raw data:', rawData)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ 
      status: 'received',
      taskId: rawData.task_id || rawData.taskId,
      processed: true
    })

  } catch (error) {
    console.error('❌ [SUNO CALLBACK] Error processing callback:', error)
    
    // Still return 200 to prevent Suno from retrying
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Handle lyrics generation callbacks
async function handleLyricsCallback(
  supabase: any,
  callbackData: LyricsCallbackData
) {
  try {
    console.log('🎵 [SUNO CALLBACK] Processing lyrics callback')
    
    // Find the lyrics generation record
    const { data: lyricsGeneration, error: fetchError } = await supabase
      .from('lyrics_generations')
      .select('*')
      .eq('suno_task_id', callbackData.taskId)
      .single()

    if (fetchError || !lyricsGeneration) {
      console.error('❌ [SUNO CALLBACK] Lyrics generation not found:', fetchError)
      return
    }

    if (callbackData.callbackType === 'complete' && callbackData.data) {
      // Save lyrics data
      const firstLyrics = callbackData.data.find(l => l.status === 'complete')
      if (firstLyrics) {
        const { error: updateError } = await supabase
          .from('lyrics_generations')
          .update({
            status: 'completed',
            lyrics_text: firstLyrics.text,
            title: firstLyrics.title,
            updated_at: new Date().toISOString()
          })
          .eq('suno_task_id', callbackData.taskId)

        if (updateError) {
          console.error('❌ [SUNO CALLBACK] Failed to update lyrics:', updateError)
        } else {
          console.log('✅ [SUNO CALLBACK] Lyrics updated successfully')
        }
      }
    } else if (callbackData.callbackType === 'error') {
      // Mark as failed
      const { error: updateError } = await supabase
        .from('lyrics_generations')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('suno_task_id', callbackData.taskId)

      if (updateError) {
        console.error('❌ [SUNO CALLBACK] Failed to update lyrics status:', updateError)
      }
    }

  } catch (error) {
    console.error('❌ [SUNO CALLBACK] Error in lyrics callback handler:', error)
  }
}

// Handle audio separation callbacks
async function handleSeparationCallback(
  supabase: any,
  callbackData: VocalSeparationCallback
) {
  try {
    console.log('🎵 [SUNO CALLBACK] Processing audio separation callback')
    
    // Find the audio separation record
    const { data: audioSeparation, error: fetchError } = await supabase
      .from('audio_separations')
      .select('*')
      .eq('suno_task_id', callbackData.task_id)
      .single()

    if (fetchError || !audioSeparation) {
      console.error('❌ [SUNO CALLBACK] Audio separation not found:', fetchError)
      return
    }

    if (callbackData.vocal_removal_info) {
      // Save separation results
      const { error: updateError } = await supabase
        .from('audio_separations')
        .update({
          status: 'completed',
          instrumental_url: callbackData.vocal_removal_info.instrumental_url,
          vocal_url: callbackData.vocal_removal_info.vocal_url,
          backing_vocals_url: callbackData.vocal_removal_info.backing_vocals_url,
          drums_url: callbackData.vocal_removal_info.drums_url,
          bass_url: callbackData.vocal_removal_info.bass_url,
          guitar_url: callbackData.vocal_removal_info.guitar_url,
          keyboard_url: callbackData.vocal_removal_info.keyboard_url,
          percussion_url: callbackData.vocal_removal_info.percussion_url,
          strings_url: callbackData.vocal_removal_info.strings_url,
          synth_url: callbackData.vocal_removal_info.synth_url,
          fx_url: callbackData.vocal_removal_info.fx_url,
          brass_url: callbackData.vocal_removal_info.brass_url,
          woodwinds_url: callbackData.vocal_removal_info.woodwinds_url,
          updated_at: new Date().toISOString()
        })
        .eq('suno_task_id', callbackData.task_id)

      if (updateError) {
        console.error('❌ [SUNO CALLBACK] Failed to update audio separation:', updateError)
      } else {
        console.log('✅ [SUNO CALLBACK] Audio separation updated successfully')
      }
    } else {
      // Mark as failed
      const { error: updateError } = await supabase
        .from('audio_separations')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('suno_task_id', callbackData.task_id)

      if (updateError) {
        console.error('❌ [SUNO CALLBACK] Failed to update audio separation status:', updateError)
      }
    }

  } catch (error) {
    console.error('❌ [SUNO CALLBACK] Error in separation callback handler:', error)
  }
}

async function handleMusicVideoCallback(
  supabase: any,
  callbackData: MusicVideoCallbackData
) {
  try {
    console.log('🎬 [SUNO CALLBACK] Processing music video callback')
    
    // Find the music video record
    const { data: musicVideo, error: fetchError } = await supabase
      .from('music_videos')
      .select('*')
      .eq('suno_task_id', callbackData.data.task_id)
      .single()

    if (fetchError || !musicVideo) {
      console.error('❌ [SUNO CALLBACK] Music video not found:', fetchError)
      return
    }

    if (callbackData.code === 200 && callbackData.data.video_url) {
      // Video generation completed successfully
      console.log('🎬 [SUNO CALLBACK] Video generation completed, starting download and storage...')
      
      try {
        // Download and store video in Supabase Storage
        const storedVideo = await downloadAndStoreSunoVideo(
          callbackData.data.video_url,
          musicVideo.user_id,
          callbackData.data.task_id
        )

        console.log('🎬 [SUNO CALLBACK] Video stored successfully:', storedVideo.fileName)

        // Update database with both Suno CDN URL and Supabase Storage URL
        const { error: updateError } = await supabase
          .from('music_videos')
          .update({
            status: 'completed',
            video_url: storedVideo.url, // Primary: Supabase signed URL
            storage_path: storedVideo.path,
            suno_video_url: storedVideo.sunoCdnUrl, // Fallback: Suno CDN URL
            updated_at: new Date().toISOString(),
            metadata: {
              ...musicVideo.metadata,
              callback_received: new Date().toISOString(),
              suno_callback_code: callbackData.code,
              suno_callback_msg: callbackData.msg,
              video_storage: {
                stored_at: new Date().toISOString(),
                storage_path: storedVideo.path,
                file_name: storedVideo.fileName,
                suno_cdn_url: storedVideo.sunoCdnUrl
              }
            }
          })
          .eq('suno_task_id', callbackData.data.task_id)

        if (updateError) {
          console.error('❌ [SUNO CALLBACK] Failed to update music video:', updateError)
        } else {
          console.log('✅ [SUNO CALLBACK] Music video updated successfully with dual storage')
        }

      } catch (storageError) {
        console.error('❌ [SUNO CALLBACK] Video storage failed, falling back to Suno CDN only:', storageError)
        
        // Fallback: Store only Suno CDN URL if storage fails
        const { error: updateError } = await supabase
          .from('music_videos')
          .update({
            status: 'completed',
            video_url: callbackData.data.video_url, // Fallback: Suno CDN URL only
            suno_video_url: callbackData.data.video_url,
            updated_at: new Date().toISOString(),
            metadata: {
              ...musicVideo.metadata,
              callback_received: new Date().toISOString(),
              suno_callback_code: callbackData.code,
              suno_callback_msg: callbackData.msg,
              storage_error: storageError instanceof Error ? storageError.message : 'Unknown storage error',
              fallback_to_suno_cdn: true
            }
          })
          .eq('suno_task_id', callbackData.data.task_id)

        if (updateError) {
          console.error('❌ [SUNO CALLBACK] Failed to update music video with fallback:', updateError)
        } else {
          console.log('✅ [SUNO CALLBACK] Music video updated with Suno CDN fallback')
        }
      }
    } else {
      // Video generation failed
      const { error: updateError } = await supabase
        .from('music_videos')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          metadata: {
            ...musicVideo.metadata,
            callback_received: new Date().toISOString(),
            suno_callback_code: callbackData.code,
            suno_callback_msg: callbackData.msg,
            error: 'Video generation failed'
          }
        })
        .eq('suno_task_id', callbackData.data.task_id)

      if (updateError) {
        console.error('❌ [SUNO CALLBACK] Failed to update music video status:', updateError)
      } else {
        console.log('❌ [SUNO CALLBACK] Music video marked as failed')
      }
    }

  } catch (error) {
    console.error('❌ [SUNO CALLBACK] Error in music video callback handler:', error)
  }
}

// Handle music generation callbacks (existing logic)
async function handleMusicCallback(
  supabase: any,
  callbackData: SunoCallbackData
) {
  try {
    console.log('🎵 [SUNO CALLBACK] Processing music generation callback')
    
    // Find the music jingle record by Suno task ID
    const { data: musicJingle, error: fetchError } = await supabase
      .from('music_jingles')
      .select('*')
      .eq('suno_task_id', callbackData.task_id)
      .single()

    if (fetchError || !musicJingle) {
      console.error('❌ [SUNO CALLBACK] Music jingle not found:', fetchError)
      return
    }

    console.log('✅ [SUNO CALLBACK] Found music jingle:', musicJingle.id)

    // Handle different callback types
    if (callbackData.callbackType === 'complete' && callbackData.data) {
      // Success - process generated audio
      await handleSuccessfulGeneration(supabase, musicJingle, callbackData.data)
    } else if (callbackData.callbackType === 'error') {
      // Failure - determine if it's a rejection or technical failure
      const errorMessage = callbackData.data?.[0]?.errorMessage || callbackData.msg || 'Unknown error'
      const isRejection = errorMessage.toLowerCase().includes('rejected') || 
                          errorMessage.toLowerCase().includes('policy') ||
                          errorMessage.toLowerCase().includes('content') ||
                          errorMessage.toLowerCase().includes('forbidden') ||
                          errorMessage.toLowerCase().includes('violation')
      
      const status = isRejection ? 'rejected' : 'failed'
      console.log(`📝 [SUNO CALLBACK] Generation ${status}:`, errorMessage)
      
      await handleFailedGeneration(supabase, musicJingle, errorMessage, status)
    } else {
      // Other callback types (text, first) - just log for now
      console.log('📝 [SUNO CALLBACK] Intermediate callback:', callbackData.callbackType)
    }

  } catch (error) {
    console.error('❌ [SUNO CALLBACK] Error in music callback handler:', error)
  }
}

async function handleSuccessfulGeneration(
  supabase: any,
  musicJingle: any,
  audioData: any[]
) {
  try {
    console.log('🎉 [SUNO CALLBACK] Processing successful generation')
    
    const audioResults = []
    
    // Process each generated audio track
    for (let i = 0; i < audioData.length; i++) {
      const audio = audioData[i]
      console.log(`📀 [SUNO CALLBACK] Processing audio ${i + 1}:`, {
        id: audio.id,
        title: audio.title,
        duration: audio.duration,
        url: audio.audio_url
      })

      try {
        // Try multiple URL fields with fallbacks (Suno uses camelCase)
        const audioUrl = audio.audioUrl || audio.sourceAudioUrl || audio.audio_url
        if (!audioUrl) {
          throw new Error('No audio URL found in callback data')
        }
        
        // Download and store the audio file
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

        console.log(`✅ [SUNO CALLBACK] Audio ${i + 1} stored successfully:`, storedAudio.fileName)
      } catch (audioError) {
        console.error(`❌ [SUNO CALLBACK] Failed to store audio ${i + 1}:`, audioError)
        console.error(`📊 [SUNO CALLBACK] Audio object:`, JSON.stringify(audio, null, 2))
        // Continue with other audio files even if one fails
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
          // Add Suno response data
          image_url: audioResults[0].image_url,
          tags: audioResults[0].tags,
          model_name: audioResults[0].model_name,
          actual_duration: audioResults[0].duration
        })
        .eq('id', musicJingle.id)

      if (updateError) {
        console.error('❌ [SUNO CALLBACK] Failed to update original music jingle:', updateError)
        throw new Error(`Database update failed: ${updateError.message}`)
      }

      console.log('✅ [SUNO CALLBACK] Original music jingle updated with first audio')

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
            suno_callback_received_at: new Date().toISOString()
          }
        }))
        
        const { error: insertError } = await supabase
          .from('music_jingles')
          .insert(additionalRows)

        if (insertError) {
          console.error('❌ [SUNO CALLBACK] Failed to insert additional music jingles:', insertError)
          throw new Error(`Database insert failed: ${insertError.message}`)
        }

        console.log('✅ [SUNO CALLBACK] Created', additionalRows.length, 'additional music jingle rows')
      }

      console.log('✅ [SUNO CALLBACK] Music jingle processing completed -', audioResults.length, 'audio files stored')
    }

  } catch (error) {
    console.error('❌ [SUNO CALLBACK] Error in successful generation handler:', error)
    throw error
  }
}

async function handleFailedGeneration(
  supabase: any,
  musicJingle: any,
  errorMessage: string,
  status: 'failed' | 'rejected' = 'failed'
) {
  try {
    console.log(`❌ [SUNO CALLBACK] Processing ${status} generation:`, errorMessage)

    const updateData = {
      status: status,
      error_message: errorMessage,
      callback_received_at: new Date().toISOString(),
      metadata: {
        ...musicJingle.metadata,
        suno_callback_received_at: new Date().toISOString(),
        error_message: errorMessage,
        failed_at: new Date().toISOString()
      },
      content: {
        ...musicJingle.content,
        suno_response: {
          task_id: musicJingle.suno_task_id,
          callback_type: 'error',
          error_message: errorMessage,
          processed_at: new Date().toISOString()
        }
      }
    }

    const { error: updateError } = await supabase
      .from('music_jingles')
      .update(updateData)
      .eq('id', musicJingle.id)

    if (updateError) {
      console.error('❌ [SUNO CALLBACK] Failed to update failed music jingle:', updateError)
      throw new Error(`Database update failed: ${updateError.message}`)
    }

    console.log('✅ [SUNO CALLBACK] Failed music jingle updated:', {
      id: musicJingle.id,
      status: 'failed',
      error: errorMessage
    })

  } catch (error) {
    console.error('❌ [SUNO CALLBACK] Error in failed generation handler:', error)
    throw error
  }
}

// Store callback for debugging purposes
async function storeCallbackForDebugging(supabase: any, rawData: any) {
  try {
    const { error } = await supabase
      .from('suno_callbacks')
      .insert({
        received_at: new Date().toISOString(),
        task_id: rawData.task_id || rawData.taskId || null,
        callback_type: rawData.callbackType || rawData.type || 'unknown',
        raw_payload: rawData,
        processing_status: 'received'
      })
    
    if (error) {
      console.log('⚠️ [SUNO CALLBACK] Failed to store callback for debugging:', error.message)
    } else {
      console.log('✅ [SUNO CALLBACK] Callback stored for debugging')
    }
  } catch (error) {
    console.log('⚠️ [SUNO CALLBACK] Error storing callback for debugging:', error)
  }
}

// Handle GET requests for health checks
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    endpoint: 'suno-callback',
    timestamp: new Date().toISOString()
  })
}
