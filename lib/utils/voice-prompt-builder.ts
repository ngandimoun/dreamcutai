/**
 * Voice Prompt Builder Utility
 * 
 * Builds comprehensive prompts for voice generation by incorporating
 * all UI parameters (voice identity, emotional DNA, brand sync, ASMR options)
 * into a structured prompt that voice generation AI can understand.
 */

export interface VoicePromptParams {
  // Base prompt
  prompt: string
  
  // Voice Identity
  purpose?: string | null
  language?: string | null
  gender?: string | null
  age?: string | null
  accent?: string | null
  tone?: string | null
  pitch?: number | null
  pacing?: string | null
  fidelity?: string | null
  
  // Emotional DNA
  mood?: string | null
  emotional_weight?: number | null
  role?: string | null
  style?: string | null
  audio_quality?: string | null
  guidance_scale?: number | null
  preview_text?: string | null
  
  
  // ASMR Voice Options
  is_asmr_voice?: boolean | null
  asmr_intensity?: number | null
  asmr_triggers?: string[] | null
  asmr_background?: string | null
  
  // Sound FX Integration Options
  sound_category?: string | null
  usage_context?: string | null
  sound_texture?: string | null
  attack_type?: string | null
  environment_style?: string | null
  purpose_in_scene?: string | null
}

/**
 * Helper function to check if a value should be included in the prompt
 */
function shouldInclude(value: any): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 && 
           !['none', 'auto', 'default', 'select', 'choose', 'placeholder', ''].includes(trimmed.toLowerCase())
  }
  if (Array.isArray(value)) {
    return value.length > 0 && value.some(item => shouldInclude(item))
  }
  if (typeof value === 'number') {
    return !isNaN(value) && value > 0
  }
  if (typeof value === 'boolean') {
    return value === true
  }
  return true
}

/**
 * Helper function to format pitch level as descriptive text
 */
function formatPitchLevel(pitch: number): string {
  if (pitch <= 20) return 'very low pitch'
  if (pitch <= 40) return 'low pitch'
  if (pitch <= 60) return 'medium pitch'
  if (pitch <= 80) return 'high pitch'
  return 'very high pitch'
}

/**
 * Helper function to format emotional weight as descriptive text
 */
function formatEmotionalWeight(weight: number): string {
  if (weight <= 20) return 'subtle emotional expression'
  if (weight <= 40) return 'gentle emotional expression'
  if (weight <= 60) return 'moderate emotional expression'
  if (weight <= 80) return 'strong emotional expression'
  return 'intense emotional expression'
}

/**
 * Helper function to format ASMR intensity as descriptive text
 */
function formatAsmrIntensity(intensity: number): string {
  if (intensity <= 20) return 'subtle ASMR'
  if (intensity <= 40) return 'gentle ASMR'
  if (intensity <= 60) return 'moderate ASMR'
  if (intensity <= 80) return 'strong ASMR'
  return 'intense ASMR'
}

/**
 * Builds a comprehensive voice generation prompt from all parameters
 */
