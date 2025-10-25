"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Upload, 
  X, 
  Check,
  Image as ImageIcon,
  Video,
  FileText,
  Calendar,
  User,
  MoreHorizontal,
  Trash2,
  Edit,
  Copy,
  Download
} from "lucide-react"

interface AssetLibraryItem {
  id: string
  name: string
  type: 'image' | 'video' | 'document'
  url: string
  thumbnail?: string
  size: number
  uploadedAt: Date
  tags: string[]
  category: string
  isSelected?: boolean
}

interface AssetLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectAssets: (assets: AssetLibraryItem[]) => void
  selectedAssets?: AssetLibraryItem[]
  multiSelect?: boolean
  maxSelection?: number
}

export function AssetLibraryModal({
  isOpen,
  onClose,
  onSelectAssets,
  selectedAssets = [],
  multiSelect = true,
  maxSelection = 10
}: AssetLibraryModalProps) {
  const [assets, setAssets] = useState<AssetLibraryItem[]>([])
  const [filteredAssets, setFilteredAssets] = useState<AssetLibraryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<AssetLibraryItem[]>(selectedAssets)

  // Mock data - in real implementation, this would come from API
  const mockAssets: AssetLibraryItem[] = [
    {
      id: '1',
      name: 'product-hero.jpg',
      type: 'image',
      url: '/api/placeholder/400/300',
      thumbnail: '/api/placeholder/200/150',
      size: 1024000,
      uploadedAt: new Date('2024-01-15'),
      tags: ['product', 'hero', 'marketing'],
      category: 'marketing'
    },
    {
      id: '2',
      name: 'logo-animation.mp4',
      type: 'video',
      url: '/api/placeholder/400/300',
      thumbnail: '/api/placeholder/200/150',
      size: 5120000,
      uploadedAt: new Date('2024-01-14'),
      tags: ['logo', 'animation', 'brand'],
      category: 'brand'
    },
    {
      id: '3',
      name: 'infographic-chart.png',
      type: 'image',
      url: '/api/placeholder/400/300',
      thumbnail: '/api/placeholder/200/150',
      size: 2048000,
      uploadedAt: new Date('2024-01-13'),
      tags: ['chart', 'data', 'infographic'],
      category: 'data'
    },
    {
      id: '4',
      name: 'ui-button-states.jpg',
      type: 'image',
      url: '/api/placeholder/400/300',
      thumbnail: '/api/placeholder/200/150',
      size: 512000,
      uploadedAt: new Date('2024-01-12'),
      tags: ['ui', 'button', 'interaction'],
      category: 'ui'
    },
    {
      id: '5',
      name: 'cinematic-scene.mp4',
      type: 'video',
      url: '/api/placeholder/400/300',
      thumbnail: '/api/placeholder/200/150',
      size: 10240000,
      uploadedAt: new Date('2024-01-11'),
      tags: ['cinematic', 'scene', 'dramatic'],
      category: 'cinematic'
    }
  ]

  const categories = [
    { id: 'all', name: 'All Assets', count: mockAssets.length },
    { id: 'marketing', name: 'Marketing', count: mockAssets.filter(a => a.category === 'marketing').length },
    { id: 'brand', name: 'Brand', count: mockAssets.filter(a => a.category === 'brand').length },
    { id: 'data', name: 'Data', count: mockAssets.filter(a => a.category === 'data').length },
    { id: 'ui', name: 'UI/UX', count: mockAssets.filter(a => a.category === 'ui').length },
    { id: 'cinematic', name: 'Cinematic', count: mockAssets.filter(a => a.category === 'cinematic').length }
  ]

  // Load assets
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      // Simulate API call
      setTimeout(() => {
        setAssets(mockAssets)
        setFilteredAssets(mockAssets)
        setIsLoading(false)
      }, 500)
    }
  }, [isOpen])

  // Filter assets
  useEffect(() => {
    let filtered = assets

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(asset => asset.category === selectedCategory)
    }

    setFilteredAssets(filtered)
  }, [assets, searchQuery, selectedCategory])

  // Handle asset selection
  const handleAssetSelect = (asset: AssetLibraryItem) => {
    if (!multiSelect) {
      setSelectedItems([asset])
      return
    }

    const isSelected = selectedItems.some(item => item.id === asset.id)
    if (isSelected) {
      setSelectedItems(selectedItems.filter(item => item.id !== asset.id))
    } else if (selectedItems.length < maxSelection) {
      setSelectedItems([...selectedItems, asset])
    }
  }

  // Handle confirm selection
  const handleConfirm = () => {
    onSelectAssets(selectedItems)
    onClose()
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get asset icon
  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Asset Library
            {selectedItems.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedItems.length} selected
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search assets by name or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hover">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
              >
                {category.name}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Assets Grid/List */}
          <div className="flex-1 overflow-y-auto scrollbar-hover min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Grid3X3 className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No assets found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' 
                : 'space-y-2'
              }>
                {filteredAssets.map((asset) => {
                  const isSelected = selectedItems.some(item => item.id === asset.id)
                  
                  return (
                    <div
                      key={asset.id}
                      className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                          : 'border-gray-200 hover:border-gray-300 bg-white dark:bg-gray-800'
                      }`}
                      onClick={() => handleAssetSelect(asset)}
                    >
                      {/* Asset Preview */}
                      <div className={`relative ${viewMode === 'grid' ? 'aspect-square' : 'h-16'} overflow-hidden rounded-t-lg`}>
                        {asset.thumbnail ? (
                          <img
                            src={asset.thumbnail}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            {getAssetIcon(asset.type)}
                          </div>
                        )}
                        
                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                        
                        {/* Asset Type Badge */}
                        <div className="absolute bottom-2 left-2">
                          <Badge variant="secondary" className="text-xs">
                            {asset.type.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Asset Info */}
                      <div className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate" title={asset.name}>
                              {asset.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <span>{formatFileSize(asset.size)}</span>
                              <span>•</span>
                              <span>{formatDate(asset.uploadedAt)}</span>
                            </div>
                          </div>
                          
                          {/* Actions Menu */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Tags */}
                        {asset.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {asset.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {asset.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{asset.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </Button>
            <span className="text-sm text-gray-500">
              {selectedItems.length} of {maxSelection} selected
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selectedItems.length === 0}
            >
              Select {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

