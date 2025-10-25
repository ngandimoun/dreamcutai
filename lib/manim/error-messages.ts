export interface ManimError {
  pattern: string | RegExp;
  userMessage: string;
  suggestion: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'math' | 'text' | 'animation' | 'api' | 'timeout' | 'memory';
}

export const MANIM_ERROR_MAP: ManimError[] = [
  // Mathematical errors
  {
    pattern: /PieChart.*not defined/i,
    userMessage: 'Chart type not supported in Manim 0.18.1',
    suggestion: 'Try using basic shapes (Circle, Rectangle) to create custom charts',
    severity: 'warning',
    category: 'api'
  },
  {
    pattern: /BarChart.*not defined/i,
    userMessage: 'Bar chart class not available',
    suggestion: 'Use Rectangle objects arranged manually for bar charts',
    severity: 'warning',
    category: 'api'
  },
  {
    pattern: /LineChart.*not defined/i,
    userMessage: 'Line chart class not available',
    suggestion: 'Use Line objects with data points for line charts',
    severity: 'warning',
    category: 'api'
  },
  
  // Text/LaTeX errors
  {
    pattern: /MathTex.*error|LaTeX.*error/i,
    userMessage: 'Mathematical formula had rendering issues',
    suggestion: 'Try simplifying the formula or check for LaTeX syntax errors',
    severity: 'warning',
    category: 'math'
  },
  {
    pattern: /Text.*encoding|UTF-8.*error/i,
    userMessage: 'Text encoding issue with special characters',
    suggestion: 'Try using simpler text or English characters only',
    severity: 'warning',
    category: 'text'
  },
  {
    pattern: /raw string|backslash/i,
    userMessage: 'LaTeX formatting issue',
    suggestion: 'Use raw strings r"..." for LaTeX code to avoid backslash issues',
    severity: 'info',
    category: 'text'
  },
  
  // API compatibility errors
  {
    pattern: /camera\.frame.*AttributeError/i,
    userMessage: 'Camera animation not supported',
    suggestion: 'Remove camera zoom/pan effects, use simpler animations',
    severity: 'info',
    category: 'api'
  },
  {
    pattern: /ax\.get_graph.*color/i,
    userMessage: 'Graph plotting method incompatibility',
    suggestion: 'Using alternative plotting method automatically',
    severity: 'info',
    category: 'api'
  },
  {
    pattern: /config\["style"\]|config\.style/i,
    userMessage: 'Configuration attribute not available',
    suggestion: 'Using default style settings automatically',
    severity: 'info',
    category: 'api'
  },
  
  // Type errors
  {
    pattern: /VGroup.*VMobject.*Mobject/i,
    userMessage: 'Object type mismatch in grouping',
    suggestion: 'Mixing text and shapes requires Group() instead of VGroup()',
    severity: 'warning',
    category: 'api'
  },
  {
    pattern: /Dot.*radius.*unexpected/i,
    userMessage: 'Dot parameter conflict',
    suggestion: 'Avoid duplicate radius parameters in Dot() calls',
    severity: 'warning',
    category: 'api'
  },
  
  // Timeout/resource errors
  {
    pattern: /timeout|timed out/i,
    userMessage: 'Animation took too long to render',
    suggestion: 'Reduce duration, number of objects, or animation complexity',
    severity: 'critical',
    category: 'timeout'
  },
  {
    pattern: /memory|MemoryError|out of memory/i,
    userMessage: 'Animation requires too many resources',
    suggestion: 'Reduce number of objects, lower resolution, or simplify effects',
    severity: 'critical',
    category: 'memory'
  },
  
  // Scene/output errors
  {
    pattern: /Output file not found/i,
    userMessage: 'Animation rendering completed but output file missing',
    suggestion: 'This is usually automatically fixed - trying again',
    severity: 'info',
    category: 'animation'
  },
  {
    pattern: /Played 0 animations/i,
    userMessage: 'No animations were executed',
    suggestion: 'Add self.play() calls to create animated content instead of static images',
    severity: 'warning',
    category: 'animation'
  },
  
  // Generic fallback
  {
    pattern: /.*/,
    userMessage: 'Animation rendering encountered an issue',
    suggestion: 'Try simplifying your request or using basic shapes only',
    severity: 'warning',
    category: 'animation'
  }
];

export function getUserFriendlyError(technicalError: string): {
  message: string;
  suggestion: string;
  severity: string;
  category: string;
} {
  for (const errorDef of MANIM_ERROR_MAP) {
    const pattern = typeof errorDef.pattern === 'string' 
      ? new RegExp(errorDef.pattern, 'i')
      : errorDef.pattern;
    
    if (pattern.test(technicalError)) {
      return {
        message: errorDef.userMessage,
        suggestion: errorDef.suggestion,
        severity: errorDef.severity,
        category: errorDef.category
      };
    }
  }
  
  // Default fallback (should never reach here due to .* pattern)
  return {
    message: 'Rendering failed',
    suggestion: 'Please try again with simpler content',
    severity: 'warning',
    category: 'animation'
  };
}


