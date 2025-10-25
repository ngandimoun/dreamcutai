"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Check, 
  Eye, 
  Loader2,
  User,
  Package,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
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

interface LibraryAssetPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelectAssets: (assets: LibraryAsset[]) => void
  maxSelection?: number
}

export function LibraryAssetPicker({ 
  isOpen, 
  onClose, 
  onSelectAssets, 
  maxSelection = 2 
}: LibraryAssetPickerProps) {
  const [selectedAssets, setSelectedAssets] = useState<LibraryAsset[]>([])
  const [activeTab, setActiveTab] = useState('avatars')
  const [loading, setLoading] = useState(false)
  const [assets, setAssets] = useState<{
    avatars: LibraryAsset[]
    product_mockups: LibraryAsset[]
    charts_infographics: LibraryAsset[]
  }>({
    avatars: [],
    product_mockups: [],
    charts_infographics: []
  })

  // Fetch assets when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllAssets()
    }
  }, [isOpen])

  const fetchAllAssets = async () => {
    setLoading(true)
    try {
      // Fetch each API separately to avoid complex Promise.all issues
      let avatarsData = { success: false, avatars: [] }
      let mockupsData = { success: false, productMockups: [] }
      let chartsData = { success: false, chartsInfographics: [] }

      try {
        const avatarsRes = await fetch('/api/avatars?limit=50')
        if (avatarsRes.ok) {
          avatarsData = await avatarsRes.json()
        }
      } catch (error) {
        console.error('Error fetching avatars:', error)
      }

      try {
        const mockupsRes = await fetch('/api/product-mockups?limit=50')
        if (mockupsRes.ok) {
          mockupsData = await mockupsRes.json()
        }
      } catch (error) {
        console.error('Error fetching product mockups:', error)
      }

      try {
        const chartsRes = await fetch('/api/charts-infographics?limit=50')
        if (chartsRes.ok) {
          chartsData = await chartsRes.json()
        }
      } catch (error) {
        console.error('Error fetching charts:', error)
      }

      // Transform API responses to LibraryAsset format
      const transformAssets = (data: any, type: LibraryAsset['type']): LibraryAsset[] => {
        if (!data) return []
        
        // Handle different response formats
        let items = []
        if (data.success && data[type]) {
          items = data[type]
        } else if (data[type]) {
          items = data[type]
        } else if (type === 'avatars' && data.avatars) {
          items = data.avatars
        } else if (type === 'product_mockups' && data.productMockups) {
          items = data.productMockups
        } else if (type === 'charts_infographics' && data.chartsInfographics) {
          items = data.chartsInfographics
        }
        
        if (!Array.isArray(items)) return []
        
        return items.map((item: any) => ({
          id: item.id,
          type,
          title: item.title || 'Untitled',
          description: item.description || '',
          imageUrl: item.generated_images?.[0] || '/placeholder.jpg',
          createdAt: item.created_at,
          storage_paths: item.storage_paths
        })).filter((asset: LibraryAsset) => asset.imageUrl !== '/placeholder.jpg')
      }

      const transformedAssets = {
        avatars: transformAssets(avatarsData, 'avatars'),
        product_mockups: transformAssets(mockupsData, 'product_mockups'),
        charts_infographics: transformAssets(chartsData, 'charts_infographics')
      }

      console.log('📚 Library assets loaded:', {
        avatars: transformedAssets.avatars.length,
        product_mockups: transformedAssets.product_mockups.length,
        charts_infographics: transformedAssets.charts_infographics.length
      })

      setAssets(transformedAssets)
    } catch (error) {
      console.error('Error fetching assets:', error)
      toast.error('Failed to load library assets')
    } finally {
      setLoading(false)
    }
  }

  const handleAssetSelect = (asset: LibraryAsset) => {
    setSelectedAssets(prev => {
      const isSelected = prev.some(selected => selected.id === asset.id)
      
      if (isSelected) {
        // Remove from selection
        return prev.filter(selected => selected.id !== asset.id)
      } else {
        // Add to selection (if under limit)
        if (prev.length >= maxSelection) {
          toast.error(`Maximum ${maxSelection} assets allowed`)
          return prev
        }
        return [...prev, asset]
      }
    })
  }

  const handleConfirmSelection = () => {
    onSelectAssets(selectedAssets)
    setSelectedAssets([])
    onClose()
  }

  const handleClose = () => {
    setSelectedAssets([])
    onClose()
  }

  const getTabIcon = (tab: string) => {
    switch (tab) {
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

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'avatars':
        return 'Avatars'
      case 'product_mockups':
        return 'Product'
      case 'charts_infographics':
        return 'Charts'
      default:
        return tab
    }
  }

  const renderAssetGrid = (assetList: LibraryAsset[]) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading assets...</span>
          </div>
        </div>
      )
    }

    if (assetList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            {getTabIcon(activeTab)}
          </div>
          <h3 className="font-medium mb-2">No assets found</h3>
          <p className="text-sm text-muted-foreground">
            Create some {getTabLabel(activeTab).toLowerCase()} to see them here.
          </p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {assetList.map((asset) => {
          const isSelected = selectedAssets.some(selected => selected.id === asset.id)
          
          return (
            <div
              key={asset.id}
              className={cn(
                "relative group cursor-pointer rounded-lg border-2 transition-all duration-200",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => handleAssetSelect(asset)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="rounded-full bg-primary p-1">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
              )}

              {/* Asset thumbnail */}
              <div className="aspect-square rounded-md overflow-hidden">
                <img
                  src={asset.imageUrl}
                  alt={asset.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Asset info */}
              <div className="p-2">
                <h4 className="text-xs font-medium truncate" title={asset.title}>
                  {asset.title}
                </h4>
                {asset.description && (
                  <p className="text-xs text-muted-foreground truncate" title={asset.description}>
                    {asset.description}
                  </p>
                )}
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-sm">
            <span>Select from Library</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden scrollbar-thin scrollbar-hover overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="flex w-full gap-2 pb-1">
              <TabsTrigger value="avatars" className="flex items-center gap-2 text-xs flex-shrink-0">
                {getTabIcon('avatars')}
                <span className="hidden sm:inline">Avatars</span>
                <span className="sm:hidden">Avatars</span>
                {assets.avatars.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {assets.avatars.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="product_mockups" className="flex items-center gap-2 text-xs flex-shrink-0">
                {getTabIcon('product_mockups')}
                <span className="hidden sm:inline">Product</span>
                <span className="sm:hidden">Mockups</span>
                {assets.product_mockups.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {assets.product_mockups.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="charts_infographics" className="flex items-center gap-2 text-xs flex-shrink-0">
                {getTabIcon('charts_infographics')}
                <span className="hidden sm:inline">Charts</span>
                <span className="sm:hidden">Charts</span>
                {assets.charts_infographics.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {assets.charts_infographics.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4 text-xs">
              <TabsContent value="avatars" className="mt-0">
                {renderAssetGrid(assets.avatars)}
              </TabsContent>
              <TabsContent value="product_mockups" className="mt-0">
                {renderAssetGrid(assets.product_mockups)}
              </TabsContent>
              <TabsContent value="charts_infographics" className="mt-0">
                {renderAssetGrid(assets.charts_infographics)}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer with selection info and confirm button */}
        <div className="flex items-center justify-between pt-4 border-t text-xs">
          <div className="text-sm text-muted-foreground">
            {selectedAssets.length > 0 ? (
              <span>
                {selectedAssets.length} of {maxSelection} selected
              </span>
            ) : (
              <span>Select up to {maxSelection} assets</span>
            )}
          </div>
          <div className="flex gap-2 text-xs">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSelection}
              disabled={selectedAssets.length === 0}
            >
              Add Selected ({selectedAssets.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
