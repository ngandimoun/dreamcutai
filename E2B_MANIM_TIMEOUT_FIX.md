# E2B Manim Timeout Fix

## Issue Identified
The Manim rendering was timing out with the error:
```
[deadline_exceeded] the operation timed out: This error is likely due to exceeding 'timeoutMs' — the total time a long running request (like command execution or directory watch) can be active. It can be modified by passing 'timeoutMs' when making the request. Use '0' to disable the timeout.
```

## Root Cause
The E2B code-interpreter SDK has a default timeout that's too short for Manim rendering operations, which can take several minutes to complete.

## Solution Applied

### ✅ Added timeout configuration to Manim command
```typescript
// Before (default timeout - too short)
const render = await sandbox.commands.run(
  `python3 -m manim --disable_caching scene.py ${sceneName} -qk --format=mp4`
);

// After (disabled timeout for long-running renders)
const render = await sandbox.commands.run(
  `python3 -m manim --disable_caching scene.py ${sceneName} -qk --format=mp4`,
  { timeoutMs: 0 } // Disable timeout for long-running Manim renders
);
```

### ✅ Added timeout configuration to upload command
```typescript
// Before (default timeout)
await sandbox.commands.run(uploadScript);

// After (5 minutes for upload)
await sandbox.commands.run(uploadScript, { timeoutMs: 300000 }); // 5 minutes for upload
```

## E2B Timeout Configuration

### Key Insights:
- **Default Timeout**: E2B code-interpreter has a default timeout that's too short for Manim
- **Manim Rendering**: Can take 2-10 minutes depending on complexity
- **Timeout Options**: 
  - `timeoutMs: 0` - Disable timeout completely
  - `timeoutMs: 300000` - 5 minutes (300,000 ms)
  - `timeoutMs: 600000` - 10 minutes (600,000 ms)

### Command Timeouts:
```typescript
// System package installation (5 minutes)
await sandbox.commands.run(installCommand, { timeoutMs: 300000 });

// Manim rendering (no timeout - can take 10+ minutes)
await sandbox.commands.run(manimCommand, { timeoutMs: 0 });

// File upload (5 minutes)
await sandbox.commands.run(uploadCommand, { timeoutMs: 300000 });
```

## Expected Results

The system should now:
- ✅ **Create E2B sandbox** successfully
- ✅ **Install dependencies** with proper sudo privileges
- ✅ **Render Manim animations** without timeout errors
- ✅ **Upload videos** to Supabase Storage
- ✅ **Complete the full generation flow**

## Testing

The system should now work without the timeout errors. The sandbox creation should succeed and proceed to:
1. Install system dependencies with sudo
2. Install Python packages (Manim, manim-voiceover)
3. Render the Manim animation (no timeout)
4. Upload the video (5-minute timeout)

## Next Steps

1. **Test the API** with a simple prompt
2. **Monitor the logs** to see if Manim rendering completes
3. **Check if video upload** succeeds
4. **Verify the complete flow** works end-to-end

The E2B Manim timeout issue should now be resolved! 🎉

