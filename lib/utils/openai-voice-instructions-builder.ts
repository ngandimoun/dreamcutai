/**
 * OpenAI Voice Instructions Builder
 * 
 * Converts UI parameters to natural language instructions for OpenAI's GPT-4o-mini-TTS model.
 * Maps voice characteristics, emotions, and style parameters to descriptive instructions.
 */

export interface VoiceParameters {
  gender?: string
  age?: string
  accent?: string
  tone?: string
  pitch?: number
  pacing?: string
  mood?: string
  emotionalWeight?: number
  role?: string
  style?: string
  useCase?: string
  language?: string
}

/**
 * Build natural language instructions from voice parameters
 */
export function buildOpenAIInstructions(params: VoiceParameters): string {
  const parts: string[] = []
  
  // Accent and Language
  if (params.accent && params.accent !== 'no accent (neutral)') {
    const accentMapping: Record<string, string> = {
      'neutral american': 'Native American English',
      'british (rp)': 'Native British English (Received Pronunciation)',
      'british (cockney)': 'British English with Cockney accent',
      'scottish': 'Scottish accent',
      'irish': 'Irish accent',
      'australian': 'Australian accent',
      'canadian': 'Canadian accent',
      'southern us': 'Southern American accent',
      'new york': 'New York accent',
      'california': 'California accent',
      'texas': 'Texas accent',
      'indian': 'Indian accent',
      'south african': 'South African accent',
      'new zealand': 'New Zealand accent',
      'french': 'French accent',
      'german': 'German accent',
      'italian': 'Italian accent',
      'spanish': 'Spanish accent',
      'russian': 'Russian accent',
      'japanese': 'Japanese accent',
      'chinese': 'Chinese accent',
      'korean': 'Korean accent',
      'arabic': 'Arabic accent',
      'brazilian portuguese': 'Brazilian Portuguese accent',
      'mexican spanish': 'Mexican Spanish accent',
      'argentine spanish': 'Argentine Spanish accent'
    }
    
    const accentDescription = accentMapping[params.accent.toLowerCase()] || params.accent
    parts.push(`Accent: ${accentDescription}`)
  }

  // Emotional Range and Mood
  if (params.mood) {
    const moodMapping: Record<string, string> = {
      'calm': 'Calm and peaceful',
      'energetic': 'Energetic and lively',
      'sad': 'Melancholic and emotional',
      'dramatic': 'Dramatic and intense',
      'playful': 'Playful and cheerful',
      'confident': 'Confident and assertive',
      'mysterious': 'Mysterious and intriguing',
      'hopeful': 'Hopeful and optimistic',
      'relaxed': 'Relaxed and easygoing',
      'sleepy': 'Sleepy and drowsy',
      'soothing': 'Soothing and comforting',
      'meditative': 'Meditative and contemplative',
      'whisper': 'Whispered and intimate',
      'intimate': 'Intimate and personal',
      'professional': 'Professional and formal',
      'friendly': 'Friendly and warm',
      'authoritative': 'Authoritative and commanding',
      'gentle': 'Gentle and soft'
    }
    
    const moodDescription = moodMapping[params.mood.toLowerCase()] || params.mood
    parts.push(`Emotional Range: ${moodDescription}`)
  }

  // Tone and Voice Quality
  if (params.tone) {
    const toneMapping: Record<string, string> = {
      'warm': 'Warm and inviting',
      'deep': 'Deep and resonant',
      'smooth': 'Smooth and flowing',
      'raspy': 'Raspy and textured',
      'light': 'Light and airy',
      'breathy': 'Breathy and soft',
      'metallic': 'Metallic and sharp',
      'resonant': 'Resonant and full',
      'crisp': 'Crisp and clear',
      'mellow': 'Mellow and rich',
      'sharp': 'Sharp and precise',
      'soft': 'Soft and gentle',
      'rich': 'Rich and full-bodied',
      'clear': 'Clear and articulate',
      'husky': 'Husky and deep',
      'velvety': 'Velvety and smooth',
      'gravelly': 'Gravelly and rough',
      'silky': 'Silky and smooth',
      'brittle': 'Brittle and sharp',
      'asmr whisper': 'ASMR-style whisper',
      'meditation tone': 'Meditation-style calm tone',
      'sleepy voice': 'Sleepy and drowsy tone'
    }
    
    const toneDescription = toneMapping[params.tone.toLowerCase()] || params.tone
    parts.push(`Tone: ${toneDescription}`)
  }

  // Speed and Pacing
  if (params.pacing) {
    const pacingMapping: Record<string, string> = {
      'slow': 'Slow and deliberate',
      'conversational': 'Natural conversational pace',
      'fast': 'Fast and energetic',
      'measured': 'Measured and steady',
      'erratic': 'Variable and dynamic'
    }
    
    const pacingDescription = pacingMapping[params.pacing.toLowerCase()] || params.pacing
    parts.push(`Speed of Speech: ${pacingDescription}`)
  }

  // Performance Style
  if (params.style) {
    const styleMapping: Record<string, string> = {
      'natural': 'Natural and conversational',
      'cinematic': 'Cinematic and dramatic',
      'theatrical': 'Theatrical and expressive',
      'sarcastic': 'Sarcastic and witty',
      'dreamy': 'Dreamy and ethereal',
      'whispered': 'Whispered and intimate',
      'commanding': 'Commanding and authoritative',
      'conversational': 'Conversational and friendly',
      'formal': 'Formal and professional',
      'casual': 'Casual and relaxed',
      'dramatic': 'Dramatic and intense',
      'monotone': 'Monotone and steady',
      'expressive': 'Expressive and animated',
      'subtle': 'Subtle and understated',
      'over-the-top': 'Over-the-top and exaggerated',
      'intimate': 'Intimate and personal',
      'professional': 'Professional and polished',
      'friendly': 'Friendly and approachable',
      'authoritative': 'Authoritative and commanding',
      'gentle': 'Gentle and soft',
      'asmr style': 'ASMR-style relaxation',
      'meditation style': 'Meditation-style calm',
      'sleep story style': 'Sleep story-style soothing',
      'relaxation style': 'Relaxation-style peaceful'
    }
    
    const styleDescription = styleMapping[params.style.toLowerCase()] || params.style
    parts.push(`Style: ${styleDescription}`)
  }

  // Character Role
  if (params.role) {
    const roleMapping: Record<string, string> = {
      'hero': 'Heroic and inspiring',
      'villain': 'Menacing and threatening',
      'mentor': 'Wise and guiding',
      'narrator': 'Clear and engaging narrator',
      'teacher': 'Educational and instructive',
      'announcer': 'Clear and authoritative announcer',
      'ai guide': 'Helpful AI assistant',
      'sidekick': 'Supportive and loyal',
      'protagonist': 'Main character energy',
      'antagonist': 'Opposing force energy',
      'supporting character': 'Supporting role energy',
      'background character': 'Background presence',
      'customer service rep': 'Professional customer service',
      'virtual assistant': 'Helpful virtual assistant',
      'podcast host': 'Engaging podcast host',
      'news reporter': 'Professional news reporter',
      'documentary narrator': 'Informative documentary narrator',
      'commercial voice': 'Persuasive commercial voice',
      'audiobook reader': 'Engaging audiobook narrator',
      'e-learning instructor': 'Educational instructor',
      'radio dj': 'Energetic radio DJ',
      'storyteller': 'Captivating storyteller',
      'meditation guide': 'Calming meditation guide',
      'asmr artist': 'Relaxing ASMR artist',
      'sleep storyteller': 'Soothing sleep storyteller',
      'relaxation coach': 'Guiding relaxation coach'
    }
    
    const roleDescription = roleMapping[params.role.toLowerCase()] || params.role
    parts.push(`Character: ${roleDescription}`)
  }

  // Pitch Level (if provided as number)
  if (params.pitch !== undefined) {
    if (params.pitch < 30) {
      parts.push('Pitch: Low and deep')
    } else if (params.pitch > 70) {
      parts.push('Pitch: High and bright')
    } else {
      parts.push('Pitch: Natural and balanced')
    }
  }

  // Emotional Weight
  if (params.emotionalWeight !== undefined) {
    if (params.emotionalWeight < 30) {
      parts.push('Emotional Intensity: Subtle and understated')
    } else if (params.emotionalWeight > 70) {
      parts.push('Emotional Intensity: Strong and expressive')
    } else {
      parts.push('Emotional Intensity: Moderate and natural')
    }
  }

  // Use Case Context
  if (params.useCase) {
    const useCaseMapping: Record<string, string> = {
      'narration': 'Narrative storytelling',
      'commercial': 'Commercial and persuasive',
      'educational': 'Educational and informative',
      'podcast': 'Podcast-style engaging',
      'audiobook': 'Audiobook narration',
      'documentary': 'Documentary-style informative',
      'e-learning': 'E-learning instructional',
      'news': 'News reporting style',
      'radio': 'Radio broadcast style',
      'storytelling': 'Storytelling and engaging',
      'meditation': 'Meditation and relaxation',
      'asmr': 'ASMR and relaxation',
      'character voice': 'Character voice acting',
      'brand voice': 'Brand voice consistency',
      'customer service': 'Customer service professional',
      'virtual assistant': 'Virtual assistant helpful',
      'game npc': 'Game character voice',
      'trailer': 'Trailer and promotional',
      'promo': 'Promotional and engaging',
      'announcement': 'Clear announcement style'
    }
    
    const useCaseDescription = useCaseMapping[params.useCase.toLowerCase()] || params.useCase
    parts.push(`Context: ${useCaseDescription}`)
  }

  // Combine all parts
  if (parts.length === 0) {
    return 'Speak naturally and clearly.'
  }

  return parts.join('; ') + '.'
}

