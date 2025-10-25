-- Add Frame & Composition fields to avatars_personas table
-- These fields control camera framing, pose style, and avatar composition

ALTER TABLE avatars_personas
ADD COLUMN avatar_composition TEXT,
ADD COLUMN pose_style TEXT,
ADD COLUMN camera_view TEXT;

-- Add comments for documentation
COMMENT ON COLUMN avatars_personas.avatar_composition IS 'Controls how much of the character is generated (Full Body, Upper Body, Portrait, etc.)';
COMMENT ON COLUMN avatars_personas.pose_style IS 'Controls the posture and energy of the avatar (Static, Dynamic, Artistic, etc.)';
COMMENT ON COLUMN avatars_personas.camera_view IS 'Controls the camera framing and perspective (Close-up, Medium, Wide, etc.)';

