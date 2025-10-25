"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Calendar, 
  User, 
  Palette, 
  Zap, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Download,
  Eye
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useProductMockupGenerations, ProductMockupGeneration } from "@/hooks/use-product-mockup-generations"

interface ProductMockupGenerationHistoryProps {
  onClose?: () => void
}

export function ProductMockupGenerationHistory({ 
  onClose 
}: ProductMockupGenerationHistoryProps) {
  const { 
    loading, 
    error, 
    generations, 
    fetchGenerations, 
    deleteGeneration,
    getRecentGenerations 
  } = useProductMockupGenerations()
  
  const [expandedGenerations, setExpandedGenerations] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchGenerations({ limit: 50 })
  }, [fetchGenerations])

  const toggleGeneration = (generationId: string) => {
    const newExpanded = new Set(expandedGenerations)
    if (newExpanded.has(generationId)) {
      newExpanded.delete(generationId)
    } else {
      newExpanded.add(generationId)
    }
    setExpandedGenerations(newExpanded)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const handleDeleteGeneration = async (generationId: string) => {
    if (window.confirm('Are you sure you want to delete this generation?')) {
      const success = await deleteGeneration(generationId)
      if (success) {
        // Generation will be removed from state automatically
      }
    }
  }

  const handleDownloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Product Mockup Generation History</h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-3 w-32" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, imgIndex) => (
                    <Skeleton key={imgIndex} className="aspect-square rounded-md" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Product Mockup Generation History</h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600 dark:text-red-400">
              <p>Error loading generation history: {error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => fetchGenerations({ limit: 50 })}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (generations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Product Mockup Generation History</h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No product mockup generations yet.</p>
              <p className="text-sm">Create your first product mockup to see it here!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Product Mockup Generation History</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {generations.map((generation) => {
          const isExpanded = expandedGenerations.has(generation.id)
          const settings = generation.settings || {}
          
          return (
            <Card key={generation.id} className="overflow-hidden">
              <CardHeader 
                className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleGeneration(generation.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-base">
                        {settings.prompt || 'Product Mockup Generation'}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-xs", getStatusColor(generation.status))}>
                          {generation.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(generation.created_at)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ImageIcon className="h-3 w-3" />
                          {generation.images.length} image{generation.images.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteGeneration(generation.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Generation Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-muted-foreground">Art Direction</div>
                        <div>{settings.artDirection || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Visual Influence</div>
                        <div>{settings.visualInfluence || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Aspect Ratio</div>
                        <div>{settings.aspectRatio || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Composition</div>
                        <div>{settings.compositionTemplate || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Generated Images */}
                    <div>
                      <div className="font-medium text-sm mb-2">Generated Images</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {generation.images.map((imageUrl, index) => (
                          <div 
                            key={index}
                            className="group relative bg-muted/30 rounded-lg overflow-hidden hover:bg-muted/50 transition-colors"
                          >
                            <div className="aspect-square overflow-hidden">
                              <img 
                                src={imageUrl} 
                                alt={`Generated mockup ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => window.open(imageUrl, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDownloadImage(imageUrl, `product-mockup-${generation.generation_id}-${index + 1}.jpg`)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Full Prompt */}
                    {generation.full_prompt && (
                      <div>
                        <div className="font-medium text-sm mb-2">Full Prompt</div>
                        <div className="text-sm text-muted-foreground bg-muted/30 rounded-md p-3 max-h-32 overflow-y-auto">
                          {generation.full_prompt}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}


