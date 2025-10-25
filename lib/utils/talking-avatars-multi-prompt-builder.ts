/**
 * Multi Avatar Prompt Builder for Veo 3.1 REFERENCE_2_VIDEO
 * 
 * Creates enhanced prompts for multi-avatar scenes using reference images.
 * Follows Veo 3.1 best practices for REFERENCE_2_VIDEO generation.
 */

export interface MultiAvatarPromptParams {
  sceneDescription: string
  sceneCharacters: Array<{ id: string; name: string }>
  dialogLines: Array<{ id: string; characterId: string; text: string; expression: string }>
  environment?: string
  customEnvironment?: string
  background?: string
  customBackground?: string
  lighting?: string
  customLighting?: string
  backgroundMusic?: string
  customBackgroundMusic?: string
  soundEffects?: string
  customSoundEffects?: string
  imageCount: number // 1-3 avatar images
}

// Helper function to check if a value should be included
function include(value: any): boolean {
  return value !== null && value !== undefined && value !== '' && value !== 'custom'
}

// Helper function to get custom value or fallback to default
function getCustomValue(defaultValue: string, customValue?: string): string {
  if (include(customValue)) {
    return customValue!
  }
  return defaultValue
}

// Helper function to get timing for dialogue lines
function getTimingForLine(index: number, total: number, duration: number = 8): string {
  const segmentDuration = duration / total
  const start = Math.floor(index * segmentDuration)
  const end = Math.floor((index + 1) * segmentDuration)
  return `${start}-${end}s`
}

// Helper function to get character name by ID
function getCharacterName(characterId: string, characters: Array<{ id: string; name: string }>): string {
  const character = characters.find(char => char.id === characterId)
  return character?.name || `Character ${characterId}`
}

// Helper function to get natural dialogue introduction based on position
function getDialogueIntroduction(expression: string, isFirst: boolean): string {
  const expressions: Record<string, { opening: string; response: string }> = {
    happy: { opening: 'smiles warmly and says', response: 'responds with a smile' },
    serious: { opening: 'looks directly at camera and states', response: 'nods thoughtfully and responds' },
    excited: { opening: 'leans forward enthusiastically and exclaims', response: 'responds with excitement' },
    calm: { opening: 'speaks in a measured tone', response: 'responds calmly' },
    confident: { opening: 'speaks with authority', response: 'responds confidently' },
    friendly: { opening: 'greets warmly and says', response: 'responds warmly' },
    professional: { opening: 'addresses professionally', response: 'responds professionally' },
    surprised: { opening: 'looks surprised and exclaims', response: 'responds with surprise' },
    concerned: { opening: 'looks concerned and says', response: 'responds with concern' },
    angry: { opening: 'speaks with intensity', response: 'responds firmly' }
  }
  
  const exp = expressions[expression.toLowerCase()] || { opening: 'says', response: 'responds' }
  return isFirst ? exp.opening : exp.response
}

function buildConversationSection(dialogLines: Array<{ id: string; characterId: string; text: string; expression: string }>, characters: Array<{ id: string; name: string }>): string {
  if (!include(dialogLines) || dialogLines.length === 0) {
    return ''
  }
  
  const parts: string[] = []
  
  dialogLines.forEach((line, index) => {
    if (include(line.text)) {
      const characterName = getCharacterName(line.characterId, characters)
      const timing = getTimingForLine(index, dialogLines.length, 8)
      const isFirst = index === 0
      const introduction = getDialogueIntroduction(line.expression || 'neutral', isFirst)
      
      // Clean, structured dialogue format
      parts.push(`[${timing}] ${characterName} ${introduction}: "${line.text}"`)
    }
  })
  
  return parts.join('\n')
}

function getEnvironmentDetails(environment: string, customEnvironment?: string): { setting: string; ambiance: string; sounds: string } {
  const env = getCustomValue(environment || '', customEnvironment)
  
  switch (env.toLowerCase()) {
    case 'office':
      return {
        setting: 'Modern office environment with clean lines and professional atmosphere',
        ambiance: 'Professional, well-lit workspace',
        sounds: 'Subtle office ambience, distant keyboard typing, air conditioning hum'
      }
    case 'beach':
      return {
        setting: 'Beautiful beach setting with golden sand and turquoise water',
        ambiance: 'Bright, sunny atmosphere with ocean breeze',
        sounds: 'Waves gently crashing, seagulls calling, wind through palm trees'
      }
    case 'urban':
      return {
        setting: 'Urban cityscape with modern architecture and street life',
        ambiance: 'Dynamic city atmosphere with natural lighting',
        sounds: 'City ambience, distant traffic, urban energy'
      }
    case 'forest':
      return {
        setting: 'Lush forest environment with natural greenery and dappled sunlight',
        ambiance: 'Peaceful, natural atmosphere with filtered light',
        sounds: 'Birds chirping, leaves rustling, gentle forest ambience'
      }
    case 'studio':
      return {
        setting: 'Professional studio environment with controlled lighting',
        ambiance: 'Clean, professional atmosphere with even lighting',
        sounds: 'Quiet studio ambience, minimal background noise'
      }
    case 'café':
    case 'cafe':
      return {
        setting: 'Cozy café environment with comfortable seating and warm lighting',
        ambiance: 'Intimate, welcoming atmosphere with soft lighting',
        sounds: 'Coffee shop ambience, cups clinking, gentle background chatter'
      }
    case 'home':
      return {
        setting: 'Comfortable home environment with natural lighting',
        ambiance: 'Warm, relaxed atmosphere with soft lighting',
        sounds: 'Home ambience, gentle background sounds'
      }
    case 'outdoor':
      return {
        setting: 'Outdoor natural environment with fresh air and natural lighting',
        ambiance: 'Open, natural atmosphere with natural lighting',
        sounds: 'Natural outdoor ambience, wind, distant nature sounds'
      }
    default:
      return {
        setting: env || 'Professional setting',
        ambiance: 'Well-lit, professional atmosphere',
        sounds: 'Subtle ambient sounds appropriate to the setting'
      }
  }
}

