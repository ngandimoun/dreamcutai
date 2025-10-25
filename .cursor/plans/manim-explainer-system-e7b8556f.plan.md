<!-- e7b8556f-c11a-495f-a3f2-6f75aa8890b1 e22791c5-23a7-4925-9ce6-f192328b6c24 -->
# Migrate from E2B to Modal Labs

## Overview

Replace unreliable E2B sandbox with Modal Labs for Manim rendering. Modal provides faster setup, better reliability, lower cost, and no timeout issues.

## Benefits of Modal Labs

- No dependency installation timeouts (pre-built container)
- No arbitrary sandbox timeouts
- 50% cheaper than E2B
- $30/month free tier (permanent)
- Simpler setup (no Docker required)
- Built-in caching and optimization

## Implementation Steps

### 1. Add Modal Environment Variables

Update `env.example`:

```bash
# Replace E2B_API_KEY with Modal credentials
MODAL_TOKEN_ID=ak-8TBKsiO63OYBcI0fiMUTzu
MODAL_TOKEN_SECRET=as-EwaXuVISOwNNMqiAEWDV6f
```

### 2. Create Modal Function Definition

**Create `modal_functions/manim_render.py`:**

This Python file defines the Modal function that will run Manim. Key features:

- Pre-installs Manim, FFmpeg, manim-voiceover in the container image
- Accepts code, scene_name, upload_url as inputs
- Renders animation with Manim
- Uploads to Supabase via signed URL
- Returns logs and status
- Includes fallback for voiceover failures (same logic as E2B)
```python
import modal
import subprocess
import requests
import os

# Create Modal app
app = modal.App("manim-explainer")

# Define container image with all dependencies pre-installed
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "sox", "libsox-fmt-all", "portaudio19-dev", "gettext")
    .pip_install(
        "manim==0.18.1",
        "manim-voiceover[openai]",
        "requests"
    )
)

@app.function(
    image=image,
    timeout=1800,  # 30 minutes
    cpu=4.0,
    memory=8192,
)
def render_manim(code: str, scene_name: str, upload_url: str = None):
    """Render Manim animation and optionally upload to Supabase."""
    
    try:
        # Write scene.py
        with open("scene.py", "w") as f:
            f.write(code)
        
        # Try rendering with voiceover
        try:
            result = subprocess.run(
                ["manim", "--disable_caching", "scene.py", scene_name, "-qk", "--format=mp4"],
                capture_output=True,
                text=True,
                timeout=1200  # 20 minutes
            )
            
            if result.returncode != 0:
                raise Exception(f"Manim render failed: {result.stderr}")
            
        except Exception as e:
            # Fallback: try without voiceover
            print(f"Original render failed, trying fallback without voiceover: {e}")
            
            fallback_code = (
                code.replace("VoiceoverScene", "Scene")
                    .replace("from manim_voiceover.services.openai import OpenAIService\n", "")
                    .replace("from manim_voiceover.services.elevenlabs import ElevenLabsService\n", "")
            )
            # Remove voiceover setup and usage
            import re
            fallback_code = re.sub(r'self\.set_speech_service\([^)]+\)\n', '', fallback_code)
            fallback_code = re.sub(r'with self\.voiceover\([^)]+\) as tracker:\s*\n', '', fallback_code)
            fallback_code = re.sub(r'run_time=tracker\.duration', 'run_time=1', fallback_code)
            
            with open("fallback_scene.py", "w") as f:
                f.write(fallback_code)
            
            result = subprocess.run(
                ["manim", "--disable_caching", "fallback_scene.py", scene_name, "-qk", "--format=mp4"],
                capture_output=True,
                text=True,
                timeout=1200
            )
            
            if result.returncode != 0:
                raise Exception(f"Fallback render failed: {result.stderr}")
        
        # Find output file
        output_path = f"media/videos/scene/1080p60/{scene_name}.mp4"
        
        if not os.path.exists(output_path):
            # Try other resolutions
            for path in [
                f"media/videos/scene/720p30/{scene_name}.mp4",
                f"media/videos/fallback_scene/1080p60/{scene_name}.mp4",
                f"media/videos/fallback_scene/720p30/{scene_name}.mp4",
            ]:
                if os.path.exists(path):
                    output_path = path
                    break
        
        # Upload to Supabase if URL provided
        if upload_url:
            with open(output_path, "rb") as f:
                response = requests.put(upload_url, data=f)
                response.raise_for_status()
        
        return {
            "success": True,
            "logs": result.stdout,
            "stderr": result.stderr,
            "output_path": output_path
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "logs": getattr(result, 'stdout', ''),
            "stderr": getattr(result, 'stderr', str(e))
        }
```


### 3. Deploy Modal Function

Run from project root:

