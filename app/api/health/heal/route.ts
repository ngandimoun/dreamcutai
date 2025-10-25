import { NextRequest, NextResponse } from 'next/server'
import { healAll } from '@/lib/health/auto-heal'
import { z } from 'zod'

const healRequestSchema = z.object({
  categories: z.array(z.enum([
    'orphaned_items',
    'storage_folders',
    'broken_references',
    'stuck_processing',
    'cache'
  ])).optional(),
  dryRun: z.boolean().optional().default(false)
})

/**
 * POST /api/health/heal - Trigger self-healing mechanisms
 * 
 * Request body:
 * {
 *   "categories": ["orphaned_items", "cache"],  // optional, defaults to all
 *   "dryRun": false  // optional, defaults to false
 * }
 * 
 * Returns report of healing actions taken
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    let validatedData
    try {
      validatedData = healRequestSchema.parse(body)
    } catch (validationError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationError instanceof z.ZodError ? validationError.errors : 'Unknown validation error'
        },
        { status: 400 }
      )
    }
    
    console.log('🔧 Auto-heal requested:', validatedData)
    
    const report = await healAll(validatedData.categories, validatedData.dryRun)
    
    return NextResponse.json(report, {
      status: report.success ? 200 : 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('Auto-heal failed:', error)
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        results: [],
        totalItemsHealed: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

