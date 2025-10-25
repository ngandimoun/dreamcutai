/**
 * OpenAI Voice Instructions Enhancer
 * 
 * Uses GPT-4o-mini to transform basic voice parameters into rich, professional
 * voice direction instructions for OpenAI's TTS model.
 */

import OpenAI from 'openai'
import { buildOpenAIInstructions, type VoiceParameters } from '@/lib/utils/openai-voice-instructions-builder'

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

/**
 * Enforce character limit with smart truncation
 */
function enforceCharacterLimit(text: string, maxChars: number = 999): string {
  if (text.length <= maxChars) return text
  
  const truncated = text.substring(0, maxChars - 3)
  const lastPeriod = truncated.lastIndexOf('.')
  const lastNewline = truncated.lastIndexOf('\n')
  const cutoff = Math.max(lastPeriod, lastNewline)
  
  // If we found a good cutoff point (at least 70% of max length), use it
  if (cutoff > maxChars * 0.7) {
    return text.substring(0, cutoff + 1)
  }
  
  // Otherwise, just truncate and add ellipsis
  return truncated + '...'
}

/**
 * Enhance voice instructions using GPT-4o-mini
 * 
 * Transforms basic voice parameters into rich, professional voice direction
 * instructions that are more natural and effective for TTS generation.
 */
export async function enhanceVoiceInstructions(params: VoiceParameters): Promise<string> {
  try {
    const basicInstructions = buildOpenAIInstructions(params)
    const openai = getOpenAIClient()
    
    console.log('🎭 [ENHANCE INSTRUCTIONS] Basic instructions:', basicInstructions.substring(0, 100) + '...')
    
    const prompt = `Transform these voice parameters into rich, professional voice direction instructions for text-to-speech generation.

Current parameters: ${basicInstructions}

Create vivid, detailed instructions covering:
- Voice/Affect: Overall character and quality
- Tone: Emotional quality and attitude  
- Pacing/Speed: Delivery rhythm and timing
- Emotion: Feelings and energy conveyed
- Pronunciation/Accent: If specified
- Personality: Character traits and style

Be specific, vivid, and professional. Use natural language that a voice actor would understand. Maximum 999 characters.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 350,
      temperature: 0.7
    })
    
    const enhanced = response.choices[0].message.content?.trim() || basicInstructions
    const finalInstructions = enforceCharacterLimit(enhanced, 999)
    
    console.log('✨ [ENHANCE INSTRUCTIONS] Enhanced instructions:', finalInstructions.substring(0, 100) + '...')
    console.log('📏 [ENHANCE INSTRUCTIONS] Character count:', finalInstructions.length)
    
    return finalInstructions
    
  } catch (error) {
    console.error('❌ [ENHANCE INSTRUCTIONS] Failed to enhance instructions, using basic:', error)
    const basicInstructions = buildOpenAIInstructions(params)
    return enforceCharacterLimit(basicInstructions, 999)
  }
}

/**
 * Check if instructions should be enhanced based on parameters
 * 
 * Only enhance if we have meaningful parameters to work with
 */
export function shouldEnhanceInstructions(params: VoiceParameters): boolean {
  const hasMeaningfulParams = !!(
    params.accent && params.accent !== 'no accent (neutral)' ||
    params.tone ||
    params.mood ||
    params.role ||
    params.style ||
    params.useCase ||
    (params.pitch !== undefined && (params.pitch < 30 || params.pitch > 70)) ||
    (params.emotionalWeight !== undefined && (params.emotionalWeight < 30 || params.emotionalWeight > 70))
  )
  
  return hasMeaningfulParams
}
