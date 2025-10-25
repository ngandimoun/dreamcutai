-- Add logo_description column to avatars_personas table
-- This migration adds support for logo description field in avatar persona generation

ALTER TABLE avatars_personas 
ADD COLUMN logo_description TEXT;

-- Add comment to document the column
COMMENT ON COLUMN avatars_personas.logo_description IS 'Logo description field for avatar persona generation, used in prompt building for better AI understanding of logo style and appearance';
