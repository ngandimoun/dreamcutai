// Suno API TypeScript types based on official documentation

export type SunoModel = 'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5'
export type SunoModelRestricted = 'V4_5PLUS' | 'V5'
export type VocalGender = 'm' | 'f' | 'auto'
export type CallbackType = 'text' | 'first' | 'complete' | 'error'
export type TaskStatus = 'GENERATING' | 'SUCCESS' | 'FAILED' | 'PENDING'

// Base parameters shared across all endpoints
export interface BaseSunoParams {
  model: SunoModel
  callBackUrl: string
  negativeTags?: string
  vocalGender?: VocalGender
  styleWeight?: number
  weirdnessConstraint?: number
  audioWeight?: number
}

/**
 * Generate Music Parameters
 * 
 * @param prompt - The core content for music generation
 *   - In Simple Mode (customMode: false): Description of desired music (max 500 chars). Suno auto-generates lyrics.
 *   - In Custom Mode with vocals (customMode: true, instrumental: false): Exact lyrics to sing (max 3000-5000 chars)
 *   - In Custom Mode instrumental (customMode: true, instrumental: true): Not required/used
 * 
 * @param customMode - Enable advanced control mode
 *   - false: Simple mode - only prompt required, Suno handles everything else
 *   - true: Custom mode - requires style and title, prompt used as exact lyrics if not instrumental
 * 
 * @param instrumental - Whether to generate instrumental-only music
 *   - false: Include vocals (prompt becomes lyrics in custom mode)
 *   - true: Instrumental only (prompt not required in custom mode)
 * 
 * @param style - Musical style/genre (required in Custom Mode only)
 *   - Examples: "Jazz", "Classical", "Electronic", "Pop Rock"
 *   - Max length: 200 chars (V3.5/V4) or 1000 chars (V4.5+)
 *   - Should be empty in Simple Mode
 * 
 * @param title - Track title (required in Custom Mode only)
 *   - Max length: 80 chars (V3.5/V4) or 100 chars (V4.5+)
 *   - Should be empty in Simple Mode
 */
export interface GenerateMusicParams extends BaseSunoParams {
  prompt: string
  customMode: boolean
  instrumental: boolean
  style?: string
  title?: string
}

// Upload and Cover Audio Parameters
export interface UploadCoverParams extends BaseSunoParams {
  uploadUrl: string
  prompt: string
  customMode: boolean
  instrumental: boolean
  style?: string
  title?: string
}

// Extend Music Parameters (for existing audio)
export interface ExtendMusicParams extends BaseSunoParams {
  audioId: string
  defaultParamFlag: boolean
  prompt?: string
  style?: string
  title?: string
  continueAt?: number
  instrumental?: boolean
}

// Upload and Extend Audio Parameters
export interface UploadExtendParams extends BaseSunoParams {
  uploadUrl: string
  defaultParamFlag: boolean
  instrumental: boolean
  prompt?: string
  style?: string
  title?: string
  continueAt?: number
}

// Add Instrumental Parameters
export interface AddInstrumentalParams {
  uploadUrl: string
  title: string
  negativeTags: string
  tags: string  // Note: "tags" not "style"
  callBackUrl: string
  vocalGender?: VocalGender
  styleWeight?: number
  weirdnessConstraint?: number
  audioWeight?: number
  model: 'V4_5PLUS' | 'V5'  // Restricted to these models only
}

// Add Vocals Parameters
export interface AddVocalsParams {
  uploadUrl: string
  prompt: string
  title: string
  negativeTags: string
  style: string  // Note: "style" not "tags"
  callBackUrl: string
  vocalGender?: VocalGender
  styleWeight?: number
  weirdnessConstraint?: number
  audioWeight?: number
  model: 'V4_5PLUS' | 'V5'  // Restricted to these models only
}

// Lyrics Generation Parameters
export interface GenerateLyricsParams {
  prompt: string  // Max 200 words
  callBackUrl: string
}

// Lyrics Data Structure
export interface LyricsData {
  text: string
  title: string
  status: 'complete' | 'failed'
  errorMessage: string
}

// Lyrics Callback Data
export interface LyricsCallbackData {
  callbackType: 'complete' | 'error'
  taskId: string
  data: LyricsData[] | null
}

// Lyrics Task Status
export interface LyricsTaskStatus {
  taskId: string
  param: string
  response?: {
    taskId: string
    data: LyricsData[]
  }
  status: 'PENDING' | 'SUCCESS' | 'CREATE_TASK_FAILED' | 'GENERATE_LYRICS_FAILED' | 'CALLBACK_EXCEPTION' | 'SENSITIVE_WORD_ERROR'
  type: 'LYRICS'
  errorCode?: number
  errorMessage?: string
}

// Audio Separation Parameters
export interface SeparateVocalParams {
  uploadUrl: string
  callBackUrl: string
  type: 'separate_vocal' | 'split_stem'
}

