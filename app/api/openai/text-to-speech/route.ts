import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateSpeech, isValidVoice } from '@/lib/openai/text-to-speech'
import { buildOpenAIInstructions } from '@/lib/utils/openai-voice-instructions-builder'
import { enhanceVoiceInstructions, shouldEnhanceInstructions } from '@/lib/openai/enhance-voice-instructions'

// Request validation schema for OpenAI TTS
const textToSpeechSchema = z.object({
  text: z.string().min(1).max(4096),
  voice: z.string().min(1),
  instructions: z.string().optional(),
  response_format: z.enum(['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm']).optional().default('mp3'),
  enhance_instructions: z.boolean().optional().default(false),
  // Voice parameters for instruction building
  voice_parameters: z.object({
    gender: z.string().optional(),
    age: z.string().optional(),
    accent: z.string().optional(),
    tone: z.string().optional(),
    pitch: z.number().min(0).max(100).optional(),
    pacing: z.string().optional(),
    mood: z.string().optional(),
    emotionalWeight: z.number().min(0).max(100).optional(),
    role: z.string().optional(),
    style: z.string().optional(),
    useCase: z.string().optional(),
    language: z.string().optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json()
    const validatedData = textToSpeechSchema.parse(body)

    // Validate voice
    if (!isValidVoice(validatedData.voice)) {
      return NextResponse.json(
        { error: 'Invalid voice. Must be one of: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse' }, 
        { status: 400 }
      )
    }

    // Build instructions from parameters if provided
    let instructions = validatedData.instructions
    if (!instructions && validatedData.voice_parameters) {
      if (validatedData.enhance_instructions && shouldEnhanceInstructions(validatedData.voice_parameters)) {
        instructions = await enhanceVoiceInstructions(validatedData.voice_parameters)
      } else {
        instructions = buildOpenAIInstructions(validatedData.voice_parameters)
      }
    }

    console.log('🎤 [OpenAI TTS API] Request:', {
      voice: validatedData.voice,
      textLength: validatedData.text.length,
      hasInstructions: !!instructions,
      responseFormat: validatedData.response_format
    })

    // Generate speech
    const result = await generateSpeech({
      text: validatedData.text,
      voice: validatedData.voice,
      instructions,
      response_format: validatedData.response_format
    })

    if (!result.success) {
      console.error('❌ [OpenAI TTS API] Generation failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Speech generation failed' }, 
        { status: 500 }
      )
    }

    console.log('✅ [OpenAI TTS API] Speech generated successfully:', {
      voice: validatedData.voice,
      audioSize: result.audioBuffer?.length,
      processingTime: result.metadata?.processingTime
    })

    // Return the audio data
    return new NextResponse(result.audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': getContentType(validatedData.response_format),
        'Content-Length': result.audioBuffer!.length.toString(),
        'Cache-Control': 'no-cache',
        'X-Voice': validatedData.voice,
        'X-Processing-Time': result.metadata?.processingTime?.toString() || '0'
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [OpenAI TTS API] Validation error:', error.errors)
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors }, 
        { status: 400 }
      )
    }

    console.error('❌ [OpenAI TTS API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

/**
 * Get content type based on response format
 */
function getContentType(format: string): string {
  const contentTypes: Record<string, string> = {
    'mp3': 'audio/mpeg',
    'opus': 'audio/opus',
    'aac': 'audio/aac',
    'flac': 'audio/flac',
    'wav': 'audio/wav',
    'pcm': 'audio/pcm'
  }
  
  return contentTypes[format] || 'audio/mpeg'
}
