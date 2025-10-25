# Music Jingles Migration & Backfill Instructions

This guide will help you apply the database migration and backfill existing music jingle records with rich Suno API data (cover images, duration, tags, model info).

## 🚀 Quick Start

### Step 1: Apply Database Migration

**Option A: Supabase Dashboard (Recommended)**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy and paste this SQL:

```sql
-- Add Suno API response fields to music_jingles table
ALTER TABLE music_jingles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE music_jingles ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE music_jingles ADD COLUMN IF NOT EXISTS model_name TEXT;
ALTER TABLE music_jingles ADD COLUMN IF NOT EXISTS actual_duration DECIMAL(8,2);

-- Add comments for documentation
COMMENT ON COLUMN music_jingles.image_url IS 'Cover art image URL from Suno API response';
COMMENT ON COLUMN music_jingles.tags IS 'Style tags from Suno API response (e.g., "electrifying, rock")';
COMMENT ON COLUMN music_jingles.model_name IS 'Actual model name used by Suno (e.g., "chirp-v3-5")';
COMMENT ON COLUMN music_jingles.actual_duration IS 'Actual track duration in seconds from Suno response';

-- Create index on image_url for efficient querying
CREATE INDEX IF NOT EXISTS idx_music_jingles_image_url ON music_jingles(image_url) WHERE image_url IS NOT NULL;
```

5. Click **Run**

**Option B: Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push
```

### Step 2: Verify Migration

Run this query in Supabase SQL Editor to confirm columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'music_jingles' 
AND column_name IN ('image_url', 'tags', 'model_name', 'actual_duration');
```

You should see 4 rows returned.

### Step 3: Backfill Existing Data

**Dry Run (Preview Only)**
```bash
npm run backfill:music -- --dry-run
```

**Actual Backfill**
```bash
npm run backfill:music
```

**Backfill Specific Records**
```bash
npm run backfill:music -- --ids "id1,id2,id3"
```

## 📋 What the Backfill Script Does

1. **Fetches Records**: Finds all completed music jingles with `suno_task_id`
2. **Polls Suno API**: Gets full response data for each track
3. **Updates Database**: Populates `image_url`, `tags`, `model_name`, `actual_duration`
4. **Progress Reporting**: Shows detailed progress and statistics
5. **Error Handling**: Continues processing even if some records fail

## 🔧 Script Features

- ✅ **Batch Processing**: Processes 10 records at a time
- ✅ **Rate Limiting**: Respects Suno API limits (1 second between calls)
- ✅ **Error Handling**: Continues on failures, reports errors
- ✅ **Progress Reporting**: Real-time progress updates
- ✅ **Dry Run Mode**: Preview changes before applying
- ✅ **Smart Skipping**: Skips records that already have data
- ✅ **Specific IDs**: Can target specific records

## 📊 Expected Output

```
🎵 Music Jingles Data Backfill Script
=====================================
Mode: DRY RUN (no updates)
Specific IDs: All records

📋 Fetching music jingles...
Found 4 music jingles to process

📦 Processing batch 1/1 (4 items)
  ✅ Updated: MK (Variant 2)
  ✅ Updated: MK
  ✅ Updated: 741 (Variant 2)
  ⏭️  Skipped: Another Track (already has data)

📊 Backfill Results
==================
Processed: 4
Updated: 3
Skipped: 1
Errors: 0

🔍 This was a dry run. No database changes were made.
Run without --dry-run to apply updates.
```

## 🎯 Expected Results

**After Migration:**
- ✅ New columns exist in database
- ✅ New music generations will automatically populate these fields

**After Backfill:**
- ✅ Existing music cards show cover images instead of generic speaker icons
- ✅ Duration overlays appear (e.g., "3:18")
- ✅ Style tags displayed as badges (e.g., "electrifying", "rock")
- ✅ Model information visible (e.g., "Model: chirp-v3-5")

## 🛡️ Safety Notes

- **Migration is Safe**: Only adds new columns, doesn't modify existing data
- **Backfill is Non-Destructive**: Only populates empty fields
- **Dry Run Available**: Test before applying changes
- **Error Recovery**: Script continues even if some records fail
- **Production Safe**: Both operations can be run on production

## 🔍 Troubleshooting

**"No music jingles found that need backfilling"**
- This means all your records already have the new data
- Check if migration was applied correctly

**"Suno API request failed"**
- Check your `SUNO_API_KEY` environment variable
- Verify the API key has proper permissions

**"Database update failed"**
- Check your `SUPABASE_SERVICE_ROLE_KEY` environment variable
- Verify the migration was applied successfully

**"No data returned from Suno API"**
- The `suno_task_id` might be invalid or expired
- Some old records might not have valid task IDs

## 📁 Files Created

1. **Migration**: `supabase/migrations/20250127000000_add_suno_response_fields_to_music_jingles.sql`
2. **Backfill Script**: `scripts/backfill-music-jingles-data.ts`
3. **NPM Command**: Added `backfill:music` to package.json

## 🎉 Next Steps

After completing the migration and backfill:

1. **Generate New Music**: Create a new track to test the enhanced UI
2. **Verify Cards**: Check that existing cards now show cover images and rich data
3. **Monitor**: Watch for any issues with new generations

The music cards should now look much more professional with cover images, duration overlays, style tags, and model information!
