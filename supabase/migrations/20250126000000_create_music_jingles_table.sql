-- Create music_jingles table for Suno API integration
-- This table stores music generation requests and results

CREATE TABLE IF NOT EXISTS music_jingles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT,
  
  -- Suno API Settings
  model TEXT NOT NULL DEFAULT 'V5',
  custom_mode BOOLEAN DEFAULT FALSE,
  instrumental BOOLEAN DEFAULT FALSE,
  vocal_gender TEXT DEFAULT 'auto',
  style_weight DECIMAL(3,2) DEFAULT 0.65,
  weirdness_constraint DECIMAL(3,2) DEFAULT 0.65,
  audio_weight DECIMAL(3,2) DEFAULT 0.65,
  negative_tags TEXT,
  audio_action TEXT DEFAULT 'generate',
  upload_url TEXT,
  
  -- Suno Task Tracking
  suno_task_id TEXT,
  callback_received_at TIMESTAMP WITH TIME ZONE,
  suno_audio_id TEXT,
  
  -- Music Settings
  styles TEXT[] DEFAULT '{}',
  duration INTEGER DEFAULT 30,
  volume INTEGER DEFAULT 50,
  fade_in DECIMAL(5,2) DEFAULT 0,
  fade_out DECIMAL(5,2) DEFAULT 0,
  loop_mode TEXT DEFAULT 'none',
  stereo_mode TEXT DEFAULT 'stereo',
  
  -- Generated Content
  generated_audio_path TEXT,
  storage_path TEXT,
  audio_url TEXT,
  
  -- Status and Metadata
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  content JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_music_jingles_user_id ON music_jingles(user_id);
CREATE INDEX IF NOT EXISTS idx_music_jingles_status ON music_jingles(status);
CREATE INDEX IF NOT EXISTS idx_music_jingles_suno_task_id ON music_jingles(suno_task_id);
CREATE INDEX IF NOT EXISTS idx_music_jingles_created_at ON music_jingles(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_music_jingles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_music_jingles_updated_at
  BEFORE UPDATE ON music_jingles
  FOR EACH ROW
  EXECUTE FUNCTION update_music_jingles_updated_at();

-- Add comments for documentation
COMMENT ON TABLE music_jingles IS 'Stores music generation requests and results from Suno API';
COMMENT ON COLUMN music_jingles.suno_task_id IS 'Suno API task ID for tracking generation status';
COMMENT ON COLUMN music_jingles.callback_received_at IS 'Timestamp when Suno callback was received';
COMMENT ON COLUMN music_jingles.suno_audio_id IS 'Suno internal audio ID for extending existing tracks';
COMMENT ON COLUMN music_jingles.status IS 'Generation status: pending, processing, completed, failed';
COMMENT ON COLUMN music_jingles.metadata IS 'Additional metadata about the generation request';
COMMENT ON COLUMN music_jingles.content IS 'Generated content and Suno API response data';

-- Enable Row Level Security
ALTER TABLE music_jingles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own music jingles" ON music_jingles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own music jingles" ON music_jingles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music jingles" ON music_jingles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music jingles" ON music_jingles
  FOR DELETE USING (auth.uid() = user_id);




