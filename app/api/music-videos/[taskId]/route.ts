import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sunoClient } from '@/lib/suno/client'
import { SunoApiError } from '@/lib/suno/types'

// Cache for 30 seconds
export const revalidate = 30

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    console.log('🎬 [MUSIC VIDEO STATUS API] Get music video status called for task:', params.taskId)
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get music video from database
    const { data: musicVideo, error } = await supabase
      .from('music_videos')
      .select(`
        *,
        music_jingles (
          id,
          title,
          prompt,
          audio_url
        )
      `)
      .eq('suno_task_id', params.taskId)
      .eq('user_id', user.id)
      .single()

    if (error || !musicVideo) {
      console.error('❌ [MUSIC VIDEO STATUS API] Music video not found:', error)
      return NextResponse.json({ error: 'Music video not found' }, { status: 404 })
    }

    // If status is pending, poll Suno API for updates
    if (musicVideo.status === 'pending' || musicVideo.status === 'generating') {
      try {
        console.log('🔄 [MUSIC VIDEO STATUS API] Polling Suno API for status update...')
        const sunoStatus = await sunoClient.getMusicVideoStatus(params.taskId)
        
        console.log('📊 [MUSIC VIDEO STATUS API] Suno status:', sunoStatus)

        // Update database with latest status
        let newStatus = 'pending'
        let videoUrl = null

        if (sunoStatus.successFlag === 'SUCCESS' && sunoStatus.response?.videoUrl) {
          newStatus = 'completed'
          videoUrl = sunoStatus.response.videoUrl
        } else if (sunoStatus.successFlag === 'CREATE_TASK_FAILED' || 
                   sunoStatus.successFlag === 'GENERATE_MP4_FAILED' || 
                   sunoStatus.successFlag === 'CALLBACK_EXCEPTION') {
          newStatus = 'failed'
        } else if (sunoStatus.successFlag === 'PENDING') {
          newStatus = 'generating'
        }

        // Update database if status changed
        if (newStatus !== musicVideo.status || videoUrl !== musicVideo.video_url) {
          const { error: updateError } = await supabase
            .from('music_videos')
            .update({
              status: newStatus,
              video_url: videoUrl,
              updated_at: new Date().toISOString(),
              metadata: {
                ...musicVideo.metadata,
                last_suno_poll: new Date().toISOString(),
                suno_status: sunoStatus.successFlag,
                suno_error_code: sunoStatus.errorCode,
                suno_error_message: sunoStatus.errorMessage
              }
            })
            .eq('id', musicVideo.id)

          if (updateError) {
            console.error('❌ [MUSIC VIDEO STATUS API] Error updating music video:', updateError)
          } else {
            console.log('✅ [MUSIC VIDEO STATUS API] Music video status updated to:', newStatus)
            // Update local object for response
            musicVideo.status = newStatus
            musicVideo.video_url = videoUrl
          }
        }

      } catch (sunoError) {
        if (sunoError instanceof SunoApiError) {
          console.error('❌ [MUSIC VIDEO STATUS API] Suno API error:', sunoError.message)
          // Don't fail the request, just return current status
        } else {
          console.error('❌ [MUSIC VIDEO STATUS API] Unexpected error polling Suno:', sunoError)
        }
      }
    }

    return NextResponse.json({
      musicVideo: {
        id: musicVideo.id,
        suno_task_id: musicVideo.suno_task_id,
        status: musicVideo.status,
        video_url: musicVideo.video_url,
        author: musicVideo.author,
        domain_name: musicVideo.domain_name,
        source_task_id: musicVideo.source_task_id,
        source_audio_id: musicVideo.source_audio_id,
        created_at: musicVideo.created_at,
        updated_at: musicVideo.updated_at,
        music_jingle: musicVideo.music_jingles
      }
    })

  } catch (error) {
    console.error('❌ [MUSIC VIDEO STATUS API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
