-- Create audio_separations table for tracking Suno audio separation tasks
CREATE TABLE IF NOT EXISTS audio_separations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Source audio
  source_audio_url TEXT NOT NULL,
  
  -- Separation settings
  separation_type TEXT NOT NULL CHECK (separation_type IN ('separate_vocal', 'split_stem')),
  
  -- Suno API tracking
  suno_task_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  
  -- Separation results (URLs to separated audio files)
  instrumental_url TEXT,
  vocal_url TEXT,
  backing_vocals_url TEXT,
  drums_url TEXT,
  bass_url TEXT,
  guitar_url TEXT,
  keyboard_url TEXT,
  percussion_url TEXT,
  strings_url TEXT,
  synth_url TEXT,
  fx_url TEXT,
  brass_url TEXT,
  woodwinds_url TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audio_separations_user_id ON audio_separations(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_separations_suno_task_id ON audio_separations(suno_task_id);
CREATE INDEX IF NOT EXISTS idx_audio_separations_status ON audio_separations(status);
CREATE INDEX IF NOT EXISTS idx_audio_separations_separation_type ON audio_separations(separation_type);
CREATE INDEX IF NOT EXISTS idx_audio_separations_created_at ON audio_separations(created_at DESC);

-- Enable RLS
ALTER TABLE audio_separations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own audio separations" ON audio_separations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audio separations" ON audio_separations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audio separations" ON audio_separations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audio separations" ON audio_separations
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_audio_separations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_audio_separations_updated_at
  BEFORE UPDATE ON audio_separations
  FOR EACH ROW
  EXECUTE FUNCTION update_audio_separations_updated_at();




