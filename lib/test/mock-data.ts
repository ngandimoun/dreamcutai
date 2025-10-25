/**
 * Generate realistic mock data for testing content generation
 */

export interface MockContentData {
  title: string
  description: string
  prompt: string
  metadata: Record<string, unknown>
}

const contentPrompts: Record<string, string[]> = {
  illustrations: [
    'A futuristic cityscape at sunset with flying cars',
    'Minimalist logo design for a tech startup',
    'Watercolor painting of a peaceful forest scene'
  ],
  comics: [
    'Superhero origin story, three panels',
    'Funny cat comic strip about monday mornings',
    'Sci-fi adventure comic page'
  ],
  avatars_personas: [
    'Professional business woman in her 30s, confident smile',
    'Young tech entrepreneur, casual hoodie and glasses',
    'Wise elderly mentor character, warm expression'
  ],
  product_mockups: [
    'iPhone mockup with app interface on urban background',
    'Coffee mug with custom logo on wooden table',
    'T-shirt mockup with graphic design'
  ],
  concept_worlds: [
    'Cyberpunk city with neon lights and rain',
    'Fantasy castle floating in the clouds',
    'Underwater civilization with bioluminescent buildings'
  ],
  charts_infographics: [
    'Monthly sales data visualization',
    'User growth chart for SaaS product',
    'Pie chart showing market share distribution'
  ],
  voices_creations: [
    'Professional narrator voice for documentaries',
    'Friendly customer service representative voice',
    'Energetic podcast host voice'
  ],
  voiceovers: [
    'Welcome to our revolutionary new product',
    'This quarter showed remarkable growth',
    'Discover the future of technology today'
  ],
  music_jingles: [
    'Upbeat jingle for tech company commercial',
    'Relaxing background music for meditation app',
    'Epic orchestral theme for game trailer'
  ],
  sound_fx: [
    'Futuristic UI button click sound',
    'Notification chime with echo',
    'Ambient background noise for office scene'
  ],
  explainers: [
    'How blockchain technology works',
    'The science behind climate change',
    'Understanding quantum computing basics'
  ],
  ugc_ads: [
    'New energy drink product reveal',
    'Smartphone unboxing and first impressions',
    'Skincare routine demonstration'
  ],
  product_motions: [
    'Sleek product rotation with lighting effects',
    'Logo animation with particle effects',
    'Watch reveal with dramatic camera movement'
  ],
  talking_avatars: [
    'AI assistant explaining product features',
    'Virtual tour guide describing landmarks',
    'Educational presenter teaching math concepts'
  ],
  subtitles: [
    'Add subtitles to product demo video',
    'Generate captions for interview footage',
    'Subtitle translation for marketing content'
  ],
  watermarks: [
    'Add company logo watermark to video',
    'Copyright protection overlay',
    'Brand identity watermark placement'
  ],
  video_translations: [
    'Translate English promo to Spanish',
    'French tutorial to English dubbing',
    'Multilingual product announcement'
  ]
}

export function generateMockContent(contentType: string): MockContentData {
  const prompts = contentPrompts[contentType] || ['Test content generation']
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]
  
  return {
    title: `Test ${contentType.replace(/_/g, ' ')} ${Date.now()}`,
    description: `Automated test generation for ${contentType}`,
    prompt: randomPrompt,
    metadata: {
      test: true,
      generated_at: new Date().toISOString(),
      content_type: contentType
    }
  }
}

export function generateMockImageBuffer(): Buffer {
  // Generate a simple 800x600 placeholder image
  // This is a minimal PNG with test pattern
  const width = 800
  const height = 600
  
  // Create a simple colored rectangle as PNG
  // For now, return a minimal buffer (in production, use canvas or sharp)
  const pixels = new Uint8Array(width * height * 4)
  
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 200     // R
    pixels[i + 1] = 200 // G
    pixels[i + 2] = 200 // B
    pixels[i + 3] = 255 // A
  }
  
  return Buffer.from(pixels)
}

export function generateMockAudioBuffer(): Buffer {
  // Generate 3 seconds of silence as WAV
  const sampleRate = 44100
  const duration = 3
  const numSamples = sampleRate * duration
  
  // Create WAV header + silent samples
  const buffer = Buffer.alloc(44 + numSamples * 2)
  
  // WAV header
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + numSamples * 2, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)  // PCM
  buffer.writeUInt16LE(1, 22)  // Mono
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(numSamples * 2, 40)
  
  // Silent samples (all zeros)
  for (let i = 44; i < buffer.length; i++) {
    buffer[i] = 0
  }
  
  return buffer
}

export function generateMockVideoBuffer(): Buffer {
  // For video, we'll return a minimal buffer
  // In production, use ffmpeg to generate actual video
  // For now, just return a marker buffer
  return Buffer.from('MOCK_VIDEO_DATA_' + Date.now())
}

export function getFileExtension(contentType: string): string {
  const videoTypes = ['explainers', 'ugc_ads', 'product_motions', 'talking_avatars', 'watermarks', 'video_translations']
  const audioTypes = ['voices_creations', 'voiceovers', 'music_jingles', 'sound_fx']
  
  if (videoTypes.includes(contentType)) {
    return 'mp4'
  }
  
  if (audioTypes.includes(contentType)) {
    return 'mp3'
  }
  
  // Default to image
  return 'png'
}

export function getMockFileBuffer(contentType: string): Buffer {
  const videoTypes = ['explainers', 'ugc_ads', 'product_motions', 'talking_avatars', 'watermarks', 'video_translations']
  const audioTypes = ['voices_creations', 'voiceovers', 'music_jingles', 'sound_fx']
  
  if (videoTypes.includes(contentType)) {
    return generateMockVideoBuffer()
  }
  
  if (audioTypes.includes(contentType)) {
    return generateMockAudioBuffer()
  }
  
  return generateMockImageBuffer()
}

