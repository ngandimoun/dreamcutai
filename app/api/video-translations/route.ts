import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VideoTranslationInputs } from '@/lib/types/video-translation'
import { downloadAndUploadVideo } from '@/lib/storage/download-and-upload'

// Cache for 30 seconds
export const revalidate = 30

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's video translations
    const { data: videoTranslations, error } = await supabase
      .from('video_translations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching video translations:', error)
      return NextResponse.json({ error: 'Failed to fetch video translations' }, { status: 500 })
    }

    return NextResponse.json({ videoTranslations }, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'max-age=30'
      }
    })
  } catch (error) {
    console.error('Error in GET /api/video-translations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const translationData: VideoTranslationInputs = body

    // Validate required fields
    if (!translationData.video_file_input) {
      return NextResponse.json({ error: 'Video file is required' }, { status: 400 })
    }

    if (!translationData.output_language) {
      return NextResponse.json({ error: 'Output language is required' }, { status: 400 })
    }

    // Create video translation record
    const { data: videoTranslation, error } = await supabase
      .from('video_translations')
      .insert({
        user_id: user.id,
        title: translationData.title || `Video Translation - ${new Date().toLocaleDateString()}`,
        description: translationData.description || 'Video translation project',
        video_file_input: translationData.video_file_input,
        output_language: translationData.output_language,
        status: 'processing',
        content: translationData,
        metadata: {
          videoFile: translationData.video_file_input,
          outputLanguage: translationData.output_language,
          createdAt: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating video translation:', error)
      return NextResponse.json({ error: 'Failed to create video translation project' }, { status: 500 })
    }

    // TODO: Here you would typically call your video translation service
    // For now, we'll simulate processing and return the created record
    // In a real implementation, you would:
    // 1. Call Replicate API for video translation
    // 2. Download the translated video from Replicate
    // 3. Upload to Supabase Storage
    // 4. Update the record with storage path

    // Simulate processing completion after a delay
    setTimeout(async () => {
      try {
        // Mock Replicate URL - in real implementation, this would come from Replicate API
        const mockReplicateUrl = 'https://replicate.delivery/translated/' + videoTranslation.id + '.mp4'
        
        // Download and upload to Supabase Storage
        const uploadResult = await downloadAndUploadVideo(
          mockReplicateUrl,
          `renders/translations/${user.id}`,
          videoTranslation.id,
          'video/mp4'
        )

        if (uploadResult.success) {
          await supabase
            .from('video_translations')
            .update({
              status: 'completed',
              translated_video_url: uploadResult.storagePath, // Store Supabase storage path
              original_replicate_url: mockReplicateUrl, // Keep original URL for reference
              updated_at: new Date().toISOString()
            })
            .eq('id', videoTranslation.id)
        }
      } catch (updateError) {
        console.error('Error updating video translation status:', updateError)
      }
    }, 5000) // 5 second delay for demo

    return NextResponse.json({ 
      videoTranslation,
      message: 'Video translation project created successfully. Processing will begin shortly.'
    })
  } catch (error) {
    console.error('Error in POST /api/video-translations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
