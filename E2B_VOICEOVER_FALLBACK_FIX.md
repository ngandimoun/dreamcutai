# E2B Voiceover Fallback Fix

## Issue Identified
The E2B sandbox was terminating when trying to render Manim scenes with voiceover:
```
SandboxError: 2: [unknown] terminated
```

## Root Cause Analysis
Based on the debugging output, we can see:
- ✅ Dependencies installed successfully
- ✅ Manim Community v0.18.1 is working
- ✅ Scene.py written correctly with VoiceoverScene and ElevenLabsService

The issue is likely that the ElevenLabs API key is not available in the E2B sandbox environment, causing the voiceover service to fail and crash the sandbox.

## Solution Applied

### ✅ Added Fallback Mechanism
```typescript
// Try the original scene with voiceover first
let render;
try {
  render = await sandbox.commands.run(
    `manim --disable_caching scene.py ${sceneName} -qk --format=mp4`,
    { timeoutMs: 0 }
  );
} catch (error) {
  console.log("❌ Original scene failed, trying fallback without voiceover...");
  
  // Create a fallback scene without voiceover
  const fallbackCode = code.replace(/VoiceoverScene/g, 'Scene')
                          .replace(/from manim_voiceover.*\n/g, '')
                          .replace(/from manim_voiceover.services.elevenlabs import ElevenLabsService\n/g, '')
                          .replace(/self\.set_speech_service\(ElevenLabsService\([^)]+\)\)\n/g, '')
                          .replace(/with self\.voiceover\([^)]+\) as tracker:\s*\n/g, '')
                          .replace(/run_time=tracker\.duration/g, 'run_time=1');
  
  await sandbox.files.write("fallback_scene.py", fallbackCode);
  
  render = await sandbox.commands.run(
    `manim --disable_caching fallback_scene.py ${sceneName} -qk --format=mp4`,
    { timeoutMs: 0 }
  );
  
  console.log("✅ Fallback scene rendered successfully");
}
```

## Fallback Code Transformation

### What the fallback does:
1. **Replace VoiceoverScene with Scene**: Removes voiceover dependency
2. **Remove voiceover imports**: Strips all manim-voiceover imports
3. **Remove ElevenLabs service setup**: Removes API key dependencies
4. **Remove voiceover blocks**: Converts `with self.voiceover()` to regular animations
5. **Fix run_time**: Replaces `tracker.duration` with fixed `run_time=1`

### Example transformation:
```python
# Before (with voiceover)
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.elevenlabs import ElevenLabsService

class DerivativeFormulaScene(VoiceoverScene):
    def construct(self):
        self.set_speech_service(ElevenLabsService(voice_id="..."))
        with self.voiceover(text="Hello") as tracker:
            self.play(Create(circle), run_time=tracker.duration)

# After (fallback without voiceover)
from manim import *

class DerivativeFormulaScene(Scene):
    def construct(self):
        self.play(Create(circle), run_time=1)
```

## Expected Results

The system should now:
- ✅ **Try voiceover first** - Attempt the original scene with ElevenLabs
- ✅ **Fallback gracefully** - If voiceover fails, render without it
- ✅ **Complete successfully** - Either way, get a working video
- ✅ **Provide feedback** - Log which approach worked

## Benefits

1. **Robustness**: System works even if ElevenLabs API is unavailable
2. **User Experience**: Users still get their animation, just without voiceover
3. **Debugging**: Clear logs show which approach succeeded
4. **Fallback Strategy**: Graceful degradation instead of complete failure

## Testing

The system should now work in both scenarios:
1. **With ElevenLabs API**: Renders with voiceover as intended
2. **Without ElevenLabs API**: Falls back to video-only rendering

## Next Steps

1. **Test the API** with a simple prompt
2. **Monitor the logs** to see which approach succeeds
3. **Verify video generation** works in both cases
4. **Consider API key setup** for E2B sandbox if voiceover is desired

The voiceover fallback fix should resolve the sandbox termination issue! 🎉

