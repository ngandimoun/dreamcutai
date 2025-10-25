import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Helper function to convert null values from FormData to undefined
const nullToUndefined = (value: string | null): string | undefined => {
  return value === null ? undefined : value;
};

// Schema for sound FX generation
const createSoundFxSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  category: z.string().optional(),
  usage_context: z.string().optional(),
  world_link: z.string().optional(),
  seed_variability: z.string().transform(val => parseInt(val) || 50),
  sound_texture: z.string().optional(),
  frequency_focus: z.string().transform(val => parseInt(val) || 50),
  density: z.string().transform(val => parseInt(val) || 50),
  attack_type: z.string().optional(),
  tail_decay: z.string().transform(val => parseInt(val) || 50),
  audio_quality: z.string().optional(),
  environment_type: z.string().optional(),
  distance_from_listener: z.string().transform(val => parseInt(val) || 50),
  reverb_character: z.string().optional(),
  stereo_behavior: z.string().optional(),
  ambience_layer: z.string().optional(),
  mood_context: z.string().optional(),
  tension_level: z.string().transform(val => parseInt(val) || 50),
  motion_character: z.string().optional(),
  purpose_in_scene: z.string().optional(),
  prompt_influence: z.string().transform(val => parseInt(val) || 50),
  duration: z.string().transform(val => parseFloat(val) || 2.0),
  loop_mode: z.string().transform(val => val === 'true'),
  loop_type: z.string().optional(),
  tempo_bpm: z.string().optional(),
  fade_in: z.string().transform(val => parseFloat(val) || 0),
  fade_out: z.string().transform(val => parseFloat(val) || 0),
  tags: z.string().transform(val => {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('sound_fx')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sound fx:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/sound-fx:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    // Extract all form fields
    const name = formData.get('name')?.toString() || '';
    const prompt = formData.get('prompt')?.toString() || '';
    const category = nullToUndefined(formData.get('category')?.toString() || null);
    const usage_context = nullToUndefined(formData.get('usage_context')?.toString() || null);
    const world_link = nullToUndefined(formData.get('world_link')?.toString() || null);
    const seed_variability = formData.get('seed_variability')?.toString() || '50';
    const sound_texture = nullToUndefined(formData.get('sound_texture')?.toString() || null);
    const frequency_focus = formData.get('frequency_focus')?.toString() || '50';
    const density = formData.get('density')?.toString() || '50';
    const attack_type = nullToUndefined(formData.get('attack_type')?.toString() || null);
    const tail_decay = formData.get('tail_decay')?.toString() || '50';
    const audio_quality = nullToUndefined(formData.get('audio_quality')?.toString() || null);
    const environment_type = nullToUndefined(formData.get('environment_type')?.toString() || null);
    const distance_from_listener = formData.get('distance_from_listener')?.toString() || '50';
    const reverb_character = nullToUndefined(formData.get('reverb_character')?.toString() || null);
    const stereo_behavior = nullToUndefined(formData.get('stereo_behavior')?.toString() || null);
    const ambience_layer = nullToUndefined(formData.get('ambience_layer')?.toString() || null);
    const mood_context = nullToUndefined(formData.get('mood_context')?.toString() || null);
    const tension_level = formData.get('tension_level')?.toString() || '50';
    const motion_character = nullToUndefined(formData.get('motion_character')?.toString() || null);
    const purpose_in_scene = nullToUndefined(formData.get('purpose_in_scene')?.toString() || null);
    const prompt_influence = formData.get('prompt_influence')?.toString() || '50';
    const duration = formData.get('duration')?.toString() || '2.0';
    const loop_mode = formData.get('loop_mode')?.toString() || 'false';
    const loop_type = nullToUndefined(formData.get('loop_type')?.toString() || null);
    const tempo_bpm = nullToUndefined(formData.get('tempo_bpm')?.toString() || null);
    const fade_in = formData.get('fade_in')?.toString() || '0';
    const fade_out = formData.get('fade_out')?.toString() || '0';
    const tags = formData.get('tags')?.toString() || '[]';

    // Validate the data
    const validatedData = createSoundFxSchema.parse({
      name,
      prompt,
      category,
      usage_context,
      world_link,
      seed_variability,
      sound_texture,
      frequency_focus,
      density,
      attack_type,
      tail_decay,
      audio_quality,
      environment_type,
      distance_from_listener,
      reverb_character,
      stereo_behavior,
      ambience_layer,
      mood_context,
      tension_level,
      motion_character,
      purpose_in_scene,
      prompt_influence,
      duration,
      loop_mode,
      loop_type,
      tempo_bpm,
      fade_in,
      fade_out,
      tags,
    });

    // Handle reference audio file upload
    let referenceAudioPath: string | null = null;
    const referenceAudioFile = formData.get('referenceAudio') as File | null;
    if (referenceAudioFile && referenceAudioFile.size > 0) {
      const filePath = `renders/sound-fx/${user.id}/references/${uuidv4()}-${referenceAudioFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('dreamcut')
        .upload(filePath, referenceAudioFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading reference audio:', uploadError);
        return NextResponse.json({ error: `Failed to upload reference audio: ${uploadError.message}` }, { status: 500 });
      }
      referenceAudioPath = filePath;
    }

    // Simulate generated audio (placeholder for actual AI generation)
    const generatedAudioUrl = `https://example.com/generated-audio-${uuidv4()}.mp3`;
    const generatedStoragePath = `renders/sound-fx/${user.id}/generated/${uuidv4()}-generated.mp3`;

    // Insert into sound_fx table
    const { data: soundFxData, error: insertError } = await supabase
      .from('sound_fx')
      .insert([
        {
          user_id: user.id,
          name: validatedData.name,
          prompt: validatedData.prompt,
          category: validatedData.category,
          usage_context: validatedData.usage_context,
          world_link: validatedData.world_link,
          seed_variability: validatedData.seed_variability,
          sound_texture: validatedData.sound_texture,
          frequency_focus: validatedData.frequency_focus,
          density: validatedData.density,
          attack_type: validatedData.attack_type,
          tail_decay: validatedData.tail_decay,
          audio_quality: validatedData.audio_quality,
          environment_type: validatedData.environment_type,
          distance_from_listener: validatedData.distance_from_listener,
          reverb_character: validatedData.reverb_character,
          stereo_behavior: validatedData.stereo_behavior,
          ambience_layer: validatedData.ambience_layer,
          mood_context: validatedData.mood_context,
          tension_level: validatedData.tension_level,
          motion_character: validatedData.motion_character,
          purpose_in_scene: validatedData.purpose_in_scene,
          prompt_influence: validatedData.prompt_influence,
          duration: validatedData.duration,
          loop_mode: validatedData.loop_mode,
          loop_type: validatedData.loop_type,
          tempo_bpm: validatedData.tempo_bpm,
          fade_in: validatedData.fade_in,
          fade_out: validatedData.fade_out,
          tags: validatedData.tags,
          reference_audio_path: referenceAudioPath,
          generated_audio_path: generatedStoragePath,
          storage_path: generatedStoragePath,
          audio_url: generatedAudioUrl,
          status: 'completed',
          metadata: {
            generation_time: new Date().toISOString(),
            user_agent: request.headers.get('user-agent'),
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          },
          content: {
            type: 'sound_fx',
            version: '1.0',
            generated_at: new Date().toISOString(),
          },
        },
      ])
      .select();

    if (insertError) {
      console.error('Error inserting sound fx:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Add to library_items table
    if (soundFxData && soundFxData.length > 0) {
      const { error: libraryError } = await supabase
        .from('library_items')
        .insert([
          {
            user_id: user.id,
            content_type: 'sound_fx',  // Changed from item_type
            content_id: soundFxData[0].id,  // Changed from item_id
            // Removed: title, description, tags, metadata, content (not in schema)
          },
        ]);

      if (libraryError) {
        console.error('Error adding to library:', libraryError);
        // Don't fail the request if library insertion fails
      }
    }

    return NextResponse.json({ 
      message: 'Sound FX generated and saved successfully', 
      data: soundFxData 
    }, { status: 200 });

  } catch (error) {
    console.error('Error in POST /api/sound-fx:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, ...updateData } = await request.json();

    const { data, error } = await supabase
      .from('sound_fx')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Error updating sound fx:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Sound FX updated successfully', data }, { status: 200 });
  } catch (error) {
    console.error('Error in PUT /api/sound-fx:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('sound_fx')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting sound fx:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Sound FX deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/sound-fx:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}