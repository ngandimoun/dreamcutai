import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Cache for 30 seconds
export const revalidate = 30

// GET /api/watermarks - Fetch user's watermark projects
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's watermarks
    const { data: watermarks, error } = await supabase
      .from('watermarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching watermarks:', error)
      return NextResponse.json({ error: 'Failed to fetch watermarks' }, { status: 500 })
    }

    // Generate fresh signed URLs for completed watermarks
    const watermarksWithFreshUrls = await Promise.all(
      (watermarks || []).map(async (watermark) => {
        if (watermark.status === 'completed') {
          try {
            // Try to get storage_path from metadata or construct it
            let storagePath = watermark.metadata?.storage_path
            
            if (!storagePath) {
              // Construct storage path following the pattern: renders/watermarks/{user_id}/{id}.mp4
              storagePath = `renders/watermarks/${user.id}/${watermark.id}.mp4`
            }
            
            const { data: signedUrl } = await supabase.storage
              .from('dreamcut')
              .createSignedUrl(storagePath, 86400) // 24 hours
            
            if (signedUrl?.signedUrl) {
              return {
                ...watermark,
                output_video_url: signedUrl.signedUrl
              }
            }
          } catch (urlError) {
            console.error('Error generating signed URL for watermark:', watermark.id, urlError)
          }
        }
        return watermark
      })
    )

    return NextResponse.json({ watermarks: watermarksWithFreshUrls }, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'max-age=30'
      }
    })
  } catch (error) {
    console.error('Error in GET /api/watermarks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST endpoint removed - watermark generation now handled by /api/watermarks/generate

// PATCH /api/watermarks - Update watermark project status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, outputVideoUrl, error: errorMessage } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 })
    }

    // Update watermark status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (outputVideoUrl) {
      updateData.output_video_url = outputVideoUrl
    }

    if (errorMessage) {
      updateData.metadata = {
        errorMessage,
        failedAt: new Date().toISOString()
      }
    }

    const { error } = await supabase
      .from('watermarks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating watermark:', error)
      return NextResponse.json({ error: 'Failed to update watermark' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/watermarks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


// Helper function removed - Replicate integration now handled in /api/watermarks/generate
