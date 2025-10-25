"use client"

import { createContext, useContext, useState, ReactNode, useCallback } from "react"
import { CacheProvider } from "./use-cache-context"

interface NavigationContextType {
  selectedSection: string
  setSelectedSection: (section: string) => void
  getDisplayTitle: () => string
  showProjectForm: boolean
  setShowProjectForm: (show: boolean) => void
  // Character variations state - only available in comics section
  characterVariations?: string[]
  setCharacterVariations?: (variations: string[]) => void
  characterVariationsMetadata?: Array<{
    url: string
    variationNumber: number
    metadata: any
  }> | null
  setCharacterVariationsMetadata?: (metadata: Array<{
    url: string
    variationNumber: number
    metadata: any
  }> | null) => void
  isGeneratingVariations?: boolean
  setIsGeneratingVariations?: (isGenerating: boolean) => void
  // Library state - only available in library section
  librarySearchQuery?: string
  setLibrarySearchQuery?: (query: string) => void
  libraryActiveCategory?: string
  setLibraryActiveCategory?: (category: string) => void
  libraryCurrentPage?: number
  setLibraryCurrentPage?: (page: number) => void
  libraryViewMode?: "grid" | "list"
  setLibraryViewMode?: (mode: "grid" | "list") => void
  librarySelectedItems?: Set<string>
  setLibrarySelectedItems?: (items: Set<string>) => void
  libraryIsSelectionMode?: boolean
  setLibraryIsSelectionMode?: (mode: boolean) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [selectedSection, setSelectedSection] = useState<string>("library")
  const [showProjectForm, setShowProjectForm] = useState(false)
  // Character variations state
  const [characterVariations, setCharacterVariations] = useState<string[]>([])
  const [characterVariationsMetadata, setCharacterVariationsMetadata] = useState<Array<{
    url: string
    variationNumber: number
    metadata: any
  }> | null>(null)
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false)
  // Library state
  const [librarySearchQuery, setLibrarySearchQuery] = useState<string>("")
  const [libraryActiveCategory, setLibraryActiveCategory] = useState<string>("all")
  const [libraryCurrentPage, setLibraryCurrentPage] = useState<number>(1)
  const [libraryViewMode, setLibraryViewMode] = useState<"grid" | "list">("grid")
  const [librarySelectedItems, setLibrarySelectedItems] = useState<Set<string>>(new Set())
  const [libraryIsSelectionMode, setLibraryIsSelectionMode] = useState<boolean>(false)

  // Stable references for character variations functions
  const setCharacterVariationsStable = useCallback((variations: string[]) => {
    console.log('🔄 NavigationProvider setCharacterVariationsStable called with:', variations)
    setCharacterVariations(variations)
    console.log('✅ NavigationProvider characterVariations state updated')
  }, [])

  const setIsGeneratingVariationsStable = useCallback((isGenerating: boolean) => {
    console.log('🔄 NavigationProvider setIsGeneratingVariationsStable called with:', isGenerating)
    setIsGeneratingVariations(isGenerating)
    console.log('✅ NavigationProvider isGeneratingVariations state updated')
  }, [])

  const setCharacterVariationsMetadataStable = useCallback((metadata: Array<{
    url: string
    variationNumber: number
    metadata: any
  }> | null) => {
    console.log('🔄 NavigationProvider setCharacterVariationsMetadataStable called with:', metadata)
    setCharacterVariationsMetadata(metadata)
    console.log('✅ NavigationProvider characterVariationsMetadata state updated')
  }, [])

  // Stable references for library functions
  const setLibrarySearchQueryStable = useCallback((query: string) => {
    console.log('🔄 NavigationProvider setLibrarySearchQueryStable called with:', query)
    setLibrarySearchQuery(query)
    console.log('✅ NavigationProvider librarySearchQuery state updated')
  }, [])

  const setLibraryActiveCategoryStable = useCallback((category: string) => {
    console.log('🔄 NavigationProvider setLibraryActiveCategoryStable called with:', category)
    setLibraryActiveCategory(category)
    console.log('✅ NavigationProvider libraryActiveCategory state updated')
  }, [])

  const setLibraryCurrentPageStable = useCallback((page: number) => {
    console.log('🔄 NavigationProvider setLibraryCurrentPageStable called with:', page)
    setLibraryCurrentPage(page)
    console.log('✅ NavigationProvider libraryCurrentPage state updated')
  }, [])

  const setLibraryViewModeStable = useCallback((mode: "grid" | "list") => {
    console.log('🔄 NavigationProvider setLibraryViewModeStable called with:', mode)
    setLibraryViewMode(mode)
    console.log('✅ NavigationProvider libraryViewMode state updated')
  }, [])

  const setLibrarySelectedItemsStable = useCallback((items: Set<string>) => {
    console.log('🔄 NavigationProvider setLibrarySelectedItemsStable called with:', items)
    setLibrarySelectedItems(items)
    console.log('✅ NavigationProvider librarySelectedItems state updated')
  }, [])

  const setLibraryIsSelectionModeStable = useCallback((mode: boolean) => {
    console.log('🔄 NavigationProvider setLibraryIsSelectionModeStable called with:', mode)
    setLibraryIsSelectionMode(mode)
    console.log('✅ NavigationProvider libraryIsSelectionMode state updated')
  }, [])

  const getDisplayTitle = () => {
    switch (selectedSection) {
      case "library":
        return "Library"
      case "comics":
        return "Comics"
      case "illustration":
        return "Illustration"
      case "avatars-personas":
        return "Avatars & Personas"
      case "product-mockups":
        return "Mockups"
      case "concept-worlds":
        return "Concept Worlds"
      case "charts-infographics":
        return "Charts"
      case "voice-creation":
        return "Voice Creation"
      case "voiceovers":
        return "Narration"
      case "music-jingles":
        return "Music Studio"
      case "music-videos":
        return "Music Videos"
      case "sound-fx":
        return "Sound FX"
      case "explainers":
        return "Explainers"
      case "social-cuts":
        return "Social Cuts"
      case "talking-avatars":
        return "Conversational Characters"
      case "diverse-motion-single":
        return "Diverse Motion Single"
      case "diverse-motion-dual":
        return "Diverse Motion Dual"
      case "thumbnails-covers":
        return "Thumbnails & Covers"
      case "storyboards-scripts":
        return "Storyboards & Scripts"
      case "ad-templates":
        return "Ad Templates"
      case "brand-kits":
        return "Brand Kits"
      case "add-subtitles":
        return "Subtitles Studio"
      case "add-watermark":
        return "Watermark Studio"
      case "video-translate":
        return "Video Translation"
      default:
        return "Library"
    }
  }

  const value: NavigationContextType = {
    selectedSection,
    setSelectedSection,
    getDisplayTitle,
    showProjectForm,
    setShowProjectForm,
    // Only include character variations data when in comics section
    ...(selectedSection === 'comics' && {
      characterVariations,
      setCharacterVariations: setCharacterVariationsStable,
      characterVariationsMetadata,
      setCharacterVariationsMetadata: setCharacterVariationsMetadataStable,
      isGeneratingVariations,
      setIsGeneratingVariations: setIsGeneratingVariationsStable
    }),
    // Only include library data when in library section
    ...(selectedSection === 'library' && {
      librarySearchQuery,
      setLibrarySearchQuery: setLibrarySearchQueryStable,
      libraryActiveCategory,
      setLibraryActiveCategory: setLibraryActiveCategoryStable,
      libraryCurrentPage,
      setLibraryCurrentPage: setLibraryCurrentPageStable,
      libraryViewMode,
      setLibraryViewMode: setLibraryViewModeStable,
      librarySelectedItems,
      setLibrarySelectedItems: setLibrarySelectedItemsStable,
      libraryIsSelectionMode,
      setLibraryIsSelectionMode: setLibraryIsSelectionModeStable
    })
  }

  return (
    <CacheProvider>
      <NavigationContext.Provider value={value}>
        {children}
      </NavigationContext.Provider>
    </CacheProvider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}