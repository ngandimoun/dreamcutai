-- Create library_items table
CREATE TABLE IF NOT EXISTS library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  date_added_to_library TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_library_items_user_id ON library_items(user_id);
CREATE INDEX idx_library_items_content_type ON library_items(content_type);
CREATE INDEX idx_library_items_date_added ON library_items(date_added_to_library DESC);

-- Enable RLS
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own library items
CREATE POLICY "Users can view their own library items"
  ON library_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own library items
CREATE POLICY "Users can insert their own library items"
  ON library_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own library items
CREATE POLICY "Users can update their own library items"
  ON library_items
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own library items
CREATE POLICY "Users can delete their own library items"
  ON library_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_library_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER library_items_updated_at
  BEFORE UPDATE ON library_items
  FOR EACH ROW
  EXECUTE FUNCTION update_library_items_updated_at();
