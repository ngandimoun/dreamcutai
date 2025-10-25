#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { sunoClient } from '@/lib/suno/client'
import { downloadAndStoreSunoVideo } from '@/lib/utils/audio-upload'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const STUCK_VIDEO_ID = '8c2e1bb1-581d-4885-8023-17c7e0f1b8ff'
const SUNO_TASK_ID = '954b6faaf0f888c613d322775087cfc5'

async function recoverVideoDirect() {
  console.log('🔄 Direct recovery of stuck music video...')
  
  try {
    // Get video record from database
    const { data: videoRecord, error: fetchError } = await supabase
      .from('music_videos')
      .select('*')
      .eq('id', STUCK_VIDEO_ID)
      .single()
    
    if (fetchError) {
      console.error('❌ Error fetching video record:', fetchError)
      return
    }
    
    console.log('📹 Found video record')
    console.log(`   Status: ${videoRecord.status}`)
    
    // Get status from Suno API
    console.log('📞 Fetching status from Suno API...')
    const videoStatus = await sunoClient.getMusicVideoStatus(SUNO_TASK_ID)
    
    console.log(`   Suno Status: ${videoStatus.successFlag}`)
    
    if (videoStatus.successFlag === 'SUCCESS' && videoStatus.response?.videoUrl) {
      console.log('✅ Video is completed on Suno!')
      console.log(`   Video URL: ${videoStatus.response.videoUrl}`)
      
      try {
        // Download and store video
        console.log('📥 Downloading and storing video...')
        const storedVideo = await downloadAndStoreSunoVideo(
          videoStatus.response.videoUrl,
          videoRecord.user_id,
          SUNO_TASK_ID
        )
        
        console.log('✅ Video stored successfully!')
        
        // Update database
        const { error: updateError } = await supabase
          .from('music_videos')
          .update({
            status: 'completed',
            video_url: storedVideo.url,
            storage_path: storedVideo.path,
            suno_video_url: storedVideo.sunoCdnUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', STUCK_VIDEO_ID)
        
        if (updateError) {
          console.error('❌ Error updating database:', updateError)
          return
        }
        
        console.log('✅ Database updated!')
        console.log('')
        console.log('🎉 Video recovered successfully!')
        console.log('The video should now appear in your UI.')
        
      } catch (storageError) {
        console.error('❌ Storage failed, using Suno CDN fallback:', storageError)
        
        // Fallback: Store only Suno CDN URL
        const { error: updateError } = await supabase
          .from('music_videos')
          .update({
            status: 'completed',
            video_url: videoStatus.response.videoUrl,
            suno_video_url: videoStatus.response.videoUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', STUCK_VIDEO_ID)
        
        if (updateError) {
          console.error('❌ Error updating database with fallback:', updateError)
        } else {
          console.log('✅ Database updated with Suno CDN fallback!')
        }
      }
    } else {
      console.log('⚠️  Video not ready on Suno')
      console.log(`   Status: ${videoStatus.successFlag}`)
      console.log(`   Error: ${videoStatus.errorMessage || 'N/A'}`)
    }
    
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

recoverVideoDirect().catch(console.error)














