# Bug Analysis & Error Handling System

## Overview

This system provides comprehensive production error handling with user-friendly messages, automatic bug reporting, and continuous improvement through bug pattern analysis.

## Features

### 1. **User-Friendly Error Messages**
- Maps technical Manim errors to helpful user messages
- Provides actionable suggestions for fixing issues
- Categorizes errors by type (math, text, animation, api, timeout, memory)
- Severity levels: critical, warning, info

### 2. **Automatic Bug Reporting**
- Logs all rendering failures to Supabase
- Captures context: user prompt, generated code, error details
- Stores metadata: duration, style, resolution, etc.
- Privacy-aware: users can only see their own bug reports

### 3. **Bug Pattern Analysis**
- Analyzes bugs to identify recurring patterns
- Generates suggested fixes based on frequency
- Provides insights for system improvement
- Helps prioritize fallback fix development

## Usage

### For Users

When an animation fails to render, users see:
```
❌ Chart type not supported in Manim 0.18.1
💡 Try using basic shapes (Circle, Rectangle) to create custom charts
```

Instead of:
```
NameError: name 'PieChart' is not defined at line 42
```

### For Developers

#### Running Bug Analysis

```bash
npm run analyze-bugs
```

This will:
1. Fetch all unresolved bugs from the last 30 days
2. Group them by error patterns
3. Calculate frequency of each pattern
4. Generate suggested fixes
5. Provide code snippets for new fallback additions

Example output:
```
╔══════════════════════════════════════════════════╗
║     BUG PATTERN ANALYSIS REPORT                  ║
╚══════════════════════════════════════════════════╝

📊 Total bugs analyzed: 45
🔍 Unique patterns found: 12

═══════════════════════════════════════════════════

TOP 10 MOST FREQUENT ERROR PATTERNS:

1. Pattern: NameError: name 'PieChart' is not defined
   Category: api
   Frequency: 15 occurrences
   Suggested Fix: Replace or import PieChart, or use alternative Manim class
   ─────────────────────────────────────────────

2. Pattern: AttributeError: 'Camera' object has no attribute 'frame'
   Category: api
   Frequency: 8 occurrences
   Suggested Fix: Remove camera.frame usage, not available in Manim 0.18.1
   ─────────────────────────────────────────────
```

#### Implementing Suggested Fixes

The script provides copy-paste ready code for `modal_functions/manim_render.py`:

```python
# Add to the fallback code cleaning loop:

# Fix: NameError: name 'PieChart' is not defined
if 'PieChart' in line:
    # Replace or import PieChart, or use alternative Manim class
    line = line.replace('PieChart', 'Circle')
    print("⚠️ Fixed: NameError: name 'PieChart'")
```

### Database Setup

Run the migration to create the `bug_reports` table:

```sql
-- Located in: supabase/migrations/20250109_create_bug_reports_table.sql
-- Run via Supabase dashboard or CLI
```

Table structure:
- `id`: UUID primary key
- `user_prompt`: Original user request
- `generated_code`: AI-generated Manim code
- `technical_error`: Technical error message
- `error_category`: Category (math, text, animation, api, timeout, memory)
- `error_severity`: Severity (critical, warning, info)
- `user_id`: User who encountered the error
- `attempt_number`: Retry attempt number
- `metadata`: Additional context (JSONB)
- `resolved`: Whether the bug has been fixed
- `resolution_notes`: Notes about the fix

## Architecture

### Error Flow

```
User Request
    ↓
GPT-5 Code Generation
    ↓
Primary Render Attempt
    ↓ (fails)
Fallback Render Attempt
    ↓ (fails)
Error Processing
    ↓
┌─────────────────────────────────────┐
│ 1. Map to User-Friendly Error      │
│ 2. Report Bug to Supabase          │
│ 3. Update Database with Friendly   │
│ 4. Return to User                  │
└─────────────────────────────────────┘
```

### Files

- **`lib/manim/error-messages.ts`**: Error mapping definitions
- **`lib/manim/bug-reporter.ts`**: Bug logging to Supabase
- **`components/error-display.tsx`**: UI component for errors
- **`scripts/analyze-bugs.ts`**: Bug pattern analysis script
- **`app/api/explainers/generate/route.ts`**: Integration point

## Error Categories

### Math
- LaTeX rendering issues
- Formula syntax errors
- Mathematical symbol problems

### Text
- UTF-8 encoding issues
- Font problems
- Text rendering failures

### Animation
- No animations executed
- Static image instead of video
- Animation timing issues

### API
- Undefined classes (PieChart, BarChart, etc.)
- Deprecated API calls (camera.frame, etc.)
- Type mismatches (VGroup vs Group)

### Timeout
- Animations too complex
- Rendering took too long

### Memory
- Too many objects
- Resource exhaustion

## Best Practices

### 1. Regular Analysis
Run `npm run analyze-bugs` weekly to identify patterns

### 2. Implement High-Frequency Fixes
Prioritize fixes for bugs with frequency ≥ 3

### 3. Mark Bugs as Resolved
Update the database when fixes are deployed:
```sql
UPDATE bug_reports
SET resolved = true,
    resolution_notes = 'Added fallback fix in manim_render.py'
WHERE error_category = 'api'
  AND technical_error LIKE '%PieChart%';
```

### 4. Monitor Trends
Track error categories over time to identify systemic issues

## Future Enhancements

- [ ] Automated fallback generation from bug patterns
- [ ] Machine learning for error prediction
- [ ] Real-time alerting for critical error spikes
- [ ] User feedback on error message helpfulness
- [ ] A/B testing of suggested fixes

## Support

For questions or issues with the bug analysis system:
1. Check the bug_reports table in Supabase
2. Run the analysis script for insights
3. Review recent error patterns
4. Update fallback fixes based on findings


