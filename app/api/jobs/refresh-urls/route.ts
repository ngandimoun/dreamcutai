import { NextRequest, NextResponse } from 'next/server'
import { refreshExpiringUrls, getCacheStatistics } from '@/lib/jobs/refresh-signed-urls'

/**
 * Refresh expiring signed URLs
 * This endpoint should be called periodically by a cron job or similar scheduler
 * 
 * Can be triggered via:
 * - Vercel Cron Jobs
 * - External cron service
 * - Manual trigger for testing
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify authorization token for security
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting signed URL refresh job...')
    
    const result = await refreshExpiringUrls()
    
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in refresh-urls endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to refresh URLs' },
      { status: 500 }
    )
  }
}

/**
 * Get cache statistics
 */
export async function GET() {
  try {
    const stats = await getCacheStatistics()
    
    return NextResponse.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting cache statistics:', error)
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    )
  }
}



