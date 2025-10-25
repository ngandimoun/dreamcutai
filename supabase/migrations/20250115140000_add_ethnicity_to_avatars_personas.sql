-- Add ethnicity column to avatars_personas table
-- This migration adds support for ethnicity field in avatar persona generation

ALTER TABLE avatars_personas 
ADD COLUMN ethnicity TEXT;

-- Add comment to document the column
COMMENT ON COLUMN avatars_personas.ethnicity IS 'Ethnicity field for avatar persona generation, used in prompt building';
