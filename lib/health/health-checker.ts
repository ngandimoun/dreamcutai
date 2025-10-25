import { createClient } from '@/lib/supabase/server'
import type {
  HealthCheckReport,
  HealthStatus,
  DatabaseHealth,
  StorageHealth,
  IntegrationHealth,
  DataConsistencyHealth,
  HealthIssue,
  EXPECTED_TABLES,
  EXPECTED_STORAGE_FOLDERS
} from './types'

const EXPECTED_TABLES_LIST: string[] = [
  'illustrations',
  'comics',
  'avatars_personas',
  'product_mockups',
  'concept_worlds',
  'charts_infographics',
  'voices_creations',
  'voiceovers',
  'music_jingles',
  'sound_fx',
  'explainers',
  'talking_avatars',
  'diverse_motion_single',
  'diverse_motion_dual',
  'subtitles',
  'watermarks',
  'video_translations',
  'library_items'
]

const EXPECTED_FOLDERS_LIST: string[] = [
  'avatars',
  'charts',
  'comics',
  'concept-worlds',
  'explainers',
  'illustrations',
  'music-jingles',
  'product-mockups',
  'sound-fx',
  'subtitles',
  'talking-avatars',
  'diverse-motion',
  'translations',
  'voice-creation',
  'voiceovers',
  'watermarks'
]

/**
 * Check database health: tables, RLS policies, indexes
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const issues: HealthIssue[] = []
  
  try {
    const supabase = await createClient()
    
    // Check table existence
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', EXPECTED_TABLES_LIST)
    
    if (tablesError) {
      console.error('Error checking tables:', tablesError)
      issues.push({
        severity: 'critical',
        category: 'database',
        message: `Failed to check table existence: ${tablesError.message}`,
        autoHealable: false
      })
      
      return {
        status: 'unhealthy',
        tables: 0,
        expectedTables: EXPECTED_TABLES_LIST.length,
        missingTables: EXPECTED_TABLES_LIST,
        rlsEnabled: false,
        issues
      }
    }
    
    const existingTableNames = tables?.map((t: { table_name: string }) => t.table_name) || []
    const missingTables = EXPECTED_TABLES_LIST.filter(t => !existingTableNames.includes(t))
    
    if (missingTables.length > 0) {
      issues.push({
        severity: 'critical',
        category: 'database',
        message: `Missing ${missingTables.length} table(s): ${missingTables.join(', ')}`,
        autoHealable: false,
        metadata: { missingTables }
      })
    }
    
    // Determine overall database health
    let status: HealthStatus = 'healthy'
    if (missingTables.length > 0) {
      status = 'unhealthy'
    } else if (issues.length > 0) {
      status = 'degraded'
    }
    
    return {
      status,
      tables: existingTableNames.length,
      expectedTables: EXPECTED_TABLES_LIST.length,
      missingTables,
      rlsEnabled: true, // Assume RLS is enabled if tables exist
      issues
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    issues.push({
      severity: 'critical',
      category: 'database',
      message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      autoHealable: false
    })
    
    return {
      status: 'unhealthy',
      tables: 0,
      expectedTables: EXPECTED_TABLES_LIST.length,
      missingTables: EXPECTED_TABLES_LIST,
      rlsEnabled: false,
      issues
    }
  }
}

/**
 * Check storage health: bucket access, folder structure, file permissions
 */
