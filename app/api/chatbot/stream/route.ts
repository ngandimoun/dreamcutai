import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatbotService, ChatbotService } from '@/lib/openai/chatbot-service'
import { ChatMessage } from '@/lib/types/chatbot'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const formData = await request.formData()
    const message = formData.get('message') as string
    const currentSection = formData.get('currentSection') as string
    const conversationId = formData.get('conversationId') as string
    const imageFiles = formData.getAll('images') as File[]
    const imageUrls = formData.getAll('imageUrls') as string[]

    if (!message) {
      return new Response('Message is required', { status: 400 })
    }

    // Validate image files
    const validImageFiles: File[] = []
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const validation = ChatbotService.validateImageFile(file)
        if (!validation.valid) {
          return new Response(validation.error, { status: 400 })
        }
        validImageFiles.push(file)
      }
    }

    // Limit to 2 images max
    if (validImageFiles.length > 2 || imageUrls.length > 2) {
      return new Response('Maximum 2 images allowed', { status: 400 })
    }

    // Get conversation history
    let history: ChatMessage[] = []
    if (conversationId) {
      const { data: historyData, error: historyError } = await supabase
        .from('chat_history')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(20)

      if (!historyError && historyData) {
        history = historyData.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          imageUrls: msg.image_urls || [],
          currentSection: msg.current_section,
          metadata: msg.metadata || {},
          createdAt: msg.created_at
        }))
      }
    }

    // Save user message to database
    const userMessage = {
      user_id: user.id,
      conversation_id: conversationId || crypto.randomUUID(),
      role: 'user',
      content: message,
      image_urls: imageUrls,
      current_section: currentSection,
      metadata: {}
    }

    const { data: savedUserMessage, error: saveError } = await supabase
      .from('chat_history')
      .insert(userMessage)
      .select()
      .single()

    if (saveError) {
      console.error('Error saving user message:', saveError)
      return new Response('Failed to save message', { status: 500 })
    }

    const finalConversationId = savedUserMessage.conversation_id

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = ''
          
          // Stream from OpenAI
          for await (const chunk of chatbotService.streamMessage({
            userId: user.id,
            conversationId: finalConversationId,
            message,
            currentSection,
            imageFiles: validImageFiles,
            imageUrls,
            history
          })) {
            fullContent += chunk
            
            // Send chunk to client
            const data = JSON.stringify({ 
              chunk,
              conversationId: finalConversationId,
              isComplete: false
            })
            controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
          }

          // Save complete AI response to database
          const assistantMessage = {
            user_id: user.id,
            conversation_id: finalConversationId,
            role: 'assistant',
            content: fullContent,
            image_urls: [],
            current_section: currentSection,
            metadata: {}
          }

          const { data: savedAssistantMessage, error: assistantSaveError } = await supabase
            .from('chat_history')
            .insert(assistantMessage)
            .select()
            .single()

          if (assistantSaveError) {
            console.error('Error saving assistant message:', assistantSaveError)
          }

          // Signal completion
          const completionData = JSON.stringify({
            chunk: '',
            conversationId: finalConversationId,
            isComplete: true,
            messageId: savedAssistantMessage?.id || crypto.randomUUID()
          })
          controller.enqueue(new TextEncoder().encode(`data: ${completionData}\n\n`))
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()

        } catch (error) {
          console.error('Streaming error:', error)
          
          // Send error to client
          const errorData = JSON.stringify({
            error: error instanceof Error ? error.message : 'Streaming failed',
            isComplete: true
          })
          controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    console.error('Chatbot stream error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}


