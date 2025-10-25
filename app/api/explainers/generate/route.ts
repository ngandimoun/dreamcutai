import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateManimCodeWithRetry, handleTTSFailure } from '@/lib/manim/self-healing'
import { ManimGenerationOptions } from '@/lib/manim/claude-prompts'
import { getUserFriendlyError } from '@/lib/manim/error-messages'
import { reportBug } from '@/lib/manim/bug-reporter'

// Language detection helper
function detectLanguage(text: string): string {
  const lowerText = text.toLowerCase();
  
  // French detection
  const frenchKeywords = ['fais', 'faire', 'une', 'dans', 'pour', 'avec', 'français', 'francais', 'animation', 'vidéo', 'explication'];
  const frenchCount = frenchKeywords.filter(keyword => lowerText.includes(keyword)).length;
  
  // Spanish detection
  const spanishKeywords = ['hace', 'hacer', 'una', 'para', 'con', 'español', 'animación', 'vídeo', 'explicación'];
  const spanishCount = spanishKeywords.filter(keyword => lowerText.includes(keyword)).length;
  
  // Arabic detection (check for Arabic characters)
  const arabicRegex = /[\u0600-\u06FF]/;
  if (arabicRegex.test(text)) {
    return 'arabic';
  }
  
  // Japanese detection (check for Japanese characters)
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  if (japaneseRegex.test(text)) {
    return 'japanese';
  }
  
  // Determine language based on keyword counts
  if (frenchCount >= 2) {
    return 'french';
  }
  if (spanishCount >= 2) {
    return 'spanish';
  }
  
  // Default to English
  return 'english';
}

