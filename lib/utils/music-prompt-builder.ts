/**
 * Music Style Enhancement Utility
 * 
 * Enhances music generation style parameters by incorporating UI parameters
 * (duration, styles, loop mode, stereo mode) into natural language
 * descriptions that Suno AI can understand.
 * 
 * This is used for the 'style' field in Custom Mode, not the 'prompt' field
 * which should contain raw lyrics in Custom Mode with vocals.
 */

export interface StyleEnhancementParams {
  // Base style from user
  baseStyle?: string
  
  // Musically-relevant parameters to weave in
  duration?: number
  styles?: string[]
  loop_mode?: boolean
  stereo_mode?: 'mono' | 'stereo' | 'wide'
  
  // Additional context (already sent to Suno separately)
  instrumental?: boolean
  vocalGender?: 'm' | 'f' | 'auto'
  negativeTags?: string
}

/**
 * Helper to check if value should be included
 */
function shouldInclude(value: any): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value.trim() === '') return false
  if (Array.isArray(value) && value.length === 0) return false
  return true
}

/**
 * Format duration into natural language
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}-second`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (remainingSeconds === 0) {
    return `${minutes}-minute`
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} minute`
}

/**
 * Format stereo mode into natural language
 */
function formatStereoMode(mode: string): string {
  switch (mode) {
    case 'mono':
      return 'mono audio with centered sound'
    case 'stereo':
      return 'stereo with balanced left-right channels'
    case 'wide':
      return 'wide stereo imaging for immersive spatial experience'
    default:
      return 'stereo audio'
  }
}

/**
 * Build enhanced style field for Custom Mode
 * 
 * This function enhances the style field with technical specifications
 * without affecting the prompt field (which should contain raw lyrics in Custom Mode)
 */
export function buildStyleEnhancement(params: StyleEnhancementParams): string {
  const {
    baseStyle,
    duration,
    styles,
    loop_mode,
    stereo_mode,
    instrumental,
    vocalGender
  } = params

  const styleParts: string[] = []
  
  // 1. Start with user's base style if provided
  if (shouldInclude(baseStyle)) {
    styleParts.push(baseStyle!.trim())
  }
  
  // 2. Add style influences if provided
  if (shouldInclude(styles) && styles!.length > 0) {
    const styleText = styles!.length === 1
      ? `with ${styles![0]} influences`
      : `incorporating ${styles!.slice(0, -1).join(', ')}, and ${styles![styles!.length - 1]} elements`
    styleParts.push(styleText)
  }
  
  // 3. Add duration specification
  if (shouldInclude(duration)) {
    styleParts.push(`${formatDuration(duration!)} duration`)
  }
  
  // 4. Add looping instruction
  if (loop_mode === true) {
    styleParts.push('seamless looping')
  }
  
  // 5. Add stereo/spatial instructions
  if (shouldInclude(stereo_mode)) {
    styleParts.push(formatStereoMode(stereo_mode!))
  }
  
  // 6. Add vocal context if needed
  if (instrumental === true) {
    styleParts.push('instrumental only')
  } else if (shouldInclude(vocalGender) && vocalGender !== 'auto') {
    const vocalText = vocalGender === 'm' ? 'male vocals' : 'female vocals'
    styleParts.push(vocalText)
  }
  
  // Join all parts with appropriate punctuation
  return styleParts.join(', ').replace(/,,/g, ',').trim()
}

/**
 * Build enhanced prompt for Simple Mode
 * 
 * This function enhances the prompt field with technical specifications
 * for Simple Mode where Suno auto-generates lyrics based on the prompt
 */
export function buildSimplePrompt(params: StyleEnhancementParams & { prompt: string }): string {
  const {
    prompt,
    duration,
    styles,
    loop_mode,
    stereo_mode,
    instrumental,
    vocalGender
  } = params

  const promptParts: string[] = []
  
  // 1. Start with user's original creative prompt
  if (shouldInclude(prompt)) {
    promptParts.push(prompt.trim())
  }
  
  // 2. Add style influences if provided
  if (shouldInclude(styles) && styles!.length > 0) {
    const styleText = styles!.length === 1
      ? `with ${styles![0]} influences`
      : `incorporating ${styles!.slice(0, -1).join(', ')}, and ${styles![styles!.length - 1]} elements`
    promptParts.push(styleText)
  }
  
  // 3. Add duration specification
  if (shouldInclude(duration)) {
    promptParts.push(`Create a ${formatDuration(duration!)} track`)
  }
  
  // 4. Add looping instruction
  if (loop_mode === true) {
    promptParts.push('designed to loop seamlessly with smooth transitions')
  }
  
  // 5. Add stereo/spatial instructions
  if (shouldInclude(stereo_mode)) {
    promptParts.push(`Use ${formatStereoMode(stereo_mode!)}`)
  }
  
  // 6. Add instrumental context if needed
  if (instrumental === true) {
    promptParts.push('Pure instrumental composition with no vocals')
  } else if (shouldInclude(vocalGender) && vocalGender !== 'auto') {
    const vocalText = vocalGender === 'm' ? 'male vocals' : 'female vocals'
    promptParts.push(`featuring ${vocalText}`)
  }
  
  // Join all parts with appropriate punctuation
  return promptParts.join('. ').replace(/\.\./g, '.').trim() + '.'
}

/**
 * Validate style enhancement parameters
 */
export function validateStyleParams(params: StyleEnhancementParams): { 
  valid: boolean
  errors: string[] 
} {
  const errors: string[] = []
  
  if (shouldInclude(params.duration)) {
    if (params.duration! < 1 || params.duration! > 480) {
      errors.push('Duration must be between 1 and 480 seconds')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

