/**
 * Chart Prompt Builder Utility
 * 
 * Builds comprehensive prompts for chart generation by incorporating
 * all UI parameters (data, purpose, style, mood, branding, annotations, layout, narrative)
 * into structured prompts for both Code Interpreter and GPT Image enhancement.
 */

export interface ChartPromptParams {
  // Data Source & Content
  prompt: string
  dataSource?: string | null
  textData?: string | null
  autoDetected?: boolean
  aggregationType?: string | null
  units?: string | null
  labels?: string | null
  
  // Purpose & Chart Configuration
  purpose?: string | null
  chartType?: string | null
  axisMapping?: Record<string, string>
  multiSeries?: boolean
  orientation?: string | null
  
  // Visual Style
  artDirection?: string | null
  visualInfluence?: string | null
  chartDepth?: number
  backgroundTexture?: string | null
  accentShapes?: boolean
  
  // Mood & Atmosphere
  moodContext?: string | null
  toneIntensity?: number
  lightingTemperature?: number
  motionAccent?: string | null
  
  // Branding
  brandSync?: boolean
  paletteMode?: string | null
  backgroundType?: string | null
  fontFamily?: string | null
  logoPlacement?: string[]
  logoDescription?: string | null
  colorPalette?: string | null
  
  // Annotations & Labels
  dataLabels?: boolean
  labelPlacement?: string | null
  legends?: string | null
  callouts?: boolean
  calloutThreshold?: number
  tooltipStyle?: string | null
  axisTitles?: string | null
  gridlines?: string | null
  
  // Layout
  layoutTemplate?: string | null
  aspectRatio?: string | null
  marginDensity?: number
  safeZoneOverlay?: boolean
  exportPreset?: string | null
  
  // Multiple Variants
  generateVariants?: boolean
  
  // Narrative
  headline?: string | null
  caption?: string | null
  tone?: string | null
  platform?: string | null
}

/**
 * Helper function to check if a value should be included in the prompt
 */
function shouldInclude(value: any): boolean {
  if (value === null || value === undefined) {
    return false
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase()
    return trimmed.length > 0 && 
           trimmed !== 'none' && 
           trimmed !== 'auto' && 
           trimmed !== 'default'
  }
  
  if (Array.isArray(value)) {
    return value.length > 0
  }
  
  if (typeof value === 'boolean') {
    return true
  }
  
  if (typeof value === 'number') {
    return !isNaN(value)
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length > 0
  }
  
  return true
}

/**
 * Builds a prompt for OpenAI Code Interpreter to generate the raw chart
 * This focuses on data accuracy and basic chart structure
 */
