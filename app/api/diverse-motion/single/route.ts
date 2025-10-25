import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFalClient } from '@/lib/utils/fal-client'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's diverse motion single videos
    const { data: diverseMotions, error } = await supabase
      .from('diverse_motion_single')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching diverse motion single videos:', error)
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
    }

    // Generate signed URLs for storage paths
    const diverseMotionsWithUrls = await Promise.all(
      diverseMotions.map(async (motion) => {
        let signedUrl = null
        if (motion.storage_path) {
          try {
            const { data: urlData } = await supabase.storage
              .from('dreamcut')
              .createSignedUrl(motion.storage_path, 86400) // 24 hours
            signedUrl = urlData?.signedUrl
          } catch (urlError) {
            console.error('Error generating signed URL:', urlError)
          }
        }
        
        return {
          ...motion,
          generated_video_url: signedUrl || motion.generated_video_url
        }
      })
    )

    return NextResponse.json({ diverseMotionSingle: diverseMotionsWithUrls })
  } catch (error) {
    console.error('Error in GET /api/diverse-motion/single:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const title = formData.get('title') as string
    const prompt = formData.get('prompt') as string
    const motionType = formData.get('motion_type') as string
    const style = formData.get('style') as string
    const aspectRatio = formData.get('aspect_ratio') as string
    const generateAudio = formData.get('generate_audio') === 'true'
    const assetFile = formData.get('asset') as File

    if (!assetFile) {
      return NextResponse.json({ error: 'Asset file is required' }, { status: 400 })
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Generate unique filename for asset
    const assetId = uuidv4()
    const fileExtension = assetFile.name.split('.').pop() || 'jpg'
    const assetFileName = `asset_${assetId}.${fileExtension}`
    const assetStoragePath = `renders/diverse-motion/single/${user.id}/assets/${assetFileName}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await assetFile.arrayBuffer()
    
    // Upload asset to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('dreamcut')
      .upload(assetStoragePath, arrayBuffer, {
        contentType: assetFile.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: `Failed to upload asset: ${uploadError.message}` }, { status: 500 })
    }

    // Get signed URL for the uploaded asset
    const { data: urlData } = await supabase.storage
      .from('dreamcut')
      .createSignedUrl(assetStoragePath, 7 * 24 * 60 * 60) // 7 days

    if (!urlData?.signedUrl) {
      return NextResponse.json({ error: 'Failed to generate signed URL for uploaded asset' }, { status: 500 })
    }

    // Create database record
    const { data: diverseMotion, error: insertError } = await supabase
      .from('diverse_motion_single')
      .insert({
        user_id: user.id,
        title: title || 'Untitled Diverse Motion',
        asset_url: urlData.signedUrl,
        prompt,
        duration: 8, // Hardcoded to 8 seconds
        motion_type: motionType || 'smooth',
        style: style || 'cinematic',
        aspect_ratio: aspectRatio || '16:9',
        resolution: '1080p', // Hardcoded to 1080p
        generate_audio: generateAudio,
        status: 'processing'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating diverse motion record:', insertError)
      return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
    }

    // Call FAL.AI API
    const fal = getFalClient()
    const falResult = await fal.subscribe('fal-ai/veo3.1/image-to-video', {
      input: {
        image_url: urlData.signedUrl,
        prompt,
        aspect_ratio: aspectRatio || '16:9',
        duration: '8s',
        resolution: '1080p',
        generate_audio: generateAudio
      },
      logs: true
    })

    const outputUrl: string | undefined = falResult?.data?.video?.url
    if (!outputUrl) {
      // Update status to failed
      await supabase
        .from('diverse_motion_single')
        .update({
          status: 'failed',
          error_message: 'Failed to generate video from FAL.AI'
        })
        .eq('id', diverseMotion.id)
      
      return NextResponse.json({ error: 'Failed to generate video' }, { status: 502 })
    }

    // Download generated video and upload to Supabase Storage
    const resp = await fetch(outputUrl)
    if (!resp.ok) {
      await supabase
        .from('diverse_motion_single')
        .update({
          status: 'failed',
          error_message: `Failed to download generated video: ${resp.status}`
        })
        .eq('id', diverseMotion.id)
      
      return NextResponse.json({ error: `Failed to download generated video: ${resp.status}` }, { status: 502 })
    }

    const videoArrayBuffer = await resp.arrayBuffer()
    const videoBuffer = Buffer.from(videoArrayBuffer)
    const videoFileName = `generated_${assetId}.mp4`
    const videoStoragePath = `renders/diverse-motion/single/${user.id}/generated/${videoFileName}`

    // Upload generated video to Supabase Storage
    const { error: videoUploadError } = await supabase.storage
      .from('dreamcut')
      .upload(videoStoragePath, videoBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
        upsert: false
      })

    if (videoUploadError) {
      console.error('Error uploading generated video:', videoUploadError)
      await supabase
        .from('diverse_motion_single')
        .update({
          status: 'failed',
          error_message: 'Failed to upload generated video to storage'
        })
        .eq('id', diverseMotion.id)
      
      return NextResponse.json({ error: 'Failed to upload generated video' }, { status: 500 })
    }

    // Get signed URL for the generated video
    const { data: videoUrlData } = await supabase.storage
      .from('dreamcut')
      .createSignedUrl(videoStoragePath, 86400) // 24 hours

    // Update database record with generated video
    const { data: updatedMotion, error: updateError } = await supabase
      .from('diverse_motion_single')
      .update({
        storage_path: videoStoragePath,
        generated_video_url: videoUrlData?.signedUrl,
        fal_request_id: falResult.requestId,
        status: 'completed'
      })
      .eq('id', diverseMotion.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating diverse motion with generated video:', updateError)
      return NextResponse.json({ error: 'Failed to update record with generated video' }, { status: 500 })
    }

    // Add to library
    await supabase
      .from('library_items')
      .insert({
        user_id: user.id,
        content_type: 'diverse_motion_single',
        content_id: diverseMotion.id,
        date_added_to_library: new Date().toISOString()
      })

    return NextResponse.json({ 
      diverseMotion: updatedMotion
    })
  } catch (error) {
    console.error('Error in POST /api/diverse-motion/single:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
