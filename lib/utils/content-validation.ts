/**
 * Content Validation Utilities
 * 
 * Detects potentially problematic content that Suno API might reject,
 * such as artist names, brand names, or other policy violations.
 */

// Common artist names that Suno typically rejects
const COMMON_ARTIST_NAMES = [
  // Hip-Hop/Rap
  'drake', 'kanye', 'eminem', 'kendrick lamar', 'j cole', 'travis scott', 
  'lil wayne', 'tyga', 'nicki minaj', 'cardi b', 'megan thee stallion', 
  'doja cat', 'lil baby', 'lil nas x', 'post malone', 'juice wrld',
  'xxxtentacion', 'lil peep', 'mac miller', 'pop smoke', 'lil tjay',
  'polo g', 'lil durk', 'roddy ricch', 'jack harlow', 'lil tecca',
  
  // Pop
  'taylor swift', 'ariana grande', 'justin bieber', 'billie eilish', 
  'dua lipa', 'olivia rodrigo', 'harry styles', 'selena gomez',
  'miley cyrus', 'demi lovato', 'lady gaga', 'katy perry',
  'rihanna', 'beyonce', 'adele', 'ed sheeran', 'bruno mars',
  'the weeknd', 'shawn mendes', 'camila cabello', 'halsey',
  
  // Rock/Alternative
  'coldplay', 'radiohead', 'arctic monkeys', 'imagine dragons',
  'twenty one pilots', 'panic at the disco', 'fall out boy',
  'green day', 'blink-182', 'linkin park', 'nirvana',
  
  // Country
  'taylor swift', 'luke combs', 'morgan wallen', 'kane brown',
  'maren morris', 'kacey musgraves', 'blake shelton',
  
  // Electronic/Dance
  'skrillex', 'deadmau5', 'calvin harris', 'david guetta',
  'martin garrix', 'marshmello', 'alan walker',
  
  // R&B/Soul
  'the weeknd', 'frank ocean', 'sza', 'h.e.r.', 'daniel caesar',
  'giveon', 'lucky daye', 'snoh aalegra',
  
  // Latin
  'bad bunny', 'j balvin', 'maluma', 'karol g', 'anitta',
  'shakira', 'jennifer lopez', 'ricky martin',
  
  // K-Pop
  'bts', 'blackpink', 'twice', 'itzy', 'aespa', 'newjeans',
  'stray kids', 'seventeen', 'txt', 'enhypen',
  
  // Add more as needed...
]

// Brand names that might cause issues
const BRAND_NAMES = [
  'nike', 'adidas', 'apple', 'google', 'microsoft', 'amazon',
  'spotify', 'youtube', 'instagram', 'tiktok', 'twitter',
  'facebook', 'netflix', 'disney', 'marvel', 'dc comics',
  'coca cola', 'pepsi', 'mcdonalds', 'starbucks',
  // Add more as needed...
]

/**
 * Detects artist names in text
 */
export function detectArtistNames(text: string): {
  hasArtistNames: boolean
  detectedNames: string[]
  suggestion: string
} {
  const lowerText = text.toLowerCase()
  const detected: string[] = []
  
  for (const artist of COMMON_ARTIST_NAMES) {
    if (lowerText.includes(artist.toLowerCase())) {
      detected.push(artist)
    }
  }
  
  return {
    hasArtistNames: detected.length > 0,
    detectedNames: detected,
    suggestion: detected.length > 0 
      ? `Try using genre/style descriptions instead of artist names. For example: "trap style with energetic flow" instead of mentioning specific artists.`
      : ''
  }
}

/**
 * Detects brand names in text
 */
export function detectBrandNames(text: string): {
  hasBrandNames: boolean
  detectedNames: string[]
  suggestion: string
} {
  const lowerText = text.toLowerCase()
  const detected: string[] = []
  
  for (const brand of BRAND_NAMES) {
    if (lowerText.includes(brand.toLowerCase())) {
      detected.push(brand)
    }
  }
  
  return {
    hasBrandNames: detected.length > 0,
    detectedNames: detected,
    suggestion: detected.length > 0 
      ? `Avoid mentioning specific brand names. Try describing the style or vibe instead.`
      : ''
  }
}

/**
 * Detects potentially problematic content
 */
export function detectProblematicContent(text: string): {
  hasIssues: boolean
  issues: string[]
  suggestions: string[]
  severity: 'low' | 'medium' | 'high'
} {
  const issues: string[] = []
  const suggestions: string[] = []
  let severity: 'low' | 'medium' | 'high' = 'low'
  
  // Check for artist names
  const artistCheck = detectArtistNames(text)
  if (artistCheck.hasArtistNames) {
    issues.push(`Contains artist names: ${artistCheck.detectedNames.join(', ')}`)
    suggestions.push(artistCheck.suggestion)
    severity = 'high' // Artist names almost always cause rejection
  }
  
  // Check for brand names
  const brandCheck = detectBrandNames(text)
  if (brandCheck.hasBrandNames) {
    issues.push(`Contains brand names: ${brandCheck.detectedNames.join(', ')}`)
    suggestions.push(brandCheck.suggestion)
    severity = severity === 'high' ? 'high' : 'medium'
  }
  
  // Check for potentially problematic phrases
  const problematicPhrases = [
    'sound like', 'copy', 'imitate', 'similar to', 'in the style of',
    'cover of', 'version of', 'remake of', 'tribute to'
  ]
  
  const lowerText = text.toLowerCase()
  const foundPhrases = problematicPhrases.filter(phrase => lowerText.includes(phrase))
  
  if (foundPhrases.length > 0) {
    issues.push(`Contains potentially problematic phrases: ${foundPhrases.join(', ')}`)
    suggestions.push('Try describing the musical style directly instead of comparing to existing works.')
    severity = severity === 'high' ? 'high' : 'medium'
  }
  
  return {
    hasIssues: issues.length > 0,
    issues,
    suggestions,
    severity
  }
}

/**
 * Get a user-friendly warning message for problematic content
 */
export function getContentWarningMessage(contentCheck: ReturnType<typeof detectProblematicContent>): string {
  if (!contentCheck.hasIssues) {
    return ''
  }
  
  const severityEmoji = {
    low: '⚠️',
    medium: '🚨',
    high: '🚫'
  }
  
  const severityText = {
    low: 'Minor Issues',
    medium: 'Potential Issues',
    high: 'High Risk of Rejection'
  }
  
  return `${severityEmoji[contentCheck.severity]} ${severityText[contentCheck.severity]} Detected:\n\n` +
         contentCheck.issues.join('\n') + '\n\n' +
         'Suggestions:\n' +
         contentCheck.suggestions.join('\n\n') + '\n\n' +
         'Suno may reject this generation. Continue anyway?'
}

/**
 * Check if content is likely to be rejected by Suno
 */
export function isLikelyToBeRejected(text: string): boolean {
  const check = detectProblematicContent(text)
  return check.severity === 'high' || (check.severity === 'medium' && check.hasIssues)
}
