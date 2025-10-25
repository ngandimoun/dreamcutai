-- Add Suno API response fields to music_jingles table
-- These fields store the actual data returned from Suno API callbacks

-- Add cover image URL from Suno
ALTER TABLE music_jingles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add style tags from Suno response
ALTER TABLE music_jingles ADD COLUMN IF NOT EXISTS tags TEXT;

-- Add model name from Suno response (different from user-selected model)
ALTER TABLE music_jingles ADD COLUMN IF NOT EXISTS model_name TEXT;

-- Add actual track duration from Suno (different from user-requested duration)
ALTER TABLE music_jingles ADD COLUMN IF NOT EXISTS actual_duration DECIMAL(8,2);

-- Add comments for documentation
COMMENT ON COLUMN music_jingles.image_url IS 'Cover art image URL from Suno API response';
COMMENT ON COLUMN music_jingles.tags IS 'Style tags from Suno API response (e.g., "electrifying, rock")';
COMMENT ON COLUMN music_jingles.model_name IS 'Actual model name used by Suno (e.g., "chirp-v3-5")';
COMMENT ON COLUMN music_jingles.actual_duration IS 'Actual track duration in seconds from Suno response';

-- Create index on image_url for efficient querying
CREATE INDEX IF NOT EXISTS idx_music_jingles_image_url ON music_jingles(image_url) WHERE image_url IS NOT NULL;
