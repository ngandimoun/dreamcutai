-- Create lyrics_generations table for tracking Suno lyrics generation tasks
CREATE TABLE IF NOT EXISTS lyrics_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Lyrics content
  prompt TEXT NOT NULL,
  title TEXT,
  lyrics_text TEXT,
  
  -- Suno API tracking
  suno_task_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lyrics_generations_user_id ON lyrics_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_lyrics_generations_suno_task_id ON lyrics_generations(suno_task_id);
CREATE INDEX IF NOT EXISTS idx_lyrics_generations_status ON lyrics_generations(status);
CREATE INDEX IF NOT EXISTS idx_lyrics_generations_created_at ON lyrics_generations(created_at DESC);

-- Enable RLS
ALTER TABLE lyrics_generations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own lyrics generations" ON lyrics_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lyrics generations" ON lyrics_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lyrics generations" ON lyrics_generations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lyrics generations" ON lyrics_generations
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_lyrics_generations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lyrics_generations_updated_at
  BEFORE UPDATE ON lyrics_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_lyrics_generations_updated_at();




