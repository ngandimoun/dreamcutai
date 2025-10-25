#!/usr/bin/env tsx

/**
 * Backfill Script for Suno Audio IDs
 * 
 * This script fetches completed music jingles without suno_audio_id
 * and populates them by querying the Suno API.
 * 
 * Usage:
 *   npm run backfill:audio-ids -- --dry-run
 *   npm run backfill:audio-ids
 *   npm run backfill:audio-ids -- --ids "id1,id2,id3"
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

// Configuration
const BATCH_SIZE = 10
const RATE_LIMIT_DELAY = 1000 // 1 second between API calls

// Types
interface MusicJingle {
  id: string
  suno_task_id: string
  title: string
  status: string
  suno_audio_id?: string
}

// Suno API response types
interface SunoTaskStatus {
  taskId: string
  status: 'GENERATING' | 'SUCCESS' | 'FAILED' | 'PENDING'
  response?: {
    data: SunoAudioData[]
  }
  errorMessage?: string
}

interface SunoAudioData {
  id: string
  audio_url: string
  source_audio_url?: string
  stream_audio_url?: string
  source_stream_audio_url?: string
  image_url?: string
  source_image_url?: string
  prompt: string
  model_name: string
  title: string
  tags: string
  createTime: string
  duration: number
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const isForce = args.includes('--force')
const idsArg = args.find(arg => arg.startsWith('--ids='))
const taskIdArg = args.find(arg => arg.startsWith('--task-id='))
const specificIds = idsArg ? idsArg.split('=')[1].split(',').map(id => id.trim()) : null
const specificTaskId = taskIdArg ? taskIdArg.split('=')[1] : null


console.log('🎵 Suno Audio IDs Backfill Script')
console.log('==================================')
console.log(`Mode: ${isDryRun ? 'DRY RUN (no updates)' : 'LIVE (will update database)'}`)
console.log(`Force re-backfill: ${isForce ? 'YES' : 'NO'}`)
console.log(`Specific IDs: ${specificIds ? specificIds.join(', ') : 'All records'}`)
console.log(`Specific Task ID: ${specificTaskId || 'All tasks'}`)
console.log('')

// Main function
async function main() {
  try {
    // Step 1: Fetch music jingles that need backfilling
    console.log('📋 Fetching music jingles without suno_audio_id...')
    const musicJingles = await fetchMusicJingles()
    
    if (musicJingles.length === 0) {
      console.log('✅ No music jingles found that need suno_audio_id backfilling.')
      return
    }
    
    console.log(`Found ${musicJingles.length} music jingles to process`)
    console.log('')
    
    // Step 2: Process in batches
    const results = {
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      errorsList: [] as string[]
    }
    
    for (let i = 0; i < musicJingles.length; i += BATCH_SIZE) {
      const batch = musicJingles.slice(i, i + BATCH_SIZE)
      console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(musicJingles.length / BATCH_SIZE)} (${batch.length} items)`)
      
      for (const jingle of batch) {
        try {
          const result = await processMusicJingle(jingle, isDryRun)
          results.processed++
          
          if (result === 'updated') {
            results.updated++
            console.log(`  ✅ Updated: ${jingle.title} (${jingle.id})`)
          } else if (result === 'skipped') {
            results.skipped++
            console.log(`  ⏭️  Skipped: ${jingle.title} (${result})`)
          }
          
          // Rate limiting
          if (i + batch.indexOf(jingle) < musicJingles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))
          }
        } catch (error) {
          results.errors++
          const errorMsg = `Failed to process ${jingle.title}: ${error instanceof Error ? error.message : 'Unknown error'}`
          results.errorsList.push(errorMsg)
          console.log(`  ❌ ${errorMsg}`)
        }
      }
      
      console.log('')
    }
    
    // Step 3: Report results
    console.log('📊 Backfill Results')
    console.log('==================')
    console.log(`Processed: ${results.processed}`)
    console.log(`Updated: ${results.updated}`)
    console.log(`Skipped: ${results.skipped}`)
    console.log(`Errors: ${results.errors}`)
    
    if (results.errorsList.length > 0) {
      console.log('')
      console.log('❌ Errors:')
      results.errorsList.forEach(error => console.log(`  - ${error}`))
    }
    
    if (isDryRun) {
      console.log('')
      console.log('🔍 This was a dry run. No database changes were made.')
      console.log('Run without --dry-run to apply updates.')
    } else {
      console.log('')
      console.log('✅ Backfill completed!')
      console.log('🎬 You can now use these tracks for music video generation.')
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  }
}

// Fetch music jingles that need backfilling
async function fetchMusicJingles(): Promise<MusicJingle[]> {
  let query = supabase
    .from('music_jingles')
    .select('id, suno_task_id, title, status, suno_audio_id')
    .eq('status', 'completed')
    .not('suno_task_id', 'is', null)
  
  // If not forcing, only get records without suno_audio_id
  if (!isForce) {
    query = query.is('suno_audio_id', null)
  }
  
  // Filter by specific IDs if provided
  if (specificIds) {
    query = query.in('id', specificIds)
  }
  
  // Filter by specific task ID if provided
  if (specificTaskId) {
    query = query.eq('suno_task_id', specificTaskId)
  }
  
  const { data, error } = await query
  
  if (error) {
    throw new Error(`Failed to fetch music jingles: ${error.message}`)
  }
  
  return data || []
}

// Process a single music jingle
async function processMusicJingle(jingle: MusicJingle, isDryRun: boolean): Promise<'updated' | 'skipped' | string> {
  console.log(`    🔍 Processing: ${jingle.title} (${jingle.id})`)
  console.log(`    📋 Task ID: ${jingle.suno_task_id}`)
  
  // Skip if already has suno_audio_id (shouldn't happen due to query filter, but safety check)
  if (jingle.suno_audio_id) {
    return 'already has suno_audio_id'
  }
  
  // Fetch data from Suno API
  console.log(`    🌐 Fetching from Suno API...`)
  const sunoData = await fetchSunoData(jingle.suno_task_id)
  
  if (!sunoData) {
    throw new Error('No data returned from Suno API')
  }
  
  console.log(`    📊 Suno status: ${sunoData.status}`)
  
  // Check if task was successful
  if (sunoData.status !== 'SUCCESS') {
    return `Suno task not successful: ${sunoData.status}`
  }
  
  // Extract the first audio track data
  // Suno API returns data in different structures - try both
  const audioData = sunoData.response?.data?.[0] || sunoData.response?.sunoData?.[0]
  if (!audioData) {
    console.log(`    ⚠️  No audio data in response:`, sunoData.response)
    return 'No audio data found in Suno response'
  }
  
  console.log(`    🎵 Found audio data:`, {
    id: audioData.id,
    title: audioData.title,
    duration: audioData.duration
  })
  
  if (!audioData.id) {
    return 'No audio ID found in Suno response'
  }
  
  // Update database (unless dry run)
  if (!isDryRun) {
    console.log(`    💾 Updating database with suno_audio_id: ${audioData.id}`)
    const { error } = await supabase
      .from('music_jingles')
      .update({
        suno_audio_id: audioData.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', jingle.id)
    
    if (error) {
      throw new Error(`Database update failed: ${error.message}`)
    }
  } else {
    console.log(`    🔍 [DRY RUN] Would update with suno_audio_id: ${audioData.id}`)
  }
  
  return 'updated'
}

// Fetch data from Suno API
async function fetchSunoData(taskId: string): Promise<SunoTaskStatus | null> {
  const apiKey = process.env.SUNO_API_KEY
  if (!apiKey) {
    throw new Error('SUNO_API_KEY environment variable not set')
  }
  
  const response = await fetch(`https://api.sunoapi.org/api/v1/generate/record-info?taskId=${taskId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Suno API request failed: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  
  if (data.code !== 200) {
    throw new Error(`Suno API error: ${data.msg}`)
  }
  
  return data.data
}

// Run the script
if (require.main === module) {
  main().catch(console.error)
}
