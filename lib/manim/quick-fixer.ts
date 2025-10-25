import OpenAI from 'openai';
import type { ValidationIssue } from './static-validator';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Stage 3: Conditional Quick Fix AI
 * Only called when critical issues are found by static validator
 */
export async function quickFixCode(
  code: string,
  issues: ValidationIssue[]
): Promise<string> {
  // Only fix CRITICAL issues automatically
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  
  if (criticalIssues.length === 0) {
    console.log('✅ Stage 3: No critical issues to fix');
    return code;
  }

  console.log(`🔧 Stage 3: Fixing ${criticalIssues.length} critical issue(s)`);

  // Build detailed fix instructions
  const issuesList = criticalIssues.map((issue, index) => {
    return `${index + 1}. Line ${issue.line}: ${issue.issue}
   Pattern: ${issue.pattern}
   Fix: ${issue.fix}`;
  }).join('\n\n');

  const fixPrompt = `You are a Manim code fixer. Fix ONLY the following CRITICAL issues in the code below.

CRITICAL ISSUES TO FIX:

${issuesList}

IMPORTANT RULES:
1. Fix ONLY the issues listed above
2. Do NOT make any other changes to the code
3. Maintain all existing functionality
4. Keep the same class name and structure
5. Preserve all working animations and logic
6. Return ONLY the corrected Python code
7. Do NOT add markdown, explanations, or comments
8. Start directly with the imports

CODE TO FIX:

${code}

Return the corrected code now:`;

  try {
    const response = await openai.responses.create({
      model: "gpt-5",
      input: [
        { role: "user", content: fixPrompt }
      ],
      text: {
        format: { type: "text" }
      }
    });

    let fixedCode = response.output_text || code;
    
    // Remove markdown code blocks if present
    fixedCode = fixedCode.replace(/```python\s*/g, '').replace(/```\s*/g, '').trim();
    
    console.log('✅ Stage 3: Code fixes applied');
    return fixedCode;
  } catch (error) {
    console.error('❌ Stage 3 failed:', error);
    console.log('⚠️  Returning original code');
    return code;
  }
}

/**
 * Alternative: Apply simple pattern-based fixes without AI
 * Faster but less intelligent than AI-based fixes
 */
export function applySimpleFixes(code: string, issues: ValidationIssue[]): string {
  let fixedCode = code;
  const lines = fixedCode.split('\n');

  issues.forEach(issue => {
    if (issue.severity !== 'critical') return;

    // Fix 1: Replace Create(Group(...)) with LaggedStart
    if (issue.pattern === 'Create(Group(...))' || issue.pattern === 'Write(Group(...))') {
      const lineIndex = issue.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];
        // Simple replacement (this is a basic approach)
        if (line.includes('Create(Group(')) {
          lines[lineIndex] = '        # TODO: Replace with LaggedStart(*[Create(obj) for obj in objects])';
          console.log(`⚠️  Line ${issue.line}: Marked for manual fix (Create(Group()))`);
        }
        if (line.includes('Write(Group(')) {
          lines[lineIndex] = '        # TODO: Replace with LaggedStart(*[Write(obj) for obj in objects])';
          console.log(`⚠️  Line ${issue.line}: Marked for manual fix (Write(Group()))`);
        }
      }
    }

    // Fix 2: Add raw string to MathTex
    if (issue.pattern === 'MathTex without raw string') {
      const lineIndex = issue.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        lines[lineIndex] = lines[lineIndex].replace(/MathTex\s*\(\s*"/g, 'MathTex(r"');
        lines[lineIndex] = lines[lineIndex].replace(/MathTex\s*\(\s*'/g, "MathTex(r'");
        console.log(`✅ Line ${issue.line}: Added raw string to MathTex`);
      }
    }

    // Fix 3: Remove camera.frame references
    if (issue.pattern === 'camera.frame') {
      const lineIndex = issue.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        lines[lineIndex] = '        # Removed camera.frame reference (not available in Manim 0.18.1)';
        console.log(`⚠️  Line ${issue.line}: Removed camera.frame reference`);
      }
    }

    // Fix 4: Remove indentation from line 1
    if (issue.pattern === 'indentation at line 1' && lines.length > 0) {
      lines[0] = lines[0].trimStart();
      console.log(`✅ Line 1: Removed unexpected indentation`);
    }
  });

  return lines.join('\n');
}

/**
 * Decides whether to use AI-based or simple fixes
 * AI fixes are better but take longer
 */
export async function smartFix(
  code: string,
  issues: ValidationIssue[],
  useAI: boolean = true
): Promise<string> {
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  
  if (criticalIssues.length === 0) {
    return code;
  }

  // For simple fixes (raw string, indentation), use pattern-based
  const simplePatterns = ['MathTex without raw string', 'Tex without raw string', 'indentation at line 1'];
  const hasOnlySimpleFixes = criticalIssues.every(i => simplePatterns.includes(i.pattern));

  if (hasOnlySimpleFixes) {
    console.log('🔧 Stage 3: Using simple pattern-based fixes');
    return applySimpleFixes(code, criticalIssues);
  }

  // For complex fixes (Create(Group()), missing imports), use AI
  if (useAI) {
    return quickFixCode(code, issues);
  } else {
    return applySimpleFixes(code, issues);
  }
}

