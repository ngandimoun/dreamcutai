/**
 * Avatar Prompt Builder Utility
 * 
 * Builds comprehensive prompts for avatar generation by incorporating
 * all UI parameters (visual style, identity, physical traits, outfit)
 * into a structured prompt that Fal.ai can understand.
 */

export interface AvatarPromptParams {
  // Base prompt
  prompt: string
  
  // Visual Style Stack
  artDirection?: string | null
  visualInfluence?: string | null
  lightingPreset?: string | null
  backgroundEnvironment?: string | null
  moodContext?: string | null
  
  // Identity & Role
  personaName?: string | null
  roleArchetype?: string | null
  ageRange?: string | null
  genderExpression?: string | null
  ethnicity?: string | null
  emotionBias?: number
  
  // Frame & Composition
  avatarComposition?: string | null
  poseStyle?: string | null
  cameraView?: string | null
  eyeDirection?: string | null
  headOrientation?: string | null
  
  // Physical Traits
  bodyType?: string | null
  skinTone?: string | null
  hairStyle?: string | null
  hairColor?: string | null
  eyeColor?: string | null
  eyeShape?: string | null
  
  // Outfit
  outfitCategory?: string | null
  outfitPalette?: string | null
  accessories?: string[] | null
  
  // Logo
  logoPlacement?: string[] | null
  logoDescription?: string | null
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
    return !isNaN(value)
  }
  return true
}

/**
 * Builds a comprehensive avatar generation prompt from all parameters
 */
