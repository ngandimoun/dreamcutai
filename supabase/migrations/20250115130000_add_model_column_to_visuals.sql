-- Add model column to visual generation tables
-- This migration adds a model column to track which AI model was used for generation

-- Add model column to illustrations table
ALTER TABLE illustrations 
ADD COLUMN model TEXT DEFAULT 'Nano-banana';

-- Add model column to avatars_personas table
ALTER TABLE avatars_personas 
ADD COLUMN model TEXT DEFAULT 'Nano-banana';

-- Add model column to concept_worlds table
ALTER TABLE concept_worlds 
ADD COLUMN model TEXT DEFAULT 'Nano-banana';

-- Add model column to product_mockups table
ALTER TABLE product_mockups 
ADD COLUMN model TEXT DEFAULT 'Nano-banana';

-- Add comments for documentation
COMMENT ON COLUMN illustrations.model IS 'AI model used for generation: Nano-banana, Gpt-image-1, or Seedream-v4';
COMMENT ON COLUMN avatars_personas.model IS 'AI model used for generation: Nano-banana, Gpt-image-1, or Seedream-v4';
COMMENT ON COLUMN concept_worlds.model IS 'AI model used for generation: Nano-banana, Gpt-image-1, or Seedream-v4';
COMMENT ON COLUMN product_mockups.model IS 'AI model used for generation: Nano-banana, Gpt-image-1, or Seedream-v4';

