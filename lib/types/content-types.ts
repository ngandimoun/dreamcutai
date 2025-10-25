/**
 * Centralized content type mapping for the application
 * Maps content types to their database table names and display metadata
 */

export interface ContentTypeInfo {
  table: string
  apiRoute: string
  displayName: string
  category: 'visuals' | 'audios' | 'motions' | 'edit'
  icon: string
  description: string
  fileExtension: string
  isVideo: boolean
  isAudio: boolean
  isImage: boolean
}

export const CONTENT_TYPE_MAP: Record<string, ContentTypeInfo> = {
  // Visuals
  'comics': {
    table: 'comics',
    apiRoute: '/api/comics',
    displayName: 'Comics',
    category: 'visuals',
    icon: 'BookOpen',
    description: 'Comic strips and panels',
    fileExtension: 'png',
    isVideo: false,
    isAudio: false,
    isImage: true
  },
  'illustrations': {
    table: 'illustrations',
    apiRoute: '/api/illustrations',
    displayName: 'Illustrations',
    category: 'visuals',
    icon: 'Palette',
    description: 'AI-generated illustrations',
    fileExtension: 'png',
    isVideo: false,
    isAudio: false,
    isImage: true
  },
  'avatars_personas': {
    table: 'avatars_personas',
    apiRoute: '/api/avatars',
    displayName: 'Avatars & Personas',
    category: 'visuals',
    icon: 'UserCircle',
    description: 'Character avatars and personas',
    fileExtension: 'png',
    isVideo: false,
    isAudio: false,
    isImage: true
  },
  'product_mockups': {
    table: 'product_mockups',
    apiRoute: '/api/product-mockups',
    displayName: 'Product Mockups',
    category: 'visuals',
    icon: 'Package',
    description: 'Product mockup images',
    fileExtension: 'png',
    isVideo: false,
    isAudio: false,
    isImage: true
  },
  'concept_worlds': {
    table: 'concept_worlds',
    apiRoute: '/api/concept-worlds',
    displayName: 'Concept Worlds',
    category: 'visuals',
    icon: 'Globe',
    description: 'Conceptual world designs',
    fileExtension: 'png',
    isVideo: false,
    isAudio: false,
    isImage: true
  },
  'charts_infographics': {
    table: 'charts_infographics',
    apiRoute: '/api/charts-infographics',
    displayName: 'Charts & Infographics',
    category: 'visuals',
    icon: 'BarChart3',
    description: 'Data visualizations and infographics',
    fileExtension: 'png',
    isVideo: false,
    isAudio: false,
    isImage: true
  },

  // Audios
  'voices_creations': {
    table: 'voices_creations',
    apiRoute: '/api/voice-creation',
    displayName: 'Voice Creation',
    category: 'audios',
    icon: 'Mic',
    description: 'Custom voice creations',
    fileExtension: 'mp3',
    isVideo: false,
    isAudio: true,
    isImage: false
  },
  'voiceovers': {
    table: 'voiceovers',
    apiRoute: '/api/voiceovers',
    displayName: 'Voiceovers',
    category: 'audios',
    icon: 'Volume2',
    description: 'Text-to-speech voiceovers',
    fileExtension: 'mp3',
    isVideo: false,
    isAudio: true,
    isImage: false
  },
  'music_jingles': {
    table: 'music_jingles',
    apiRoute: '/api/music-jingles',
    displayName: 'Music & Jingles',
    category: 'audios',
    icon: 'Music',
    description: 'Background music and jingles',
    fileExtension: 'mp3',
    isVideo: false,
    isAudio: true,
    isImage: false
  },
  'music_videos': {
    table: 'music_videos',
    apiRoute: '/api/music-videos',
    displayName: 'Music Videos',
    category: 'audios',
    icon: 'Film',
    description: 'AI-generated music videos',
    fileExtension: 'mp4',
    isVideo: true,
    isAudio: false,
    isImage: false
  },
  'sound_fx': {
    table: 'sound_fx',
    apiRoute: '/api/sound-fx',
    displayName: 'Sound FX',
    category: 'audios',
    icon: 'Zap',
    description: 'Sound effects and audio clips',
    fileExtension: 'mp3',
    isVideo: false,
    isAudio: true,
    isImage: false
  },

  // Motions
  'explainers': {
    table: 'explainers',
    apiRoute: '/api/explainers',
    displayName: 'Explainers',
    category: 'motions',
    icon: 'PlayCircle',
    description: 'Explainer videos',
    fileExtension: 'mp4',
    isVideo: true,
    isAudio: false,
    isImage: false
  },
  'talking_avatars': {
    table: 'talking_avatars',
    apiRoute: '/api/talking-avatars',
    displayName: 'Talking Avatars',
    category: 'motions',
    icon: 'MessageCircle',
    description: 'Animated talking avatars',
    fileExtension: 'mp4',
    isVideo: true,
    isAudio: false,
    isImage: false
  },
  'diverse_motion_single': {
    table: 'diverse_motion_single',
    apiRoute: '/api/diverse-motion/single',
    displayName: 'Diverse Motion - Single Asset',
    category: 'motions',
    icon: 'Layers',
    description: 'Single asset motion videos',
    fileExtension: 'mp4',
    isVideo: true,
    isAudio: false,
    isImage: false
  },
  'diverse_motion_dual': {
    table: 'diverse_motion_dual',
    apiRoute: '/api/diverse-motion/dual',
    displayName: 'Diverse Motion - Dual Asset',
    category: 'motions',
    icon: 'Layers',
    description: 'Dual asset motion videos',
    fileExtension: 'mp4',
    isVideo: true,
    isAudio: false,
    isImage: false
  },
  'social_cuts': {
    table: 'social_cuts',
    apiRoute: '/api/social-cuts',
    displayName: 'Social Cuts',
    category: 'motions',
    icon: 'Scissors',
    description: 'Social media video cuts',
    fileExtension: 'mp4',
    isVideo: true,
    isAudio: false,
    isImage: false
  },

  // Edit Utilities
  'subtitles': {
    table: 'subtitles',
    apiRoute: '/api/subtitles',
    displayName: 'Subtitles',
    category: 'edit',
    icon: 'Subtitles',
    description: 'Video subtitles',
    fileExtension: 'mp4',
    isVideo: true,
    isAudio: false,
    isImage: false
  },
  'watermarks': {
    table: 'watermarks',
    apiRoute: '/api/watermarks',
    displayName: 'Watermarks',
    category: 'edit',
    icon: 'Droplets',
    description: 'Video watermarks',
    fileExtension: 'mp4',
    isVideo: true,
    isAudio: false,
    isImage: false
  },
  'video_translations': {
    table: 'video_translations',
    apiRoute: '/api/video-translations',
    displayName: 'Video Translations',
    category: 'edit',
    icon: 'Languages',
    description: 'Video translations',
    fileExtension: 'mp4',
    isVideo: true,
    isAudio: false,
    isImage: false
  }
}

