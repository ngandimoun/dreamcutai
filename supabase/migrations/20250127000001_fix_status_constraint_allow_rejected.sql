-- Fix status CHECK constraints to allow 'rejected' status
-- This fixes the constraint violation when marking content as rejected

-- Drop and recreate music_jingles status constraint
ALTER TABLE music_jingles 
DROP CONSTRAINT IF EXISTS music_jingles_status_check;

ALTER TABLE music_jingles 
ADD CONSTRAINT music_jingles_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected'));

-- Drop and recreate lyrics_generations status constraint
ALTER TABLE lyrics_generations 
DROP CONSTRAINT IF EXISTS lyrics_generations_status_check;

ALTER TABLE lyrics_generations 
ADD CONSTRAINT lyrics_generations_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected'));

-- Drop and recreate audio_separations status constraint
ALTER TABLE audio_separations 
DROP CONSTRAINT IF EXISTS audio_separations_status_check;

ALTER TABLE audio_separations 
ADD CONSTRAINT audio_separations_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected'));

-- Drop and recreate music_videos status constraint
ALTER TABLE music_videos 
DROP CONSTRAINT IF EXISTS music_videos_status_check;

ALTER TABLE music_videos 
ADD CONSTRAINT music_videos_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected'));
