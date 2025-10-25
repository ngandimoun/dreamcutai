/**
 * Prompt Intelligence Helpers
 * 
 * These helpers guide the AI's thinking process for creating prompts
 * for ANY scenario, not just memorized examples.
 */

/**
 * Analyzes user input to understand what they want to create
 */
export function analyzeUserIntent(userMessage: string): {
  assetType: 'video' | 'image' | 'unknown'
  subject: string
  mood: string[]
  style: string[]
  specificity: 'vague' | 'moderate' | 'detailed'
} {
  const lower = userMessage.toLowerCase()
  
  // Detect asset type
  const videoKeywords = ['video', 'animation', 'motion', 'moving', 'action', 'clip', 'footage', 'scene']
  const imageKeywords = ['image', 'photo', 'picture', 'portrait', 'shot', 'render']
  
  let assetType: 'video' | 'image' | 'unknown' = 'unknown'
  if (videoKeywords.some(kw => lower.includes(kw))) assetType = 'video'
  else if (imageKeywords.some(kw => lower.includes(kw))) assetType = 'image'
  
  // Extract subject (very basic - AI will do better job)
  const subject = userMessage.split(/video|image|photo|of|showing|with/i)[1]?.trim() || userMessage
  
  // Detect mood keywords
  const moodKeywords = ['happy', 'sad', 'dramatic', 'comedic', 'serene', 'tense', 'mysterious', 'upbeat', 'dark', 'bright']
  const mood = moodKeywords.filter(kw => lower.includes(kw))
  
  // Detect style keywords
  const styleKeywords = ['cinematic', 'realistic', 'artistic', 'cyberpunk', 'vintage', 'modern', 'minimalist', 'dramatic']
  const style = styleKeywords.filter(kw => lower.includes(kw))
  
  // Assess specificity
  const wordCount = userMessage.split(/\s+/).length
  const specificity = wordCount < 5 ? 'vague' : wordCount < 15 ? 'moderate' : 'detailed'
  
  return { assetType, subject, mood, style, specificity }
}

/**
 * Provides thinking guidance for the AI based on what user asked for
 */
export function getPromptThinkingGuide(userInput: string) {
  const intent = analyzeUserIntent(userInput)
  
  return {
    // What the AI should think about
    critical_questions: [
      'What is the main subject or focus?',
      'What emotion or mood would enhance this?',
      'What camera angle/perspective tells this story best?',
      'Where and when does this take place?',
      'What specific details make it vivid and memorable?',
      'What technical/artistic style enhances the concept?'
    ],
    
    // Elements that should always be included
    essential_elements: {
      always_include: [
        'Specific subject description (not generic)',
        'Clear scene/environment setting',
        'Lighting approach and mood',
        'Overall tone and style'
      ],
      for_video: [
        'Camera movement or position',
        'Specific action or sequence',
        'Audio design (music, ambient, effects)'
      ],
      for_image: [
        'Camera angle and framing',
        'Pose or composition',
        'Depth of field approach'
      ],
      for_depth: [
        'Specific color palette',
        'Props or environmental details',
        'Atmospheric effects (fog, rain, etc.)',
        'One unexpected creative detail'
      ]
    },
    
    // Creative expansion prompts
    expansion_triggers: [
      'What makes this concept interesting or unique?',
      'What unexpected detail would add wow factor?',
      'What time of day enhances the mood?',
      'What reference style or aesthetic fits?',
      'If vague, what are 2-3 different interpretations?'
    ],
    
    // Based on user's specificity level
    expansion_strategy: intent.specificity === 'vague'
      ? 'Expand significantly - add all missing elements creatively'
      : intent.specificity === 'moderate'
      ? 'Enhance with technical details and atmospheric elements'
      : 'Refine and structure - user has good foundation',
    
    // Format recommendations
    suggested_formats: {
      simple: 'For quick copy-paste: pipe-separated key elements',
      detailed: 'For clarity: paragraph with all elements woven together',
      json: 'For technical control: structured breakdown by category'
    }
  }
}

/**
 * Gets creative variations for ambiguous requests
 */
export function suggestCreativeVariations(concept: string): {
  variation: string
  approach: string
  mood: string
}[] {
  // This provides examples of how to think about variations
  // AI will use this pattern for ANY concept
  
  return [
    {
      variation: 'Variation 1',
      approach: 'Realistic, documentary style',
      mood: 'Authentic, natural, observational'
    },
    {
      variation: 'Variation 2',
      approach: 'Cinematic, dramatic style',
      mood: 'Epic, emotional, high-production'
    },
    {
      variation: 'Variation 3',
      approach: 'Artistic, stylized approach',
      mood: 'Creative, unique, memorable'
    }
  ]
}

/**
 * Prompt quality checklist - ensures AI covers all bases
 */
export const PROMPT_QUALITY_CHECKLIST = {
  video: {
    required: [
      '✓ Camera angle/movement specified',
      '✓ Subject described specifically',
      '✓ Scene/environment set',
      '✓ Action/sequence detailed',
      '✓ Lighting approach defined',
      '✓ Audio design included'
    ],
    optional_but_recommended: [
      '○ Specific lens choice',
      '○ Frame rate for effect',
      '○ Color palette specified',
      '○ Special effects noted',
      '○ Timing/pacing details'
    ]
  },
  image: {
    required: [
      '✓ Camera angle/framing specified',
      '✓ Subject described specifically',
      '✓ Scene/setting established',
      '✓ Lighting defined',
      '✓ Overall mood/style stated'
    ],
    optional_but_recommended: [
      '○ Lens simulation specified',
      '○ Depth of field approach',
      '○ Color grading/palette',
      '○ Pose/expression details',
      '○ Atmospheric elements'
    ]
  }
}

