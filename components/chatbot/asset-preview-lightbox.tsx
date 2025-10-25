"use client"

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  User,
  Package,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LibraryAsset {
  id: string
  type: 'avatars' | 'product_mockups' | 'charts_infographics'
  title: string
  description?: string
  imageUrl: string
  createdAt: string
  storage_paths?: string[]
}

interface AssetPreviewLightboxProps {
  isOpen: boolean
  onClose: () => void
  asset: LibraryAsset | null
  allAssets: LibraryAsset[]
  onNavigate?: (direction: 'prev' | 'next') => void
}

export function AssetPreviewLightbox({ 
  isOpen, 
  onClose, 
  asset, 
  allAssets,
  onNavigate 
}: AssetPreviewLightboxProps) {
  
  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen || !asset) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          e.preventDefault()
          onNavigate?.('prev')
          break
        case 'ArrowRight':
          e.preventDefault()
          onNavigate?.('next')
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, asset, onClose, onNavigate])

  if (!asset) return null

  const getTypeIcon = (type: LibraryAsset['type']) => {
    switch (type) {
      case 'avatars':
        return <User className="h-4 w-4" />
      case 'product_mockups':
        return <Package className="h-4 w-4" />
      case 'charts_infographics':
        return <BarChart3 className="h-4 w-4" />
      default:
        return null
    }
  }

  const getTypeLabel = (type: LibraryAsset['type']) => {
    switch (type) {
      case 'avatars':
        return 'Avatar & Persona'
      case 'product_mockups':
        return 'Product Mockup'
      case 'charts_infographics':
        return 'Chart & Infographic'
      default:
        return type
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Unknown date'
    }
  }

  const currentIndex = allAssets.findIndex(a => a.id === asset.id)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < allAssets.length - 1

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                {getTypeIcon(asset.type)}
                {getTypeLabel(asset.type)}
              </Badge>
              <h2 className="text-lg font-semibold truncate">{asset.title}</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Image */}
            <div className="flex-1 flex items-center justify-center bg-muted/20 p-4">
              <div className="relative max-w-full max-h-full">
                <img
                  src={asset.imageUrl}
                  alt={asset.title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
                
                {/* Navigation arrows */}
                {allAssets.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0",
                        "bg-black/50 hover:bg-black/70 text-white",
                        !hasPrev && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => onNavigate?.('prev')}
                      disabled={!hasPrev}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0",
                        "bg-black/50 hover:bg-black/70 text-white",
                        !hasNext && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => onNavigate?.('next')}
                      disabled={!hasNext}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Metadata sidebar */}
            <div className="w-80 border-l bg-background p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Asset info */}
                <div>
                  <h3 className="font-medium mb-2">Asset Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(asset.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(asset.type)}
                      <span className="text-muted-foreground">Type:</span>
                      <span>{getTypeLabel(asset.type)}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {asset.description && (
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {asset.description}
                    </p>
                  </div>
                )}

                {/* Navigation info */}
                {allAssets.length > 1 && (
                  <div>
                    <h3 className="font-medium mb-2">Navigation</h3>
                    <div className="text-sm text-muted-foreground">
                      <p>Use arrow keys or buttons to navigate</p>
                      <p className="mt-1">
                        {currentIndex + 1} of {allAssets.length} assets
                      </p>
                    </div>
                  </div>
                )}

                {/* Keyboard shortcuts */}
                <div>
                  <h3 className="font-medium mb-2">Keyboard Shortcuts</h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>← →</span>
                      <span>Navigate</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ESC</span>
                      <span>Close</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
