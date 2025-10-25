import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getFalClient } from '@/lib/utils/fal-client'
import { generateVeo, pollVeoCompletion } from '@/lib/kie'
import { buildTalkingAvatarsPrompt } from '@/lib/utils/talking-avatars-prompt-builder'
import { buildMultiAvatarPrompt } from '@/lib/utils/talking-avatars-multi-prompt-builder'
import { processSceneSlotImages, cleanupTempImages } from '@/lib/utils/image-url-processor'

// Helper to convert null to undefined for Zod optional()
const nullToUndefined = z.literal('null').transform(() => undefined);

// Character schema for mode "Describe & Create"
const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  artStyle: z.string(),
  customArtStyle: z.string().optional(),
  ageRange: z.string(),
  customAgeRange: z.string().optional(),
  ethnicity: z.string(),
  customEthnicity: z.string().optional(),
  gender: z.string(),
  customGender: z.string().optional(),
  role: z.string(),
  customRole: z.string().optional(),
  bodyType: z.string(),
  customBodyType: z.string().optional(),
  skinTone: z.string(),
  customSkinTone: z.string().optional(),
  hairStyle: z.string(),
  customHairStyle: z.string().optional(),
  hairColor: z.string(),
  customHairColor: z.string().optional(),
  eyeColor: z.string(),
  customEyeColor: z.string().optional(),
  eyeShape: z.string(),
  customEyeShape: z.string().optional(),
  outfitCategory: z.string(),
  customOutfitCategory: z.string().optional(),
  outfitColors: z.string(),
  customOutfitColors: z.string().optional(),
  accessories: z.array(z.string()),
  customAccessory: z.string().optional(),
  expression: z.string(),
  customExpression: z.string().optional(),
  voice: z.string(),
  customVoice: z.string().optional(),
});

