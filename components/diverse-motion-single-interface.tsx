"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useSectionCache } from "@/hooks/use-section-cache"
import { 
  X, 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Play,
  Pause,
  Volume2,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Loader2,
  Eye,
  Download,
  RefreshCw,
  AlertTriangle,
  FileImage,
  Wand2,
  Layers,
  Clock,
  Monitor,
  Library
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { cn } from "@/lib/utils"
import { PreviousGenerations } from "@/components/ui/previous-generations"

// Constants moved outside component to prevent infinite re-renders
const motionTypes = [
  { value: "smooth", label: "Smooth" },
  { value: "dynamic", label: "Dynamic" },
  { value: "subtle", label: "Subtle" },
  { value: "dramatic", label: "Dramatic" }
]

const styles = [
  { value: "cinematic", label: "Cinematic" },
  { value: "modern", label: "Modern" },
  { value: "vintage", label: "Vintage" },
  { value: "minimalist", label: "Minimalist" }
]

const aspectRatios = [
  { value: "16:9", label: "16:9 (Widescreen)" },
  { value: "9:16", label: "9:16 (Vertical)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "4:3", label: "4:3 (Standard)" }
]

interface DiverseMotionSingleInterfaceProps {
onClose: () => void
  projectTitle: string
}

export function DiverseMotionSingleInterface({ 
  onClose, 
  projectTitle 
}: DiverseMotionSingleInterfaceProps) {
  const [title, setTitle] = useState("Untitled Diverse Motion")
  const [assetFile, setAssetFile] = useState<File | null>(null)
  const [assetPreview, setAssetPreview] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [duration, setDuration] = useState([5])
  const [motionType, setMotionType] = useState("smooth")
  const [style, setStyle] = useState("cinematic")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [generateAudio, setGenerateAudio] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showLibraryModal, setShowLibraryModal] = useState(false)
  const [selectedLibraryAsset, setSelectedLibraryAsset] = useState<any>(null)
  const [libraryAssets, setLibraryAssets] = useState<any[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  // Use section cache hooks for library data
  const { data: avatarsData = [], isLoading: loadingAvatars } = useSectionCache('avatars_personas', user?.id || null)
  const { data: productMockupsData = [], isLoading: loadingProductMockups } = useSectionCache('product_mockups', user?.id || null)
  const { data: chartsData = [], isLoading: loadingCharts } = useSectionCache('charts_infographics', user?.id || null)

  const loadingLibraryAssets = loadingAvatars || loadingProductMockups || loadingCharts

  // Combine library assets from all three content types
  useEffect(() => {
    const assets: Array<{id: string, title: string, image: string, content_type: string}> = []

    // Process Avatars & Personas
    avatarsData.forEach((item: any) => {
      const image = item.generated_images?.[0] || item.content?.image || item.content?.images?.[0] || ''
      if (image) {
        assets.push({
          id: `avatars_personas_${item.id}`,
          title: item.title || 'Avatar',
          image,
          content_type: 'avatars_personas'
        })
      }
    })

    // Process Product Mockups
    productMockupsData.forEach((item: any) => {
      const image = item.generated_images?.[0] || item.content?.image || item.content?.images?.[0] || ''
      if (image) {
        assets.push({
          id: `product_mockups_${item.id}`,
          title: item.title || 'Product Mockup',
          image,
          content_type: 'product_mockups'
        })
      }
    })

    // Process Charts & Infographics
    chartsData.forEach((item: any) => {
      const image = item.generated_images?.[0] || item.content?.image || item.content?.images?.[0] || ''
      if (image) {
        assets.push({
          id: `charts_infographics_${item.id}`,
          title: item.title || 'Chart',
          image,
          content_type: 'charts_infographics'
        })
      }
    })

    console.log(`📚 Total library assets loaded: ${assets.length}`)
    setLibraryAssets(assets)
  }, [avatarsData, productMockupsData, chartsData])

  const handleAssetUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setAssetFile(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setAssetPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPG, PNG, etc.)",
          variant: "destructive"
        })
      }
    }
  }

  const handleLibraryAssetSelect = (asset: any) => {
    setSelectedLibraryAsset(asset)
    setAssetPreview(asset.image)
    setShowLibraryModal(false)
    toast({
      title: "Asset selected",
      description: `Selected "${asset.title}" from your library.`,
    })
  }

  const handleGenerate = async () => {
    if (!assetFile && !selectedLibraryAsset) {
      toast({
        title: "Asset required",
        description: "Please upload an asset or select one from your library",
        variant: "destructive"
      })
      return
    }

    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt describing the motion",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const formData = new FormData()
      formData.append('title', title.trim() || 'Untitled Diverse Motion')
      formData.append('prompt', prompt.trim())
      formData.append('duration', duration[0].toString())
      formData.append('motion_type', motionType)
      formData.append('style', style)
      formData.append('aspect_ratio', aspectRatio)
      formData.append('generate_audio', generateAudio.toString())
      
      // Handle asset - either uploaded file or library-selected image
      let assetToUse: File
      if (assetFile) {
        // Use uploaded file
        assetToUse = assetFile
      } else if (selectedLibraryAsset) {
        // Convert library image to File
        try {
          const response = await fetch(selectedLibraryAsset.image)
          const blob = await response.blob()
          const fileName = `${selectedLibraryAsset.title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
          assetToUse = new File([blob], fileName, { type: 'image/jpeg' })
        } catch (error) {
          console.error('Error converting library image to file:', error)
          toast({
            title: "Error processing asset",
            description: "Failed to process the selected library asset",
            variant: "destructive"
          })
          return
        }
      } else {
        throw new Error('No asset available')
      }
      
      formData.append('asset', assetToUse)

      const response = await fetch('/api/diverse-motion/single', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate diverse motion video')
      }

      const result = await response.json()
      setGeneratedVideo(result?.diverseMotion?.generated_video_url || null)
      toast({
        title: 'Diverse Motion Generated!',
        description: 'Successfully generated your diverse motion video.'
      })
    } catch (error) {
      console.error('Generation error:', error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "An error occurred during generation",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleDownload = () => {
    if (generatedVideo) {
      const link = document.createElement('a')
      link.href = generatedVideo
      link.download = `${title.replace(/\s+/g, '_')}_diverse_motion.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Diverse Motion - Single Asset</h2>
                <p className="text-sm text-muted-foreground">{projectTitle}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your diverse motion video"
            />
          </div>

          {/* Asset Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Asset</label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              {assetPreview ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img 
                      src={assetPreview} 
                      alt="Asset preview" 
                      className="max-w-full max-h-48 mx-auto rounded-lg"
                    />
                    {/* Source badge */}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        {selectedLibraryAsset ? 'From Library' : 'Uploaded'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Change/Upload Different
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAssetFile(null)
                        setSelectedLibraryAsset(null)
                        setAssetPreview(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Upload an asset</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, or other image formats</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  
                  {/* Visual separator */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-muted-foreground/25"></div>
                    <span className="text-xs text-muted-foreground">OR</span>
                    <div className="flex-1 h-px bg-muted-foreground/25"></div>
                  </div>
                  
                  {/* Library selection button */}
                  <Button
                    variant="outline"
                    onClick={() => setShowLibraryModal(true)}
                    disabled={loadingLibraryAssets}
                  >
                    <Library className="h-4 w-4 mr-2" />
                    {loadingLibraryAssets ? 'Loading...' : 'Select from Library'}
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAssetUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Motion Description</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the motion you want to create (e.g., 'gentle zoom in with subtle rotation', 'dynamic pan across the image')"
              rows={3}
            />
          </div>


          {/* Motion Type and Style */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Motion Type</label>
              <Select value={motionType} onValueChange={setMotionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {motionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Style</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((styleOption) => (
                    <SelectItem key={styleOption.value} value={styleOption.value}>
                      {styleOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Enable Audio */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="generate-audio"
                checked={generateAudio}
                onChange={(e) => setGenerateAudio(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="generate-audio" className="text-sm font-medium">
                Enable Audio Generation
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Generate audio for the video. Disabling audio will use 33% less credits.
            </p>
          </div>

          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Advanced Settings
                </div>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Aspect Ratio</label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aspectRatios.map((ratio) => (
                      <SelectItem key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Generated Video Preview */}
          {generatedVideo && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Generated Video</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <video
                ref={videoRef}
                src={generatedVideo}
                className="w-full rounded-lg"
                controls
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
          )}

          {/* Generate Button */}
          <div className="flex items-center justify-center pt-4">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (!assetFile && !selectedLibraryAsset) || !prompt.trim()}
              className="w-full max-w-md"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5 mr-2" />
                  Generate Diverse Motion
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Library Selection Modal */}
      <Dialog open={showLibraryModal} onOpenChange={setShowLibraryModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Asset from Library</DialogTitle>
          </DialogHeader>
          
          {loadingLibraryAssets ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading your library assets...</p>
              </div>
            </div>
          ) : libraryAssets.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Library className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No assets found in your library</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Generate some Avatars, Product Mockups, or Charts first
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {libraryAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group cursor-pointer rounded-lg border border-muted-foreground/25 overflow-hidden hover:border-primary/50 transition-colors"
                  onClick={() => handleLibraryAssetSelect(asset)}
                >
                  <div className="aspect-square relative">
                    <img
                      src={asset.image}
                      alt={asset.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                  <div className="p-3 space-y-2">
                    <h4 className="text-sm font-medium truncate">{asset.title}</h4>
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                    >
                      {asset.content_type === 'avatars_personas' && 'Avatar'}
                      {asset.content_type === 'product_mockups' && 'Product'}
                      {asset.content_type === 'charts_infographics' && 'Chart'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </>
  )
}