/**
 * Get content type info by content type key
 */
export function getContentTypeInfo(contentType: string): ContentTypeInfo | null {
  return CONTENT_TYPE_MAP[contentType] || null
}

/**
 * Get all content types for a specific category
 */
export function getContentTypesByCategory(category: 'visuals' | 'audios' | 'motions' | 'edit'): string[] {
  return Object.entries(CONTENT_TYPE_MAP)
    .filter(([_, info]) => info.category === category)
    .map(([key, _]) => key)
}

/**
 * Get display name for a content type
 */
export function getContentTypeDisplayName(contentType: string): string {
  return CONTENT_TYPE_MAP[contentType]?.displayName || contentType
}

/**
 * Check if content type is video
 */
export function isVideoContentType(contentType: string): boolean {
  return CONTENT_TYPE_MAP[contentType]?.isVideo || false
}

/**
 * Check if content type is audio
 */
export function isAudioContentType(contentType: string): boolean {
  return CONTENT_TYPE_MAP[contentType]?.isAudio || false
}

/**
 * Check if content type is image
 */
export function isImageContentType(contentType: string): boolean {
  return CONTENT_TYPE_MAP[contentType]?.isImage || false
}

/**
 * Get API route for a content type
 */
export function getContentTypeApiRoute(contentType: string): string {
  return CONTENT_TYPE_MAP[contentType]?.apiRoute || '/api/library'
}
