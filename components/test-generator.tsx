"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  TestTube2,
  Loader2,
  CheckCircle,
  XCircle,
  Zap
} from "lucide-react"

const CONTENT_TYPES = [
  { value: 'illustrations', label: 'Illustrations', category: 'Visuals' },
  { value: 'comics', label: 'Comics', category: 'Visuals' },
  { value: 'avatars_personas', label: 'Avatars & Personas', category: 'Visuals' },
  { value: 'product_mockups', label: 'Product Mockups', category: 'Visuals' },
  { value: 'concept_worlds', label: 'Concept Worlds', category: 'Visuals' },
  { value: 'charts_infographics', label: 'Charts & Infographics', category: 'Visuals' },
  { value: 'voices_creations', label: 'Voice Creation', category: 'Audios' },
  { value: 'voiceovers', label: 'Voiceovers', category: 'Audios' },
  { value: 'music_jingles', label: 'Music & Jingles', category: 'Audios' },
  { value: 'sound_fx', label: 'Sound FX', category: 'Audios' },
  { value: 'explainers', label: 'Explainers', category: 'Motions' },
  { value: 'talking_avatars', label: 'Talking Avatars', category: 'Motions' },
  { value: 'subtitles', label: 'Subtitles', category: 'Edit' },
  { value: 'watermarks', label: 'Watermarks', category: 'Edit' },
  { value: 'video_translations', label: 'Video Translations', category: 'Edit' },
]

export function TestGenerator() {
  const [selectedType, setSelectedType] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isBatchGenerating, setIsBatchGenerating] = useState(false)
  const [results, setResults] = useState<Array<{
    type: string
    success: boolean
    message: string
  }>>([])

  const generateTest = async (contentType: string) => {
    try {
      const response = await fetch(`/api/test/generate/${contentType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()
      
      return {
        type: contentType,
        success: response.ok,
        message: response.ok 
          ? `✅ Generated ${contentType}` 
          : `❌ Failed: ${result.error || 'Unknown error'}`
      }
    } catch (error) {
      return {
        type: contentType,
        success: false,
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  const handleGenerateSingle = async () => {
    if (!selectedType) return

    setIsGenerating(true)
    setResults([])

    const result = await generateTest(selectedType)
    setResults([result])

    setIsGenerating(false)
  }

  const handleGenerateAll = async () => {
    setIsBatchGenerating(true)
    setResults([])

    const allResults: Array<{
      type: string
      success: boolean
      message: string
    }> = []

    // Generate one of each type
    for (const contentType of CONTENT_TYPES) {
      const result = await generateTest(contentType.value)
      allResults.push(result)
      setResults([...allResults])
      
      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsBatchGenerating(false)
  }

  const groupedTypes = CONTENT_TYPES.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = []
    acc[type.category].push(type)
    return acc
  }, {} as Record<string, typeof CONTENT_TYPES>)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" />
            Test Content Generator
          </CardTitle>
          <CardDescription>
            Generate mock content for testing without using API credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Single Generation */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Generate Single Content</label>
              <div className="flex gap-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select content type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(groupedTypes).map(([category, types]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {category}
                        </div>
                        {types.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleGenerateSingle}
                  disabled={!selectedType || isGenerating || isBatchGenerating}
                >
                  {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Generate
                </Button>
              </div>
            </div>

            {/* Batch Generation */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleGenerateAll}
                variant="default"
                className="w-full"
                disabled={isGenerating || isBatchGenerating}
              >
                {isBatchGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating All Types...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Quick Test: Generate All Types
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Generates 1 test item for each of the {CONTENT_TYPES.length} content types
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generation Results ({results.length})</CardTitle>
            <CardDescription>
              {results.filter(r => r.success).length} successful, {results.filter(r => !r.success).length} failed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <Alert key={index} variant={result.success ? "default" : "destructive"}>
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {CONTENT_TYPES.find(t => t.value === result.type)?.label || result.type}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {result.message}
                      </p>
                    </div>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

