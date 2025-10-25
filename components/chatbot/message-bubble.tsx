"use client"

import React from 'react'
import { ChatMessage } from '@/lib/types/chatbot'
import { Button } from '@/components/ui/button'
import { Copy, Check, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const formatContent = (content: string) => {
    // Enhanced markdown-like formatting with comprehensive color accents for better readability
    let formatted = content
    
    // Numbered items with titles (e.g., "1) Brand/team hero image (static)")
    formatted = formatted.replace(/^(\d+)\)\s+([^(\n]+)(\([^)]+\))?/gim, (match, num, title, tag) => {
      const coloredTag = tag ? `<span class="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded ml-2">${tag}</span>` : ''
      return `<div class="mb-3 mt-2"><span class="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">${num})</span> <strong class="font-bold text-blue-600 dark:text-blue-400">${title.trim()}</strong>${coloredTag}</div>`
    })
    
    // Section labels ending with colon (e.g., "Subjects & clothing:", "Environment:")
    formatted = formatted.replace(/^-\s+([^:]+):/gim, '<div class="mb-2 mt-3"><strong class="font-bold text-purple-600 dark:text-purple-400">• $1:</strong></div>')
    
    // Hex color codes with visual badge
    formatted = formatted.replace(/#([0-9A-F]{6})/gi, (match, hex) => {
      return `<span class="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono text-sm"><span class="w-3 h-3 rounded border border-gray-300 dark:border-gray-600" style="background-color: ${match}"></span><code class="text-foreground font-semibold">${match}</code></span>`
    })
    
    // Headers with gradient colors (## and ###)
    formatted = formatted
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold mt-4 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-4 mb-3 bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-600 bg-clip-text text-transparent">$1</h2>')
    
    // Bold text with color accent
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-blue-600 dark:text-blue-400">$1</strong>')
    
    // Italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic text-purple-600 dark:text-purple-400">$1</em>')
    
    // Code blocks with enhanced styling
    const codeBlockRegex = /```([\s\S]*?)```/g
    formatted = formatted.replace(codeBlockRegex, '<pre class="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-l-4 border-blue-500 p-4 rounded-lg overflow-x-auto my-3 text-sm font-mono shadow-sm"><code class="text-foreground">$1</code></pre>')
    
    // Inline code with accent background
    const inlineCodeRegex = /`([^`]+)`/g
    formatted = formatted.replace(inlineCodeRegex, '<code class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono text-sm font-semibold">$1</code>')
    
    // Bullet points with colored markers
    formatted = formatted.replace(/^• (.*$)/gim, '<li class="ml-4 mb-1.5 flex items-start"><span class="text-blue-500 mr-2">•</span><span>$1</span></li>')
    formatted = formatted.replace(/^- (.*$)/gim, '<li class="ml-4 mb-1.5 flex items-start"><span class="text-purple-500 mr-2">•</span><span>$1</span></li>')
    
    // Line breaks
    formatted = formatted.replace(/\n\n/g, '</p><p class="mb-2">')
    formatted = '<p class="mb-2">' + formatted + '</p>'
    
    return formatted
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`
            px-4 py-3 rounded-2xl shadow-sm
            ${isUser 
              ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white' 
              : 'bg-background border border-border'
            }
            ${isAssistant ? 'relative' : ''}
          `}
        >
          {/* Image previews */}
          {message.imageUrls && message.imageUrls.length > 0 && (
            <div className="mb-3 space-y-2">
              {message.imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Uploaded image ${index + 1}`}
                    className="max-w-full h-auto rounded-lg border border-border/50"
                    style={{ maxHeight: '200px' }}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(url, '_blank')}
                    >
                      <ImageIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message content */}
          <div 
            className={`text-sm leading-7 ${
              isUser ? 'text-white' : 'text-foreground'
            }`}
            style={{ lineHeight: '1.7' }}
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />

          {/* Typing cursor for streaming messages */}
          {isAssistant && message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
          )}

          {/* Copy button for assistant messages with prompts */}
          {isAssistant && (
            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {new Date(message.createdAt).toLocaleTimeString()}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                onClick={() => copyToClipboard(message.content)}
                title="Copy message"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}

          {/* User message timestamp */}
          {isUser && (
            <div className="text-xs text-white/70 mt-1 text-right">
              {new Date(message.createdAt).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Current section badge for assistant messages */}
        {isAssistant && message.currentSection && (
          <div className="mt-1 text-xs text-muted-foreground">
            Context: {message.currentSection.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        )}
      </div>
    </div>
  )
}
