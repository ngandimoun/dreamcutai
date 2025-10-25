# UUID Database Issue Fix

## Issue Identified
The error `invalid input syntax for type uuid: "explainer_1759967789967_utiwm6l6m"` occurred because the `explainers` table's `id` column expects a UUID format, but we were generating custom string IDs.

## Solution Implemented
Modified the API to let Supabase auto-generate UUIDs instead of creating custom IDs:

### Before (Custom ID Generation):
```typescript
const jobId = `explainer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

const { data: job, error: jobError } = await supabase
  .from('explainers')
  .insert({
    id: jobId,  // ❌ Custom string ID
    user_id: user.id,
    // ... other fields
  })
```

### After (Auto-Generated UUID):
```typescript
const { data: job, error: jobError } = await supabase
  .from('explainers')
  .insert({
    // ✅ No id field - let Supabase generate UUID
    user_id: user.id,
    // ... other fields
  })

const jobId = job.id  // ✅ Use the generated UUID
```

## Changes Made

### 1. Updated API Endpoint (`app/api/explainers/generate/route.ts`)
- Removed custom ID generation
- Let Supabase auto-generate UUID for the `id` field
- Use the generated `job.id` for subsequent operations
- Updated all metadata storage to use the `metadata` field

### 2. Updated Error Handling
- All error updates now store data in the `metadata` field
- Consistent with the existing database schema
- Maintains backward compatibility

## Database Schema Compatibility
The solution now works with the standard Supabase UUID primary key:

```sql
-- explainers table structure
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES auth.users(id)
title TEXT
description TEXT
status TEXT
duration INTEGER
style TEXT
metadata JSONB
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

## Testing Instructions

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the API endpoint:**
   ```bash
   # Using curl (Linux/Mac)
   curl -X POST http://localhost:3001/api/explainers/generate \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "animate a rotating cube",
       "hasVoiceover": false,
       "voiceStyle": "educational",
       "language": "english",
       "duration": 5,
       "aspectRatio": "16:9",
       "resolution": "720p",
       "style": "auto"
     }'
   ```

3. **Expected Response:**
   ```json
   {
     "success": true,
     "jobId": "550e8400-e29b-41d4-a716-446655440000",
     "message": "Generation started"
   }
   ```

4. **Check Job Status:**
   ```bash
   curl http://localhost:3001/api/explainers/generate?jobId={jobId}
   ```

## Environment Variables Required
Make sure these are set in your `.env.local`:
```
OPENAI_API_KEY=your_openai_api_key
E2B_API_KEY=your_e2b_api_key
ELEVEN_API_KEY=your_elevenlabs_api_key
```

## Next Steps
1. Test the API with a simple prompt
2. Verify job creation works without UUID errors
3. Test the complete generation flow
4. Monitor for any remaining database issues

The UUID issue should now be resolved, and the API should work with the existing Supabase database schema.

