import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { generateWithFal, downloadImage } from '@/lib/utils/fal-generation'
import { validateImageFiles, validateImageUrls } from '@/lib/utils/image-validation'
import { sanitizeFilename } from '@/lib/utils'

// Helper function to convert null to undefined
const nullToUndefined = (value: string | null): string | undefined => {
  return value === null ? undefined : value
}

interface ConceptWorldGenerationResult {
  success: boolean
  images: string[]
  metadata: {
    generationId: string
    timestamp: string
    settings: any
  }
  error?: string
}

// POST /api/concept-world-generation - Generate concept worlds
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Concept world generation API called')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data instead of JSON
    const formData = await request.formData()
    
    // Extract form fields
    const name = formData.get('name')?.toString() || ''
    const prompt = formData.get('prompt')?.toString() || ''
    const model = formData.get('model')?.toString() || 'Nano-banana'
    const worldPurpose = formData.get('worldPurpose')?.toString() || null
    const logoPlacement = formData.get('logoPlacement')?.toString() || null
    const customColor = formData.get('customColor')?.toString() || '#3b82f6'
    const aspectRatio = (formData.get('aspectRatio')?.toString() || '1:1').match(/\d+:\d+/)?.[0] || '1:1'
    const seedVariability = parseInt(formData.get('seedVariability')?.toString() || '50')
    const artDirection = formData.get('artDirection')?.toString() || null
    const visualInfluence = formData.get('visualInfluence')?.toString() || null
    const colorSystem = formData.get('colorSystem')?.toString() || null
    const lighting = formData.get('lighting')?.toString() || null
    const materialLanguage = formData.get('materialLanguage')?.toString() || null
    const textureDetail = parseInt(formData.get('textureDetail')?.toString() || '50')
    const environmentType = formData.get('environmentType')?.toString() || null
    const locationArchetype = formData.get('locationArchetype')?.toString() || null
    const cameraFraming = formData.get('cameraFraming')?.toString() || null
    const atmosphericMotion = formData.get('atmosphericMotion')?.toString() || null
    const depthLevel = parseInt(formData.get('depthLevel')?.toString() || '50')
    const compositionScale = parseInt(formData.get('compositionScale')?.toString() || '50')
    const spatialConsistencyLock = formData.get('spatialConsistencyLock')?.toString() === 'true'
    const mood = formData.get('mood')?.toString() || null
    const culturalInfluence = formData.get('culturalInfluence')?.toString() || null
    const timeOfDay = formData.get('timeOfDay')?.toString() || null
    const emotionalTone = formData.get('emotionalTone')?.toString() || null
    const symbolicMotifs = formData.get('symbolicMotifs')?.toString() ? JSON.parse(formData.get('symbolicMotifs')?.toString() || '[]') : []
    const storyHook = formData.get('storyHook')?.toString() || null
    const brandSync = formData.get('brandSync')?.toString() === 'true'
    const brandPaletteMode = formData.get('brandPaletteMode')?.toString() || null
    const toneMatch = parseInt(formData.get('toneMatch')?.toString() || '50')
    const typographyInWorld = formData.get('typographyInWorld')?.toString() || null
    const metadata = formData.get('metadata')?.toString() ? JSON.parse(formData.get('metadata')?.toString() || '{}') : {}

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
      const filePath = `renders/concept-worlds/${user.id}/references/${uuidv4()}-${sanitizedName}`
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
    const logoFile = formData.get('logoFile') as File | null
    if (logoFile) {
      // Validate logo image
      const logoValidation = await validateImageFiles([logoFile])
      if (!logoValidation.valid) {
        return NextResponse.json({ 
          error: `Invalid logo image: ${logoValidation.errors.join(', ')}` 
        }, { status: 400 })
      }

      const filePath = `renders/concept-worlds/${user.id}/logo/${uuidv4()}-${logoFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('dreamcut')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Error uploading logo image:', uploadError)
        return NextResponse.json({ error: `Failed to upload logo image: ${uploadError.message}` }, { status: 500 })
      }
      logoImagePath = filePath
    }

    console.log('📝 Concept world generation data:', {
      name,
      prompt,
      worldPurpose,
      artDirection,
      visualInfluence,
      referenceImages: referenceImagePaths.length
    })

    // Generate unique ID for this generation
    const generationId = `cw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const generationTimestamp = new Date().toISOString()

    // Generate images using fal.ai
    let imageUrls: string[] = []
    let generatedStoragePaths: string[] = []

    try {
      // Get signed URLs for uploaded images (required for private bucket)
      const inputImageUrls: string[] = []
      
      // Add logo image first if present
      if (logoImagePath) {
        const { data: { signedUrl: logoUrl } } = await supabase.storage
          .from('dreamcut')
          .createSignedUrl(logoImagePath, 86400) // 24 hour expiry
        if (logoUrl) inputImageUrls.push(logoUrl)
      }
      
      // Add reference images
      for (const path of referenceImagePaths) {
        const { data: { signedUrl: refUrl } } = await supabase.storage
          .from('dreamcut')
          .createSignedUrl(path, 86400) // 24 hour expiry
        if (refUrl) inputImageUrls.push(refUrl)
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

      // Call fal.ai generation
      const generationResult = await generateWithFal({
        prompt,
        aspectRatio,
        numImages: 1, // Generate concept world
        model: model as any,
        hasImages: inputImageUrls.length > 0,
        imageUrls: inputImageUrls,
        logoImagePath: logoImagePath || undefined
      })

      const endTime = Date.now()
      console.log(`✅ fal.ai API completed in ${endTime - startTime}ms`)

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
        const filePath = `renders/concept-worlds/${user.id}/generated/${fileName}`
        
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

        // Get signed URL (24 hour expiry)
        const { data: signedUrlData } = await supabase.storage
          .from('dreamcut')
          .createSignedUrl(filePath, 86400) // 24 hour expiry
        if (signedUrlData?.signedUrl) {
          imageUrls.push(signedUrlData.signedUrl)
        }
        generatedStoragePaths.push(filePath)
      }

      console.log('🎨 Generated images:', imageUrls)

    } catch (generationError) {
      console.error('Concept world generation error:', generationError)
      // Continue with empty arrays - the record will be created but without generated images
      imageUrls = []
      generatedStoragePaths = []
    }

    // Save to concept_worlds table with new schema
    console.log('🔄 Attempting to save to concept_worlds table...')
    const conceptWorldData = {
        user_id: user.id,
        title: name,
        description: prompt,
        prompt: prompt,
        model: model,
        
        // File Storage Paths
        reference_images_paths: referenceImagePaths,
        logo_image_path: logoImagePath,
        generated_images: imageUrls,
        storage_paths: generatedStoragePaths,
        
        // World Purpose & Settings
        world_purpose: nullToUndefined(worldPurpose),
        aspect_ratio: aspectRatio,
        custom_color: customColor,
        logo_placement: nullToUndefined(logoPlacement),
        
        // Visual DNA
        art_direction: nullToUndefined(artDirection),
        visual_influence: nullToUndefined(visualInfluence),
        color_system: nullToUndefined(colorSystem),
        lighting: nullToUndefined(lighting),
        material_language: nullToUndefined(materialLanguage),
        texture_detail: textureDetail,
        
        // Spatial DNA
        environment_type: nullToUndefined(environmentType),
        location_archetype: nullToUndefined(locationArchetype),
        camera_framing: nullToUndefined(cameraFraming),
        atmospheric_motion: nullToUndefined(atmosphericMotion),
        depth_level: depthLevel,
        composition_scale: compositionScale,
        spatial_consistency_lock: spatialConsistencyLock,
        
        // Narrative DNA
        mood: nullToUndefined(mood),
        cultural_influence: nullToUndefined(culturalInfluence),
        time_of_day: nullToUndefined(timeOfDay),
        emotional_tone: nullToUndefined(emotionalTone),
        symbolic_motifs: symbolicMotifs,
        story_hook: nullToUndefined(storyHook),
        
        // Brand Integration
        brand_sync: brandSync,
        brand_palette_mode: nullToUndefined(brandPaletteMode),
        tone_match: toneMatch,
        typography_in_world: nullToUndefined(typographyInWorld),
        
        // Generation Settings
        seed_variability: seedVariability,
        
        // Status & Metadata
        status: imageUrls.length > 0 ? 'completed' : 'failed',
        metadata: {
          generationTimestamp,
          worldPurpose,
          artDirection,
          visualInfluence,
          projectTitle: metadata?.projectTitle,
          selectedArtifact: metadata?.selectedArtifact,
          generated_via: 'concept-world-generation',
          brandSync,
          culturalInfluence,
          emotionalTone,
          fal_generation: {
            model,
            timestamp: new Date().toISOString(),
            success: imageUrls.length > 0
          }
        },
        content: {
          images: imageUrls,
          generation_id: generationId,
          full_prompt: prompt,
          settings: {
            name,
            prompt,
            worldPurpose,
            logoPlacement,
            customColor,
            aspectRatio,
            seedVariability,
            artDirection,
            visualInfluence,
            colorSystem,
            lighting,
            materialLanguage,
            textureDetail,
            environmentType,
            locationArchetype,
            cameraFraming,
            atmosphericMotion,
            depthLevel,
            compositionScale,
            spatialConsistencyLock,
            mood,
            culturalInfluence,
            timeOfDay,
            emotionalTone,
            symbolicMotifs,
            storyHook,
            brandSync,
            brandPaletteMode,
            toneMatch,
            typographyInWorld
          }
        }
      }
    
    console.log('📝 Concept world data to insert:', JSON.stringify(conceptWorldData, null, 2))
    
    const { data: conceptWorldRecord, error: conceptWorldError } = await supabase
      .from('concept_worlds')
      .insert(conceptWorldData)
      .select()
      .single()

    if (conceptWorldError) {
      console.error('❌ Error saving to concept_worlds table:', conceptWorldError)
      console.error('❌ Full error details:', JSON.stringify(conceptWorldError, null, 2))
      // Continue even if this fails
    } else {
      console.log('✅ Concept world saved to concept_worlds table:', conceptWorldRecord.id)
      console.log('✅ Concept world record:', JSON.stringify(conceptWorldRecord, null, 2))
      
      // Add to library_items table
      const { error: libraryError } = await supabase
        .from('library_items')
        .insert({
          user_id: user.id,
          content_type: 'concept_worlds',
          content_id: conceptWorldRecord.id,
          date_added_to_library: new Date().toISOString()
        })

      if (libraryError) {
        console.error('Failed to add concept world to library:', libraryError)
      } else {
        console.log(`✅ Concept world ${conceptWorldRecord.id} added to library`)
      }
    }

    // Build response
    const response: ConceptWorldGenerationResult = {
      success: true,
      images: imageUrls,
      metadata: {
        generationId,
        timestamp: generationTimestamp,
        settings: {
          name,
          prompt,
          worldPurpose,
          artDirection,
          visualInfluence,
          referenceImages: referenceImagePaths.length
        }
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/concept-world-generation - Get user's concept world generations
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
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query with filters
    let query = supabase
      .from('concept_world_generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: generations, error } = await query

    if (error) {
      console.error('❌ Error fetching concept world generations:', error)
      return NextResponse.json({ error: 'Failed to fetch generations' }, { status: 500 })
    }

    // Regenerate expired signed URLs from storage_paths
    if (generations && generations.length > 0) {
      for (const generation of generations) {
        if (generation.storage_paths && generation.storage_paths.length > 0) {
          // Regenerate fresh signed URLs from storage paths
          const freshUrls: string[] = []
          for (const storagePath of generation.storage_paths) {
            const { data: signedUrlData } = await supabase.storage
              .from('dreamcut')
              .createSignedUrl(storagePath, 86400) // 24 hour expiry
            if (signedUrlData?.signedUrl) {
              freshUrls.push(signedUrlData.signedUrl)
            }
          }
          // Replace expired URLs with fresh ones
          if (freshUrls.length > 0) {
            generation.generated_images = freshUrls
          }
        }
      }
    }

    return NextResponse.json({ generations }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/concept-world-generation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