export function buildCodeInterpreterPrompt(params: ChartPromptParams): string {
  const {
    prompt,
    textData,
    dataSource,
    aggregationType,
    units,
    labels,
    purpose,
    chartType,
    artDirection,
    colorPalette,
    exportPreset,
    multiSeries,
    orientation,
    dataLabels,
    legends,
    gridlines,
    callouts,
    calloutThreshold,
    axisTitles,
    headline,
    caption
  } = params

  const promptParts: string[] = []

  // Base instruction
  promptParts.push("You are a data visualization expert. Write Python code to create a clear, accurate chart using matplotlib and seaborn.")
  promptParts.push("")
  promptParts.push("IMPORTANT: DO NOT save any files. Just write and test the code, then return the complete working code.")
  promptParts.push("")

  // Data source instruction
  if (dataSource === 'file') {
    promptParts.push("# Your Task")
    promptParts.push("Write Python code to create a professional data visualization from the uploaded file.")
    promptParts.push("")
    promptParts.push("## CRITICAL REQUIREMENT")
    promptParts.push("Write Python code that creates a professional chart.")
    promptParts.push("DO NOT call plt.savefig() or save any files.")
    promptParts.push("Just create the visualization and return the complete working code.")
    promptParts.push("")
    promptParts.push("## Steps")
    promptParts.push("1. Read the uploaded data file (detect format: CSV, Excel, JSON, etc.)")
    promptParts.push("2. Analyze the data to understand its structure")
    promptParts.push("3. Create a clear, professional chart using matplotlib/seaborn")
    promptParts.push("4. Choose the best chart type for this data")
    promptParts.push("5. **CREATE THE CHART** using matplotlib/seaborn")
    promptParts.push("")
    
    if (shouldInclude(prompt)) {
      promptParts.push("## Question to Answer")
      promptParts.push(prompt)
      promptParts.push("")
    }
    
    promptParts.push("## FINAL STEP - DO NOT SKIP")
    promptParts.push("After creating your chart, you MUST:")
    promptParts.push("1. Test that the code runs without errors")
    promptParts.push("2. Return the complete working Python code")
    promptParts.push("3. DO NOT call plt.savefig() or plt.show()")
    promptParts.push("")
    promptParts.push("## CODE OUTPUT REQUIREMENT")
    promptParts.push("Return the complete, working Python code that creates the chart.")
    promptParts.push("The code should be ready to execute and will be run in a separate environment.")
  } else if (textData || prompt) {
    promptParts.push("# Your Task")
    promptParts.push("Write Python code to create a professional data visualization that answers this question or shows this data:")
    promptParts.push("")
    promptParts.push("## Data")
    promptParts.push(textData || prompt)
    promptParts.push("")
    promptParts.push("## CRITICAL REQUIREMENT")
    promptParts.push("Write Python code that creates a professional chart.")
    promptParts.push("DO NOT call plt.savefig() or save any files.")
    promptParts.push("Just create the visualization and return the complete working code.")
    promptParts.push("")
    promptParts.push("## Steps")
    promptParts.push("1. Analyze the data structure (detect if it's a markdown table, CSV, JSON, etc.)")
    promptParts.push("2. Parse the data appropriately")
    promptParts.push("3. Create a clear, professional chart using matplotlib/seaborn")
    promptParts.push("4. Choose the best chart type for this data (bar, line, pie, scatter, etc.)")
    promptParts.push("5. **CREATE THE CHART** using matplotlib/seaborn")
    promptParts.push("")
    promptParts.push("## FINAL STEP - DO NOT SKIP")
    promptParts.push("After creating your chart, you MUST:")
    promptParts.push("1. Test that the code runs without errors")
    promptParts.push("2. Return the complete working Python code")
    promptParts.push("3. DO NOT call plt.savefig() or plt.show()")
    promptParts.push("")
    promptParts.push("## CODE OUTPUT REQUIREMENT")
    promptParts.push("Return the complete, working Python code that creates the chart.")
    promptParts.push("The code should be ready to execute and will be run in a separate environment.")
  }
  promptParts.push("")

  // Add optional context (keep it minimal)
  const contextParts: string[] = []

  if (shouldInclude(chartType)) {
    contextParts.push(`Suggested chart type: ${chartType}`)
  }

  if (shouldInclude(artDirection)) {
    contextParts.push(`Visual style: ${artDirection}`)
  }

  if (shouldInclude(colorPalette)) {
    contextParts.push(`Color palette: ${colorPalette}`)
  }

  if (shouldInclude(exportPreset)) {
    contextParts.push(`Export format: ${exportPreset}`)
  }

  if (contextParts.length > 0) {
    promptParts.push("## Optional Preferences (use if appropriate)")
    promptParts.push(...contextParts)
    promptParts.push("")
  }




  return promptParts.join('\n')
}

/**
 * Builds an enhancement prompt for GPT Image 1 to transform the raw chart
 * This focuses on visual beauty, style, and brand alignment
 */
