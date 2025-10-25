-- Create video_translations table
CREATE TABLE IF NOT EXISTS video_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_file_input TEXT NOT NULL,
  output_language TEXT NOT NULL,
  translated_video_url TEXT,
  original_replicate_url TEXT,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  content JSONB,
  metadata JSONB
);

-- Create index on user_id for faster queries
CREATE INDEX idx_video_translations_user_id ON video_translations(user_id);
CREATE INDEX idx_video_translations_status ON video_translations(status);
CREATE INDEX idx_video_translations_created_at ON video_translations(created_at DESC);

-- Enable RLS
ALTER TABLE video_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own video translations
CREATE POLICY "Users can view their own video translations"
  ON video_translations
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own video translations
CREATE POLICY "Users can insert their own video translations"
  ON video_translations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own video translations
CREATE POLICY "Users can update their own video translations"
  ON video_translations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own video translations
CREATE POLICY "Users can delete their own video translations"
  ON video_translations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_video_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_translations_updated_at
  BEFORE UPDATE ON video_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_video_translations_updated_at();
