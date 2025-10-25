-- Add dual frame fields to diverse_motions table for dual mode support
-- This migration adds fields to support first-last-frame-to-video functionality

-- Add dual frame URL fields
ALTER TABLE diverse_motions ADD COLUMN IF NOT EXISTS first_frame_url TEXT;
ALTER TABLE diverse_motions ADD COLUMN IF NOT EXISTS last_frame_url TEXT;

-- Add dual frame storage path fields
ALTER TABLE diverse_motions ADD COLUMN IF NOT EXISTS first_frame_storage_path TEXT;
ALTER TABLE diverse_motions ADD COLUMN IF NOT EXISTS last_frame_storage_path TEXT;

-- Add comments for documentation
COMMENT ON COLUMN diverse_motions.first_frame_url IS 'URL of the first frame image for dual mode generation';
COMMENT ON COLUMN diverse_motions.last_frame_url IS 'URL of the last frame image for dual mode generation';
COMMENT ON COLUMN diverse_motions.first_frame_storage_path IS 'Supabase storage path for the first frame image';
COMMENT ON COLUMN diverse_motions.last_frame_storage_path IS 'Supabase storage path for the last frame image';
