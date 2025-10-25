import { createClient } from '@/lib/supabase/server'
import { signedUrlCache } from '@/lib/cache/signed-url-cache'
import type { HealResult, HealReport } from './types'
import { TABLE_TO_FOLDER_MAP } from './types'

/**
 * Remove orphaned library_items that reference deleted content
 */
export async function healOrphanedLibraryItems(): Promise<HealResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        category: 'orphaned_items',
        success: false,
        itemsHealed: 0,
        message: 'Unauthorized: No user session',
        errors: [userError?.message || 'No user']
      }
    }
    
    // Get all library items for this user
    const { data: libraryItems, error: fetchError } = await supabase
      .from('library_items')
      .select('id, content_type, content_id')
      .eq('user_id', user.id)
    
    if (fetchError || !libraryItems) {
      return {
        category: 'orphaned_items',
        success: false,
        itemsHealed: 0,
        message: `Failed to fetch library items: ${fetchError?.message}`,
        errors: [fetchError?.message || 'Unknown error']
      }
    }
    
    const orphanedIds: string[] = []
    const errors: string[] = []
    
    // Check each library item
    for (const item of libraryItems) {
      try {
        const { data, error } = await supabase
          .from(item.content_type)
          .select('id')
          .eq('id', item.content_id)
          .eq('user_id', user.id)
          .single()
        
        if (error || !data) {
          orphanedIds.push(item.id)
        }
      } catch (error) {
        errors.push(`Error checking ${item.content_type}:${item.content_id}: ${error instanceof Error ? error.message : 'Unknown'}`)
      }
    }
    
    // Delete orphaned items
    if (orphanedIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('library_items')
        .delete()
        .in('id', orphanedIds)
      
      if (deleteError) {
        return {
          category: 'orphaned_items',
          success: false,
          itemsHealed: 0,
          message: `Failed to delete orphaned items: ${deleteError.message}`,
          errors: [deleteError.message, ...errors]
        }
      }
    }
    
    return {
      category: 'orphaned_items',
      success: true,
      itemsHealed: orphanedIds.length,
      message: `Removed ${orphanedIds.length} orphaned library item(s)`,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    return {
      category: 'orphaned_items',
      success: false,
      itemsHealed: 0,
      message: `Heal orphaned items failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Create missing storage folders for content types
 */
export async function healStorageFolders(): Promise<HealResult> {
  try {
    const supabase = await createClient()
    
    const expectedFolders = Object.values(TABLE_TO_FOLDER_MAP)
    
    // List existing folders
    const { data: existingFolders, error: listError } = await supabase.storage
      .from('dreamcut')
      .list('renders', { limit: 100 })
    
    if (listError) {
      return {
        category: 'storage_folders',
        success: false,
        itemsHealed: 0,
        message: `Failed to list storage folders: ${listError.message}`,
        errors: [listError.message]
      }
    }
    
    const existingFolderNames = existingFolders?.map(f => f.name).filter(name => name !== '.keep') || []
    const missingFolders = expectedFolders.filter(f => !existingFolderNames.includes(f))
    
    if (missingFolders.length === 0) {
      return {
        category: 'storage_folders',
        success: true,
        itemsHealed: 0,
        message: 'All storage folders exist'
      }
    }
    
    // Create missing folders by uploading .keep files
    const errors: string[] = []
    let created = 0
    
    for (const folder of missingFolders) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('dreamcut')
          .upload(`renders/${folder}/.keep`, new Blob([''], { type: 'text/plain' }), {
            cacheControl: '3600',
            upsert: false
          })
        
        if (uploadError && !uploadError.message.includes('already exists')) {
          errors.push(`Failed to create ${folder}: ${uploadError.message}`)
        } else {
          created++
        }
      } catch (error) {
        errors.push(`Error creating ${folder}: ${error instanceof Error ? error.message : 'Unknown'}`)
      }
    }
    
    return {
      category: 'storage_folders',
      success: created > 0 || errors.length === 0,
      itemsHealed: created,
      message: `Created ${created} missing folder(s)`,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    return {
      category: 'storage_folders',
      success: false,
      itemsHealed: 0,
      message: `Heal storage folders failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Fix broken content references in library_items
 */
export async function healBrokenReferences(): Promise<HealResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        category: 'broken_references',
        success: false,
        itemsHealed: 0,
        message: 'Unauthorized: No user session',
        errors: [userError?.message || 'No user']
      }
    }
    
    // Get all library items
    const { data: libraryItems, error: fetchError } = await supabase
      .from('library_items')
      .select('id, content_type, content_id')
      .eq('user_id', user.id)
    
    if (fetchError || !libraryItems) {
      return {
        category: 'broken_references',
        success: false,
        itemsHealed: 0,
        message: `Failed to fetch library items: ${fetchError?.message}`,
        errors: [fetchError?.message || 'Unknown error']
      }
    }
    
    const validContentTypes = Object.keys(TABLE_TO_FOLDER_MAP)
    const invalidItems: string[] = []
    
    // Find items with invalid content types
    for (const item of libraryItems) {
      if (!validContentTypes.includes(item.content_type)) {
        invalidItems.push(item.id)
      }
    }
    
    // Remove items with invalid content types
    if (invalidItems.length > 0) {
      const { error: deleteError } = await supabase
        .from('library_items')
        .delete()
        .in('id', invalidItems)
      
      if (deleteError) {
        return {
          category: 'broken_references',
          success: false,
          itemsHealed: 0,
          message: `Failed to remove items with invalid references: ${deleteError.message}`,
          errors: [deleteError.message]
        }
      }
    }
    
    return {
      category: 'broken_references',
      success: true,
      itemsHealed: invalidItems.length,
      message: `Fixed ${invalidItems.length} broken reference(s)`
    }
  } catch (error) {
    return {
      category: 'broken_references',
      success: false,
      itemsHealed: 0,
      message: `Heal broken references failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Clear stale cache entries and rebuild if needed
 */
export async function healCache(): Promise<HealResult> {
  try {
    // Clear the signed URL cache
    const initialSize = signedUrlCache.size()
    signedUrlCache.clear()
    
    return {
      category: 'cache',
      success: true,
      itemsHealed: initialSize,
      message: `Cleared ${initialSize} cached signed URL(s)`
    }
  } catch (error) {
    return {
      category: 'cache',
      success: false,
      itemsHealed: 0,
      message: `Heal cache failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Reset stuck processing records
 */
export async function healStuckProcessing(): Promise<HealResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        category: 'stuck_processing',
        success: false,
        itemsHealed: 0,
        message: 'Unauthorized: No user session',
        errors: [userError?.message || 'No user']
      }
    }
    
    const validContentTypes = Object.keys(TABLE_TO_FOLDER_MAP)
    let totalFixed = 0
    const errors: string[] = []
    
    // Check each content table for stuck processing records
    for (const contentType of validContentTypes) {
      try {
        // Find records stuck in processing for > 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
        
        const { data: stuckRecords, error: fetchError } = await supabase
          .from(contentType)
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'processing')
          .lt('updated_at', oneHourAgo)
        
        if (fetchError) {
          errors.push(`Error checking ${contentType}: ${fetchError.message}`)
          continue
        }
        
        if (stuckRecords && stuckRecords.length > 0) {
          const ids = stuckRecords.map(r => r.id)
          
          // Mark as failed
          const { error: updateError } = await supabase
            .from(contentType)
            .update({ 
              status: 'failed',
              metadata: { 
                auto_failed: true,
                reason: 'Processing timeout (> 1 hour)',
                failed_at: new Date().toISOString()
              }
            })
            .in('id', ids)
          
          if (updateError) {
            errors.push(`Error updating ${contentType}: ${updateError.message}`)
          } else {
            totalFixed += ids.length
          }
        }
      } catch (error) {
        errors.push(`Error processing ${contentType}: ${error instanceof Error ? error.message : 'Unknown'}`)
      }
    }
    
    return {
      category: 'stuck_processing',
      success: totalFixed > 0 || errors.length === 0,
      itemsHealed: totalFixed,
      message: `Fixed ${totalFixed} stuck processing record(s)`,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    return {
      category: 'stuck_processing',
      success: false,
      itemsHealed: 0,
      message: `Heal stuck processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Run all healing operations
 */
export async function healAll(categories?: string[], dryRun = false): Promise<HealReport> {
  console.log(`🔧 Starting auto-heal... (dry run: ${dryRun})`)
  
  const results: HealResult[] = []
  const categoriesToHeal = categories || [
    'orphaned_items',
    'storage_folders',
    'broken_references',
    'stuck_processing',
    'cache'
  ]
  
  if (!dryRun) {
    if (categoriesToHeal.includes('orphaned_items')) {
      results.push(await healOrphanedLibraryItems())
    }
    
    if (categoriesToHeal.includes('storage_folders')) {
      results.push(await healStorageFolders())
    }
    
    if (categoriesToHeal.includes('broken_references')) {
      results.push(await healBrokenReferences())
    }
    
    if (categoriesToHeal.includes('stuck_processing')) {
      results.push(await healStuckProcessing())
    }
    
    if (categoriesToHeal.includes('cache')) {
      results.push(await healCache())
    }
  } else {
    // Dry run - just report what would be done
    results.push({
      category: 'dry_run',
      success: true,
      itemsHealed: 0,
      message: 'Dry run - no changes made'
    })
  }
  
  const totalItemsHealed = results.reduce((sum, r) => sum + r.itemsHealed, 0)
  const allSuccess = results.every(r => r.success)
  
  console.log(`🔧 Auto-heal complete. Healed ${totalItemsHealed} item(s)`)
  
  return {
    timestamp: new Date().toISOString(),
    results,
    totalItemsHealed,
    success: allSuccess
  }
}

