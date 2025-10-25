/**
 * Modal Chart Generation Service
 * 
 * Executes validated Python chart code in Modal containers to generate PNG images.
 * This provides reliable file handling that Code Interpreter lacks.
 */

export interface ChartExecutionResult {
  success: boolean
  imageBuffer?: Buffer
  error?: string
}

/**
 * Execute validated Python chart code in Modal and return PNG bytes
 */
export async function executeChartCode(
  code: string, 
  dataFile?: { buffer: Buffer; filename: string }
): Promise<Buffer> {
  try {
    console.log('🚀 Executing chart code in Modal...')
    console.log(`📝 Code length: ${code.length} characters`)
    
    // Call Modal function
    const requestBody: any = { code }
    
    // Add data file if provided
    if (dataFile) {
      requestBody.dataFile = {
        buffer: dataFile.buffer.toString('base64'),
        filename: dataFile.filename
      }
      console.log(`📁 Including data file: ${dataFile.filename} (${dataFile.buffer.length} bytes)`)
    }
    
    const response = await fetch(process.env.MODAL_CHART_ENDPOINT!, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Modal request failed: ${response.status} ${errorText}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(`Modal chart execution failed: ${result.error}`)
    }
    
    const imageBuffer = Buffer.from(result.image, 'base64')
    
    console.log(`✅ Modal chart execution completed: ${imageBuffer.length} bytes`)
    return imageBuffer
    
  } catch (error) {
    console.error('❌ Modal chart execution failed:', error)
    throw new Error(`Chart execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Test Modal connection
 */
export async function testModalConnection(): Promise<boolean> {
  try {
    const response = await fetch(process.env.MODAL_CHART_ENDPOINT!, {
      method: 'GET'
    })
    
    return response.ok
  } catch (error) {
    console.error('❌ Modal connection test failed:', error)
    return false
  }
}
