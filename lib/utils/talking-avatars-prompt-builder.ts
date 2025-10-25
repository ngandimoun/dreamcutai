/**
 * Talking Avatars Prompt Builder
 * 
 * Builds enhanced prompts for Veo 3.1 Fast text-to-video generation
 * from AI Generate tab form fields
 */

export interface Character {
  id: string
  name: string
  description: string
  artStyle: string
  customArtStyle?: string
  ageRange: string
  customAgeRange?: string
  ethnicity: string
  customEthnicity?: string
  gender: string
  customGender?: string
  role: string
  customRole?: string
  bodyType: string
  customBodyType?: string
  skinTone: string
  customSkinTone?: string
  hairStyle: string
  customHairStyle?: string
  hairColor: string
  customHairColor?: string
  eyeColor: string
  customEyeColor?: string
  eyeShape: string
  customEyeShape?: string
  outfitCategory: string
  customOutfitCategory?: string
  outfitColors: string
  customOutfitColors?: string
  accessories: string[]
  customAccessory?: string
  expression: string
  customExpression?: string
  voice: string
  customVoice?: string
}

export interface DialogLine {
  id: string
  characterId: string
  text: string
  expression: string
}

export interface TalkingAvatarsPromptParams {
  mainPrompt: string
  characters: Character[]
  dialogLines: DialogLine[]
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
}