```bash
pip install modal
modal deploy modal_functions/manim_render.py
```

This creates a persistent endpoint that can be called via HTTP or Python SDK.

### 4. Replace E2B Setup with Modal Setup

**Create `lib/modal/setup.ts`** (replaces `lib/e2b/setup.ts`):

```typescript
import modal from "@modal-labs/client";

export interface RunManimOptions {
  code: string;
  sceneName: string;
  uploadUrl?: string;
  timeout?: number;
  verbose?: boolean;
}

export async function runManimRender({
  code,
  sceneName,
  uploadUrl,
  timeout = 1800,
  verbose = false,
}: RunManimOptions) {
  console.log("🔹 Calling Modal function...");
  
  try {
    // Call Modal function
    const response = await fetch(
      `https://YOUR_USERNAME--manim-explainer-render-manim.modal.run`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          scene_name: sceneName,
          upload_url: uploadUrl,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Modal function failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (verbose) {
      console.log("STDOUT:", result.logs);
      console.log("STDERR:", result.stderr);
    }

    if (!result.success) {
      throw new Error(result.error || "Render failed");
    }

    console.log("✅ Render completed successfully!");

    return {
      success: true,
      outputUrl: uploadUrl,
      logs: result.logs,
      stderr: result.stderr,
    };
  } catch (err) {
    console.error("❌ Modal error:", err);
    return {
      success: false,
      error: (err as Error).message,
      logs: "",
      stderr: (err as Error).message,
    };
  }
}
```

### 5. Update API Route to Use Modal

**Update `app/api/explainers/generate/route.ts`:**

Change import:

```typescript
// Before
import { runManimRender } from "@/lib/e2b/setup";

// After
import { runManimRender } from "@/lib/modal/setup";
```

No other changes needed - same function signature!

### 6. Update Self-Healing Logic Import

**Update `lib/manim/self-healing.ts`:**

Change import:

```typescript
// Before
import { runManimRender } from "@/lib/e2b/setup";

// After
import { runManimRender } from "@/lib/modal/setup";
```

### 7. Install Modal Client (Optional)

If using Modal's Node.js SDK instead of HTTP:

```bash
npm install @modal-labs/client
```

### 8. Remove E2B Dependencies

**Update `package.json`:**

```bash
npm uninstall @e2b/code-interpreter @e2b/sdk
npm install @modal-labs/client  # Optional, for SDK approach
```

**Update `env.example`:**

Remove:

```
E2B_API_KEY=your_e2b_api_key
```

Add:

```
MODAL_TOKEN_ID=your_modal_token_id
MODAL_TOKEN_SECRET=your_modal_token_secret
```

### 9. Delete Old E2B Files

Remove:

- `lib/e2b/setup.ts`
- All `E2B_*.md` documentation files

### 10. Test End-to-End

1. Deploy Modal function: `modal deploy modal_functions/manim_render.py`
2. Get function URL from Modal dashboard
3. Update `lib/modal/setup.ts` with actual URL
4. Test generation: Submit prompt → Monitor logs → Verify video

## Key Differences from E2B

### What Stays the Same:

- ✅ All Claude prompts (no changes)
- ✅ Self-healing logic (same interface)
- ✅ API routes (same signatures)
- ✅ UI components (no changes)
- ✅ Database schema (no changes)
- ✅ Supabase integration (no changes)

### What Changes:

- ✅ No more E2B timeouts
- ✅ No dependency installation delays
- ✅ Faster cold starts (pre-built image)
- ✅ Better error messages
- ✅ Lower cost (~50% savings)
- ✅ $30/month free tier

## Migration Checklist

- [ ] Create `modal_functions/manim_render.py`
- [ ] Deploy Modal function with `modal deploy`
- [ ] Create `lib/modal/setup.ts` with runManimRender()
- [ ] Update `app/api/explainers/generate/route.ts` import
- [ ] Update `lib/manim/self-healing.ts` import
- [ ] Update `env.example` with Modal credentials
- [ ] Install Modal client: `npm install @modal-labs/client`
- [ ] Remove E2B packages: `npm uninstall @e2b/code-interpreter @e2b/sdk`
- [ ] Delete `lib/e2b/setup.ts`
- [ ] Test complete flow with Modal

### To-dos

- [ ] Create modal_functions/manim_render.py with Manim rendering logic
- [ ] Deploy Modal function and get endpoint URL
- [ ] Create lib/modal/setup.ts to replace lib/e2b/setup.ts
- [ ] Update imports in app/api/explainers/generate/route.ts and lib/manim/self-healing.ts
- [ ] Update env.example with Modal credentials
- [ ] Install Modal client and remove E2B packages
- [ ] Delete lib/e2b/setup.ts and E2B documentation files
- [ ] Test end-to-end flow with Modal rendering