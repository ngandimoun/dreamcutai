import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sunoClient } from '@/lib/suno/client'
import { SunoApiError } from '@/lib/suno/types'
import { downloadAndStoreSunoAudio } from '@/lib/utils/audio-upload'

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params
    
    console.log('🔧 [SUNO RECOVER] Manual recovery requested for task:', taskId)
    
    const supabase = await createClient()
    
    // Find the music jingle record
    const { data: musicJingle, error: fetchError } = await supabase
      .from('music_jingles')
      .select('*')
      .eq('suno_task_id', taskId)
      .single()
    
    if (fetchError || !musicJingle) {
      console.error('❌ [SUNO RECOVER] Music jingle not found:', fetchError)
      return NextResponse.json({ 
        error: 'Music jingle not found',
        taskId 
      }, { status: 404 })
    }
    
    console.log('✅ [SUNO RECOVER] Found music jingle:', musicJingle.id)
    
    // Get current status from Suno
    const taskStatus = await sunoClient.getTaskStatus(taskId)
    console.log('📊 [SUNO RECOVER] Current Suno status:', {
      taskId,
      status: taskStatus.status,
      hasData: !!taskStatus.data,
      dataLength: taskStatus.data?.length || 0
    })
    
    // Update recovery attempt in metadata
    const recoveryAttempt = {
      ...musicJingle.metadata,
      recovery_attempts: (musicJingle.metadata?.recovery_attempts || 0) + 1,
      last_recovery_attempt: new Date().toISOString(),
      suno_status_at_recovery: taskStatus.status
    }
    
    // Extract audio data from correct nested structure
    const audioData = taskStatus.response?.sunoData || []
    
    console.log(`📊 [SUNO RECOVER] Audio data path check:`, {
      hasResponse: !!taskStatus.response,
      hasSunoData: !!taskStatus.response?.sunoData,
      audioCount: audioData.length
    })
    
    if (taskStatus.status === 'SUCCESS' && audioData.length > 0) {
      console.log('🎉 [SUNO RECOVER] Task is actually completed, processing...')
      
      // Process the completed audio (reuse logic from callback handler)
      await processCompletedAudio(supabase, musicJingle, audioData)
      
      return NextResponse.json({
        success: true,
        taskId,
        message: 'Task was completed and audio has been processed',
        audioCount: audioData.length,
        recoveryAttempt: recoveryAttempt.recovery_attempts
      })
      
    } else if (taskStatus.status === 'FAILED') {
      console.log('❌ [SUNO RECOVER] Task failed on Suno')
      
      // Mark as failed
      await supabase
        .from('music_jingles')
        .update({
          status: 'failed',
          callback_received_at: new Date().toISOString(),
          metadata: {
            ...recoveryAttempt,
            error_message: 'Task failed on Suno (confirmed via recovery)',
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', musicJingle.id)
      
      return NextResponse.json({
        success: false,
        taskId,
        message: 'Task failed on Suno',
        sunoStatus: taskStatus.status,
        recoveryAttempt: recoveryAttempt.recovery_attempts
      })
      
    } else if (taskStatus.status === 'GENERATING' || taskStatus.status === 'PENDING') {
      console.log('⏳ [SUNO RECOVER] Task still processing')
      
      // Update metadata with recovery attempt
      await supabase
        .from('music_jingles')
        .update({
          metadata: recoveryAttempt
        })
        .eq('id', musicJingle.id)
      
      return NextResponse.json({
        success: false,
        taskId,
        message: 'Task is still being processed on Suno',
        sunoStatus: taskStatus.status,
        recoveryAttempt: recoveryAttempt.recovery_attempts
      })
      
    } else {
      console.log('❓ [SUNO RECOVER] Unknown status:', taskStatus.status)
      
      return NextResponse.json({
        success: false,
        taskId,
        message: 'Unknown task status',
        sunoStatus: taskStatus.status,
        recoveryAttempt: recoveryAttempt.recovery_attempts
      })
    }
    
  } catch (error) {
    console.error('❌ [SUNO RECOVER] Error in recovery:', error)
    
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
    console.log('🎉 [SUNO RECOVER] Processing completed audio')
    
    const audioResults = []
    
    // Process each generated audio track
    for (let i = 0; i < audioData.length; i++) {
      const audio = audioData[i]
      console.log(`📀 [SUNO RECOVER] Processing audio ${i + 1}:`, {
        id: audio.id,
        title: audio.title,
        duration: audio.duration,
        url: audio.audio_url
      })

      try {
        // Download and store the audio file
        const storedAudio = await downloadAndStoreSunoAudio(
          audio.audio_url,
          musicJingle.user_id,
          musicJingle.suno_task_id,
          i
        )

        audioResults.push({
          suno_audio_id: audio.id,
          title: audio.title,
          duration: audio.duration,
          tags: audio.tags,
          audio_url: storedAudio.url,
          storage_path: storedAudio.path,
          suno_audio_url: audio.audio_url,
          image_url: audio.image_url,
          prompt: audio.prompt,
          model_name: audio.model_name,
          create_time: audio.createTime
        })

        console.log(`✅ [SUNO RECOVER] Audio ${i + 1} stored successfully:`, storedAudio.fileName)
      } catch (audioError) {
        console.error(`❌ [SUNO RECOVER] Failed to store audio ${i + 1}:`, audioError)
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
          callback_received_at: new Date().toISOString()
        })
        .eq('id', musicJingle.id)

      if (updateError) {
        console.error('❌ [SUNO RECOVER] Failed to update original music jingle:', updateError)
        throw new Error(`Database update failed: ${updateError.message}`)
      }

      console.log('✅ [SUNO RECOVER] Original music jingle updated with first audio')

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
            suno_recovery_received_at: new Date().toISOString()
          }
        }))
        
        const { error: insertError } = await supabase
          .from('music_jingles')
          .insert(additionalRows)

        if (insertError) {
          console.error('❌ [SUNO RECOVER] Failed to insert additional music jingles:', insertError)
          throw new Error(`Database insert failed: ${insertError.message}`)
        }

        console.log('✅ [SUNO RECOVER] Created', additionalRows.length, 'additional music jingle rows')
      }

      console.log('✅ [SUNO RECOVER] Music jingle processing completed -', audioResults.length, 'audio files stored')
    }

  } catch (error) {
    console.error('❌ [SUNO RECOVER] Error in audio processing:', error)
    throw error
  }
}
