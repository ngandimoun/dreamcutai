import type { Dispatch, SetStateAction } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  imageUrls?: string[]
  currentSection?: string
  isStreaming?: boolean
  metadata?: {
    promptType?: string
    assetType?: string
    rating?: number
    copied?: boolean
  }
  createdAt: string
}

export interface ChatConversation {
  id: string
  lastMessage: string
  lastMessageAt: string
  messageCount: number
}

export interface ChatbotContextType {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
  conversationId: string | null
  setConversationId: Dispatch<SetStateAction<string | null>>
  messages: ChatMessage[]
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>
  currentSection: string
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  sendMessage: (message: string, imageFiles?: File[], imageUrls?: string[]) => Promise<void>
  clearConversation: () => void
  loadConversation: (conversationId: string) => void
}

export interface SendMessageRequest {
  message: string
  imageFiles?: File[]
  imageUrls?: string[] // For library images
  currentSection: string
  conversationId?: string
}

export interface SendMessageResponse {
  success: boolean
  message?: ChatMessage
  conversationId?: string
  error?: string
}

export interface ChatHistoryResponse {
  success: boolean
  messages?: ChatMessage[]
  error?: string
}

export interface ConversationsResponse {
  success: boolean
  conversations?: ChatConversation[]
  error?: string
}

export interface ImageUploadResponse {
  success: boolean
  url?: string
  error?: string
}

export interface PromptGenerationRequest {
  imageFiles?: File[]
  imageUrls?: string[]
  instructions: string
  assetType?: string
  currentSection: string
}

export interface PromptGenerationResponse {
  success: boolean
  prompt?: string
  suggestions?: string[]
  error?: string
}

export interface StreamingResponse {
  chunk: string
  conversationId: string
  isComplete: boolean
  messageId?: string
  error?: string
}
