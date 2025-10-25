// Types describing the watermark model's inputs (mirroring subtitle pattern)
export type WatermarkModelInputs = {
  // Model inputs
  video_file_input: File | string; // required
  watermark_text: string; // default: "DREAMCUT.AI"
  font_size: number; // default: 40, range: 1-500
}

// Sensible defaults reflecting the model version's published defaults
export const DEFAULT_WATERMARK_INPUTS: Readonly<WatermarkModelInputs> = {
  video_file_input: "" as unknown as File, // fill at runtime
  watermark_text: "DREAMCUT.AI",
  font_size: 40
} as const;

// Form sections for rendering
export const WATERMARK_FORM_SECTIONS = [
  {
    title: "Upload",
    fields: ["video_file_input"]
  },
  {
    title: "Watermark Settings",
    fields: ["watermark_text", "font_size"]
  }
] as const;

// Validation constraints
export const WATERMARK_CONSTRAINTS = {
  FONT_SIZE_MIN: 1,
  FONT_SIZE_MAX: 500,
  FONT_SIZE_DEFAULT: 40,
  WATERMARK_TEXT_MAX_LENGTH: 100,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500
} as const;

// Legacy types for backward compatibility
export interface WatermarkInputs {
  // Video input
  video: string // URL or file path
  video_file?: File // For file uploads
  
  // Watermark settings
  watermark: string // Watermark text
  size: number // Font size (1-500)
  
  // Optional settings
  title?: string
  description?: string
  save_to_supabase?: boolean
  supabase_bucket?: string
  supabase_path_prefix?: string
}

export interface WatermarkProject {
  id: string
  user_id: string
  title: string
  description: string
  video_url: string
  watermark_text: string
  font_size: number
  output_video_url?: string
  status: 'draft' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  metadata?: {
    videoFile?: string
    watermarkText?: string
    fontSize?: number
    createdAt?: string
    processingTime?: number
    errorMessage?: string
  }
  content?: WatermarkInputs
}

export interface WatermarkGenerationResult {
  success: boolean
  projectId?: string
  outputVideoUrl?: string
  error?: string
  status?: string
}

// Replicate API response structure
export interface ReplicateWatermarkResponse {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string
  error?: string
  logs?: string
  metrics?: {
    predict_time?: number
  }
}

// Form validation schema
export interface WatermarkFormData {
  video_source: 'upload' | 'library'
  video_file?: File
  video_url: string
  watermark_text: string
  font_size: number
}

// Default values
export const DEFAULT_WATERMARK_VALUES: Partial<WatermarkFormData> = {
  video_source: 'upload',
  video_url: '',
  watermark_text: 'DREAMCUT.AI',
  font_size: 40
}
