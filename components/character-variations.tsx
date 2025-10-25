"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { convertToSignedUrls } from "@/lib/storage/signed-urls"

interface CharacterVariationMetadata {
  character: {
    name: string
    description: string
    role: string
    customRole?: string
    appearance: {
      skinTone: string
      hairColor: string
      eyeColor: string
      outfitMain: string
      outfitAccent?: string
    }
    hasReferenceImages: boolean
    referenceImageCount: number
  }
  comicSettings: {
    inspirationStyle: string
    vibe: string
    type: string
  }
  artifactContext?: {
    id: string
    title?: string
    isPublic?: boolean
    type?: string
    section?: string
  }
  generationContext: {
    formType: string
    timestamp: string
    comicTitle: string
    model: string
    prompt: string
    seed: number
    userAgent?: string
  }
  technical: {
    imageSize: { width: number, height: number }
    generationTime: number
    apiVersion: string
    source: string
  }
}

interface CharacterVariationsProps {
  variations: string[]
  variationsMetadata?: Array<{
    url: string
    variationNumber: number
    metadata: CharacterVariationMetadata
  }>
  isLoading: boolean
  onSelect: (index: number) => void
  onRegenerate: () => void
  selectedIndex?: number
  className?: string
}

export function CharacterVariations({
  variations,
  variationsMetadata,
  isLoading,
  onSelect,
  onRegenerate,
  selectedIndex,
  className
}: CharacterVariationsProps) {
  const [signedUrls, setSignedUrls] = useState<string[]>([])
  const [urlsLoading, setUrlsLoading] = useState(false)

  // Convert storage paths to signed URLs when variations change
  useEffect(() => {
    if (variations.length > 0) {
      setUrlsLoading(true)
      convertToSignedUrls(variations)
        .then(urls => {
          setSignedUrls(urls)
          setUrlsLoading(false)
        })
        .catch(error => {
          console.error('Error generating signed URLs:', error)
          setSignedUrls(variations) // Fallback to original URLs
          setUrlsLoading(false)
        })
    }
  }, [variations])

  console.log('🎨 CharacterVariations component rendered:', {
    variationsCount: variations.length,
    variationsMetadataCount: variationsMetadata?.length || 0,
    isLoading,
    selectedIndex,
    variations: variations,
    variationsMetadata: variationsMetadata,
    signedUrls: signedUrls
  })
  if (isLoading) {
    return (
      <div className={cn("w-full max-w-2xl mx-auto", className)}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            🎨 Generating Character Variations
          </h3>
          <p className="text-sm text-muted-foreground">
            Creating 4 unique variations of your character using AI...
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>This may take 10-30 seconds</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="aspect-square border-2 border-dashed border-primary/30">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Variation {i}</p>
                  <p className="text-xs text-muted-foreground">Generating...</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (variations.length === 0) {
    return null
  }

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Choose Your Character
        </h3>
        <p className="text-sm text-muted-foreground">
          Select the variation that best matches your vision
        </p>
        
        {/* Display generation metadata if available */}
        {variationsMetadata && variationsMetadata.length > 0 && (
          <div className="mt-4 space-y-3">
            {/* Prominent Artifact Selection Display */}
            {variationsMetadata[0].metadata.artifactContext && (
              <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <span className="text-lg">🎨</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-primary">Generated using:</span>
                      <span className="font-bold text-foreground text-lg">
                        {variationsMetadata[0].metadata.artifactContext.title || 'Selected Artifact'}
                      </span>
                      {variationsMetadata[0].metadata.artifactContext.isPublic ? (
                        <Badge variant="secondary" className="text-xs">Public</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Private</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Character variations created with this artifact style
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Additional Generation Details */}
            <div className="p-3 bg-muted/30 border border-border/50 rounded-lg text-left">
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-foreground">📊 Generation Details</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Style:</span> {variationsMetadata[0].metadata.comicSettings.inspirationStyle}
                  </div>
                  <div>
                    <span className="font-medium">Vibe:</span> {variationsMetadata[0].metadata.comicSettings.vibe}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {variationsMetadata[0].metadata.comicSettings.type}
                  </div>
                  <div>
                    <span className="font-medium">Character:</span> {variationsMetadata[0].metadata.character.name || 'Unnamed'}
                  </div>
                  <div>
                    <span className="font-medium">Generated:</span> {new Date(variationsMetadata[0].metadata.generationContext.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Debug info */}
        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
          <strong>Debug:</strong> Rendering {variations.length} variations
          {variationsMetadata && (
            <span> with {variationsMetadata.length} metadata entries</span>
          )}
          {signedUrls.length > 0 && (
            <div className="mt-1">
              <a href={signedUrls[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                Test first signed URL
              </a>
            </div>
          )}
          {urlsLoading && <div className="mt-1 text-blue-600">Generating signed URLs...</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {variations.map((variation, index) => {
          const displayUrl = signedUrls[index] || variation
          console.log(`🖼️ Rendering variation ${index + 1}:`, { original: variation, signed: displayUrl })
          return (
            <Card 
              key={index} 
              className={cn(
                "aspect-square cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                selectedIndex === index 
                  ? "ring-2 ring-primary shadow-lg border-primary" 
                  : "hover:shadow-md border-border hover:border-primary/50"
              )}
              onClick={() => onSelect(index)}
            >
              <CardContent className="p-0 h-full relative">
                {urlsLoading ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <img
                    src={displayUrl}
                    alt={`Character variation ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                    onLoad={() => console.log(`✅ Image ${index + 1} loaded successfully`)}
                    onError={(e) => console.error(`❌ Image ${index + 1} failed to load:`, e)}
                  />
                )}
              
              {/* Selection indicator */}
              {selectedIndex === index && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
                  <Check className="h-4 w-4" />
                </div>
              )}
              
              {/* Variation number and metadata */}
              <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                <div className="font-medium">Variation {index + 1}</div>
                {variationsMetadata && variationsMetadata[index] && (
                  <div className="mt-1 space-y-0.5">
                    {variationsMetadata[index].metadata.character.name && (
                      <div className="text-xs opacity-90 font-medium">
                        {variationsMetadata[index].metadata.character.name}
                      </div>
                    )}
                    {variationsMetadata[index].metadata.artifactContext && (
                      <div className="text-xs opacity-70">
                        via {variationsMetadata[index].metadata.artifactContext.title || 'Artifact'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                {selectedIndex !== index && (
                  <div className="opacity-0 hover:opacity-100 transition-opacity bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Click to select
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          )
        })}
      </div>

      {/* Selection confirmation */}
      {selectedIndex !== undefined && (
        <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Variation {selectedIndex + 1} selected</p>
              <p className="text-sm text-muted-foreground">This variation will be used for your character</p>
              
              {/* Show selected variation metadata */}
              {variationsMetadata && variationsMetadata[selectedIndex] && (
                <div className="mt-3 space-y-3">
                  {/* Prominent Artifact Display */}
                  {variationsMetadata[selectedIndex].metadata.artifactContext && (
                    <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🎨</span>
                        <span className="font-semibold text-primary">Generated using:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          {variationsMetadata[selectedIndex].metadata.artifactContext.title || 'Selected Artifact'}
                        </span>
                        {variationsMetadata[selectedIndex].metadata.artifactContext.isPublic ? (
                          <Badge variant="secondary" className="text-xs">Public</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Private</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Details */}
                  <div className="p-3 bg-background/50 rounded-lg border border-primary/20">
                    <div className="text-xs space-y-1">
                      <div className="font-medium text-primary">Selected Variation Details:</div>
                      <div>
                        <span className="font-medium">Character:</span> {variationsMetadata[selectedIndex].metadata.character.name || 'Unnamed Character'}
                      </div>
                      <div>
                        <span className="font-medium">Description:</span> {variationsMetadata[selectedIndex].metadata.character.description}
                      </div>
                      <div>
                        <span className="font-medium">Style:</span> {variationsMetadata[selectedIndex].metadata.comicSettings.inspirationStyle} • {variationsMetadata[selectedIndex].metadata.comicSettings.vibe}
                      </div>
                      <div>
                        <span className="font-medium">Generated:</span> {new Date(variationsMetadata[selectedIndex].metadata.generationContext.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
