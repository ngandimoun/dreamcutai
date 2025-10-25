-- Add Eye Direction and Head Orientation fields to avatars_personas table
-- These fields control where the avatar is looking and head positioning

ALTER TABLE avatars_personas
ADD COLUMN eye_direction TEXT,
ADD COLUMN head_orientation TEXT;

-- Add comments for documentation
COMMENT ON COLUMN avatars_personas.eye_direction IS 'Controls where the avatar is looking (at camera, left, right, up, down, away)';
COMMENT ON COLUMN avatars_personas.head_orientation IS 'Controls head positioning (front, turned left/right, tilted, profile)';