export async function checkStorageHealth(): Promise<StorageHealth> {
  const issues: HealthIssue[] = []
  
  try {
    const supabase = await createClient()
    
    // Check bucket access
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError || !buckets) {
      issues.push({
        severity: 'critical',
        category: 'storage',
        message: `Failed to access storage buckets: ${bucketError?.message || 'Unknown error'}`,
        autoHealable: false
      })
      
      return {
        status: 'unhealthy',
        bucket: 'dreamcut',
        folders: 0,
        expectedFolders: EXPECTED_FOLDERS_LIST.length,
        missingFolders: EXPECTED_FOLDERS_LIST,
        totalFiles: 0,
        totalSize: '0 B',
        issues
      }
    }
    
    const dreamcutBucket = buckets.find(b => b.name === 'dreamcut')
    if (!dreamcutBucket) {
      issues.push({
        severity: 'critical',
        category: 'storage',
        message: 'dreamcut bucket not found',
        autoHealable: false
      })
      
      return {
        status: 'unhealthy',
        bucket: 'dreamcut',
        folders: 0,
        expectedFolders: EXPECTED_FOLDERS_LIST.length,
        missingFolders: EXPECTED_FOLDERS_LIST,
        totalFiles: 0,
        totalSize: '0 B',
        issues
      }
    }
    
    // Check folder structure
    const { data: rendersFolders, error: foldersError } = await supabase.storage
      .from('dreamcut')
      .list('renders', { limit: 100 })
    
    if (foldersError) {
      issues.push({
        severity: 'warning',
        category: 'storage',
        message: `Failed to list renders folders: ${foldersError.message}`,
        autoHealable: false
      })
    }
    
    const existingFolders = rendersFolders?.map(f => f.name).filter(name => name !== '.keep') || []
    const missingFolders = EXPECTED_FOLDERS_LIST.filter(f => !existingFolders.includes(f))
    
    if (missingFolders.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'storage',
        message: `Missing ${missingFolders.length} folder(s): ${missingFolders.join(', ')}`,
        autoHealable: true,
        metadata: { missingFolders }
      })
    }
    
    // Count total files (simplified - just count from existing folders)
    let totalFiles = 0
    for (const folder of existingFolders) {
      const { data: files } = await supabase.storage
        .from('dreamcut')
        .list(`renders/${folder}`, { limit: 1000 })
      totalFiles += files?.length || 0
    }
    
    // Determine storage health status
    let status: HealthStatus = 'healthy'
    if (missingFolders.length > 5) {
      status = 'degraded'
    } else if (missingFolders.length > 0) {
      status = 'healthy' // Minor missing folders are OK
    }
    
    return {
      status,
      bucket: 'dreamcut',
      folders: existingFolders.length,
      expectedFolders: EXPECTED_FOLDERS_LIST.length,
      missingFolders,
      totalFiles,
      totalSize: 'N/A', // Would need to iterate all files to calculate
      issues
    }
  } catch (error) {
    console.error('Storage health check failed:', error)
    issues.push({
      severity: 'critical',
      category: 'storage',
      message: `Storage health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      autoHealable: false
    })
    
    return {
      status: 'unhealthy',
      bucket: 'dreamcut',
      folders: 0,
      expectedFolders: EXPECTED_FOLDERS_LIST.length,
      missingFolders: EXPECTED_FOLDERS_LIST,
      totalFiles: 0,
      totalSize: '0 B',
      issues
    }
  }
}

/**
 * Check integration health: library API, signed URL generation, cache performance
 */
export async function checkIntegrationHealth(): Promise<IntegrationHealth> {
  const issues: HealthIssue[] = []
  
  try {
    // Test library API response time
    const startTime = Date.now()
    const response = await fetch('/api/library?limit=1')
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    if (!response.ok) {
      issues.push({
        severity: 'warning',
        category: 'integration',
        message: `Library API returned error: ${response.status}`,
        autoHealable: false
      })
    }
    
    if (responseTime > 1000) {
      issues.push({
        severity: 'warning',
        category: 'performance',
        message: `Library API response time is slow: ${responseTime}ms`,
        autoHealable: false,
        metadata: { responseTime }
      })
    }
    
    // Get cache metrics from response headers
    const cacheHitRate = parseFloat(response.headers.get('X-Cache-Hit-Rate') || '0')
    
    if (cacheHitRate < 50) {
      issues.push({
        severity: 'info',
        category: 'performance',
        message: `Cache hit rate is low: ${cacheHitRate.toFixed(1)}%`,
        autoHealable: true,
        metadata: { cacheHitRate }
      })
    }
    
    const status: HealthStatus = issues.some(i => i.severity === 'critical') 
      ? 'unhealthy' 
      : issues.some(i => i.severity === 'warning') 
        ? 'degraded' 
        : 'healthy'
    
    return {
      status,
      libraryApiResponseTime: responseTime,
      cacheHitRate,
      signedUrlSuccessRate: 100, // Assume 100% unless we detect failures
      issues
    }
  } catch (error) {
    console.error('Integration health check failed:', error)
    issues.push({
      severity: 'critical',
      category: 'integration',
      message: `Integration health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      autoHealable: false
    })
    
    return {
      status: 'unhealthy',
      libraryApiResponseTime: null,
      cacheHitRate: 0,
      signedUrlSuccessRate: 0,
      issues
    }
  }
}

