/**
 * Stage 2.5: Static Code Validation
 * Fast pattern matching to catch common Manim code errors before rendering
 */

export interface ValidationIssue {
  type: 'error' | 'warning';
  line: number;
  pattern: string;
  issue: string;
  fix: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Validates generated Manim code for common errors and bad patterns
 */
export function validateGeneratedCode(code: string, expectedVoice?: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const lines = code.split('\n');

  // Pattern 1: Create(Group()) or Create(VGroup()) - CRITICAL ERROR
  lines.forEach((line, index) => {
    const createGroupPattern = /self\.play\s*\(\s*Create\s*\(\s*(Group|VGroup)\s*\(/;
    if (createGroupPattern.test(line)) {
      issues.push({
        type: 'error',
        line: index + 1,
        pattern: 'Create(Group(...))',
        issue: 'Invalid pattern: self.play(Create(Group(...))) causes NotImplementedError',
        fix: 'Use LaggedStart(*[Create(obj) for obj in objects], lag_ratio=0.1)',
        severity: 'critical'
      });
    }
  });

  // Pattern 2: Write(Group()) or Write(VGroup()) - CRITICAL ERROR
  lines.forEach((line, index) => {
    const writeGroupPattern = /self\.play\s*\(\s*Write\s*\(\s*(Group|VGroup)\s*\(/;
    if (writeGroupPattern.test(line)) {
      issues.push({
        type: 'error',
        line: index + 1,
        pattern: 'Write(Group(...))',
        issue: 'Invalid pattern: self.play(Write(Group(...))) causes NotImplementedError',
        fix: 'Use LaggedStart(*[Write(obj) for obj in objects], lag_ratio=0.1)',
        severity: 'critical'
      });
    }
  });

  // Pattern 3: MathTex without raw string when containing backslashes
  lines.forEach((line, index) => {
    const mathTexPattern = /MathTex\s*\(\s*["']/;
    const hasRawString = /MathTex\s*\(\s*r["']/;
    
    if (mathTexPattern.test(line) && !hasRawString.test(line) && line.includes('\\')) {
      issues.push({
        type: 'error',
        line: index + 1,
        pattern: 'MathTex without raw string',
        issue: 'MathTex contains backslash but is not using raw string (r"...")',
        fix: 'Change MathTex("...") to MathTex(r"...")',
        severity: 'high'
      });
    }
  });

  // Pattern 4: Tex without raw string when containing backslashes
  lines.forEach((line, index) => {
    const texPattern = /Tex\s*\(\s*["']/;
    const hasRawString = /Tex\s*\(\s*r["']/;
    
    if (texPattern.test(line) && !hasRawString.test(line) && line.includes('\\')) {
      issues.push({
        type: 'error',
        line: index + 1,
        pattern: 'Tex without raw string',
        issue: 'Tex contains backslash but is not using raw string (r"...")',
        fix: 'Change Tex("...") to Tex(r"...")',
        severity: 'high'
      });
    }
  });

  // Pattern 5: camera.frame usage (not available in Manim 0.18.1)
  lines.forEach((line, index) => {
    if (line.includes('self.camera.frame')) {
      issues.push({
        type: 'error',
        line: index + 1,
        pattern: 'camera.frame',
        issue: 'self.camera.frame is not available in Manim 0.18.1',
        fix: 'Remove camera.frame references or use MovingCameraScene',
        severity: 'critical'
      });
    }
  });

  // Pattern 6: Indentation at line 1 (unexpected indent)
  if (lines.length > 0 && lines[0].match(/^\s+/)) {
    issues.push({
      type: 'error',
      line: 1,
      pattern: 'indentation at line 1',
      issue: 'First line has unexpected indentation',
      fix: 'Remove all leading whitespace from first line',
      severity: 'critical'
    });
  }

  // Pattern 7: Missing manim import
  const hasManimImport = code.includes('from manim import *') || code.includes('import manim');
  if (!hasManimImport) {
    issues.push({
      type: 'error',
      line: 1,
      pattern: 'missing import',
      issue: 'Missing required import: from manim import *',
      fix: 'Add "from manim import *" at the top of the file',
      severity: 'critical'
    });
  }

  // Pattern 8: config["style"] or config.style usage (not available)
  lines.forEach((line, index) => {
    if (line.includes('config["style"]') || line.includes('config.style')) {
      issues.push({
        type: 'error',
        line: index + 1,
        pattern: 'config style',
        issue: 'config["style"] or config.style is not available in Manim 0.18.1',
        fix: 'Remove config style references or use explicit background color',
        severity: 'high'
      });
    }
  });

  // Pattern 9: Undefined chart classes (PieChart, BarChart, etc.)
  const undefinedCharts = ['PieChart', 'BarChart', 'LineChart', 'Histogram', 'ScatterPlot'];
  lines.forEach((line, index) => {
    undefinedCharts.forEach(chart => {
      if (line.includes(chart)) {
        issues.push({
          type: 'error',
          line: index + 1,
          pattern: `undefined ${chart}`,
          issue: `${chart} is not available in Manim 0.18.1`,
          fix: `Use Axes() with ax.plot() or create custom visualization`,
          severity: 'high'
        });
      }
    });
  });

  // Pattern 10: Text with mathematical symbols (should use MathTex)
  const mathSymbols = ['x^2', 'y^2', '^2', '^3', '\\frac', '\\sqrt', '\\pm', '\\times'];
  lines.forEach((line, index) => {
    if (line.includes('Text(') && !line.includes('MathTex(')) {
      const hasMathSymbol = mathSymbols.some(symbol => line.includes(symbol));
      if (hasMathSymbol) {
        issues.push({
          type: 'warning',
          line: index + 1,
          pattern: 'math in Text',
          issue: 'Mathematical symbols detected in Text() - should use MathTex()',
          fix: 'Change Text("...") to MathTex(r"...")',
          severity: 'medium'
        });
      }
    }
  });

  // Pattern 11: Missing self.wait() after animations
  let lastPlayLine = -1;
  lines.forEach((line, index) => {
    if (line.includes('self.play(')) {
      lastPlayLine = index;
    }
    if (lastPlayLine >= 0 && index === lastPlayLine + 1) {
      if (!line.includes('self.wait(') && !line.includes('self.play(')) {
        issues.push({
          type: 'warning',
          line: lastPlayLine + 1,
          pattern: 'missing wait',
          issue: 'Animation followed by code without self.wait() - may cause timing issues',
          fix: 'Add self.wait(2.0) after animation',
          severity: 'low'
        });
      }
    }
  });

  // Pattern 12: Voice validation (if expectedVoice is provided)
  if (expectedVoice && code.includes('OpenAIService')) {
    const voicePattern = new RegExp(`OpenAIService\\([^)]*voice=["']${expectedVoice}["']`);
    if (!voicePattern.test(code)) {
      // Check if any voice is specified
      const anyVoicePattern = /OpenAIService\([^)]*voice=["']([^"']+)["']/;
      const match = code.match(anyVoicePattern);
      if (match) {
        const actualVoice = match[1];
        issues.push({
          type: 'error',
          line: 0,
          pattern: 'wrong voice',
          issue: `Expected voice "${expectedVoice}" but found "${actualVoice}"`,
          fix: `Change voice parameter to voice="${expectedVoice}"`,
          severity: 'high'
        });
      } else {
        issues.push({
          type: 'error',
          line: 0,
          pattern: 'missing voice',
          issue: `Expected voice "${expectedVoice}" but no voice parameter found in OpenAIService`,
          fix: `Add voice parameter: OpenAIService(voice="${expectedVoice}", ...)`,
          severity: 'high'
        });
      }
    }
  }

  // Pattern 13: Python compile check
  try {
    // Note: This is a simplified check. In a real implementation,
    // you might want to use a Python subprocess or js-python-parser
    const hasClassDef = /class\s+\w+\s*\([^)]*Scene[^)]*\)\s*:/;
    const hasConstructMethod = /def\s+construct\s*\(\s*self\s*\)\s*:/;
    
    if (!hasClassDef.test(code)) {
      issues.push({
        type: 'error',
        line: 0,
        pattern: 'missing class',
        issue: 'Missing Scene class definition',
        fix: 'Add class definition: class SceneName(Scene):',
        severity: 'critical'
      });
    }
    
    if (!hasConstructMethod.test(code)) {
      issues.push({
        type: 'error',
        line: 0,
        pattern: 'missing construct',
        issue: 'Missing construct() method',
        fix: 'Add method: def construct(self):',
        severity: 'critical'
      });
    }
  } catch (error) {
    console.error('Error during code structure validation:', error);
  }

  return issues;
}

/**
 * Get a summary of validation issues grouped by severity
 */
export function getValidationSummary(issues: ValidationIssue[]): {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
} {
  return {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
    total: issues.length
  };
}

/**
 * Format validation issues for display
 */
export function formatValidationIssues(issues: ValidationIssue[]): string {
  if (issues.length === 0) {
    return '✅ No validation issues found';
  }

  const grouped = issues.reduce((acc, issue) => {
    if (!acc[issue.severity]) {
      acc[issue.severity] = [];
    }
    acc[issue.severity].push(issue);
    return acc;
  }, {} as Record<string, ValidationIssue[]>);

  let output = `Found ${issues.length} validation issue(s):\n\n`;

  const severityOrder: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];
  
  severityOrder.forEach(severity => {
    if (grouped[severity]) {
      output += `${severity.toUpperCase()} (${grouped[severity].length}):\n`;
      grouped[severity].forEach(issue => {
        output += `  Line ${issue.line}: ${issue.issue}\n`;
        output += `    Fix: ${issue.fix}\n`;
      });
      output += '\n';
    }
  });

  return output;
}

