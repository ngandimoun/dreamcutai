import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { STYLE_MAP } from '@/lib/styles/style-map'
import { ProductMockupGenerationRequest, ProductMockupGenerationResult } from '@/lib/types/product-mockup'
import { downloadAndUploadMultipleImages } from '@/lib/storage/download-and-upload'
import { generateWithFal, downloadImage } from '@/lib/utils/fal-generation'
import { validateImageFiles, validateImageUrls } from '@/lib/utils/image-validation'
import { sanitizeFilename } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import { buildProductMockupPrompt } from '@/lib/utils/product-mockup-prompt-builder'

// Helper function to convert null to undefined
const nullToUndefined = (value: string | null): string | undefined => {
  return value === null ? undefined : value
}


// Validation schema for product mockup generation
const productMockupGenerationSchema = z.object({
  // Basic Settings
  prompt: z.string().min(1).max(5000), // Increased to support detailed prompts
  imageCount: z.number().min(1).max(4).default(4),
  aspectRatio: z.enum(['1:1', '4:5', '16:9', '9:16', '2:1', '3:4', '2:3', '4:3', '3:2']).default('1:1'),
  
  // Product Photos (will be handled as base64 strings)
  productPhotos: z.array(z.string()).max(4).optional().default([]), // base64 encoded images
  
  // Logo Upload
  logoFile: z.string().optional(), // base64 encoded logo
  logoUsagePrompt: z.string().max(500).optional(),
  
  // Art Direction & Visual Influence
  artDirection: z.string().optional(),
  visualInfluence: z.string().optional(),
  lightingPreset: z.string().optional(),
  backgroundEnvironment: z.string().optional(),
  moodContext: z.string().optional(),
  
  // Composition & Branding
  compositionTemplate: z.enum(['Centered Hero', 'Rule of Thirds', 'Floating Object', 'Flat Lay', 'Collage']).default('Centered Hero'),
  objectCount: z.union([z.number(), z.enum(['1', '2', '3'])]).default(1).transform(val => typeof val === 'number' ? val as 1 | 2 | 3 : parseInt(val) as 1 | 2 | 3),
  shadowType: z.enum(['Soft', 'Hard', 'Floating', 'Mirror']).default('Soft'),
  logoPlacement: z.array(z.string()).default([]),
  logoDescription: z.string().optional(),
  
  // Text & CTA Overlay
  headline: z.string().optional(),
  headlineColor: z.string().default('#000000'),
  headlineColorAuto: z.boolean().default(true),
  subtext: z.string().optional(),
  subtextColor: z.string().default('#666666'),
  subtextColorAuto: z.boolean().default(true),
  ctaText: z.string().optional(),
  ctaColor: z.string().default('#3B82F6'),
  ctaColorAuto: z.boolean().default(true),
  fontFamily: z.enum(['serif', 'sans', 'condensed', 'rounded']).default('sans'),
  fontWeight: z.enum(['light', 'normal', 'medium', 'bold']).default('normal'),
  textCase: z.enum(['uppercase', 'title', 'sentence']).default('sentence'),
  letterSpacing: z.number().default(0),
  lineHeight: z.number().default(1.2),
  textAlignment: z.enum(['left', 'center', 'right']).default('center'),
  textEffects: z.array(z.string()).default([]),
  
  // Advanced Typography
  highlightStyle: z.enum(['underline', 'boxed', 'glow', 'gradient', 'none']).default('none'),
  accentElement: z.enum(['line', 'shape', 'dot', 'none']).default('none'),
  brilliance: z.number().default(0),
  frostedGlass: z.boolean().default(false),
  dropShadowIntensity: z.number().default(0),
  motionAccent: z.enum(['fade', 'slide', 'sweep', 'none']).default('none'),
  
  // Alignment & Positioning
  layoutMode: z.enum(['centered', 'left', 'right', 'split']).default('centered'),
  verticalPosition: z.number().default(50),
  horizontalOffset: z.number().default(0),
  smartAnchor: z.boolean().default(true),
  safeZones: z.boolean().default(true),
  
  // Casting & Multiplicity
  useAvatars: z.boolean().default(false),
  selectedAvatarId: z.string().optional(),
  useBasicAvatar: z.boolean().optional(),
  basicAvatar: z.object({
    age: z.enum(['18-25', '26-35', '36-45', '46-55', '55+']),
    race: z.enum(['Caucasian', 'African', 'Asian', 'Hispanic', 'Middle Eastern', 'Mixed', 'Other']),
    gender: z.enum(['Male', 'Female', 'Non-binary']),
    description: z.string().max(500).optional()
  }).optional(),
  avatarRole: z.enum(['Model', 'User', 'Mascot', 'Spokesperson']).default('Model'),
  avatarInteraction: z.enum(['Holding', 'Wearing', 'Using', 'Observing']).default('Holding'),
  productMultiplicity: z.enum(['Single', 'Lineup', 'Bundle']).default('Single'),
  angleVarietyCount: z.union([z.number(), z.enum(['1', '2', '3', '4', '5'])]).default(1).transform(val => typeof val === 'number' ? val as 1 | 2 | 3 | 4 | 5 : parseInt(val) as 1 | 2 | 3 | 4 | 5),
  
  // Platform Target
  platformTarget: z.enum(['Instagram', 'Facebook', 'TikTok', 'YouTube', 'Banner', 'Print']).optional(),
  
  // Brand Colors
  brandColors: z.object({
    primary: z.string().default('#3B82F6'),
    secondary: z.string().default('#10B981'),
    accent: z.string().default('#F59E0B')
  }).optional(),
  
  // Metadata
  metadata: z.record(z.any()).optional()
})


