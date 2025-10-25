import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch sound-to-video projects for the user
    const { data: soundToVideoProjects, error } = await supabase
      .from('sound_to_video')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching sound-to-video projects:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    return NextResponse.json({ soundToVideoProjects })
  } catch (error) {
    console.error('Error in sound-to-video GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Create new sound-to-video project
    const { data: newProject, error } = await supabase
      .from('sound_to_video')
      .insert({
        user_id: user.id,
        title: body.title || 'Untitled Sound-to-Video Project',
        description: body.description,
        video_file_input: body.video_file_input || '',
        audio_file_input: body.audio_file_input,
        sound_type: body.sound_type,
        audio_style: body.audio_style,
        volume_level: body.volume_level || 0.5,
        fade_in_duration: body.fade_in_duration || 0,
        fade_out_duration: body.fade_out_duration || 0,
        loop_audio: body.loop_audio || false,
        sync_with_video: body.sync_with_video !== false,
        output_format: body.output_format || 'mp4',
        quality: body.quality || 'high',
        bitrate: body.bitrate || 2000,
        status: 'draft',
        content: body.content,
        metadata: body.metadata,
        is_template: body.is_template || false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating sound-to-video project:', error)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    return NextResponse.json({ project: newProject })
  } catch (error) {
    console.error('Error in sound-to-video POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
