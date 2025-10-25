import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sunoClient } from '@/lib/suno/client'
import { SunoApiError } from '@/lib/suno/types'

// Cache for 30 seconds
export const revalidate = 30

// Validation schema for lyrics generation
const generateLyricsSchema = z.object({
  prompt: z.string().min(1).max(2000), // Allow more characters for word counting
})

// Word counting utility
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎵 [LYRICS API] Lyrics generation API called')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const validatedData = generateLyricsSchema.parse(body)

    console.log('📝 [LYRICS API] Validated data:', {
      prompt: validatedData.prompt.substring(0, 100) + '...',
      wordCount: countWords(validatedData.prompt)
    })

    // Validate word limit (200 words max)
    const wordCount = countWords(validatedData.prompt)
    if (wordCount > 200) {
      return NextResponse.json({ 
        error: `Prompt exceeds 200 word limit (${wordCount}/200 words)` 
      }, { status: 400 })
    }

    // Generate callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const callbackUrl = `${baseUrl}/api/suno/callback`

    // Call Suno lyrics generation API
    console.log('🎵 [LYRICS API] Calling Suno lyrics generation endpoint...')
    const sunoTaskId = await sunoClient.generateLyrics({
      prompt: validatedData.prompt,
      callBackUrl: callbackUrl
    })

    console.log('✅ [LYRICS API] Suno task created:', sunoTaskId)

    // Save task to database with pending status
    const { data: lyricsGeneration, error } = await supabase
      .from('lyrics_generations')
      .insert({
        user_id: user.id,
        prompt: validatedData.prompt,
        suno_task_id: sunoTaskId,
        status: 'pending',
        metadata: {
          generation_timestamp: new Date().toISOString(),
          suno_task_id: sunoTaskId,
          callback_url: callbackUrl,
          word_count: wordCount,
          generated_via: 'suno-api-integration'
        }
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [LYRICS API] Error creating lyrics generation:', error)
      return NextResponse.json({ error: 'Failed to create lyrics generation' }, { status: 500 })
    }

    console.log('✅ [LYRICS API] Lyrics generation saved:', lyricsGeneration.id)

    return NextResponse.json({ 
      message: 'Lyrics generation started successfully', 
      lyricsGeneration: {
        id: lyricsGeneration.id,
        suno_task_id: sunoTaskId,
        status: 'pending',
        wordCount: wordCount
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [LYRICS API] Validation error:', error.errors)
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    
    if (error instanceof SunoApiError) {
      console.error('❌ [LYRICS API] Suno API error:', error.message, error.code)
      return NextResponse.json({ 
        error: 'Suno API error', 
        details: error.message,
        code: error.code
      }, { status: 500 })
    }
    
    console.error('❌ [LYRICS API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🎵 [LYRICS API] Get lyrics generations called')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's lyrics generations
    const { data: lyricsGenerations, error } = await supabase
      .from('lyrics_generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('❌ [LYRICS API] Error fetching lyrics generations:', error)
      return NextResponse.json({ error: 'Failed to fetch lyrics generations' }, { status: 500 })
    }

    return NextResponse.json({ 
      lyricsGenerations: lyricsGenerations || []
    })

  } catch (error) {
    console.error('❌ [LYRICS API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
