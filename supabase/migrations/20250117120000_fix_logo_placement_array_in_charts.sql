-- Fix logo_placement column in charts_infographics table to support JSONB array
-- This migration changes logo_placement from TEXT to JSONB to match Avatar/Persona pattern
-- and enables proper multi-select logo placement functionality

-- Drop the old check constraint (if it exists) that was designed for TEXT values
ALTER TABLE charts_infographics 
DROP CONSTRAINT IF EXISTS charts_infographics_logo_placement_check;

-- First, add a temporary column for the new JSONB data
ALTER TABLE charts_infographics 
ADD COLUMN logo_placement_new JSONB;

-- Migrate existing data: convert single TEXT values to single-item arrays
UPDATE charts_infographics 
SET logo_placement_new = CASE 
  WHEN logo_placement IS NULL THEN NULL
  WHEN logo_placement = '' THEN NULL
  ELSE jsonb_build_array(logo_placement)
END;

-- Drop the old column
ALTER TABLE charts_infographics 
DROP COLUMN logo_placement;

-- Rename the new column to the original name
ALTER TABLE charts_infographics 
RENAME COLUMN logo_placement_new TO logo_placement;

-- Add comment to document the column
COMMENT ON COLUMN charts_infographics.logo_placement IS 'Logo placement positions as JSONB array (e.g., ["top-right", "on-chart"]). Supports multiple placement options like Avatar/Persona generators.';

-- Create index for better query performance on logo_placement
CREATE INDEX idx_charts_infographics_logo_placement ON charts_infographics USING GIN (logo_placement);
