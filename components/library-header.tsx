"use client"

import { useState } from "react"
import useSWR from 'swr'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  RefreshCw,
  Grid3x3,
  List,
  FileArchive,
  CheckSquare,
  Square,
  Download,
  Image,
  Music,
  Video,
  Edit
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useNavigation } from "@/hooks/use-navigation"
import { LibraryExportDialog } from "@/components/library-export-dialog"

interface LibraryResponse {
  libraryItems: any[]
  categorizedItems: {
    visuals: any[]
    audios: any[]
    motions: any[]
    edit: any[]
  }
  total: number
  page: number
  limit: number
  totalPages: number
}

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

export function LibraryHeader() {
  const { user } = useAuth()
  const { 
    librarySearchQuery = "",
    setLibrarySearchQuery,
    libraryActiveCategory = "all",
    setLibraryActiveCategory,
    libraryCurrentPage = 1,
    setLibraryCurrentPage,
    libraryViewMode = "grid",
    setLibraryViewMode,
    librarySelectedItems = new Set(),
    setLibrarySelectedItems,
    libraryIsSelectionMode = false,
    setLibraryIsSelectionMode
  } = useNavigation()

  const [isBulkDownloading, setIsBulkDownloading] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Build API URL for SWR
  const apiUrl = user ? (() => {
    const params = new URLSearchParams({
      page: libraryCurrentPage.toString(),
      limit: '24'
    })
    
    if (libraryActiveCategory !== 'all') {
      params.append('category', libraryActiveCategory)
    }
    
    return `/api/library?${params}`
  })() : null

  // Use SWR for data fetching with caching
  const { data, error, isLoading, mutate } = useSWR<LibraryResponse>(
    apiUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute deduplication
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onSuccess: (data) => {
        console.log('📚 Library Header data loaded:', {
          totalItems: data?.total || 0,
          currentPage: data?.page || 1,
          totalPages: data?.totalPages || 1,
          itemsCount: data?.libraryItems?.length || 0,
          categorizedCounts: {
            visuals: data?.categorizedItems?.visuals?.length || 0,
            audios: data?.categorizedItems?.audios?.length || 0,
            motions: data?.categorizedItems?.motions?.length || 0,
            edit: data?.categorizedItems?.edit?.length || 0
          }
        })
      },
      onError: (error) => {
        console.error('❌ Library Header data fetch error:', error)
      }
    }
  )

  // Extract data from SWR response
  const libraryItems = data?.libraryItems || []
  const categorizedItems = data?.categorizedItems || {
    visuals: [],
    audios: [],
    motions: [],
    edit: []
  }
  const totalItems = data?.total || 0

  // Select all items on current page
  const selectAll = () => {
    const newSelected = new Set(librarySelectedItems)
    libraryItems.forEach(item => newSelected.add(item.id))
    setLibrarySelectedItems?.(newSelected)
  }

  // Deselect all items
  const deselectAll = () => {
    setLibrarySelectedItems?.(new Set())
  }

  // Bulk download selected items
  const handleBulkDownload = async (format: 'zip' | 'individual' = 'zip') => {
    if (librarySelectedItems.size === 0) return

    setIsBulkDownloading(true)
    try {
      const response = await fetch('/api/library/bulk-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          libraryItemIds: Array.from(librarySelectedItems),
          format
        })
      })

      if (!response.ok) {
        throw new Error('Bulk download failed')
      }

      if (format === 'zip') {
        // Download ZIP file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dreamcut_bulk_${Date.now()}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        // Get individual URLs
        const data = await response.json()
        data.files.forEach((file: { url: string; filename: string }) => {
          const a = document.createElement('a')
          a.href = file.url
          a.download = file.filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        })
      }

      // Clear selection after successful download
      deselectAll()
      setLibraryIsSelectionMode?.(false)

    } catch (error) {
      console.error('Error downloading files:', error)
      alert('Failed to download files. Please try again.')
    } finally {
      setIsBulkDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold">Library</h2>
            <p className="text-xs text-muted-foreground">
              {totalItems} items • {libraryActiveCategory === 'all' ? 'All categories' : libraryActiveCategory}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExportDialog(true)}
            title="Export all content"
            className="h-8 w-8 p-0"
          >
            <FileArchive className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => mutate()}
            title="Refresh library"
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <div className="flex items-center border rounded-md">
            <Button
              variant={libraryViewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setLibraryViewMode?.("grid")}
              className="h-8 w-8 p-0 rounded-r-none"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={libraryViewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setLibraryViewMode?.("list")}
              className="h-8 w-8 p-0 rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Selection Toolbar */}
      {libraryIsSelectionMode && (
        <div className="bg-primary/5 border border-primary/20 rounded-md p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-primary">
              {librarySelectedItems.size} selected
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                disabled={librarySelectedItems.size === libraryItems.length}
                className="h-7 px-2 text-xs"
              >
                <CheckSquare className="h-3 w-3 mr-1" />
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={deselectAll}
                disabled={librarySelectedItems.size === 0}
                className="h-7 px-2 text-xs"
              >
                <Square className="h-3 w-3 mr-1" />
                None
              </Button>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleBulkDownload('zip')}
              disabled={librarySelectedItems.size === 0 || isBulkDownloading}
              className="h-7 px-3 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              {isBulkDownloading ? 'Downloading...' : 'Download'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLibraryIsSelectionMode?.(false)
                deselectAll()
              }}
              className="h-7 px-2 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Search and Quick Actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search library..."
            value={librarySearchQuery}
            onChange={(e) => setLibrarySearchQuery?.(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        {!libraryIsSelectionMode && libraryItems.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLibraryIsSelectionMode?.(true)}
            className="h-8 px-2 text-xs"
          >
            <CheckSquare className="h-3.5 w-3.5 mr-1" />
            Select
          </Button>
        )}
      </div>

      {/* Compact Category Tabs */}
      <Tabs value={libraryActiveCategory} onValueChange={(category) => {
        setLibraryActiveCategory?.(category)
        setLibraryCurrentPage?.(1) // Reset to first page when changing category
      }}>
        <TabsList className="grid w-full grid-cols-5 h-8">
          <TabsTrigger value="all" className="text-xs px-2">
            All ({libraryItems.length})
          </TabsTrigger>
          <TabsTrigger value="visuals" className="text-xs px-2">
            Visuals ({categorizedItems.visuals.length})
          </TabsTrigger>
          <TabsTrigger value="audios" className="text-xs px-2">
            Audios ({categorizedItems.audios.length})
          </TabsTrigger>
          <TabsTrigger value="motions" className="text-xs px-2">
            Motions ({categorizedItems.motions.length})
          </TabsTrigger>
          <TabsTrigger value="edit" className="text-xs px-2">
            Edit ({categorizedItems.edit.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Export Dialog */}
      <LibraryExportDialog 
        open={showExportDialog} 
        onOpenChange={setShowExportDialog} 
      />
    </div>
  )
}
