/**
 * Tests for signed URL generation utilities
 */

import { isStoragePath, convertToSignedUrls } from '@/lib/storage/signed-urls'

describe('Signed URL Utilities', () => {
  describe('isStoragePath', () => {
    test('should identify storage paths correctly', () => {
      expect(isStoragePath('renders/comics/user123/file.png')).toBe(true)
      expect(isStoragePath('renders/explainers/user456/video.mp4')).toBe(true)
    })

    test('should reject non-storage paths', () => {
      expect(isStoragePath('https://external.com/image.png')).toBe(false)
      expect(isStoragePath('http://cdn.example.com/file.jpg')).toBe(false)
      expect(isStoragePath('/local/path/image.png')).toBe(false)
    })

    test('should handle edge cases', () => {
      expect(isStoragePath('')).toBe(false)
      expect(isStoragePath('renders')).toBe(true)
      expect(isStoragePath('renders/')).toBe(true)
    })
  })

  describe('convertToSignedUrls', () => {
    test('should leave regular URLs unchanged', async () => {
      const urls = [
        'https://example.com/image1.png',
        'https://example.com/image2.png'
      ]
      
      const result = await convertToSignedUrls(urls)
      
      expect(result).toEqual(urls)
    })

    test('should handle empty array', async () => {
      const result = await convertToSignedUrls([])
      expect(result).toEqual([])
    })

    test('should handle mixed URLs', async () => {
      const urls = [
        'https://example.com/external.png',
        'renders/comics/user/test.png'
      ]
      
      // Note: In a real test, we would mock the Supabase client
      // For now, we just test that it doesn't throw
      const result = await convertToSignedUrls(urls)
      expect(result).toHaveLength(2)
      expect(result[0]).toBe(urls[0]) // External URL unchanged
    })
  })
})



