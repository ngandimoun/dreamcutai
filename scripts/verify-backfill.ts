#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyBackfill() {
  console.log('🔍 Verifying Suno Audio ID Backfill')
  console.log('===================================')
  
  const { data, error } = await supabase
    .from('music_jingles')
    .select('id, title, suno_task_id, suno_audio_id, status')
    .eq('status', 'completed')
    .not('suno_task_id', 'is', null)
    
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log(`📊 Found ${data?.length} completed music tracks`)
  console.log('')
  
  const tracksWithAudioId = data?.filter(t => t.suno_audio_id) || []
  const tracksWithoutAudioId = data?.filter(t => !t.suno_audio_id) || []
  
  console.log('✅ Tracks WITH suno_audio_id (ready for video generation):')
  console.log('=========================================================')
  tracksWithAudioId.forEach(track => {
    console.log(`🎵 ${track.title}`)
    console.log(`   Database ID: ${track.id}`)
    console.log(`   Suno Task ID: ${track.suno_task_id}`)
    console.log(`   Suno Audio ID: ${track.suno_audio_id}`)
    console.log('')
  })
  
  if (tracksWithoutAudioId.length > 0) {
    console.log('⚠️  Tracks WITHOUT suno_audio_id (need backfill):')
    console.log('================================================')
    tracksWithoutAudioId.forEach(track => {
      console.log(`🎵 ${track.title}`)
      console.log(`   Database ID: ${track.id}`)
      console.log(`   Suno Task ID: ${track.suno_task_id}`)
      console.log('')
    })
  }
  
  console.log('📈 Summary:')
  console.log('===========')
  console.log(`✅ Ready for video generation: ${tracksWithAudioId.length}`)
  console.log(`⚠️  Need backfill: ${tracksWithoutAudioId.length}`)
  console.log(`📊 Total completed tracks: ${data?.length}`)
  
  if (tracksWithAudioId.length > 0) {
    console.log('')
    console.log('🎬 You can now generate music videos with these tracks!')
    console.log('   The "Record does not exist 400" error should be resolved.')
  }
}

verifyBackfill().catch(console.error)




