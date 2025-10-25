import { NextRequest, NextResponse } from 'next/server'
import { runFullHealthCheck } from '@/lib/health/health-checker'

/**
 * GET /api/health - Get system health status
 * 
 * Returns comprehensive health check report including:
 * - Database health (tables, RLS)
 * - Storage health (bucket, folders, files)
 * - Integration health (library API, cache)
 * - Data consistency (orphaned items, broken references)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🏥 Health check requested')
    
    const report = await runFullHealthCheck()
    
    return NextResponse.json(report, {
      status: report.status === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': report.status
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

