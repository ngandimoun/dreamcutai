import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatbotService, ChatbotService } from '@/lib/openai/chatbot-service'
import { ChatMessage } from '@/lib/types/chatbot'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const message = formData.get('message') as string
    const currentSection = formData.get('currentSection') as string
    const conversationId = formData.get('conversationId') as string
    const imageFiles = formData.getAll('images') as File[]
    const imageUrls = formData.getAll('imageUrls') as string[]

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Validate image files
    const validImageFiles: File[] = []
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const validation = ChatbotService.validateImageFile(file)
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 })
        }
        validImageFiles.push(file)
      }
    }

    // Limit to 2 images max
    if (validImageFiles.length > 2 || imageUrls.length > 2) {
      return NextResponse.json({ error: 'Maximum 2 images allowed' }, { status: 400 })
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
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    const finalConversationId = savedUserMessage.conversation_id

    // Get AI response
    const response = await chatbotService.sendMessage({
      userId: user.id,
      conversationId: finalConversationId,
      message,
      currentSection,
      imageFiles: validImageFiles,
      imageUrls,
      history
    })

    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    // Save AI response to database
    const assistantMessage = {
      user_id: user.id,
      conversation_id: finalConversationId,
      role: 'assistant',
      content: response.message!,
      image_urls: [],
      current_section: currentSection,
      metadata: {
        usage: response.usage
      }
    }

    const { data: savedAssistantMessage, error: assistantSaveError } = await supabase
      .from('chat_history')
      .insert(assistantMessage)
      .select()
      .single()

    if (assistantSaveError) {
      console.error('Error saving assistant message:', assistantSaveError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      message: {
        id: savedAssistantMessage?.id || crypto.randomUUID(),
        role: 'assistant',
        content: response.message!,
        imageUrls: [],
        currentSection,
        metadata: { usage: response.usage },
        createdAt: new Date().toISOString()
      },
      conversationId: finalConversationId
    })

  } catch (error) {
    console.error('Chatbot message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    const { data: messages, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    const formattedMessages: ChatMessage[] = messages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      imageUrls: msg.image_urls || [],
      currentSection: msg.current_section,
      metadata: msg.metadata || {},
      createdAt: msg.created_at
    }))

    return NextResponse.json({
      success: true,
      messages: formattedMessages
    })

  } catch (error) {
    console.error('Chatbot history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
