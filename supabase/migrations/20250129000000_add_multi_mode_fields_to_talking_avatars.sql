-- Add multi mode fields to talking_avatars table
-- This migration adds support for Group Scene (multi mode) functionality

-- Add mode column to distinguish between single, describe, and multi modes
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS mode text CHECK (mode IN ('single', 'describe', 'multi'));

-- Add scene slots for multi mode (stores array of avatar/image selections)
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS scene_slots jsonb;

-- Add scene description for multi mode
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS scene_description text;

-- Add scene character count for multi mode
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS scene_character_count integer;

-- Add scene characters array for multi mode
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS scene_characters jsonb;

-- Add scene dialog lines for multi mode
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS scene_dialog_lines jsonb;

-- Add scene environment settings for multi mode
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS scene_environment text;
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS custom_scene_environment text;

-- Add scene background settings for multi mode
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS scene_background text;
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS custom_scene_background text;

-- Add scene lighting settings for multi mode
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS scene_lighting text;
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS custom_scene_lighting text;

-- Add scene audio settings for multi mode
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS scene_background_music text;
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS custom_scene_background_music text;
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS scene_sound_effects text;
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS custom_scene_sound_effects text;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_talking_avatars_mode ON talking_avatars(mode);

-- Add comments for documentation
COMMENT ON COLUMN talking_avatars.mode IS 'Generation mode: single (one avatar), describe (AI generated), multi (group scene)';
COMMENT ON COLUMN talking_avatars.scene_slots IS 'Array of scene slots for multi mode (library avatars or uploaded images)';
COMMENT ON COLUMN talking_avatars.scene_description IS 'Description of the scene for multi mode';
COMMENT ON COLUMN talking_avatars.scene_character_count IS 'Number of characters in the scene for multi mode';
COMMENT ON COLUMN talking_avatars.scene_characters IS 'Array of character names for multi mode';
COMMENT ON COLUMN talking_avatars.scene_dialog_lines IS 'Array of dialog lines for multi mode';


