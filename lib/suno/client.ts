import {
  SunoApiResponse,
  SunoTaskResponse,
  SunoTaskStatus,
  GenerateMusicParams,
  UploadCoverParams,
  ExtendMusicParams,
  UploadExtendParams,
  AddInstrumentalParams,
  AddVocalsParams,
  GenerateLyricsParams,
  LyricsTaskStatus,
  SeparateVocalParams,
  VocalSeparationStatus,
  CoverDetailsResponse,
  CreateMusicVideoParams,
  MusicVideoStatus,
  SunoApiError,
  SUNO_STATUS_CODES
} from './types'

export class SunoClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = 'https://api.sunoapi.org/api/v1'
    this.apiKey = process.env.SUNO_API_KEY || ''
    
    if (!this.apiKey) {
      throw new Error('SUNO_API_KEY environment variable is required')
    }
  }

  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' = 'POST', 
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    }

    const config: RequestInit = {
      method,
      headers
    }

    if (body && method === 'POST') {
      config.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json() as SunoApiResponse<T>

      if (!response.ok || data.code !== SUNO_STATUS_CODES.SUCCESS) {
        throw new SunoApiError(
          data.code || response.status,
          data.msg || `HTTP ${response.status}`,
          data
        )
      }

      return data.data
    } catch (error) {
      if (error instanceof SunoApiError) {
        throw error
      }
      
      // Handle network or other errors
      throw new SunoApiError(
        500,
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      )
    }
  }

  /**
   * Generate music from text description
   * POST /api/v1/generate
   */
  async generateMusic(params: GenerateMusicParams): Promise<string> {
    const response = await this.makeRequest<SunoTaskResponse>('/generate', 'POST', params)
    return response.taskId
  }

  /**
   * Upload and cover audio with new style
   * POST /api/v1/generate/upload-cover
   */
  async uploadAndCover(params: UploadCoverParams): Promise<string> {
    const response = await this.makeRequest<SunoTaskResponse>('/generate/upload-cover', 'POST', params)
    return response.taskId
  }

  /**
   * Extend existing music track
   * POST /api/v1/generate/extend
   */
  async extendMusic(params: ExtendMusicParams): Promise<string> {
    const response = await this.makeRequest<SunoTaskResponse>('/generate/extend', 'POST', params)
    return response.taskId
  }

  /**
   * Upload and extend audio track
   * POST /api/v1/generate/upload-extend
   */
  async uploadAndExtend(params: UploadExtendParams): Promise<string> {
    const response = await this.makeRequest<SunoTaskResponse>('/generate/upload-extend', 'POST', params)
    return response.taskId
  }

  /**
   * Add instrumental to uploaded audio
   * POST /api/v1/generate/add-instrumental
   */
  async addInstrumental(params: AddInstrumentalParams): Promise<string> {
    const response = await this.makeRequest<SunoTaskResponse>('/generate/add-instrumental', 'POST', params)
    return response.taskId
  }

  /**
   * Add vocals to uploaded audio
   * POST /api/v1/generate/add-vocals
   */
  async addVocals(params: AddVocalsParams): Promise<string> {
    const response = await this.makeRequest<SunoTaskResponse>('/generate/add-vocals', 'POST', params)
    return response.taskId
  }

  /**
   * Generate lyrics from text description
   * POST /api/v1/lyrics
   */
  async generateLyrics(params: GenerateLyricsParams): Promise<string> {
    const response = await this.makeRequest<SunoTaskResponse>('/lyrics', 'POST', params)
    return response.taskId
  }

  /**
   * Get lyrics generation status and results
   * GET /api/v1/lyrics/record-info?taskId={taskId}
   */
  async getLyricsStatus(taskId: string): Promise<LyricsTaskStatus> {
    const response = await this.makeRequest<LyricsTaskStatus>(`/lyrics/record-info?taskId=${taskId}`, 'GET')
    return response
  }

  /**
   * Separate audio into vocals and instrumental or individual stems
   * POST /api/v1/vocal-removal
   */
  async separateAudio(params: SeparateVocalParams): Promise<string> {
    const response = await this.makeRequest<SunoTaskResponse>('/vocal-removal', 'POST', params)
    return response.taskId
  }

  /**
   * Get audio separation status and results
   * GET /api/v1/vocal-removal/record-info?taskId={taskId}
   */
  async getSeparationStatus(taskId: string): Promise<VocalSeparationStatus> {
    const response = await this.makeRequest<VocalSeparationStatus>(`/vocal-removal/record-info?taskId=${taskId}`, 'GET')
    return response
  }

  /**
   * Get music cover generation details
   * GET /api/v1/suno/cover/record-info?taskId={taskId}
   */
  async getCoverDetails(taskId: string): Promise<CoverDetailsResponse> {
    const response = await this.makeRequest<CoverDetailsResponse>(`/suno/cover/record-info?taskId=${taskId}`, 'GET')
    return response
  }

  /**
   * Generate MP4 video for a music track
   * POST /api/v1/mp4/generate
   */
  async createMusicVideo(params: CreateMusicVideoParams): Promise<string> {
    const response = await this.makeRequest<SunoTaskResponse>('/mp4/generate', 'POST', params)
    return response.taskId
  }

  /**
   * Get music video generation status
   * GET /api/v1/mp4/record-info?taskId={taskId}
   */
  async getMusicVideoStatus(taskId: string): Promise<MusicVideoStatus> {
    const response = await this.makeRequest<MusicVideoStatus>(`/mp4/record-info?taskId=${taskId}`, 'GET')
    return response
  }

  /**
   * Get task status and results
   * GET /api/v1/generate/record-info?taskId={taskId}
   */
  async getTaskStatus(taskId: string): Promise<SunoTaskStatus> {
    const response = await this.makeRequest<SunoTaskStatus>(`/generate/record-info?taskId=${taskId}`, 'GET')
    return response
  }

  /**
   * Check if API key is valid by making a test request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // Try to get credits as a simple validation
      await this.getRemainingCredits()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get remaining credits
   * GET /api/v1/get-credits
   */
  async getRemainingCredits(): Promise<number> {
    const response = await this.makeRequest<{ credits: number }>('/get-credits', 'GET')
    return response.credits
  }
}


// Export singleton instance
export const sunoClient = new SunoClient()
