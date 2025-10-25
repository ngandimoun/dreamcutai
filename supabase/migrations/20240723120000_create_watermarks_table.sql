-- Create watermarks table
CREATE TABLE IF NOT EXISTS watermarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_source TEXT NOT NULL CHECK (video_source IN ('upload', 'library')),
  video_url TEXT NOT NULL,
  watermark_text TEXT NOT NULL,
  font_size INTEGER NOT NULL CHECK (font_size >= 1 AND font_size <= 500),
  input_video_path TEXT,
  output_video_url TEXT,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  content JSONB,
  metadata JSONB
);

-- Create index on user_id for faster queries
CREATE INDEX idx_watermarks_user_id ON watermarks(user_id);
CREATE INDEX idx_watermarks_status ON watermarks(status);
CREATE INDEX idx_watermarks_created_at ON watermarks(created_at DESC);

-- Enable RLS
ALTER TABLE watermarks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own watermarks
CREATE POLICY "Users can view their own watermarks"
  ON watermarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own watermarks
CREATE POLICY "Users can insert their own watermarks"
  ON watermarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own watermarks
CREATE POLICY "Users can update their own watermarks"
  ON watermarks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own watermarks
CREATE POLICY "Users can delete their own watermarks"
  ON watermarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_watermarks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER watermarks_updated_at
  BEFORE UPDATE ON watermarks
  FOR EACH ROW
  EXECUTE FUNCTION update_watermarks_updated_at();
