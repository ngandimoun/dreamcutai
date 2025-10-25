-- Optional cleanup of deprecated fields from existing voiceovers
-- This is NOT required for functionality - old fields are harmless
-- Run this only if you want to clean up the database for tidiness

-- Remove deprecated top-level fields from content JSONB
UPDATE voiceovers
SET content = content - 'emotion' - 'audioQualityIntent' - 'guidanceScale'
WHERE content ? 'emotion' 
   OR content ? 'audioQualityIntent' 
   OR content ? 'guidanceScale';

-- Clean up emotional_dna if it has old deprecated fields
UPDATE voiceovers
SET content = jsonb_set(
  content,
  '{emotional_dna}',
  (content->'emotional_dna') - 'audio_quality' - 'guidance_scale'
)
WHERE content->'emotional_dna' ? 'audio_quality'
   OR content->'emotional_dna' ? 'guidance_scale';

-- Clean up voice_identity if it has old deprecated fields
UPDATE voiceovers
SET content = jsonb_set(
  content,
  '{voice_identity}',
  (content->'voice_identity') - 'audio_quality' - 'guidance_scale'
)
WHERE content->'voice_identity' ? 'audio_quality'
   OR content->'voice_identity' ? 'guidance_scale';

-- Clean up settings if it has old deprecated fields
UPDATE voiceovers
SET content = jsonb_set(
  content,
  '{settings}',
  (content->'settings') - 'emotion' - 'audioQualityIntent' - 'guidanceScale'
)
WHERE content->'settings' ? 'emotion'
   OR content->'settings' ? 'audioQualityIntent'
   OR content->'settings' ? 'guidanceScale';

-- Show summary of cleaned records
SELECT 
  COUNT(*) as total_voiceovers,
  COUNT(CASE WHEN content ? 'emotion' THEN 1 END) as still_has_emotion,
  COUNT(CASE WHEN content->'emotional_dna' ? 'audio_quality' THEN 1 END) as still_has_audio_quality,
  COUNT(CASE WHEN content->'emotional_dna' ? 'guidance_scale' THEN 1 END) as still_has_guidance_scale
FROM voiceovers;
