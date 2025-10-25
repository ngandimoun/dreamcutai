import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { buildCodeInterpreterPrompt, buildEnhancementPrompt } from '@/lib/utils/chart-prompt-builder'
import { generateChartCode } from '@/lib/openai/code-interpreter'
import { executeChartCode } from '@/lib/modal/chart-generation'
import { generateWithFal, downloadImage } from '@/lib/utils/fal-generation'
import { validateImageFiles } from '@/lib/utils/image-validation'
import { sanitizeFilename } from '@/lib/utils'

// Cache for 30 seconds
export const revalidate = 30

// Validation schema for chart/infographic creation
const createChartInfographicSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  chart_type: z.string().optional(),
  data_type: z.string().optional(),
  style: z.string().optional(),
  color_scheme: z.string().optional(),
  layout: z.string().optional(),
  data_points: z.record(z.any()).optional(),
  labels: z.record(z.any()).optional(),
  annotations: z.record(z.any()).optional(),
  source_attribution: z.string().optional(),
  target_audience: z.string().optional(),
  content: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  is_template: z.boolean().optional().default(false),
})

// GET /api/charts-infographics - Get user's charts/infographics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query with filters
    let query = supabase
      .from('charts_infographics')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination (use range instead of limit to avoid conflicts)
    query = query.range(offset, offset + limit - 1)

    const { data: chartsInfographicsData, error } = await query

    if (error) {
      console.error('Error fetching charts/infographics:', error)
      return NextResponse.json({ error: 'Failed to fetch charts/infographics' }, { status: 500 })
    }

    // Filter and regenerate URLs - ONLY show charts with enhanced versions
    let chartsInfographics = chartsInfographicsData
    if (chartsInfographics && chartsInfographics.length > 0) {
      const enhancedCharts = []
      
      for (const chart of chartsInfographics) {
        if (chart.storage_paths && chart.storage_paths.length > 0) {
          // Find the enhanced chart path (contains "enhanced" in filename)
          const enhancedPath = chart.storage_paths.find(path => path.includes('enhanced'))
          
          if (enhancedPath) {
            // This chart has an enhanced version - include it
            console.log('🔍 Regenerating URL for enhanced chart:', {
              id: chart.id,
              title: chart.title,
              enhancedPath
            })
            
            // Regenerate fresh signed URL for the enhanced chart
            const { data: signedUrlData } = await supabase.storage
              .from('dreamcut')
              .createSignedUrl(enhancedPath, 86400) // 24 hour expiry
            
            if (signedUrlData?.signedUrl) {
              // Only use the enhanced chart URL for display
              chart.generated_images = [signedUrlData.signedUrl]
              enhancedCharts.push(chart)
              console.log('✅ Regenerated enhanced chart URL:', signedUrlData.signedUrl)
            }
          } else {
            // This chart has no enhanced version - skip it
            console.log('⏭️ Skipping chart without enhanced version:', {
              id: chart.id,
              title: chart.title,
              storagePaths: chart.storage_paths
            })
          }
        }
      }
      
      // Replace the original array with only enhanced charts
      chartsInfographics = enhancedCharts
      console.log(`📊 Filtered charts: ${enhancedCharts.length} enhanced charts out of ${chartsInfographicsData.length} total`)
    }

    return NextResponse.json({ chartsInfographics }, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'max-age=30'
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/charts-infographics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to convert null to undefined
const nullToUndefined = (value: string | null): string | undefined => {
  return value === null ? undefined : value
}

// POST /api/charts-infographics - Create new chart/infographic
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Charts/Infographics generation API called')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data instead of JSON
    const formData = await request.formData()
    
    // Extract form fields
    const title = formData.get('title')?.toString() || ''
    const description = formData.get('description')?.toString() || ''
    const prompt = formData.get('prompt')?.toString() || ''
    let dataSource = formData.get('dataSource')?.toString() || 'text'
    const autoDetected = formData.get('autoDetected')?.toString() === 'true'
    const aggregationType = formData.get('aggregationType')?.toString() || 'sum'
    const units = formData.get('units')?.toString() || null
    const labels = formData.get('labels')?.toString() || null
    
    // Purpose & Chart Configuration
    const purpose = formData.get('purpose')?.toString() || null
    const chartType = formData.get('chartType')?.toString() || null
    const axisMapping = formData.get('axisMapping')?.toString() ? JSON.parse(formData.get('axisMapping')?.toString() || '{}') : {}
    const multiSeries = formData.get('multiSeries')?.toString() === 'true'
    const orientation = formData.get('orientation')?.toString() || 'vertical'
    
    // Visual Style
    const artDirection = formData.get('artDirection')?.toString() || null
    const visualInfluence = formData.get('visualInfluence')?.toString() || null
    const chartDepth = parseInt(formData.get('chartDepth')?.toString() || '0')
    const backgroundTexture = formData.get('backgroundTexture')?.toString() || null
    const accentShapes = formData.get('accentShapes')?.toString() === 'true'
    
    // Mood & Atmosphere
    const moodContext = formData.get('moodContext')?.toString() || null
    const toneIntensity = parseInt(formData.get('toneIntensity')?.toString() || '50')
    const lightingTemperature = parseInt(formData.get('lightingTemperature')?.toString() || '50')
    const motionAccent = formData.get('motionAccent')?.toString() || 'none'
    
    // Branding
    const brandSync = formData.get('brandSync')?.toString() === 'true'
    const paletteMode = formData.get('paletteMode')?.toString() || 'categorical'
    const backgroundType = formData.get('backgroundType')?.toString() || 'light'
    const fontFamily = formData.get('fontFamily')?.toString() || 'Inter'
    const logoPlacement = formData.get('logoPlacement')?.toString() 
      ? JSON.parse(formData.get('logoPlacement')?.toString() || '[]') 
      : []
    const logoDescription = formData.get('logoDescription')?.toString() || null
    const colorPalette = formData.get('colorPalette')?.toString() || null
    
    // Annotations & Labels
    const dataLabels = formData.get('dataLabels')?.toString() === 'true'
    const labelPlacement = formData.get('labelPlacement')?.toString() || 'auto'
    const legends = formData.get('legends')?.toString() || 'auto'
    const callouts = formData.get('callouts')?.toString() === 'true'
    const calloutThreshold = parseInt(formData.get('calloutThreshold')?.toString() || '3')
    const tooltipStyle = formData.get('tooltipStyle')?.toString() || 'minimal'
    const axisTitles = formData.get('axisTitles')?.toString() || null
    const gridlines = formData.get('gridlines')?.toString() || 'light'
    
    // Layout
    const layoutTemplate = formData.get('layoutTemplate')?.toString() || 'auto'
    const aspectRatio = formData.get('aspectRatio')?.toString() || '16:9'
    const marginDensity = parseInt(formData.get('marginDensity')?.toString() || '50')
    const safeZoneOverlay = formData.get('safeZoneOverlay')?.toString() === 'true'
    const exportPreset = formData.get('exportPreset')?.toString() || null
    
    // Multiple Variants
    const generateVariants = formData.get('generateVariants')?.toString() === 'true'
    
    // Narrative
    const headline = formData.get('headline')?.toString() || null
    const caption = formData.get('caption')?.toString() || null
    const tone = formData.get('tone')?.toString() || 'formal'
    const platform = formData.get('platform')?.toString() || 'web'
    
    // Metadata
    const metadata = formData.get('metadata')?.toString() ? JSON.parse(formData.get('metadata')?.toString() || '{}') : {}
    
    // Custom fields
    const custom_aggregation_type = formData.get('custom_aggregation_type')?.toString() || null
    const custom_purpose = formData.get('custom_purpose')?.toString() || null
    const custom_orientation = formData.get('custom_orientation')?.toString() || null
    const custom_art_direction = formData.get('custom_art_direction')?.toString() || null
    const custom_background_texture = formData.get('custom_background_texture')?.toString() || null
    const custom_mood_context = formData.get('custom_mood_context')?.toString() || null
    const custom_color_palette = formData.get('custom_color_palette')?.toString() || null
    const custom_palette_mode = formData.get('custom_palette_mode')?.toString() || null
    const custom_background = formData.get('custom_background')?.toString() || null
    const custom_font_family = formData.get('custom_font_family')?.toString() || null
    const custom_label_placement = formData.get('custom_label_placement')?.toString() || null
    const custom_gridlines = formData.get('custom_gridlines')?.toString() || null
    const custom_layout_template = formData.get('custom_layout_template')?.toString() || null
    const custom_export_preset = formData.get('custom_export_preset')?.toString() || null
    const custom_tone = formData.get('custom_tone')?.toString() || null
    const custom_platform = formData.get('custom_platform')?.toString() || null

    // Handle data file upload (CSV, Excel, JSON, PDF, etc.)
    // Note: Data files are only used for Code Interpreter processing, not stored in Supabase
    // Supabase storage doesn't support certain MIME types like application/json
    let dataFilePath: string | null = null
    const dataFile = formData.get('dataFile') as File | null
    if (dataFile) {
      // For data files, we only need the file content for Code Interpreter
      // We'll store the filename and type in the database for reference
      dataFilePath = `data-file-${dataFile.name}` // Just a reference, not actual storage path
      console.log(`📁 Data file received: ${dataFile.name} (${dataFile.type}, ${dataFile.size} bytes)`)
    }

    // Map generic "file" dataSource to actual file type
    if (dataSource === 'file' && dataFile) {
      const fileExt = dataFile.name.split('.').pop()?.toLowerCase()
      const fileTypeMap: Record<string, string> = {
        'csv': 'csv',
        'xlsx': 'excel',
        'xls': 'excel',
        'json': 'json',
        'txt': 'text',
        'pdf': 'pdf',
        'docx': 'document',
        'doc': 'document',
        'xml': 'xml',
        'html': 'html',
        'md': 'markdown',
      }
      dataSource = fileTypeMap[fileExt || ''] || 'csv'
      console.log(`📝 Mapped file source to actual type: ${dataSource}`)
    }

    // Handle logo upload
    let logoImagePath: string | null = null
    let logoImageUrl: string | null = null
    const logoFile = formData.get('logoFile') as File | null
    if (logoFile) {
      // Validate logo image
      const logoValidation = await validateImageFiles([logoFile])
      if (!logoValidation.valid) {
        return NextResponse.json({ 
          error: `Invalid logo image: ${logoValidation.errors.join(', ')}` 
        }, { status: 400 })
      }

      const sanitizedName = sanitizeFilename(logoFile.name)
      const filePath = `renders/charts/${user.id}/logo/${uuidv4()}-${sanitizedName}`
      const { error: uploadError } = await supabase.storage
        .from('dreamcut')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Error uploading logo file:', uploadError)
        return NextResponse.json({ error: `Failed to upload logo file: ${uploadError.message}` }, { status: 500 })
      }
      logoImagePath = filePath

      // Create signed URL for logo
      const { data: logoSignedUrlData } = await supabase.storage
        .from('dreamcut')
        .createSignedUrl(logoImagePath, 86400) // 24 hour expiry
      
      if (logoSignedUrlData?.signedUrl) {
        logoImageUrl = logoSignedUrlData.signedUrl
        console.log('✅ Logo signed URL created:', logoImageUrl)
      } else {
        console.warn('⚠️ Failed to create signed URL for logo')
      }
    }

    console.log('📝 Chart generation data:', {
      title,
      prompt,
      dataSource,
      chartType,
      artDirection,
      visualInfluence,
      dataFile: dataFilePath ? `uploaded (${dataFile?.name})` : 'none',
      logoFile: logoImagePath ? 'uploaded' : 'none'
    })

    // Generate unique ID for this generation
    const generationId = `ci_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const generationTimestamp = new Date().toISOString()

    // ===== PHASE 1: CODE INTERPRETER CHART GENERATION =====
    console.log('🚀 Phase 1: Starting Code Interpreter chart generation...')
    
    // Build Code Interpreter prompt
    const codeInterpreterPrompt = buildCodeInterpreterPrompt({
      prompt: prompt || textData || '',
      dataSource,
      textData: prompt || textData,
      autoDetected,
      aggregationType,
      units,
      labels,
      purpose,
      chartType,
      multiSeries,
      orientation,
      dataLabels,
      legends,
      gridlines,
      callouts,
      calloutThreshold,
      axisTitles,
      headline,
      caption,
      generateVariants
    })

    // Prepare data file for Code Interpreter if uploaded
    let dataFileBuffer: Buffer | undefined
    if (dataFilePath && dataFile) {
      dataFileBuffer = Buffer.from(await dataFile.arrayBuffer())
    }

    // Phase 1: Generate validated Python code using Code Interpreter
    console.log('📊 Phase 1: Generating validated Python code with Code Interpreter...')
    const chartCodeResult = await generateChartCode({
      dataFile: dataFileBuffer ? {
        buffer: dataFileBuffer,
        filename: dataFile.name
      } : undefined,
      prompt: codeInterpreterPrompt,
      chartConfig: {
        aspectRatio,
        format: 'png',
        dpi: 300
      }
    })

    if (!chartCodeResult.success || !chartCodeResult.pythonCode) {
      console.error('❌ Phase 1 failed:', chartCodeResult.error)
      return NextResponse.json({ 
        error: `Chart code generation failed: ${chartCodeResult.error}` 
      }, { status: 500 })
    }

    console.log('✅ Phase 1 completed: Validated Python code generated')

    // Post-process generated code to fix filename mismatches
    if (chartCodeResult.success && chartCodeResult.pythonCode && dataFile) {
      // Replace any file paths with actual uploaded filename
      chartCodeResult.pythonCode = chartCodeResult.pythonCode.replace(
        /\/mnt\/data\/[^\s'"]+\.(xlsx|xls|csv|json|txt|pdf|docx|doc|xml|html|md)/gi,
        `/mnt/data/${dataFile.name}`
      )
      console.log(`📝 Replaced file paths with actual filename: ${dataFile.name}`)
      
      // Fix read function based on file extension
      const fileExt = dataFile.name.split('.').pop()?.toLowerCase()
      
      // Map file extensions to pandas read functions
      const readFunctionMap: Record<string, string> = {
        'csv': 'pd.read_csv',
        'json': 'pd.read_json',
        'xlsx': 'pd.read_excel',
        'xls': 'pd.read_excel',
        'txt': 'pd.read_csv',
        'tsv': 'pd.read_csv',
        'parquet': 'pd.read_parquet'
      }
      
      // Replace any pandas read function with the correct one
      if (fileExt && readFunctionMap[fileExt]) {
        const correctReadFunction = readFunctionMap[fileExt]
        
        // Special handling for JSON files - use flexible reader
        if (fileExt === 'json') {
          chartCodeResult.pythonCode = chartCodeResult.pythonCode.replace(
            /pd\.read_json\s*\(/g,
            'read_json_flexible('
          )
          console.log(`📝 Replaced pd.read_json with read_json_flexible for .${fileExt} file`)
        } else {
          chartCodeResult.pythonCode = chartCodeResult.pythonCode.replace(
            /pd\.(read_excel|read_csv|read_parquet)\s*\(/g,
            `${correctReadFunction}(`
          )
          console.log(`📝 Replaced read function with ${correctReadFunction} for .${fileExt} file`)
        }
      }
    }

    // Phase 2: Execute validated code in Modal
    console.log('🚀 Phase 2: Executing validated code in Modal...')
    const chartImageBuffer = await executeChartCode(
      chartCodeResult.pythonCode,
      dataFileBuffer ? { buffer: dataFileBuffer, filename: dataFile.name } : undefined
    )

    console.log('✅ Phase 2 completed: Chart executed successfully in Modal')

    // Upload raw chart to Supabase storage
    const rawChartFileName = `${uuidv4()}-raw.png`
    const rawChartPath = `renders/charts/${user.id}/raw/${rawChartFileName}`
    
    const { error: rawUploadError } = await supabase.storage
      .from('dreamcut')
      .upload(rawChartPath, chartImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600'
      })

    if (rawUploadError) {
      console.error('❌ Failed to upload raw chart:', rawUploadError)
      return NextResponse.json({ 
        error: 'Failed to save raw chart' 
      }, { status: 500 })
    }

    // Get signed URL for raw chart
    const { data: rawSignedUrlData } = await supabase.storage
      .from('dreamcut')
      .createSignedUrl(rawChartPath, 86400) // 24 hour expiry

    // ===== PHASE 3: GPT IMAGE 1 ENHANCEMENT =====
    console.log('🎨 Phase 3: Starting GPT Image 1 enhancement...')
    
    // Build enhancement prompt
    const enhancementPrompt = buildEnhancementPrompt({
      prompt: prompt || textData || '',
      artDirection,
      visualInfluence,
      chartDepth,
      backgroundTexture,
      accentShapes,
      moodContext,
      toneIntensity,
      lightingTemperature,
      motionAccent,
      brandSync,
      paletteMode,
      backgroundType,
      fontFamily,
      logoPlacement,
      logoDescription,
      colorPalette,
      layoutTemplate,
      marginDensity,
      exportPreset,
      tone,
      platform
    })

    // Phase 3: Enhance chart with GPT Image 1 via fal.ai
    console.log('🎨 Phase 3: Enhancing chart with GPT Image 1 via fal.ai...')
    
    // Get signed URL for raw chart
    const { data: { signedUrl: rawChartUrl } } = await supabase.storage
      .from('dreamcut')
      .createSignedUrl(rawChartPath, 86400) // 24 hour expiry

    if (!rawChartUrl) {
      throw new Error('Failed to create signed URL for raw chart')
    }

    // Enhance with fal.ai GPT Image 1
    const enhancementResult = await generateWithFal({
      prompt: enhancementPrompt,
      aspectRatio,
      numImages: 1,
      model: 'gpt-image-1',
      hasImages: true,
      imageUrls: [rawChartUrl],
      logoImageUrl: logoImageUrl
    })

    let enhancedImageUrl: string | undefined
    let enhancedStoragePath: string | undefined

    if (enhancementResult.success && enhancementResult.images.length > 0) {
      console.log('✅ Phase 3 completed: Chart enhanced')
      console.log('🔍 Debug - fal.ai returned image URL:', enhancementResult.images[0])
      
      // Download enhanced image
      const enhancedImageBuffer = await downloadImage(enhancementResult.images[0])
      console.log('🔍 Debug - Downloaded enhanced image buffer size:', enhancedImageBuffer.length)
      
      // Upload enhanced chart to Supabase storage
      const enhancedChartFileName = `${uuidv4()}-enhanced.png`
      enhancedStoragePath = `renders/charts/${user.id}/generated/${enhancedChartFileName}`
      console.log('🔍 Debug - Enhanced storage path:', enhancedStoragePath)
      
      const { error: enhancedUploadError } = await supabase.storage
        .from('dreamcut')
        .upload(enhancedStoragePath, enhancedImageBuffer, {
          contentType: 'image/png',
          cacheControl: '3600'
        })

      if (enhancedUploadError) {
        console.error('❌ Failed to upload enhanced chart:', enhancedUploadError)
        // Continue with raw chart only
      } else {
        console.log('✅ Enhanced chart uploaded to Supabase successfully')
        // Get signed URL for enhanced chart
        const { data: enhancedSignedUrlData } = await supabase.storage
          .from('dreamcut')
          .createSignedUrl(enhancedStoragePath, 86400) // 24 hour expiry
        
        if (enhancedSignedUrlData?.signedUrl) {
          enhancedImageUrl = enhancedSignedUrlData.signedUrl
          console.log('✅ Enhanced chart signed URL created:', enhancedImageUrl)
        } else {
          console.error('❌ Failed to create signed URL for enhanced chart')
        }
      }
    } else {
      console.error('❌ Phase 3 failed:', enhancementResult.error)
      throw new Error(`Chart enhancement failed: ${enhancementResult.error || 'Unknown error'}`)
    }

    // Prepare final results - ONLY show enhanced chart to users
    const imageUrls: string[] = []
    const allStoragePaths: string[] = []

    // Always store both raw and enhanced paths for backup/debugging
    allStoragePaths.push(rawChartPath)
    if (enhancedStoragePath) {
      allStoragePaths.push(enhancedStoragePath)
    }

    // Debug logging to understand what URLs we have
    console.log('🔍 Debug - Raw chart signed URL:', rawSignedUrlData?.signedUrl)
    console.log('🔍 Debug - Enhanced image URL:', enhancedImageUrl)
    console.log('🔍 Debug - Enhanced storage path:', enhancedStoragePath)

    if (enhancedImageUrl && enhancedStoragePath) {
      // Use enhanced chart - this is what users see
      imageUrls.push(enhancedImageUrl)
      console.log('📊 Using enhanced chart for display:', enhancedImageUrl)
      console.log('📊 Enhanced chart URL contains "enhanced":', enhancedImageUrl.includes('enhanced'))
    } else {
      // No enhanced chart available - this should not happen since we throw error above
      throw new Error('No enhanced chart was generated')
    }

    console.log('📊 Final chart generation completed - imageUrls:', imageUrls)
    console.log('📊 Final chart generation completed - allStoragePaths:', allStoragePaths)

    // Save to charts_infographics table with new schema
    console.log('🔄 Attempting to save to charts_infographics table...')
    console.log('🔍 Final verification - imageUrls being saved to database:', imageUrls)
    console.log('🔍 Final verification - allStoragePaths being saved to database:', allStoragePaths)
    const chartData = {
        user_id: user.id,
        title: title || `Chart ${new Date().toLocaleDateString()}`,
        description: nullToUndefined(description),
        prompt: prompt || 'Chart generation',
        
        // Data Source & Content
        data_source: dataSource,
        csv_file_path: dataFilePath, // Reference to data file (not actual storage path)
        text_data: nullToUndefined(prompt),
        auto_detected: autoDetected,
        aggregation_type: aggregationType,
        units: nullToUndefined(units),
        labels: nullToUndefined(labels),
        
        // Purpose & Chart Configuration
        purpose: nullToUndefined(purpose),
        chart_type: nullToUndefined(chartType),
        axis_mapping: axisMapping,
        multi_series: multiSeries,
        orientation: orientation,
        
        // Visual Style
        art_direction: nullToUndefined(artDirection),
        visual_influence: nullToUndefined(visualInfluence),
        chart_depth: chartDepth,
        background_texture: nullToUndefined(backgroundTexture),
        accent_shapes: accentShapes,
        
        // Mood & Atmosphere
        mood_context: nullToUndefined(moodContext),
        tone_intensity: toneIntensity,
        lighting_temperature: lightingTemperature,
        motion_accent: motionAccent,
        
        // Branding
        brand_sync: brandSync,
        palette_mode: paletteMode === 'auto' ? 'categorical' : paletteMode,
        background_type: backgroundType,
        font_family: fontFamily,
        logo_image_path: logoImagePath,
        logo_placement: logoPlacement,
        logo_description: logoDescription,
        color_palette: colorPalette,
        export_preset: exportPreset,
        
        // Annotations & Labels
        data_labels: dataLabels,
        label_placement: labelPlacement,
        legends: legends,
        callouts: callouts,
        callout_threshold: calloutThreshold,
        tooltip_style: tooltipStyle,
        axis_titles: nullToUndefined(axisTitles),
        gridlines: gridlines,
        
        // Layout
        layout_template: layoutTemplate,
        aspect_ratio: aspectRatio,
        margin_density: marginDensity,
        safe_zone_overlay: safeZoneOverlay,
        
        // Narrative
        headline: nullToUndefined(headline),
        caption: nullToUndefined(caption),
        tone: tone,
        platform: platform,
        
        // Generated Content
        generated_images: imageUrls,
        storage_paths: allStoragePaths,
        
        // Status & Metadata
        status: 'completed',
        metadata: {
          generationTimestamp,
          dataSource,
          chartType,
          artDirection,
          visualInfluence,
          projectTitle: metadata?.projectTitle,
          generated_via: 'charts-infographics-generation',
          brandSync,
          paletteMode,
          backgroundType,
          colorPalette,
          exportPreset,
          generateVariants,
          dataFile: dataFile ? {
            name: dataFile.name,
            type: dataFile.type,
            size: dataFile.size
          } : null
        },
        content: {
          images: imageUrls,
          generation_id: generationId,
          full_prompt: prompt,
          custom_fields: {
            aggregation_type: custom_aggregation_type || undefined,
            purpose: custom_purpose || undefined,
            orientation: custom_orientation || undefined,
            art_direction: custom_art_direction || undefined,
            background_texture: custom_background_texture || undefined,
            mood_context: custom_mood_context || undefined,
            color_palette: custom_color_palette || undefined,
            palette_mode: custom_palette_mode || undefined,
            background: custom_background || undefined,
            font_family: custom_font_family || undefined,
            label_placement: custom_label_placement || undefined,
            gridlines: custom_gridlines || undefined,
            layout_template: custom_layout_template || undefined,
            export_preset: custom_export_preset || undefined,
            tone: custom_tone || undefined,
            platform: custom_platform || undefined
          },
          settings: {
            title,
            description,
            prompt,
            dataSource,
            autoDetected,
            aggregationType,
            units,
            labels,
            purpose,
            chartType,
            axisMapping,
            multiSeries,
            orientation,
            artDirection,
            visualInfluence,
            chartDepth,
            backgroundTexture,
            accentShapes,
            moodContext,
            toneIntensity,
            lightingTemperature,
            motionAccent,
            brandSync,
            paletteMode,
            backgroundType,
            fontFamily,
            logoPlacement,
            logoDescription,
            dataLabels,
            labelPlacement,
            legends,
            callouts,
            calloutThreshold,
            tooltipStyle,
            axisTitles,
            gridlines,
            layoutTemplate,
            aspectRatio,
            marginDensity,
            safeZoneOverlay,
            headline,
            caption,
            tone,
            platform
          }
        }
      }
    
    console.log('📝 Chart data to insert:', JSON.stringify(chartData, null, 2))
    
    const { data: chartRecord, error: chartError } = await supabase
      .from('charts_infographics')
      .insert(chartData)
      .select()
      .single()

    if (chartError) {
      console.error('❌ Error saving to charts_infographics table:', chartError)
      console.error('❌ Full error details:', JSON.stringify(chartError, null, 2))
      // Continue even if this fails
    } else {
      console.log('✅ Chart saved to charts_infographics table:', chartRecord.id)
      console.log('✅ Chart record:', JSON.stringify(chartRecord, null, 2))
      
      // Add to library_items table
      const { error: libraryError } = await supabase
        .from('library_items')
        .insert({
          user_id: user.id,
          content_type: 'charts_infographics',
          content_id: chartRecord.id,
          date_added_to_library: new Date().toISOString()
        })

      if (libraryError) {
        console.error('Failed to add chart to library:', libraryError)
      } else {
        console.log(`✅ Chart ${chartRecord.id} added to library`)
      }
    }

    // Build response
    const response = {
      success: true,
      images: imageUrls,
      metadata: {
        generationId,
        timestamp: generationTimestamp,
        settings: {
          title,
          prompt,
          dataSource,
          chartType,
          artDirection,
          visualInfluence,
          dataFile: dataFile ? `${dataFile.name} (${dataFile.type})` : 'none',
          logoFile: logoImagePath ? 'uploaded' : 'none'
        }
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
