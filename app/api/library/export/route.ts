import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'
import { signedUrlCache } from '@/lib/cache/signed-url-cache'

interface ExportRequest {
  categories?: string[] // 'visuals', 'audios', 'motions', 'edit'
  contentTypes?: string[] // Specific content types
  dateFrom?: string // ISO date string
  dateTo?: string // ISO date string
  includeMetadata?: boolean // Include JSON manifest
  maxItems?: number // Limit number of items (default 500)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ExportRequest = await request.json()
    const {
      categories,
      contentTypes,
      dateFrom,
      dateTo,
      includeMetadata = true,
      maxItems = 500
    } = body

    // Build query for library items
    let query = supabase
      .from('library_items')
      .select(`
        id,
        content_type,
        content_id,
        date_added_to_library,
        created_at
      `)
      .eq('user_id', user.id)
      .order('date_added_to_library', { ascending: false })
      .limit(maxItems)

    // Filter by categories
    if (categories && categories.length > 0) {
      const categoryMappings: Record<string, string[]> = {
        'visuals': ['comics', 'illustrations', 'avatars', 'product_mockups', 'concept_worlds', 'charts_infographics'],
        'audios': ['voice_creations', 'voiceovers', 'music_jingles', 'sound_fx'],
        'motions': ['explainers', 'ugc_ads', 'product_motion', 'cinematic_clips', 'social_cuts', 'talking_avatars'],
        'edit': ['subtitles', 'sound_to_video', 'watermarks', 'video_translations']
      }

      const selectedTypes = new Set<string>()
      for (const category of categories) {
        const types = categoryMappings[category]
        if (types) {
          for (const type of types) {
            selectedTypes.add(type)
          }
        }
      }

      if (selectedTypes.size > 0) {
        query = query.in('content_type', Array.from(selectedTypes))
      }
    }

    // Filter by specific content types
    if (contentTypes && contentTypes.length > 0) {
      query = query.in('content_type', contentTypes)
    }

    // Filter by date range
    if (dateFrom) {
      query = query.gte('date_added_to_library', dateFrom)
    }
    if (dateTo) {
      query = query.lte('date_added_to_library', dateTo)
    }

    const { data: libraryItems, error: libraryError } = await query

    if (libraryError) {
      console.error('Error fetching library items:', libraryError)
      return NextResponse.json({ error: 'Failed to fetch library items' }, { status: 500 })
    }

    if (!libraryItems || libraryItems.length === 0) {
      return NextResponse.json({ error: 'No items found matching criteria' }, { status: 404 })
    }

    console.log(`📦 Exporting ${libraryItems.length} items...`)

    // Define content type to storage path mappings
    const contentTypeMappings: Record<string, { path: string; extension: string }> = {
      'explainers': { path: 'renders/explainers', extension: 'mp4' },
      'comics': { path: 'renders/comics', extension: 'png' },
      'product_mockups': { path: 'renders/product-mockups', extension: 'png' },
      'watermarks': { path: 'renders/watermarks', extension: 'mp4' },
      'subtitles': { path: 'renders/subtitles', extension: 'mp4' },
      'video_translations': { path: 'renders/translations', extension: 'mp4' }
    }

    // Fetch full content details for metadata
    const contentByType: Record<string, any[]> = {}
    
    if (includeMetadata) {
      const itemsByType = libraryItems.reduce((acc, item) => {
        if (!acc[item.content_type]) acc[item.content_type] = []
        acc[item.content_type].push(item)
        return acc
      }, {} as Record<string, typeof libraryItems>)

      for (const [type, items] of Object.entries(itemsByType)) {
        try {
          const contentIds = items.map(item => item.content_id)
          const { data: contentData } = await supabase
            .from(type)
            .select('*')
            .in('id', contentIds)
            .eq('user_id', user.id)

          if (contentData) {
            contentByType[type] = contentData
          }
        } catch (error) {
          console.warn(`Failed to fetch content for type ${type}:`, error)
        }
      }
    }

    // Create ZIP archive
    const zip = new JSZip()

    // Add manifest if requested
    if (includeMetadata) {
      const manifest = {
        exportDate: new Date().toISOString(),
        userId: user.id,
        itemsCount: libraryItems.length,
        filters: {
          categories,
          contentTypes,
          dateFrom,
          dateTo
        },
        items: libraryItems.map(item => ({
          id: item.id,
          contentType: item.content_type,
          contentId: item.content_id,
          addedToLibrary: item.date_added_to_library,
          created: item.created_at,
          fullContent: contentByType[item.content_type]?.find(
            (c: any) => c.id === item.content_id
          )
        }))
      }

      zip.file('manifest.json', JSON.stringify(manifest, null, 2))
    }

    // Download files and add to zip by category
    let successCount = 0
    let failedCount = 0

    for (const item of libraryItems) {
      const mapping = contentTypeMappings[item.content_type]
      if (!mapping) {
        console.warn(`No mapping for content type: ${item.content_type}`)
        failedCount++
        continue
      }

      try {
        const storagePath = `${mapping.path}/${user.id}/${item.content_id}.${mapping.extension}`
        
        // Try to get from cache first
        let signedUrl = signedUrlCache.get(storagePath)
        
        // If not in cache, generate new signed URL
        if (!signedUrl) {
          const { data, error } = await supabase.storage
            .from('dreamcut')
            .createSignedUrl(storagePath, 86400)

          if (error || !data?.signedUrl) {
            console.warn(`Failed to generate signed URL for ${storagePath}`)
            failedCount++
            continue
          }

          signedUrl = data.signedUrl
          signedUrlCache.set(storagePath, signedUrl, 3600)
        }

        // Download file
        const response = await fetch(signedUrl)
        if (!response.ok) {
          console.warn(`Failed to download ${storagePath}: ${response.statusText}`)
          failedCount++
          continue
        }

        const blob = await response.blob()
        const buffer = await blob.arrayBuffer()
        
        // Add to appropriate folder in zip
        const filename = `${item.content_id}.${mapping.extension}`
        zip.folder(item.content_type)?.file(filename, buffer)
        successCount++

      } catch (error) {
        console.error(`Error processing ${item.content_type}/${item.content_id}:`, error)
        failedCount++
      }
    }

    console.log(`✅ Export complete: ${successCount} succeeded, ${failedCount} failed`)

    if (successCount === 0) {
      return NextResponse.json({ error: 'Failed to export any files' }, { status: 500 })
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
        'X-Files-Success': successCount.toString(),
        'X-Files-Failed': failedCount.toString(),
        'X-Total-Items': libraryItems.length.toString()
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



