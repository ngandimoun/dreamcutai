#!/usr/bin/env node

/**
 * One-time recovery script for stuck Suno music generations
 * 
 * This script:
 * 1. Fetches all music_jingles records with status = 'processing'
 * 2. Checks each one against Suno API to see actual status
 * 3. Downloads and processes all successful completions
 * 4. Updates database records with results
 * 
 * Usage: node scripts/recover-stuck-music.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUNO_API_KEY = process.env.SUNO_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUNO_API_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_KEY)
  console.error('   SUNO_API_KEY:', !!SUNO_API_KEY)
  process.exit(1)
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Suno API client
class SunoApiClient {
  constructor() {
    this.baseUrl = 'https://api.sunoapi.org/api/v1'
    this.apiKey = SUNO_API_KEY
  }

  async getTaskStatus(taskId) {
    try {
      const response = await fetch(`${this.baseUrl}/generate/record-info?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`❌ Error checking task ${taskId}:`, error.message)
      throw error
    }
  }
}

// Audio download and storage utility
async function downloadAndStoreAudio(audioUrl, userId, taskId, index = 0) {
  try {
    console.log(`📥 Downloading audio from: ${audioUrl}`)
    
    // Download the audio file
    const response = await fetch(audioUrl)
    if (!response.ok) {
      throw new Error(`Failed to download audio: HTTP ${response.status}`)
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer())
    const fileName = `music-jingles/${userId}/${taskId}_${index}.mp3`
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('dreamcut')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      })

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('dreamcut')
      .getPublicUrl(fileName)

    console.log(`✅ Audio stored: ${fileName}`)
    
    return {
      fileName,
      url: urlData.publicUrl,
      path: fileName
    }
  } catch (error) {
    console.error(`❌ Failed to download/store audio:`, error.message)
    throw error
  }
}

// Main recovery function
async function recoverStuckMusic() {
  console.log('🔧 Starting recovery of stuck Suno music generations...')
  console.log('📅 Timestamp:', new Date().toISOString())
  console.log('')

  const sunoClient = new SunoApiClient()
  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    stillProcessing: 0,
    errors: []
  }

  try {
    // Step 1: Fetch all processing music jingles OR completed but no audio
    console.log('📋 Fetching stuck music jingles (processing or completed without audio)...')
    const { data: musicJingles, error: fetchError } = await supabase
      .from('music_jingles')
      .select('*')
      .or('status.eq.processing,and(status.eq.completed,audio_url.is.null)')
      .not('suno_task_id', 'is', null)

    if (fetchError) {
      throw new Error(`Failed to fetch music jingles: ${fetchError.message}`)
    }

    results.total = musicJingles.length
    console.log(`📊 Found ${results.total} processing music jingles`)
    console.log('')

    if (results.total === 0) {
      console.log('✅ No stuck music generations found!')
      return results
    }

    // Step 2: Check each one against Suno API
    for (let i = 0; i < musicJingles.length; i++) {
      const musicJingle = musicJingles[i]
      console.log(`🔍 [${i + 1}/${results.total}] Checking: ${musicJingle.title} (${musicJingle.suno_task_id})`)

      try {
        // Check status with Suno API
        const sunoStatus = await sunoClient.getTaskStatus(musicJingle.suno_task_id)
        console.log(`📊 Suno status: ${sunoStatus.data?.status || sunoStatus.status}`)
        console.log(`📊 Full API response:`, JSON.stringify(sunoStatus, null, 2))
        
        // Extract audio data from correct nested structure
        const audioData = sunoStatus.data?.response?.sunoData || []
        
        console.log(`📊 Audio data path check:`, {
          hasData: !!sunoStatus.data,
          hasResponse: !!sunoStatus.data?.response,
          hasSunoData: !!sunoStatus.data?.response?.sunoData,
          audioCount: audioData.length
        })

        const actualStatus = sunoStatus.data?.status || sunoStatus.status
        if (actualStatus === 'SUCCESS' && audioData.length > 0) {
          console.log(`🎉 Task completed successfully! Processing ${audioData.length} audio file(s)...`)
          
          // Process each generated audio track
          const audioResults = []
          for (let j = 0; j < audioData.length; j++) {
            const audio = audioData[j]
            console.log(`📀 Processing audio ${j + 1}: ${audio.title}`)

            try {
              const storedAudio = await downloadAndStoreAudio(
                audio.audioUrl || audio.audio_url,
                musicJingle.user_id,
                musicJingle.suno_task_id,
                j
              )

              audioResults.push({
                suno_audio_id: audio.id,
                title: audio.title,
                duration: audio.duration,
                tags: audio.tags,
                audio_url: storedAudio.url,
                storage_path: storedAudio.path,
                suno_audio_url: audio.audioUrl || audio.audio_url,
                image_url: audio.imageUrl || audio.image_url,
                prompt: audio.prompt,
                model_name: audio.modelName || audio.model_name,
                create_time: audio.createTime
              })

              console.log(`✅ Audio ${j + 1} processed successfully`)
            } catch (audioError) {
              console.error(`❌ Failed to process audio ${j + 1}:`, audioError.message)
              // Continue with other audio files
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
              throw new Error(`Database update failed: ${updateError.message}`)
            }

            console.log(`✅ Original music jingle updated with first audio`)

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
                  recovery_completed_at: new Date().toISOString(),
                  recovery_method: 'script'
                }
              }))
              
              const { error: insertError } = await supabase
                .from('music_jingles')
                .insert(additionalRows)

              if (insertError) {
                throw new Error(`Database insert failed: ${insertError.message}`)
              }

              console.log(`✅ Created ${additionalRows.length} additional music jingle rows`)
            }

            console.log(`✅ Music jingle processing completed - ${audioResults.length} audio files stored`)
            results.successful++
          } else {
            console.log(`⚠️ No audio files could be processed`)
            results.failed++
          }

        } else if (actualStatus === 'FAILED') {
          console.log(`❌ Task failed on Suno`)
          
          // Mark as failed
          const { error: updateError } = await supabase
            .from('music_jingles')
            .update({
              status: 'failed',
              callback_received_at: new Date().toISOString(),
              metadata: {
                ...musicJingle.metadata,
                recovery_checked_at: new Date().toISOString(),
                suno_status: 'FAILED',
                recovery_method: 'script'
              }
            })
            .eq('id', musicJingle.id)

          if (updateError) {
            console.error(`❌ Failed to update failed status:`, updateError.message)
          } else {
            console.log(`✅ Marked as failed`)
          }
          
          results.failed++

        } else if (actualStatus === 'GENERATING' || actualStatus === 'PENDING') {
          console.log(`⏳ Task still processing on Suno`)
          results.stillProcessing++

        } else {
          console.log(`❓ Unknown status: ${actualStatus}`)
          results.failed++
        }

      } catch (error) {
        console.error(`❌ Error processing ${musicJingle.suno_task_id}:`, error.message)
        results.errors.push({
          taskId: musicJingle.suno_task_id,
          error: error.message
        })
        results.failed++
      }

      console.log('') // Empty line for readability
      
      // Add small delay to avoid rate limiting
      if (i < musicJingles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

  } catch (error) {
    console.error('❌ Recovery script failed:', error.message)
    throw error
  }

  return results
}

// Run the recovery
async function main() {
  try {
    const results = await recoverStuckMusic()
    
    console.log('')
    console.log('📊 RECOVERY SUMMARY')
    console.log('==================')
    console.log(`Total processed: ${results.total}`)
    console.log(`✅ Successful: ${results.successful}`)
    console.log(`❌ Failed: ${results.failed}`)
    console.log(`⏳ Still processing: ${results.stillProcessing}`)
    
    if (results.errors.length > 0) {
      console.log('')
      console.log('❌ ERRORS:')
      results.errors.forEach(error => {
        console.log(`   ${error.taskId}: ${error.error}`)
      })
    }
    
    console.log('')
    if (results.successful > 0) {
      console.log('🎉 Recovery completed! Check your music library for the recovered songs.')
    } else {
      console.log('ℹ️ No songs were recovered. All items are either still processing or failed.')
    }
    
  } catch (error) {
    console.error('💥 Recovery script crashed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { recoverStuckMusic }