export function buildAvatarPrompt(params: AvatarPromptParams): string {
  const {
    prompt,
    artDirection,
    visualInfluence,
    lightingPreset,
    backgroundEnvironment,
    moodContext,
    personaName,
    roleArchetype,
    ageRange,
    genderExpression,
    ethnicity,
    emotionBias,
    avatarComposition,
    poseStyle,
    cameraView,
    eyeDirection,
    headOrientation,
    bodyType,
    skinTone,
    hairStyle,
    hairColor,
    eyeColor,
    eyeShape,
    outfitCategory,
    outfitPalette,
    accessories,
    logoPlacement,
    logoDescription
  } = params

  const promptParts: string[] = []
  
  // Base prompt (always include)
  if (prompt && prompt.trim()) {
    promptParts.push(prompt.trim())
  }
  
  // Visual Style Stack
  const visualStyleParts: string[] = []
  
  if (shouldInclude(artDirection)) {
    visualStyleParts.push(`${artDirection} style`)
  }
  
  if (shouldInclude(visualInfluence)) {
    visualStyleParts.push(`${visualInfluence} influence`)
  }
  
  if (shouldInclude(lightingPreset)) {
    visualStyleParts.push(`${lightingPreset} lighting`)
  }
  
  if (shouldInclude(backgroundEnvironment)) {
    visualStyleParts.push(`${backgroundEnvironment} background`)
  }
  
  if (shouldInclude(moodContext)) {
    visualStyleParts.push(`${moodContext} mood`)
  }
  
  if (visualStyleParts.length > 0) {
    promptParts.push(visualStyleParts.join(', '))
  }
  
  // Identity & Role
  const identityParts: string[] = []
  
  if (shouldInclude(roleArchetype)) {
    identityParts.push(`${roleArchetype} archetype`)
  }
  
  if (shouldInclude(ageRange)) {
    identityParts.push(`${ageRange} age range`)
  }
  
  if (shouldInclude(genderExpression)) {
    identityParts.push(`${genderExpression} gender expression`)
  }
  
  if (shouldInclude(ethnicity)) {
    identityParts.push(`${ethnicity} ethnicity`)
  }
  
  if (shouldInclude(emotionBias) && emotionBias !== 50) {
    const emotionLevel = emotionBias > 50 ? 'positive' : 'negative'
    const intensity = Math.abs(emotionBias - 50) > 25 ? 'strong' : 'subtle'
    identityParts.push(`${intensity} ${emotionLevel} emotional bias`)
  }
  
  if (identityParts.length > 0) {
    promptParts.push(identityParts.join(', '))
  }
  
  // Frame & Composition
  const compositionParts: string[] = []
  
  if (shouldInclude(avatarComposition)) {
    compositionParts.push(`${avatarComposition} composition`)
  }
  
  if (shouldInclude(poseStyle)) {
    compositionParts.push(`${poseStyle} pose`)
  }
  
  if (shouldInclude(cameraView)) {
    compositionParts.push(`${cameraView} camera view`)
  }
  
  if (shouldInclude(eyeDirection)) {
    // Convert to natural prompt
    const eyePrompt = eyeDirection === "Look at Camera" ? "looking directly at viewer" :
                      eyeDirection === "Look Left" ? "looking to the left" :
                      eyeDirection === "Look Right" ? "looking to the right" :
                      eyeDirection === "Look Up" ? "eyes looking upward" :
                      eyeDirection === "Look Down" ? "eyes looking downward" :
                      eyeDirection === "Look Away" ? "gaze turned away naturally" : eyeDirection
    compositionParts.push(eyePrompt)
  }
  
  if (shouldInclude(headOrientation)) {
    compositionParts.push(`head ${headOrientation.toLowerCase()}`)
  }
  
  if (compositionParts.length > 0) {
    promptParts.push(compositionParts.join(', '))
  }
  
  // Physical Traits
  const physicalParts: string[] = []
  
  if (shouldInclude(bodyType)) {
    physicalParts.push(`${bodyType} body type`)
  }
  
  if (shouldInclude(skinTone)) {
    physicalParts.push(`${skinTone} skin tone`)
  }
  
  if (shouldInclude(hairStyle)) {
    physicalParts.push(`${hairStyle} hair style`)
  }
  
  if (shouldInclude(hairColor)) {
    physicalParts.push(`${hairColor} hair`)
  }
  
  if (shouldInclude(eyeColor)) {
    physicalParts.push(`${eyeColor} eyes`)
  }
  
  if (shouldInclude(eyeShape)) {
    physicalParts.push(`${eyeShape} eye shape`)
  }
  
  if (physicalParts.length > 0) {
    promptParts.push(physicalParts.join(', '))
  }
  
  // Outfit
  const outfitParts: string[] = []
  
  if (shouldInclude(outfitCategory)) {
    outfitParts.push(`${outfitCategory} outfit`)
  }
  
  if (shouldInclude(outfitPalette)) {
    outfitParts.push(`${outfitPalette} color palette`)
  }
  
  if (shouldInclude(accessories)) {
    const validAccessories = accessories.filter(acc => shouldInclude(acc))
    if (validAccessories.length > 0) {
      outfitParts.push(`accessories: ${validAccessories.join(', ')}`)
    }
  }
  
  if (outfitParts.length > 0) {
    promptParts.push(outfitParts.join(', '))
  }
  
  // Logo placement with enhanced descriptions
  if (shouldInclude(logoPlacement) && Array.isArray(logoPlacement) && logoPlacement.length > 0) {
    const placementPrompts: Record<string, string> = {
      'Top-Right': 'logo overlay in top-right corner',
      'Bottom-Left': 'logo overlay in bottom-left corner',
      'Bottom-Right': 'logo overlay in bottom-right corner',
      'Top-Left': 'logo overlay in top-left corner',
      'On-Clothing': 'logo seamlessly integrated on the character\'s shirt or jacket as embroidered or printed design',
      'On-Hat': 'logo placed on hat, cap, or headwear as a patch or print',
      'On-Accessory': 'logo appearing on accessory, bag, or object held in hand',
      'Background-Wall': 'logo displayed on background wall or surface behind the character',
      'Center-Badge': 'logo as a centered badge or pin on the character\'s chest area'
    }
    
    const placements = logoPlacement
      .filter(p => placementPrompts[p])
      .map(p => placementPrompts[p])
    
    if (placements.length > 0) {
      let logoPrompt = `Logo appears in multiple locations: ${placements.join(', ')}`
      
      if (shouldInclude(logoDescription)) {
        logoPrompt += `. Logo style: ${logoDescription}`
      }
      
      promptParts.push(logoPrompt)
    }
  }
  
  // Join all parts with proper punctuation
  let finalPrompt = promptParts.join('. ')
  
  // Ensure proper sentence structure
  if (finalPrompt && !finalPrompt.endsWith('.')) {
    finalPrompt += '.'
  }
  
  return finalPrompt
}

/**
 * Builds a concise version of the prompt for logging/debugging
 */
export function buildAvatarPromptSummary(params: AvatarPromptParams): string {
  const {
    artDirection,
    visualInfluence,
    ageRange,
    genderExpression,
    ethnicity,
    bodyType,
    hairColor,
    eyeColor,
    outfitCategory
  } = params
  
  const summaryParts: string[] = []
  
  if (shouldInclude(artDirection)) summaryParts.push(`Style: ${artDirection}`)
  if (shouldInclude(visualInfluence)) summaryParts.push(`Influence: ${visualInfluence}`)
  if (shouldInclude(ageRange)) summaryParts.push(`Age: ${ageRange}`)
  if (shouldInclude(genderExpression)) summaryParts.push(`Gender: ${genderExpression}`)
  if (shouldInclude(ethnicity)) summaryParts.push(`Ethnicity: ${ethnicity}`)
  if (shouldInclude(bodyType)) summaryParts.push(`Body: ${bodyType}`)
  if (shouldInclude(hairColor)) summaryParts.push(`Hair: ${hairColor}`)
  if (shouldInclude(eyeColor)) summaryParts.push(`Eyes: ${eyeColor}`)
  if (shouldInclude(outfitCategory)) summaryParts.push(`Outfit: ${outfitCategory}`)
  
  return summaryParts.join(' | ')
}
