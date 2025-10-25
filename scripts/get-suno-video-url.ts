#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SUNO_TASK_ID = '954b6faaf0f888c613d322775087cfc5'
const VIDEO_ID = '8c2e1bb1-581d-4885-8023-17c7e0f1b8ff'

async function getSunoVideoUrl() {
  console.log('🎬 Fetching actual video URL from Suno...')
  console.log(`Task ID: ${SUNO_TASK_ID}`)
  console.log('')
  
  try {
    // Call Suno API to get video status
    const sunoApiKey = process.env.SUNO_API_KEY
    if (!sunoApiKey) {
      console.error('❌ SUNO_API_KEY not found in environment variables')
      return
    }

    console.log('📞 Calling Suno API...')
    const response = await fetch(`https://api.suno.ai/v1/generate/record-info?task_id=${SUNO_TASK_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('❌ Suno API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return
    }

    const data = await response.json()
    console.log('✅ Suno API response received')
    console.log('Response data:', JSON.stringify(data, null, 2))

    // Extract video URL from response
    let videoUrl = null
    if (data.data && data.data.length > 0) {
      const videoData = data.data[0]
      videoUrl = videoData.video_url || videoData.videoUrl
      console.log('🎥 Found video URL:', videoUrl)
    }

    if (!videoUrl) {
      console.log('❌ No video URL found in Suno response')
      console.log('Available fields:', Object.keys(data.data?.[0] || {}))
      return
    }

    // Update database with real video URL
    console.log('💾 Updating database with real video URL...')
    const { error: updateError } = await supabase
      .from('music_videos')
      .update({
        video_url: videoUrl,
        metadata: {
          ...data.data?.[0],
          suno_video_url: videoUrl,
          real_url_fetched: new Date().toISOString()
        }
      })
      .eq('id', VIDEO_ID)

    if (updateError) {
      console.error('❌ Error updating database:', updateError)
      return
    }

    console.log('✅ Database updated successfully!')
    console.log('🎬 Video should now be playable in your UI')
    console.log('')
    console.log('📋 Video URL:', videoUrl)

  } catch (error) {
    console.error('💥 Error:', error)
  }
}

getSunoVideoUrl().catch(console.error)














