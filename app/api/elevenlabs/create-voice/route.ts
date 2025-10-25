import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createVoiceInElevenLabs, type CreateVoiceRequest } from '@/lib/utils/elevenlabs'

// Request validation schema - matches ElevenLabs Create Voice API specification
const createVoiceSchema = z.object({
  voice_name: z.string().min(1).max(255),
  voice_description: z.string().min(20).max(1000),
  generated_voice_id: z.string().min(1),
  labels: z.record(z.string(), z.string().nullable()).optional(),
  played_not_selected_voice_ids: z.array(z.string()).optional()
})

export async function POST(request: NextRequest) {
  try {
    console.log('🎤 [CREATE VOICE API] Request received')
    
    // Validate request body
    const body = await request.json()
    console.log('📝 [CREATE VOICE API] Request body:', JSON.stringify(body, null, 2))
    
    const validatedData = createVoiceSchema.parse(body)
    console.log('✅ [CREATE VOICE API] Validation passed')

    // Call the shared ElevenLabs utility function
    const result = await createVoiceInElevenLabs(validatedData as CreateVoiceRequest)

    if (!result.success) {
      console.error('❌ [CREATE VOICE API] ElevenLabs utility failed:', result.error)
      return NextResponse.json(
        result.error, 
        { status: result.error.status || 500 }
      )
    }

    console.log('✅ [CREATE VOICE API] Success:', { 
      voice_id: result.data.voice_id,
      name: result.data.name,
      preview_url: result.data.preview_url ? 'YES' : 'NO'
    })

    // Return the voice creation result
    return NextResponse.json(result.data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [CREATE VOICE API] Validation error:', error.errors)
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors }, 
        { status: 400 }
      )
    }

    console.error('❌ [CREATE VOICE API] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
