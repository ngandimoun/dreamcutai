#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const STUCK_VIDEO_ID = '8c2e1bb1-581d-4885-8023-17c7e0f1b8ff'
const SUNO_TASK_ID = '954b6faaf0f888c613d322775087cfc5'

async function manualVideoRecovery() {
  console.log('🔄 Manual video recovery...')
  console.log(`Video ID: ${STUCK_VIDEO_ID}`)
  console.log(`Suno Task ID: ${SUNO_TASK_ID}`)
  console.log('')
  
  try {
    // First, let's check the current status of the video
    console.log('📹 Checking current video status...')
    const { data: currentVideo, error: fetchError } = await supabase
      .from('music_videos')
      .select('*')
      .eq('id', STUCK_VIDEO_ID)
      .single()
    
    if (fetchError) {
      console.error('❌ Error fetching video:', fetchError)
      return
    }
    
    console.log('Current status:', currentVideo.status)
    console.log('Has video URL:', !!currentVideo.video_url)
    console.log('Has Suno video URL:', !!(currentVideo.suno_video_url || currentVideo.metadata?.suno_video_url))
    console.log('')
    
    // Since the video is completed on Suno, let's manually update it
    // We'll use a placeholder URL for now - you can replace this with the actual Suno video URL
    console.log('🔧 Manually updating video status...')
    
    // You'll need to get the actual video URL from Suno dashboard
    // For now, let's mark it as completed with a placeholder
    const { error: updateError } = await supabase
      .from('music_videos')
      .update({
        status: 'completed',
        video_url: 'https://placeholder-video-url.com', // Replace with actual Suno video URL
        updated_at: new Date().toISOString(),
        metadata: {
          ...currentVideo.metadata,
          manual_recovery: new Date().toISOString(),
          recovery_note: 'Manually recovered - please update with actual video URLs',
          suno_video_url: 'https://placeholder-suno-url.com' // Store in metadata for now
        }
      })
      .eq('id', STUCK_VIDEO_ID)
    
    if (updateError) {
      console.error('❌ Error updating video:', updateError)
      return
    }
    
    console.log('✅ Video status updated to completed!')
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Go to your Suno dashboard')
    console.log('2. Find the video for task ID: 954b6faaf0f888c613d322775087cfc5')
    console.log('3. Copy the video URL')
    console.log('4. Update the database with the actual video URL')
    console.log('')
    console.log('🎬 The video should now appear in your UI (though with placeholder URL)')
    console.log('   You can click on it and update the URL manually in the database.')
    
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

manualVideoRecovery().catch(console.error)
