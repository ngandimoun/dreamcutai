warning: in the working copy of 'app/api/voice-creation/route.ts', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/app/api/voice-creation/route.ts b/app/api/voice-creation/route.ts[m
[1mindex 4061e08..9910cc6 100644[m
[1m--- a/app/api/voice-creation/route.ts[m
[1m+++ b/app/api/voice-creation/route.ts[m
[36m@@ -2,6 +2,7 @@[m [mimport { createClient } from '@/lib/supabase/server'[m
 import { NextRequest, NextResponse } from 'next/server'[m
 import { z } from 'zod'[m
 import { v4 as uuidv4 } from 'uuid'[m
[32m+[m[32mimport { POST as voiceDesignHandler } from '@/app/api/elevenlabs/voice-design/route'[m
 [m
 // Cache for 30 seconds[m
 export const revalidate = 30[m
[36m@@ -26,14 +27,14 @@[m [mconst createVoiceCreationSchema = z.object({[m
   audio_quality: z.string().optional(),[m
   guidance_scale: z.number().min(0).max(100).optional().default(50),[m
   preview_text: z.string().optional(),[m
[31m-  brand_sync: z.boolean().optional().default(false),[m
[31m-  world_link: z.string().optional(),[m
[31m-  tone_match: z.number().min(0).max(100).optional().default(50),[m
   is_asmr_voice: z.boolean().optional().default(false),[m
   asmr_intensity: z.number().min(0).max(100).optional().default(50),[m
   asmr_triggers: z.array(z.string()).optional().default([]),[m
   asmr_background: z.string().optional(),[m
   tags: z.array(z.string()).optional().default([]),[m
[32m+[m[32m  voice_id: z.string().optional(),[m
[32m+[m[32m  auto_generate_text: z.boolean().optional().default(false),[m
[32m+[m[32m  category: z.string().optional(),[m
   created_at: z.string().optional(),[m
   content: z.record(z.any()).optional(),[m
   metadata: z.record(z.any()).optional(),[m
[36m@@ -77,7 +78,36 @@[m [mexport async function GET(request: NextRequest) {[m
       return NextResponse.json({ error: 'Failed to fetch voice creations' }, { status: 500 })[m
     }[m
 [m
[31m-    return NextResponse.json({ voiceCreations }, { [m
[32m+[m[32m    // Regenerate expired signed URLs (avatar-persona pattern)[m
[32m+[m[32m    if (voiceCreations && voiceCreations.length > 0) {[m
[32m+[m[32m      for (const voice of voiceCreations) {[m
[32m+[m[32m        // Regenerate primary voice URL[m
[32m+[m[32m        if (voice.storage_path) {[m
[32m+[m[32m          const { data: signedUrlData } = await supabase.storage[m
[32m+[m[32m            .from('dreamcut')[m
[32m+[m[32m            .createSignedUrl(voice.storage_path, 86400) // 24 hour expiry[m
[32m+[m[32m          if (signedUrlData?.signedUrl) {[m
[32m+[m[32m            voice.generated_audio_path = signedUrlData.signedUrl[m
[32m+[m[32m          }[m
[32m+[m[32m        }[m
[32m+[m[41m        [m
[32m+[m[32m        // Regenerate all preview URLs[m
[32m+[m[32m        if (voice.content?.all_previews) {[m
[32m+[m[32m          for (const preview of voice.content.all_previews) {[m
[32m+[m[32m            if (preview.storage_path) {[m
[32m+[m[32m              const { data: signedUrlData } = await supabase.storage[m
[32m+[m[32m                .from('dreamcut')[m
[32m+[m[32m                .createSignedUrl(preview.storage_path, 86400)[m
[32m+[m[32m              if (signedUrlData?.signedUrl) {[m
[32m+[m[32m                preview.signed_url = signedUrlData.signedUrl[m
[32m+[m[32m              }[m
[32m+[m[32m            }[m
[32m+[m[32m          }[m
[32m+[m[32m        }[m
[32m+[m[32m      }[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    return NextResponse.json({ voiceCreations: voiceCreations }, {[m[41m [m
       status: 200,[m
       headers: {[m
         'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',[m
[36m@@ -107,6 +137,28 @@[m [mexport async function POST(request: NextRequest) {[m
     const body = await request.json()[m
     const validatedData = createVoiceCreationSchema.parse(body)[m
 [m
[32m+[m[32m    // Generate unique ID for this generation[m
[32m+[m[32m    const generationId = `vc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`[m
[32m+[m[32m    const generationTimestamp = new Date().toISOString()[m
[32m+[m
[32m+[m[32m    // Generate voice_id (will be set after insert)[m
[32m+[m[32m    const voiceId = validatedData.voice_id || `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`[m
[32m+[m
[32m+[m[32m    // Determine category based on purpose[m
[32m+[m[32m    const getCategoryFromPurpose = (purpose: string | undefined): string => {[m
[32m+[m[32m      if (!purpose) return 'General'[m
[32m+[m[32m      const purposeLower = purpose.toLowerCase()[m
[32m+[m[32m      if (purposeLower.includes('narrator') || purposeLower.includes('storyteller')) return 'Narration'[m
[32m+[m[32m      if (purposeLower.includes('character') || purposeLower.includes('game')) return 'Character'[m
[32m+[m[32m      if (purposeLower.includes('brand') || purposeLower.includes('commercial')) return 'Brand'[m
[32m+[m[32m      if (purposeLower.includes('educational') || purposeLower.includes('instructor')) return 'Educational'[m
[32m+[m[32m      if (purposeLower.includes('asmr') || purposeLower.includes('meditation')) return 'ASMR'[m
[32m+[m[32m      if (purposeLower.includes('podcast') || purposeLower.includes('radio')) return 'Podcast'[m
[32m+[m[32m      return 'General'[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    const category = validatedData.category || getCategoryFromPurpose(validatedData.purpose)[m
[32m+[m
     console.log('📝 Voice creation data:', {[m
       prompt: validatedData.prompt,[m
       name: validatedData.name,[m
[36m@@ -126,28 +178,121 @@[m [mexport async function POST(request: NextRequest) {[m
       audio_quality: validatedData.audio_quality,[m
       guidance_scale: validatedData.guidance_scale,[m
       preview_text: validatedData.preview_text,[m
[31m-      brand_sync: validatedData.brand_sync,[m
[31m-      world_link: validatedData.world_link,[m
[31m-      tone_match: validatedData.tone_match,[m
       is_asmr_voice: validatedData.is_asmr_voice,[m
       asmr_intensity: validatedData.asmr_intensity,[m
       asmr_triggers: validatedData.asmr_triggers,[m
       asmr_background: validatedData.asmr_background,[m
[32m+[m[32m      voice_id: voiceId,[m
[32m+[m[32m      auto_generate_text: validatedData.auto_generate_text,[m
[32m+[m[32m      category: category,[m
       tags: validatedData.tags[m
     })[m
 [m
[31m-    // Generate unique ID for this generation[m
[31m-    const generationId = `vc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`[m
[31m-    const generationTimestamp = new Date().toISOString()[m
[32m+[m[32m    // Call ElevenLabs Voice Design API directly (no HTTP overhead)[m
[32m+[m[32m    console.log('🎨 [VOICE CREATION API] Calling voice design handler...')[m
[32m+[m[32m    console.log('📦 [VOICE CREATION API] Voice design request:', {[m
[32m+[m[32m      voice_description: validatedData.prompt.substring(0, 100) + '...',[m
[32m+[m[32m      text_length: validatedData.preview_text?.length || 0,[m
[32m+[m[32m      guidance_scale: validatedData.guidance_scale,[m
[32m+[m[32m      loudness: (validatedData.pitch - 50) / 50[m
[32m+[m[32m    })[m
 [m
[31m-    // For now, we'll simulate audio generation with placeholder URLs[m
[31m-    // In a real implementation, you would call an AI voice generation service[m
[31m-    const generatedAudioUrl = `https://example.com/generated_voice_${generationId}.mp3`[m
[31m-    const generatedStoragePath = `renders/voice-creation/${user.id}/generated/${uuidv4()}-generated_voice.mp3`[m
[32m+[m[32m    // Build request body conditionally[m
[32m+[m[32m    const voiceDesignRequestBody: any = {[m
[32m+[m[32m      voice_description: validatedData.prompt, // Enhanced prompt[m
[32m+[m[32m      guidance_scale: validatedData.guidance_scale,[m
[32m+[m[32m      loudness: (validatedData.pitch - 50) / 50, // Map 0-100 to -1 to 1[m
[32m+[m[32m      model_id: 'eleven_ttv_v3',[m
[32m+[m[32m      output_format: 'mp3_44100_192'[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    // If preview text is provided, use it. Otherwise, auto-generate[m
[32m+[m[32m    if (validatedData.preview_text && validatedData.preview_text.trim()) {[m
[32m+[m[32m      voiceDesignRequestBody.text = validatedData.preview_text[m
[32m+[m[32m      voiceDesignRequestBody.auto_generate_text = false[m
[32m+[m[32m    } else {[m
[32m+[m[32m      voiceDesignRequestBody.auto_generate_text = true[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    const voiceDesignRequest = new Request('http://localhost/api/elevenlabs/voice-design', {[m
[32m+[m[32m      method: 'POST',[m
[32m+[m[32m      headers: { 'Content-Type': 'application/json' },[m
[32m+[m[32m      body: JSON.stringify(voiceDesignRequestBody)[m
[32m+[m[32m    })[m
[32m+[m[41m    [m
[32m+[m[32m    const voiceDesignResponse = await voiceDesignHandler(voiceDesignRequest)[m
 [m
[31m-    console.log('🎵 Generated audio:', generatedAudioUrl)[m
[32m+[m[32m    console.log('📡 [VOICE CREATION API] Voice design response status:', voiceDesignResponse.status)[m
 [m
[31m-    // Create voice creation[m
[32m+[m[32m    if (!voiceDesignResponse.ok) {[m
[32m+[m[32m      const errorData = await voiceDesignResponse.json()[m
[32m+[m[32m      console.error('❌ [VOICE CREATION API] Voice design failed:', errorData)[m
[32m+[m[32m      throw new Error(`Voice design generation failed: ${errorData.error || 'Unknown error'}`)[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    const { previews, text } = await voiceDesignResponse.json()[m
[32m+[m[32m    console.log('✅ [VOICE CREATION API] Voice design success:', {[m
[32m+[m[32m      previews_count: previews?.length || 0,[m
[32m+[m[32m      text_used: text?.length || 0[m
[32m+[m[32m    })[m
[32m+[m
[32m+[m[32m    // Upload ALL 3 previews to Supabase Storage[m
[32m+[m[32m    console.log('📤 [VOICE CREATION API] Starting upload of', previews.length, 'voice previews...')[m
[32m+[m[32m    const uploadedPreviews = [][m
[32m+[m[32m    for (let i = 0; i < previews.length; i++) {[m
[32m+[m[32m      const preview = previews[i][m
[32m+[m[32m      console.log(`📤 [VOICE CREATION API] Uploading voice ${i + 1}/3...`)[m
[32m+[m[41m      [m
[32m+[m[32m      // Convert base64 to buffer[m
[32m+[m[32m      const audioBuffer = Buffer.from(preview.audio_base_64, 'base64')[m
[32m+[m[32m      console.log(`📦 [VOICE CREATION API] Audio buffer size: ${audioBuffer.length} bytes`)[m
[32m+[m[41m      [m
[32m+[m[32m      // Upload to Supabase[m
[32m+[m[32m      const fileName = `${uuidv4()}-voice_${i + 1}.mp3`[m
[32m+[m[32m      const filePath = `renders/voice-creation/${user.id}/generated/${fileName}`[m
[32m+[m[32m      console.log(`📁 [VOICE CREATION API] Upload path: ${filePath}`)[m
[32m+[m[41m      [m
[32m+[m[32m      const { error: uploadError } = await supabase.storage[m
[32m+[m[32m        .from('dreamcut')[m
[32m+[m[32m        .upload(filePath, audioBuffer, {[m
[32m+[m[32m          contentType: 'audio/mpeg',[m
[32m+[m[32m          cacheControl: '3600'[m
[32m+[m[32m        })[m
[32m+[m[41m      [m
[32m+[m[32m      if (uploadError) {[m
[32m+[m[32m        console.error(`❌ [VOICE CREATION API] Error uploading voice ${i + 1}:`, uploadError)[m
[32m+[m[32m        throw new Error(`Failed to upload voice ${i + 1}`)[m
[32m+[m[32m      }[m
[32m+[m[41m      [m
[32m+[m[32m      // Get signed URL (24 hour expiry)[m
[32m+[m[32m      const { data: signedUrlData } = await supabase.storage[m
[32m+[m[32m        .from('dreamcut')[m
[32m+[m[32m        .createSignedUrl(filePath, 86400)[m
[32m+[m[41m      [m
[32m+[m[32m      uploadedPreviews.push({[m
[32m+[m[32m        generated_voice_id: preview.generated_voice_id, // THE VOICE ID![m
[32m+[m[32m        audio_base_64: preview.audio_base_64,[m
[32m+[m[32m        storage_path: filePath,[m
[32m+[m[32m        signed_url: signedUrlData?.signedUrl,[m
[32m+[m[32m        media_type: preview.media_type,[m
[32m+[m[32m        duration_secs: preview.duration_secs,[m
[32m+[m[32m        language: preview.language,[m
[32m+[m[32m        is_primary: i === 0 // First one is primary by default[m
[32m+[m[32m      })[m
[32m+[m[41m      [m
[32m+[m[32m      console.log(`✅ [VOICE CREATION API] Uploaded voice ${i + 1}/3: ${filePath}`)[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    // Use primary voice (first variation)[m
[32m+[m[32m    const primaryVoice = uploadedPreviews[0][m
[32m+[m[32m    const generatedAudioUrl = primaryVoice.signed_url[m
[32m+[m[32m    const generatedStoragePath = primaryVoice.storage_path[m
[32m+[m[32m    const actualVoiceId = primaryVoice.generated_voice_id[m
[32m+[m
[32m+[m[32m    console.log('🎵 [VOICE CREATION API] Generated audio:', generatedAudioUrl)[m
[32m+[m
[32m+[m[32m    // Create single voice creation record with all 3 variations[m
[32m+[m[32m    console.log('💾 [VOICE CREATION API] Creating single record with all 3 voice variations...')[m
     const { data: voiceCreation, error } = await supabase[m
       .from('voices_creations')[m
       .insert({[m
[36m@@ -177,17 +322,17 @@[m [mexport async function POST(request: NextRequest) {[m
         guidance_scale: validatedData.guidance_scale,[m
         preview_text: validatedData.preview_text,[m
         [m
[31m-        // Brand / World Sync[m
[31m-        brand_sync: validatedData.brand_sync,[m
[31m-        world_link: validatedData.world_link,[m
[31m-        tone_match: validatedData.tone_match,[m
[31m-        [m
         // ASMR Voice Options[m
         is_asmr_voice: validatedData.is_asmr_voice,[m
         asmr_intensity: validatedData.asmr_intensity,[m
         asmr_triggers: validatedData.asmr_triggers,[m
         asmr_background: validatedData.asmr_background,[m
         [m
[32m+[m[32m        // New Fields[m
[32m+[m[32m        voice_id: actualVoiceId, // Primary voice ID[m
[32m+[m[32m        auto_generate_text: validatedData.auto_generate_text,[m
[32m+[m[32m        category: category,[m
[32m+[m[41m        [m
         // Generated Content[m
         generated_audio_path: generatedAudioUrl,[m
         storage_path: generatedStoragePath,[m
[36m@@ -198,6 +343,7 @@[m [mexport async function POST(request: NextRequest) {[m
         metadata: {[m
           generationTimestamp,[m
           generationId,[m
[32m+[m[32m          voice_id: actualVoiceId,[m
           prompt: validatedData.prompt,[m
           name: validatedData.name,[m
           purpose: validatedData.purpose,[m
[36m@@ -216,33 +362,38 @@[m [mexport async function POST(request: NextRequest) {[m
           audio_quality: validatedData.audio_quality,[m
           guidance_scale: validatedData.guidance_scale,[m
           preview_text: validatedData.preview_text,[m
[31m-          brand_sync: validatedData.brand_sync,[m
[31m-          world_link: validatedData.world_link,[m
[31m-          tone_match: validatedData.tone_match,[m
           is_asmr_voice: validatedData.is_asmr_voice,[m
           asmr_intensity: validatedData.asmr_intensity,[m
           asmr_triggers: validatedData.asmr_triggers,[m
           asmr_background: validatedData.asmr_background,[m
[32m+[m[32m          auto_generate_text: validatedData.auto_generate_text,[m
[32m+[m[32m          category: category,[m
           tags: validatedData.tags,[m
           generated_via: 'voice-creation'[m
         },[m
         content: {[m
           audio_url: generatedAudioUrl,[m
           generation_id: generationId,[m
[32m+[m[32m          voice_id: actualVoiceId,[m
           full_prompt: validatedData.prompt,[m
           settings: validatedData,[m
[31m-          created_at: validatedData.created_at || generationTimestamp[m
[32m+[m[32m          auto_generate_text: validatedData.auto_generate_text,[m
[32m+[m[32m          category: category,[m
[32m+[m[32m        