export function buildEnhancementPrompt(params: ChartPromptParams): string {
  const {
    prompt,
    artDirection,
    visualInfluence,
    chartDepth,
    backgroundTexture,
    accentShapes,
    moodContext,
    toneIntensity,
    lightingTemperature,
    motionAccent,
    brandSync,
    paletteMode,
    backgroundType,
    fontFamily,
    logoPlacement,
    logoDescription,
    colorPalette,
    layoutTemplate,
    marginDensity,
    exportPreset,
    tone,
    platform
  } = params

  const promptParts: string[] = []

  // Base instruction
  promptParts.push("Transform this data visualization into a stunning, professional chart image.")
  promptParts.push("")

  // Original context
  if (shouldInclude(prompt)) {
    promptParts.push(`Context: ${prompt}`)
    promptParts.push("")
  }

  // Art direction and style
  if (shouldInclude(artDirection) || shouldInclude(visualInfluence)) {
    promptParts.push("# Visual Style")
    if (shouldInclude(artDirection)) {
      promptParts.push(`Art Direction: ${artDirection}`)
    }
    if (shouldInclude(visualInfluence)) {
      promptParts.push(`Visual Influence: ${visualInfluence}`)
    }
    if (shouldInclude(chartDepth) && chartDepth > 30) {
      const depthLevel = chartDepth < 50 ? 'subtle' : chartDepth < 75 ? 'moderate' : 'pronounced'
      promptParts.push(`3D Depth: ${depthLevel} depth and lighting effects`)
    }
    if (shouldInclude(backgroundTexture)) {
      const { TEXTURE_OPTIONS } = require('@/lib/styles/chart-style-map')
      const textureOption = TEXTURE_OPTIONS[backgroundTexture]
      if (textureOption) {
        promptParts.push(`Background Texture: ${backgroundTexture} texture - ${textureOption.description}`)
      } else {
        promptParts.push(`Background Texture: ${backgroundTexture} texture`)
      }
    }
    if (accentShapes) {
      promptParts.push("Add decorative accent shapes that complement the data visualization")
    }
    promptParts.push("")
  }

  // Mood and atmosphere
  if (shouldInclude(moodContext)) {
    promptParts.push("# Mood & Atmosphere")
    promptParts.push(`Mood: ${moodContext}`)
    if (shouldInclude(toneIntensity) && toneIntensity !== 50) {
      const intensity = toneIntensity < 30 ? 'subtle' : toneIntensity < 70 ? 'balanced' : 'bold and dramatic'
      promptParts.push(`Tone Intensity: ${intensity}`)
    }
    if (shouldInclude(lightingTemperature) && lightingTemperature !== 50) {
      const temp = lightingTemperature < 40 ? 'cool, blue-tinted' : lightingTemperature < 60 ? 'neutral' : 'warm, golden'
      promptParts.push(`Lighting: ${temp} lighting`)
    }
    if (shouldInclude(motionAccent) && motionAccent !== 'none') {
      promptParts.push(`Motion Effect: ${motionAccent} motion blur or dynamic elements`)
    }
    promptParts.push("")
  }

  // Branding and colors
  const brandingParts: string[] = []
  if (brandSync) {
    brandingParts.push("Apply cohesive brand styling throughout")
  }
  if (shouldInclude(paletteMode)) {
    const paletteDesc = paletteMode === 'categorical' 
      ? 'distinct colors for each category'
      : paletteMode === 'sequential'
      ? 'gradual color progression'
      : 'diverging color scheme from negative to positive'
    brandingParts.push(`Color Palette: ${paletteDesc}`)
  }
  if (shouldInclude(backgroundType)) {
    brandingParts.push(`Background: ${backgroundType} background`)
  }
  if (shouldInclude(fontFamily)) {
    brandingParts.push(`Typography: ${fontFamily} font family`)
  }
  
  // Logo placement with enhanced descriptions
  if (shouldInclude(logoPlacement) && Array.isArray(logoPlacement) && logoPlacement.length > 0) {
    const placementPrompts: Record<string, string> = {
      'top-right': 'logo overlay in top-right corner',
      'bottom-left': 'logo overlay in bottom-left corner',
      'bottom-right': 'logo overlay in bottom-right corner',
      'top-left': 'logo overlay in top-left corner',
      'on-chart': 'logo seamlessly integrated on the chart area as watermark or overlay',
      'on-title': 'logo placed near or integrated with the chart title',
      'on-legend': 'logo appearing on or near the legend area',
      'background': 'logo displayed subtly on the background',
      'center-badge': 'logo as a centered badge or watermark'
    }
    
    const placements = logoPlacement
      .filter(p => placementPrompts[p])
      .map(p => placementPrompts[p])
    
    if (placements.length > 0) {
      let logoPrompt = `Logo appears in multiple locations: ${placements.join(', ')}`
      
      if (shouldInclude(logoDescription)) {
        logoPrompt += `. Logo style: ${logoDescription}`
      }
      
      brandingParts.push(logoPrompt)
    }
  } else if (shouldInclude(logoDescription)) {
    brandingParts.push(`Logo: Incorporate logo - ${logoDescription}`)
  }
  if (shouldInclude(colorPalette)) {
    // Import COLOR_PALETTES to get the actual colors
    const { COLOR_PALETTES } = require('@/lib/styles/chart-style-map')
    const palette = COLOR_PALETTES[colorPalette]
    if (palette) {
      brandingParts.push(`Color Palette: Use ${colorPalette} palette - ${palette.colors.join(', ')}`)
    }
  }
  
  // Handle new background options
  if (shouldInclude(backgroundType)) {
    const { BACKGROUND_OPTIONS } = require('@/lib/styles/chart-style-map')
    const backgroundOption = BACKGROUND_OPTIONS[backgroundType]
    if (backgroundOption) {
      if (backgroundOption.type === 'solid') {
        brandingParts.push(`Background: ${backgroundType} solid color background`)
      } else if (backgroundOption.type === 'gradient') {
        brandingParts.push(`Background: ${backgroundType} gradient background`)
      } else if (backgroundOption.type === 'pattern') {
        brandingParts.push(`Background: ${backgroundType} pattern background`)
      } else if (backgroundOption.type === 'themed') {
        brandingParts.push(`Background: ${backgroundType} themed background`)
      }
    }
  }
  if (brandingParts.length > 0) {
    promptParts.push("# Branding & Colors")
    promptParts.push(...brandingParts)
    promptParts.push("")
  }

  // Layout and composition
  const layoutParts: string[] = []
  if (shouldInclude(layoutTemplate)) {
    layoutParts.push(`Layout Template: ${layoutTemplate} composition`)
  }
  if (shouldInclude(marginDensity) && marginDensity !== 50) {
    const density = marginDensity < 30 ? 'tight, compact' : marginDensity < 70 ? 'balanced' : 'spacious, airy'
    layoutParts.push(`Spacing: ${density} margins and padding`)
  }
  if (shouldInclude(exportPreset)) {
    // Import EXPORT_PRESETS to get the optimization details
    const { EXPORT_PRESETS } = require('@/lib/styles/chart-style-map')
    const preset = EXPORT_PRESETS[exportPreset]
    if (preset) {
      layoutParts.push(`Export Format: ${exportPreset} - ${preset.description}`)
      layoutParts.push(`Dimensions: ${preset.width}×${preset.height} pixels`)
      layoutParts.push(`Optimization: ${preset.optimize} style`)
    }
  }
  if (layoutParts.length > 0) {
    promptParts.push("# Layout & Composition")
    promptParts.push(...layoutParts)
    promptParts.push("")
  }

  // Platform optimization
  if (shouldInclude(platform) || shouldInclude(tone)) {
    promptParts.push("# Content Optimization")
    if (shouldInclude(platform)) {
      const platformOptimization = platform === 'instagram' 
        ? 'Instagram-friendly with vibrant colors and bold text'
        : platform === 'linkedin'
        ? 'LinkedIn-professional with corporate styling'
        : platform === 'story'
        ? 'Story format optimized for mobile viewing'
        : platform === 'pdf'
        ? 'Print-ready with high contrast'
        : 'Web-optimized with balanced colors'
      promptParts.push(platformOptimization)
    }
    if (shouldInclude(tone)) {
      promptParts.push(`Tone: ${tone} presentation style`)
    }
    promptParts.push("")
  }

  // Critical requirements
  promptParts.push("# CRITICAL REQUIREMENTS")
  promptParts.push("✓ Preserve ALL data accuracy - do not change numbers, labels, or values")
  promptParts.push("✓ Maintain chart structure and data relationships")
  promptParts.push("✓ Keep all text legible and properly sized")
  promptParts.push("✓ Enhance visual appeal while preserving information integrity")
  promptParts.push("✓ Apply professional design principles and best practices")

  return promptParts.join('\n')
}

/**
 * Helper function to validate chart parameters
 */
export function validateChartParams(params: ChartPromptParams): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!params.prompt && !params.textData) {
    errors.push("Either prompt or textData is required")
  }

  if (params.dataSource === 'csv' && !params.textData && !params.prompt) {
    errors.push("Data description is required when using CSV source")
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

