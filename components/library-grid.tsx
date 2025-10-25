"use client"

import { useState, useEffect } from "react"
import useSWR from 'swr'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Trash2, 
  Eye,
  Calendar,
  Tag,
  CheckSquare,
  Square,
  RefreshCw,
  Grid3x3
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useNavigation } from "@/hooks/use-navigation"

interface LibraryItem {
  id: string
  content_type: string
  content_id: string
  date_added_to_library: string
  title: string
  description: string
  image: string
  video_url?: string
  created_at: string
}

interface CategorizedItems {
  visuals: LibraryItem[]
  audios: LibraryItem[]
  motions: LibraryItem[]
  edit: LibraryItem[]
}

interface LibraryResponse {
  libraryItems: LibraryItem[]
  categorizedItems: CategorizedItems
  total: number
  page: number
  limit: number
  totalPages: number
}

interface LibraryGridProps {
  columns?: number
}

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

export function LibraryGrid({ columns = 3 }: LibraryGridProps) {
  const { user } = useAuth()
  const { 
    librarySearchQuery = "",
    libraryActiveCategory = "all",
    libraryCurrentPage = 1,
    libraryViewMode = "grid",
    librarySelectedItems = new Set(),
    setLibrarySelectedItems,
    libraryIsSelectionMode = false
  } = useNavigation()

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
        console.log('📚 Library Grid data loaded:', {
          totalItems: data?.total || 0,
          currentPage: data?.page || 1,
          totalPages: data?.totalPages || 1,
          itemsCount: data?.libraryItems?.length || 0
        })
      },
      onError: (error) => {
        console.error('❌ Library Grid data fetch error:', error)
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
  const totalPages = data?.totalPages || 1
  const totalItems = data?.total || 0

  // Filter items based on search query
  const filteredItems = libraryItems.filter(item =>
    item.title.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
    item.content_type.toLowerCase().includes(librarySearchQuery.toLowerCase())
  )

  // Get items for current category
  const getCurrentCategoryItems = () => {
    if (libraryActiveCategory === "all") {
      return filteredItems
    }
    return categorizedItems[libraryActiveCategory as keyof CategorizedItems]?.filter(item =>
      item.title.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
      item.content_type.toLowerCase().includes(librarySearchQuery.toLowerCase())
    ) || []
  }

  // Delete item from library
  const deleteFromLibrary = async (libraryItemId: string) => {
    try {
      const response = await fetch(`/api/library?id=${libraryItemId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Invalidate and revalidate the cache to get fresh data
        mutate()
      } else {
        console.error('Failed to delete from library')
      }
    } catch (error) {
      console.error('Error deleting from library:', error)
    }
  }

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(librarySelectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setLibrarySelectedItems?.(newSelected)
  }

  // Get content type display name
  const getContentTypeDisplayName = (contentType: string) => {
    const typeMap: Record<string, string> = {
      'comics': 'Comics',
      'illustrations': 'Illustrations',
      'avatars_personas': 'Avatars & Personas',
      'product_mockups': 'Product Mockups',
      'concept_worlds': 'Concept Worlds',
      'charts_infographics': 'Charts & Infographics',
      'voices_creations': 'Voice Creation',
      'voiceovers': 'Voiceovers',
      'music_jingles': 'Music & Jingles',
      'sound_fx': 'Sound FX',
      'explainers': 'Explainers',
      'social_cuts': 'Social Cuts',
      'talking_avatars': 'Talking Avatars',
      'subtitles': 'Subtitles',
      'sound_to_video': 'Sound to Video',
      'video_translations': 'Video Translations',
      'watermarks': 'Watermarks'
    }
    return typeMap[contentType] || contentType
  }

  const currentItems = getCurrentCategoryItems()

  // Debug function to log library items data
  useEffect(() => {
    if (data && libraryItems.length > 0) {
      console.log('📚 Library Grid Items Debug:', {
        totalItems: data.total,
        currentPage: data.page,
        totalPages: data.totalPages,
        libraryItemsCount: libraryItems.length,
        sampleItem: libraryItems[0],
        categorizedItems: {
          visuals: categorizedItems.visuals.length,
          audios: categorizedItems.audios.length,
          motions: categorizedItems.motions.length,
          edit: categorizedItems.edit.length
        }
      })
    }
  }, [data, libraryItems, categorizedItems])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your library...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Fetching data from library_items table
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load library data</p>
          <p className="text-sm text-muted-foreground mb-4">
            Error connecting to library_items table
          </p>
          <Button onClick={() => mutate()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {currentItems.length === 0 ? (
        <div className="text-center py-12">
          <Grid3x3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground">
            {librarySearchQuery 
              ? "No items match your search criteria."
              : "Start creating content to see it appear in your library."
            }
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Data is fetched from the library_items table in Supabase
          </p>
        </div>
      ) : (
        <div className={
          libraryViewMode === "grid" 
            ? `grid grid-cols-1 md:grid-cols-2 ${columns === 3 ? 'lg:grid-cols-3' : columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6`
            : "space-y-4"
        }>
          {currentItems.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-shadow relative">
              {/* Selection Checkbox */}
              {libraryIsSelectionMode && (
                <div 
                  className="absolute top-4 left-4 z-10 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleItemSelection(item.id)
                  }}
                >
                  <div className="bg-background/80 backdrop-blur-sm rounded p-1 border-2 border-primary">
                    {librarySelectedItems.has(item.id) ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              )}
              
              <div className="relative">
                {/* Display video for motion content with video URLs, otherwise show image */}
                {item.content_type === 'explainers' && item.video_url ? (
                  <video
                    src={item.video_url}
                    controls
                    className="w-full h-48 object-cover rounded-t-lg"
                    poster="/placeholder.jpg"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {getContentTypeDisplayName(item.content_type)}
                  </Badge>
                </div>
                {!libraryIsSelectionMode && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteFromLibrary(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {item.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {getContentTypeDisplayName(item.content_type)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-muted-foreground">
            Showing {((libraryCurrentPage - 1) * 24) + 1} to {Math.min(libraryCurrentPage * 24, totalItems)} of {totalItems} items
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLibraryCurrentPage?.(Math.max(1, libraryCurrentPage - 1))}
              disabled={libraryCurrentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={libraryCurrentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLibraryCurrentPage?.(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
              {totalPages > 5 && (
                <>
                  <span className="text-muted-foreground">...</span>
                  <Button
                    variant={libraryCurrentPage === totalPages ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLibraryCurrentPage?.(totalPages)}
                    className="w-8 h-8 p-0"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLibraryCurrentPage?.(Math.min(totalPages, libraryCurrentPage + 1))}
              disabled={libraryCurrentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
