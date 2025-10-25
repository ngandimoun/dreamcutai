-- Create comics table
CREATE TABLE IF NOT EXISTS comics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  comic_type TEXT,
  vibe TEXT,
  inspiration_style TEXT,
  characters JSONB,
  character_variations JSONB,
  selected_character_variations JSONB,
  panel_count INTEGER,
  style TEXT,
  genre TEXT,
  dialogue TEXT,
  panels JSONB,
  color_scheme TEXT,
  aspect_ratio TEXT,
  content JSONB,
  metadata JSONB,
  is_template BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX idx_comics_user_id ON comics(user_id);
CREATE INDEX idx_comics_status ON comics(status);
CREATE INDEX idx_comics_created_at ON comics(created_at DESC);

-- Enable RLS
ALTER TABLE comics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own comics
CREATE POLICY "Users can view their own comics"
  ON comics
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own comics
CREATE POLICY "Users can insert their own comics"
  ON comics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own comics
CREATE POLICY "Users can update their own comics"
  ON comics
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own comics
CREATE POLICY "Users can delete their own comics"
  ON comics
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_comics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comics_updated_at
  BEFORE UPDATE ON comics
  FOR EACH ROW
  EXECUTE FUNCTION update_comics_updated_at();
