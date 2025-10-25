"use client"

import { useState, useCallback } from 'react'
import { toast } from '@/hooks/use-toast'

interface Character {
  name: string
  description: string
  role: string
  customRole?: string
  skinTone: string
  hairColor: string
  eyeColor: string
  outfitMain: string
  outfitAccent?: string
  images?: string[]
}

interface ComicSettings {
  inspirationStyle: string
  vibe: string
  type: string
}

interface GenerationResult {
  images: CharacterVariation[]
  variations: Array<{
    url: string
    variationNumber: number
    metadata: {
      character: any
      comicSettings: any
      artifactContext: any
      generationContext: any
      technical: any
    }
  }>
  seed: number
  prompt: string
  metadata: {
    totalVariations: number
    generationTimestamp: string
    comicTitle: string
    selectedArtifact: any
    generationContext: any
  }
}

export function useCharacterGeneration() {
  const [variations, setVariations] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(undefined)
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)

  const generateCharacter = useCallback(async (
    character: Character, 
    comicSettings: ComicSettings, 
    options?: {
      comicTitle?: string
      selectedArtifact?: { 
        id: string, 
        title?: string,
        isPublic?: boolean,
        type?: string,
        section?: string
      }
    }
  ) => {
    setIsGenerating(true)
    setVariations([])
    setSelectedIndex(undefined)
    setGenerationResult(null)

    console.log('🎨 Starting character generation...')
    console.log('Character:', character.name || 'Unnamed')
    console.log('Comic Settings:', comicSettings)
    console.log('Options:', options)

    // Build comprehensive metadata
    const metadata = {
      comicTitle: options?.comicTitle,
      selectedArtifact: options?.selectedArtifact ? {
        id: options.selectedArtifact.id,
        title: options.selectedArtifact.title,
        isPublic: options.selectedArtifact.isPublic,
        type: options.selectedArtifact.type,
        section: options.selectedArtifact.section
      } : undefined,
      generationContext: {
        formType: 'comics-form',
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
      }
    }

    try {
      console.log('📡 Sending request to fal.ai with metadata...')
      const response = await fetch('/api/generate-character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character,
          comicSettings,
          metadata
        }),
      })

      console.log('📡 Response received:', response.status)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate character')
      }

      if (data.success) {
        console.log('✅ Generation successful!', data.images?.length, 'images generated')
        console.log('🖼️ Frontend received images:', data.images)
        console.log('📊 Frontend received variations metadata:', data.variations)
        setVariations(data.images)
        setGenerationResult(data)
        console.log('🔄 Variations state updated:', data.images)
        
        
        toast({
          title: "🎉 Character Generated!",
          description: `2 variations have been created. Choose your favorite!`,
        })
      } else {
        throw new Error(data.error || 'Generation failed')
      }
    } catch (error) {
      console.error('❌ Character generation error:', error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate character variations",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
      console.log('🏁 Generation process completed')
    }
  }, [])

  const regenerateCharacter = useCallback(async (
    character: Character, 
    comicSettings: ComicSettings, 
    options?: {
      comicTitle?: string
      selectedArtifact?: { 
        id: string, 
        title?: string,
        isPublic?: boolean,
        type?: string,
        section?: string
      }
    }
  ) => {
    await generateCharacter(character, comicSettings, options)
  }, [generateCharacter])

  const selectVariation = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  const confirmSelection = useCallback(() => {
    if (selectedIndex !== undefined && variations[selectedIndex]) {
      const selectedVariation = variations[selectedIndex]
      toast({
        title: "Character Selected!",
        description: `Variation ${selectedIndex + 1} has been chosen.`,
      })
      return selectedVariation
    }
    return null
  }, [selectedIndex, variations])

  const clearVariations = useCallback(() => {
    setVariations([])
    setSelectedIndex(undefined)
    setGenerationResult(null)
  }, [])


  return {
    variations,
    isGenerating,
    selectedIndex,
    generationResult,
    generateCharacter,
    regenerateCharacter,
    selectVariation,
    confirmSelection,
    clearVariations,
  }
}
