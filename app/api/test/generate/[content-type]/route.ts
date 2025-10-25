import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMockContent, getMockFileBuffer, getFileExtension } from '@/lib/test/mock-data'
import { TABLE_TO_FOLDER_MAP } from '@/lib/health/types'

/**
 * POST /api/test/generate/[content-type] - Generate test content without API calls
 * 
 * This endpoint creates realistic test data for any content type by:
 * 1. Creating a database record
 * 2. Generating a placeholder file
 * 3. Uploading to correct storage path
 * 4. Adding to library_items
 * 
 * Perfect for testing the entire flow without using API credits
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { 'content-type': string } }
) {
  try {
    const contentType = params['content-type']
    
    // Validate content type
    if (!TABLE_TO_FOLDER_MAP[contentType]) {
      return NextResponse.json(
        { error: `Invalid content type: ${contentType}` },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log(`🧪 Generating test ${contentType} for user ${user.id}`)
    
    // Generate mock data
    const mockData = generateMockContent(contentType)
    
    // Step 1: Create database record
    const { data: contentRecord, error: insertError } = await supabase
      .from(contentType)
      .insert({
        user_id: user.id,
        title: mockData.title,
        description: mockData.description,
        prompt: mockData.prompt,
        status: 'draft',
        metadata: mockData.metadata
      })
      .select()
      .single()
    
    if (insertError || !contentRecord) {
      console.error(`Failed to create ${contentType} record:`, insertError)
      return NextResponse.json(
        { error: `Failed to create ${contentType} record: ${insertError?.message}` },
        { status: 500 }
      )
    }
    
    const contentId = contentRecord.id
    
    // Step 2: Generate placeholder file
    const fileBuffer = getMockFileBuffer(contentType)
    const fileExtension = getFileExtension(contentType)
    const folderName = TABLE_TO_FOLDER_MAP[contentType]
    
    // Step 3: Upload to storage
    const storagePath = `renders/${folderName}/${user.id}/generated/${contentId}.${fileExtension}`
    
    const { error: uploadError } = await supabase.storage
      .from('dreamcut')
      .upload(storagePath, fileBuffer, {
        contentType: fileExtension === 'mp4' ? 'video/mp4' : fileExtension === 'mp3' ? 'audio/mpeg' : 'image/png',
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      console.error(`Failed to upload test file:`, uploadError)
      // Continue anyway - file upload is not critical for test
    }
    
    // Step 4: Update content record with storage path
    const updateData: Record<string, unknown> = {
      status: 'completed',
      updated_at: new Date().toISOString()
    }
    
    // Use appropriate field name based on content type
    const multiFileTypes = ['illustrations', 'avatars_personas', 'product_mockups', 'concept_worlds', 'charts_infographics']
    if (multiFileTypes.includes(contentType)) {
      updateData.storage_paths = [storagePath]
      updateData.generated_images = [storagePath]
    } else {
      updateData.storage_path = storagePath
      if (contentType.includes('video') || ['explainers', 'ugc_ads', 'product_motions', 'talking_avatars', 'watermarks', 'video_translations'].includes(contentType)) {
        updateData.generated_video_url = storagePath
        updateData.output_url = storagePath
      } else if (['voices_creations', 'voiceovers', 'music_jingles', 'sound_fx'].includes(contentType)) {
        updateData.generated_audio_path = storagePath
        updateData.audio_url = storagePath
      }
    }
    
    const { error: updateError } = await supabase
      .from(contentType)
      .update(updateData)
      .eq('id', contentId)
    
    if (updateError) {
      console.error(`Failed to update ${contentType} record:`, updateError)
    }
    
    // Step 5: Add to library_items
    const { error: libraryError } = await supabase
      .from('library_items')
      .insert({
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
        date_added_to_library: new Date().toISOString()
      })
    
    if (libraryError) {
      console.error(`Failed to add to library:`, libraryError)
      // Not critical - continue
    }
    
    console.log(`✅ Test ${contentType} generated successfully: ${contentId}`)
    
    return NextResponse.json({
      success: true,
      contentType,
      contentId,
      storagePath: uploadError ? null : storagePath,
      message: `Test ${contentType} generated successfully`
    }, { status: 201 })
    
  } catch (error) {
    console.error('Test generation failed:', error)
    return NextResponse.json(
      {
        error: 'Test generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/test/generate/[content-type] - Get test generation info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { 'content-type': string } }
) {
  const contentType = params['content-type']
  
  if (!TABLE_TO_FOLDER_MAP[contentType]) {
    return NextResponse.json(
      { error: `Invalid content type: ${contentType}` },
      { status: 400 }
    )
  }
  
  const mockData = generateMockContent(contentType)
  
  return NextResponse.json({
    contentType,
    sampleData: mockData,
    folderPath: `renders/${TABLE_TO_FOLDER_MAP[contentType]}/{user_id}/generated/`,
    fileExtension: getFileExtension(contentType)
  })
}

