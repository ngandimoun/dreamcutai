import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface ManimObject {
  id: string;
  type: 'Text' | 'MathTex' | 'Tex' | 'Line' | 'Circle' | 'Square' | 'Rectangle' | 'Dot' | 'Arrow' | 'Triangle' | 'Axes' | 'VGroup' | 'Group';
  content?: string;
  position: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'CENTER' | string;
  style?: {
    fontSize?: number;
    color?: string;
    [key: string]: unknown;
  };
}

export interface ManimAnimation {
  type: 'Write' | 'Create' | 'FadeIn' | 'FadeOut' | 'Transform' | 'LaggedStart' | 'Indicate' | 'Flash';
  targets: string[];
  duration?: number;
  runTime?: number;
  lagRatio?: number;
}

export interface ManimScene {
  id: string;
  timing: string;
  objects: ManimObject[];
  animations: ManimAnimation[];
  cleanup?: string[];
  voiceoverText?: string;
  specialRequirements?: string[];
}

export interface TechnicalSpecification {
  language: string;
  duration: number;
  voiceover: {
    enabled: boolean;
    voice: string;
  };
  scenes: ManimScene[];
  specialRequirements: string[];
}

/**
 * Stage 1: Prompt Enhancement AI
 * Transforms user's natural language into detailed technical Manim specification
 */
export async function enhancePromptToSpec(props: {
  title: string;
  prompt: string;
  hasVoiceover: boolean;
  voiceStyle: string;
  duration: number;
  aspectRatio: string;
  resolution: string;
  style: string;
}): Promise<TechnicalSpecification> {
  const systemPrompt = `You are a Manim scene designer. Transform the user's creative request into a detailed technical specification for Manim animation code generation.

Output a structured JSON specification with this EXACT format:

{
  "language": "french|english|spanish|arabic|japanese",
  "duration": ${props.duration},
  "voiceover": {
    "enabled": ${props.hasVoiceover},
    "voice": "${props.voiceStyle}"
  },
  "scenes": [
    {
      "id": "unique_id",
      "timing": "0-5s",
      "objects": [
        {
          "id": "unique_obj_id",
          "type": "Text|MathTex|Line|Circle|etc",
          "content": "text or LaTeX formula",
          "position": "UP|DOWN|CENTER|LEFT|RIGHT",
          "style": {"fontSize": 48, "color": "BLUE"}
        }
      ],
      "animations": [
        {
          "type": "Write|Create|FadeIn|FadeOut|LaggedStart",
          "targets": ["obj_id"],
          "duration": 1.5,
          "runTime": 2.0,
          "lagRatio": 0.1
        }
      ],
      "cleanup": ["FadeOut previous_obj"],
      "voiceoverText": "French/English/etc text for narration",
      "specialRequirements": ["Use raw string for LaTeX", "No overlapping"]
    }
  ],
  "specialRequirements": [
    "No overlapping text",
    "Use MathTex for formulas",
    "Always FadeOut before new section",
    "Use LaggedStart for multiple objects, NEVER Create(Group())"
  ]
}

CRITICAL REQUIREMENTS:

1. LANGUAGE DETECTION:
   - French: Look for "fais", "faire", "une", "français", "francais"
   - Spanish: Look for "hace", "hacer", "español"
   - English: Default
   - Arabic: Arabic script
   - Japanese: Japanese characters

2. SCENE BREAKDOWN:
   - Break animation into 3-5 logical scenes
   - Each scene should be 5-10 seconds
   - Specify exact timing for each scene
   - Total duration: ${props.duration} seconds

3. MATHEMATICAL FORMULAS:
   - Identify ANY mathematical notation (x^2, fractions, equations)
   - ALWAYS specify "MathTex" type for formulas
   - Include LaTeX syntax in content (use \\frac, \\sqrt, etc.)
   - Add "Use raw string for LaTeX" to specialRequirements

4. NO OVERLAPPING CONTENT:
   - If user mentions "don't overlap", "ne superpose pas", or similar
   - Add cleanup: ["FadeOut all_previous_objects"] before each new major section
   - Add to specialRequirements: "Always FadeOut before new section"

5. ANIMATION PATTERNS:
   - For single objects: Use "Write" (text) or "Create" (shapes)
   - For multiple objects: ALWAYS use "LaggedStart" type
   - NEVER suggest creating Group() then animating it
   - Add lagRatio: 0.1-0.2 for LaggedStart animations

6. VOICEOVER:
   - If voiceover enabled, add voiceoverText to each scene
   - Text should match detected language
   - Keep it concise and educational

7. POSITIONING:
   - Use Manim position constants: UP, DOWN, LEFT, RIGHT, CENTER
   - For custom positions, use descriptive strings like "next_to_title"

8. OBJECT IDs:
   - Give each object a unique, descriptive ID
   - Use snake_case: title_text, formula_main, triangle_abc

Return ONLY valid JSON, no markdown, no explanations.`;

  const userPrompt = `Create a technical specification for this Manim animation:

Title: "${props.title}"
User Request: "${props.prompt}"

Technical Parameters:
- Duration: ${props.duration} seconds
- Aspect Ratio: ${props.aspectRatio}
- Resolution: ${props.resolution}
- Style: ${props.style}
- Has Voiceover: ${props.hasVoiceover}
- Voice Style: ${props.voiceStyle}

Analyze the request and create a comprehensive technical specification in JSON format.`;

  try {
    const response = await openai.responses.create({
      model: "gpt-5",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      text: {
        format: { type: "text" }
      }
    });

    // Extract JSON from response
    let jsonText = response.output_text || '';
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    // Parse JSON
    const spec = JSON.parse(jsonText) as TechnicalSpecification;
    
    console.log('✅ Stage 1: Technical specification created');
    console.log(`   Language: ${spec.language}`);
    console.log(`   Scenes: ${spec.scenes.length}`);
    console.log(`   Special Requirements: ${spec.specialRequirements.length}`);
    
    return spec;
  } catch (error) {
    console.error('❌ Stage 1 failed:', error);
    
    // Fallback: Create basic spec from user prompt
    return createFallbackSpec(props);
  }
}