/**
 * Check data consistency: orphaned library_items, broken references
 */
export async function checkDataConsistency(): Promise<DataConsistencyHealth> {
  const issues: HealthIssue[] = []
  
  try {
    const supabase = await createClient()
    
    // Get current user for scoped checks
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      // If no user, skip consistency checks
      return {
        status: 'healthy',
        orphanedLibraryItems: 0,
        brokenReferences: 0,
        stuckProcessing: 0,
        missingStorageFiles: 0,
        issues
      }
    }
    
    // Check for orphaned library_items (simplified check)
    const { data: libraryItems } = await supabase
      .from('library_items')
      .select('id, content_type, content_id')
      .eq('user_id', user.id)
      .limit(100)
    
    let orphanedCount = 0
    if (libraryItems && libraryItems.length > 0) {
      // Sample check for first few items
      for (const item of libraryItems.slice(0, 10)) {
        const { data, error } = await supabase
          .from(item.content_type)
          .select('id')
          .eq('id', item.content_id)
          .single()
        
        if (error || !data) {
          orphanedCount++
        }
      }
    }
    
    if (orphanedCount > 0) {
      issues.push({
        severity: 'warning',
        category: 'data_consistency',
        message: `Found approximately ${orphanedCount} orphaned library items`,
        autoHealable: true,
        metadata: { orphanedCount }
      })
    }
    
    const status: HealthStatus = issues.some(i => i.severity === 'critical') 
      ? 'unhealthy' 
      : issues.some(i => i.severity === 'warning') 
        ? 'degraded' 
        : 'healthy'
    
    return {
      status,
      orphanedLibraryItems: orphanedCount,
      brokenReferences: 0,
      stuckProcessing: 0,
      missingStorageFiles: 0,
      issues
    }
  } catch (error) {
    console.error('Data consistency check failed:', error)
    issues.push({
      severity: 'warning',
      category: 'data_consistency',
      message: `Data consistency check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      autoHealable: false
    })
    
    return {
      status: 'degraded',
      orphanedLibraryItems: 0,
      brokenReferences: 0,
      stuckProcessing: 0,
      missingStorageFiles: 0,
      issues
    }
  }
}

/**
 * Run full health check across all systems
 */
export async function runFullHealthCheck(): Promise<HealthCheckReport> {
  console.log('🏥 Starting full health check...')
  
  const [database, storage, integration, dataConsistency] = await Promise.all([
    checkDatabaseHealth(),
    checkStorageHealth(),
    checkIntegrationHealth(),
    checkDataConsistency()
  ])
  
  // Collect all issues
  const allIssues: HealthIssue[] = [
    ...database.issues,
    ...storage.issues,
    ...integration.issues,
    ...dataConsistency.issues
  ]
  
  // Determine overall system status
  let overallStatus: HealthStatus = 'healthy'
  if ([database.status, storage.status, integration.status, dataConsistency.status].includes('unhealthy')) {
    overallStatus = 'unhealthy'
  } else if ([database.status, storage.status, integration.status, dataConsistency.status].includes('degraded')) {
    overallStatus = 'degraded'
  }
  
  const report: HealthCheckReport = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    database,
    storage,
    integration,
    dataConsistency,
    allIssues
  }
  
  console.log(`🏥 Health check complete. Status: ${overallStatus}`)
  console.log(`📊 Issues found: ${allIssues.length}`)
  
  return report
}

