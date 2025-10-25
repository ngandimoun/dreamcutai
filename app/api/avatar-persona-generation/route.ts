import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { generateWithFal, downloadImage } from '@/lib/utils/fal-generation'
import { validateImageFiles, validateImageUrls } from '@/lib/utils/image-validation'
import { buildAvatarPrompt, buildAvatarPromptSummary } from '@/lib/utils/avatar-prompt-builder'
import { sanitizeFilename } from '@/lib/utils'

// Helper function to convert empty strings to null
const emptyStringToNull = <T>(value: T): T | null => {
  if (typeof value === 'string' && value === '') {
    return null
  }
  return value
}

// Comprehensive validation schema for avatar/persona generation
const avatarPersonaGenerationSchema = z.object({
  // Basic settings
  prompt: z.string().min(1).max(5000), // Increased to support detailed prompts
  model: z.string().default('Nano-banana'),
  aspectRatio: z.enum(['1:1', '3:4', '4:5', '2:3', '16:9', '4:3', '9:16', '21:9']).default('1:1'),
  aiPromptEnabled: z.boolean().default(true),
  
  // Visual Style Stack
  artDirection: z.string().optional(),
  visualInfluence: z.string().optional(),
  lightingPreset: z.string().optional(),
  backgroundEnvironment: z.string().optional(),
  moodContext: z.string().optional(),
  
  // Identity & Role
  personaName: z.string().optional(),
  roleArchetype: z.enum(['Hero', 'Mentor', 'Creator', 'Explorer', 'Rebel', 'Sage', 'Mascot', 'Teacher']).or(z.literal('')).optional(),
  ageRange: z.enum(['Teen', 'Adult', 'Elder', 'Ageless']).or(z.literal('')).optional(),
  genderExpression: z.enum(['Female', 'Male', 'Non-binary', 'Custom']).or(z.literal('')).optional(),
  emotionBias: z.number().min(0).max(100).default(50),
  
  // Frame & Composition
  avatarComposition: z.string().optional(),
  poseStyle: z.string().optional(),
  cameraView: z.string().optional(),
  eyeDirection: z.string().optional(),
  headOrientation: z.string().optional(),
  
  // Physical Traits & Outfits
  bodyType: z.enum(['Slim', 'Athletic', 'Curvy', 'Stocky', 'Custom']).or(z.literal('')).optional(),
  skinTone: z.string().optional(),
  hairStyle: z.string().optional(),
  hairColor: z.string().optional(),
  eyeColor: z.string().optional(),
  eyeShape: z.enum(['Almond', 'Round', 'Hooded', 'Upturned', 'Downturned', 'Monolid', 'Deep Set']).or(z.literal('')).optional(),
  outfitCategory: z.enum(['Streetwear', 'Business', 'Armor', 'Fantasy', 'Uniform', 'Minimalist']).or(z.literal('')).optional(),
  outfitPalette: z.string().optional(),
  accessories: z.array(z.string()).optional(),
  
  // Reference Images (now handled as FormData files)
  referenceImages: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string()
  })).optional(),
  
  // Additional metadata
  metadata: z.record(z.any()).optional()
})

