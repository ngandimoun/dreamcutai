# Charts & Infographics: Data File Execution Fix

## Problem
When users uploaded data files (Excel, JSON, CSV), the chart generation failed with:
```
❌ Modal chart execution failed: [Errno 2] No such file or directory: '/mnt/data/sales_data.xlsx'
```

## Root Cause
**Two-Phase Architecture Issue:**
1. **Phase 1:** Code Interpreter receives file and generates Python code like:
   ```python
   df = pd.read_excel('/mnt/data/sales_data.xlsx')  # File path from Code Interpreter
   ```
2. **Phase 2:** Modal tries to execute this code → **FAILS** because file doesn't exist in Modal environment

## Solution: Self-Contained Code Generation

**Updated Code Interpreter prompt** to instruct it to generate **self-contained Python code** with embedded data instead of file references.

### Key Changes

**File:** `lib/utils/chart-prompt-builder.ts` - `buildCodeInterpreterPrompt()` function

**Added explicit instructions:**
```
## CRITICAL: Self-Contained Code Requirement
1. Read the uploaded file and extract ALL data
2. Embed the extracted data directly in your code as Python variables (dict, list, etc.)
3. DO NOT include file reading functions (pd.read_excel, pd.read_csv, etc.) in the final code
4. The code must work standalone without any external files

Example of CORRECT approach:
data = {'Product': ['A', 'B', 'C'], 'Sales': [100, 200, 150]}
df = pd.DataFrame(data)

Example of WRONG approach (will fail):
df = pd.read_excel('/mnt/data/file.xlsx')
```

### How It Works Now

**Before (Broken):**
```python
# Code Interpreter generates:
df = pd.read_excel('/mnt/data/sales_data.xlsx')  # ❌ File doesn't exist in Modal
plt.bar(df['Product'], df['Sales'])
```

**After (Fixed):**
```python
# Code Interpreter generates:
data = {'Product': ['A', 'B', 'C'], 'Sales': [100, 200, 150]}  # ✅ Embedded data
df = pd.DataFrame(data)
plt.bar(df['Product'], df['Sales'])
```

## Benefits

✅ **Fixes File Path Errors** - No more "file not found" errors  
✅ **Self-Contained Code** - Modal can execute without external dependencies  
✅ **Portable** - Code works in any environment  
✅ **Simple Fix** - Only prompt changes, no architecture changes  
✅ **Robust** - No file transfer complexity between environments  

## Technical Details

### Code Interpreter Process
1. Receives uploaded file (Excel, JSON, CSV, etc.)
2. Reads and analyzes the data
3. **Extracts all data and embeds it as Python variables**
4. Generates chart code using embedded data
5. Returns self-contained Python code

### Modal Execution
1. Receives self-contained Python code
2. Executes code with embedded data
3. Generates chart image
4. Returns chart buffer

## Testing

The fix resolves:
- ✅ Excel file uploads (.xlsx, .xls)
- ✅ JSON file uploads (.json)
- ✅ CSV file uploads (.csv)
- ✅ All other supported data formats
- ✅ Modal execution without file dependencies

## Related Files

- `lib/utils/chart-prompt-builder.ts` - Updated prompt instructions
- `app/api/charts-infographics/route.ts` - API route (unchanged)
- `lib/modal/chart-generation.ts` - Modal execution (unchanged)

## Summary

This fix ensures that **Code Interpreter generates completely self-contained Python code** that Modal can execute without needing access to any external files. The data is embedded directly in the code, making it portable and robust across different execution environments.
