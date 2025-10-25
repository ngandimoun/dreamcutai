import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Helper to convert null to undefined for Zod optional()
const nullToUndefined = z.literal('null').transform(() => undefined);

const createSubtitleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable().transform(e => e === '' ? undefined : e).or(nullToUndefined),
  
  // Status
  status: z.enum(['draft', 'processing', 'completed', 'failed']).default('draft'),
  
  // Input Files
  video_file_input: z.string().min(1, "Video file is required"),
  transcript_file_input: z.string().optional().nullable().transform(e => e === '' ? undefined : e).or(nullToUndefined),
  
  // Generation Options
  emoji_enrichment: z.boolean().default(false),
  keyword_emphasis: z.boolean().default(false),
  
  // Output
  generated_subtitle_file: z.string().optional().nullable().transform(e => e === '' ? undefined : e).or(nullToUndefined),
  storage_path: z.string().optional().nullable().transform(e => e === '' ? undefined : e).or(nullToUndefined),
  
  // Metadata
  metadata: z.object({
    projectTitle: z.string().optional(),
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
    const body = await request.json();
    const validatedData = createSubtitleSchema.parse(body);

    // Simulate subtitle generation and get a placeholder path
    const generatedSubtitleFileName = `${uuidv4()}-subtitles.srt`;
    const generatedStoragePath = `renders/subtitles/${user.id}/generated/${generatedSubtitleFileName}`;

    const { data, error } = await supabase
      .from('subtitles')
      .insert([
        {
          user_id: user.id,
          title: validatedData.title,
          description: validatedData.description,
          status: validatedData.status,
          video_file_input: validatedData.video_file_input,
          transcript_file_input: validatedData.transcript_file_input,
          emoji_enrichment: validatedData.emoji_enrichment,
          keyword_emphasis: validatedData.keyword_emphasis,
          generated_subtitle_file: generatedStoragePath,
          storage_path: generatedStoragePath,
          metadata: validatedData.metadata || {},
          content: {}, // Can be expanded later if needed
        },
      ])
      .select();

    if (error) {
      console.error('Error inserting subtitle:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add to library_items with correct schema
    const { error: libraryError } = await supabase
      .from('library_items')
      .insert([
        {
          user_id: user.id,
          content_type: 'subtitles',  // Changed from item_type
          content_id: data[0].id,     // Changed from item_id
          // Removed: title, description, image_url, created_at (not in schema)
        },
      ]);

    if (libraryError) {
      console.error('Error inserting into library_items:', libraryError);
      // Decide if this should be a hard fail or just log the error
    }

    return NextResponse.json({ 
      message: 'Subtitle project created successfully', 
      data,
      success: true
    }, { status: 200 });
  } catch (validationError) {
    console.error('Validation error:', validationError);
    return NextResponse.json({ error: (validationError as z.ZodError).errors }, { status: 400 });
  }
}

// GET endpoint to fetch subtitles by user
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: subtitles, error } = await supabase
    .from('subtitles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subtitles:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate fresh signed URLs for completed subtitles
  const subtitlesWithFreshUrls = await Promise.all(
    (subtitles || []).map(async (subtitle) => {
      if (subtitle.status === 'completed') {
        try {
          // Try to get storage_path from metadata or construct it
          let storagePath = subtitle.metadata?.storage_path
          
          if (!storagePath) {
            // Construct storage path following the pattern: renders/subtitles/{user_id}/{id}.mp4
            storagePath = `renders/subtitles/${user.id}/${subtitle.id}.mp4`
          }
          
          const { data: signedUrl } = await supabase.storage
            .from('dreamcut')
            .createSignedUrl(storagePath, 86400) // 24 hours
          
          if (signedUrl?.signedUrl) {
            return {
              ...subtitle,
              content: {
                ...subtitle.content,
                video_url: signedUrl.signedUrl
              }
            }
          }
        } catch (urlError) {
          console.error('Error generating signed URL for subtitle:', subtitle.id, urlError)
        }
      }
      return subtitle
    })
  )

  return NextResponse.json({ subtitles: subtitlesWithFreshUrls }, { status: 200 });
}

// PUT endpoint to update a subtitle project
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, ...updates } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'Subtitle ID is required for update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('subtitles')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select();

  if (error) {
    console.error('Error updating subtitle:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Subtitle not found or unauthorized' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Subtitle updated successfully', data }, { status: 200 });
}

// DELETE endpoint to delete a subtitle project
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'Subtitle ID is required for deletion' }, { status: 400 });
  }

  const { error } = await supabase
    .from('subtitles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting subtitle:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Subtitle deleted successfully' }, { status: 200 });
}