/**
 * Fallback specification creator if Stage 1 AI fails
 */
function createFallbackSpec(props: {
  title: string;
  prompt: string;
  hasVoiceover: boolean;
  voiceStyle: string;
  duration: number;
}): TechnicalSpecification {
  const detectLanguage = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('fais') || lower.includes('français') || lower.includes('francais')) return 'french';
    if (lower.includes('hace') || lower.includes('español')) return 'spanish';
    return 'english';
  };

  return {
    language: detectLanguage(props.prompt),
    duration: props.duration,
    voiceover: {
      enabled: props.hasVoiceover,
      voice: props.voiceStyle
    },
    scenes: [
      {
        id: 'title_scene',
        timing: '0-5s',
        objects: [
          {
            id: 'title_text',
            type: 'Text',
            content: props.title,
            position: 'UP',
            style: { fontSize: 48 }
          }
        ],
        animations: [
          { type: 'Write', targets: ['title_text'], duration: 1.5, runTime: 2.0 }
        ],
        cleanup: ['FadeOut title_text'],
        voiceoverText: props.hasVoiceover ? `Introduction to ${props.title}` : undefined
      },
      {
        id: 'main_content',
        timing: '5-25s',
        objects: [
          {
            id: 'main_circle',
            type: 'Circle',
            content: '',
            position: 'CENTER',
            style: { color: 'BLUE' }
          }
        ],
        animations: [
          { type: 'Create', targets: ['main_circle'], duration: 1.0, runTime: 1.5 }
        ],
        cleanup: ['FadeOut main_circle'],
        voiceoverText: props.hasVoiceover ? 'Main animation content' : undefined
      }
    ],
    specialRequirements: [
      'Always FadeOut before new section',
      'Use LaggedStart for multiple objects',
      'NEVER use Create(Group())'
    ]
  };
}

