#!/usr/bin/env tsx

/**
 * Find Duplicate Tracks Script
 * 
 * This script identifies duplicate music track records and tracks that need backfilling.
 * 
 * Usage:
 *   npm run find-duplicates
 *   npm run find-duplicates -- --task-id="05163570bdbf53ae457120ac916b76d8"
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Parse command line arguments
const args = process.argv.slice(2)
const taskIdArg = args.find(arg => arg.startsWith('--task-id='))
const specificTaskId = taskIdArg ? taskIdArg.split('=')[1] : null

console.log('🔍 Finding Duplicate Tracks and Missing Audio IDs')
console.log('================================================')
console.log(`Specific Task ID: ${specificTaskId || 'All tasks'}`)
console.log('')

async function findDuplicates() {
  try {
    // Step 1: Find all completed tracks with suno_task_id
    console.log('📋 Fetching all completed music tracks...')
    
    let query = supabase
      .from('music_jingles')
      .select('id, title, suno_task_id, suno_audio_id, created_at, status, user_id')
      .eq('status', 'completed')
      .not('suno_task_id', 'is', null)
      .order('suno_task_id', { ascending: true })
      .order('created_at', { ascending: true })
    
    if (specificTaskId) {
      query = query.eq('suno_task_id', specificTaskId)
    }
    
    const { data: allTracks, error } = await query
    
    if (error) {
      throw new Error(`Failed to fetch tracks: ${error.message}`)
    }
    
    if (!allTracks || allTracks.length === 0) {
      console.log('✅ No completed tracks found.')
      return
    }
    
    console.log(`Found ${allTracks.length} completed tracks`)
    console.log('')
    
    // Step 2: Group by suno_task_id to find duplicates
    const tracksByTaskId = new Map<string, typeof allTracks>()
    
    for (const track of allTracks) {
      if (!tracksByTaskId.has(track.suno_task_id)) {
        tracksByTaskId.set(track.suno_task_id, [])
      }
      tracksByTaskId.get(track.suno_task_id)!.push(track)
    }
    
    // Step 3: Analyze duplicates and missing audio IDs
    const duplicates = new Map<string, typeof allTracks>()
    const missingAudioIds = new Map<string, typeof allTracks>()
    const completeTracks = new Map<string, typeof allTracks>()
    
    for (const [taskId, tracks] of tracksByTaskId) {
      if (tracks.length > 1) {
        duplicates.set(taskId, tracks)
      }
      
      const tracksWithoutAudioId = tracks.filter(t => !t.suno_audio_id)
      const tracksWithAudioId = tracks.filter(t => t.suno_audio_id)
      
      if (tracksWithoutAudioId.length > 0) {
        missingAudioIds.set(taskId, tracksWithoutAudioId)
      }
      
      if (tracksWithAudioId.length > 0) {
        completeTracks.set(taskId, tracksWithAudioId)
      }
    }
    
    // Step 4: Report findings
    console.log('📊 Analysis Results')
    console.log('==================')
    console.log(`Total unique Suno tasks: ${tracksByTaskId.size}`)
    console.log(`Tasks with duplicates: ${duplicates.size}`)
    console.log(`Tasks missing audio IDs: ${missingAudioIds.size}`)
    console.log(`Tasks with complete audio IDs: ${completeTracks.size}`)
    console.log('')
    
    // Report duplicates
    if (duplicates.size > 0) {
      console.log('🔄 DUPLICATE TRACKS (same suno_task_id):')
      console.log('========================================')
      
      for (const [taskId, tracks] of duplicates) {
        console.log(`\n📀 Task ID: ${taskId}`)
        console.log(`   Found ${tracks.length} database records:`)
        
        tracks.forEach((track, index) => {
          const hasAudioId = track.suno_audio_id ? '✅' : '❌'
          console.log(`   ${index + 1}. ${track.title} (${track.id})`)
          console.log(`      Created: ${new Date(track.created_at).toISOString()}`)
          console.log(`      Audio ID: ${hasAudioId} ${track.suno_audio_id || 'MISSING'}`)
        })
      }
      console.log('')
    }
    
    // Report missing audio IDs
    if (missingAudioIds.size > 0) {
      console.log('❌ TRACKS MISSING AUDIO IDs:')
      console.log('============================')
      
      for (const [taskId, tracks] of missingAudioIds) {
        console.log(`\n📀 Task ID: ${taskId}`)
        
        tracks.forEach((track, index) => {
          console.log(`   ${index + 1}. ${track.title} (${track.id})`)
          console.log(`      Created: ${new Date(track.created_at).toISOString()}`)
          console.log(`      Status: ${track.status}`)
        })
      }
      console.log('')
    }
    
    // Report complete tracks
    if (completeTracks.size > 0) {
      console.log('✅ TRACKS WITH COMPLETE AUDIO IDs:')
      console.log('==================================')
      
      for (const [taskId, tracks] of completeTracks) {
        console.log(`\n📀 Task ID: ${taskId}`)
        
        tracks.forEach((track, index) => {
          console.log(`   ${index + 1}. ${track.title} (${track.id})`)
          console.log(`      Audio ID: ${track.suno_audio_id}`)
          console.log(`      Created: ${new Date(track.created_at).toISOString()}`)
        })
      }
      console.log('')
    }
    
    // Step 5: Specific analysis for the problematic track
    const problematicTaskId = '05163570bdbf53ae457120ac916b76d8'
    const problematicRecordId = '6639a5ba-0161-44da-8323-37c0a9e9a320'
    
    console.log('🎯 ANALYSIS FOR PROBLEMATIC TRACK:')
    console.log('==================================')
    console.log(`Task ID: ${problematicTaskId}`)
    console.log(`Record ID: ${problematicRecordId}`)
    
    const problematicTracks = allTracks.filter(t => 
      t.suno_task_id === problematicTaskId || t.id === problematicRecordId
    )
    
    if (problematicTracks.length > 0) {
      console.log(`\nFound ${problematicTracks.length} related records:`)
      problematicTracks.forEach((track, index) => {
        const isTarget = track.id === problematicRecordId ? '🎯' : '  '
        const hasAudioId = track.suno_audio_id ? '✅' : '❌'
        console.log(`${isTarget} ${index + 1}. ${track.title} (${track.id})`)
        console.log(`     Created: ${new Date(track.created_at).toISOString()}`)
        console.log(`     Audio ID: ${hasAudioId} ${track.suno_audio_id || 'MISSING'}`)
        console.log(`     Task ID: ${track.suno_task_id}`)
      })
    } else {
      console.log('❌ No records found for the problematic track!')
    }
    
    console.log('')
    console.log('📋 RECOMMENDED ACTIONS:')
    console.log('=======================')
    
    if (missingAudioIds.size > 0) {
      const totalMissing = Array.from(missingAudioIds.values()).flat().length
      console.log(`1. Run backfill for ${totalMissing} tracks missing audio IDs:`)
      const missingIds = Array.from(missingAudioIds.values()).flat().map(t => t.id)
      console.log(`   npm run backfill:audio-ids -- --ids="${missingIds.join(',')}"`)
    }
    
    if (duplicates.size > 0) {
      console.log(`2. Consider cleaning up ${duplicates.size} duplicate tasks`)
    }
    
    console.log('3. Test music video generation with backfilled tracks')
    
  } catch (error) {
    console.error('💥 Error:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  findDuplicates().catch(console.error)
}




