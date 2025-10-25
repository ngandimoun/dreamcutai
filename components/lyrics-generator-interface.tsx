'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Copy, Check, FileText, Music, Sparkles } from 'lucide-react'

interface GeneratedLyrics {
  id: string
  prompt: string
  title: string
  lyrics_text: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  suno_task_id: string
  created_at: string
  updated_at: string
}

interface LyricsGeneratorInterfaceProps {
  onLyricsSelect?: (lyrics: string) => void
  className?: string
}

export function LyricsGeneratorInterface({ 
  onLyricsSelect,
  className = '' 
}: LyricsGeneratorInterfaceProps) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLyrics, setGeneratedLyrics] = useState<GeneratedLyrics[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { toast } = useToast()

  // Word counting utility
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const wordCount = countWords(prompt)
  const maxWords = 200
  const isOverLimit = wordCount > maxWords

  // Load existing lyrics on mount
  useEffect(() => {
    loadLyrics()
  }, [])

  const loadLyrics = async () => {
    try {
      const response = await fetch('/api/lyrics')
      if (response.ok) {
        const data = await response.json()
        setGeneratedLyrics(data.lyricsGenerations || [])
      }
    } catch (error) {
      console.error('Failed to load lyrics:', error)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for your lyrics",
        variant: "destructive"
      })
      return
    }

    if (isOverLimit) {
      toast({
        title: "Word limit exceeded",
        description: `Please keep your prompt under ${maxWords} words (currently ${wordCount})`,
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate lyrics')
      }

      const result = await response.json()
      
      toast({
        title: "Lyrics generation started!",
        description: `Your lyrics are being generated. Task ID: ${result.lyricsGeneration.suno_task_id}`,
        duration: 5000
      })

      // Add to list with pending status
      const newLyrics: GeneratedLyrics = {
        id: result.lyricsGeneration.id,
        prompt: prompt.trim(),
        title: '',
        lyrics_text: '',
        status: 'pending',
        suno_task_id: result.lyricsGeneration.suno_task_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setGeneratedLyrics(prev => [newLyrics, ...prev])
      setPrompt('')

      // Start polling for status
      pollLyricsStatus(result.lyricsGeneration.suno_task_id)

    } catch (error) {
      console.error('Error generating lyrics:', error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const pollLyricsStatus = async (taskId: string) => {
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    let attempts = 0

    const poll = async () => {
      try {
        const response = await fetch(`/api/lyrics/${taskId}`)
        if (response.ok) {
          const data = await response.json()
          
          // Update the lyrics in the list
          setGeneratedLyrics(prev => 
            prev.map(lyrics => 
              lyrics.suno_task_id === taskId 
                ? { ...lyrics, ...data.lyricsGeneration }
                : lyrics
            )
          )

          if (data.status === 'completed' || data.status === 'failed') {
            // Stop polling
            return
          }
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000) // Poll every 5 seconds
        }
      } catch (error) {
        console.error('Error polling lyrics status:', error)
      }
    }

    poll()
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast({
        title: "Copied to clipboard",
        description: "Lyrics copied successfully"
      })
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy lyrics to clipboard",
        variant: "destructive"
      })
    }
  }

  const useLyrics = (lyrics: string) => {
    if (onLyricsSelect) {
      onLyricsSelect(lyrics)
      toast({
        title: "Lyrics selected",
        description: "Lyrics have been added to your music generation"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case 'generating':
        return <Badge variant="secondary">Generating...</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Lyrics
          </CardTitle>
          <CardDescription>
            Describe the theme, mood, or story for your lyrics. Keep it under 200 words.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Description</span>
              <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
                {wordCount} / {maxWords} words
              </span>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the theme, mood, or story for your lyrics (e.g., 'A love song about finding hope in difficult times, with themes of resilience and new beginnings')"
              className="min-h-[100px] text-sm resize-none"
              disabled={isGenerating}
            />
            {isOverLimit && (
              <p className="text-xs text-red-500">
                Please reduce your description to under {maxWords} words
              </p>
            )}
          </div>

          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || isOverLimit}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Lyrics...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Lyrics
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Lyrics */}
      {generatedLyrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Generated Lyrics
            </CardTitle>
            <CardDescription>
              Your generated lyrics will appear here. Click "Use These Lyrics" to add them to your music generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedLyrics.map((lyrics) => (
              <div key={lyrics.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">
                      {lyrics.title || 'Untitled Lyrics'}
                    </h4>
                    {getStatusBadge(lyrics.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    {lyrics.status === 'completed' && lyrics.lyrics_text && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(lyrics.lyrics_text, lyrics.id)}
                        >
                          {copiedId === lyrics.id ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          Copy
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => useLyrics(lyrics.lyrics_text)}
                        >
                          Use These Lyrics
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p><strong>Prompt:</strong> {lyrics.prompt}</p>
                  <p><strong>Generated:</strong> {new Date(lyrics.created_at).toLocaleString()}</p>
                </div>

                {lyrics.status === 'completed' && lyrics.lyrics_text && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Lyrics:</h5>
                      <div className="bg-muted/30 rounded-md p-3 text-sm whitespace-pre-wrap">
                        {lyrics.lyrics_text}
                      </div>
                    </div>
                  </>
                )}

                {lyrics.status === 'generating' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Generating lyrics... This may take a few minutes.
                  </div>
                )}

                {lyrics.status === 'failed' && (
                  <div className="text-sm text-red-500">
                    Lyrics generation failed. Please try again with a different prompt.
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}




