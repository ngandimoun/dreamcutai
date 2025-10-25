/**
 * OpenAI Code Interpreter Service for Manim
 * 
 * Generates validated Manim Python code using OpenAI's Code Interpreter tool via the Responses API.
 * Transfers all existing Manim knowledge and validation rules into Code Interpreter prompts.
 */

import OpenAI from 'openai'
import { 
  ManimGenerationOptions, 
  getVoiceoverSystemPrompt, 
  getStandardSystemPrompt, 
  buildUserPrompt, 
  getFixOnFailPrompt,
  generateSceneName,
  validateManimCode
} from '../manim/claude-prompts'
import { validateGeneratedCode, getValidationSummary, formatValidationIssues } from '../manim/static-validator'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ManimCodeInterpreterConfig {
  prompt: string
  hasVoiceover: boolean
  voiceStyle?: string
  language?: string
  duration: number
  aspectRatio: string
  resolution: string
  style: string
  title: string
}

export interface ManimCodeResult {
  success: boolean
  pythonCode?: string
  sceneName?: string
  error?: string
  metadata?: {
    containerId: string
    executionTime: number
    validationIssues?: any[]
  }
}

/**
 * Builds comprehensive system prompt for Manim Code Interpreter
 */
function buildManimSystemPrompt(options: ManimGenerationOptions): string {
  const basePrompt = options.hasVoiceover 
    ? getVoiceoverSystemPrompt(options)
    : getStandardSystemPrompt(options)
  
  // Add validation rules and best practices
  const validationRules = `
CRITICAL VALIDATION RULES - MUST FOLLOW:

1. ANIMATION PATTERNS (CRITICAL - Common Error):
   - NEVER use: self.play(Create(Group(...))) or self.play(Write(Group(...)))
   - NEVER use: self.play(Create(VGroup(...))) or self.play(Write(VGroup(...)))
   - ALWAYS use: self.play(LaggedStart(*[Create(obj) for obj in objects], lag_ratio=0.1))
   - OR: self.play(*[Create(obj) for obj in objects])
   - OR: Create/Write each object individually
   - Group() and VGroup() are for POSITIONING only, not for animations

2. TEXT AND LATEX USAGE:
   - ALWAYS use MathTex() for equations, NEVER Text()
   - Example: MathTex(r"\\frac{x^2 + y^2}{2}") not Text("(x^2 + y^2)/2")
   - ALWAYS use raw strings for LaTeX: r"..." to avoid backslash issues
   - For inline math in Tex: use $ symbols: Tex(r"The formula $x^2$ is simple")
   - Isolate parts for coloring: MathTex(r"{{ a^2 }} + {{ b^2 }} = {{ c^2 }}")

3. SCENE MANAGEMENT:
   - ALWAYS clear previous content before introducing new sections: self.play(FadeOut(previous_objects))
   - Use self.clear() between major topic transitions
   - Store all created objects in variables so they can be properly removed
   - Objects with updaters (add_updater) must be explicitly removed from scene

4. TIMING AND PACING:
   - Minimum display time: 3-4 seconds per element (self.wait(3) after creation)
   - Transition time: 2 seconds between scenes (run_time=2 for FadeOut)
   - Never show content for less than 1 second
   - For text: add self.wait(len(text.text) * 0.1) to allow reading time

5. MANIM 0.18.1 API COMPLIANCE:
   - NEVER use: PieChart, BarChart, LineChart, Histogram, ScatterPlot
   - NEVER use: config["style"] or config.style
   - NEVER use: self.camera.frame (doesn't exist in 0.18.1)
   - NEVER use: ax.get_graph() with color parameter - use ax.plot() instead
   - AVOID: plot_line_graph() with add_vertex_dots=True - can cause radius conflicts
   - USE Group() instead of VGroup() when mixing Text/MathTex with shapes

6. CHART AND VISUALIZATION REQUIREMENTS:
   - ALWAYS include: title, axis labels, legend (when multiple series)
   - Use proper axis ranges with appropriate tick marks
   - Add units to axis labels (e.g., "Temperature (°C)", "Time (seconds)")
   - Color code consistently and include legend explaining colors

7. MEMORY AND PERFORMANCE:
   - Limit object creation in loops (max 10 objects for large ranges)
   - Limit run_time to maximum 5 seconds per animation
   - Use appropriate object sizes (radius >= 0.3 for circles in loops)
   - Avoid nested VGroup structures

8. SYNTAX AND STRUCTURE:
   - Ensure proper indentation: class methods 4 spaces, method content 8 spaces
   - All imports at the top: from manim import *
   - Class definition: class SceneName(Scene): or class SceneName(VoiceoverScene):
   - Method definition: def construct(self):
   - Always include at least 2-3 self.play() animations - static scenes create PNG only

CRITICAL: Test and validate your code mentally before returning it.
- Check syntax, indentation, imports
- Verify all animations use correct patterns
- Ensure no Create(Group(...)) or Write(Group(...))
- Use raw strings for LaTeX: r"..."
- Verify scene name matches class name
- Ensure proper timing and pacing

Return ONLY the Python code, no markdown, no explanations.`

  return basePrompt + validationRules
}

