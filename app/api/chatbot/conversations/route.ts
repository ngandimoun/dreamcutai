import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ChatConversation } from '@/lib/types/chatbot'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get conversations using the custom function
    const { data: conversations, error } = await supabase
      .rpc('get_user_conversations', { user_uuid: user.id })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    const formattedConversations: ChatConversation[] = conversations.map(conv => ({
      id: conv.conversation_id,
      lastMessage: conv.last_message,
      lastMessageAt: conv.last_message_at,
      messageCount: conv.message_count
    }))

    // Apply pagination
    const paginatedConversations = formattedConversations.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      conversations: paginatedConversations,
      total: formattedConversations.length
    })

  } catch (error) {
    console.error('Conversations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, initialMessage } = body

    const conversationId = crypto.randomUUID()

    // Create initial message if provided
    if (initialMessage) {
      const { error: messageError } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          conversation_id: conversationId,
          role: 'user',
          content: initialMessage,
          image_urls: [],
          current_section: null,
          metadata: { title }
        })

      if (messageError) {
        console.error('Error creating initial message:', messageError)
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      conversationId,
      message: 'Conversation created successfully'
    })

  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Delete all messages in the conversation
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting conversation:', error)
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    })

  } catch (error) {
    console.error('Delete conversation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
