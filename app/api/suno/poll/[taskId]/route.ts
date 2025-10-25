import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sunoClient } from '@/lib/suno/client'
import { SunoApiError } from '@/lib/suno/types'
import { downloadAndStoreSunoAudio, downloadAndStoreSunoVideo } from '@/lib/utils/audio-upload'

// Cache for 10 seconds
export const revalidate = 10

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params
    const body = await request.json().catch(() => ({}))
    
    // Check for internal service call with service role key
    const serviceRoleHeader = request.headers.get('x-service-role')
    const authHeader = request.headers.get('Authorization')
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    let isServiceCall = false
    if (serviceRoleHeader === 'true' && authHeader) {
      const token = authHeader.replace('Bearer ', '')
      if (token === serviceRoleKey) {
        isServiceCall = true
        console.log('✅ [SUNO POLL POST] Authenticated as internal service')
      }
    }

    // If not a service call, require user authentication
    if (!isServiceCall) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ [SUNO POLL POST] No user authentication found')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    
    console.log('🔍 [SUNO POLL POST] Polling task status:', taskId)
    console.log('📋 [SUNO POLL POST] Request body:', body)
    
    // Get task status from Suno API
    const taskStatus = await sunoClient.getTaskStatus(taskId)
    
    console.log('📊 [SUNO POLL POST] Task status:', taskStatus.status)
    
    // If updateOnFail flag is set and we have a generationId, update database
    if (body.updateOnFail && body.generationId) {
      const supabase = await createClient()
      
      if (taskStatus.status === 'FAILED' || taskStatus.status === 'SENSITIVE_WORD_ERROR') {
        const status = taskStatus.status === 'SENSITIVE_WORD_ERROR' ? 'rejected' : 'failed'
        const errorMessage = taskStatus.errorMessage || 
                           (taskStatus.status === 'SENSITIVE_WORD_ERROR' 
                             ? 'Content rejected by Suno (likely artist names or policy violation)'
                             : 'Task expired or failed')
        
        console.log(`⚠️ [SUNO POLL POST] Updating generation ${body.generationId} to ${status}`)
        
        // Determine which table to update based on type
        const tableName = body.type === 'music_video' ? 'music_videos' : 'music_jingles'
        
        await supabase
          .from(tableName)
          .update({
            status: status,
            error_message: errorMessage,
            callback_received_at: new Date().toISOString()
          })
          .eq('id', body.generationId)
      }
    }
    
    return NextResponse.json(taskStatus)
  } catch (error) {
    console.error('❌ [SUNO POLL POST] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params
    
    // Check for internal service call with service role key
    const serviceRoleHeader = request.headers.get('x-service-role')
    const authHeader = request.headers.get('Authorization')
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    let isServiceCall = false
    if (serviceRoleHeader === 'true' && authHeader) {
      const token = authHeader.replace('Bearer ', '')
      if (token === serviceRoleKey) {
        isServiceCall = true
        console.log('✅ [SUNO POLL GET] Authenticated as internal service')
      }
    }

    // If not a service call, require user authentication
    if (!isServiceCall) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ [SUNO POLL GET] No user authentication found')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    
    console.log('🔍 [SUNO POLL] Polling task status:', taskId)
    
    // Get task status from Suno API
    const taskStatus = await sunoClient.getTaskStatus(taskId)
    
    // Extract audio data from correct nested structure
    const audioData = taskStatus.response?.sunoData || []
    
    console.log('📊 [SUNO POLL] Full API response:', JSON.stringify(taskStatus, null, 2))
    console.log('📊 [SUNO POLL] Audio data path check:', {
      hasResponse: !!taskStatus.response,
      hasSunoData: !!taskStatus.response?.sunoData,
      audioCount: audioData.length
    })
    
    const supabase = await createClient()
    
    // Check if this is a music video task first
    const { data: musicVideo, error: videoFetchError } = await supabase
      .from('music_videos')
      .select('*')
      .eq('suno_task_id', taskId)
      .single()
    
    if (!videoFetchError && musicVideo) {
      console.log('🎬 [SUNO POLL] Found music video task, using video polling logic')
      return await handleMusicVideoPolling(supabase, taskId, musicVideo)
    }
    
    // Find the music jingle record
    const { data: musicJingle, error: fetchError } = await supabase
      .from('music_jingles')
      .select('*')
      .eq('suno_task_id', taskId)
      .single()
    
    if (fetchError || !musicJingle) {
      console.error('❌ [SUNO POLL] Music jingle not found:', fetchError)
      return NextResponse.json({ 
        error: 'Music jingle not found',
        taskId 
      }, { status: 404 })
    }
    
    console.log('✅ [SUNO POLL] Found music jingle:', musicJingle.id)
    
    // Update callback tracking table
    await supabase
      .from('suno_callbacks')
      .insert({
        received_at: new Date().toISOString(),
        task_id: taskId,
        callback_type: 'poll',
        raw_payload: taskStatus,
        processing_status: 'polling'
      })
    
    // Handle different statuses
    if (taskStatus.status === 'SUCCESS') {
      if (audioData && audioData.length > 0) {
        console.log('🎉 [SUNO POLL] Task completed successfully, processing audio...')
        
        // Process the completed audio (same logic as callback)
        await processCompletedAudio(supabase, musicJingle, audioData)
        
        return NextResponse.json({
          status: 'completed',
          taskId,
          message: 'Task completed and audio processed',
          audioCount: audioData.length
        })
      } else {
        console.log('⚠️ [SUNO POLL] Task marked as SUCCESS but no audio data available, keeping as processing')
        
        return NextResponse.json({
          status: 'processing',
          taskId,
          message: 'Task completed on Suno but audio not yet available',
          sunoStatus: taskStatus.status,
          audioCount: 0
        })
      }
    } else if (taskStatus.status === 'FAILED') {
      console.log('❌ [SUNO POLL] Task failed')
      
      // Mark as failed
      await supabase
        .from('music_jingles')
        .update({
          status: 'failed',
          callback_received_at: new Date().toISOString(),
          metadata: {
            ...musicJingle.metadata,
            suno_poll_received_at: new Date().toISOString(),
            error_message: 'Task failed on Suno',
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', musicJingle.id)
      
      return NextResponse.json({
        status: 'failed',
        taskId,
        message: 'Task failed on Suno'
      })
      
    } else if (taskStatus.status === 'GENERATING' || taskStatus.status === 'PENDING') {
      console.log('⏳ [SUNO POLL] Task still processing')
      
      return NextResponse.json({
        status: 'processing',
        taskId,
        message: 'Task is still being processed',
        sunoStatus: taskStatus.status
      })
      
    } else {
      console.log(`⚠️ [SUNO POLL] Unknown status: ${taskStatus.status}, keeping as processing`)
      
      return NextResponse.json({
        status: 'processing',
        taskId,
        message: `Unknown Suno status: ${taskStatus.status}, keeping as processing`,
        sunoStatus: taskStatus.status
      })
    }
    
  } catch (error) {
    console.error('❌ [SUNO POLL] Error polling task:', error)
    
    if (error instanceof SunoApiError) {
      return NextResponse.json({
        error: 'Suno API error',
        message: error.message,
        code: error.code,
        taskId: params.taskId
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      taskId: params.taskId
    }, { status: 500 })
  }
}

// Process completed audio (reused from callback handler)
async function processCompletedAudio(
  supabase: any,
  musicJingle: any,
  audioData: any[]
) {
  try {
    console.log('🎉 [SUNO POLL] Processing completed audio')
    
    // Check if there's any audio data to process
    if (!audioData || audioData.length === 0) {
      console.log('⚠️ [SUNO POLL] No audio data to process, skipping...')
      return
    }
    
    const audioResults = []
    
    // Process each generated audio track
    for (let i = 0; i < audioData.length; i++) {
      const audio = audioData[i]
      console.log(`📀 [SUNO POLL] Processing audio ${i + 1}:`, {
        id: audio.id,
        title: audio.title,
        duration: audio.duration,
        url: audio.audio_url
      })

      try {
        // Try multiple URL fields with fallbacks (Suno uses camelCase)
        const audioUrl = audio.audioUrl || audio.sourceAudioUrl || audio.audio_url
        if (!audioUrl) {
          throw new Error('No audio URL found in poll data')
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

        console.log(`✅ [SUNO POLL] Audio ${i + 1} stored successfully:`, storedAudio.fileName)
      } catch (audioError) {
        console.error(`❌ [SUNO POLL] Failed to store audio ${i + 1}:`, audioError)
        console.error(`📊 [SUNO POLL] Audio object:`, JSON.stringify(audio, null, 2))
        // Continue with other audio files even if one fails
      }
    }

    // Update the music jingle record with results
    const updateData = {
      status: 'completed',
      callback_received_at: new Date().toISOString(),
      generated_audio_path: audioResults[0]?.audio_url || null,
      storage_path: audioResults[0]?.storage_path || null,
      audio_url: audioResults[0]?.audio_url || null,
      suno_audio_id: audioResults[0]?.suno_audio_id || null,
      // Add Suno response metadata
      image_url: audioResults[0]?.image_url || null,
      tags: audioResults[0]?.tags || null,
      model_name: audioResults[0]?.model_name || null,
      actual_duration: audioResults[0]?.duration || null,
      metadata: {
        ...musicJingle.metadata,
        suno_poll_received_at: new Date().toISOString(),
        generated_audio_count: audioResults.length,
        audio_results: audioResults
      },
      content: {
        ...musicJingle.content,
        generated_audio: audioResults,
        suno_response: {
          task_id: musicJingle.suno_task_id,
          callback_type: 'poll',
          audio_count: audioResults.length,
          processed_at: new Date().toISOString()
        }
      }
    }

    const { error: updateError } = await supabase
      .from('music_jingles')
      .update(updateData)
      .eq('id', musicJingle.id)

    if (updateError) {
      console.error('❌ [SUNO POLL] Failed to update music jingle:', updateError)
      throw new Error(`Database update failed: ${updateError.message}`)
    }

    console.log('✅ [SUNO POLL] Original music jingle updated with first audio')

    // Create additional rows for remaining audio files (if more than 1)
    if (audioResults.length > 1) {
      const additionalRows = audioResults.slice(1).map((audio, idx) => ({
        user_id: musicJingle.user_id,
        title: `${musicJingle.title || 'Untitled Music'} (Variant ${idx + 2})`,
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
        image_url: audio.image_url,
        tags: audio.tags,
        model_name: audio.model_name,
        actual_duration: audio.duration,
        status: 'completed',
        callback_received_at: new Date().toISOString(),
        content: musicJingle.content,
        metadata: {
          ...musicJingle.metadata,
          is_additional_variant: true,
          parent_generation_id: musicJingle.id,
          suno_poll_completed_at: new Date().toISOString()
        }
      }))
      
      const { error: insertError } = await supabase
        .from('music_jingles')
        .insert(additionalRows)

      if (insertError) {
        console.error('❌ [SUNO POLL] Failed to insert additional variants:', insertError)
        // Don't throw - main audio was saved successfully
      } else {
        console.log(`✅ [SUNO POLL] Created ${audioResults.length - 1} additional music jingle rows`)
      }
    }

    console.log('✅ [SUNO POLL] Music jingle processing completed:', {
      id: musicJingle.id,
      audioCount: audioResults.length,
      status: 'completed'
    })

  } catch (error) {
    console.error('❌ [SUNO POLL] Error in audio processing:', error)
    throw error
  }
}

// Handle music video polling
async function handleMusicVideoPolling(
  supabase: any,
  taskId: string,
  musicVideo: any
) {
  try {
    console.log('🎬 [SUNO POLL] Polling music video status for task:', taskId)
    
    // Get music video status from Suno API
    const videoStatus = await sunoClient.getMusicVideoStatus(taskId)
    
    console.log('🎬 [SUNO POLL] Video status:', videoStatus.successFlag)
    
    // Update callback tracking table
    await supabase
      .from('suno_callbacks')
      .insert({
        received_at: new Date().toISOString(),
        task_id: taskId,
        callback_type: 'poll_music_video',
        raw_payload: videoStatus,
        processing_status: 'polling'
      })
    
    if (videoStatus.successFlag === 'SUCCESS' && videoStatus.response?.videoUrl) {
      console.log('🎬 [SUNO POLL] Video generation completed successfully')
      
      try {
        // Download and store video in Supabase Storage
        const storedVideo = await downloadAndStoreSunoVideo(
          videoStatus.response.videoUrl,
          musicVideo.user_id,
          taskId
        )

        console.log('🎬 [SUNO POLL] Video stored successfully:', storedVideo.fileName)

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
              poll_received: new Date().toISOString(),
              video_storage: {
                stored_at: new Date().toISOString(),
                storage_path: storedVideo.path,
                file_name: storedVideo.fileName,
                suno_cdn_url: storedVideo.sunoCdnUrl
              }
            }
          })
          .eq('suno_task_id', taskId)

        if (updateError) {
          console.error('❌ [SUNO POLL] Failed to update music video:', updateError)
        } else {
          console.log('✅ [SUNO POLL] Music video updated successfully with dual storage')
        }

        return NextResponse.json({
          status: 'completed',
          taskId,
          message: 'Video generation completed and stored',
          videoUrl: storedVideo.url
        })

      } catch (storageError) {
        console.error('❌ [SUNO POLL] Video storage failed, falling back to Suno CDN only:', storageError)
        
        // Fallback: Store only Suno CDN URL if storage fails
        const { error: updateError } = await supabase
          .from('music_videos')
          .update({
            status: 'completed',
            video_url: videoStatus.response.videoUrl, // Fallback: Suno CDN URL only
            suno_video_url: videoStatus.response.videoUrl,
            updated_at: new Date().toISOString(),
            metadata: {
              ...musicVideo.metadata,
              poll_received: new Date().toISOString(),
              storage_error: storageError instanceof Error ? storageError.message : 'Unknown storage error',
              fallback_to_suno_cdn: true
            }
          })
          .eq('suno_task_id', taskId)

        if (updateError) {
          console.error('❌ [SUNO POLL] Failed to update music video with fallback:', updateError)
        } else {
          console.log('✅ [SUNO POLL] Music video updated with Suno CDN fallback')
        }

        return NextResponse.json({
          status: 'completed',
          taskId,
          message: 'Video generation completed (Suno CDN fallback)',
          videoUrl: videoStatus.response.videoUrl
        })
      }

    } else if (videoStatus.successFlag === 'GENERATE_MP4_FAILED' || videoStatus.successFlag === 'CREATE_TASK_FAILED') {
      console.log('❌ [SUNO POLL] Video generation failed')
      
      // Mark as failed
      await supabase
        .from('music_videos')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          metadata: {
            ...musicVideo.metadata,
            poll_received: new Date().toISOString(),
            error_message: videoStatus.errorMessage || 'Video generation failed',
            failed_at: new Date().toISOString()
          }
        })
        .eq('suno_task_id', taskId)
      
      return NextResponse.json({
        status: 'failed',
        taskId,
        message: 'Video generation failed',
        error: videoStatus.errorMessage
      })
      
    } else if (videoStatus.successFlag === 'PENDING') {
      console.log('⏳ [SUNO POLL] Video generation still processing')
      
      return NextResponse.json({
        status: 'processing',
        taskId,
        message: 'Video generation is still being processed',
        sunoStatus: videoStatus.successFlag
      })
      
    } else {
      console.log(`⚠️ [SUNO POLL] Unknown video status: ${videoStatus.successFlag}, keeping as processing`)
      
      return NextResponse.json({
        status: 'processing',
        taskId,
        message: `Unknown Suno video status: ${videoStatus.successFlag}, keeping as processing`,
        sunoStatus: videoStatus.successFlag
      })
    }
    
  } catch (error) {
    console.error('❌ [SUNO POLL] Error in music video polling:', error)
    throw error
  }
}
