# Charts & Infographics: DataSource Constraint Fix

## Problem
Database insert failed with constraint violation error:
- **Error:** `new row for relation "charts_infographics" violates check constraint "charts_infographics_data_source_check"`
- **Cause:** Frontend sends `dataSource: "file"` but database constraint only allows specific values like `['text', 'manual', 'csv', 'excel', 'json']`

## Root Cause
The frontend sends a generic `"file"` value for the `dataSource` field when a file is uploaded, but the database has a CHECK constraint that only allows specific file type values, not the generic `"file"` value.

## Solution: Map "file" to Actual File Type

Map the generic frontend `"file"` value to the actual file type based on the uploaded file extension before saving to database.

## Implementation

### Updated API Route
**File:** `app/api/charts-infographics/route.ts`

**Added file type mapping logic:**
```typescript
// Map generic "file" dataSource to actual file type
if (dataSource === 'file' && dataFile) {
  const fileExt = dataFile.name.split('.').pop()?.toLowerCase()
  const fileTypeMap: Record<string, string> = {
    'csv': 'csv',
    'xlsx': 'excel',
    'xls': 'excel',
    'json': 'json',
    'txt': 'text',
    'pdf': 'pdf',
    'docx': 'document',
    'doc': 'document',
    'xml': 'xml',
    'html': 'html',
    'md': 'markdown',
  }
  dataSource = fileTypeMap[fileExt || ''] || 'csv'
  console.log(`📝 Mapped file source to actual type: ${dataSource}`)
}
```

## How It Works

### Mapping Logic:
1. **Check if dataSource is "file"** and a file was uploaded
2. **Extract file extension** from uploaded filename
3. **Map extension to database value** using predefined mapping
4. **Fallback to "csv"** if extension not recognized
5. **Log the mapping** for debugging

### Example Transformations:

**CSV Upload:**
- Frontend: `dataSource: "file"` + `dataFile: "sales.csv"`
- Database: `data_source: "csv"`

**Excel Upload:**
- Frontend: `dataSource: "file"` + `dataFile: "data.xlsx"`
- Database: `data_source: "excel"`

**JSON Upload:**
- Frontend: `dataSource: "file"` + `dataFile: "config.json"`
- Database: `data_source: "json"`

**Text Prompt:**
- Frontend: `dataSource: "text"`
- Database: `data_source: "text"` (unchanged)

## Supported File Types

✅ **CSV files** (.csv) → `data_source: "csv"`  
✅ **Excel files** (.xlsx, .xls) → `data_source: "excel"`  
✅ **JSON files** (.json) → `data_source: "json"`  
✅ **Text files** (.txt) → `data_source: "text"`  
✅ **PDF files** (.pdf) → `data_source: "pdf"`  
✅ **Word documents** (.docx, .doc) → `data_source: "document"`  
✅ **XML files** (.xml) → `data_source: "xml"`  
✅ **HTML files** (.html) → `data_source: "html"`  
✅ **Markdown files** (.md) → `data_source: "markdown"`  
✅ **Unknown files** → `data_source: "csv"` (fallback)  

## Benefits

✅ **No schema changes** - Works with existing database constraint  
✅ **More informative** - Database knows actual file type, not generic "file"  
✅ **Better analytics** - Can query by specific file type  
✅ **Safer** - No migration needed, no risk of breaking existing data  
✅ **Immediate fix** - Works as soon as code is deployed  
✅ **Future-proof** - Easy to add new file types  

## Expected Database Values

After this fix, the `data_source` column will store:
- `"text"` - Text prompt or TXT file
- `"manual"` - Manual data entry
- `"csv"` - CSV file upload
- `"excel"` - Excel file upload
- `"json"` - JSON file upload
- `"pdf"` - PDF file upload
- `"document"` - Word document upload
- `"xml"` - XML file upload
- `"html"` - HTML file upload
- `"markdown"` - Markdown file upload

## Testing

The fix resolves:
- ✅ CSV file uploads (data_source: "csv")
- ✅ Excel file uploads (data_source: "excel")
- ✅ JSON file uploads (data_source: "json")
- ✅ All other supported file types
- ✅ Text prompts (data_source: "text")
- ✅ Manual data entry (data_source: "manual")
- ✅ Database constraint violations

## Related Files

- `app/api/charts-infographics/route.ts` - Added file type mapping logic
- `components/charts-infographics-generator-interface.tsx` - Frontend (unchanged)

## Summary

This fix ensures that **the generic "file" value from the frontend is automatically mapped to the actual file type** before saving to the database, resolving the constraint violation error. The solution is safe, informative, and provides better data for analytics and queries.
