import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { downloadAndUploadMultipleImages } from '@/lib/storage/download-and-upload'
import { createClient } from '@/lib/supabase/server'

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_KEY
})

interface CharacterGenerationRequest {
  character: {
    name: string
    description: string
    role: string
    customRole?: string
    skinTone: string
    hairColor: string
    eyeColor: string
    outfitMain: string
    outfitAccent?: string
    images?: string[]
    // Enhanced character design fields
    age?: string
    gender?: string
    bodyType?: string
    height?: string
    faceShape?: string
    distinctiveFeatures?: string
    personality?: string
    expression?: string
    pose?: string
    energy?: string
    accessories?: string
    outfitStyle?: string
    outfitDetails?: string
    footwear?: string
  }
  comicSettings: {
    inspirationStyle: string
    vibe: string
    type: string
  }
  metadata?: {
    comicTitle?: string
    selectedArtifact?: {
      id: string
      title?: string
      isPublic?: boolean
      type?: string
      section?: string
    }
    generationContext?: {
      formType: string
      timestamp: string
      userAgent?: string
    }
  }
}

function buildCharacterPrompt(character: CharacterGenerationRequest['character'], comicSettings: CharacterGenerationRequest['comicSettings']): string {
  // Extract all enhanced fields for generation
  const { 
    description, role, customRole, skinTone, hairColor, eyeColor, outfitMain, outfitAccent,
    age, gender, bodyType, height, faceShape, distinctiveFeatures,
    personality, expression, pose, energy, accessories, outfitStyle, outfitDetails, footwear
  } = character
  const { inspirationStyle, vibe, type } = comicSettings

  // Build comprehensive character design prompt
  let prompt = `Create a professional character design variation for a ${type} comic/manga project. `
  prompt += `Character: ${description}. `
  
  // Add demographic context
  if (age) prompt += `Age: ${age}. `
  if (gender) prompt += `Gender: ${gender}. `
  
  // Add role context
  const roleText = customRole || role
  if (roleText && roleText !== 'other') {
    prompt += `This character serves as a ${roleText} in the story. `
  }

  // Enhanced physical appearance specifications
  prompt += `Physical design: ${skinTone} skin, ${hairColor} hair, ${eyeColor} eyes`
  if (bodyType) prompt += `, ${bodyType} build`
  if (height) prompt += `, ${height} height`
  if (faceShape) prompt += `, ${faceShape} face shape`
  if (distinctiveFeatures) prompt += `, ${distinctiveFeatures}`
  prompt += `. `
  
  // Enhanced outfit description
  prompt += `Costume: ${outfitMain} colored ${outfitStyle || 'outfit'}`
  if (outfitDetails) prompt += ` (${outfitDetails})`
  if (outfitAccent && outfitAccent !== 'none') {
    prompt += ` with ${outfitAccent} accents`
  }
  if (footwear) prompt += `, ${footwear}`
  if (accessories) prompt += `, ${accessories}`
  prompt += `. `

  // Add personality and expression
  if (personality) prompt += `Personality: ${personality}. `
  if (expression) prompt += `Expression: ${expression}. `
  if (pose) prompt += `Pose: ${pose}. `
  if (energy) prompt += `Energy: ${energy}. `

  // Style and mood context
  prompt += `Art direction: ${inspirationStyle} inspired ${type} comic/manga style. `
  prompt += `Story mood and atmosphere: ${vibe} tone. `

  // Character design sheet specifications
  prompt += `This is a character design sheet variation for comic/manga production. `
  prompt += `Create a distinct character design that shows different aspects or interpretations of this character. `
  prompt += `The design should be suitable for use in a ${type} comic/manga with ${vibe} atmosphere. `

  // Single character focus
  prompt += `IMPORTANT: Generate ONLY ONE SINGLE CHARACTER design variation. `
  prompt += `This is a character design sheet showing one character in a specific design interpretation. `
  prompt += `No other characters, no interactions, no scenes with multiple people. `
  prompt += `Focus on creating a unique character design variation that the user can choose from. `

  // Technical specifications
  prompt += `High quality professional character design, detailed comic/manga illustration, clean line art, vibrant colors, `
  prompt += `character design sheet style, suitable for comic/manga production. `
  prompt += `Single character design, isolated on clean background, ready for comic/manga use. `

  // Enhanced style modifiers with character design focus
  const styleModifiers: { [key: string]: string } = {
    'simpsons': 'yellow skin, simple cartoon design, character sheet style, single character only, comic strip ready, distinctive silhouette, recognizable features',
    'naruto': 'anime/manga style, detailed character design, dynamic character sheet, single character focus, expressive eyes, detailed hair, ninja aesthetic',
    'batman': 'dark, gritty character design, realistic proportions, solo character design sheet, heroic pose, iconic costume design',
    'disney': 'clean, colorful character design, expressive features, single character design, soft features, natural colors',
    'marvel': 'superhero character proportions, dynamic character design, single character sheet, heroic pose, iconic costume design, powerful silhouette',
    'dc': 'classic superhero character style, bold character design, one character only, heroic proportions, iconic design',
    'manga': 'anime/manga character style, detailed hair and eyes, single character design sheet, expressive features',
    'western': 'classic American comic character style, solo character design, bold lines, iconic features',
    'european': 'detailed, realistic European comic character style, single character design, sophisticated art style',
    'indie': 'unique, artistic character design, alternative comic style, one character only, distinctive style',
    'ghibli': 'studio ghibli character style, detailed character design, single character focus, soft features, expressive eyes, natural colors, whimsical details',
    'shonen-anime': 'shonen anime character style, dynamic character design, single character sheet, energetic pose, detailed features',
    'one-piece': 'one piece manga character style, detailed character design, single character focus, distinctive features, dynamic style',
    'dragon-ball': 'dragon ball character style, dynamic character design, single character sheet, muscular build, spiky hair, energetic pose',
    'attack-on-titan': 'attack on titan character style, detailed character design, single character focus, realistic proportions, serious expression'
  }

  if (styleModifiers[inspirationStyle.toLowerCase()]) {
    prompt += styleModifiers[inspirationStyle.toLowerCase()] + '. '
  }

  // Character design variation context
  prompt += `This character design variation should offer a unique interpretation suitable for ${type} comic/manga production. `
  prompt += `The design should be distinct and provide the user with a clear character choice for their comic/manga project. `
  prompt += `Focus on creating a memorable, recognizable character design that stands out. `

  // Final reinforcement
  prompt += `REMEMBER: This is a character design variation - show only one character, no multiple characters or interactions. `

  return prompt.trim()
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Character generation API called')
    const body: CharacterGenerationRequest = await request.json()
    const { character, comicSettings, metadata } = body

    // Log enhanced generation data
    console.log('📝 Enhanced generation data:', {
      // Basic character info
      description: character.description,
      role: character.role,
      customRole: character.customRole,
      // Physical appearance
      skinTone: character.skinTone,
      hairColor: character.hairColor,
      eyeColor: character.eyeColor,
      age: character.age,
      gender: character.gender,
      bodyType: character.bodyType,
      height: character.height,
      faceShape: character.faceShape,
      distinctiveFeatures: character.distinctiveFeatures,
      // Personality & expression
      personality: character.personality,
      expression: character.expression,
      pose: character.pose,
      energy: character.energy,
      // Outfit details
      outfitMain: character.outfitMain,
      outfitAccent: character.outfitAccent,
      outfitStyle: character.outfitStyle,
      outfitDetails: character.outfitDetails,
      footwear: character.footwear,
      accessories: character.accessories,
      // Technical
      hasImages: character.images?.length || 0,
      inspirationStyle: comicSettings.inspirationStyle,
      vibe: comicSettings.vibe,
      type: comicSettings.type
    })

    // Log metadata separately (not used in generation)
    console.log('📊 Metadata (tracking only):', {
      comicTitle: metadata?.comicTitle,
      selectedArtifact: metadata?.selectedArtifact?.id
    })

    // Build the prompt using only essential data
    const prompt = buildCharacterPrompt(character, comicSettings)
    
    console.log('🎯 Generated prompt:', prompt)
    console.log('📏 Prompt length:', prompt.length, 'characters')
    
    // Check if prompt is too long (some APIs have limits)
    if (prompt.length > 2000) {
      console.warn('⚠️ Prompt is very long, this might cause issues')
    }

    // Determine which model to use
    const hasImages = character.images && character.images.length > 0
    const model = hasImages 
      ? 'fal-ai/bytedance/seedream/v4/edit' 
      : 'fal-ai/bytedance/seedream/v4/text-to-image'

    console.log('🤖 Using model:', model)

    // Prepare the request parameters (using only basic valid parameters)
    const requestParams: any = {
      input: {
        prompt: prompt,
        image_size: { width: 1024, height: 1024 },
        num_images: 2, // Number of separate generations
        max_images: 1, // Images per generation (1 per generation, 2 generations = 2 total)
        enable_safety_checker: true
        // Removed advanced parameters that might be causing validation issues
      }
    }

    // Add reference images if available (only essential for generation)
    if (hasImages && model === 'fal-ai/bytedance/seedream/v4/edit') {
      requestParams.input.image_urls = character.images
      console.log('🖼️ Using', character.images.length, 'reference images for generation')
    }

    console.log('⏳ Calling fal.ai API...')
    console.log('📋 Request parameters:', JSON.stringify(requestParams, null, 2))
    const startTime = Date.now()

    // Generate images
    const result = await fal.subscribe(model, requestParams)

    const endTime = Date.now()
    console.log(`✅ fal.ai API completed in ${endTime - startTime}ms`)
    console.log('📊 Generated', result.data.images?.length || 0, 'images')

    // Extract just the URLs from the image objects
    const imageUrls = result.data.images.map((img: any) => img.url)
    console.log('🔗 Extracted image URLs:', imageUrls)

    // Download and upload images to Supabase Storage
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const generationId = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const baseStoragePath = `renders/comics/${user.id}`
    
    console.log('📥 Downloading and uploading images to Supabase Storage...')
    const uploadResults = await downloadAndUploadMultipleImages(
      imageUrls,
      baseStoragePath,
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

    // Build comprehensive metadata for each variation
    const generationTimestamp = new Date().toISOString()
    const variationsMetadata = storagePaths.map((storagePath, index) => ({
      storagePath,
      originalUrl: imageUrls[index], // Keep original URL for reference
      variationNumber: index + 1,
      metadata: {
        // Character information
        character: {
          name: character.name || 'Unnamed Character',
          description: character.description,
          role: character.role,
          customRole: character.customRole,
          appearance: {
            skinTone: character.skinTone,
            hairColor: character.hairColor,
            eyeColor: character.eyeColor,
            outfitMain: character.outfitMain,
            outfitAccent: character.outfitAccent
          },
          hasReferenceImages: character.images && character.images.length > 0,
          referenceImageCount: character.images?.length || 0
        },
        // Comic settings
        comicSettings: {
          inspirationStyle: comicSettings.inspirationStyle,
          vibe: comicSettings.vibe,
          type: comicSettings.type
        },
        // Artifact selection context
        artifactContext: metadata?.selectedArtifact ? {
          id: metadata.selectedArtifact.id,
          title: metadata.selectedArtifact.title,
          isPublic: metadata.selectedArtifact.isPublic,
          type: metadata.selectedArtifact.type,
          section: metadata.selectedArtifact.section
        } : null,
        // Generation context
        generationContext: {
          formType: metadata?.generationContext?.formType || 'comics-form',
          timestamp: generationTimestamp,
          comicTitle: metadata?.comicTitle || 'Untitled Comic',
          model: model,
          prompt: prompt,
          seed: result.data.seed,
          userAgent: metadata?.generationContext?.userAgent
        },
        // Technical details
        technical: {
          imageSize: { width: 1024, height: 1024 },
          generationTime: endTime - startTime,
          apiVersion: 'v1.0',
          source: 'fal.ai'
        }
      }
    }))

    const response = {
      success: true,
      images: storagePaths, // Return storage paths instead of temporary URLs
      variations: variationsMetadata,
      seed: result.data.seed,
      prompt: prompt,
      metadata: {
        totalVariations: storagePaths.length,
        generationTimestamp,
        comicTitle: metadata?.comicTitle || 'Untitled Comic',
        selectedArtifact: metadata?.selectedArtifact,
        generationContext: metadata?.generationContext,
        storagePaths // Include storage paths in metadata
      }
    }
    console.log('📤 API response with metadata:', {
      success: response.success,
      totalVariations: response.metadata.totalVariations,
      comicTitle: response.metadata.comicTitle,
      selectedArtifact: response.metadata.selectedArtifact
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Character generation error:', error)
    
    // Log more details about the error
    if (error && typeof error === 'object' && 'body' in error) {
      console.error('📋 Error body:', JSON.stringify(error.body, null, 2))
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate character images',
        details: error instanceof Error ? error.message : 'Unknown error',
        errorBody: error && typeof error === 'object' && 'body' in error ? error.body : null
      },
      { status: 500 }
    )
  }
}