/**
 * Build instructions with examples for specific scenarios
 */
export function buildInstructionsWithExamples(params: VoiceParameters): string {
  const baseInstructions = buildOpenAIInstructions(params)
  
  // Add specific examples based on use case
  if (params.useCase === 'meditation' || params.mood === 'meditative') {
    return baseInstructions + ' Use slow, calming speech with gentle pauses.'
  }
  
  if (params.useCase === 'asmr' || params.tone === 'asmr whisper') {
    return baseInstructions + ' Use soft, whisper-like speech with gentle sounds.'
  }
  
  if (params.useCase === 'commercial' || params.role === 'commercial voice') {
    return baseInstructions + ' Use persuasive, engaging speech that captures attention.'
  }
  
  if (params.useCase === 'educational' || params.role === 'teacher') {
    return baseInstructions + ' Use clear, instructional speech that is easy to follow.'
  }
  
  if (params.useCase === 'storytelling' || params.role === 'storyteller') {
    return baseInstructions + ' Use engaging, narrative speech that draws listeners in.'
  }
  
  return baseInstructions
}

/**
 * Get instruction examples for different voice types
 */
export function getInstructionExamples(): Record<string, string> {
  return {
    'Japanese Anime': 'Accent: Native Japanese; sharp consonants, rising sentence ends. Emotional Range: Extreme — from fiery shouts to deep, emotional softness. Intonation: Exaggerated and rhythmic; strong pitch swings typical of anime. Speed of Speech: Fast in action, slower during emotional or reflective scenes. Tone: Bold, raspy, passionate — carries raw energy.',
    
    'Professional Narrator': 'Accent: Native American English. Emotional Range: Professional and engaging. Tone: Clear and articulate. Speed of Speech: Natural conversational pace. Style: Natural and conversational. Character: Clear and engaging narrator.',
    
    'Meditation Guide': 'Accent: Native American English. Emotional Range: Calm and peaceful. Tone: Soft and gentle. Speed of Speech: Slow and deliberate. Style: Meditation-style calm. Character: Calming meditation guide. Use slow, calming speech with gentle pauses.',
    
    'ASMR Artist': 'Accent: Native American English. Emotional Range: Soothing and comforting. Tone: ASMR-style whisper. Speed of Speech: Slow and deliberate. Style: ASMR-style relaxation. Character: Relaxing ASMR artist. Use soft, whisper-like speech with gentle sounds.',
    
    'Commercial Voice': 'Accent: Native American English. Emotional Range: Confident and assertive. Tone: Clear and articulate. Speed of Speech: Natural conversational pace. Style: Professional and polished. Character: Persuasive commercial voice. Use persuasive, engaging speech that captures attention.'
  }
}
