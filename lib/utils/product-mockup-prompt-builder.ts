/**
 * Product Mockup Prompt Builder Utility
 * 
 * Builds comprehensive prompts for product mockup generation by incorporating
 * all UI parameters (visual style, composition, text overlay, typography, layout)
 * into a structured prompt that Fal.ai can understand.
 */

export interface ProductMockupPromptParams {
  // Base prompt
  prompt: string
  
  // Visual Style Stack
  artDirection?: string | null
  visualInfluence?: string | null
  lightingPreset?: string | null
  backgroundEnvironment?: string | null
  moodContext?: string | null
  
  // Composition & Branding
  compositionTemplate?: string | null
  objectCount?: number | null
  shadowType?: string | null
  logoPlacement?: string[] | null
  logoDescription?: string | null
  
  // Text & CTA Overlay
  headline?: string | null
  headlineColor?: string | null
  headlineColorAuto?: boolean | null
  subtext?: string | null
  subtextColor?: string | null
  subtextColorAuto?: boolean | null
  ctaText?: string | null
  ctaColor?: string | null
  ctaColorAuto?: boolean | null
  fontFamily?: string | null
  fontWeight?: string | null
  textCase?: string | null
  letterSpacing?: number | null
  lineHeight?: number | null
  textAlignment?: string | null
  textEffects?: string[] | null
  
  // Advanced Typography
  highlightStyle?: string | null
  accentElement?: string | null
  brilliance?: number | null
  frostedGlass?: boolean | null
  dropShadowIntensity?: number | null
  motionAccent?: string | null
  
  // Alignment & Positioning
  layoutMode?: string | null
  verticalPosition?: number | null
  horizontalOffset?: number | null
  smartAnchor?: boolean | null
  safeZones?: boolean | null
  
  // Casting & Multiplicity
  useAvatars?: boolean | null
  selectedAvatarId?: string | null
  selectedAvatarData?: {
    persona_name?: string | null
    age_range?: string | null
    gender_expression?: string | null
    ethnicity?: string | null
    body_type?: string | null
    skin_tone?: string | null
    hair_style?: string | null
    hair_color?: string | null
    eye_color?: string | null
    outfit_category?: string | null
  } | null
  useBasicAvatar?: boolean | null
  basicAvatar?: {
    age?: string | null
    race?: string | null
    gender?: string | null
    description?: string | null
  } | null
  avatarRole?: string | null
  avatarInteraction?: string | null
  productMultiplicity?: string | null
  angleVarietyCount?: number | null
  
  // Platform Target
  platformTarget?: string | null
  
  // Brand Colors
  brandColors?: {
    primary?: string | null
    secondary?: string | null
    accent?: string | null
  } | null
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
    return !isNaN(value) && value !== 0
  }
  if (typeof value === 'boolean') {
    return value === true
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some(v => shouldInclude(v))
  }
  return true
}

/**
 * Builds a comprehensive product mockup generation prompt from all parameters
 */
