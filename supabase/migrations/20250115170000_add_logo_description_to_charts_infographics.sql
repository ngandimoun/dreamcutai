-- Add logo_description column to charts_infographics table
-- This migration adds support for logo description field in charts and infographics generation

ALTER TABLE charts_infographics 
ADD COLUMN logo_description TEXT;

-- Add comment to document the column
COMMENT ON COLUMN charts_infographics.logo_description IS 'Logo description field for charts and infographics generation, used in prompt building for better AI understanding of logo style and appearance';
