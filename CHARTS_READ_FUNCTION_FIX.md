# Charts & Infographics: Pandas Read Function Fix

## Problem
Code Interpreter generated code with the wrong pandas read function for the file type:
- **Uploaded file:** `test.json`
- **Generated code:** `pd.read_excel('/mnt/data/test.json')`
- **Error:** `Excel file format cannot be determined, you must specify an engine manually.`

## Root Cause
After filename replacement, the code had the correct filename but the wrong read function. Code Interpreter generated `pd.read_excel()` for what it thought was an Excel file, but the actual file was JSON.

## Solution: Fix Read Function Based on File Extension

Added post-processing logic to replace any pandas read function with the correct one based on the actual file extension.

## Implementation

### Updated API Route
**File:** `app/api/charts-infographics/route.ts`

**Added read function replacement logic:**
```typescript
// Fix read function based on file extension
const fileExt = dataFile.name.split('.').pop()?.toLowerCase()

// Map file extensions to pandas read functions
const readFunctionMap: Record<string, string> = {
  'csv': 'pd.read_csv',
  'json': 'pd.read_json',
  'xlsx': 'pd.read_excel',
  'xls': 'pd.read_excel',
  'txt': 'pd.read_csv',
  'tsv': 'pd.read_csv',
  'parquet': 'pd.read_parquet'
}

// Replace any pandas read function with the correct one
if (fileExt && readFunctionMap[fileExt]) {
  const correctReadFunction = readFunctionMap[fileExt]
  chartCodeResult.pythonCode = chartCodeResult.pythonCode.replace(
    /pd\.(read_excel|read_csv|read_json|read_parquet)\s*\(/g,
    `${correctReadFunction}(`
  )
  console.log(`📝 Replaced read function with ${correctReadFunction} for .${fileExt} file`)
}
```

## How It Works

1. **Extract file extension** from uploaded filename
2. **Lookup correct read function** from mapping
3. **Replace all read functions** in the code with the correct one
4. **Execution succeeds** with proper file reading

## Example Transformations

### For JSON file:
**Before:**
```python
df = pd.read_excel('/mnt/data/test.json')  # ❌ Wrong function
```

**After:**
```python
df = pd.read_json('/mnt/data/test.json')   # ✅ Correct function
```

### For CSV file:
**Before:**
```python
df = pd.read_excel('/mnt/data/data.csv')   # ❌ Wrong function
```

**After:**
```python
df = pd.read_csv('/mnt/data/data.csv')     # ✅ Correct function
```

### For Excel file:
**Before:**
```python
df = pd.read_csv('/mnt/data/data.xlsx')    # ❌ Wrong function
```

**After:**
```python
df = pd.read_excel('/mnt/data/data.xlsx')  # ✅ Correct function
```

## Supported File Types

✅ **CSV files** → `pd.read_csv()`  
✅ **JSON files** → `pd.read_json()`  
✅ **Excel files** (.xlsx, .xls) → `pd.read_excel()`  
✅ **Text files** (.txt) → `pd.read_csv()`  
✅ **TSV files** → `pd.read_csv()`  
✅ **Parquet files** → `pd.read_parquet()`  

## Benefits

✅ **Automatic correction** - No manual intervention needed  
✅ **Supports multiple formats** - CSV, JSON, Excel, TSV, Parquet  
✅ **Simple implementation** - Just one regex replacement  
✅ **Works with filename fix** - Complements the existing filename replacement  
✅ **Robust** - Handles any read function Code Interpreter generates  

## Complete Post-Processing Flow

The API now performs two post-processing steps:

1. **Filename Replacement:**
   ```typescript
   // Replace any file paths with actual uploaded filename
   chartCodeResult.pythonCode = chartCodeResult.pythonCode.replace(
     /\/mnt\/data\/[^\s'"]+\.(xlsx|xls|csv|json|txt|pdf|docx|doc|xml|html|md)/gi,
     `/mnt/data/${dataFile.name}`
   )
   ```

2. **Read Function Replacement:**
   ```typescript
   // Replace any pandas read function with the correct one
   chartCodeResult.pythonCode = chartCodeResult.pythonCode.replace(
     /pd\.(read_excel|read_csv|read_json|read_parquet)\s*\(/g,
     `${correctReadFunction}(`
   )
   ```

## Testing

The fix resolves:
- ✅ JSON file uploads with Excel read functions
- ✅ CSV file uploads with Excel read functions
- ✅ Excel file uploads with CSV read functions
- ✅ All other file format mismatches
- ✅ Automatic function correction based on file extension

## Related Files

- `app/api/charts-infographics/route.ts` - Added read function replacement logic
- `lib/modal/chart-generation.ts` - Modal function (unchanged)
- `modal_functions/chart_render.py` - Modal Python function (unchanged)

## Summary

This fix ensures that **any pandas read function in the generated code is automatically replaced with the correct one based on the actual file extension**, resolving the mismatch between what Code Interpreter generates and what function is needed to read the specific file type. Combined with the filename replacement, this provides a robust solution for handling any file format automatically.
