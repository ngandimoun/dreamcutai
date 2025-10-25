# DreamCut Chatbot Implementation Guide

## Overview

This guide provides comprehensive documentation on how to implement and configure the DreamCut AI Chatbot using OpenAI's GPT-5 model family. The chatbot is designed for fast, context-aware interactions with support for image analysis and prompt generation.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [GPT-5 Configuration](#gpt-5-configuration)
3. [Core Components](#core-components)
4. [Implementation Steps](#implementation-steps)
5. [API Integration](#api-integration)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
├─────────────────────────────────────────────────────────┤
│  • ChatInterface (UI Component)                         │
│  • MessageBubble (Message Display)                      │
│  • ChatbotContext (State Management)                    │
│  • LibraryAssetPicker (Image Selection)                 │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      API Layer                           │
├─────────────────────────────────────────────────────────┤
│  • /api/chatbot/message (POST/GET)                      │
│  • /api/chatbot/history (GET)                           │
│  • /api/chatbot/conversations (POST/GET)                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                         │
├─────────────────────────────────────────────────────────┤
│  • ChatbotService (OpenAI Integration)                  │
│  • Knowledge Base (System Prompts)                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   External Services                      │
├─────────────────────────────────────────────────────────┤
│  • OpenAI GPT-5 API                                     │
│  • Supabase (Database & Auth)                          │
│  • Storage (Image Handling)                            │
└─────────────────────────────────────────────────────────┘
```

---

## GPT-5 Configuration

### Key Differences from GPT-4

GPT-5 models require different parameters compared to GPT-4:

| Parameter | GPT-4 | GPT-5 |
|-----------|-------|-------|
| `temperature` | ✅ Supported | ❌ Not supported |
| `top_p` | ✅ Supported | ❌ Not supported |
| `reasoning_effort` | ❌ Not available | ✅ Required |
| `verbosity` | ❌ Not available | ✅ Required |

### Optimal Settings for Chatbot

```typescript
// lib/openai/chatbot-service.ts

export interface ChatbotServiceConfig {
  model?: string
  maxTokens?: number
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'
  verbosity?: 'low' | 'medium' | 'high'
}

const config = {
  model: 'gpt-5-mini-2025-08-07',
  maxTokens: 1500,
  reasoningEffort: 'minimal', // Fast responses for chat
  verbosity: 'low' // Concise responses
}
```

### Reasoning Effort Levels

- **minimal**: Fastest, best for simple chat interactions
- **low**: Balanced speed and reasoning
- **medium**: Default, more thorough thinking
- **high**: Most complex reasoning, slower responses

### Verbosity Levels

- **low**: Concise, quick responses (recommended for chat)
- **medium**: Balanced length
- **high**: Detailed explanations

---

## Core Components

### 1. ChatbotService Class

The main service class handles all OpenAI API interactions.

```typescript
// lib/openai/chatbot-service.ts

import OpenAI from 'openai'
import { generateSystemPrompt } from '@/lib/chatbot/knowledge-base'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class ChatbotService {
  private config: ChatbotServiceConfig

  constructor(config: ChatbotServiceConfig = {}) {
    this.config = {
      model: 'gpt-5-mini-2025-08-07',
      maxTokens: 1500,
      reasoningEffort: 'minimal',
      verbosity: 'low',
      ...config
    }
  }

  // Methods: sendMessage, streamMessage, generatePromptFromImage
}
```

### 2. Send Message (Non-Streaming)

```typescript
async sendMessage(params: SendMessageParams): Promise<ChatbotResponse> {
  try {
    // Build messages array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

    // Add system prompt
    messages.push({
      role: 'system',
      content: generateSystemPrompt(currentSection, hasImages)
    })

    // Add conversation history
    const recentHistory = history?.slice(-10) || []
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      })
    }

    // Add current message with images
    const currentContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = []
    currentContent.push({
      type: 'text',
      text: message
    })

    // Add images if present
    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles.slice(0, 2)) {
        const base64 = await this.fileToBase64(file)
        currentContent.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.type};base64,${base64}`,
            detail: 'high'
          }
        })
      }
    }

    messages.push({
      role: 'user',
      content: currentContent.length === 1 ? message : currentContent
    })

    // Make API call with GPT-5 parameters
    const response = await openai.chat.completions.create({
      model: this.config.model!,
      messages,
      max_completion_tokens: this.config.maxTokens,
      stream: false, // Explicitly set to false
      reasoning_effort: this.config.reasoningEffort,
      verbosity: this.config.verbosity
    })

    // Handle response with null checks
    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error('No response from OpenAI')
    }

    const assistantMessage = response.choices[0]?.message?.content

    if (!assistantMessage) {
      throw new Error('No response content from OpenAI')
    }

    return {
      success: true,
      message: this.formatResponse(assistantMessage),
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      }
    }

  } catch (error) {
    return this.handleError(error)
  }
}
```

### 3. Stream Message (Real-time Responses)

```typescript
async *streamMessage(params: SendMessageParams): AsyncGenerator<string, void, unknown> {
  try {
    // Build messages array (same as sendMessage)
    const messages = [/* ... */]

    // Stream response with GPT-5 parameters
    const stream = await openai.chat.completions.create({
      model: this.config.model!,
      messages,
      max_completion_tokens: this.config.maxTokens,
      stream: true, // Explicitly set to true
      reasoning_effort: this.config.reasoningEffort,
      verbosity: this.config.verbosity
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }

  } catch (error) {
    yield `Error: ${this.getErrorMessage(error)}`
  }
}
```

### 4. Image Analysis

```typescript
async generatePromptFromImage(request: PromptGenerationRequest): Promise<PromptGenerationResponse> {
  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

    // System prompt for image analysis
    messages.push({
      role: 'system',
      content: `You are an expert at analyzing images and creating detailed prompts...`
    })

    // Add images and instructions
    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = []
    content.push({
      type: 'text',
      text: `Please analyze this image and create optimized prompts...`
    })

    // Add images
    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles.slice(0, 2)) {
        const base64 = await this.fileToBase64(file)
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.type};base64,${base64}`,
            detail: 'high'
          }
        })
      }
    }

    messages.push({
      role: 'user',
      content: content.length === 1 ? content[0] : content
    })

    const response = await openai.chat.completions.create({
      model: this.config.model!,
      messages,
      max_completion_tokens: this.config.maxTokens,
      stream: false,
      reasoning_effort: this.config.reasoningEffort,
      verbosity: this.config.verbosity
    })

    const analysis = response.choices[0]?.message?.content

    if (!analysis) {
      throw new Error('No analysis generated')
    }

    return {
      success: true,
      prompt: analysis,
      suggestions: this.extractPromptSuggestions(analysis)
    }

  } catch (error) {
    return this.handleError(error)
  }
}
```

---

## API Integration

### API Route: Message Handler

```typescript
// app/api/chatbot/message/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatbotService } from '@/lib/openai/chatbot-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const message = formData.get('message') as string
    const currentSection = formData.get('currentSection') as string
    const conversationId = formData.get('conversationId') as string
    const imageFiles = formData.getAll('images') as File[]
    const imageUrls = formData.getAll('imageUrls') as string[]

    // Validate input
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get conversation history
    const { data: historyData } = await supabase
      .from('chat_history')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20)

    const history = historyData?.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      imageUrls: msg.image_urls || [],
      currentSection: msg.current_section,
      metadata: msg.metadata || {},
      createdAt: msg.created_at
    })) || []

    // Save user message
    const { data: savedUserMessage } = await supabase
      .from('chat_history')
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        role: 'user',
        content: message,
        image_urls: imageUrls,
        current_section: currentSection,
        metadata: {}
      })
      .select()
      .single()

    // Get AI response
    const response = await chatbotService.sendMessage({
      userId: user.id,
      conversationId,
      message,
      currentSection,
      imageFiles,
      imageUrls,
      history
    })

    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    // Save AI response
    const { data: savedAssistantMessage } = await supabase
      .from('chat_history')
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        role: 'assistant',
        content: response.message!,
        image_urls: [],
        current_section: currentSection,
        metadata: { usage: response.usage }
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      message: {
        id: savedAssistantMessage?.id,
        role: 'assistant',
        content: response.message!,
        imageUrls: [],
        currentSection,
        metadata: { usage: response.usage },
        createdAt: new Date().toISOString()
      },
      conversationId
    })

  } catch (error) {
    console.error('Chatbot message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Error Handling

### Enhanced Error Handler

```typescript
private handleError(error: unknown): ChatbotResponse {
  console.error('Chatbot service error:', error)
  
  let errorMessage = 'Failed to get response from OpenAI'
  
  if (error instanceof Error) {
    errorMessage = error.message
    
    // Handle specific GPT-5 parameter errors
    if (error.message.includes('temperature') || error.message.includes('top_p')) {
      errorMessage = 'GPT-5 model configuration error. Please contact support.'
    } else if (error.message.includes('reasoning_effort') || error.message.includes('verbosity')) {
      errorMessage = 'GPT-5 parameter configuration error. Please contact support.'
    } else if (error.message.includes('rate_limit')) {
      errorMessage = 'Rate limit exceeded. Please try again in a moment.'
    } else if (error.message.includes('insufficient_quota')) {
      errorMessage = 'API quota exceeded. Please contact support.'
    }
  }
  
  // Log API error details
  if (error && typeof error === 'object' && 'response' in error) {
    console.error('OpenAI API error details:', (error as any).response?.data)
  }
  
  return {
    success: false,
    error: errorMessage
  }
}
```

### Common Error Types

| Error | Cause | Solution |
|-------|-------|----------|
| `Unsupported value: 'temperature'` | Using GPT-4 parameters | Use `reasoning_effort` and `verbosity` |
| `Cannot read properties of undefined` | Response null check missing | Add proper null checks |
| `rate_limit_exceeded` | Too many requests | Implement rate limiting |
| `insufficient_quota` | API quota exceeded | Check billing settings |

---

## Best Practices

### 1. **Context Management**

```typescript
// Keep conversation history limited
const recentHistory = history?.slice(-10) || []

// Provide section-specific context
const systemPrompt = generateSystemPrompt(currentSection, hasImages)
```

### 2. **Token Optimization**

```typescript
// Use appropriate max tokens
maxTokens: 1500, // Balance between completeness and cost

// Use minimal reasoning for chat
reasoningEffort: 'minimal', // Fast responses

// Use low verbosity for conciseness
verbosity: 'low' // Reduce token usage
```

### 3. **Image Handling**

```typescript
// Limit number of images
const maxImages = 2
imageFiles.slice(0, maxImages)

// Validate image size and type
const maxSize = 10 * 1024 * 1024 // 10MB
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Use high detail for better analysis
detail: 'high'
```

### 4. **Response Formatting**

```typescript
private formatResponse(rawResponse: string): string {
  return rawResponse
    .replace(/\n{3,}/g, '\n\n') // Max 2 line breaks
    .trim()
}
```

### 5. **Security**

```typescript
// Always authenticate users
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Validate user owns conversation
.eq('user_id', user.id)
```

---

## Knowledge Base Integration

### System Prompt Generation

```typescript
// lib/chatbot/knowledge-base.ts

export function generateSystemPrompt(currentSection?: string, hasImages?: boolean): string {
  const currentFeature = currentSection ? getFeatureById(currentSection) : null
  
  let prompt = `You are DreamCut AI Assistant, an expert helper for the DreamCut platform.

PLATFORM OVERVIEW:
DreamCut enables users to create various types of media assets including:
- Visuals: Avatars & Personas, Product Mockups, Charts & Infographics
- Audios: Voiceovers, Music & Jingles  
- Motions: Talking Avatars, Diverse Motion (Single/Dual Asset)

${currentFeature ? `
CURRENT SECTION: ${currentFeature.name}
${currentFeature.description}

PROMPT TEMPLATES:
${currentFeature.promptTemplates.map(t => `- ${t}`).join('\n')}

BEST PRACTICES:
${currentFeature.bestPractices.map(p => `- ${p}`).join('\n')}
` : ''}

YOUR CAPABILITIES:
1. Help users understand DreamCut features
2. Craft optimized prompts for any asset type
3. Analyze uploaded images and generate prompts
4. Provide best practices and tips
5. Suggest improvements and variations

CRITICAL RESPONSE RULES:
- Keep responses under 300 words
- Start with a direct answer (1-2 sentences max)
- Use 2-4 strategic emojis maximum
- End with ONE focused question

${hasImages ? 'Analyze images and provide structured prompt suggestions.' : ''}
`

  return prompt
}
```

---

## Frontend Integration

### React Context Provider

```typescript
// components/chatbot/chatbot-context.tsx

export function ChatbotProvider({ children, currentSection }: ChatbotProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (message: string, imageFiles?: File[], imageUrls?: string[]) => {
    setIsLoading(true)

    const formData = new FormData()
    formData.append('message', message)
    formData.append('currentSection', currentSection || '')
    formData.append('conversationId', conversationId)
    
    if (imageFiles) {
      imageFiles.forEach(file => formData.append('images', file))
    }
    
    if (imageUrls) {
      imageUrls.forEach(url => formData.append('imageUrls', url))
    }

    const response = await fetch('/api/chatbot/message', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (data.success && data.message) {
      setMessages(prev => [...prev, data.message])
    }

    setIsLoading(false)
  }

  return (
    <ChatbotContext.Provider value={{ messages, sendMessage, isLoading }}>
      {children}
    </ChatbotContext.Provider>
  )
}
```

---

## Troubleshooting

### Issue: Temperature Error

**Symptom**: `BadRequestError: 400 Unsupported value: 'temperature'`

**Solution**:
```typescript
// ❌ Wrong (GPT-4 style)
const response = await openai.chat.completions.create({
  model: 'gpt-5-mini-2025-08-07',
  messages,
  temperature: 0.7 // Not supported!
})

// ✅ Correct (GPT-5 style)
const response = await openai.chat.completions.create({
  model: 'gpt-5-mini-2025-08-07',
  messages,
  reasoning_effort: 'minimal',
  verbosity: 'low'
})
```

### Issue: Undefined Response

**Symptom**: `Cannot read properties of undefined (reading '0')`

**Solution**:
```typescript
// ❌ Wrong
const assistantMessage = response.choices[0]?.message?.content

// ✅ Correct
if (!response || !response.choices || response.choices.length === 0) {
  throw new Error('No response from OpenAI')
}
const assistantMessage = response.choices[0]?.message?.content
```

### Issue: Streaming Conflict

**Symptom**: Response hangs or fails unpredictably

**Solution**:
```typescript
// Non-streaming: explicitly set stream: false
const response = await openai.chat.completions.create({
  stream: false,
  // ...
})

// Streaming: explicitly set stream: true
const stream = await openai.chat.completions.create({
  stream: true,
  // ...
})
```

---

## Environment Configuration

### Required Environment Variables

```bash
# .env.local

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Database Schema

### Chat History Table

```sql
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  image_urls TEXT[],
  current_section TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_history_conversation ON chat_history(conversation_id);
CREATE INDEX idx_chat_history_user ON chat_history(user_id);
CREATE INDEX idx_chat_history_created ON chat_history(created_at DESC);
```

---

## Performance Optimization

### 1. **Prompt Caching**

Cache system prompts to reduce token usage:

```typescript
const systemPromptCache = new Map<string, string>()

function getCachedSystemPrompt(section: string): string {
  if (!systemPromptCache.has(section)) {
    systemPromptCache.set(section, generateSystemPrompt(section))
  }
  return systemPromptCache.get(section)!
}
```

### 2. **Response Streaming**

For better UX, use streaming for real-time responses:

```typescript
// Enable streaming for long conversations
if (message.length > 200 || history.length > 5) {
  return streamMessage(params)
}
```

### 3. **Rate Limiting**

Implement user-level rate limiting:

```typescript
const rateLimiter = new Map<string, number>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const lastRequest = rateLimiter.get(userId) || 0
  
  if (now - lastRequest < 2000) { // 2 second cooldown
    return false
  }
  
  rateLimiter.set(userId, now)
  return true
}
```

---

## Testing

### Unit Tests

```typescript
// __tests__/chatbot-service.test.ts

describe('ChatbotService', () => {
  it('should send message with GPT-5 parameters', async () => {
    const service = new ChatbotService()
    const response = await service.sendMessage({
      userId: 'test-user',
      conversationId: 'test-conv',
      message: 'Hello',
      currentSection: 'library',
      history: []
    })
    
    expect(response.success).toBe(true)
    expect(response.message).toBeDefined()
  })
  
  it('should handle errors gracefully', async () => {
    // Test error scenarios
  })
})
```

---

## Migration from GPT-4 to GPT-5

### Step 1: Update Configuration

```typescript
// Before (GPT-4)
const config = {
  model: 'gpt-4-turbo',
  temperature: 0.7,
  top_p: 0.9
}

// After (GPT-5)
const config = {
  model: 'gpt-5-mini-2025-08-07',
  reasoningEffort: 'minimal',
  verbosity: 'low'
}
```

### Step 2: Remove Unsupported Parameters

```typescript
// Remove these from all API calls
temperature: 0.7,  // ❌ Remove
top_p: 0.9,        // ❌ Remove

// Add these instead
reasoning_effort: 'minimal',  // ✅ Add
verbosity: 'low'              // ✅ Add
```

### Step 3: Update Error Handling

Add GPT-5 specific error messages for better debugging.

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database schema created
- [ ] OpenAI API key valid and has credits
- [ ] GPT-5 model name correct
- [ ] All `temperature` and `top_p` removed
- [ ] `reasoning_effort` and `verbosity` added
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] Authentication working
- [ ] Image upload tested
- [ ] Streaming responses tested

---

## Additional Resources

- [OpenAI GPT-5 Documentation](https://platform.openai.com/docs/guides/gpt-5)
- [Responses API Guide](https://platform.openai.com/docs/guides/responses-vs-chat-completions)
- [DreamCut Knowledge Base](./lib/chatbot/knowledge-base.ts)
- [Implementation Summary](./CHATBOT_GPT5_FIX_SUMMARY.md)

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review error logs in console
- Verify GPT-5 configuration
- Contact development team

---

**Last Updated**: October 22, 2025
**Version**: 2.0 (GPT-5 Migration)



