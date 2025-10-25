@echo off
echo Running targeted backfill for problematic record...
npx tsx scripts/backfill-suno-audio-ids.ts --ids="6639a5ba-0161-44da-8323-37c0a9e9a320"
pause




