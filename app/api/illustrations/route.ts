import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateWithFal, downloadImage } from '@/lib/utils/fal-generation'
import { validateImageFiles, validateImageUrls } from '@/lib/utils/image-validation'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    
    // Extract form data
    const title = formData.get('title') as string
    const prompt = formData.get('prompt') as string
    const model = (formData.get('model') as string) || 'Nano-banana'
    const purpose = formData.get('purpose') as string
    const aspectRatio = (formData.get('aspectRatio') as string) || '1:1'
    const artDirection = formData.get('artDirection') as string
    const visualInfluence = formData.get('visualInfluence') as string
    const mediumTexture = formData.get('mediumTexture') as string
    const lightingPreset = formData.get('lightingPreset') as string
    const outlineStyle = formData.get('outlineStyle') as string
    const moodContext = formData.get('moodContext') as string
    const toneIntensity = parseInt(formData.get('toneIntensity') as string)
    const paletteWarmth = parseInt(formData.get('paletteWarmth') as string)
    const expressionHarmony = formData.get('expressionHarmony') === 'true'
    const brandSync = formData.get('brandSync') === 'true'
    const colorPaletteMode = formData.get('colorPaletteMode') as string
    const accentColor = formData.get('accentColor') as string
    const fontStyle = formData.get('fontStyle') as string
    const watermarkPlacement = formData.get('watermarkPlacement') as string
    const compositionTemplate = formData.get('compositionTemplate') as string
    const cameraAngle = formData.get('cameraAngle') as string
    const depthControl = parseInt(formData.get('depthControl') as string)
    const subjectPlacement = formData.get('subjectPlacement') as string
    const safeZoneOverlay = formData.get('safeZoneOverlay') === 'true'

    // Validate required fields
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Handle reference images upload
    const referenceImagesPaths: string[] = []
    const referenceImages = []
    
    for (let i = 0; i < 3; i++) {
      const file = formData.get(`referenceImage_${i}`) as File
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

    // Upload reference images to Supabase Storage
    if (referenceImages.length > 0) {
      for (let i = 0; i < referenceImages.length; i++) {
        const file = referenceImages[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `ref_${Date.now()}_${i}.${fileExt}`
        const filePath = `renders/illustrations/${user.id}/references/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('dreamcut')
          .upload(filePath, file)
        
        if (uploadError) {
          console.error('Error uploading reference image:', uploadError)
          return NextResponse.json({ error: 'Failed to upload reference image' }, { status: 500 })
        }
        
        referenceImagesPaths.push(filePath)
      }
    }

    // Handle logo image upload
    let logoImagePath: string | null = null
    const logoImage = formData.get('logoImage') as File
    if (logoImage) {
      // Validate logo image
      const logoValidation = await validateImageFiles([logoImage])
      if (!logoValidation.valid) {
        return NextResponse.json({ 
          error: `Invalid logo image: ${logoValidation.errors.join(', ')}` 
        }, { status: 400 })
      }

      const fileExt = logoImage.name.split('.').pop()
      const fileName = `logo_${Date.now()}.${fileExt}`
      const filePath = `renders/illustrations/${user.id}/references/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('dreamcut')
        .upload(filePath, logoImage)
      
      if (uploadError) {
        console.error('Error uploading logo image:', uploadError)
        return NextResponse.json({ error: 'Failed to upload logo image' }, { status: 500 })
      }
      
      logoImagePath = filePath
    }

    // Create illustration record in database
    const { data: illustration, error: dbError } = await supabase
      .from('illustrations')
      .insert({
        user_id: user.id,
        title: title || 'Untitled Illustration',
        prompt,
        model: model || 'Nano-banana',
        purpose,
        aspect_ratio: aspectRatio,
        art_direction: artDirection,
        visual_influence: visualInfluence,
        medium_texture: mediumTexture,
        lighting_preset: lightingPreset,
        outline_style: outlineStyle,
        mood_context: moodContext,
        tone_intensity: toneIntensity,
        palette_warmth: paletteWarmth,
        expression_harmony: expressionHarmony,
        brand_sync: brandSync,
        color_palette_mode: colorPaletteMode,
        accent_color: accentColor,
        font_style: fontStyle,
        watermark_placement: watermarkPlacement,
        composition_template: compositionTemplate,
        camera_angle: cameraAngle,
        depth_control: depthControl,
        subject_placement: subjectPlacement,
        safe_zone_overlay: safeZoneOverlay,
        reference_images_paths: referenceImagesPaths.length > 0 ? referenceImagesPaths : null,
        logo_image_path: logoImagePath,
        status: 'processing',
        metadata: {
          form_data: {
            purpose,
            aspect_ratio: aspectRatio,
            art_direction: artDirection,
            visual_influence: visualInfluence,
            medium_texture: mediumTexture,
            lighting_preset: lightingPreset,
            outline_style: outlineStyle,
            mood_context: moodContext,
            tone_intensity: toneIntensity,
            palette_warmth: paletteWarmth,
            expression_harmony: expressionHarmony,
            brand_sync: brandSync,
            color_palette_mode: colorPaletteMode,
            accent_color: accentColor,
            font_style: fontStyle,
            watermark_placement: watermarkPlacement,
            composition_template: compositionTemplate,
            camera_angle: cameraAngle,
            depth_control: depthControl,
            subject_placement: subjectPlacement,
            safe_zone_overlay: safeZoneOverlay
          }
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to create illustration record' }, { status: 500 })
    }

    // Generate images using fal.ai
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
      for (const path of referenceImagesPaths) {
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

      // Call fal.ai generation
      const generationResult = await generateWithFal({
        prompt,
        aspectRatio,
        numImages: 1,
        model: model as any,
        hasImages: imageUrls.length > 0,
        imageUrls,
        logoImagePath
      })

      if (!generationResult.success) {
        throw new Error(generationResult.error || 'Generation failed')
      }

      // Download and upload generated images to Supabase Storage
      const generatedImageUrls: string[] = []
      const generatedStoragePaths: string[] = []

      for (let i = 0; i < generationResult.images.length; i++) {
        const imageUrl = generationResult.images[i]
        
        // Download image
        const imageBuffer = await downloadImage(imageUrl)
        
        // Upload to Supabase Storage
        const fileName = `${uuidv4()}-generated_${i + 1}.jpg`
        const filePath = `renders/illustrations/${user.id}/generated/${fileName}`
        
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
          generatedImageUrls.push(signedUrlData.signedUrl)
        }
        generatedStoragePaths.push(filePath)
      }

      // Update illustration record with generated images
      await supabase
        .from('illustrations')
        .update({
          status: 'completed',
          generated_images: generatedImageUrls,
          storage_paths: generatedStoragePaths,
          metadata: {
            ...illustration.metadata,
            fal_generation: {
              model,
              requestId: generationResult.requestId,
              timestamp: new Date().toISOString()
            }
          }
        })
        .eq('id', illustration.id)

      // Add to library_items table
      const { error: libraryError } = await supabase
        .from('library_items')
        .insert({
          user_id: user.id,
          content_type: 'illustrations',
          content_id: illustration.id,
          date_added_to_library: new Date().toISOString()
        })

      if (libraryError) {
        console.error('Failed to add illustration to library:', libraryError)
      } else {
        console.log(`✅ Illustration ${illustration.id} added to library`)
      }

    } catch (generationError) {
      console.error('Image generation error:', generationError)
      
      // Update status to failed
      await supabase
        .from('illustrations')
        .update({
          status: 'failed',
          metadata: {
            ...illustration.metadata,
            error: generationError instanceof Error ? generationError.message : 'Unknown error'
          }
        })
        .eq('id', illustration.id)

      throw generationError
    }

    return NextResponse.json({
      success: true,
      illustration: {
        id: illustration.id,
        title: illustration.title,
        status: illustration.status
      }
    })

  } catch (error) {
    console.error('Illustration generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's illustrations
    const { data: illustrations, error } = await supabase
      .from('illustrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch illustrations' }, { status: 500 })
    }

    // Regenerate expired signed URLs from storage_paths
    if (illustrations && illustrations.length > 0) {
      for (const illustration of illustrations) {
        if (illustration.storage_paths && illustration.storage_paths.length > 0) {
          // Regenerate fresh signed URLs from storage paths
          const freshUrls: string[] = []
          for (const storagePath of illustration.storage_paths) {
            const { data: signedUrlData } = await supabase.storage
              .from('dreamcut')
              .createSignedUrl(storagePath, 86400) // 24 hour expiry
            if (signedUrlData?.signedUrl) {
              freshUrls.push(signedUrlData.signedUrl)
            }
          }
          // Replace expired URLs with fresh ones
          if (freshUrls.length > 0) {
            illustration.generated_images = freshUrls
          }
        }
      }
    }

    return NextResponse.json({ illustrations })

  } catch (error) {
    console.error('Fetch illustrations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}