-- Create music_videos table for tracking Suno music video generation tasks
CREATE TABLE IF NOT EXISTS music_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Source music reference
  music_jingle_id UUID REFERENCES music_jingles(id) ON DELETE SET NULL,
  source_task_id TEXT NOT NULL,
  source_audio_id TEXT NOT NULL,
  
  -- Suno API tracking
  suno_task_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  
  -- Video details
  video_url TEXT,
  storage_path TEXT,
  suno_video_url TEXT,
  author TEXT,
  domain_name TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_music_videos_user_id ON music_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_music_videos_suno_task_id ON music_videos(suno_task_id);
CREATE INDEX IF NOT EXISTS idx_music_videos_music_jingle_id ON music_videos(music_jingle_id);
CREATE INDEX IF NOT EXISTS idx_music_videos_status ON music_videos(status);
CREATE INDEX IF NOT EXISTS idx_music_videos_created_at ON music_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_music_videos_storage_path ON music_videos(storage_path);

-- Enable RLS
ALTER TABLE music_videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own music videos" ON music_videos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own music videos" ON music_videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music videos" ON music_videos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music videos" ON music_videos
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_music_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_music_videos_updated_at
  BEFORE UPDATE ON music_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_music_videos_updated_at();

-- Add comments for documentation
COMMENT ON TABLE music_videos IS 'Stores music video generation requests and results from Suno API';
COMMENT ON COLUMN music_videos.suno_task_id IS 'Suno API task ID for tracking video generation status';
COMMENT ON COLUMN music_videos.storage_path IS 'Supabase Storage path for downloaded video';
COMMENT ON COLUMN music_videos.suno_video_url IS 'Original Suno CDN URL as fallback';
COMMENT ON COLUMN music_videos.video_url IS 'Primary signed URL from Supabase Storage';
COMMENT ON COLUMN music_videos.status IS 'Generation status: pending, generating, completed, failed';
COMMENT ON COLUMN music_videos.metadata IS 'Additional metadata about the video generation request';

