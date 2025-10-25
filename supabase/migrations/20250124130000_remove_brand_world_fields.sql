-- Remove brand/world sync columns from voices_creations table
-- These fields are no longer used in the voice creation UI

ALTER TABLE voices_creations
DROP COLUMN IF EXISTS brand_sync,
DROP COLUMN IF EXISTS world_link,
DROP COLUMN IF EXISTS tone_match;

-- Note: brand_persona_matching and default_script_tone 
-- were likely stored in JSONB metadata only, not as separate columns


