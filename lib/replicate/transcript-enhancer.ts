import { getReplicateClient } from '@/lib/utils/replicate-client'

export interface TranscriptSegment {
  start: number
  end: number
  text: string
  words?: Array<{
    word: string
    start: number
    end: number
  }>
}

export interface TranscriptData {
  segments: TranscriptSegment[]
}

export interface EnhancementOptions {
  language: string
  emoji_enrichment: boolean
  emoji_strategy: 'AI' | 'manualMap'
  emoji_map?: Record<string, string>
  keyword_emphasis: boolean
  keywords?: string[]
  keyword_style?: 'CAPS' | 'EMOJI_WRAP' | 'ASTERISKS'
}

export async function enhanceTranscript(
  transcript: TranscriptData,
  options: EnhancementOptions
): Promise<TranscriptData> {
  // Safety check
  if (!transcript || !transcript.segments || !Array.isArray(transcript.segments)) {
    console.error('❌ Invalid transcript structure:', transcript)
    throw new Error('Invalid transcript structure: missing segments array')
  }
  
  if (transcript.segments.length === 0) {
    console.warn('⚠️ Empty transcript, returning as-is')
    return transcript
  }

  const replicate = getReplicateClient()
  
  console.log('🤖 Starting transcript enhancement...')
  console.log('📊 Enhancement options:', {
    language: options.language,
    emoji_enrichment: options.emoji_enrichment,
    emoji_strategy: options.emoji_strategy,
    keyword_emphasis: options.keyword_emphasis,
    total_segments: transcript.segments.length
  })
  
  // Build enhancement instructions
  const systemPrompt = buildEnhancementPrompt(options)
  console.log('📝 System prompt length:', systemPrompt.length, 'chars')
  
  let successCount = 0
  let failureCount = 0
  
  // Process each segment with Replicate GPT-4o-mini
  const enhancedSegments = await Promise.all(
    transcript.segments.map(async (segment, index) => {
      try {
        console.log(`🔄 Processing segment ${index + 1}/${transcript.segments.length}: "${segment.text.substring(0, 50)}..."`)
        
        const input = {
          prompt: segment.text,
          system_prompt: systemPrompt,
          max_tokens: 150,
          temperature: 0.7
        }
        
        const startTime = Date.now()
        const output = await replicate.run("openai/gpt-4o-mini", { input })
        const duration = Date.now() - startTime
        
        // Output is an array of strings, join them
        const enhancedText = Array.isArray(output) ? output.join("") : String(output)
        
        console.log(`✅ Segment ${index + 1} enhanced in ${duration}ms`)
        console.log(`   Original: "${segment.text}"`)
        console.log(`   Enhanced: "${enhancedText.substring(0, 100)}..."`)
        
        successCount++
        
        return {
          ...segment,
          text: enhancedText.trim()
        }
      } catch (error) {
        failureCount++
        console.error(`❌ Failed to enhance segment ${index + 1}:`, error)
        console.warn(`⚠️ Using original text for segment ${index + 1}`)
        return segment
      }
    })
  )
  
  console.log('✅ Enhancement complete!')
  console.log(`📊 Results: ${successCount} succeeded, ${failureCount} failed out of ${transcript.segments.length} segments`)
  
  return {
    ...transcript,
    segments: enhancedSegments
  }
}

function buildEnhancementPrompt(options: EnhancementOptions): string {
  let prompt = `You are a subtitle enhancement AI. Your task is to improve subtitle text while keeping it concise and readable.

Language: ${options.language === 'auto' ? 'Auto-detect' : options.language}

Rules:
1. Keep the original meaning and timing
2. Maintain readability for subtitles (short and clear)
3. Do NOT change the core message
4. Return ONLY the enhanced text, no explanations
`

  // Emoji enrichment
  if (options.emoji_enrichment) {
    if (options.emoji_strategy === 'AI') {
      prompt += `
5. Add relevant emojis next to key words/phrases
6. Use 1-3 emojis per subtitle line maximum
7. Place emojis naturally (before or after words)
8. Choose emojis that enhance emotional impact
9. Examples:
   - "I love this!" → "I love this! ❤️"
   - "That's amazing" → "That's amazing 🤩"
   - "Check this out" → "Check this out 👀"
`
    } else if (options.emoji_strategy === 'manualMap' && options.emoji_map) {
      // Create clear examples showing keyword + emoji (not replacement)
      const emojiExamples = Object.entries(options.emoji_map)
        .slice(0, 3)  // Limit to first 3 to keep prompt concise
        .map(([word, emoji]) => `   "${word}" → "${word} ${emoji}"`)
        .join('\n')
      
      const keywords = Object.keys(options.emoji_map).join(', ')
      
      prompt += `
5. Add emojis next to specific keywords based on this mapping:
   Keywords: ${keywords}
   
6. IMPORTANT RULES:
   - DO NOT replace the keyword with the emoji
   - Keep the keyword and add the emoji right after it with a space
   - Match keywords case-insensitively (fire, Fire, FIRE all match "fire")
   - Add emoji immediately after each occurrence of the keyword
   
7. Examples:
${emojiExamples}

8. If you see "This is fire", output "This is fire 🔥" (keep "fire"!)
`
    }
  }

  // Keyword emphasis
  if (options.keyword_emphasis && options.keywords && options.keywords.length > 0) {
    const keywordList = options.keywords.map(k => `"${k}"`).join(', ')
    
    prompt += `
8. Emphasize these keywords: ${keywordList}
9. Emphasis style: ${getKeywordStyleDescription(options.keyword_style)}
`
  }

  return prompt
}

function getKeywordStyleDescription(style?: string): string {
  switch (style) {
    case 'CAPS':
      return 'Convert keyword to UPPERCASE'
    case 'EMOJI_WRAP':
      return 'Wrap keyword with ✨ emojis like ✨keyword✨'
    case 'ASTERISKS':
      return 'Wrap keyword with asterisks like *keyword*'
    default:
      return 'Make keyword bold or emphasized'
  }
}