/**
 * Context-based prompt strategies
 */
export const CONTEXT_STRATEGIES = {
  product_shot: {
    focus_on: ['clean composition', 'controlled lighting', 'minimal distractions', 'hero positioning'],
    avoid: ['busy backgrounds', 'complex action', 'dramatic mood'],
    typical_approach: 'Clean, centered or rule-of-thirds, soft even lighting, pristine quality'
  },
  
  action_scene: {
    focus_on: ['dynamic camera movement', 'clear action sequence', 'energy and momentum', 'impactful sound'],
    avoid: ['static shots', 'slow pacing', 'minimal movement'],
    typical_approach: 'Tracking camera, high frame rate options, dramatic lighting, intense audio'
  },
  
  portrait: {
    focus_on: ['facial expression', 'flattering lighting', 'shallow depth of field', 'emotional connection'],
    avoid: ['distracted background', 'harsh lighting', 'awkward posing'],
    typical_approach: 'Medium to close framing, soft lighting, bokeh background, eye-level or slight angle'
  },
  
  environmental: {
    focus_on: ['wide framing', 'atmospheric conditions', 'depth and scale', 'contextual storytelling'],
    avoid: ['cluttered composition', 'unclear focal point', 'flat lighting'],
    typical_approach: 'Wide or ultra-wide lens, deep focus, natural lighting, weather/atmosphere'
  },
  
  abstract: {
    focus_on: ['color and form', 'artistic composition', 'unique perspective', 'mood over realism'],
    avoid: ['literal representation', 'technical accuracy', 'conventional framing'],
    typical_approach: 'Creative angles, bold colors, experimental techniques, conceptual over literal'
  },
  
  commercial: {
    focus_on: ['brand aesthetic', 'professional polish', 'clear messaging', 'target audience appeal'],
    avoid: ['amateur feel', 'off-brand elements', 'unclear purpose'],
    typical_approach: 'Controlled lighting, specific color palette, high production value, purposeful staging'
  }
}

/**
 * Mood-to-technical-choices mapping
 * Helps AI understand how mood translates to technical decisions
 */
export const MOOD_TECHNICAL_MAP = {
  dramatic: {
    lighting: 'High contrast, hard shadows, directional light',
    color: 'Deep saturated colors or stark monochrome',
    camera: 'Low angles, dynamic movement, slow-motion',
    audio: 'Intense music, minimal ambient, impactful effects'
  },
  
  comedic: {
    lighting: 'Bright, even, clear visibility',
    color: 'Natural, saturated, cheerful',
    camera: 'Static or motivated movement, observational angles',
    audio: 'Upbeat music, natural sounds, comedic timing in effects'
  },
  
  mysterious: {
    lighting: 'Low key, shadows, selective illumination',
    color: 'Cool tones, desaturated, noir palette',
    camera: 'Unusual angles, slow reveals, static tension',
    audio: 'Ambient dominant, minimal music, subtle effects'
  },
  
  serene: {
    lighting: 'Soft, diffused, gentle',
    color: 'Harmonious, muted, natural',
    camera: 'Smooth, slow movements, balanced composition',
    audio: 'Ambient nature, minimal music, peaceful'
  },
  
  energetic: {
    lighting: 'Dynamic, changing, vibrant',
    color: 'Vivid, saturated, high contrast',
    camera: 'Fast movement, handheld feel, quick cuts (for video)',
    audio: 'High energy music, layered effects, immersive'
  },
  
  intimate: {
    lighting: 'Soft, warm, close-range',
    color: 'Warm tones, shallow palette',
    camera: 'Close framing, shallow focus, gentle movement',
    audio: 'Quiet, detailed, personal sounds'
  }
}

/**
 * Helper to get appropriate strategy based on detected context
 */
export function getContextStrategy(userInput: string): typeof CONTEXT_STRATEGIES[keyof typeof CONTEXT_STRATEGIES] | null {
  const lower = userInput.toLowerCase()
  
  if (lower.includes('product') || lower.includes('showcase')) return CONTEXT_STRATEGIES.product_shot
  if (lower.includes('action') || lower.includes('chase') || lower.includes('fight')) return CONTEXT_STRATEGIES.action_scene
  if (lower.includes('portrait') || lower.includes('headshot')) return CONTEXT_STRATEGIES.portrait
  if (lower.includes('landscape') || lower.includes('environment') || lower.includes('city')) return CONTEXT_STRATEGIES.environmental
  if (lower.includes('abstract') || lower.includes('artistic')) return CONTEXT_STRATEGIES.abstract
  if (lower.includes('commercial') || lower.includes('ad') || lower.includes('brand')) return CONTEXT_STRATEGIES.commercial
  
  return null
}

/**
 * Helper to map mood to technical choices
 */
export function getMoodTechnicals(mood: string): typeof MOOD_TECHNICAL_MAP[keyof typeof MOOD_TECHNICAL_MAP] | null {
  const lower = mood.toLowerCase()
  
  if (lower.includes('dramatic') || lower.includes('intense')) return MOOD_TECHNICAL_MAP.dramatic
  if (lower.includes('comedy') || lower.includes('funny') || lower.includes('humorous')) return MOOD_TECHNICAL_MAP.comedic
  if (lower.includes('mysterious') || lower.includes('suspense')) return MOOD_TECHNICAL_MAP.mysterious
  if (lower.includes('serene') || lower.includes('peaceful') || lower.includes('calm')) return MOOD_TECHNICAL_MAP.serene
  if (lower.includes('energetic') || lower.includes('dynamic') || lower.includes('fast')) return MOOD_TECHNICAL_MAP.energetic
  if (lower.includes('intimate') || lower.includes('personal') || lower.includes('close')) return MOOD_TECHNICAL_MAP.intimate
  
  return null
}



