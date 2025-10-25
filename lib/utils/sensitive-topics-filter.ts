/**
 * Sensitive Topics Filter for Content Policy Compliance
 * 
 * Detects and filters sensitive topics that may trigger Google Veo content policy violations.
 * Provides suggestions for safer alternatives.
 */

export interface SensitiveKeyword {
  keyword: string
  suggestion: string
  category: string
}

export interface SensitiveTopicMatch {
  keyword: string
  severity: 'high' | 'medium'
  suggestion: string
  category: string
}

export const HIGH_RISK_KEYWORDS: SensitiveKeyword[] = [
  { keyword: 'security checkpoint', suggestion: 'Try "entrance area" or "check-in area"', category: 'Security' },
  { keyword: 'tsa', suggestion: 'Remove security references', category: 'Security' },
  { keyword: 'border control', suggestion: 'Try "entry point"', category: 'Security' },
  { keyword: 'customs', suggestion: 'Try "arrival area"', category: 'Security' },
  { keyword: 'police station', suggestion: 'Try "office building"', category: 'Law Enforcement' },
  { keyword: 'military base', suggestion: 'Try "facility" or "compound"', category: 'Military' },
  { keyword: 'prison', suggestion: 'Try "facility" or different setting', category: 'Law Enforcement' },
  { keyword: 'jail', suggestion: 'Try different setting', category: 'Law Enforcement' },
  { keyword: 'weapon', suggestion: 'Remove weapon references', category: 'Violence' },
  { keyword: 'gun', suggestion: 'Remove weapon references', category: 'Violence' },
  { keyword: 'bomb', suggestion: 'Remove dangerous content', category: 'Violence' },
  { keyword: 'passport', suggestion: 'Remove identity document references', category: 'Identity' },
  { keyword: 'government building', suggestion: 'Try "office building"', category: 'Government' },
  { keyword: 'capitol', suggestion: 'Try "office building"', category: 'Government' },
  { keyword: 'white house', suggestion: 'Try "office building"', category: 'Government' },
  { keyword: 'embassy', suggestion: 'Try "office building"', category: 'Government' },
  { keyword: 'hospital emergency', suggestion: 'Try "medical facility"', category: 'Medical' },
  { keyword: 'surgery', suggestion: 'Try "medical consultation"', category: 'Medical' },
  { keyword: 'bank robbery', suggestion: 'Try different scenario', category: 'Financial' },
  { keyword: 'fraud', suggestion: 'Try different scenario', category: 'Financial' },
  { keyword: 'scam', suggestion: 'Try different scenario', category: 'Financial' },
  { keyword: 'driver\'s license', suggestion: 'Remove identity document references', category: 'Identity' },
  { keyword: 'social security', suggestion: 'Remove identity document references', category: 'Identity' },
]

export const MEDIUM_RISK_KEYWORDS: SensitiveKeyword[] = [
  { keyword: 'airport', suggestion: 'Try "travel hub" or "departure lounge"', category: 'Transportation' },
  { keyword: 'train station', suggestion: 'Try "transit center" or "platform"', category: 'Transportation' },
  { keyword: 'subway station', suggestion: 'Try "underground platform"', category: 'Transportation' },
  { keyword: 'bus terminal', suggestion: 'Try "transit hub"', category: 'Transportation' },
  { keyword: 'journalist', suggestion: 'Try "interviewer" or "host"', category: 'Media' },
  { keyword: 'news reporter', suggestion: 'Try "presenter" or "host"', category: 'Media' },
  { keyword: 'press conference', suggestion: 'Try "media event"', category: 'Media' },
  { keyword: 'protest', suggestion: 'Try "gathering" or "event"', category: 'Crowds' },
  { keyword: 'rally', suggestion: 'Try "gathering" or "event"', category: 'Crowds' },
  { keyword: 'demonstration', suggestion: 'Try "gathering" or "event"', category: 'Crowds' },
  { keyword: 'riot', suggestion: 'Try "crowd" or "group"', category: 'Crowds' },
  { keyword: 'voting', suggestion: 'Try "decision making"', category: 'Politics' },
  { keyword: 'election', suggestion: 'Try "selection process"', category: 'Politics' },
]

/**
 * Check text for sensitive topics and return matches
 */
export function checkForSensitiveTopics(text: string): SensitiveTopicMatch[] {
  const matches: SensitiveTopicMatch[] = []
  const lowerText = text.toLowerCase()
  
  // Check high-risk keywords
  for (const item of HIGH_RISK_KEYWORDS) {
    if (lowerText.includes(item.keyword.toLowerCase())) {
      matches.push({
        keyword: item.keyword,
        severity: 'high',
        suggestion: item.suggestion,
        category: item.category
      })
    }
  }
  
  // Check medium-risk keywords
  for (const item of MEDIUM_RISK_KEYWORDS) {
    if (lowerText.includes(item.keyword.toLowerCase())) {
      matches.push({
        keyword: item.keyword,
        severity: 'medium',
        suggestion: item.suggestion,
        category: item.category
      })
    }
  }
  
  return matches
}

/**
 * Check if text contains high-risk sensitive topics
 */
export function hasHighRiskTopics(text: string): boolean {
  const matches = checkForSensitiveTopics(text)
  return matches.some(m => m.severity === 'high')
}

/**
 * Check if text contains any sensitive topics (high or medium risk)
 */
export function hasSensitiveTopics(text: string): boolean {
  const matches = checkForSensitiveTopics(text)
  return matches.length > 0
}

/**
 * Get the first high-risk topic match (for UI display)
 */
export function getFirstHighRiskTopic(text: string): SensitiveTopicMatch | null {
  const matches = checkForSensitiveTopics(text)
  return matches.find(m => m.severity === 'high') || null
}

/**
 * Get all high-risk topics (for blocking submission)
 */
export function getHighRiskTopics(text: string): SensitiveTopicMatch[] {
  const matches = checkForSensitiveTopics(text)
  return matches.filter(m => m.severity === 'high')
}

/**
 * Get all medium-risk topics (for warnings)
 */
export function getMediumRiskTopics(text: string): SensitiveTopicMatch[] {
  const matches = checkForSensitiveTopics(text)
  return matches.filter(m => m.severity === 'medium')
}