// Convert aspect ratio to dimensions
function getImageDimensions(aspectRatio: string): { width: number; height: number } {
  const ratioMap: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '4:5': { width: 1024, height: 1280 },
    '16:9': { width: 1920, height: 1080 },
    '9:16': { width: 1080, height: 1920 },
    '2:1': { width: 1920, height: 960 },
    '3:4': { width: 1024, height: 1365 },
    '2:3': { width: 1024, height: 1536 },
    '4:3': { width: 1365, height: 1024 },
    '3:2': { width: 1536, height: 1024 }
  }
  
  return ratioMap[aspectRatio] || { width: 1024, height: 1024 }
}

// POST /api/product-mockup-generation - Generate product mockups
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Product mockup generation API called')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data instead of JSON
    const formData = await request.formData()
    
    // Extract form fields
    const prompt = formData.get('prompt')?.toString() || ''
    const title = formData.get('title')?.toString() || ''
    const description = formData.get('description')?.toString() || ''
    const model = 'Nano-banana' // Hardcoded for product mockup generation
    const aspectRatio = formData.get('aspectRatio')?.toString() || '1:1'
    const artDirection = formData.get('artDirection')?.toString() || null
    const visualInfluence = formData.get('visualInfluence')?.toString() || null
    const lightingPreset = formData.get('lightingPreset')?.toString() || null
    const backgroundEnvironment = formData.get('backgroundEnvironment')?.toString() || null
    const moodContext = formData.get('moodContext')?.toString() || null
    const compositionTemplate = formData.get('compositionTemplate')?.toString() || 'Centered Hero'
    const objectCount = parseInt(formData.get('objectCount')?.toString() || '1') as 1 | 2 | 3
    const shadowType = formData.get('shadowType')?.toString() || 'Soft'
    const logoPlacement = formData.get('logoPlacement')?.toString() 
      ? JSON.parse(formData.get('logoPlacement')?.toString() || '[]') 
      : []
    const logoDescription = formData.get('logoDescription')?.toString() || null
    const headline = formData.get('headline')?.toString() || null
    const headlineColor = formData.get('headlineColor')?.toString() || '#000000'
    const headlineColorAuto = formData.get('headlineColorAuto')?.toString() === 'true'
    const subtext = formData.get('subtext')?.toString() || null
    const subtextColor = formData.get('subtextColor')?.toString() || '#666666'
    const subtextColorAuto = formData.get('subtextColorAuto')?.toString() === 'true'
    const ctaText = formData.get('ctaText')?.toString() || null
    const ctaColor = formData.get('ctaColor')?.toString() || '#3B82F6'
    const ctaColorAuto = formData.get('ctaColorAuto')?.toString() === 'true'
    const fontFamily = formData.get('fontFamily')?.toString() || 'sans'
    const fontWeight = formData.get('fontWeight')?.toString() || 'normal'
    const textCase = formData.get('textCase')?.toString() || 'sentence'
    const letterSpacing = parseFloat(formData.get('letterSpacing')?.toString() || '0')
    const lineHeight = parseFloat(formData.get('lineHeight')?.toString() || '1.2')
    const textAlignment = formData.get('textAlignment')?.toString() || 'center'
    const textEffects = formData.get('textEffects')?.toString() ? JSON.parse(formData.get('textEffects')?.toString() || '[]') : []
    const highlightStyle = formData.get('highlightStyle')?.toString() || 'none'
    const accentElement = formData.get('accentElement')?.toString() || 'none'
    const brilliance = parseInt(formData.get('brilliance')?.toString() || '0')
    const frostedGlass = formData.get('frostedGlass')?.toString() === 'true'
    const dropShadowIntensity = parseInt(formData.get('dropShadowIntensity')?.toString() || '0')
    const motionAccent = formData.get('motionAccent')?.toString() || 'none'
    const layoutMode = formData.get('layoutMode')?.toString() || 'centered'
    const verticalPosition = parseInt(formData.get('verticalPosition')?.toString() || '50')
    const horizontalOffset = parseInt(formData.get('horizontalOffset')?.toString() || '0')
    const smartAnchor = formData.get('smartAnchor')?.toString() === 'true'
    const safeZones = formData.get('safeZones')?.toString() === 'true'
    const useAvatars = formData.get('useAvatars')?.toString() === 'true'
    const selectedAvatarId = formData.get('selectedAvatarId')?.toString() || null
    const useBasicAvatar = formData.get('useBasicAvatar')?.toString() === 'true'
    const basicAvatar = formData.get('basicAvatar')?.toString() ? JSON.parse(formData.get('basicAvatar')?.toString() || '{}') : null

    // Fetch selected avatar data if provided
    let selectedAvatarData = null
    if (selectedAvatarId && selectedAvatarId !== '') {
      const { data: avatarData, error: avatarError } = await supabase
        .from('avatars_personas')
        .select('id, persona_name, generated_images, storage_paths, content, age_range, gender_expression, ethnicity, body_type, skin_tone, hair_style, hair_color, eye_color, outfit_category')
        .eq('id', selectedAvatarId)
        .eq('user_id', user.id)
        .single()
      
      if (!avatarError && avatarData) {
        selectedAvatarData = avatarData
        console.log('✅ Fetched avatar data:', avatarData.persona_name)
      } else {
        console.warn('⚠️ Could not fetch avatar data:', avatarError)
      }
    }
    const avatarRole = formData.get('avatarRole')?.toString() || 'Model'
    const avatarInteraction = formData.get('avatarInteraction')?.toString() || 'Holding'
    const productMultiplicity = formData.get('productMultiplicity')?.toString() || 'Single'
    const angleVarietyCount = parseInt(formData.get('angleVarietyCount')?.toString() || '1') as 1 | 2 | 3 | 4 | 5
    const platformTarget = formData.get('platformTarget')?.toString() || null
    const brandColors = formData.get('brandColors')?.toString() ? JSON.parse(formData.get('brandColors')?.toString() || '{}') : { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B' }
    const metadata = formData.get('metadata')?.toString() ? JSON.parse(formData.get('metadata')?.toString() || '{}') : {}

    // Extract custom field values
    const custom_art_direction = formData.get('custom_art_direction')?.toString() || null
    const custom_composition = formData.get('custom_composition')?.toString() || null
    const custom_object_count = formData.get('custom_object_count')?.toString() || null
    const custom_shadow = formData.get('custom_shadow')?.toString() || null
    const custom_font = formData.get('custom_font')?.toString() || null
    const custom_weight = formData.get('custom_weight')?.toString() || null
    const custom_text_effects = formData.get('custom_text_effects')?.toString() || null
    const custom_text_case = formData.get('custom_text_case')?.toString() || null
    const custom_highlight_style = formData.get('custom_highlight_style')?.toString() || null
    const custom_accent_element = formData.get('custom_accent_element')?.toString() || null
    const custom_motion_accent = formData.get('custom_motion_accent')?.toString() || null
    const custom_layout_mode = formData.get('custom_layout_mode')?.toString() || null
    const custom_product_count = formData.get('custom_product_count')?.toString() || null
    const custom_platform = formData.get('custom_platform')?.toString() || null

    // Handle product photos upload
    const productPhotosPaths: string[] = []
    const productPhotos: File[] = []
    
    for (let i = 0; i < 2; i++) {
      const file = formData.get(`productPhoto_${i}`) as File | null
      if (file) {
        productPhotos.push(file)
      }
    }

    // Validate uploaded product photos
    if (productPhotos.length > 0) {
      const validation = await validateImageFiles(productPhotos)
      if (!validation.valid) {
        return NextResponse.json({ 
          error: `Invalid product photos: ${validation.errors.join(', ')}` 
        }, { status: 400 })
      }
    }

    // Upload validated product photos
    for (const file of productPhotos) {
      const sanitizedName = sanitizeFilename(file.name)
      const filePath = `renders/product-mockups/${user.id}/references/${uuidv4()}-${sanitizedName}`
      const { error: uploadError } = await supabase.storage
        .from('dreamcut')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error(`Error uploading product photo ${file.name}:`, uploadError)
        return NextResponse.json({ error: `Failed to upload product photo: ${uploadError.message}` }, { status: 500 })
      }
      productPhotosPaths.push(filePath)
    }

    // Handle logo upload
    let logoImagePath: string | null = null
    const logoFile = formData.get('logoFile') as File | null
    if (logoFile) {
      // Validate logo image
      const logoValidation = await validateImageFiles([logoFile])
      if (!logoValidation.valid) {
        return NextResponse.json({ 
          error: `Invalid logo image: ${logoValidation.errors.join(', ')}` 
        }, { status: 400 })
      }

      const sanitizedName = sanitizeFilename(logoFile.name)
      const filePath = `renders/product-mockups/${user.id}/logo/${uuidv4()}-${sanitizedName}`
      const { error: uploadError } = await supabase.storage
        .from('dreamcut')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Error uploading logo file:', uploadError)
        return NextResponse.json({ error: `Failed to upload logo: ${uploadError.message}` }, { status: 500 })
      }
      logoImagePath = filePath
    }

    // Create validated data object for compatibility with existing code
    const validatedData: ProductMockupGenerationRequest = {
      prompt,
      aspectRatio: aspectRatio as any,
      artDirection: nullToUndefined(artDirection),
      visualInfluence: nullToUndefined(visualInfluence),
      lightingPreset: nullToUndefined(lightingPreset),
      backgroundEnvironment: nullToUndefined(backgroundEnvironment),
      moodContext: nullToUndefined(moodContext),
      compositionTemplate: compositionTemplate as any,
      objectCount,
      shadowType: shadowType as any,
      logoPlacement: logoPlacement as any,
      logoDescription: nullToUndefined(logoDescription),
      headline: nullToUndefined(headline),
      headlineColor,
      headlineColorAuto,
      subtext: nullToUndefined(subtext),
      subtextColor,
      subtextColorAuto,
      ctaText: nullToUndefined(ctaText),
      ctaColor,
      ctaColorAuto,
      fontFamily: fontFamily as any,
      fontWeight: fontWeight as any,
      textCase: textCase as any,
      letterSpacing,
      lineHeight,
      textAlignment: textAlignment as any,
      textEffects,
      highlightStyle: highlightStyle as any,
      accentElement: accentElement as any,
      brilliance,
      frostedGlass,
      dropShadowIntensity,
      motionAccent: motionAccent as any,
      layoutMode: layoutMode as any,
      verticalPosition,
      horizontalOffset,
      smartAnchor,
      safeZones,
      useAvatars,
      selectedAvatarId: nullToUndefined(selectedAvatarId),
      useBasicAvatar,
      basicAvatar,
      avatarRole: avatarRole as any,
      avatarInteraction: avatarInteraction as any,
      productMultiplicity: productMultiplicity as any,
      angleVarietyCount,
      platformTarget: nullToUndefined(platformTarget) as any,
      brandColors,
      metadata
    }

    console.log('📝 Product mockup generation data:', {
      prompt: validatedData.prompt,
      aspectRatio: validatedData.aspectRatio,
      artDirection: validatedData.artDirection,
      visualInfluence: validatedData.visualInfluence,
      useAvatars: validatedData.useAvatars,
      productPhotos: productPhotosPaths.length
    })

    // Build comprehensive prompt
    const fullPrompt = buildProductMockupPrompt({
      ...validatedData,
      selectedAvatarData: selectedAvatarData ? {
        persona_name: selectedAvatarData.persona_name,
        age_range: selectedAvatarData.age_range,
        gender_expression: selectedAvatarData.gender_expression,
        ethnicity: selectedAvatarData.ethnicity,
        body_type: selectedAvatarData.body_type,
        skin_tone: selectedAvatarData.skin_tone,
        hair_style: selectedAvatarData.hair_style,
        hair_color: selectedAvatarData.hair_color,
        eye_color: selectedAvatarData.eye_color,
        outfit_category: selectedAvatarData.outfit_category
      } : null
    })
    console.log('📏 Full prompt length:', fullPrompt.length, 'characters')
    
    // Get image dimensions
    const dimensions = getImageDimensions(validatedData.aspectRatio)
    console.log('📐 Image dimensions:', dimensions)

    // Get signed URLs for uploaded images (required for private bucket)
    const inputImageUrls: string[] = []
    
    // Add logo image first if present
    if (logoImagePath) {
      const { data } = await supabase.storage
        .from('dreamcut')
        .createSignedUrl(logoImagePath, 86400) // 24 hour expiry
      if (data?.signedUrl) inputImageUrls.push(data.signedUrl)
    }
    
    // Add product photos
    for (const path of productPhotosPaths) {
      const { data } = await supabase.storage
        .from('dreamcut')
        .createSignedUrl(path, 86400) // 24 hour expiry
      if (data?.signedUrl) inputImageUrls.push(data.signedUrl)
    }

    // Add selected avatar image as reference if available
    if (selectedAvatarData && selectedAvatarData.storage_paths && selectedAvatarData.storage_paths.length > 0) {
      // Get first generated avatar image
      const avatarImagePath = selectedAvatarData.storage_paths[0]
      const { data } = await supabase.storage
        .from('dreamcut')
        .createSignedUrl(avatarImagePath, 86400)
      if (data?.signedUrl) {
        inputImageUrls.push(data.signedUrl)
        console.log('✅ Added avatar image as reference')
      }
    }

    // Validate that all image URLs are accessible
    if (inputImageUrls.length > 0) {
      const urlValidation = await validateImageUrls(inputImageUrls)
      if (!urlValidation.accessible) {
        throw new Error(`Reference images are not accessible: ${urlValidation.errors.join(', ')}`)
      }
    }

    console.log('🤖 Using model:', model)
    console.log('⏳ Calling fal.ai API...')
    const startTime = Date.now()

    // Generate images using fal.ai
    const generationResult = await generateWithFal({
      prompt: fullPrompt,
      aspectRatio,
      numImages: 1, // Generate product mockup
      model: model as any,
      hasImages: inputImageUrls.length > 0,
      imageUrls: inputImageUrls
    })

    const endTime = Date.now()
    console.log(`✅ fal.ai API completed in ${endTime - startTime}ms`)

    if (!generationResult.success) {
      throw new Error(generationResult.error || 'Generation failed')
    }

    // Extract image URLs
    const imageUrls = generationResult.images
    console.log('📊 Generated', imageUrls.length, 'images')
    console.log('🔗 Extracted image URLs:', imageUrls)

    // Generate unique ID for this generation
    const generationId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Download and upload images to Supabase Storage
    console.log('📥 Downloading and uploading images to Supabase Storage...')
    const uploadResults = await downloadAndUploadMultipleImages(
      imageUrls,
      `renders/product-mockups/${user.id}`,
      generationId,
      'image/png'
    )

    // Check if all uploads were successful
    const failedUploads = uploadResults.filter(result => !result.success)
    if (failedUploads.length > 0) {
      console.error('❌ Some uploads failed:', failedUploads)
      return NextResponse.json({ 
        error: 'Failed to upload some images to storage',
        details: failedUploads.map(f => f.error)
      }, { status: 500 })
    }

    // Extract storage paths from successful uploads
    const storagePaths = uploadResults
      .filter(result => result.success)
      .map(result => result.storagePath!)
    
    console.log('✅ All images uploaded successfully:', storagePaths)

    // Build comprehensive metadata
    const generationTimestamp = new Date().toISOString()
    
    const variationsMetadata = storagePaths.map((storagePath: string, index: number) => ({
      storagePath,
      originalUrl: imageUrls[index], // Keep original URL for reference
      variationType: ['Hero', 'Lifestyle', 'Minimal', 'Conceptual'][index] || 'Variation',
      settings: {
        ...validatedData,
        variationIndex: index,
        generatedAt: generationTimestamp
      }
    }))

    // Save generation to database
    const { data: generationRecord, error: dbError } = await supabase
      .from('product_mockup_generations')
      .insert({
        user_id: user.id,
        generation_id: generationId,
        prompt: validatedData.prompt,
        full_prompt: fullPrompt,
        settings: validatedData,
        images: storagePaths, // Store storage paths instead of temporary URLs
        metadata: {
          generationTimestamp,
          model,
          dimensions,
          variations: variationsMetadata,
          projectTitle: validatedData.metadata?.projectTitle,
          selectedArtifact: validatedData.metadata?.selectedArtifact
        },
        status: 'completed'
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Error saving generation to database:', dbError)
      // Continue even if database save fails
    } else {
      console.log('✅ Generation saved to database:', generationRecord.id)
    }

    // Save to product_mockups table with new schema
    console.log('🔄 Attempting to save to product_mockups table...')
    const productMockupData = {
        user_id: user.id,
        title: title || validatedData.prompt.substring(0, 255),
        description: description || validatedData.prompt,
        prompt: validatedData.prompt,
        
        // Product Photos & Logo (storage paths)
        product_photos_paths: productPhotosPaths,
        logo_image_path: logoImagePath,
        
        // Generated Images
        generated_images: imageUrls, // Store URLs for display
        storage_paths: storagePaths, // Store storage paths for management
        
        // Art Direction & Visual Influence
        art_direction: validatedData.artDirection,
        visual_influence: validatedData.visualInfluence,
        lighting_preset: validatedData.lightingPreset,
        background_environment: validatedData.backgroundEnvironment,
        mood_context: validatedData.moodContext,
        
        // Composition & Branding
        composition_template: validatedData.compositionTemplate,
        object_count: validatedData.objectCount,
        shadow_type: validatedData.shadowType,
        logo_placement: validatedData.logoPlacement,
        logo_description: validatedData.logoDescription,
        aspect_ratio: validatedData.aspectRatio,
        
        // Text & CTA Overlay
        headline: validatedData.headline,
        headline_color: validatedData.headlineColor,
        headline_color_auto: validatedData.headlineColorAuto,
        subtext: validatedData.subtext,
        subtext_color: validatedData.subtextColor,
        subtext_color_auto: validatedData.subtextColorAuto,
        cta_text: validatedData.ctaText,
        cta_color: validatedData.ctaColor,
        cta_color_auto: validatedData.ctaColorAuto,
        font_family: validatedData.fontFamily,
        font_weight: validatedData.fontWeight,
        text_case: validatedData.textCase,
        letter_spacing: validatedData.letterSpacing,
        line_height: validatedData.lineHeight,
        text_alignment: validatedData.textAlignment,
        text_effects: validatedData.textEffects,
        
        // Advanced Typography
        highlight_style: validatedData.highlightStyle,
        accent_element: validatedData.accentElement,
        brilliance: validatedData.brilliance,
        frosted_glass: validatedData.frostedGlass,
        drop_shadow_intensity: validatedData.dropShadowIntensity,
        motion_accent: validatedData.motionAccent,
        
        // Alignment & Positioning
        layout_mode: validatedData.layoutMode,
        vertical_position: validatedData.verticalPosition,
        horizontal_offset: validatedData.horizontalOffset,
        smart_anchor: validatedData.smartAnchor,
        safe_zones: validatedData.safeZones,
        
        // Casting & Multiplicity
        use_avatars: validatedData.useAvatars,
        selected_avatar_id: validatedData.selectedAvatarId,
        use_basic_avatar: validatedData.useBasicAvatar,
        basic_avatar: validatedData.basicAvatar,
        avatar_role: validatedData.avatarRole,
        avatar_interaction: validatedData.avatarInteraction,
        product_multiplicity: validatedData.productMultiplicity,
        angle_variety_count: validatedData.angleVarietyCount,
        
        // Platform Target
        platform_target: validatedData.platformTarget,
        
        // Brand Colors
        brand_colors: validatedData.brandColors,
        
        // Metadata & Content
        content: {
          generation_id: generationId,
          full_prompt: fullPrompt,
          settings: validatedData,
          variations: variationsMetadata,
          custom_fields: {
            art_direction: custom_art_direction || undefined,
            composition: custom_composition || undefined,
            object_count: custom_object_count || undefined,
            shadow: custom_shadow || undefined,
            font: custom_font || undefined,
            weight: custom_weight || undefined,
            text_effects: custom_text_effects || undefined,
            text_case: custom_text_case || undefined,
            highlight_style: custom_highlight_style || undefined,
            accent_element: custom_accent_element || undefined,
            motion_accent: custom_motion_accent || undefined,
            layout_mode: custom_layout_mode || undefined,
            product_count: custom_product_count || undefined,
            platform: custom_platform || undefined
          }
        },
        metadata: {
          generationTimestamp,
          model,
          dimensions,
          projectTitle: validatedData.metadata?.projectTitle,
          selectedArtifact: validatedData.metadata?.selectedArtifact,
          generated_via: 'product-mockup-generation'
        },
        
        // Status
        status: 'completed'
      }
    
    console.log('📝 Product mockup data to insert:', JSON.stringify(productMockupData, null, 2))
    
    const { data: productMockupRecord, error: productMockupError } = await supabase
      .from('product_mockups')
      .insert(productMockupData)
      .select()
      .single()

    if (productMockupError) {
      console.error('❌ Error saving to product_mockups table:', productMockupError)
      console.error('❌ Full error details:', JSON.stringify(productMockupError, null, 2))
      // Continue even if this fails
    } else {
      console.log('✅ Product mockup saved to product_mockups table:', productMockupRecord.id)
      console.log('✅ Product mockup record:', JSON.stringify(productMockupRecord, null, 2))
      
      // Add to library_items table
      const { error: libraryError } = await supabase
        .from('library_items')
        .insert({
          user_id: user.id,
          content_type: 'product_mockups',
          content_id: productMockupRecord.id,
          date_added_to_library: new Date().toISOString()
        })

      if (libraryError) {
        console.error('Failed to add product mockup to library:', libraryError)
      } else {
        console.log(`✅ Product mockup ${productMockupRecord.id} added to library`)
      }
    }

    // Build response
    const response: ProductMockupGenerationResult = {
      success: true,
      images: storagePaths, // Return storage paths instead of temporary URLs
      metadata: {
        generationId,
        timestamp: generationTimestamp,
        settings: validatedData,
        variations: variationsMetadata as any, // Type assertion for now
        storagePaths // Include storage paths in metadata
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ Product mockup generation failed:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 })
    }

    const response: ProductMockupGenerationResult = {
      success: false,
      images: [],
      metadata: {
        generationId: '',
        timestamp: new Date().toISOString(),
        settings: {} as ProductMockupGenerationRequest,
        variations: []
      },
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }

    return NextResponse.json(response, { status: 500 })
  }
}

// GET /api/product-mockup-generation - Get user's product mockup generations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch user's generations
    const { data: generations, error } = await supabase
      .from('product_mockup_generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Error fetching product mockup generations:', error)
      return NextResponse.json({ error: 'Failed to fetch generations' }, { status: 500 })
    }

    return NextResponse.json({ generations }, { status: 200 })

  } catch (error) {
    console.error('Unexpected error in GET /api/product-mockup-generation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

