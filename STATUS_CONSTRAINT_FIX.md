# Status Constraint Fix for Manim Explainer System

## Issue Identified
The error `new row for relation "explainers" violates check constraint "explainers_status_check"` occurred because we were using status values that don't match the database constraint.

## Solution Implemented
Updated all status values to match the existing database schema constraints:

### Status Values Used:
- `'draft'` - Initial status when job is created
- `'processing'` - While generating code and rendering
- `'completed'` - When generation is successful
- `'failed'` - When generation fails

### Changes Made:

#### 1. API Endpoint (`app/api/explainers/generate/route.ts`)
```typescript
// Before (invalid status values)
status: 'queued'
status: 'planning'
status: 'rendering'
status: 'done'

// After (valid status values)
status: 'draft'
status: 'processing'
status: 'completed'
```

#### 2. Self-Healing Logic (`lib/manim/self-healing.ts`)
```typescript
// Updated all status updates to use 'processing'
await updateJobStatus(supabase, jobId, {
  status: 'processing',  // ✅ Valid status
  retryCount: attempt - 1,
  lastError: attempt > 1 ? lastError : undefined
});
```

#### 3. Frontend Interface (`components/explainer-generator-interface.tsx`)
```typescript
// Updated status mapping
const statusMap: Record<string, { step: string; progress: number }> = {
  'draft': { step: 'Queued for processing...', progress: 5 },
  'processing': { step: 'Generating animation...', progress: 50 },
  'completed': { step: 'Complete!', progress: 100 },
  'failed': { step: 'Generation failed', progress: 0 }
}
```

## Database Schema Compatibility
The solution now works with the existing `explainers` table status constraint:

```sql
-- explainers table status constraint
CHECK (status IN ('draft', 'processing', 'completed', 'failed'))
```

## Testing Instructions

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the API endpoint:**
   ```bash
   # Using PowerShell
   Invoke-WebRequest -Uri "http://localhost:3001/api/explainers/generate" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"prompt":"animate a rotating cube","hasVoiceover":false,"voiceStyle":"educational","language":"english","duration":5,"aspectRatio":"16:9","resolution":"720p","style":"auto"}'
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
   Invoke-WebRequest -Uri "http://localhost:3001/api/explainers/generate?jobId={jobId}"
   ```

## Environment Variables Required
Make sure these are set in your `.env.local`:
```
OPENAI_API_KEY=your_openai_api_key
E2B_API_KEY=your_e2b_api_key
ELEVEN_API_KEY=your_elevenlabs_api_key
```

## All Database Issues Resolved

✅ **Schema Compatibility** - Using existing columns and metadata field  
✅ **UUID Format** - Auto-generated UUIDs instead of custom IDs  
✅ **Status Constraint** - Using valid status values (draft, processing, completed, failed)  

## Next Steps
1. Test the API with a simple prompt
2. Verify job creation works without constraint errors
3. Test the complete generation flow
4. Monitor for any remaining database issues

The status constraint issue should now be resolved, and the API should work with the existing Supabase database schema.

