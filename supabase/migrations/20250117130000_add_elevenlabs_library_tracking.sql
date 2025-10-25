-- Add ElevenLabs library tracking fields to voices_creations table
-- These fields track whether voices have been added to the ElevenLabs library

ALTER TABLE voices_creations
ADD COLUMN IF NOT EXISTS added_to_elevenlabs_library BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS elevenlabs_library_added_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_voices_creations_elevenlabs_library 
ON voices_creations(added_to_elevenlabs_library);

-- Add comment for documentation
COMMENT ON COLUMN voices_creations.added_to_elevenlabs_library IS 'Whether this voice has been added to the ElevenLabs voice library';
COMMENT ON COLUMN voices_creations.elevenlabs_library_added_at IS 'Timestamp when the voice was added to ElevenLabs library';