export function buildProductMockupPrompt(params: ProductMockupPromptParams): string {
  const {
    prompt,
    artDirection,
    visualInfluence,
    lightingPreset,
    backgroundEnvironment,
    moodContext,
    compositionTemplate,
    objectCount,
    shadowType,
    logoPlacement,
    logoDescription,
    headline,
    headlineColor,
    headlineColorAuto,
    subtext,
    subtextColor,
    subtextColorAuto,
    ctaText,
    ctaColor,
    ctaColorAuto,
    fontFamily,
    fontWeight,
    textCase,
    letterSpacing,
    lineHeight,
    textAlignment,
    textEffects,
    highlightStyle,
    accentElement,
    brilliance,
    frostedGlass,
    dropShadowIntensity,
    motionAccent,
    layoutMode,
    verticalPosition,
    horizontalOffset,
    smartAnchor,
    safeZones,
    useAvatars,
    selectedAvatarId,
    selectedAvatarData,
    useBasicAvatar,
    basicAvatar,
    avatarRole,
    avatarInteraction,
    productMultiplicity,
    angleVarietyCount,
    platformTarget,
    brandColors
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
  
  // Composition & Branding
  const compositionParts: string[] = []
  
  if (shouldInclude(compositionTemplate)) {
    compositionParts.push(`${compositionTemplate} composition`)
  }
  
  if (shouldInclude(objectCount) && objectCount !== 1) {
    compositionParts.push(`${objectCount} products`)
  }
  
  if (shouldInclude(shadowType)) {
    compositionParts.push(`${shadowType.toLowerCase()} shadow`)
  }
  
  if (shouldInclude(productMultiplicity)) {
    compositionParts.push(`${productMultiplicity.toLowerCase()} product arrangement`)
  }
  
  if (compositionParts.length > 0) {
    promptParts.push(compositionParts.join(', '))
  }
  
  // Avatar Integration
  if (shouldInclude(useAvatars) && useAvatars) {
    const avatarParts: string[] = []
    
    if (shouldInclude(useBasicAvatar) && useBasicAvatar && basicAvatar) {
      const avatarDesc = [
        basicAvatar.age,
        basicAvatar.gender?.toLowerCase(),
        basicAvatar.race?.toLowerCase(),
        basicAvatar.description
      ].filter(Boolean).join(' ')
      
      if (avatarDesc) {
        avatarParts.push(`${avatarRole} (${avatarDesc})`)
      } else {
        avatarParts.push(avatarRole)
      }
    } else if (shouldInclude(selectedAvatarId) && selectedAvatarData) {
      // Use actual avatar details
      const avatarDetails = [
        selectedAvatarData.persona_name,
        selectedAvatarData.age_range,
        selectedAvatarData.gender_expression?.toLowerCase(),
        selectedAvatarData.ethnicity?.toLowerCase(),
        selectedAvatarData.body_type?.toLowerCase(),
        selectedAvatarData.skin_tone,
        selectedAvatarData.hair_color && selectedAvatarData.hair_style ? `${selectedAvatarData.hair_color} ${selectedAvatarData.hair_style} hair` : null,
        selectedAvatarData.eye_color ? `${selectedAvatarData.eye_color} eyes` : null,
        selectedAvatarData.outfit_category
      ].filter(Boolean).join(', ')
      
      if (avatarDetails) {
        avatarParts.push(`${avatarRole} (${avatarDetails})`)
      } else {
        avatarParts.push(`${avatarRole} using ${selectedAvatarData.persona_name || 'selected avatar'}`)
      }
    } else if (shouldInclude(selectedAvatarId)) {
      // Fallback if avatar data wasn't fetched
      avatarParts.push(`${avatarRole} using selected avatar`)
    } else {
      avatarParts.push(avatarRole)
    }
    
    if (shouldInclude(avatarInteraction)) {
      avatarParts.push(`${avatarInteraction.toLowerCase()} the product`)
    }
    
    if (avatarParts.length > 0) {
      promptParts.push(avatarParts.join(' '))
    }
  }
  
  // Logo Integration
  if (shouldInclude(logoPlacement) && Array.isArray(logoPlacement) && logoPlacement.length > 0) {
    const placementPrompts: Record<string, string> = {
      'Top-Right': 'logo overlay in top-right corner',
      'Bottom-Left': 'logo overlay in bottom-left corner',
      'Bottom-Right': 'logo overlay in bottom-right corner',
      'Top-Left': 'logo overlay in top-left corner',
      'On-Product': 'logo on product surface',
      'On-Packaging': 'logo on packaging/label',
      'On-Accessory': 'logo on accessory item',
      'Background-Wall': 'logo on background wall',
      'Center-Badge': 'logo as centered badge'
    }
    
    const placements = logoPlacement
      .filter(p => placementPrompts[p])
      .map(p => placementPrompts[p])
    
    if (placements.length > 0) {
      let logoPrompt = `Logo placement: ${placements.join(', ')}`
      
      if (shouldInclude(logoDescription)) {
        logoPrompt += `. Logo style: ${logoDescription}`
      }
      
      promptParts.push(logoPrompt)
    }
  }
  
  // Text Overlay
  const textParts: string[] = []
  
  if (shouldInclude(headline)) {
    const textStyle = []
    if (shouldInclude(textCase)) textStyle.push(`${textCase} case`)
    if (shouldInclude(fontFamily)) textStyle.push(`${fontFamily} font`)
    if (shouldInclude(fontWeight)) textStyle.push(`${fontWeight} weight`)
    if (shouldInclude(letterSpacing) && letterSpacing !== 0) textStyle.push(`letter-spacing: ${letterSpacing}px`)
    if (shouldInclude(lineHeight) && lineHeight !== 1.2) textStyle.push(`line-height: ${lineHeight}`)
    
    // Handle headline color
    if (shouldInclude(headlineColorAuto) && headlineColorAuto) {
      textStyle.push('auto color selection')
    } else if (shouldInclude(headlineColor) && headlineColor !== 'auto') {
      textStyle.push(`color: ${headlineColor}`)
    }
    
    const styleText = textStyle.length > 0 ? ` (${textStyle.join(', ')})` : ''
    textParts.push(`headline: "${headline}"${styleText}`)
  }
  
  if (shouldInclude(subtext)) {
    const textStyle = []
    if (shouldInclude(subtextColorAuto) && subtextColorAuto) {
      textStyle.push('auto color selection')
    } else if (shouldInclude(subtextColor) && subtextColor !== 'auto') {
      textStyle.push(`color: ${subtextColor}`)
    }
    const styleText = textStyle.length > 0 ? ` (${textStyle.join(', ')})` : ''
    textParts.push(`subtext: "${subtext}"${styleText}`)
  }
  
  if (shouldInclude(ctaText)) {
    const textStyle = []
    if (shouldInclude(ctaColorAuto) && ctaColorAuto) {
      textStyle.push('auto color selection')
    } else if (shouldInclude(ctaColor) && ctaColor !== 'auto') {
      textStyle.push(`color: ${ctaColor}`)
    }
    const styleText = textStyle.length > 0 ? ` (${textStyle.join(', ')})` : ''
    textParts.push(`CTA: "${ctaText}"${styleText}`)
  }
  
  if (textParts.length > 0) {
    promptParts.push(textParts.join(', '))
  }
  
  // Advanced Typography Effects
  const typographyParts: string[] = []
  
  if (shouldInclude(highlightStyle)) {
    typographyParts.push(`highlight style: ${highlightStyle}`)
  }
  
  if (shouldInclude(accentElement)) {
    typographyParts.push(`accent element: ${accentElement}`)
  }
  
  if (shouldInclude(brilliance) && brilliance > 0) {
    typographyParts.push(`brilliance effect: ${brilliance}%`)
  }
  
  if (shouldInclude(frostedGlass) && frostedGlass) {
    typographyParts.push('frosted glass background')
  }
  
  if (shouldInclude(dropShadowIntensity) && dropShadowIntensity > 0) {
    typographyParts.push(`drop shadow: ${dropShadowIntensity}%`)
  }
  
  if (shouldInclude(motionAccent)) {
    typographyParts.push(`motion accent: ${motionAccent}`)
  }
  
  if (typographyParts.length > 0) {
    promptParts.push(typographyParts.join(', '))
  }
  
  // Layout and Positioning
  const layoutParts: string[] = []
  
  if (shouldInclude(layoutMode)) {
    layoutParts.push(`layout mode: ${layoutMode}`)
  }
  
  if (shouldInclude(textAlignment)) {
    layoutParts.push(`text alignment: ${textAlignment}`)
  }
  
  if (shouldInclude(verticalPosition) && verticalPosition !== 50) {
    layoutParts.push(`vertical position: ${verticalPosition}%`)
  }
  
  if (shouldInclude(horizontalOffset) && horizontalOffset !== 0) {
    layoutParts.push(`horizontal offset: ${horizontalOffset}px`)
  }
  
  if (shouldInclude(smartAnchor) && smartAnchor) {
    layoutParts.push('smart anchor enabled')
  }
  
  if (shouldInclude(safeZones) && safeZones) {
    layoutParts.push('platform safe zones enabled')
  }
  
  if (layoutParts.length > 0) {
    promptParts.push(layoutParts.join(', '))
  }
  
  // Platform Optimization
  if (shouldInclude(platformTarget)) {
    promptParts.push(`optimized for ${platformTarget}`)
  }
  
  // Brand Colors
  if (shouldInclude(brandColors)) {
    const colorParts: string[] = []
    if (shouldInclude(brandColors.primary)) colorParts.push(`primary: ${brandColors.primary}`)
    if (shouldInclude(brandColors.secondary)) colorParts.push(`secondary: ${brandColors.secondary}`)
    if (shouldInclude(brandColors.accent)) colorParts.push(`accent: ${brandColors.accent}`)
    
    if (colorParts.length > 0) {
      promptParts.push(`brand colors: ${colorParts.join(', ')}`)
    }
  }
  
  // Quality and Technical Specs
  promptParts.push('high quality, professional product photography, commercial grade, detailed, sharp focus')
  promptParts.push('consistent lighting, proper exposure, clean composition, brand-appropriate styling')
  
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
export function buildProductMockupPromptSummary(params: ProductMockupPromptParams): string {
  const {
    artDirection,
    visualInfluence,
    compositionTemplate,
    objectCount,
    shadowType,
    useAvatars,
    avatarRole,
    headline,
    fontFamily,
    platformTarget
  } = params
  
  const summaryParts: string[] = []
  
  if (shouldInclude(artDirection)) summaryParts.push(`Style: ${artDirection}`)
  if (shouldInclude(visualInfluence)) summaryParts.push(`Influence: ${visualInfluence}`)
  if (shouldInclude(compositionTemplate)) summaryParts.push(`Composition: ${compositionTemplate}`)
  if (shouldInclude(objectCount) && objectCount !== 1) summaryParts.push(`Objects: ${objectCount}`)
  if (shouldInclude(shadowType)) summaryParts.push(`Shadow: ${shadowType}`)
  if (shouldInclude(useAvatars) && useAvatars) summaryParts.push(`Avatar: ${avatarRole}`)
  if (shouldInclude(headline)) summaryParts.push(`Headline: ${headline}`)
  if (shouldInclude(fontFamily)) summaryParts.push(`Font: ${fontFamily}`)
  if (shouldInclude(platformTarget)) summaryParts.push(`Platform: ${platformTarget}`)
  
  return summaryParts.join(' | ')
}
