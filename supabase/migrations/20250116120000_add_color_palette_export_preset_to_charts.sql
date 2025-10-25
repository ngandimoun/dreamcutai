-- Add color_palette and export_preset columns to charts_infographics table
-- This migration adds support for the new Chart Asset Home features

ALTER TABLE charts_infographics 
ADD COLUMN IF NOT EXISTS color_palette TEXT;

ALTER TABLE charts_infographics 
ADD COLUMN IF NOT EXISTS export_preset TEXT;

-- Add comments for documentation
COMMENT ON COLUMN charts_infographics.color_palette IS 'Selected color palette name (e.g., "Sunset Gradient", "Ocean Breeze") for chart styling';
COMMENT ON COLUMN charts_infographics.export_preset IS 'Selected export preset (e.g., "Instagram Post", "LinkedIn Post") defining dimensions and optimization';
