-- Add individual text color columns to product_mockups table
-- This migration adds support for individual color controls for headline, subtext, and CTA text
-- with auto color selection feature

-- Add headline color columns
ALTER TABLE product_mockups 
ADD COLUMN IF NOT EXISTS headline_color TEXT DEFAULT '#000000';

ALTER TABLE product_mockups 
ADD COLUMN IF NOT EXISTS headline_color_auto BOOLEAN DEFAULT true;

-- Add subtext color columns
ALTER TABLE product_mockups 
ADD COLUMN IF NOT EXISTS subtext_color TEXT DEFAULT '#666666';

ALTER TABLE product_mockups 
ADD COLUMN IF NOT EXISTS subtext_color_auto BOOLEAN DEFAULT true;

-- Add CTA text color columns
ALTER TABLE product_mockups 
ADD COLUMN IF NOT EXISTS cta_color TEXT DEFAULT '#3B82F6';

ALTER TABLE product_mockups 
ADD COLUMN IF NOT EXISTS cta_color_auto BOOLEAN DEFAULT true;

-- Remove old text_color column if it exists
ALTER TABLE product_mockups 
DROP COLUMN IF EXISTS text_color;

-- Add comments to document the columns
COMMENT ON COLUMN product_mockups.headline_color IS 'Color for headline text in product mockup. Default: black (#000000)';
COMMENT ON COLUMN product_mockups.headline_color_auto IS 'If true, AI automatically selects optimal headline color based on design context';
COMMENT ON COLUMN product_mockups.subtext_color IS 'Color for subtext in product mockup. Default: gray (#666666)';
COMMENT ON COLUMN product_mockups.subtext_color_auto IS 'If true, AI automatically selects optimal subtext color based on design context';
COMMENT ON COLUMN product_mockups.cta_color IS 'Color for CTA (Call-to-Action) text in product mockup. Default: brand primary blue (#3B82F6)';
COMMENT ON COLUMN product_mockups.cta_color_auto IS 'If true, AI automatically selects optimal CTA color based on design context';


