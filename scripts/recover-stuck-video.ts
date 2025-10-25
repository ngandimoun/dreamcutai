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

async function recoverVideo() {
  console.log('🔄 Recovering stuck music video...')
  console.log(`Video ID: ${STUCK_VIDEO_ID}`)
  console.log(`Suno Task ID: ${SUNO_TASK_ID}`)
  console.log('')
  
  try {
    // Trigger the polling endpoint with service role auth
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log(`📞 Calling polling endpoint: ${baseUrl}/api/suno/poll/${SUNO_TASK_ID}`)
    const response = await fetch(`${baseUrl}/api/suno/poll/${SUNO_TASK_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'x-service-role': 'true'
      },
      body: JSON.stringify({
        generationId: STUCK_VIDEO_ID,
        updateOnFail: false,
        type: 'music_video'
      })
    })
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      console.error(`❌ Polling failed: ${response.status} ${response.statusText}`)
      const text = await response.text()
      console.error('Response:', text.substring(0, 500) + (text.length > 500 ? '...' : ''))
      return
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      console.error('❌ Response is not JSON, content-type:', contentType)
      const text = await response.text()
      console.error('Response:', text.substring(0, 500) + (text.length > 500 ? '...' : ''))
      return
    }
    
    const result = await response.json()
    console.log('✅ Polling successful!')
    console.log('Result:', JSON.stringify(result, null, 2))
    
    // Check database to verify update
    const { data: video, error } = await supabase
      .from('music_videos')
      .select('id, status, video_url, suno_video_url, storage_path')
      .eq('id', STUCK_VIDEO_ID)
      .single()
    
    if (error) {
      console.error('❌ Error fetching video:', error)
      return
    }
    
    console.log('')
    console.log('📊 Updated Video Status:')
    console.log('========================')
    console.log(`Status: ${video.status}`)
    console.log(`Video URL: ${video.video_url ? '✅ Set' : '❌ Not set'}`)
    console.log(`Suno CDN URL: ${video.suno_video_url ? '✅ Set' : '❌ Not set'}`)
    console.log(`Storage Path: ${video.storage_path || 'N/A'}`)
    
    if (video.status === 'completed' && (video.video_url || video.suno_video_url)) {
      console.log('')
      console.log('🎉 Video recovered successfully!')
      console.log('The video should now appear in your UI.')
    } else {
      console.log('')
      console.log('⚠️  Video may need additional processing.')
    }
    
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

recoverVideo().catch(console.error)
