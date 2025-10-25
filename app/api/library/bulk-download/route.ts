import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'
import { signedUrlCache } from '@/lib/cache/signed-url-cache'

interface BulkDownloadRequest {
  libraryItemIds: string[]
  format: 'zip' | 'individual'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: BulkDownloadRequest = await request.json()
    const { libraryItemIds, format } = body

    if (!libraryItemIds || libraryItemIds.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    if (libraryItemIds.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 items allowed per download' }, { status: 400 })
    }

    // Fetch library items
    const { data: libraryItems, error: libraryError } = await supabase
      .from('library_items')
      .select('id, content_type, content_id, user_id')
      .in('id', libraryItemIds)
      .eq('user_id', user.id)

    if (libraryError) {
      console.error('Error fetching library items:', libraryError)
      return NextResponse.json({ error: 'Failed to fetch library items' }, { status: 500 })
    }

    if (!libraryItems || libraryItems.length === 0) {
      return NextResponse.json({ error: 'No items found' }, { status: 404 })
    }

    // Define content type to storage path mappings
    const contentTypeMappings: Record<string, { path: string; extension: string }> = {
      'explainers': { path: 'renders/explainers', extension: 'mp4' },
      'comics': { path: 'renders/comics', extension: 'png' },
      'product_mockups': { path: 'renders/product-mockups', extension: 'png' },
      'watermarks': { path: 'renders/watermarks', extension: 'mp4' },
      'subtitles': { path: 'renders/subtitles', extension: 'mp4' },
      'video_translations': { path: 'renders/translations', extension: 'mp4' }
    }

    // Collect all file URLs
    const downloadUrls: Array<{ url: string; filename: string; contentType: string }> = []

    for (const item of libraryItems) {
      const mapping = contentTypeMappings[item.content_type]
      if (!mapping) {
        console.warn(`No mapping for content type: ${item.content_type}`)
        continue
      }

      const storagePath = `${mapping.path}/${user.id}/${item.content_id}.${mapping.extension}`
      
      // Try to get from cache first
      let signedUrl = signedUrlCache.get(storagePath)
      
      // If not in cache, generate new signed URL
      if (!signedUrl) {
        const { data, error } = await supabase.storage
          .from('dreamcut')
          .createSignedUrl(storagePath, 86400) // 24 hour expiry

        if (error || !data?.signedUrl) {
          console.warn(`Failed to generate signed URL for ${storagePath}:`, error)
          continue
        }

        signedUrl = data.signedUrl
        signedUrlCache.set(storagePath, signedUrl, 3600)
      }

      downloadUrls.push({
        url: signedUrl,
        filename: `${item.content_type}_${item.content_id}.${mapping.extension}`,
        contentType: item.content_type
      })
    }

    if (downloadUrls.length === 0) {
      return NextResponse.json({ error: 'No downloadable files found' }, { status: 404 })
    }

    // If format is individual, return array of URLs
    if (format === 'individual') {
      return NextResponse.json({
        success: true,
        files: downloadUrls.map(item => ({
          url: item.url,
          filename: item.filename
        })),
        count: downloadUrls.length
      })
    }

    // If format is zip, create zip archive
    const zip = new JSZip()

    // Download files and add to zip
    const downloadPromises = downloadUrls.map(async ({ url, filename, contentType }) => {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          console.warn(`Failed to download ${filename}: ${response.statusText}`)
          return null
        }

        const blob = await response.blob()
        const buffer = await blob.arrayBuffer()
        
        // Organize by content type in zip
        zip.folder(contentType)?.file(filename, buffer)
        return filename
      } catch (error) {
        console.error(`Error downloading ${filename}:`, error)
        return null
      }
    })

    const results = await Promise.all(downloadPromises)
    const successCount = results.filter(Boolean).length

    if (successCount === 0) {
      return NextResponse.json({ error: 'Failed to download any files' }, { status: 500 })
    }

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ 
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    })

    // Return zip file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `dreamcut_export_${timestamp}.zip`

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.byteLength.toString(),
        'X-Files-Count': successCount.toString()
      }
    })

  } catch (error) {
    console.error('Bulk download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