// GET /api/avatar-persona-generation - Get user's avatar/persona generations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from('avatars_personas')
      .select(`
        id,
        title,
        persona_name,
        role_archetype,
        art_direction,
        visual_influence,
        mood_context,
        aspect_ratio,
        status,
        created_at,
        updated_at,
        content,
        metadata,
        generated_images,
        storage_paths
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Add status filter if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data: avatars, error } = await query

    if (error) {
      console.error('❌ Error fetching avatars:', error)
      return NextResponse.json({ error: 'Failed to fetch avatars' }, { status: 500 })
    }

    // Regenerate expired signed URLs from storage_paths
    if (avatars && avatars.length > 0) {
      for (const avatar of avatars) {
        if (avatar.storage_paths && avatar.storage_paths.length > 0) {
          // Regenerate fresh signed URLs from storage paths
          const freshUrls: string[] = []
          for (const storagePath of avatar.storage_paths) {
            const { data: signedUrlData } = await supabase.storage
              .from('dreamcut')
              .createSignedUrl(storagePath, 86400) // 24 hour expiry
            if (signedUrlData?.signedUrl) {
              freshUrls.push(signedUrlData.signedUrl)
            }
          }
          // Replace expired URLs with fresh ones
          if (freshUrls.length > 0) {
            avatar.generated_images = freshUrls
          }
        }
      }
    }

    return NextResponse.json({ avatars }, { status: 200 })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/avatar-persona-generation - Create new avatar/persona generation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data instead of JSON
    const formData = await request.formData()
    
    // Extract form fields
    const personaName = formData.get('personaName')?.toString() || ''
    const prompt = formData.get('prompt')?.toString() || ''
    const model = 'Nano-banana' // Hardcoded for avatar generation
    const aspectRatio = formData.get('aspectRatio')?.toString() || '1:1'
    const aiPromptEnabled = formData.get('aiPromptEnabled')?.toString() === 'true'
    const artDirection = formData.get('artDirection')?.toString() || null
    const visualInfluence = formData.get('visualInfluence')?.toString() || null
    const lightingPreset = formData.get('lightingPreset')?.toString() || null
    const backgroundEnvironment = formData.get('backgroundEnvironment')?.toString() || null
    const moodContext = formData.get('moodContext')?.toString() || null
    const roleArchetype = formData.get('roleArchetype')?.toString() || null
    const ageRange = formData.get('ageRange')?.toString() || null
    const genderExpression = formData.get('genderExpression')?.toString() || null
    const ethnicity = formData.get('ethnicity')?.toString() || null
    const emotionBias = parseInt(formData.get('emotionBias')?.toString() || '50')
    const avatarComposition = formData.get('avatarComposition')?.toString() || null
    const poseStyle = formData.get('poseStyle')?.toString() || null
    const cameraView = formData.get('cameraView')?.toString() || null
    const eyeDirection = formData.get('eyeDirection')?.toString() || null
    const headOrientation = formData.get('headOrientation')?.toString() || null
    const bodyType = formData.get('bodyType')?.toString() || null
    const skinTone = formData.get('skinTone')?.toString() || null
    const hairStyle = formData.get('hairStyle')?.toString() || null
    const hairColor = formData.get('hairColor')?.toString() || null
    const eyeColor = formData.get('eyeColor')?.toString() || null
    const eyeShape = formData.get('eyeShape')?.toString() || null
    const outfitCategory = formData.get('outfitCategory')?.toString() || null
    const outfitPalette = formData.get('outfitPalette')?.toString() || null
    const accessories = formData.get('accessories')?.toString() ? JSON.parse(formData.get('accessories')?.toString() || '[]') : []
    
    // Extract custom field values
    const customEthnicity = formData.get('custom_ethnicity')?.toString() || null
    const customRole = formData.get('custom_role')?.toString() || null
    const customAgeRange = formData.get('custom_age_range')?.toString() || null
    const customGenderExpression = formData.get('custom_gender_expression')?.toString() || null
    const customArtDirection = formData.get('custom_art_direction')?.toString() || null
    const customVisualInfluence = formData.get('custom_visual_influence')?.toString() || null
    const customLightingPreset = formData.get('custom_lighting_preset')?.toString() || null
    const customBackgroundEnvironment = formData.get('custom_background_environment')?.toString() || null
    const customMoodContext = formData.get('custom_mood_context')?.toString() || null
    const customBodyType = formData.get('custom_body_type')?.toString() || null
    const customSkinTone = formData.get('custom_skin_tone')?.toString() || null
    const customHairStyle = formData.get('custom_hair_style')?.toString() || null
    const customHairColor = formData.get('custom_hair_color')?.toString() || null
    const customEyeColor = formData.get('custom_eye_color')?.toString() || null
    const customEyeShape = formData.get('custom_eye_shape')?.toString() || null
    const customOutfitCategory = formData.get('custom_outfit_category')?.toString() || null
    const customAccessories = formData.get('custom_accessories')?.toString() || null
    
    // Handle reference images upload
    const referenceImagePaths: string[] = []
    const referenceImages: File[] = []
    
    for (let i = 0; i < 3; i++) {
      const file = formData.get(`referenceImage_${i}`) as File | null
      if (file) {
        referenceImages.push(file)
      }
    }

    // Validate uploaded reference images
    if (referenceImages.length > 0) {
      const validation = await validateImageFiles(referenceImages)
      if (!validation.valid) {
        return NextResponse.json({ 
          error: `Invalid reference images: ${validation.errors.join(', ')}` 
        }, { status: 400 })
      }
    }

    // Upload validated reference images
    for (const file of referenceImages) {
      const sanitizedName = sanitizeFilename(file.name)
      const filePath = `renders/avatars/${user.id}/references/${uuidv4()}-${sanitizedName}`
      const { error: uploadError } = await supabase.storage
        .from('dreamcut')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error(`Error uploading reference image ${file.name}:`, uploadError)
        return NextResponse.json({ error: `Failed to upload reference image: ${uploadError.message}` }, { status: 500 })
      }
      referenceImagePaths.push(filePath)
    }

    // Handle logo upload
    let logoImagePath: string | null = null
    const logoImage = formData.get('logoImage') as File | null
    if (logoImage) {
      // Validate logo image
      const logoValidation = await validateImageFiles([logoImage])
      if (!logoValidation.valid) {
        return NextResponse.json({ 
          error: `Invalid logo image: ${logoValidation.errors.join(', ')}` 
        }, { status: 400 })
      }

      const sanitizedName = sanitizeFilename(logoImage.name)
      const filePath = `renders/avatars/${user.id}/logo/${uuidv4()}-${sanitizedName}`
      const { error: uploadError } = await supabase.storage
        .from('dreamcut')
        .upload(filePath, logoImage, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Error uploading logo image:', uploadError)
        return NextResponse.json({ error: `Failed to upload logo image: ${uploadError.message}` }, { status: 500 })
      }
      logoImagePath = filePath
    }

    // Parse logo placement and description from form data
    const logoPlacement = formData.get('logoPlacement')?.toString() 
      ? JSON.parse(formData.get('logoPlacement')?.toString() || '[]') 
      : []
    const logoDescription = formData.get('logoDescription')?.toString() || null

    // Prepare metadata from form data
    const metadata = {
      logoPlacement: logoPlacement,
      logoDescription: logoDescription,
      logoImage: logoImage ? {
        name: logoImage.name,
        size: logoImage.size,
        type: logoImage.type
      } : null
    }

    console.log('📥 Received avatar generation data:', {
      // Basic Settings
      personaName,
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      model,
      aspectRatio,
      aiPromptEnabled,
      
      // Visual Style Stack
      visualStyle: {
        artDirection,
        visualInfluence,
        lightingPreset,
        backgroundEnvironment,
        moodContext
      },
      
      // Identity & Role
      identity: {
        roleArchetype,
        ageRange,
        genderExpression,
        ethnicity,
        emotionBias
      },
      
      // Frame & Composition
      frameComposition: {
        avatarComposition,
        poseStyle,
        cameraView,
        eyeDirection,
        headOrientation
      },
      
      // Physical Traits
      physicalTraits: {
        bodyType,
        skinTone,
        hairStyle,
        hairColor,
        eyeColor,
        eyeShape
      },
      
      // Outfit
      outfit: {
        outfitCategory,
        outfitPalette,
        accessories: accessories.length > 0 ? accessories : 'none'
      },
      
      // Media Assets
      media: {
        referenceImagesCount: referenceImagePaths.length,
        hasLogo: !!logoImagePath,
        logoPlacement: logoPlacement,
        logoDescription: logoDescription
      }
    })

    // Build enhanced prompt from all parameters (outside try-catch for scope)
    const enhancedPrompt = buildAvatarPrompt({
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
      logoPlacement: logoPlacement,
      logoDescription: logoDescription
    })

    // Generate images using fal.ai
    let generatedImageUrls: string[] = []
    let generatedStoragePaths: string[] = []

    try {
      // Get signed URLs for uploaded images (required for private bucket)
      const imageUrls: string[] = []
      
      // Add logo image first if present
      if (logoImagePath) {
        const { data: { signedUrl: logoUrl } } = await supabase.storage
          .from('dreamcut')
          .createSignedUrl(logoImagePath, 86400) // 24 hour expiry
        if (logoUrl) imageUrls.push(logoUrl)
      }
      
      // Add reference images
      for (const path of referenceImagePaths) {
        const { data: { signedUrl: refUrl } } = await supabase.storage
          .from('dreamcut')
          .createSignedUrl(path, 86400) // 24 hour expiry
        if (refUrl) imageUrls.push(refUrl)
      }

      // Validate that all image URLs are accessible
      if (imageUrls.length > 0) {
        const urlValidation = await validateImageUrls(imageUrls)
        if (!urlValidation.accessible) {
          throw new Error(`Reference images are not accessible: ${urlValidation.errors.join(', ')}`)
        }
      }

      // Log the enhanced prompt for debugging
      console.log('🎨 Enhanced avatar prompt:', enhancedPrompt)
      console.log('📋 Prompt summary:', buildAvatarPromptSummary({
        prompt,
        artDirection,
        visualInfluence,
        ageRange,
        genderExpression,
        bodyType,
        hairColor,
        eyeColor,
        outfitCategory
      }))

      // Call fal.ai generation with enhanced prompt
      const generationResult = await generateWithFal({
        prompt: enhancedPrompt,
        aspectRatio,
        numImages: 1, // Generate avatar
        model: model as any,
        hasImages: imageUrls.length > 0,
        imageUrls,
        logoImagePath
      })

      if (!generationResult.success) {
        throw new Error(generationResult.error || 'Generation failed')
      }

      // Download and upload generated images to Supabase Storage
      for (let i = 0; i < generationResult.images.length; i++) {
        const imageUrl = generationResult.images[i]
        
        // Download image
        const imageBuffer = await downloadImage(imageUrl)
        
        // Upload to Supabase Storage
        const fileName = `${uuidv4()}-generated_${i + 1}.jpg`
        const filePath = `renders/avatars/${user.id}/generated/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('dreamcut')
          .upload(filePath, imageBuffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600'
          })

        if (uploadError) {
          console.error('Error uploading generated image:', uploadError)
          throw new Error('Failed to upload generated image')
        }

        // Get signed URL (public URLs don't work with authenticated-only buckets)
        const { data: signedUrlData } = await supabase.storage
          .from('dreamcut')
          .createSignedUrl(filePath, 86400) // 24 hour expiry
        if (signedUrlData?.signedUrl) {
          generatedImageUrls.push(signedUrlData.signedUrl)
        }
        generatedStoragePaths.push(filePath)
        
        console.log(`✅ Successfully uploaded avatar image ${i + 1}/${generationResult.images.length}: ${filePath}`)
      }
      
      console.log(`✅ Avatar generation completed successfully: ${generatedImageUrls.length} images generated`)

    } catch (generationError) {
      console.error('❌ Avatar generation error:', generationError)
      console.error('❌ Error details:', {
        message: generationError instanceof Error ? generationError.message : 'Unknown error',
        stack: generationError instanceof Error ? generationError.stack : undefined,
        prompt,
        model,
        aspectRatio,
        referenceImagePaths,
        logoImagePath
      })
      
      // Continue with empty arrays - the record will be created but without generated images
      generatedImageUrls = []
      generatedStoragePaths = []
      
      // Log the failure for debugging
      console.log('⚠️ Avatar generation failed, creating record with failed status')
    }

    // Create comprehensive avatar/persona generation record
    const { data: avatar, error } = await supabase
      .from('avatars_personas')
      .insert({
        user_id: user.id,
        title: personaName || `Avatar ${new Date().toLocaleDateString()}`,
        description: prompt,
        prompt: prompt,
        model: 'Nano-banana', // Hardcoded for avatar generation
        
        // Identity & Role
        persona_name: emptyStringToNull(personaName),
        role_archetype: emptyStringToNull(roleArchetype),
        age_range: emptyStringToNull(ageRange),
        gender_expression: emptyStringToNull(genderExpression),
        ethnicity: emptyStringToNull(ethnicity),
        emotion_bias: emotionBias,
        
        // Frame & Composition
        avatar_composition: emptyStringToNull(avatarComposition),
        pose_style: emptyStringToNull(poseStyle),
        camera_view: emptyStringToNull(cameraView),
        eye_direction: emptyStringToNull(eyeDirection),
        head_orientation: emptyStringToNull(headOrientation),
        
        // Physical Traits & Outfits
        body_type: emptyStringToNull(bodyType),
        skin_tone: emptyStringToNull(skinTone),
        hair_style: emptyStringToNull(hairStyle),
        hair_color: emptyStringToNull(hairColor),
        eye_color: emptyStringToNull(eyeColor),
        eye_shape: emptyStringToNull(eyeShape),
        outfit_category: emptyStringToNull(outfitCategory),
        outfit_palette: emptyStringToNull(outfitPalette),
        accessories: accessories,
        
        // Visual Style Stack
        art_direction: emptyStringToNull(artDirection),
        visual_influence: emptyStringToNull(visualInfluence),
        lighting_preset: emptyStringToNull(lightingPreset),
        background_environment: emptyStringToNull(backgroundEnvironment),
        mood_context: emptyStringToNull(moodContext),
        
        // Generation Settings
        aspect_ratio: aspectRatio,
        ai_prompt_enabled: aiPromptEnabled,
        reference_images_paths: referenceImagePaths,
        logo_image_path: logoImagePath,
        logo_description: emptyStringToNull(logoDescription),
        generated_images: generatedImageUrls,
        storage_paths: generatedStoragePaths,
        
        // Metadata and content
        content: {
          prompt: prompt, // Original user prompt
          enhanced_prompt: enhancedPrompt, // Enhanced prompt sent to Fal.ai
          generation_settings: {
            aspectRatio: aspectRatio,
            aiPromptEnabled: aiPromptEnabled
          },
          visual_style_stack: {
            artDirection: artDirection,
            visualInfluence: visualInfluence,
            lightingPreset: lightingPreset,
            backgroundEnvironment: backgroundEnvironment,
            moodContext: moodContext
          },
          identity_role: {
            personaName: personaName,
            roleArchetype: roleArchetype,
            ageRange: ageRange,
            genderExpression: genderExpression,
            ethnicity: ethnicity,
            emotionBias: emotionBias
          },
          physical_traits: {
            bodyType: bodyType,
            skinTone: skinTone,
            hairStyle: hairStyle,
            hairColor: hairColor,
            eyeColor: eyeColor,
            eyeShape: eyeShape,
            outfitCategory: outfitCategory,
            outfitPalette: outfitPalette,
            accessories: accessories
          },
          custom_fields: {
            customEthnicity: customEthnicity,
            customRole: customRole,
            customAgeRange: customAgeRange,
            customGenderExpression: customGenderExpression,
            customArtDirection: customArtDirection,
            customVisualInfluence: customVisualInfluence,
            customLightingPreset: customLightingPreset,
            customBackgroundEnvironment: customBackgroundEnvironment,
            customMoodContext: customMoodContext,
            customBodyType: customBodyType,
            customSkinTone: customSkinTone,
            customHairStyle: customHairStyle,
            customHairColor: customHairColor,
            customEyeColor: customEyeColor,
            customEyeShape: customEyeShape,
            customOutfitCategory: customOutfitCategory,
            customAccessories: customAccessories
          },
          reference_images: referenceImagePaths
        },
        metadata: {
          ...metadata,
          fal_generation: {
            model: 'Nano-banana', // Hardcoded for avatar generation
            timestamp: new Date().toISOString(),
            success: generatedImageUrls.length > 0
          }
        },
        status: generatedImageUrls.length > 0 ? 'completed' : 'failed'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating avatar/persona generation:', error)
      return NextResponse.json({ error: 'Failed to create avatar/persona generation' }, { status: 500 })
    }

    // Add to library_items table
    const { error: libraryError } = await supabase
      .from('library_items')
      .insert({
        user_id: user.id,
        content_type: 'avatars_personas',
        content_id: avatar.id,
        date_added_to_library: new Date().toISOString()
      })

    if (libraryError) {
      console.error('Failed to add avatar/persona to library:', libraryError)
    } else {
      console.log(`✅ Avatar/persona ${avatar.id} added to library`)
    }

    return NextResponse.json({ message: 'Avatar/persona generated and saved successfully', avatar }, { status: 201 })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/avatar-persona-generation/[id] - Update avatar/persona generation
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get avatar ID from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const avatarId = pathParts[pathParts.length - 1]

    if (!avatarId) {
      return NextResponse.json({ error: 'Avatar ID is required' }, { status: 400 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = avatarPersonaGenerationSchema.partial().parse(body)

    // Update avatar/persona generation
    const { data: avatar, error } = await supabase
      .from('avatars_personas')
      .update({
        // Update only provided fields
        ...(validatedData.personaName && { persona_name: validatedData.personaName }),
        ...(validatedData.roleArchetype && { role_archetype: validatedData.roleArchetype }),
        ...(validatedData.ageRange && { age_range: validatedData.ageRange }),
        ...(validatedData.genderExpression && { gender_expression: validatedData.genderExpression }),
        ...(validatedData.emotionBias !== undefined && { emotion_bias: validatedData.emotionBias }),
        ...(validatedData.bodyType && { body_type: validatedData.bodyType }),
        ...(validatedData.skinTone && { skin_tone: validatedData.skinTone }),
        ...(validatedData.hairStyle && { hair_style: validatedData.hairStyle }),
        ...(validatedData.hairColor && { hair_color: validatedData.hairColor }),
        ...(validatedData.eyeColor && { eye_color: validatedData.eyeColor }),
        ...(validatedData.eyeShape && { eye_shape: validatedData.eyeShape }),
        ...(validatedData.outfitCategory && { outfit_category: validatedData.outfitCategory }),
        ...(validatedData.outfitPalette && { outfit_palette: validatedData.outfitPalette }),
        ...(validatedData.accessories && { accessories: validatedData.accessories }),
        ...(validatedData.artDirection && { art_direction: validatedData.artDirection }),
        ...(validatedData.visualInfluence && { visual_influence: validatedData.visualInfluence }),
        ...(validatedData.lightingPreset && { lighting_preset: validatedData.lightingPreset }),
        ...(validatedData.backgroundEnvironment && { background_environment: validatedData.backgroundEnvironment }),
        ...(validatedData.moodContext && { mood_context: validatedData.moodContext }),
        ...(validatedData.aspectRatio && { aspect_ratio: validatedData.aspectRatio }),
        ...(validatedData.aiPromptEnabled !== undefined && { ai_prompt_enabled: validatedData.aiPromptEnabled }),
        ...(validatedData.referenceImages && { reference_images_paths: validatedData.referenceImages }),
        ...(validatedData.metadata && { metadata: validatedData.metadata }),
        updated_at: new Date().toISOString()
      })
      .eq('id', avatarId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating avatar/persona generation:', error)
      return NextResponse.json({ error: 'Failed to update avatar/persona generation' }, { status: 500 })
    }

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    }

    return NextResponse.json({ avatar }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/avatar-persona-generation/[id] - Delete avatar/persona generation
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get avatar ID from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const avatarId = pathParts[pathParts.length - 1]

    if (!avatarId) {
      return NextResponse.json({ error: 'Avatar ID is required' }, { status: 400 })
    }

    // Delete avatar/persona generation
    const { error } = await supabase
      .from('avatars_personas')
      .delete()
      .eq('id', avatarId)
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ Error deleting avatar/persona generation:', error)
      return NextResponse.json({ error: 'Failed to delete avatar/persona generation' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Avatar/persona generation deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
