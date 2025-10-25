-- Update watermarks table to make video_source and description optional
-- This allows the new /api/watermarks/generate endpoint to work without these legacy fields

-- Make video_source optional (remove NOT NULL constraint)
ALTER TABLE watermarks 
  ALTER COLUMN video_source DROP NOT NULL;

-- Set default value for video_source
ALTER TABLE watermarks 
  ALTER COLUMN video_source SET DEFAULT 'upload';

-- Description is already optional, no changes needed

-- Add comment explaining the fields
COMMENT ON COLUMN watermarks.video_source IS 'Source of the video: upload or library (legacy field, optional)';
COMMENT ON COLUMN watermarks.description IS 'Project description (optional)';
COMMENT ON COLUMN watermarks.video_url IS 'Input video URL (source video before watermark)';
COMMENT ON COLUMN watermarks.output_video_url IS 'Output video URL (watermarked video)';
COMMENT ON COLUMN watermarks.storage_path IS 'Supabase storage path for the watermarked video';

