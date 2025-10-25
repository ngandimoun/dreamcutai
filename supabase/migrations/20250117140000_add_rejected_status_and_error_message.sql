-- Add 'rejected' to status enum
ALTER TYPE generation_status ADD VALUE IF NOT EXISTS 'rejected';

-- Add error_message column to music_jingles
ALTER TABLE music_jingles
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add error_message to other generation tables
ALTER TABLE lyrics_generations
ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE audio_separations
ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE music_videos
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_music_jingles_status ON music_jingles(status);
CREATE INDEX IF NOT EXISTS idx_lyrics_generations_status ON lyrics_generations(status);
CREATE INDEX IF NOT EXISTS idx_audio_separations_status ON audio_separations(status);
CREATE INDEX IF NOT EXISTS idx_music_videos_status ON music_videos(status);
