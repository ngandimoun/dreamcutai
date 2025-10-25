/**
 * Smart Prompt Field Filtering Utility
 * 
 * This utility helps filter fields by:
 * 1. Only including fields the user actually filled out
 * 2. Excluding metadata fields that don't contribute to creative output
 * 3. Excluding empty/default values
 */

// Fields that should never be sent to generation APIs (metadata only)
const METADATA_FIELDS = [
  'title',
  'name', 
  'worldName',
  'model',
  'aspectRatio',
  'projectTitle',
  'timestamp',
  'metadata',
  'logoFile',
  'logoImage',
  'referenceImages',
  'csvFile',
  'logoUpload',
  'referenceImage_0',
  'referenceImage_1', 
  'referenceImage_2',
  'selectedArtifact'
]

// Default placeholder values that should be filtered out
const DEFAULT_PLACEHOLDERS = [
  '',
  'none',
  'auto',
  'default',
  'select',
  'choose',
  'placeholder'
]

/**
 * Checks if a value should be considered "filled" by the user
 */
function isValueFilled(value: any): boolean {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return false
  }

  // Handle empty strings
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 && !DEFAULT_PLACEHOLDERS.includes(trimmed.toLowerCase())
  }

  // Handle empty arrays
  if (Array.isArray(value)) {
    return value.length > 0
  }

  // Handle booleans - false is a valid user choice
  if (typeof value === 'boolean') {
    return true
  }

  // Handle numbers - 0 is a valid user choice, but check for NaN
  if (typeof value === 'number') {
    return !isNaN(value)
  }

  // Handle objects - check if it has any properties
  if (typeof value === 'object') {
    return Object.keys(value).length > 0
  }

  // For other types, consider them filled if they exist
  return true
}

/**
 * Filters out empty/default values and metadata fields from a fields object
 */
export function filterFilledFields(
  fields: Record<string, any>,
  additionalExcludeFields: string[] = []
): Record<string, any> {
  const excludeFields = [...METADATA_FIELDS, ...additionalExcludeFields]
  
  const filtered: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(fields)) {
    // Skip metadata fields
    if (excludeFields.includes(key)) {
      continue
    }
    
    // Only include filled values
    if (isValueFilled(value)) {
      filtered[key] = value
    }
  }
  
  return filtered
}


/**
 * Helper function to get all field names that would be excluded by default
 */
export function getDefaultExcludeFields(): string[] {
  return [...METADATA_FIELDS]
}

/**
 * Helper function to check if a field should be excluded
 */
export function isExcludedField(fieldName: string, additionalExcludeFields: string[] = []): boolean {
  const excludeFields = [...METADATA_FIELDS, ...additionalExcludeFields]
  return excludeFields.includes(fieldName)
}
