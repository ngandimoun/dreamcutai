import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Verify this is called from a legitimate source (Vercel Cron or similar)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    
    // Find music jingles that have been processing for > 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    
    const { data: staleGenerations, error } = await supabase
      .from('music_jingles')
      .select('*')
      .eq('status', 'processing')
      .lt('created_at', twoMinutesAgo)
      .is('callback_received_at', null)
      .limit(10) // Process in batches
    
    if (error) throw error
    
    console.log(`[CRON] Found ${staleGenerations?.length || 0} stale generations`)
    
    const results = []
    
    for (const music of staleGenerations || []) {
      try {
        // Poll the Suno API
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/suno/poll/${music.suno_task_id}`
        )
        const data = await response.json()
        
        results.push({
          id: music.id,
          taskId: music.suno_task_id,
          status: data.status,
          success: response.ok
        })
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`[CRON] Error polling ${music.suno_task_id}:`, error)
        results.push({
          id: music.id,
          taskId: music.suno_task_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      message: 'Fallback polling completed',
      processed: results.length,
      results
    })
  } catch (error) {
    console.error('[CRON] Fallback polling error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}