function include(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

function getCustomValue(value: string, customValue?: string): string {
  if (value === 'custom' && include(customValue)) {
    return customValue!
  }
  return value
}

function buildCharacterSummary(character: Character): string {
  const parts: string[] = []
  
  // Name (required)
  const name = character.name || 'Character'
  
  // Key traits only (description, age, ethnicity, art style)
  const traits: string[] = []
  
  if (include(character.description)) {
    traits.push(character.description)
  }
  
  const ageRange = getCustomValue(character.ageRange, character.customAgeRange)
  if (include(ageRange) && ageRange !== 'custom') {
    traits.push(ageRange)
  }
  
  const ethnicity = getCustomValue(character.ethnicity, character.customEthnicity)
  if (include(ethnicity) && ethnicity !== 'custom') {
    traits.push(ethnicity)
  }
  
  const gender = getCustomValue(character.gender, character.customGender)
  if (include(gender) && gender !== 'custom') {
    traits.push(gender)
  }
  
  const role = getCustomValue(character.role, character.customRole)
  if (include(role) && role !== 'custom') {
    traits.push(role)
  }
  
  const artStyle = getCustomValue(character.artStyle, character.customArtStyle)
  if (include(artStyle) && artStyle !== 'custom') {
    traits.push(`${artStyle} style`)
  }
  
  return `${name}${traits.length > 0 ? ' - ' + traits.join(', ') : ''}`
}

// Helper function to get timing for dialogue lines
function getTimingForLine(index: number, total: number, duration: number = 8): string {
  const segmentDuration = duration / total
  const start = Math.floor(index * segmentDuration)
  const end = Math.floor((index + 1) * segmentDuration)
  return `${start}-${end}s`
}

// Helper function to get character name by ID
function getCharacterName(characterId: string, characters: Character[]): string {
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

function buildConversationSection(dialogLines: DialogLine[], characters: Character[]): string {
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

function getArtStyleSpecs(artStyle: string): { visual: string; camera: string; lighting: string } {
  switch (artStyle.toLowerCase()) {
    case 'ultra-realistic':
      return {
        visual: '8K hyper-realistic with natural lighting and detailed textures',
        camera: 'Professional cinema camera with shallow depth of field',
        lighting: 'Natural lighting with soft shadows and realistic reflections'
      }
    case 'realistic':
      return {
        visual: 'High-definition realistic with natural colors',
        camera: 'Standard cinema camera with balanced focus',
        lighting: 'Natural lighting with gentle shadows'
      }
    case 'anime-manga':
      return {
        visual: 'Anime-style with vibrant colors and dynamic framing',
        camera: 'Dynamic camera with expressive angles and movements',
        lighting: 'Bright, saturated lighting with strong contrasts'
      }
    case 'semi-realistic':
      return {
        visual: 'Semi-realistic with stylized elements',
        camera: 'Cinematic camera with artistic framing',
        lighting: 'Enhanced lighting with artistic color grading'
      }
    case 'cartoon':
      return {
        visual: 'Cartoon-style with bold colors and simplified forms',
        camera: 'Playful camera movements with wide shots',
        lighting: 'Bright, even lighting with minimal shadows'
      }
    case '3d-render':
      return {
        visual: '3D rendered with clean, modern aesthetics',
        camera: 'Smooth camera movements with precise framing',
        lighting: 'Studio lighting with clean, even illumination'
      }
    default:
      return {
        visual: 'Professional video quality',
        camera: 'Standard cinema camera',
        lighting: 'Natural lighting'
      }
  }
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
    default:
      return {
        setting: env || 'Professional setting',
        ambiance: 'Well-lit, professional atmosphere',
        sounds: 'Subtle ambient sounds appropriate to the setting'
      }
  }
}

export function buildTalkingAvatarsPrompt(params: TalkingAvatarsPromptParams): string {
  const { 
    mainPrompt, 
    characters, 
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
    customSoundEffects 
  } = params
  
  const parts: string[] = []
  
  // Get specs
  const primaryArtStyle = characters.length > 0 ? characters[0].artStyle : 'realistic'
  const artSpecs = getArtStyleSpecs(primaryArtStyle)
  const envDetails = getEnvironmentDetails(environment || '', customEnvironment)
  const characterCount = characters.filter(char => include(char.name)).length
  
  // 1. SCENE SETUP (Concise)
  parts.push(`[SCENE] 8-second HD video, ${characterCount}-person conversation`)
  parts.push(`Setting: ${envDetails.setting}`)
  parts.push(`Atmosphere: ${envDetails.ambiance}`)
  
  // 2. CHARACTERS (Clear, concise summaries)
  if (include(characters) && characters.length > 0) {
    parts.push(`\n[CHARACTERS]`)
    characters.forEach((char, idx) => {
      if (include(char.name) || include(char.description)) {
        const summary = buildCharacterSummary(char)
        parts.push(`${idx + 1}. ${summary}`)
      }
    })
  }
  
  // 3. CONVERSATION (Timed sequence)
  const conversationSection = buildConversationSection(dialogLines, characters)
  if (conversationSection) {
    parts.push(`\n[CONVERSATION]`)
    parts.push(conversationSection)
  }
  
  // 4. VISUAL (Camera and lighting)
  parts.push(`\n[VISUAL]`)
  
  // Camera specs
  let shotType = 'Medium shot'
  let cameraMovement = 'Static camera with subtle handheld movement'
  
  if (characterCount === 1) {
    shotType = 'Close-up to medium shot'
    cameraMovement = 'Gentle push-in camera movement for intimacy'
  } else if (characterCount === 2) {
    shotType = 'Two-shot with alternating close-ups'
    cameraMovement = 'Smooth camera transitions between speakers'
  } else if (characterCount > 2) {
    shotType = 'Wide shot with group framing'
    cameraMovement = 'Slow dolly movement to capture all characters'
  }
  
  parts.push(`Camera: ${shotType}`)
  parts.push(`Movement: ${cameraMovement}`)
  parts.push(`Focus: Characters' faces and expressions with shallow depth of field`)
  
  // Lighting
  const lightSetting = getCustomValue(lighting || '', customLighting)
  let lightingDesc = artSpecs.lighting
  if (include(lightSetting) && lightSetting !== 'custom') {
    lightingDesc = lightSetting
  }
  parts.push(`Lighting: ${lightingDesc}`)
  
  // Color palette
  let colorPalette = 'Natural, warm tones'
  if (primaryArtStyle.toLowerCase().includes('anime')) {
    colorPalette = 'Vibrant, saturated colors with high contrast'
  } else if (primaryArtStyle.toLowerCase().includes('realistic')) {
    colorPalette = 'Natural, realistic color palette with soft highlights'
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