const createTalkingAvatarSchema = z.object({
  title: z.string().min(1, "Title is required"),
  
  // Visuals
  use_custom_image: z.boolean(),
  custom_image_path: z.string().optional().nullable().transform(e => e === '' ? undefined : e).or(nullToUndefined),
  selected_avatar_id: z.string().optional().nullable().transform(e => e === '' ? undefined : e).or(nullToUndefined),
  
  // Audio Settings
  use_custom_audio: z.boolean(),
  custom_audio_path: z.string().optional().nullable().transform(e => e === '' ? undefined : e).or(nullToUndefined),
  audio_duration: z.number().optional().nullable().transform(e => e === 0 ? undefined : e).or(nullToUndefined),
  selected_voiceover_id: z.string().optional().nullable().transform(e => e === '' ? undefined : e).or(nullToUndefined),
  
  // Technical Specifications
  aspect_ratio: z.enum(['16:9', '1:1', '9:16', '4:3', '3:4']).default('16:9'),
  resolution: z.string().default('720p'),
  fps: z.number().default(25),
  max_duration: z.number().min(1).max(60).default(60),
  
  // Advanced Settings
  facial_expressions: z.boolean().default(true),
  gestures: z.boolean().default(true),
  eye_contact: z.boolean().default(true),
  head_movement: z.boolean().default(true),
  
  // Mode 2: Describe & Create
  mode: z.enum(['single', 'describe', 'multi']).optional(),
  main_prompt: z.string().optional(),
  character_count: z.number().optional(),
  characters: z.array(characterSchema).optional(),
  dialog_lines: z.array(z.object({
    id: z.string(),
    characterId: z.string(),
    text: z.string(),
    expression: z.string(),
  })).optional(),
  environment: z.string().optional(),
  custom_environment: z.string().optional(),
  background: z.string().optional(),
  custom_background: z.string().optional(),
  lighting: z.string().optional(),
  custom_lighting: z.string().optional(),
  background_music: z.string().optional(),
  custom_background_music: z.string().optional(),
  sound_effects: z.string().optional(),
  custom_sound_effects: z.string().optional(),
  
  // Mode 3: Multi-Character Scene
  scene_slots: z.array(z.object({
    id: z.string(),
    source: z.enum(['library', 'upload']),
    file: z.any().optional(), // File object
    preview: z.string().optional(),
    avatarId: z.string().optional(),
  })).optional(),
  scene_description: z.string().optional(),
  scene_character_count: z.number().optional(),
  scene_characters: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).optional(),
  scene_dialog_lines: z.array(z.object({
    id: z.string(),
    characterId: z.string(),
    text: z.string(),
    expression: z.string(),
  })).optional(),
  scene_environment: z.string().optional(),
  custom_scene_environment: z.string().optional(),
  scene_background: z.string().optional(),
  custom_scene_background: z.string().optional(),
  scene_lighting: z.string().optional(),
  custom_scene_lighting: z.string().optional(),
  scene_background_music: z.string().optional(),
  custom_scene_background_music: z.string().optional(),
  scene_sound_effects: z.string().optional(),
  custom_scene_sound_effects: z.string().optional(),

  // Metadata
  metadata: z.object({
    projectTitle: z.string().optional(),
    selectedArtifact: z.object({
      id: z.string(),
      title: z.string(),
      image: z.string(),
      description: z.string(),
    }).optional().nullable(),
    timestamp: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if this is describe mode (JSON body) or single mode (FormData)
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      // AI Generate mode (describe) - JSON body
      const body = await request.json()
      const { 
        mode, 
        title, 
        aspect_ratio, 
        main_prompt, 
        character_count,
        characters, 
        dialog_lines, 
        environment, 
        custom_environment,
        background, 
        custom_background,
        lighting, 
        custom_lighting,
        background_music, 
        custom_background_music,
        sound_effects, 
        custom_sound_effects 
      } = body

      if (mode !== 'describe') {
        return NextResponse.json({ error: 'Invalid mode for JSON request' }, { status: 400 })
      }

      // Validate required fields for describe mode
      if (!title?.trim()) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 })
      }

      if (!main_prompt?.trim()) {
        return NextResponse.json({ error: 'Main prompt is required' }, { status: 400 })
      }

      // Build enhanced prompt
      const enhancedPrompt = buildTalkingAvatarsPrompt({
        mainPrompt: main_prompt,
        characters: characters || [],
        dialogLines: dialog_lines || [],
        environment,
        customEnvironment: custom_environment,
        background,
        customBackground: custom_background,
        lighting,
        customLighting: custom_lighting,
        backgroundMusic: background_music,
        customBackgroundMusic: custom_background_music,
        soundEffects: sound_effects,
        customSoundEffects: custom_sound_effects
      })

      console.log('🎬 AI Generate mode - Enhanced prompt:', enhancedPrompt)

      // Call KIE Veo API with veo3 (Quality mode) for audio support
      const kieResult = await generateVeo({
        prompt: enhancedPrompt,
        model: 'veo3', // Use Quality mode for audio support
        generationType: 'TEXT_2_VIDEO',
        aspectRatio: aspect_ratio || '16:9',
        enableTranslation: true
      })

      if (kieResult.code !== 200 || !kieResult.data?.taskId) {
        console.error('KIE API failed:', kieResult)
        return NextResponse.json({ error: 'Failed to start video generation' }, { status: 502 })
      }

      const taskId = kieResult.data.taskId
      console.log('🎬 KIE task started:', taskId)

      // Poll for completion (synchronous wait)
      let videoUrl: string
      try {
        const result = await pollVeoCompletion(taskId)
        videoUrl = result.videoUrl
        console.log('🎬 Video generation completed:', videoUrl)
      } catch (error) {
        console.error('Video generation failed:', error)
        
        // Check if it's a content policy error
        if (error instanceof Error && error.message.includes('Content Policy Violation')) {
          return NextResponse.json({ 
            error: error.message,
            errorType: 'CONTENT_POLICY_VIOLATION'
          }, { status: 400 })
        }
        
        return NextResponse.json({ 
          error: 'Video generation failed: ' + (error instanceof Error ? error.message : 'Unknown error')
        }, { status: 502 })
      }

      // Download video from KIE
      const videoResp = await fetch(videoUrl)
      if (!videoResp.ok) {
        return NextResponse.json({ error: 'Failed to download generated video' }, { status: 502 })
      }
      const videoBuffer = Buffer.from(await videoResp.arrayBuffer())

      // Upload to Supabase Storage
      const fileName = `${uuidv4()}-generated.mp4`
      const storage_path = `renders/talking-avatars/${user.id}/generated/${fileName}`
      const { error: uploadErr } = await supabase.storage
        .from('dreamcut')
        .upload(storage_path, videoBuffer, { 
          contentType: 'video/mp4', 
          cacheControl: '3600' 
        })

      if (uploadErr) {
        return NextResponse.json({ error: 'Failed to store generated video' }, { status: 500 })
      }

      // Create signed URL
      const { data: signedVideo } = await supabase.storage
        .from('dreamcut')
        .createSignedUrl(storage_path, 86400) // 24h

      // Insert to database
      const { data: inserted, error: insertErr } = await supabase
        .from('talking_avatars')
        .insert([{
          user_id: user.id,
          title,
          mode: 'describe',
          aspect_ratio: aspect_ratio || '16:9',
          resolution: '720p',
          fps: 25,
          max_duration: 8, // Default 8 seconds for AI Generate
          facial_expressions: true,
          gestures: true,
          eye_contact: true,
          head_movement: true,
          kie_task_id: taskId, // CRITICAL: Store in dedicated column for future queries
          generated_video_url: signedVideo?.signedUrl || null,
          storage_path,
          status: 'completed',
          metadata: {
            mode: 'describe',
            enhanced_prompt: enhancedPrompt,
            timestamp: new Date().toISOString()
          }
        }])
        .select()

      if (insertErr) {
        console.error('❌ AI Generate database insertion failed:', insertErr)
        return NextResponse.json({ 
          error: 'Failed to save talking avatar', 
          details: insertErr.message 
        }, { status: 500 })
      }

      // Add to library
      await supabase
        .from('library_items')
        .insert({
          user_id: user.id,
          content_type: 'talking_avatars',
          content_id: inserted?.[0]?.id,
          date_added_to_library: new Date().toISOString()
        })

      return NextResponse.json({ 
        message: 'Talking Avatar generated successfully',
        talkingAvatar: inserted?.[0],
        taskId
      }, { status: 201 })
    }

    // Single Avatar mode (existing FormData logic) - DO NOT TOUCH
    const formData = await request.formData()

    const mode = (formData.get('mode')?.toString() || 'single') as 'single' | 'describe' | 'multi'
    const title = formData.get('title')?.toString() || 'Untitled Talking Avatar'
    const aspect_ratio = (formData.get('aspect_ratio')?.toString() || '16:9') as '16:9' | '1:1' | '9:16' | '4:3' | '3:4'

    // Single mode inputs
    const use_custom_image = formData.get('use_custom_image')?.toString() === 'true'
    const selected_avatar_id = formData.get('selected_avatar_id')?.toString() || undefined
    const customImage = formData.get('customImage') as File | null

    const use_custom_audio = formData.get('use_custom_audio')?.toString() === 'true'
    const selected_voiceover_id = formData.get('selected_voiceover_id')?.toString() || undefined
    const audioFile = formData.get('audioFile') as File | null

    // Validate minimal required inputs
    if (!title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Resolve image_url
    let image_url: string | undefined
    if (use_custom_image && customImage) {
      const sanitizedName = customImage.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
      const imagePath = `renders/talking-avatars/${user.id}/inputs/${uuidv4()}-${sanitizedName}`
      const { error: uploadErr } = await supabase.storage
        .from('dreamcut')
        .upload(imagePath, customImage, { cacheControl: '3600', upsert: false })
      if (uploadErr) {
        return NextResponse.json({ error: `Failed to upload image: ${uploadErr.message}` }, { status: 500 })
      }
      const { data: signed } = await supabase.storage.from('dreamcut').createSignedUrl(imagePath, 86400)
      image_url = signed?.signedUrl
    } else if (!use_custom_image && selected_avatar_id) {
      // Fetch avatar by id to get an existing image path/url
      const { data: avatar } = await supabase
        .from('avatars_personas')
        .select('generated_images, storage_paths')
        .eq('id', selected_avatar_id)
        .single()
      const candidatePath = avatar?.storage_paths?.[0] as string | undefined
      if (candidatePath) {
        const { data: signed } = await supabase.storage.from('dreamcut').createSignedUrl(candidatePath, 86400)
        image_url = signed?.signedUrl
      } else if (avatar?.generated_images?.[0]) {
        image_url = avatar.generated_images[0]
      }
    }

    // Resolve audio_url
    let audio_url: string | undefined
    if (use_custom_audio && audioFile) {
      const sanitizedName = audioFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
      const audioPath = `renders/talking-avatars/${user.id}/inputs/${uuidv4()}-${sanitizedName}`
      const { error: uploadErr } = await supabase.storage
        .from('dreamcut')
        .upload(audioPath, audioFile, { cacheControl: '3600', upsert: false })
      if (uploadErr) {
        return NextResponse.json({ error: `Failed to upload audio: ${uploadErr.message}` }, { status: 500 })
      }
      const { data: signed } = await supabase.storage.from('dreamcut').createSignedUrl(audioPath, 86400)
      audio_url = signed?.signedUrl
    } else if (!use_custom_audio && selected_voiceover_id) {
      const { data: voiceover } = await supabase
        .from('voiceovers')
        .select('generated_audio_path, storage_path, content')
        .eq('id', selected_voiceover_id)
        .single()
      const candidateAudioPath = (voiceover?.storage_path || voiceover?.generated_audio_path) as string | undefined
      if (candidateAudioPath) {
        const { data: signed } = await supabase.storage.from('dreamcut').createSignedUrl(candidateAudioPath, 86400)
        audio_url = signed?.signedUrl
      } else if (voiceover?.content?.audio_url) {
        audio_url = voiceover.content.audio_url as string
      }
    }

    // Basic guards for Single mode: require at least one image and one audio source
    if (mode === 'single') {
      if (!image_url) {
        return NextResponse.json({ error: 'No image provided or found for selected avatar' }, { status: 400 })
      }
      if (!audio_url) {
        return NextResponse.json({ error: 'No audio provided or found for selected voiceover' }, { status: 400 })
      }
    }

    // Multi mode processing
    if (mode === 'multi') {
      // Parse multi mode FormData
      const sceneSlots: Array<{
        id: string
        source: 'library' | 'upload'
        file?: File
        preview?: string
        avatarId?: string
      }> = []

      // Extract scene slots from FormData
      let slotIndex = 0
      while (formData.has(`scene_slot_${slotIndex}_source`)) {
        const source = formData.get(`scene_slot_${slotIndex}_source`)?.toString() as 'library' | 'upload'
        const slot: any = {
          id: slotIndex.toString(),
          source
        }

        if (source === 'library') {
          const avatarId = formData.get(`scene_slot_${slotIndex}_avatar_id`)?.toString()
          if (avatarId) {
            slot.avatarId = avatarId
            sceneSlots.push(slot)
          }
        } else if (source === 'upload') {
          const file = formData.get(`scene_slot_${slotIndex}_file`) as File
          if (file) {
            slot.file = file
            sceneSlots.push(slot)
          }
        }

        slotIndex++
      }

      // Extract other multi mode fields
      const sceneDescription = formData.get('scene_description')?.toString() || ''
      const sceneCharacterCount = parseInt(formData.get('scene_character_count')?.toString() || '1')
      const sceneCharacters = JSON.parse(formData.get('scene_characters')?.toString() || '[]')
      const sceneDialogLines = JSON.parse(formData.get('scene_dialog_lines')?.toString() || '[]')
      const sceneEnvironment = formData.get('scene_environment')?.toString() || ''
      const customSceneEnvironment = formData.get('custom_scene_environment')?.toString() || ''
      const sceneBackground = formData.get('scene_background')?.toString() || ''
      const customSceneBackground = formData.get('custom_scene_background')?.toString() || ''
      const sceneLighting = formData.get('scene_lighting')?.toString() || ''
      const customSceneLighting = formData.get('custom_scene_lighting')?.toString() || ''
      const sceneBackgroundMusic = formData.get('scene_background_music')?.toString() || ''
      const customSceneBackgroundMusic = formData.get('custom_scene_background_music')?.toString() || ''
      const sceneSoundEffects = formData.get('scene_sound_effects')?.toString() || ''
      const customSceneSoundEffects = formData.get('custom_scene_sound_effects')?.toString() || ''
      const maxDuration = parseInt(formData.get('max_duration')?.toString() || '148')

      // Validate multi mode inputs
      if (sceneSlots.length === 0) {
        return NextResponse.json({ error: 'At least one scene slot is required' }, { status: 400 })
      }

      if (!sceneDescription.trim()) {
        return NextResponse.json({ error: 'Scene description is required' }, { status: 400 })
      }

      // Process scene slots - upload files and get avatar URLs
      const processedSceneSlots = []
      for (const slot of sceneSlots) {
        if (slot.source === 'library' && slot.avatarId) {
          // Get avatar image URL
          const { data: avatar } = await supabase
            .from('avatars_personas')
            .select('generated_images, storage_paths')
            .eq('id', slot.avatarId)
            .single()
          
          let imageUrl: string | undefined
          const candidatePath = avatar?.storage_paths?.[0] as string | undefined
          if (candidatePath) {
            const { data: signed } = await supabase.storage.from('dreamcut').createSignedUrl(candidatePath, 86400)
            imageUrl = signed?.signedUrl
          } else if (avatar?.generated_images?.[0]) {
            imageUrl = avatar.generated_images[0]
          }

          processedSceneSlots.push({
            id: slot.id,
            source: 'library',
            avatarId: slot.avatarId,
            imageUrl
          })
        } else if (slot.source === 'upload' && slot.file) {
          // Upload file to storage
          const sanitizedName = slot.file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
          const imagePath = `renders/talking-avatars/${user.id}/inputs/${uuidv4()}-${sanitizedName}`
          const { error: uploadErr } = await supabase.storage
            .from('dreamcut')
            .upload(imagePath, slot.file, { cacheControl: '3600', upsert: false })
          
          if (uploadErr) {
            return NextResponse.json({ error: `Failed to upload image: ${uploadErr.message}` }, { status: 500 })
          }
          
          const { data: signed } = await supabase.storage.from('dreamcut').createSignedUrl(imagePath, 86400)
          
          processedSceneSlots.push({
            id: slot.id,
            source: 'upload',
            imageUrl: signed?.signedUrl,
            storagePath: imagePath
          })
        }
      }

      // Process scene slots to get image URLs for REFERENCE_2_VIDEO
      const imageUrls: string[] = []
      const tempImagePaths: string[] = []
      
      for (const slot of processedSceneSlots) {
        if (slot.imageUrl) {
          imageUrls.push(slot.imageUrl)
          if (slot.storagePath) {
            tempImagePaths.push(slot.storagePath)
          }
        }
      }

      if (imageUrls.length === 0) {
        return NextResponse.json({ error: 'No valid avatar images found' }, { status: 400 })
      }

      if (imageUrls.length > 3) {
        return NextResponse.json({ error: 'Maximum 3 avatar images allowed for REFERENCE_2_VIDEO' }, { status: 400 })
      }

      // Build enhanced prompt for multi-avatar scene
      const enhancedPrompt = buildMultiAvatarPrompt({
        sceneDescription,
        sceneCharacters,
        dialogLines: sceneDialogLines,
        environment: sceneEnvironment,
        customEnvironment: customSceneEnvironment,
        background: sceneBackground,
        customBackground: customSceneBackground,
        lighting: sceneLighting,
        customLighting: customSceneLighting,
        backgroundMusic: sceneBackgroundMusic,
        customBackgroundMusic: customSceneBackgroundMusic,
        soundEffects: sceneSoundEffects,
        customSoundEffects: customSceneSoundEffects,
        imageCount: imageUrls.length
      })

      console.log('🎬 Multi Avatar mode - Enhanced prompt:', enhancedPrompt)
      console.log('🎬 Multi Avatar mode - Image URLs:', imageUrls)

      // Call KIE Veo API with REFERENCE_2_VIDEO
      // NOTE: REFERENCE_2_VIDEO only supports veo3_fast (no audio) - will add TTS overlay
      const kieResult = await generateVeo({
        prompt: enhancedPrompt,
        imageUrls: imageUrls,
        model: 'veo3_fast', // Required for REFERENCE_2_VIDEO (no audio support)
        generationType: 'REFERENCE_2_VIDEO',
        aspectRatio: '16:9', // FIXED for REFERENCE_2_VIDEO
        enableTranslation: true
      })

      if (kieResult.code !== 200 || !kieResult.data?.taskId) {
        console.error('KIE API failed:', kieResult)
        return NextResponse.json({ error: 'Failed to start video generation' }, { status: 502 })
      }

      const taskId = kieResult.data.taskId
      console.log('🎬 KIE task started:', taskId)

      // Poll for completion (synchronous wait)
      let videoUrl: string
      try {
        const result = await pollVeoCompletion(taskId)
        videoUrl = result.videoUrl
        console.log('🎬 Video generation completed:', videoUrl)
      } catch (error) {
        console.error('Video generation failed:', error)
        
        // Check if it's a content policy error
        if (error instanceof Error && error.message.includes('Content Policy Violation')) {
          return NextResponse.json({ 
            error: error.message,
            errorType: 'CONTENT_POLICY_VIOLATION'
          }, { status: 400 })
        }
        
        return NextResponse.json({ 
          error: 'Video generation failed: ' + (error instanceof Error ? error.message : 'Unknown error')
        }, { status: 502 })
      }

      // Download video from KIE
      const videoResp = await fetch(videoUrl)
      if (!videoResp.ok) {
        return NextResponse.json({ error: 'Failed to download generated video' }, { status: 502 })
      }
      const videoBuffer = Buffer.from(await videoResp.arrayBuffer())

      // Upload to Supabase Storage
      const fileName = `${uuidv4()}-multi-generated.mp4`
      const storage_path = `renders/talking-avatars/${user.id}/multi/${fileName}`
      const { error: uploadErr } = await supabase.storage
        .from('dreamcut')
        .upload(storage_path, videoBuffer, { 
          cacheControl: '3600', 
          upsert: false,
          contentType: 'video/mp4'
        })

      if (uploadErr) {
        return NextResponse.json({ error: `Failed to upload video: ${uploadErr.message}` }, { status: 500 })
      }

      // Create signed URL
      const { data: signedUrlData } = await supabase.storage
        .from('dreamcut')
        .createSignedUrl(storage_path, 86400) // 24 hours

      if (!signedUrlData?.signedUrl) {
        return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 })
      }

      // Insert to database
      const { data: inserted, error: insertErr } = await supabase
        .from('talking_avatars')
        .insert([{
          user_id: user.id,
          title,
          mode: 'multi',
          aspect_ratio: '16:9', // FIXED for REFERENCE_2_VIDEO
          resolution: '720p',
          fps: 25,
          max_duration: 8, // Default 8 seconds for Multi Avatar
          facial_expressions: true,
          gestures: true,
          eye_contact: true,
          head_movement: true,
          kie_task_id: taskId,
          generated_video_url: signedUrlData.signedUrl,
          storage_path,
          status: 'completed',
          metadata: {
            mode: 'multi',
            enhanced_prompt: enhancedPrompt,
            scene_character_count: sceneCharacterCount,
            image_references: imageUrls.length,
            scene_slots: processedSceneSlots,
            scene_description: sceneDescription,
            scene_characters: sceneCharacters,
            scene_dialog_lines: sceneDialogLines,
            scene_environment: sceneEnvironment,
            custom_scene_environment: customSceneEnvironment,
            scene_background: sceneBackground,
            custom_scene_background: customSceneBackground,
            scene_lighting: sceneLighting,
            custom_scene_lighting: customSceneLighting,
            scene_background_music: sceneBackgroundMusic,
            custom_scene_background_music: customSceneBackgroundMusic,
            scene_sound_effects: sceneSoundEffects,
            custom_scene_sound_effects: customSceneSoundEffects
          }
        }])
        .select()

      if (insertErr) {
        console.error('❌ Multi Avatar database insertion failed:', insertErr)
        console.log('📁 Video file preserved in storage for user access:', storage_path)
        
        return NextResponse.json({ 
          error: 'Failed to save talking avatar', 
          details: insertErr.message 
        }, { status: 500 })
      }

      // Add to library
      await supabase
        .from('library_items')
        .insert({
          user_id: user.id,
          content_type: 'talking_avatars',
          content_id: inserted?.[0]?.id,
          date_added_to_library: new Date().toISOString()
        })

      // Clean up temporary images
      if (tempImagePaths.length > 0) {
        await cleanupTempImages(tempImagePaths)
      }

      return NextResponse.json({ 
        message: 'Multi-avatar video generated successfully',
        talkingAvatar: inserted?.[0],
        taskId
      }, { status: 201 })
    }

    // Call fal.ai veed/fabric-1.0 (resolution forced to 720p)
    const fal = getFalClient()
    const falResult = await fal.subscribe('veed/fabric-1.0', {
      input: {
        image_url,
        audio_url,
        resolution: '720p'
      },
      logs: true
    })

    const outputUrl: string | undefined = falResult?.data?.video?.url
    if (!outputUrl) {
      return NextResponse.json({ error: 'Failed to generate video' }, { status: 502 })
    }

    // Download generated video and upload to Supabase Storage
    const resp = await fetch(outputUrl)
    if (!resp.ok) {
      return NextResponse.json({ error: `Failed to download generated video: ${resp.status}` }, { status: 502 })
    }
    const arrayBuffer = await resp.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileName = `${uuidv4()}-generated.mp4`
    const storage_path = `renders/talking-avatars/${user.id}/generated/${fileName}`
    const { error: uploadGenErr } = await supabase.storage
      .from('dreamcut')
      .upload(storage_path, buffer, { contentType: 'video/mp4', cacheControl: '3600' })
    if (uploadGenErr) {
      return NextResponse.json({ error: `Failed to store generated video: ${uploadGenErr.message}` }, { status: 500 })
    }
    const { data: signedVideo } = await supabase.storage.from('dreamcut').createSignedUrl(storage_path, 86400)

    // Persist DB record
    const { data: inserted, error: insertErr } = await supabase
      .from('talking_avatars')
      .insert([
        {
          user_id: user.id,
          title,
          use_custom_image,
          selected_avatar_id: selected_avatar_id || null,
          use_custom_audio,
          selected_voiceover_id: selected_voiceover_id || null,
          aspect_ratio,
          resolution: '720p',
          fps: 25,
          max_duration: 60,
          facial_expressions: true,
          gestures: true,
          eye_contact: true,
          head_movement: true,
          generated_video_url: signedVideo?.signedUrl || null,
          storage_path,
          status: 'completed',
          metadata: {
            mode,
            timestamp: new Date().toISOString()
          }
        }
      ])
      .select()

    if (insertErr) {
      return NextResponse.json({ error: 'Failed to save talking avatar' }, { status: 500 })
    }

    // Add to library
    await supabase
      .from('library_items')
      .insert({
        user_id: user.id,
        content_type: 'talking_avatars',
        content_id: inserted?.[0]?.id,
        date_added_to_library: new Date().toISOString()
      })

    return NextResponse.json({ 
      message: 'Talking Avatar generated and saved successfully',
      talkingAvatar: inserted?.[0] || null,
      requestId: falResult?.requestId || null
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error generating talking avatar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to fetch talking_avatars by user
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: talkingAvatars, error } = await supabase
    .from('talking_avatars')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching talking_avatars:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(talkingAvatars, { status: 200 });
}

// PUT endpoint to update a talking_avatar
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, ...updates } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'Talking Avatar ID is required for update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('talking_avatars')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select();

  if (error) {
    console.error('Error updating talking_avatar:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Talking Avatar not found or unauthorized' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Talking Avatar updated successfully', data }, { status: 200 });
}

// DELETE endpoint to delete a talking_avatar
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'Talking Avatar ID is required for deletion' }, { status: 400 });
  }

  const { error } = await supabase
    .from('talking_avatars')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting talking_avatar:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Talking Avatar deleted successfully' }, { status: 200 });
}