export function buildVoicePrompt(params: VoicePromptParams): string {
  const {
    prompt,
    purpose,
    language,
    gender,
    age,
    accent,
    tone,
    pitch,
    pacing,
    fidelity,
    mood,
    emotional_weight,
    role,
    style,
    audio_quality,
    guidance_scale,
    preview_text,
    is_asmr_voice,
    asmr_intensity,
    asmr_triggers,
    asmr_background,
    sound_category,
    usage_context,
    sound_texture,
    attack_type,
    environment_style,
    purpose_in_scene
  } = params

  const promptParts: string[] = []
  
  // Base prompt (always include)
  if (prompt && prompt.trim()) {
    promptParts.push(prompt.trim())
  }
  
  // Voice Identity
  const identityParts: string[] = []
  
  if (shouldInclude(purpose)) {
    identityParts.push(`${purpose} voice`)
  }
  
  if (shouldInclude(gender)) {
    identityParts.push(`${gender} gender`)
  }
  
  if (shouldInclude(age)) {
    identityParts.push(`${age} age`)
  }
  
  if (shouldInclude(accent)) {
    identityParts.push(`${accent} accent`)
  }
  
  if (shouldInclude(tone)) {
    identityParts.push(`${tone} tone`)
  }
  
  if (shouldInclude(pitch)) {
    identityParts.push(formatPitchLevel(pitch))
  }
  
  if (shouldInclude(pacing)) {
    identityParts.push(`${pacing} pacing`)
  }
  
  if (shouldInclude(fidelity)) {
    identityParts.push(`${fidelity} fidelity`)
  }
  
  if (identityParts.length > 0) {
    promptParts.push(identityParts.join(', '))
  }
  
  // Emotional DNA
  const emotionalParts: string[] = []
  
  if (shouldInclude(mood)) {
    emotionalParts.push(`${mood} mood`)
  }
  
  if (shouldInclude(emotional_weight)) {
    emotionalParts.push(formatEmotionalWeight(emotional_weight))
  }
  
  if (shouldInclude(role)) {
    emotionalParts.push(`${role} role`)
  }
  
  if (shouldInclude(style)) {
    emotionalParts.push(`${style} style`)
  }
  
  if (shouldInclude(audio_quality)) {
    emotionalParts.push(`${audio_quality} quality`)
  }
  
  if (emotionalParts.length > 0) {
    promptParts.push(emotionalParts.join(', '))
  }
  
  
  // ASMR Voice Options
  if (shouldInclude(is_asmr_voice) && is_asmr_voice) {
    const asmrParts: string[] = []
    
    if (shouldInclude(asmr_intensity)) {
      asmrParts.push(formatAsmrIntensity(asmr_intensity))
    }
    
    if (shouldInclude(asmr_triggers) && asmr_triggers.length > 0) {
      const validTriggers = asmr_triggers.filter(trigger => shouldInclude(trigger))
      if (validTriggers.length > 0) {
        asmrParts.push(`with ${validTriggers.join(', ')} triggers`)
      }
    }
    
    if (shouldInclude(asmr_background)) {
      asmrParts.push(`${asmr_background} background`)
    }
    
    if (asmrParts.length > 0) {
      promptParts.push(`ASMR voice with ${asmrParts.join(', ')}`)
    } else {
      promptParts.push('ASMR voice')
    }
  }
  
  // Sound FX Integration Options
  const soundParts: string[] = []
  
  if (shouldInclude(sound_category)) {
    soundParts.push(`${sound_category} sound category`)
  }
  
  if (shouldInclude(usage_context)) {
    soundParts.push(`${usage_context} usage context`)
  }
  
  if (shouldInclude(sound_texture)) {
    soundParts.push(`${sound_texture} texture`)
  }
  
  if (shouldInclude(attack_type)) {
    soundParts.push(`${attack_type} attack`)
  }
  
  if (shouldInclude(environment_style)) {
    soundParts.push(`${environment_style} environment`)
  }
  
  if (shouldInclude(purpose_in_scene)) {
    soundParts.push(`${purpose_in_scene} purpose in scene`)
  }
  
  if (soundParts.length > 0) {
    promptParts.push(`Sound FX: ${soundParts.join(', ')}`)
  }
  
  // Language specification
  if (shouldInclude(language) && language !== 'English') {
    promptParts.push(`in ${language}`)
  }
  
  // Preview text context (if provided)
  if (shouldInclude(preview_text)) {
    promptParts.push(`optimized for: "${preview_text.substring(0, 50)}${preview_text.length > 50 ? '...' : ''}"`)
  }
  
  return promptParts.join('. ')
}

/**
 * Builds a concise voice description for display purposes
 */
export function buildVoiceDescription(params: VoicePromptParams): string {
  const parts: string[] = []
  
  if (shouldInclude(params.purpose)) {
    parts.push(params.purpose)
  }
  
  if (shouldInclude(params.gender)) {
    parts.push(params.gender)
  }
  
  if (shouldInclude(params.age)) {
    parts.push(params.age)
  }
  
  if (shouldInclude(params.accent)) {
    parts.push(params.accent)
  }
  
  if (shouldInclude(params.tone)) {
    parts.push(params.tone)
  }
  
  if (shouldInclude(params.language) && params.language !== 'English') {
    parts.push(params.language)
  }
  
  return parts.length > 0 ? parts.join(' ') : 'Custom Voice'
}
