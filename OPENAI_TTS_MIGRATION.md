# OpenAI TTS Migration

## Overview
Migrated from ElevenLabs TTS to OpenAI TTS service for better reliability and easier setup.

## Changes Made

### 1. ✅ Updated Dependencies
```typescript
// Before (ElevenLabs)
pip3 install --upgrade "manim-voiceover[elevenlabs]" manim==0.18.1

// After (OpenAI)
pip3 install --upgrade "manim-voiceover[openai]" manim==0.18.1
```

### 2. ✅ Updated Voice Mapping
```typescript
// Before (ElevenLabs voice IDs)
export const ELEVENLABS_VOICE_MAP: Record<string, string> = {
  'educational': 'pNInz6obpgDQGcFmaJgB', // Adam - Professional, clear
  'narrative': 'EXAVITQu4vr4xnSDxMaL',   // Bella - Story-telling
  'casual': 'VR6AewLTigWG4xSOukaG',      // Arnold - Conversational
  // ...
};

// After (OpenAI voice names)
export const OPENAI_VOICE_MAP: Record<string, string> = {
  'educational': 'fable',     // Professional, clear
  'narrative': 'onyx',        // Story-telling
  'casual': 'nova',           // Conversational
  'calm': 'shimmer',          // Calm and soothing
  'energetic': 'echo',        // Energetic and dynamic
  'professional': 'fable',    // Professional, clear
};
```

### 3. ✅ Updated System Prompts
```typescript
// Before (ElevenLabs)
- Import: from manim_voiceover.services.elevenlabs import ElevenLabsService
- Set service: self.set_speech_service(ElevenLabsService(voice_id="${voiceId}"))

// After (OpenAI)
- Import: from manim_voiceover.services.openai import OpenAIService
- Set service: self.set_speech_service(OpenAIService(voice="${voiceName}", model="tts-1-hd"))
```

### 4. ✅ Updated Fallback Code
```typescript
// Before (ElevenLabs fallback)
.replace(/from manim_voiceover.services.elevenlabs import ElevenLabsService\n/g, '')
.replace(/self\.set_speech_service\(ElevenLabsService\([^)]+\)\)\n/g, '')

// After (OpenAI fallback)
.replace(/from manim_voiceover.services.openai import OpenAIService\n/g, '')
.replace(/from manim_voiceover.services.elevenlabs import ElevenLabsService\n/g, '')
.replace(/self\.set_speech_service\(OpenAIService\([^)]+\)\)\n/g, '')
.replace(/self\.set_speech_service\(ElevenLabsService\([^)]+\)\)\n/g, '')
```

### 5. ✅ Updated Environment Variables
```bash
# Before
OPENAI_API_KEY=your_openai_api_key
E2B_API_KEY=your_e2b_api_key
ELEVEN_API_KEY=your_elevenlabs_api_key

# After
OPENAI_API_KEY=your_openai_api_key
E2B_API_KEY=your_e2b_api_key
```

## OpenAI TTS Configuration

### Available Voices:
- **fable**: Professional, clear (educational, professional)
- **onyx**: Story-telling (narrative)
- **nova**: Conversational (casual)
- **shimmer**: Calm and soothing (calm)
- **echo**: Energetic and dynamic (energetic)

### Model Options:
- **tts-1**: Standard quality, faster
- **tts-1-hd**: High quality, slower (recommended)

### Example Generated Code:
```python
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.openai import OpenAIService

class DerivativeFormulaScene(VoiceoverScene):
    def construct(self):
        self.set_speech_service(
            OpenAIService(
                voice="fable",
                model="tts-1-hd",
            )
        )

        with self.voiceover(text="This is a derivative formula.") as tracker:
            self.play(Create(formula), run_time=tracker.duration)
```

## Benefits of OpenAI TTS

### 1. **Better Reliability**
- More stable API than ElevenLabs
- Better error handling
- Consistent performance

### 2. **Easier Setup**
- Single API key (OPENAI_API_KEY)
- No need for separate ElevenLabs account
- Better documentation

### 3. **Cost Effective**
- Competitive pricing
- Pay-per-use model
- No monthly subscriptions

### 4. **Better Integration**
- Same API key as code generation
- Unified OpenAI ecosystem
- Better support

## Expected Results

The system should now:
- ✅ **Use OpenAI TTS** instead of ElevenLabs
- ✅ **Generate better voiceover code** with OpenAIService
- ✅ **Have more reliable TTS** with fewer API issues
- ✅ **Fallback gracefully** if TTS fails
- ✅ **Use single API key** for both code generation and TTS

## Testing

The system should now work more reliably with:
1. ✅ OpenAI TTS for voiceover generation
2. ✅ Fallback to video-only if TTS fails
3. ✅ Better error handling and debugging
4. ✅ More stable API calls

The OpenAI TTS migration should resolve the voiceover reliability issues! 🎉

