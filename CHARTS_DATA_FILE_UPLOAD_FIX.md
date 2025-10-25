# Charts & Infographics: Data File Upload Fix

## Problem
Charts & Infographics API was failing when users uploaded JSON data files with the error:
```
StorageApiError: mime type application/json is not supported
```

## Root Cause
Supabase storage has restrictions on certain MIME types, including `application/json`. The API was trying to upload data files (CSV, JSON, Excel, etc.) to Supabase storage, but these files are only needed for the Code Interpreter processing phase, not for permanent storage.

## Solution
**Skip Supabase storage for data files** since they're only used temporarily for Code Interpreter processing:

### Changes Made

1. **Removed Supabase Upload for Data Files** (`app/api/charts-infographics/route.ts`)
   - Data files are no longer uploaded to Supabase storage
   - Only store file metadata (name, type, size) in database
   - File content is passed directly to Code Interpreter

2. **Updated Database Storage**
   - `csv_file_path` now stores a reference like `data-file-filename.json`
   - Added `dataFile` metadata with actual file information
   - Maintains backward compatibility

3. **Enhanced Logging**
   - Added detailed logging for data file reception
   - Shows file name, type, and size for debugging

## Technical Details

### Before (Broken)
```typescript
// Upload to Supabase storage (fails for JSON)
const { error: uploadError } = await supabase.storage
  .from('dreamcut')
  .upload(filePath, dataFile, {
    cacheControl: '3600',
    upsert: false,
  })
```

### After (Fixed)
```typescript
// Skip Supabase storage, just store reference
dataFilePath = `data-file-${dataFile.name}`
console.log(`📁 Data file received: ${dataFile.name} (${dataFile.type}, ${dataFile.size} bytes)`)
```

## Benefits

1. **✅ Fixes JSON Upload Issue** - No more MIME type errors
2. **✅ Supports All File Types** - CSV, JSON, Excel, PDF, etc.
3. **✅ Maintains Functionality** - Code Interpreter still gets the file
4. **✅ Better Performance** - No unnecessary storage uploads
5. **✅ Cost Effective** - Reduces Supabase storage usage

## File Flow

1. **Frontend** → Uploads data file via FormData
2. **API** → Receives file, stores metadata only
3. **Code Interpreter** → Gets file buffer for processing
4. **Database** → Stores file reference and metadata
5. **Result** → Chart generated successfully

## Testing

The fix resolves the original error and allows:
- ✅ JSON file uploads
- ✅ CSV file uploads  
- ✅ Excel file uploads
- ✅ All other supported data formats
- ✅ Logo placement functionality (from previous fix)

## Related Files

- `app/api/charts-infographics/route.ts` - Main API route fix
- `lib/openai/code-interpreter.ts` - Already handles all file types correctly
- `components/charts-infographics-generator-interface.tsx` - UI already supports all formats