function getCameraSpecs(characterCount: number): { shotType: string; movement: string; focus: string } {
  if (characterCount === 1) {
    return {
      shotType: 'Close-up to medium shot',
      movement: 'Gentle push-in camera movement for intimacy',
      focus: 'Character\'s face and expressions with shallow depth of field'
    }
  } else if (characterCount === 2) {
    return {
      shotType: 'Two-shot with alternating close-ups',
      movement: 'Smooth camera transitions between speakers',
      focus: 'Characters\' faces and expressions with natural depth of field'
    }
  } else if (characterCount === 3) {
    return {
      shotType: 'Three-shot with dynamic framing',
      movement: 'Slow dolly movement to capture all characters',
      focus: 'Group dynamics with balanced focus on all characters'
    }
  } else {
    return {
      shotType: 'Wide shot with group framing',
      movement: 'Slow dolly movement to capture all characters',
      focus: 'Group composition with clear character visibility'
    }
  }
}

export function buildMultiAvatarPrompt(params: MultiAvatarPromptParams): string {
  const { 
    sceneDescription, 
    sceneCharacters, 
    dialogLines, 
    environment, 
    customEnvironment,
    background, 
    customBackground,
    lighting, 
    customLighting,
    backgroundMusic, 
    customBackgroundMusic,
    soundEffects, 
    customSoundEffects,
    imageCount
  } = params
  
  const parts: string[] = []
  
  // Get environment details
  const envDetails = getEnvironmentDetails(environment || '', customEnvironment)
  const characterCount = sceneCharacters.filter(char => include(char.name)).length
  const cameraSpecs = getCameraSpecs(characterCount)
  
  // 1. SCENE SETUP (Concise)
  parts.push(`[SCENE] 8-second HD video, ${characterCount}-person conversation`)
  parts.push(`Setting: ${envDetails.setting}`)
  parts.push(`Atmosphere: ${envDetails.ambiance}`)
  
  // 2. CHARACTERS (Clear names and roles)
  parts.push(`\n[CHARACTERS]`)
  sceneCharacters.forEach((char, idx) => {
    if (include(char.name)) {
      parts.push(`${idx + 1}. ${char.name}`)
    }
  })
  
  // 3. CONVERSATION (Timed sequence)
  const conversationSection = buildConversationSection(dialogLines, sceneCharacters)
  if (conversationSection) {
    parts.push(`\n[CONVERSATION]`)
    parts.push(conversationSection)
  }
  
  // 4. VISUAL (Camera and lighting)
  parts.push(`\n[VISUAL]`)
  parts.push(`Camera: ${cameraSpecs.shotType}`)
  parts.push(`Movement: ${cameraSpecs.movement}`)
  parts.push(`Focus: ${cameraSpecs.focus}`)
  
  // Lighting
  const lightSetting = getCustomValue(lighting || '', customLighting)
  let lightingDesc = 'Natural lighting with soft shadows'
  if (include(lightSetting) && lightSetting !== 'custom') {
    lightingDesc = lightSetting
  }
  parts.push(`Lighting: ${lightingDesc}`)
  
  // Color palette based on environment
  let colorPalette = 'Natural, realistic color palette with soft highlights'
  if (envDetails.setting.toLowerCase().includes('beach')) {
    colorPalette = 'Bright, vibrant colors with ocean blues and golden tones'
  } else if (envDetails.setting.toLowerCase().includes('café') || envDetails.setting.toLowerCase().includes('cafe')) {
    colorPalette = 'Warm, inviting tones with soft highlights'
  } else if (envDetails.setting.toLowerCase().includes('office')) {
    colorPalette = 'Clean, professional tones with natural lighting'
  }
  parts.push(`Color palette: ${colorPalette}`)
  
  // Background
  const bgSetting = getCustomValue(background || '', customBackground)
  if (include(bgSetting) && bgSetting !== 'custom') {
    parts.push(`Background: ${bgSetting}`)
  }
  
  // 5. AUDIO (Sound design)
  parts.push(`\n[AUDIO]`)
  
  // Sound Effects
  const sfx = getCustomValue(soundEffects || '', customSoundEffects)
  if (include(sfx) && sfx !== 'custom') {
    parts.push(`SFX: ${sfx}`)
  }
  
  // Background Music
  const music = getCustomValue(backgroundMusic || '', customBackgroundMusic)
  if (include(music) && music !== 'custom') {
    parts.push(`Music: ${music}`)
  }
  
  // Ambient sounds
  parts.push(`Ambient: ${envDetails.sounds}`)
  
  return parts.join('\n')
}
