import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobId = params.jobId

    // Fetch the job details
    const { data: job, error: jobError } = await supabase
      .from('explainers')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id) // Ensure user can only access their own jobs
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // If the job is completed and has an output URL, create a signed download URL
    let downloadUrl = null
    if (job.status === 'completed' && job.output_url) {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('dreamcut')
        .createSignedUrl(job.output_url, 86400) // 24 hour expiration
      
      if (!signedUrlError && signedUrlData) {
        downloadUrl = signedUrlData.signedUrl
      }
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        status: job.status,
        duration: job.duration,
        style: job.style,
        created_at: job.created_at,
        updated_at: job.updated_at,
        metadata: job.metadata,
        downloadUrl: downloadUrl
      }
    })

  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
