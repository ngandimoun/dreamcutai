import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { getReplicateClient } from '@/lib/utils/replicate-client'
// AI enhancement temporarily removed

const createSubtitleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  video_file_input: z.string().url("Valid video URL required"),
  
  // Replicate autocaption inputs
  font: z.string().default("Poppins/Poppins-ExtraBold.ttf"),
  color: z.string().default("white"),
  kerning: z.number().default(-5),
  opacity: z.number().default(0),
  MaxChars: z.number().int().default(20),
  fontsize: z.number().default(7),
  translate: z.boolean().default(false),
  // REMOVED: output_video - always true on backend
  stroke_color: z.string().default("black"),
  stroke_width: z.number().default(2.6),
  right_to_left: z.boolean().default(false),
  subs_position: z.string().default("bottom75"),
  highlight_color: z.string().default("yellow"),
  // REMOVED: output_transcript - always true on backend
  transcript_file_input: z.string().optional(),
  
  // Optional features
  language: z.string().default("auto"),
  
  // AI features - accept but ignore for now
  emoji_enrichment: z.boolean().optional(),
  emoji_strategy: z.enum(["AI", "manualMap"]).optional(),
  emoji_map: z.record(z.string()).optional(),
  keyword_emphasis: z.boolean().optional(),
  keywords: z.array(z.string()).optional(),
  keyword_style: z.enum(["CAPS", "EMOJI_WRAP", "ASTERISKS"]).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  console.log('🎬 Starting subtitle generation workflow...')
  console.log('👤 User ID:', user.id)

  try {
    const body = await request.json()
    console.log('📥 Request body:', JSON.stringify(body, null, 2))
    
    const validatedData = createSubtitleSchema.parse(body)
    console.log('✅ Input validation passed')

    const replicate = getReplicateClient()

    // SINGLE PASS: Generate both video and transcript
    console.log('\n=== SUBTITLE GENERATION ===')
    console.log('🎬 Generating subtitled video...')
    console.log('📹 Video URL:', validatedData.video_file_input)
    console.log('🌐 Language: auto-detect (language selector removed)')
    console.log('🎨 AI Enhancement: DISABLED (temporarily removed)')
    
    const generationStartTime = Date.now()
    
    // Log the input parameters being sent to Replicate
    const replicateInput = {
      video_file_input: validatedData.video_file_input,
      output_video: true,      // Generate video WITH subtitles
      output_transcript: true, // Also get transcript JSON
      font: validatedData.font,
      color: validatedData.color,
      kerning: validatedData.kerning,
      opacity: validatedData.opacity,
      MaxChars: validatedData.MaxChars,
      fontsize: validatedData.fontsize,
      translate: validatedData.translate,
      stroke_color: validatedData.stroke_color,
      stroke_width: validatedData.stroke_width,
      right_to_left: validatedData.right_to_left,
      subs_position: validatedData.subs_position,
      highlight_color: validatedData.highlight_color,
      language: "auto", // Force auto-detect since language selector is removed
    }
    
    // If video is from Supabase (signed URL), make it publicly accessible
    let publicVideoUrl = validatedData.video_file_input
    
    if (validatedData.video_file_input.includes('supabase.co/storage')) {
      console.log('🔄 Converting Supabase signed URL to public URL...')
      
      // Download video
      const videoResp = await fetch(validatedData.video_file_input)
      if (!videoResp.ok) {
        throw new Error('Failed to download source video')
      }
      const videoBuffer = await videoResp.arrayBuffer()
      
      // Upload to public temp bucket (using existing dreamcut bucket with public access)
      const tempFileName = `${uuidv4()}.mp4`
      const tempPath = `temp/replicate/${user.id}/${tempFileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('dreamcut')
        .upload(tempPath, videoBuffer, {
          contentType: 'video/mp4',
          cacheControl: '3600'
        })
      
      if (uploadError) {
        throw new Error(`Failed to create public video: ${uploadError.message}`)
      }
      
      // Get public URL (create signed URL with longer expiry)
      const { data: publicData } = await supabase.storage
        .from('dreamcut')
        .createSignedUrl(tempPath, 86400) // 24 hours
      
      publicVideoUrl = publicData.signedUrl
      console.log('✅ Public video URL created:', publicVideoUrl)
      
      // Update the input with the public URL
      replicateInput.video_file_input = publicVideoUrl
    }

    console.log('🔧 Replicate input parameters:', JSON.stringify(replicateInput, null, 2))
    
    const output = await replicate.run(
      "fictions-ai/autocaption:18a45ff0d95feb4449d192bbdc06b4a6df168fa33def76dfc51b78ae224b599b",
      {
        input: replicateInput
      }
    )
    
    const generationDuration = Date.now() - generationStartTime
    console.log(`✅ Generation completed in ${generationDuration}ms`)
    
    // Log the raw output from Replicate
    console.log('📦 Raw Replicate output type:', typeof output)
    console.log('📦 Output is array:', Array.isArray(output))
    console.log('📦 Output length:', Array.isArray(output) ? output.length : 'not an array')

    // Extract URLs - Replicate FileOutput objects can be converted to strings
    let videoUrl: string | null = null
    let transcriptUrl: string | null = null

    if (Array.isArray(output) && output.length >= 2) {
      // Try multiple extraction methods
      const video = output[0]
      const transcript = output[1]
      
      console.log('🔍 Video output type:', typeof video)
      console.log('🔍 Video output:', video)
      console.log('🔍 Transcript output type:', typeof transcript)
      console.log('🔍 Transcript output:', transcript)
      
      // Extract video URL
      if (typeof video === 'string') {
        videoUrl = video
      } else if (video?.url) {
        videoUrl = typeof video.url === 'function' ? await video.url() : video.url
      } else {
        // Try String conversion (works for FileOutput objects)
        const urlStr = String(video)
        if (urlStr && urlStr !== '[object Object]' && urlStr.startsWith('http')) {
          videoUrl = urlStr
        } else {
          // Last resort: try using the FileOutput object directly
          console.log('⚠️ Trying to use FileOutput object directly for video')
          try {
            // FileOutput objects might work directly with fetch
            const testResp = await fetch(video)
            if (testResp.ok) {
              videoUrl = String(video) // If fetch works, the object is valid
            }
          } catch (error) {
            console.error('❌ FileOutput object not usable with fetch:', error)
          }
        }
      }
      
      // Extract transcript URL
      if (typeof transcript === 'string') {
        transcriptUrl = transcript
      } else if (transcript?.url) {
        transcriptUrl = typeof transcript.url === 'function' ? await transcript.url() : transcript.url
      } else {
        const urlStr = String(transcript)
        if (urlStr && urlStr !== '[object Object]' && urlStr.startsWith('http')) {
          transcriptUrl = urlStr
        } else {
          // Last resort: try using the FileOutput object directly
          console.log('⚠️ Trying to use FileOutput object directly for transcript')
          try {
            // FileOutput objects might work directly with fetch
            const testResp = await fetch(transcript)
            if (testResp.ok) {
              transcriptUrl = String(transcript) // If fetch works, the object is valid
            }
          } catch (error) {
            console.error('❌ FileOutput object not usable with fetch:', error)
          }
        }
      }
    }

    console.log('✅ Extracted video URL:', videoUrl)
    console.log('✅ Extracted transcript URL:', transcriptUrl)

    if (!videoUrl) {
      console.error('❌ Failed to extract video URL from output')
      return NextResponse.json({ error: 'Failed to generate video' }, { status: 502 })
    }

    // Download and store transcript (if available) - NO AI ENHANCEMENT
    let transcript_storage_path = null
    
    if (transcriptUrl) {
      console.log('\n=== TRANSCRIPT PROCESSING ===')
      const transcriptResp = await fetch(transcriptUrl)
      if (transcriptResp.ok) {
        const transcriptData = await transcriptResp.json()
        console.log('📊 Transcript downloaded, storing...')

        const transcriptFileName = `${uuidv4()}-transcript.json`
        transcript_storage_path = `renders/subtitles/${user.id}/transcripts/${transcriptFileName}`
        
        await supabase.storage
          .from('dreamcut')
          .upload(transcript_storage_path, JSON.stringify(transcriptData), { 
            contentType: 'application/json',
            cacheControl: '3600'
          })
        console.log('✅ Transcript stored:', transcript_storage_path)
      }
    }

    // Download and store video
    console.log('\n=== VIDEO STORAGE ===')
    console.log('⬇️ Downloading generated video...')
    const resp = await fetch(videoUrl)
    if (!resp.ok) {
      console.error(`❌ Failed to download video: HTTP ${resp.status}`)
      return NextResponse.json({ error: `Failed to download video: ${resp.status}` }, { status: 502 })
    }
    const arrayBuffer = await resp.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('📦 Video size:', (buffer.length / 1024 / 1024).toFixed(2), 'MB')
    
    const fileName = `${uuidv4()}-generated.mp4`
    const storage_path = `renders/subtitles/${user.id}/generated/${fileName}`
    console.log('💾 Storing video to:', storage_path)
    
    const { error: uploadErr } = await supabase.storage
      .from('dreamcut')
      .upload(storage_path, buffer, { contentType: 'video/mp4', cacheControl: '3600' })
    
    if (uploadErr) {
      console.error('❌ Video upload failed:', uploadErr)
      return NextResponse.json({ error: `Failed to store video: ${uploadErr.message}` }, { status: 500 })
    }
    console.log('✅ Video stored successfully')

    // Generate signed URLs
    const { data: signedVideo } = await supabase.storage
      .from('dreamcut')
      .createSignedUrl(storage_path, 86400)
    console.log('🔗 Video signed URL generated')

    let signedTranscript = null
    if (transcript_storage_path) {
      const { data: transcriptData } = await supabase.storage
        .from('dreamcut')
        .createSignedUrl(transcript_storage_path, 86400)
      signedTranscript = transcriptData
      console.log('🔗 Transcript signed URL generated')
    }

    // Save to database
    console.log('\n=== DATABASE STORAGE ===')
    console.log('💾 Saving subtitle record to database...')
    const { data: inserted, error: insertErr } = await supabase
      .from('subtitles')
      .insert([{
        user_id: user.id,
        title: validatedData.title,
        video_file_input: validatedData.video_file_input,
        emoji_enrichment: false, // AI features disabled
        keyword_emphasis: false, // AI features disabled
        storage_path,
        status: 'completed',
        content: {
          video_storage_path: storage_path,
          transcript_storage_path: transcript_storage_path,
          ai_enhanced: false, // AI features disabled
          ...validatedData
        },
        metadata: {
          timestamp: new Date().toISOString(),
          replicate_video_output: videoUrl,
          replicate_transcript_output: transcriptUrl,
          ai_enhancement_applied: false, // AI features disabled
          processing_times: {
            generation_ms: generationDuration,
            total_ms: Date.now() - startTime
          }
        }
      }])
      .select()

    if (insertErr) {
      console.error('❌ Database insert failed:', insertErr)
      return NextResponse.json({ error: 'Failed to save subtitle' }, { status: 500 })
    }
    console.log('✅ Subtitle record saved, ID:', inserted?.[0]?.id)

    // Add to library
    console.log('📚 Adding to library...')
    await supabase
      .from('library_items')
      .insert({
        user_id: user.id,
        content_type: 'subtitles',
        content_id: inserted?.[0]?.id,
        date_added_to_library: new Date().toISOString()
      })
    console.log('✅ Added to library')

    const totalDuration = Date.now() - startTime
    console.log('\n=== WORKFLOW COMPLETE ===')
    console.log(`⏱️ Total processing time: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`)
    console.log('📊 Timing breakdown:')
    console.log(`   - Single-pass generation: ${generationDuration}ms`)
    console.log(`   - AI enhancement: DISABLED (temporarily removed)`)
    console.log('✅ Subtitle generation successful!')

    return NextResponse.json({
      message: 'Subtitles generated successfully',
      subtitle: inserted?.[0] || null
    }, { status: 201 })
  } catch (error) {
    const totalDuration = Date.now() - startTime
    console.error('\n=== WORKFLOW FAILED ===')
    console.error(`⏱️ Failed after ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`)
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', JSON.stringify(error.errors, null, 2))
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('❌ Error generating subtitles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
