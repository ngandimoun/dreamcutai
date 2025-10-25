// Health Check Types

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'
export type IssueSeverity = 'critical' | 'warning' | 'info'
export type IssueCategory = 
  | 'database' 
  | 'storage' 
  | 'integration' 
  | 'data_consistency'
  | 'performance'

export interface HealthIssue {
  severity: IssueSeverity
  category: IssueCategory
  message: string
  autoHealable: boolean
  metadata?: Record<string, unknown>
}

export interface DatabaseHealth {
  status: HealthStatus
  tables: number
  expectedTables: number
  missingTables: string[]
  rlsEnabled: boolean
  issues: HealthIssue[]
}

export interface StorageHealth {
  status: HealthStatus
  bucket: string
  folders: number
  expectedFolders: number
  missingFolders: string[]
  totalFiles: number
  totalSize: string
  issues: HealthIssue[]
}

export interface IntegrationHealth {
  status: HealthStatus
  libraryApiResponseTime: number | null
  cacheHitRate: number
  signedUrlSuccessRate: number
  issues: HealthIssue[]
}

export interface DataConsistencyHealth {
  status: HealthStatus
  orphanedLibraryItems: number
  brokenReferences: number
  stuckProcessing: number
  missingStorageFiles: number
  issues: HealthIssue[]
}

export interface HealthCheckReport {
  status: HealthStatus
  timestamp: string
  database: DatabaseHealth
  storage: StorageHealth
  integration: IntegrationHealth
  dataConsistency: DataConsistencyHealth
  allIssues: HealthIssue[]
}

export interface HealResult {
  category: string
  success: boolean
  itemsHealed: number
  message: string
  errors?: string[]
}

export interface HealReport {
  timestamp: string
  results: HealResult[]
  totalItemsHealed: number
  success: boolean
}

// Content type mappings
export const EXPECTED_TABLES = [
  'illustrations',
  'comics',
  'avatars_personas',
  'product_mockups',
  'concept_worlds',
  'charts_infographics',
  'voices_creations',
  'voiceovers',
  'music_jingles',
  'sound_fx',
  'explainers',
  'talking_avatars',
  'subtitles',
  'watermarks',
  'video_translations',
  'library_items'
] as const

export const EXPECTED_STORAGE_FOLDERS = [
  'avatars',
  'charts',
  'comics',
  'concept-worlds',
  'explainers',
  'illustrations',
  'music-jingles',
  'product-mockups',
  'sound-fx',
  'subtitles',
  'talking-avatars',
  'translations',
  'voice-creation',
  'voiceovers',
  'watermarks'
] as const

export const CONTENT_TYPE_MAPPINGS = {
  visuals: ['comics', 'illustrations', 'avatars_personas', 'product_mockups', 'concept_worlds', 'charts_infographics'],
  audios: ['voices_creations', 'voiceovers', 'music_jingles', 'sound_fx'],
  motions: ['explainers', 'talking_avatars'],
  edit: ['subtitles', 'watermarks', 'video_translations']
} as const

export const TABLE_TO_FOLDER_MAP: Record<string, string> = {
  'illustrations': 'illustrations',
  'comics': 'comics',
  'avatars_personas': 'avatars',
  'product_mockups': 'product-mockups',
  'concept_worlds': 'concept-worlds',
  'charts_infographics': 'charts',
  'voices_creations': 'voice-creation',
  'voiceovers': 'voiceovers',
  'music_jingles': 'music-jingles',
  'sound_fx': 'sound-fx',
  'explainers': 'explainers',
  'talking_avatars': 'talking-avatars',
  'subtitles': 'subtitles',
  'watermarks': 'watermarks',
  'video_translations': 'translations'
}

