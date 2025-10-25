import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { getReplicateClient } from '@/lib/utils/replicate-client'

const createWatermarkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  video_file_input: z.string().url("Valid video URL required"),
  
  // Replicate watermark inputs
  watermark_text: z.string().default("DREAMCUT.AI"),
  font_size: z.number().int().min(1).max(500).default(40),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  console.log('🎬 Starting watermark generation workflow...')
  console.log('👤 User ID:', user.id)

  try {
    const body = await request.json()
    console.log('📥 Request body:', JSON.stringify(body, null, 2))
    
    const validatedData = createWatermarkSchema.parse(body)
    console.log('✅ Input validation passed')

    const replicate = getReplicateClient()

    // Generate watermarked video
    console.log('\n=== WATERMARK GENERATION ===')
    console.log('🎬 Generating watermarked video...')
    console.log('📹 Video URL:', validatedData.video_file_input)
    console.log('💧 Watermark text:', validatedData.watermark_text)
    console.log('📏 Font size:', validatedData.font_size)
    
    const generationStartTime = Date.now()
    
    // Log the input parameters being sent to Replicate
    const replicateInput = {
      video: validatedData.video_file_input,
      watermark: validatedData.watermark_text,
      size: validatedData.font_size
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
      replicateInput.video = publicVideoUrl
    }

    console.log('🔧 Replicate input parameters:', JSON.stringify(replicateInput, null, 2))
    
    const output = await replicate.run(
      "charlesmccarthy/addwatermark:f274d1efdd9d249cef68fccd028d70e4134b2d59f2b02b42a4e78350849d0e57",
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

    // Extract video URL - Replicate FileOutput objects can be converted to strings
    let videoUrl: string | null = null

    if (typeof output === 'string') {
      videoUrl = output
    } else if (output?.url) {
      videoUrl = typeof output.url === 'function' ? await output.url() : output.url
    } else {
      // Try String conversion (works for FileOutput objects)
      const urlStr = String(output)
      if (urlStr && urlStr !== '[object Object]' && urlStr.startsWith('http')) {
        videoUrl = urlStr
      } else {
        // Last resort: try using the FileOutput object directly
        console.log('⚠️ Trying to use FileOutput object directly for video')
        try {
          // FileOutput objects might work directly with fetch
          const testResp = await fetch(output)
          if (testResp.ok) {
            videoUrl = String(output) // If fetch works, the object is valid
          }
        } catch (error) {
          console.error('❌ FileOutput object not usable with fetch:', error)
        }
      }
    }

    console.log('✅ Extracted video URL:', videoUrl)

    if (!videoUrl) {
      console.error('❌ Failed to extract video URL from output')
      return NextResponse.json({ error: 'Failed to generate watermarked video' }, { status: 502 })
    }

    // Download and store video
    console.log('\n=== VIDEO STORAGE ===')
    console.log('⬇️ Downloading generated watermarked video...')
    const resp = await fetch(videoUrl)
    if (!resp.ok) {
      console.error(`❌ Failed to download video: HTTP ${resp.status}`)
      return NextResponse.json({ error: `Failed to download video: ${resp.status}` }, { status: 502 })
    }
    const arrayBuffer = await resp.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('📦 Video size:', (buffer.length / 1024 / 1024).toFixed(2), 'MB')
    
    const fileName = `${uuidv4()}-watermarked.mp4`
    const storage_path = `renders/watermarks/${user.id}/generated/${fileName}`
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

    // Save to database
    console.log('\n=== DATABASE STORAGE ===')
    console.log('💾 Saving watermark record to database...')
    const { data: inserted, error: insertErr } = await supabase
      .from('watermarks')
      .insert([{
        user_id: user.id,
        title: validatedData.title,
        description: `Watermark: ${validatedData.watermark_text}`,
        video_source: 'upload', // Default value, actual source determined by form
        video_url: validatedData.video_file_input,
        watermark_text: validatedData.watermark_text,
        font_size: validatedData.font_size,
        output_video_url: null, // Will be populated by GET endpoint with fresh signed URL
        storage_path,
        status: 'completed',
        content: {
          video_storage_path: storage_path,
          watermark_text: validatedData.watermark_text,
          font_size: validatedData.font_size,
          ...validatedData
        },
        metadata: {
          timestamp: new Date().toISOString(),
          replicate_video_output: videoUrl,
          processing_times: {
            generation_ms: generationDuration,
            total_ms: Date.now() - startTime
          }
        }
      }])
      .select()

    if (insertErr) {
      console.error('❌ Database insert failed:', insertErr)
      return NextResponse.json({ error: 'Failed to save watermark' }, { status: 500 })
    }
    console.log('✅ Watermark record saved, ID:', inserted?.[0]?.id)

    // Add to library
    console.log('📚 Adding to library...')
    await supabase
      .from('library_items')
      .insert({
        user_id: user.id,
        content_type: 'watermarks',
        content_id: inserted?.[0]?.id,
        date_added_to_library: new Date().toISOString()
      })
    console.log('✅ Added to library')

    const totalDuration = Date.now() - startTime
    console.log('\n=== WORKFLOW COMPLETE ===')
    console.log(`⏱️ Total processing time: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`)
    console.log('📊 Timing breakdown:')
    console.log(`   - Watermark generation: ${generationDuration}ms`)
    console.log('✅ Watermark generation successful!')

    return NextResponse.json({
      message: 'Watermark generated successfully',
      watermark: inserted?.[0] || null
    }, { status: 201 })
  } catch (error) {
    const totalDuration = Date.now() - startTime
    console.error('\n=== WORKFLOW FAILED ===')
    console.error(`⏱️ Failed after ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`)
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', JSON.stringify(error.errors, null, 2))
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('❌ Error generating watermark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