/**
 * Generates Manim Python code using OpenAI Code Interpreter
 */
export async function generateManimCode(
  config: ManimCodeInterpreterConfig
): Promise<ManimCodeResult> {
  const startTime = Date.now()
  let containerId: string | undefined

  try {
    console.log('🚀 Starting Code Interpreter Manim code generation...')
    
    // Step 1: Create container
    console.log('📦 Creating OpenAI container...')
    const container = await openai.containers.create({
      name: `manim-code-generation-${Date.now()}`,
    })
    containerId = container.id
    console.log(`✅ Container created: ${containerId}`)

    // Step 2: Build system prompt with all Manim knowledge
    const systemPrompt = buildManimSystemPrompt({
      prompt: config.prompt,
      hasVoiceover: config.hasVoiceover,
      voiceStyle: config.voiceStyle || 'educational',
      language: config.language || 'english',
      duration: config.duration,
      aspectRatio: config.aspectRatio,
      resolution: config.resolution,
      style: config.style,
      title: config.title
    })

    // Step 3: Build user prompt
    const userPrompt = `Generate Manim code for this request:

${config.prompt}

Requirements:
- Duration: ${config.duration} seconds
- Aspect Ratio: ${config.aspectRatio}
- Resolution: ${config.resolution}
- Style: ${config.style}
- Title: ${config.title}
${config.hasVoiceover ? `- Voiceover: ${config.voiceStyle} style in ${config.language}` : '- No voiceover'}

Generate complete, working Manim Python code that follows all the validation rules.`

    // Step 4: Generate code using Code Interpreter
    console.log('🎬 Generating Manim code with Code Interpreter...')
    const response = await openai.responses.create({
      model: "gpt-4o",
      tools: [{
        type: "code_interpreter",
        container: {
          type: "auto"
        }
      }],
      tool_choice: "required",  // Force Code Interpreter to run
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_output_tokens: 6000,
    })

    console.log('✅ Code Interpreter response received')

    // Step 5: Extract generated code from response
    let rawCode = ''
    if (response.output && response.output.length > 0) {
      // Look for code in the response
      for (const output of response.output) {
        if (output.type === 'message' && output.content) {
          for (const content of output.content) {
            if (content.type === 'text') {
              rawCode = content.text || ''
              break
            }
          }
        }
        if (output.type === 'code_interpreter_call') {
          rawCode = output.code || ''
          break
        }
      }
    }

    if (!rawCode) {
      throw new Error('No code generated by Code Interpreter')
    }

    // Step 6: Clean and validate the code
    const validation = validateManimCode(rawCode)
    const cleanedCode = validation.cleanedCode || rawCode
    
    // Step 7: Run static validation
    const validationIssues = validateGeneratedCode(cleanedCode, config.hasVoiceover ? config.voiceStyle : undefined)
    const summary = getValidationSummary(validationIssues)
    
    console.log(`📊 Validation: ${summary.critical} critical, ${summary.high} high, ${summary.medium} medium, ${summary.low} low`)
    
    if (validationIssues.length > 0) {
      console.log(formatValidationIssues(validationIssues))
    }

    // Step 8: Generate scene name
    const sceneName = generateSceneName(config.title)

    const executionTime = Date.now() - startTime
    console.log(`✅ Manim code generation completed in ${executionTime}ms`)

    return {
      success: true,
      pythonCode: cleanedCode,
      sceneName,
      metadata: {
        containerId,
        executionTime,
        validationIssues
      }
    }

  } catch (error) {
    console.error('❌ Code Interpreter Manim generation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        containerId: containerId || '',
        executionTime: Date.now() - startTime
      }
    }
  }
}