// Vocal Removal Info (separation results)
export interface VocalRemovalInfo {
  origin_url?: string
  instrumental_url?: string
  vocal_url?: string
  backing_vocals_url?: string
  drums_url?: string
  bass_url?: string
  guitar_url?: string
  keyboard_url?: string
  percussion_url?: string
  strings_url?: string
  synth_url?: string
  fx_url?: string
  brass_url?: string
  woodwinds_url?: string
}

// Vocal Separation Callback
export interface VocalSeparationCallback {
  task_id: string
  vocal_removal_info: VocalRemovalInfo | null
}

// Vocal Separation Status
export interface VocalSeparationStatus {
  taskId: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  response?: {
    task_id: string
    vocal_removal_info: VocalRemovalInfo
  }
  errorMessage?: string
}

// Cover Details Response
export interface CoverDetailsResponse {
  taskId: string
  parentTaskId: string
  callbackUrl: string
  completeTime?: string
  response?: {
    images: string[]
  }
  successFlag: 0 | 1 | 2 | 3  // 0-Pending, 1-Success, 2-Generating, 3-Failed
  createTime: string
  errorCode: number
  errorMessage: string
}

// Music Video Generation Parameters
export interface CreateMusicVideoParams {
  taskId: string  // The task ID from music generation
  audioId: string  // The specific track ID
  callBackUrl: string
  author?: string  // Max 50 characters
  domainName?: string  // Max 50 characters (watermark)
}

// Music Video Callback Data
export interface MusicVideoCallbackData {
  code: number
  msg: string
  data: {
    task_id: string
    video_url: string | null
  }
}

// Music Video Status Response
export interface MusicVideoStatus {
  taskId: string
  musicId: string
  callbackUrl: string
  musicIndex: number
  completeTime?: string
  response?: {
    videoUrl: string
  }
  successFlag: 'PENDING' | 'SUCCESS' | 'CREATE_TASK_FAILED' | 'GENERATE_MP4_FAILED' | 'CALLBACK_EXCEPTION'
  createTime: string
  errorCode?: number
  errorMessage?: string
}

// Suno API Response Types
export interface SunoApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export interface SunoTaskResponse {
  taskId: string
}

export interface SunoAudioData {
  id: string
  audio_url: string
  source_audio_url?: string
  stream_audio_url?: string
  source_stream_audio_url?: string
  image_url?: string
  source_image_url?: string
  prompt: string
  model_name: string
  title: string
  tags: string
  createTime: string
  duration: number
}

export interface SunoCallbackData {
  callbackType: CallbackType
  task_id: string
  data: SunoAudioData[] | null
}

export interface SunoTaskStatus {
  taskId: string
  status: TaskStatus
  response?: {
    data: SunoAudioData[]
  }
  errorMessage?: string
}

// Error types
export class SunoApiError extends Error {
  code: number
  details?: any
  
  constructor(code: number, message: string, details?: any) {
    super(message)
    this.name = 'SunoApiError'
    this.code = code
    this.details = details
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SunoApiError)
    }
  }
}

// Character limits by model
export const SUNO_CHARACTER_LIMITS = {
  V3_5: {
    title: 80,
    prompt: 3000,
    style: 200,
    promptSimple: 500
  },
  V4: {
    title: 80,
    prompt: 3000,
    style: 200,
    promptSimple: 500
  },
  V4_5: {
    title: 100,
    prompt: 5000,
    style: 1000,
    promptSimple: 500
  },
  V4_5PLUS: {
    title: 100,
    prompt: 5000,
    style: 1000,
    promptSimple: 500
  },
  V5: {
    title: 100,
    prompt: 5000,
    style: 1000,
    promptSimple: 500
  }
} as const

// Model configurations
export const SUNO_MODEL_CONFIGS = {
  V3_5: { 
    name: "V3.5", 
    badge: "", 
    duration: "Up to 4 min", 
    description: "Solid arrangements with creative diversity" 
  },
  V4: { 
    name: "V4", 
    badge: "", 
    duration: "Up to 4 min", 
    description: "Best audio quality with refined song structure" 
  },
  V4_5: { 
    name: "V4.5", 
    badge: "ENHANCED", 
    duration: "Up to 8 min", 
    description: "Superior genre blending with smarter prompts" 
  },
  V4_5PLUS: { 
    name: "V4.5+", 
    badge: "PLUS", 
    duration: "Up to 8 min", 
    description: "Richer sound, new ways to create" 
  },
  V5: { 
    name: "V5", 
    badge: "NEW", 
    duration: "Up to 8 min", 
    description: "Superior musical expression, faster generation" 
  }
} as const

// Status codes from Suno API
export const SUNO_STATUS_CODES = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  PAYLOAD_TOO_LARGE: 413,
  INSUFFICIENT_CREDITS: 429,
  RATE_LIMIT: 430,
  MAINTENANCE: 455,
  SERVER_ERROR: 500
} as const