// Validation schema for explainer generation
const generateExplainerSchema = z.object({
  title: z.string().min(3).max(100),
  prompt: z.string().min(10).max(5000), // Increased from 2000 to support detailed prompts
  hasVoiceover: z.boolean().default(false),
  voiceStyle: z.string().default('fable'),
  language: z.string().optional(), // Language will be auto-detected from prompt
  duration: z.number().min(1).max(180).default(8),
  aspectRatio: z.string().default('16:9'),
  resolution: z.string().default('720p'),
  style: z.string().default('auto'),
})

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Explainer generation API called')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    console.log('📥 Raw request body:', body)
    
    let validatedData;
    try {
      validatedData = generateExplainerSchema.parse(body)
    } catch (validationError) {
      console.error('❌ Validation error:', validationError)
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: validationError.errors || validationError.message 
      }, { status: 400 })
    }

    // Auto-detect language from prompt if not provided
    if (!validatedData.language) {
      validatedData.language = detectLanguage(validatedData.prompt);
      console.log(`🌍 Auto-detected language: ${validatedData.language}`);
    }

    console.log('📝 Generation request:', {
      title: validatedData.title,
      prompt: validatedData.prompt,
      hasVoiceover: validatedData.hasVoiceover,
      voiceStyle: validatedData.voiceStyle,
      language: validatedData.language,
      duration: validatedData.duration,
      aspectRatio: validatedData.aspectRatio,
      resolution: validatedData.resolution,
      style: validatedData.style
    })

    // Create job record in database (let Supabase generate UUID)
    const { data: job, error: jobError } = await supabase
      .from('explainers')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        prompt: validatedData.prompt,
        has_voiceover: validatedData.hasVoiceover,
        voice_style: validatedData.voiceStyle,
        duration: validatedData.duration,
        aspect_ratio: validatedData.aspectRatio,
        resolution: validatedData.resolution,
        style: validatedData.style,
        status: 'draft',
        metadata: {
          language: validatedData.language,
          original_prompt: validatedData.prompt
        }
      })
      .select()
      .single()

    if (jobError) {
      console.error('❌ Error creating job:', jobError)
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
    }

    const jobId = job.id

    // Create Supabase signed upload URL
    const fileName = `renders/explainers/${user.id}/${jobId}.mp4`
    
    // Try to create signed upload URL with proper error handling
    let uploadData, uploadError;
    
    try {
      const result = await supabase.storage
        .from('dreamcut')
        .createSignedUploadUrl(fileName, {
          upsert: false, // Don't overwrite existing files
          expiresIn: 3600 // 1 hour expiration (3600 seconds)
        });
      
      uploadData = result.data;
      uploadError = result.error;
    } catch (err) {
      console.error('❌ Storage API error:', err);
      uploadError = err;
    }

    if (uploadError || !uploadData) {
      console.error('❌ Error creating upload URL:', uploadError)
      
      // If RLS policy fails, try a different approach - create a temporary file first
      try {
        // Create an empty file to establish the path
        const { error: createError } = await supabase.storage
          .from('dreamcut')
          .upload(fileName, new Blob(['']), {
            contentType: 'video/mp4',
            upsert: true
          });
        
        if (createError) {
          console.error('❌ Error creating placeholder file:', createError)
          return NextResponse.json({ 
            error: 'Storage access denied. Please check your Supabase Storage RLS policies.',
            details: uploadError?.message || createError?.message
          }, { status: 500 })
        }
        
        // Now try to get the signed URL again
        const retryResult = await supabase.storage
          .from('dreamcut')
          .createSignedUploadUrl(fileName, {
            expiresIn: 3600 // 1 hour expiration (3600 seconds)
          });
        
        uploadData = retryResult.data;
        uploadError = retryResult.error;
        
        if (uploadError || !uploadData) {
          return NextResponse.json({ 
            error: 'Failed to create upload URL after retry',
            details: uploadError?.message
          }, { status: 500 })
        }
      } catch (retryErr) {
        return NextResponse.json({ 
          error: 'Storage configuration issue',
          details: retryErr instanceof Error ? retryErr.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    // Update job with upload URL and storage path
    await supabase
      .from('explainers')
      .update({ 
        output_url: fileName,
        storage_path: fileName,
        status: 'processing'
      })
      .eq('id', jobId)

    // Start async generation process
    generateExplainerAsync(
      validatedData as ManimGenerationOptions,
      supabase,
      jobId,
      uploadData.signedUrl,
      user.id
    ).catch(error => {
      console.error('❌ Async generation failed:', error)
      // Update job status to failed
      supabase
        .from('explainers')
        .update({ 
          status: 'failed',
          last_error: error.message,
          metadata: {
            async_generation_failed: true,
            error_type: 'async_generation_error'
          }
        })
        .eq('id', jobId)
    })

    // Return job ID immediately
    return NextResponse.json({ 
      success: true, 
      jobId,
      message: 'Generation started'
    }, { status: 202 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/explainers/generate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Async function to handle the actual generation
async function generateExplainerAsync(
  options: ManimGenerationOptions,
  supabase: any,
  jobId: string,
  uploadUrl: string,
  userId: string
) {
  try {
    console.log(`🎬 Starting generation for job ${jobId}`)
    
    // Update status to processing
    await supabase
      .from('explainers')
      .update({ status: 'processing' })
      .eq('id', jobId)

    // Generate with self-healing retry logic
    const result = await generateManimCodeWithRetry(
      options,
      supabase,
      jobId,
      uploadUrl,
      5 // Max 5 retry attempts
    )

    if (result.success) {
      console.log(`✅ Generation completed successfully for job ${jobId}`)
      
      // Update final status
      await supabase
        .from('explainers')
        .update({
          status: 'completed',
          manim_code: result.code,
          logs: result.logs,
          stderr: result.stderr,
          retry_count: result.retryCount,
          metadata: {
            generation_completed: true,
            final_retry_count: result.retryCount
          }
        })
        .eq('id', jobId)

      // Add to library_items table with correct schema
      const { error: libraryError } = await supabase
        .from('library_items')
        .insert({
          user_id: userId,
          content_type: 'explainers',  // Changed from item_type
          content_id: jobId,           // Changed from item_id
          // Removed: title, description, image_url, created_at (not in schema)
        })

      if (libraryError) {
        console.error('Failed to add explainer to library:', libraryError)
      } else {
        console.log(`✅ Explainer ${jobId} added to library`)
      }
    } else {
      console.log(`❌ Generation failed for job ${jobId}: ${result.error}`)
      
      // Try TTS fallback if voiceover was enabled and we haven't tried it yet
      if (options.hasVoiceover && !result.error?.includes('voiceover')) {
        console.log('🎙️ Attempting TTS fallback...')
        
        const fallbackResult = await handleTTSFailure(
          options,
          supabase,
          jobId,
          uploadUrl
        )
        
        if (fallbackResult.success) {
          console.log(`✅ TTS fallback successful for job ${jobId}`)
          return
        }
      }
      
      // Get user-friendly error message
      const friendlyError = getUserFriendlyError(result.error || 'Unknown error')
      console.log('📋 User-friendly error:', friendlyError)
      
      // Report bug automatically for analysis
      try {
        await reportBug({
          type: 'manim_render_failure',
          userPrompt: options.prompt,
          generatedCode: result.code || '',
          technicalError: result.error || 'Unknown error',
          errorCategory: friendlyError.category,
          errorSeverity: friendlyError.severity,
          userId: userId,
          attemptNumber: result.retryCount || 0,
          timestamp: new Date(),
          metadata: {
            duration: options.duration,
            style: options.style,
            aspectRatio: options.aspectRatio,
            resolution: options.resolution,
            hasVoiceover: options.hasVoiceover,
            voiceStyle: options.voiceStyle,
            language: options.language
          }
        })
      } catch (bugReportError) {
        console.error('Failed to report bug:', bugReportError)
        // Don't fail the request if bug reporting fails
      }
      
      // Update final failed status with user-friendly message
      await supabase
        .from('explainers')
        .update({
          status: 'failed',
          last_error: friendlyError.message,
          retry_count: result.retryCount,
          metadata: {
            technical_error: result.error,
            error_details: {
              technical: process.env.NODE_ENV === 'development' ? result.error : undefined,
              suggestion: friendlyError.suggestion,
              category: friendlyError.category,
              severity: friendlyError.severity
            }
          }
        })
        .eq('id', jobId)
    }
  } catch (error) {
    console.error(`❌ Unexpected error in generation for job ${jobId}:`, error)
    
    // Update job as failed
    await supabase
      .from('explainers')
      .update({
        status: 'failed',
        last_error: (error as Error).message,
        metadata: {
          unexpected_error: true,
          error_type: 'unexpected_error'
        }
      })
      .eq('id', jobId)
  }
}

// GET endpoint to check job status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get job ID from query params
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    // Fetch job status
    const { data: job, error } = await supabase
      .from('explainers')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ job }, { status: 200 })

  } catch (error) {
    console.error('Unexpected error in GET /api/explainers/generate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
