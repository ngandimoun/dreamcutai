import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface BugPattern {
  errorPattern: string;
  frequency: number;
  examples: string[];
  suggestedFix: string;
  category: string;
}

async function analyzeBugs() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Fetch all unresolved bugs from last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { data: bugs, error } = await supabase
    .from('bug_reports')
    .select('*')
    .eq('resolved', false)
    .gte('created_at', thirtyDaysAgo.toISOString());
  
  if (error) {
    console.error('❌ Error fetching bugs:', error);
    process.exit(1);
  }
  
  if (!bugs || bugs.length === 0) {
    console.log('✅ No unresolved bugs found in the last 30 days');
    return;
  }
  
  // Group by error patterns
  const patterns = new Map<string, BugPattern>();
  
  for (const bug of bugs) {
    // Extract error pattern
    const errorPattern = extractErrorPattern(bug.technical_error);
    
    if (!patterns.has(errorPattern)) {
      patterns.set(errorPattern, {
        errorPattern,
        frequency: 0,
        examples: [],
        suggestedFix: generateSuggestedFix(errorPattern, bug.generated_code),
        category: bug.error_category
      });
    }
    
    const pattern = patterns.get(errorPattern)!;
    pattern.frequency++;
    if (pattern.examples.length < 3) {
      pattern.examples.push(bug.generated_code.substring(0, 200));
    }
  }
  
  // Sort by frequency
  const sortedPatterns = Array.from(patterns.values())
    .sort((a, b) => b.frequency - a.frequency);
  
  // Generate report
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     BUG PATTERN ANALYSIS REPORT                  ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log(`📊 Total bugs analyzed: ${bugs.length}`);
  console.log(`🔍 Unique patterns found: ${sortedPatterns.length}\n`);
  
  console.log('═══════════════════════════════════════════════════\n');
  console.log('TOP 10 MOST FREQUENT ERROR PATTERNS:\n');
  
  for (let i = 0; i < Math.min(10, sortedPatterns.length); i++) {
    const pattern = sortedPatterns[i];
    console.log(`${i + 1}. Pattern: ${pattern.errorPattern}`);
    console.log(`   Category: ${pattern.category}`);
    console.log(`   Frequency: ${pattern.frequency} occurrences`);
    console.log(`   Suggested Fix: ${pattern.suggestedFix}`);
    console.log('   ─────────────────────────────────────────────\n');
  }
  
  // Generate new fallback code suggestions
  console.log('═══════════════════════════════════════════════════\n');
  console.log('SUGGESTED FALLBACK ADDITIONS:\n');
  generateFallbackSuggestions(sortedPatterns);
  
  console.log('\n═══════════════════════════════════════════════════\n');
  console.log('CATEGORY BREAKDOWN:\n');
  const categoryStats = bugs.reduce((acc, bug) => {
    acc[bug.error_category] = (acc[bug.error_category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  for (const [category, count] of Object.entries(categoryStats).sort((a, b) => b[1] - a[1])) {
    const percentage = ((count / bugs.length) * 100).toFixed(1);
    console.log(`  ${category.padEnd(15)} ${count.toString().padStart(4)} (${percentage}%)`);
  }
}

function extractErrorPattern(error: string): string {
  // Extract the core error message
  const patterns = [
    /(\w+Error): (.+?)(?:\n|$)/,
    /AttributeError: '(\w+)' object has no attribute '(\w+)'/,
    /NameError: name '(\w+)' is not defined/,
    /TypeError: (.+?)(?:\n|$)/,
  ];
  
  for (const pattern of patterns) {
    const match = error.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  // Fallback: return first line
  return error.split('\n')[0].substring(0, 100);
}

function extractUndefinedName(pattern: string): string {
  const match = pattern.match(/name '(\w+)' is not defined/);
  return match ? match[1] : 'unknown';
}

function extractAttributeName(pattern: string): string {
  const match = pattern.match(/no attribute '(\w+)'/);
  return match ? match[1] : 'unknown';
}

function generateSuggestedFix(pattern: string, code: string): string {
  // Analyze the code and suggest fixes
  if (pattern.includes('not defined')) {
    const name = extractUndefinedName(pattern);
    return `Replace or import ${name}, or use alternative Manim class`;
  }
  if (pattern.includes('AttributeError')) {
    const attr = extractAttributeName(pattern);
    return `Replace deprecated ${attr} API call with compatible alternative`;
  }
  if (pattern.includes('TypeError')) {
    return 'Fix type mismatch or parameter conflict';
  }
  if (pattern.includes('MathTex') || pattern.includes('LaTeX')) {
    return 'Check LaTeX syntax, ensure raw strings r"..."';
  }
  if (pattern.includes('VGroup') || pattern.includes('VMobject')) {
    return 'Use Group() instead of VGroup() for mixed object types';
  }
  if (pattern.includes('camera.frame')) {
    return 'Remove camera.frame usage, not available in Manim 0.18.1';
  }
  return 'Review code and apply appropriate fix';
}

function generateFallbackSuggestions(patterns: BugPattern[]) {
  const highFrequencyPatterns = patterns.filter(p => p.frequency >= 3);
  
  if (highFrequencyPatterns.length === 0) {
    console.log('  No high-frequency patterns requiring new fallbacks.\n');
    return;
  }
  
  console.log('  Copy these additions to modal_functions/manim_render.py:\n');
  console.log('  ```python');
  console.log('  # Add to the fallback code cleaning loop:\n');
  
  for (const pattern of highFrequencyPatterns.slice(0, 5)) {
    const errorKey = pattern.errorPattern.substring(0, 50).replace(/['"]/g, '');
    console.log(`  # Fix: ${pattern.errorPattern.substring(0, 60)}`);
    console.log(`  if '${errorKey}' in line:`);
    console.log(`      # ${pattern.suggestedFix}`);
    console.log(`      line = line.replace('...', '...')  # TODO: Implement fix`);
    console.log(`      print("⚠️ Fixed: ${pattern.errorPattern.substring(0, 40)}")`);
    console.log('');
  }
  
  console.log('  ```');
}

// Run analysis
console.log('Starting bug analysis...\n');
analyzeBugs()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });


