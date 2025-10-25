#!/usr/bin/env node

/**
 * Test script to verify the recovery system works
 * This script tests the recovery logic without actually running it
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_KEY)
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testRecoverySystem() {
  console.log('🧪 Testing batch recovery system...')
  console.log('📅 Timestamp:', new Date().toISOString())
  console.log('')

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('🔍 Test 1: Supabase connection...')
    const { data: testData, error: testError } = await supabase
      .from('music_jingles')
      .select('id, status, suno_task_id')
      .limit(1)

    if (testError) {
      throw new Error(`Supabase connection failed: ${testError.message}`)
    }
    console.log('✅ Supabase connection successful')

    // Test 2: Check for processing music jingles
    console.log('')
    console.log('🔍 Test 2: Finding processing music jingles...')
    const { data: processingItems, error: fetchError } = await supabase
      .from('music_jingles')
      .select('id, title, status, suno_task_id, created_at')
      .eq('status', 'processing')
      .not('suno_task_id', 'is', null)

    if (fetchError) {
      throw new Error(`Failed to fetch processing items: ${fetchError.message}`)
    }

    console.log(`📊 Found ${processingItems.length} processing music jingles:`)
    processingItems.forEach((item, index) => {
      const createdAt = new Date(item.created_at)
      const minutesAgo = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60))
      console.log(`   ${index + 1}. ${item.title} (${item.suno_task_id}) - ${minutesAgo} minutes ago`)
    })

    // Test 3: Check environment variables
    console.log('')
    console.log('🔍 Test 3: Environment variables...')
    const sunoApiKey = process.env.SUNO_API_KEY
    console.log(`   SUNO_API_KEY: ${sunoApiKey ? '✅ Set' : '❌ Missing'}`)
    console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL ? '✅ Set' : '❌ Missing'}`)
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing'}`)

    // Test 4: Check if recovery script exists
    console.log('')
    console.log('🔍 Test 4: Recovery script availability...')
    const fs = require('fs')
    const path = require('path')
    const scriptPath = path.join(__dirname, 'recover-stuck-music.js')
    
    if (fs.existsSync(scriptPath)) {
      console.log('✅ Recovery script found at:', scriptPath)
    } else {
      console.log('❌ Recovery script not found at:', scriptPath)
    }

    // Summary
    console.log('')
    console.log('📊 TEST SUMMARY')
    console.log('===============')
    console.log(`✅ Supabase connection: Working`)
    console.log(`📋 Processing items: ${processingItems.length} found`)
    console.log(`🔑 Environment: ${sunoApiKey ? 'Ready' : 'Missing SUNO_API_KEY'}`)
    console.log(`📜 Recovery script: ${fs.existsSync(scriptPath) ? 'Available' : 'Missing'}`)
    
    if (processingItems.length > 0 && sunoApiKey) {
      console.log('')
      console.log('🎉 System is ready for recovery!')
      console.log('💡 Run: node scripts/recover-stuck-music.js')
    } else if (processingItems.length === 0) {
      console.log('')
      console.log('ℹ️ No stuck music generations found.')
    } else {
      console.log('')
      console.log('⚠️ System not ready - missing SUNO_API_KEY')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testRecoverySystem()
