# Charts & Infographics: Multi-Format File Support

## Overview

Enhanced the Charts & Infographics generator to support multiple data file formats beyond CSV, leveraging OpenAI Code Interpreter's comprehensive file support capabilities.

## Supported File Formats

### Spreadsheet Formats
- **CSV** (`.csv`) - Comma-separated values
- **Excel** (`.xlsx`, `.xls`) - Microsoft Excel files
- **XML** (`.xml`) - Extensible Markup Language

### Data Formats
- **JSON** (`.json`) - JavaScript Object Notation
- **TXT** (`.txt`) - Plain text files

### Document Formats
- **PDF** (`.pdf`) - Portable Document Format (tables will be extracted)
- **Word** (`.docx`, `.doc`) - Microsoft Word documents
- **HTML** (`.html`) - HTML documents with tables
- **Markdown** (`.md`) - Markdown files

## Implementation Details

### Frontend Changes (`components/charts-infographics-generator-interface.tsx`)

1. **Updated Interface**:
   - Changed `csvFile` → `dataFile`
   - Changed `source: "csv"` → `source: "file"`

2. **Updated File Input**:
   - Accept multiple formats: `.csv,.xlsx,.xls,.json,.txt,.pdf,.docx,.doc,.xml,.html,.md`
   - Updated label: "📁 Data File Upload"
   - Updated description: "CSV, Excel, JSON, PDF, TXT, XML and more (up to 10MB)"

3. **File Display**:
   - Shows file type badge (e.g., "XLSX", "JSON")
   - Uses `FileText` icon for all file types
   - Displays file size in MB

### Backend Changes (`app/api/charts-infographics/route.ts`)

1. **File Upload Handling**:
   - Renamed `csvFile` → `dataFile`
   - Updated storage path: `renders/charts/{userId}/data/` (was `/csv/`)
   - Supports all file types with appropriate MIME types

2. **Database Storage**:
   - Field `csv_file_path` now stores any data file type (backward compatible)
   - Metadata includes actual file type information

### Code Interpreter Service (`lib/openai/code-interpreter.ts`)

1. **File Upload**:
   - Detects file extension automatically
   - Maps to appropriate MIME type:
     ```typescript
     'csv': 'text/csv'
     'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
     'json': 'application/json'
     'pdf': 'application/pdf'
     // ... and more
     ```

2. **Format-Specific Instructions**:
   - **CSV**: "Read the data from the uploaded CSV file"
   - **Excel**: "Read the data from the uploaded Excel file. Use pandas to read Excel data."
   - **JSON**: "Parse the JSON structure appropriately"
   - **PDF**: "Extract tabular data from the uploaded PDF file"
   - **XML**: "Parse XML structure to extract data"
   - **TXT**: "Parse the data structure intelligently"

### Prompt Builder (`lib/utils/chart-prompt-builder.ts`)

Updated to handle `dataSource === 'file'` instead of `dataSource === 'csv'`:
```typescript
if (dataSource === 'file') {
  promptParts.push("Read the data from the uploaded file. Detect the file format and parse it appropriately.")
}
```

## User Experience

### Before
- Upload: **CSV files only**
- Label: "📁 CSV File Upload"

### After
- Upload: **CSV, Excel, JSON, PDF, Word, XML, TXT, HTML, Markdown**
- Label: "📁 Data File Upload"
- Description: "CSV, Excel, JSON, PDF, TXT, XML and more (up to 10MB)"
- Badge: Shows file type (e.g., "XLSX", "JSON", "PDF")

## Example Use Cases

### Excel Files (Most Common Business Format)
```
User uploads: quarterly_sales.xlsx
Code Interpreter:
- Reads Excel file using pandas
- Extracts data from active sheet
- Creates chart from data
```

### JSON API Data
```
User uploads: api_response.json
Code Interpreter:
- Parses JSON structure
- Flattens nested data if needed
- Creates chart from parsed data
```

### PDF Reports
```
User uploads: quarterly_report.pdf
Code Interpreter:
- Extracts tables from PDF
- Uses tabula-py or similar libraries
- Creates chart from extracted tables
```

### Plain Text Data
```
User uploads: data.txt (tab-delimited)
Code Interpreter:
- Detects delimiter (tabs, spaces, etc.)
- Parses structured text
- Creates chart from parsed data
```

## Technical Details

### File Size Limit
- **Maximum**: 10MB per file
- Enforced at UI level with user-friendly message

### MIME Type Mapping
All supported formats map to proper MIME types for OpenAI Code Interpreter:
```typescript
const mimeTypes = {
  'csv': 'text/csv',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xls': 'application/vnd.ms-excel',
  'json': 'application/json',
  'txt': 'text/plain',
  'pdf': 'application/pdf',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'doc': 'application/msword',
  'xml': 'application/xml',
  'html': 'text/html',
  'md': 'text/markdown'
}
```

### Intelligent Format Detection
Code Interpreter automatically:
1. Detects file format from extension
2. Uses appropriate parsing library (pandas, json, tabula, etc.)
3. Handles format-specific nuances
4. Extracts tabular data for chart creation

## Benefits

✅ **Excel Support**: Users can upload `.xlsx` files (most common format in business)
✅ **API Data**: Direct upload of JSON API responses
✅ **Report Extraction**: Extract data from PDF reports automatically
✅ **Flexibility**: Multiple input formats for different use cases
✅ **No Conversion**: Users don't need to convert files to CSV first
✅ **Smart Parsing**: Code Interpreter intelligently handles each format

## Backward Compatibility

- ✅ Existing CSV uploads continue to work
- ✅ Database field `csv_file_path` remains unchanged (stores any file type)
- ✅ Storage paths updated but old paths still accessible
- ✅ No breaking changes to API or UI

## Testing Recommendations

Test with various file formats:
1. **CSV**: Standard comma-separated values
2. **Excel**: `.xlsx` with multiple sheets
3. **JSON**: Nested structure with arrays
4. **PDF**: Document with embedded tables
5. **TXT**: Tab-delimited or space-separated
6. **XML**: Structured data with nested elements

## Future Enhancements

Potential future additions:
- Support for Google Sheets URLs
- Support for database export formats (`.sql`, `.db`)
- Support for Parquet files (`.parquet`)
- Support for compressed files (`.zip`, `.gz`)
- Multi-sheet Excel file handling (sheet selection)

