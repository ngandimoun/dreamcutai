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
  Plus,
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
  { value: "dramatic", label: "Dramatic" },
  { value: "transition", label: "Transition" }
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

interface DiverseMotionDualInterfaceProps {
onClose: () => void
  projectTitle: string
}

export function DiverseMotionDualInterface({ 
  onClose, 
  projectTitle 
}: DiverseMotionDualInterfaceProps) {
  const [title, setTitle] = useState("Untitled Diverse Motion")
  const [asset1File, setAsset1File] = useState<File | null>(null)
  const [asset1Preview, setAsset1Preview] = useState<string | null>(null)
  const [asset2File, setAsset2File] = useState<File | null>(null)
  const [asset2Preview, setAsset2Preview] = useState<string | null>(null)
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
  const [libraryTargetAsset, setLibraryTargetAsset] = useState<1 | 2>(1)
  const [selectedLibraryAsset1, setSelectedLibraryAsset1] = useState<any>(null)
  const [selectedLibraryAsset2, setSelectedLibraryAsset2] = useState<any>(null)
  const [libraryAssets, setLibraryAssets] = useState<any[]>([])
  
  const fileInput1Ref = useRef<HTMLInputElement>(null)
  const fileInput2Ref = useRef<HTMLInputElement>(null)
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

  const handleAssetUpload = (assetNumber: 1 | 2, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        if (assetNumber === 1) {
          setAsset1File(file)
          const reader = new FileReader()
          reader.onload = (e) => {
            setAsset1Preview(e.target?.result as string)
          }
          reader.readAsDataURL(file)
        } else {
          setAsset2File(file)
          const reader = new FileReader()
          reader.onload = (e) => {
            setAsset2Preview(e.target?.result as string)
          }
          reader.readAsDataURL(file)
        }
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPG, PNG, etc.)",
          variant: "destructive"
        })
      }
    }
  }

  const handleOpenLibrary = (assetNumber: 1 | 2) => {
    setLibraryTargetAsset(assetNumber)
    setShowLibraryModal(true)
  }

  const handleLibraryAssetSelect = (asset: any) => {
    if (libraryTargetAsset === 1) {
      setSelectedLibraryAsset1(asset)
      setAsset1Preview(asset.image)
    } else {
      setSelectedLibraryAsset2(asset)
      setAsset2Preview(asset.image)
    }
    setShowLibraryModal(false)
    toast({
      title: "Asset selected",
      description: `Selected "${asset.title}" from your library for Asset ${libraryTargetAsset}.`,
    })
  }

  const handleGenerate = async () => {
    if ((!asset1File && !selectedLibraryAsset1) || (!asset2File && !selectedLibraryAsset2)) {
      toast({
        title: "Both assets required",
        description: "Please upload or select both assets before generating",
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
      
      // Handle Asset 1 - either uploaded file or library-selected image
      let asset1ToUse: File
      if (asset1File) {
        // Use uploaded file
        asset1ToUse = asset1File
      } else if (selectedLibraryAsset1) {
        // Convert library image to File
        try {
          const response = await fetch(selectedLibraryAsset1.image)
          const blob = await response.blob()
          const fileName = `${selectedLibraryAsset1.title.replace(/[^a-zA-Z0-9]/g, '_')}_asset1.jpg`
          asset1ToUse = new File([blob], fileName, { type: 'image/jpeg' })
        } catch (error) {
          console.error('Error converting library image to file for Asset 1:', error)
          toast({
            title: "Error processing Asset 1",
            description: "Failed to process the selected library asset",
            variant: "destructive"
          })
          return
        }
      } else {
        throw new Error('No Asset 1 available')
      }
      
      // Handle Asset 2 - either uploaded file or library-selected image
      let asset2ToUse: File
      if (asset2File) {
        // Use uploaded file
        asset2ToUse = asset2File
      } else if (selectedLibraryAsset2) {
        // Convert library image to File
        try {
          const response = await fetch(selectedLibraryAsset2.image)
          const blob = await response.blob()
          const fileName = `${selectedLibraryAsset2.title.replace(/[^a-zA-Z0-9]/g, '_')}_asset2.jpg`
          asset2ToUse = new File([blob], fileName, { type: 'image/jpeg' })
        } catch (error) {
          console.error('Error converting library image to file for Asset 2:', error)
          toast({
            title: "Error processing Asset 2",
            description: "Failed to process the selected library asset",
            variant: "destructive"
          })
          return
        }
      } else {
        throw new Error('No Asset 2 available')
      }
      
      formData.append('asset1', asset1ToUse)
      formData.append('asset2', asset2ToUse)

      const response = await fetch('/api/diverse-motion/dual', {
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
                <h2 className="text-xl font-semibold">Diverse Motion - Dual Asset</h2>
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

          {/* Asset Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Asset 1 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset 1</label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                {asset1Preview ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <img 
                        src={asset1Preview} 
                        alt="Asset 1 preview" 
                        className="max-w-full max-h-32 mx-auto rounded-lg"
                      />
                      {/* Source badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          {selectedLibraryAsset1 ? 'From Library' : 'Uploaded'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInput1Ref.current?.click()}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Change/Upload Different
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAsset1File(null)
                          setSelectedLibraryAsset1(null)
                          setAsset1Preview(null)
                          if (fileInput1Ref.current) {
                            fileInput1Ref.current.value = ''
                          }
                        }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">Upload Asset 1</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, etc.</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInput1Ref.current?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Choose File
                    </Button>
                    
                    {/* Visual separator */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-muted-foreground/25"></div>
                      <span className="text-xs text-muted-foreground">OR</span>
                      <div className="flex-1 h-px bg-muted-foreground/25"></div>
                    </div>
                    
                    {/* Library selection button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenLibrary(1)}
                      disabled={loadingLibraryAssets}
                    >
                      <Library className="h-3 w-3 mr-1" />
                      {loadingLibraryAssets ? 'Loading...' : 'Select from Library'}
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInput1Ref}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAssetUpload(1, e)}
                  className="hidden"
                />
              </div>
            </div>

            {/* Asset 2 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset 2</label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                {asset2Preview ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <img 
                        src={asset2Preview} 
                        alt="Asset 2 preview" 
                        className="max-w-full max-h-32 mx-auto rounded-lg"
                      />
                      {/* Source badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          {selectedLibraryAsset2 ? 'From Library' : 'Uploaded'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInput2Ref.current?.click()}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Change/Upload Different
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAsset2File(null)
                          setSelectedLibraryAsset2(null)
                          setAsset2Preview(null)
                          if (fileInput2Ref.current) {
                            fileInput2Ref.current.value = ''
                          }
                        }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">Upload Asset 2</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, etc.</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInput2Ref.current?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Choose File
                    </Button>
                    
                    {/* Visual separator */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-muted-foreground/25"></div>
                      <span className="text-xs text-muted-foreground">OR</span>
                      <div className="flex-1 h-px bg-muted-foreground/25"></div>
                    </div>
                    
                    {/* Library selection button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenLibrary(2)}
                      disabled={loadingLibraryAssets}
                    >
                      <Library className="h-3 w-3 mr-1" />
                      {loadingLibraryAssets ? 'Loading...' : 'Select from Library'}
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInput2Ref}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAssetUpload(2, e)}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Motion Description</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the motion between the two assets (e.g., 'smooth transition from asset 1 to asset 2 with zoom effect', 'dynamic morphing between the two images')"
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
                id="generate-audio-dual"
                checked={generateAudio}
                onChange={(e) => setGenerateAudio(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="generate-audio-dual" className="text-sm font-medium">
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
              disabled={isGenerating || (!asset1File && !selectedLibraryAsset1) || (!asset2File && !selectedLibraryAsset2) || !prompt.trim()}
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

          {/* Library Selection Modal */}
          <Dialog open={showLibraryModal} onOpenChange={setShowLibraryModal}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Select Asset {libraryTargetAsset} from Library</DialogTitle>
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
      </div>
    </>
  )
}
