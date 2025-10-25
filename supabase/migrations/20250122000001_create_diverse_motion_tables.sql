-- Create diverse motion tables for single and dual asset motion videos
-- This migration creates tables for diverse motion video generation

-- Create diverse_motion_single table
CREATE TABLE IF NOT EXISTS diverse_motion_single (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Diverse Motion',
  asset_url TEXT,
  prompt TEXT,
  duration INTEGER DEFAULT 8,
  motion_type TEXT DEFAULT 'smooth',
  style TEXT DEFAULT 'cinematic',
  aspect_ratio TEXT DEFAULT '16:9',
  resolution TEXT DEFAULT '1080p',
  generate_audio BOOLEAN DEFAULT true,
  storage_path TEXT,
  generated_video_url TEXT,
  fal_request_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create diverse_motion_dual table
CREATE TABLE IF NOT EXISTS diverse_motion_dual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Diverse Motion',
  asset_1_url TEXT,
  asset_2_url TEXT,
  prompt TEXT,
  duration INTEGER DEFAULT 8,
  motion_type TEXT DEFAULT 'smooth',
  style TEXT DEFAULT 'cinematic',
  aspect_ratio TEXT DEFAULT '16:9',
  resolution TEXT DEFAULT '1080p',
  generate_audio BOOLEAN DEFAULT true,
  storage_path TEXT,
  generated_video_url TEXT,
  fal_request_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diverse_motion_single_user_id ON diverse_motion_single(user_id);
CREATE INDEX IF NOT EXISTS idx_diverse_motion_single_created_at ON diverse_motion_single(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diverse_motion_single_status ON diverse_motion_single(status);

CREATE INDEX IF NOT EXISTS idx_diverse_motion_dual_user_id ON diverse_motion_dual(user_id);
CREATE INDEX IF NOT EXISTS idx_diverse_motion_dual_created_at ON diverse_motion_dual(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diverse_motion_dual_status ON diverse_motion_dual(status);

-- Enable RLS
ALTER TABLE diverse_motion_single ENABLE ROW LEVEL SECURITY;
ALTER TABLE diverse_motion_dual ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for diverse_motion_single
CREATE POLICY "Users can view their own diverse motion single videos" ON diverse_motion_single
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diverse motion single videos" ON diverse_motion_single
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diverse motion single videos" ON diverse_motion_single
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diverse motion single videos" ON diverse_motion_single
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for diverse_motion_dual
CREATE POLICY "Users can view their own diverse motion dual videos" ON diverse_motion_dual
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diverse motion dual videos" ON diverse_motion_dual
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diverse motion dual videos" ON diverse_motion_dual
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diverse motion dual videos" ON diverse_motion_dual
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_diverse_motion_single_updated_at 
  BEFORE UPDATE ON diverse_motion_single 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diverse_motion_dual_updated_at 
  BEFORE UPDATE ON diverse_motion_dual 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