/**
 * Generates fixed Manim code for retry attempts
 */
export async function generateFixedManimCode(
  originalCode: string,
  error: string,
  config: ManimCodeInterpreterConfig
): Promise<ManimCodeResult> {
  const startTime = Date.now()
  let containerId: string | undefined

  try {
    console.log('🔄 Starting Code Interpreter Manim code fix...')
    
    // Step 1: Create container
    console.log('📦 Creating OpenAI container for fix...')
    const container = await openai.containers.create({
      name: `manim-code-fix-${Date.now()}`,
    })
    containerId = container.id
    console.log(`✅ Container created: ${containerId}`)

    // Step 2: Build fix prompt
    const fixPrompt = getFixOnFailPrompt(originalCode, error)
    
    // Step 3: Build system prompt
    const systemPrompt = buildManimSystemPrompt({
      prompt: config.prompt,
      hasVoiceover: config.hasVoiceover,
      voiceStyle: config.voiceStyle || 'educational',
      language: config.language || 'english',
      duration: config.duration,
      aspectRatio: config.aspectRatio,
      resolution: config.resolution,
      style: config.style,
      title: config.title
    })

    // Step 4: Generate fixed code using Code Interpreter
    console.log('🔧 Generating fixed Manim code with Code Interpreter...')
    const response = await openai.responses.create({
      model: "gpt-4o",
      tools: [{
        type: "code_interpreter",
        container: {
          type: "auto"
        }
      }],
      tool_choice: "required",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: fixPrompt }
      ],
      max_output_tokens: 6000,
    })

    console.log('✅ Code Interpreter fix response received')

    // Step 5: Extract fixed code
    let rawCode = ''
    if (response.output && response.output.length > 0) {
      for (const output of response.output) {
        if (output.type === 'message' && output.content) {
          for (const content of output.content) {
            if (content.type === 'text') {
              rawCode = content.text || ''
              break
            }
          }
        }
        if (output.type === 'code_interpreter_call') {
          rawCode = output.code || ''
          break
        }
      }
    }

    if (!rawCode) {
      throw new Error('No fixed code generated by Code Interpreter')
    }

    // Step 6: Clean and validate the fixed code
    const validation = validateManimCode(rawCode)
    const cleanedCode = validation.cleanedCode || rawCode
    
    // Step 7: Run static validation
    const validationIssues = validateGeneratedCode(cleanedCode, config.hasVoiceover ? config.voiceStyle : undefined)
    const summary = getValidationSummary(validationIssues)
    
    console.log(`📊 Fix validation: ${summary.critical} critical, ${summary.high} high, ${summary.medium} medium, ${summary.low} low`)

    // Step 8: Generate scene name
    const sceneName = generateSceneName(config.title)

    const executionTime = Date.now() - startTime
    console.log(`✅ Manim code fix completed in ${executionTime}ms`)

    return {
      success: true,
      pythonCode: cleanedCode,
      sceneName,
      metadata: {
        containerId,
        executionTime,
        validationIssues
      }
    }

  } catch (error) {
    console.error('❌ Code Interpreter Manim fix failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        containerId: containerId || '',
        executionTime: Date.now() - startTime
      }
    }
  }
}

/**
 * Test Code Interpreter connection
 */
export async function testManimCodeInterpreterConnection(): Promise<boolean> {
  try {
    console.log('🧪 Testing Manim Code Interpreter connection...')
    
    const testConfig: ManimCodeInterpreterConfig = {
      prompt: 'Create a simple circle animation',
      hasVoiceover: false,
      duration: 5,
      aspectRatio: '16:9',
      resolution: '720p',
      style: 'clean',
      title: 'Test Scene'
    }

    const result = await generateManimCode(testConfig)
    
    if (result.success && result.pythonCode) {
      console.log('✅ Manim Code Interpreter connection test successful')
      return true
    } else {
      console.log('❌ Manim Code Interpreter connection test failed:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Manim Code Interpreter connection test error:', error)
    return false
  }
}



