type KieModel = 'veo3' | 'veo3_fast'

interface GenerateVeoParams {
  prompt: string
  imageUrls?: string[]
  model?: KieModel
  generationType?: 'TEXT_2_VIDEO' | 'FIRST_AND_LAST_FRAMES_2_VIDEO' | 'REFERENCE_2_VIDEO'
  aspectRatio?: '16:9' | '9:16' | 'Auto'
  seeds?: number
  callBackUrl?: string
  enableTranslation?: boolean
  watermark?: string
}

export interface KieGenerateResponse {
  code: number
  msg: string
  data?: { taskId: string }
}

export interface KieRecordInfoResponse {
  code: number
  msg: string
  data?: {
    taskId: string
    paramJson?: string
    completeTime?: string
    response?: {
      taskId: string
      resultUrls?: string[]
      originUrls?: string[]
      resolution?: string
    }
    successFlag?: 0 | 1 | 2
    errorCode?: number | null
    errorMessage?: string | null
    createTime?: string
    fallbackFlag?: boolean
  }
}

export interface Kie1080pResponse {
  code: number
  msg: string
  data?: { resultUrl?: string }
}

interface ExtendVeoParams {
  taskId: string
  prompt: string
  seeds?: number
  watermark?: string
  callBackUrl?: string
}

const KIE_API_BASE = process.env.KIE_API_BASE || 'https://api.kie.ai'
const KIE_API_KEY = process.env.KIE_API_KEY

function authHeaders() {
  if (!KIE_API_KEY) throw new Error('Missing KIE_API_KEY')
  return {
    Authorization: `Bearer ${KIE_API_KEY}`,
  }
}

export async function generateVeo(params: GenerateVeoParams): Promise<KieGenerateResponse> {
  const payload = {
    prompt: params.prompt,
    imageUrls: params.imageUrls,
    model: params.model || 'veo3_fast',
    generationType: params.generationType,
    aspectRatio: params.aspectRatio || '16:9',
    seeds: params.seeds,
    callBackUrl: params.callBackUrl,
    enableTranslation: params.enableTranslation ?? true,
    watermark: params.watermark,
  }
  const res = await fetch(`${KIE_API_BASE}/api/v1/veo/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[KIE] generate non-OK', { status: res.status, payload, text })
    throw new Error(`KIE generate failed: HTTP ${res.status}`)
  }
  return (await res.json()) as KieGenerateResponse
}

export async function getRecordInfo(taskId: string): Promise<KieRecordInfoResponse> {
  const url = new URL(`${KIE_API_BASE}/api/v1/veo/record-info`)
  url.searchParams.set('taskId', taskId)
  const res = await fetch(url.toString(), { headers: { ...authHeaders() } })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[KIE] record-info non-OK', { status: res.status, url: url.toString(), text })
    throw new Error(`KIE record-info failed: HTTP ${res.status}`)
  }
  return (await res.json()) as KieRecordInfoResponse
}

export async function get1080p(taskId: string, index?: number): Promise<Kie1080pResponse> {
  const url = new URL(`${KIE_API_BASE}/api/v1/veo/get-1080p-video`)
  url.searchParams.set('taskId', taskId)
  if (typeof index === 'number') url.searchParams.set('index', String(index))
  const res = await fetch(url.toString(), { headers: { ...authHeaders() } })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[KIE] get-1080p non-OK', { status: res.status, url: url.toString(), text })
    throw new Error(`KIE get-1080p failed: HTTP ${res.status}`)
  }
  return (await res.json()) as Kie1080pResponse
}

export async function extendVeo(params: ExtendVeoParams): Promise<KieGenerateResponse> {
  const res = await fetch(`${KIE_API_BASE}/api/v1/veo/extend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({
      taskId: params.taskId,
      prompt: params.prompt,
      seeds: params.seeds,
      watermark: params.watermark,
      callBackUrl: params.callBackUrl,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[KIE] extend non-OK', { status: res.status, payload: { taskId: params.taskId }, text })
    throw new Error(`KIE extend failed: HTTP ${res.status}`)
  }
  return (await res.json()) as KieGenerateResponse
}

export async function pollVeoCompletion(
  taskId: string, 
  maxAttempts = 60, 
  intervalMs = 5000
): Promise<{ videoUrl: string; resolution?: string }> {
  console.log(`[KIE] Starting polling for taskId: ${taskId}`)
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const info = await getRecordInfo(taskId)
      
      if (info.code !== 200 || !info.data) {
        throw new Error(`Record info failed: ${info.msg}`)
      }
      
      const data = info.data
      console.log(`[KIE] Poll attempt ${attempt}/${maxAttempts}, successFlag: ${data.successFlag}`)
      
      // Check completion status
      if (data.successFlag === 1) {
        // Success - try to get video URL
        let videoUrl: string | undefined
        
        // Try 1080p first (better quality)
        try {
          const hd = await get1080p(taskId)
          if (hd.code === 200 && hd.data?.resultUrl) {
            videoUrl = hd.data.resultUrl
            console.log(`[KIE] Got 1080p video URL: ${videoUrl}`)
          }
        } catch (err) {
          console.log(`[KIE] 1080p failed, trying resultUrls: ${(err as Error).message}`)
        }
        
        // Fallback to resultUrls
        if (!videoUrl && data.response?.resultUrls && data.response.resultUrls.length > 0) {
          videoUrl = data.response.resultUrls[0]
          console.log(`[KIE] Using resultUrls video URL: ${videoUrl}`)
        }
        
        if (!videoUrl) {
          throw new Error('No video URL found in response')
        }
        
        return {
          videoUrl,
          resolution: data.response?.resolution
        }
      } else if (data.successFlag === 2) {
        // Failed
        const errorMsg = data.errorMessage || 'Unknown error'
        throw new Error(`Video generation failed: ${errorMsg}`)
      } else if (data.successFlag === 3) {
        // Content policy violation - stop immediately
        console.error(`[KIE] Content policy violation for taskId: ${taskId}`)
        throw new Error(
          'Content Policy Violation: Your prompt or images were flagged by Google\'s content policy. ' +
          'All characters must be clearly fictional. Please try:\n' +
          '1. Using different AI-generated character images\n' +
          '2. Revising your scene description\n' +
          '3. Avoiding real-world sensitive topics (airports, security, etc.)'
        )
      }
      
      // Still generating (successFlag === 0), wait and try again
      if (attempt < maxAttempts) {
        console.log(`[KIE] Still generating, waiting ${intervalMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, intervalMs))
      }
      
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error
      }
      console.log(`[KIE] Poll attempt ${attempt} failed: ${(error as Error).message}`)
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }
  }
  
  throw new Error(`Video generation timed out after ${maxAttempts} attempts`)
}


