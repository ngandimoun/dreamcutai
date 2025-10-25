-- Add logo_description column to product_mockups table
-- This migration adds support for logo description field in product mockup generation

ALTER TABLE product_mockups 
ADD COLUMN logo_description TEXT;

-- Add comment to document the column
COMMENT ON COLUMN product_mockups.logo_description IS 'Logo description field for product mockup generation, used in prompt building for better AI understanding of logo style and appearance';
