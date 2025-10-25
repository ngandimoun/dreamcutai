#!/usr/bin/env tsx

/**
 * Backfill Script for Music Jingles Data
 * 
 * This script fetches existing music jingle records and populates them with
 * rich data from Suno API (cover images, duration, tags, model info).
 * 
 * Usage:
 *   npm run backfill:music -- --dry-run
 *   npm run backfill:music
 *   npm run backfill:music -- --ids "id1,id2,id3"
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

// Configuration
const BATCH_SIZE = 10
const RATE_LIMIT_DELAY = 1000 // 1 second between API calls

// Suno client will be initialized when needed

// Types
interface MusicJingle {
  id: string
  suno_task_id: string
  title: string
  status: string
  image_url?: string
  tags?: string
  model_name?: string
  actual_duration?: number
}

// Suno API response types
interface SunoTaskStatus {
  taskId: string
  status: 'GENERATING' | 'SUCCESS' | 'FAILED' | 'PENDING'
  response?: {
    sunoData: SunoAudioData[]
  }
  errorMessage?: string
}

interface SunoAudioData {
  id: string
  audioUrl: string
  imageUrl?: string
  prompt: string
  modelName: string
  title: string
  tags: string
  createTime: number
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
const idsArg = args.find(arg => arg.startsWith('--ids='))
const specificIds = idsArg ? idsArg.split('=')[1].split(',').map(id => id.trim()) : null

console.log('🎵 Music Jingles Data Backfill Script')
console.log('=====================================')
console.log(`Mode: ${isDryRun ? 'DRY RUN (no updates)' : 'LIVE (will update database)'}`)
console.log(`Specific IDs: ${specificIds ? specificIds.join(', ') : 'All records'}`)
console.log('')

// Main function
async function main() {
  try {
    // Step 1: Fetch music jingles that need backfilling
    console.log('📋 Fetching music jingles...')
    const musicJingles = await fetchMusicJingles()
    
    if (musicJingles.length === 0) {
      console.log('✅ No music jingles found that need backfilling.')
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
            console.log(`  ✅ Updated: ${jingle.title}`)
          } else if (result === 'skipped') {
            results.skipped++
            console.log(`  ⏭️  Skipped: ${jingle.title} (already has data)`)
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
    .select('id, suno_task_id, title, status, image_url, tags, model_name, actual_duration')
    .eq('status', 'completed')
    .not('suno_task_id', 'is', null)
  
  // Filter by specific IDs if provided
  if (specificIds) {
    query = query.in('id', specificIds)
  }
  
  const { data, error } = await query
  
  if (error) {
    throw new Error(`Failed to fetch music jingles: ${error.message}`)
  }
  
  // Filter out records that already have all the data we need
  return (data || []).filter(jingle => 
    !jingle.image_url || !jingle.tags || !jingle.model_name || !jingle.actual_duration
  )
}

// Process a single music jingle
async function processMusicJingle(jingle: MusicJingle, isDryRun: boolean): Promise<'updated' | 'skipped'> {
  // Skip if already has all data
  if (jingle.image_url && jingle.tags && jingle.model_name && jingle.actual_duration) {
    return 'skipped'
  }
  
  // Fetch data from Suno API
  const sunoData = await fetchSunoData(jingle.suno_task_id)
  
  if (!sunoData) {
    throw new Error('No data returned from Suno API')
  }
  
  // Check if task was successful
  if (sunoData.status !== 'SUCCESS') {
    throw new Error(`Suno task not successful: ${sunoData.status}`)
  }
  
  // Extract the first audio track data
  const audioData = sunoData.response?.sunoData?.[0]
  if (!audioData) {
    throw new Error('No audio data found in Suno response')
  }
  
  // Prepare update data
  const updateData: Partial<MusicJingle> = {}
  
  if (!jingle.image_url && audioData.imageUrl) {
    updateData.image_url = audioData.imageUrl
  }
  
  if (!jingle.tags && audioData.tags) {
    updateData.tags = audioData.tags
  }
  
  if (!jingle.model_name && audioData.modelName) {
    updateData.model_name = audioData.modelName
  }
  
  if (!jingle.actual_duration && audioData.duration) {
    updateData.actual_duration = audioData.duration
  }
  
  // Skip if no updates needed
  if (Object.keys(updateData).length === 0) {
    return 'skipped'
  }
  
  // Update database (unless dry run)
  if (!isDryRun) {
    const { error } = await supabase
      .from('music_jingles')
      .update(updateData)
      .eq('id', jingle.id)
    
    if (error) {
      throw new Error(`Database update failed: ${error.message}`)
    }
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
