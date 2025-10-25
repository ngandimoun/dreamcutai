import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sunoClient } from '@/lib/suno/client'
import { SunoApiError } from '@/lib/suno/types'

// Cache for 10 seconds
export const revalidate = 10

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params
    console.log('🎵 [LYRICS STATUS API] Getting lyrics status for task:', taskId)
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get lyrics generation from database
    const { data: lyricsGeneration, error: dbError } = await supabase
      .from('lyrics_generations')
      .select('*')
      .eq('suno_task_id', taskId)
      .eq('user_id', user.id)
      .single()

    if (dbError || !lyricsGeneration) {
      console.error('❌ [LYRICS STATUS API] Lyrics generation not found:', dbError)
      return NextResponse.json({ error: 'Lyrics generation not found' }, { status: 404 })
    }

    // If already completed, return cached result
    if (lyricsGeneration.status === 'completed') {
      return NextResponse.json({
        taskId,
        status: 'completed',
        lyricsGeneration: {
          id: lyricsGeneration.id,
          prompt: lyricsGeneration.prompt,
          title: lyricsGeneration.title,
          lyrics_text: lyricsGeneration.lyrics_text,
          status: lyricsGeneration.status,
          created_at: lyricsGeneration.created_at,
          updated_at: lyricsGeneration.updated_at
        }
      })
    }

    // If failed, return error
    if (lyricsGeneration.status === 'failed') {
      return NextResponse.json({
        taskId,
        status: 'failed',
        error: 'Lyrics generation failed',
        lyricsGeneration: {
          id: lyricsGeneration.id,
          prompt: lyricsGeneration.prompt,
          status: lyricsGeneration.status,
          created_at: lyricsGeneration.created_at,
          updated_at: lyricsGeneration.updated_at
        }
      })
    }

    // Poll Suno API for current status
    console.log('🔄 [LYRICS STATUS API] Polling Suno API for status...')
    const sunoStatus = await sunoClient.getLyricsStatus(taskId)

    console.log('📊 [LYRICS STATUS API] Suno status:', {
      taskId: sunoStatus.taskId,
      status: sunoStatus.status,
      hasResponse: !!sunoStatus.response
    })

    // Update database based on Suno status
    let updateData: any = {
      status: sunoStatus.status === 'SUCCESS' ? 'completed' : 
              sunoStatus.status === 'PENDING' ? 'generating' : 'failed',
      updated_at: new Date().toISOString()
    }

    // If completed, save lyrics data
    if (sunoStatus.status === 'SUCCESS' && sunoStatus.response?.data) {
      const lyricsData = sunoStatus.response.data
      if (lyricsData.length > 0) {
        // Use the first successful lyrics result
        const firstLyrics = lyricsData.find(l => l.status === 'complete')
        if (firstLyrics) {
          updateData.lyrics_text = firstLyrics.text
          updateData.title = firstLyrics.title
        }
      }
    }

    // Update database
    const { error: updateError } = await supabase
      .from('lyrics_generations')
      .update(updateData)
      .eq('suno_task_id', taskId)

    if (updateError) {
      console.error('❌ [LYRICS STATUS API] Error updating lyrics generation:', updateError)
    }

    return NextResponse.json({
      taskId,
      status: updateData.status,
      lyricsGeneration: {
        id: lyricsGeneration.id,
        prompt: lyricsGeneration.prompt,
        title: updateData.title || lyricsGeneration.title,
        lyrics_text: updateData.lyrics_text || lyricsGeneration.lyrics_text,
        status: updateData.status,
        created_at: lyricsGeneration.created_at,
        updated_at: updateData.updated_at
      }
    })

  } catch (error) {
    if (error instanceof SunoApiError) {
      console.error('❌ [LYRICS STATUS API] Suno API error:', error.message, error.code)
      return NextResponse.json({ 
        error: 'Suno API error', 
        details: error.message,
        code: error.code
      }, { status: 500 })
    }
    
    console.error('❌ [LYRICS STATUS API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
