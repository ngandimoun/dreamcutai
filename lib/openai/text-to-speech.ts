/**
 * OpenAI Text-to-Speech Service
 * 
 * Handles voiceover generation using OpenAI's GPT-4o-mini-TTS model.
 * Provides a clean interface for TTS generation with voice selection and instructions.
 */

import OpenAI from 'openai'

// Only initialize OpenAI client on server-side
function getOpenAIClient() {
  if (typeof window !== 'undefined') {
    throw new Error('OpenAI client can only be used on the server-side')
  }
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }
  
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface OpenAIVoice {
  id: string
  name: string
  description: string
}

export const OPENAI_VOICES: OpenAIVoice[] = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice' },
  { id: 'ash', name: 'Ash', description: 'Clear, articulate voice' },
  { id: 'ballad', name: 'Ballad', description: 'Warm, smooth voice' },
  { id: 'coral', name: 'Coral', description: 'Bright, friendly voice' },
  { id: 'echo', name: 'Echo', description: 'Deep, resonant voice' },
  { id: 'fable', name: 'Fable', description: 'Expressive, storytelling voice' },
  { id: 'nova', name: 'Nova', description: 'Energetic, dynamic voice' },
  { id: 'onyx', name: 'Onyx', description: 'Strong, authoritative voice' },
  { id: 'sage', name: 'Sage', description: 'Wise, calm voice' },
  { id: 'shimmer', name: 'Shimmer', description: 'Light, airy voice' },
  { id: 'verse', name: 'Verse', description: 'Versatile, adaptable voice' }
]

export interface TTSRequest {
  text: string
  voice: string
  instructions?: string
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm'
}

export interface TTSResponse {
  success: boolean
  audioBuffer?: Buffer
  error?: string
  metadata?: {
    voice: string
    textLength: number
    responseFormat: string
    processingTime: number
  }
}

/**
 * Generate speech using OpenAI's GPT-4o-mini-TTS model
 */
export async function generateSpeech(request: TTSRequest): Promise<TTSResponse> {
  const startTime = Date.now()
  
  try {
    // Get OpenAI client (server-side only)
    const openai = getOpenAIClient()

    // Validate voice
    const validVoice = OPENAI_VOICES.find(v => v.id === request.voice)
    if (!validVoice) {
      throw new Error(`Invalid voice: ${request.voice}. Must be one of: ${OPENAI_VOICES.map(v => v.id).join(', ')}`)
    }

    // Validate text length (OpenAI has a 4096 character limit)
    if (request.text.length > 4096) {
      throw new Error('Text too long. Maximum 4096 characters allowed.')
    }

    if (request.text.length === 0) {
      throw new Error('Text cannot be empty')
    }

    console.log('🎤 [OpenAI TTS] Generating speech:', {
      voice: request.voice,
      textLength: request.text.length,
      hasInstructions: !!request.instructions,
      responseFormat: request.response_format || 'mp3'
    })

    // Prepare OpenAI request
    const openaiRequest: any = {
      model: 'gpt-4o-mini-tts',
      voice: request.voice,
      input: request.text,
      response_format: request.response_format || 'mp3'
    }

    // Add instructions if provided
    if (request.instructions && request.instructions.trim()) {
      openaiRequest.instructions = request.instructions.trim()
    }

    // Call OpenAI API
    const response = await openai.audio.speech.create(openaiRequest)

    // Convert response to buffer
    const audioBuffer = Buffer.from(await response.arrayBuffer())
    
    const processingTime = Date.now() - startTime

    console.log('✅ [OpenAI TTS] Speech generated successfully:', {
      voice: request.voice,
      audioSize: audioBuffer.length,
      processingTime: `${processingTime}ms`
    })

    return {
      success: true,
      audioBuffer,
      metadata: {
        voice: request.voice,
        textLength: request.text.length,
        responseFormat: request.response_format || 'mp3',
        processingTime
      }
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('❌ [OpenAI TTS] Speech generation failed:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      metadata: {
        voice: request.voice,
        textLength: request.text.length,
        responseFormat: request.response_format || 'mp3',
        processingTime
      }
    }
  }
}

/**
 * Get available OpenAI voices
 */
export function getAvailableVoices(): OpenAIVoice[] {
  return OPENAI_VOICES
}

/**
 * Get voice by ID
 */
export function getVoiceById(voiceId: string): OpenAIVoice | undefined {
  return OPENAI_VOICES.find(voice => voice.id === voiceId)
}

/**
 * Validate voice ID
 */
export function isValidVoice(voiceId: string): boolean {
  return OPENAI_VOICES.some(voice => voice.id === voiceId)
}
