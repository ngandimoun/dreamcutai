"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Globe, 
  Palette, 
  Camera, 
  Heart, 
  Building2, 
  Download,
  Sparkles,
  Upload,
  X,
  Check,
  Info,
  ChevronUp
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "sonner"
import { GenerationLoading } from "@/components/ui/generation-loading"
import { GenerationError } from "@/components/ui/generation-error"
import { PreviousGenerations } from "@/components/ui/previous-generations"
import { cn } from "@/lib/utils"
import { filterFilledFields } from "@/lib/utils/prompt-builder"
import { getSupportedAspectRatios } from '@/lib/utils/aspect-ratio-utils'
import type { FalModel } from '@/lib/utils/fal-generation'

interface WorldKit {
  id: string
  name: string
  prompt: string
  model: string
  worldPurpose: string
  referenceImages: File[]
  seedVariability: number
  logoPlacement: string
  logoFile: File | null
  customColor: string
  aspectRatio: string
  artDirection: string
  visualInfluence: string
  colorSystem: string
  lighting: string
  materialLanguage: string
  textureDetail: number
  environmentType: string
  locationArchetype: string
  cameraFraming: string
  depthLevel: number
  compositionScale: number
  atmosphericMotion: string
  spatialConsistencyLock: boolean
  mood: string
  culturalInfluence: string
  timeOfDay: string
  symbolicMotifs: string[]
  emotionalTone: string
  storyHook: string
  brandSync: boolean
  brandPaletteMode: string
  toneMatch: number
  typographyInWorld: string
  assets: { preview: string; depthMap?: string }
}

const WORLD_PURPOSES = [
  "📚 Storytelling",
  "📦 Product Context",
  "🎓 Learning World",
  "🏢 Brand Universe",
  "🧙 Fantasy Realm",
  "🚀 Sci-Fi Environment",
  "🎨 Abstract Space"
]

const ART_DIRECTIONS = [
  "📸 Realistic",
  "🎮 Stylized 3D",
  "📐 Flat Vector",
  "🎬 Concept Matte",
  "🎨 Watercolor",
  "🏺 Clay Render",
  "🖼️ Fantasy Painting",
  "⚡ Futuristic Minimal"
]

const VISUAL_INFLUENCES = [
  "🌃 Blade Runner",
  "🐉 Ghibli",
  "🎪 Pixar",
  "🎭 Wes Anderson",
  "🏜️ Dune",
  "⚡ Arcane",
  "🏗️ Bauhaus",
  "🎋 Ukiyo-e",
  "🤖 Cyberpunk 2077"
]

const COLOR_SYSTEMS = [
  "🌍 Natural Earth",
  "💎 Neon Holographic",
  "📰 Muted Editorial",
  "🎬 Warm Cinematic",
  "⚫ Monochrome Contrast"
]

const LIGHTING_PRESETS = [
  "🌅 Golden Hour",
  "💜 Dual Tone Neon",
  "☁️ Soft Diffuse",
  "🌫️ Ambient Fog",
  "🎭 Spotlight Drama"
]

const MATERIAL_LANGUAGES = [
  "🪟 Glass",
  "🔩 Metal",
  "🧵 Fabric",
  "🌿 Organic",
  "📄 Paper",
  "💿 Digital Plastic",
  "🧱 Concrete"
]

const ENVIRONMENT_TYPES = [
  "🏠 Interior",
  "🌍 Exterior",
  "🔄 Hybrid",
  "🎨 Abstract"
]

const LOCATION_ARCHETYPES = [
  "🌲 Forest",
  "🚀 Space Station",
  "🐠 Underwater City",
  "🎬 Studio Room",
  "☁️ Sky Island",
  "🏺 Desert Bazaar",
  "⛰️ Mountain Peak",
  "🏙️ Urban Alley",
  "🌺 Garden Oasis",
  "💎 Crystal Cave"
]

const CAMERA_FRAMINGS = [
  "📐 Wide",
  "🚁 Aerial",
  "👣 Ground Level",
  "🔍 Close-up",
  "📐 Isometric"
]

const ATMOSPHERIC_MOTIONS = [
  "⏸️ Static",
  "🌫️ Light Fog",
  "✨ Particle Flow",
  "🌤️ Dynamic Sky",
  "🌊 Water Ripple"
]

const MOODS = [
  { value: "hopeful", label: "Hopeful", emoji: "🌅" },
  { value: "calm", label: "Calm", emoji: "🌿" },
  { value: "mysterious", label: "Mysterious", emoji: "🌑" },
  { value: "energetic", label: "Energetic", emoji: "⚡" },
  { value: "tragic", label: "Tragic", emoji: "💧" },
  { value: "surreal", label: "Surreal", emoji: "🌀" }
]

const CULTURAL_INFLUENCES = [
  "❄️ Nordic",
  "🎋 Japanese Zen",
  "🕌 Moroccan",
  "🚀 Afro-futuristic",
  "🤠 Western Retro",
  "🌊 Oceanic",
  "🕌 Middle Eastern",
  "🌍 Global Contemporary"
]

const TIME_OF_DAY_OPTIONS = [
  "🌅 Morning",
  "🌇 Sunset",
  "🌙 Night",
  "🚀 Future",
  "📺 Retro",
  "⏰ Timeless"
]

const SYMBOLIC_MOTIFS = [
  "☁️ Floating Islands",
  "💎 Crystals",
  "🌿 Vines",
  "💫 Digital Aura",
  "🌪️ Desert Wind",
  "✨ Light Beams",
  "📐 Geometric Patterns",
  "🌱 Organic Growth",
  "⚡ Energy Fields",
  "🔮 Ancient Symbols"
]

const EMOTIONAL_TONES = [
  "😌 Peaceful",
  "😰 Tense",
  "💭 Dreamlike",
  "🙏 Sacred",
  "💼 Corporate",
  "💀 Post-Apocalyptic"
]

const BRAND_PALETTE_MODES = [
  "🎯 Core",
  "🎨 Analogous",
  "🌈 Complementary",
  "⚪ Neutral"
]

const LOGO_PLACEMENTS = [
  "👻 Hidden",
  "🏷️ Discrete Signage",
  "🏗️ Architectural Element"
]

const TYPOGRAPHY_OPTIONS = [
  "🏷️ Use brand fonts for signage",
  "💻 Use brand fonts for UI",
  "📰 Use brand fonts for posters",
  "❌ No typography integration"
]


const LOGO_PLACEMENT_OPTIONS = [
  "❌ None",
  "↖️ Top-Left",
  "↘️ Bottom-Right"
]

const ALL_ASPECT_RATIOS = [
  { ratio: "1:1", label: "⬜ 1:1 (Square)" },
  { ratio: "4:3", label: "📺 4:3 (Standard)" },
  { ratio: "3:4", label: "📱 3:4 (Portrait)" },
  { ratio: "16:9", label: "🖥️ 16:9 (Widescreen)" },
  { ratio: "9:16", label: "📱 9:16 (Portrait)" },
  { ratio: "21:9", label: "📱 21:9 (Ultrawide)" },
  { ratio: "2:3", label: "📸 2:3 (Portrait Photo)" },
  { ratio: "3:2", label: "📷 3:2 (Photo)" },
  { ratio: "4:5", label: "📱 4:5 (Instagram)" }
]

const PRESET_COLORS = [
  { name: "Red", value: "#ef4444", emoji: "🔴" },
  { name: "Blue", value: "#3b82f6", emoji: "🔵" },
  { name: "Green", value: "#22c55e", emoji: "🟢" },
  { name: "Yellow", value: "#eab308", emoji: "🟡" },
  { name: "Purple", value: "#a855f7", emoji: "🟣" },
  { name: "Orange", value: "#f97316", emoji: "🟠" },
  { name: "Pink", value: "#ec4899", emoji: "🩷" },
  { name: "Gray", value: "#6b7280", emoji: "⚫" }
]

interface ConceptWorldsGeneratorInterfaceProps {
  onClose: () => void
  projectTitle: string
}

export function ConceptWorldsGeneratorInterface({
  onClose,
  projectTitle
}: ConceptWorldsGeneratorInterfaceProps) {
  const { user } = useAuth()
  const [worldKit, setWorldKit] = useState<Partial<WorldKit>>({
    seedVariability: 50,
    textureDetail: 50,
    depthLevel: 50,
    compositionScale: 50,
    toneMatch: 50,
    spatialConsistencyLock: false,
    brandSync: false,
    symbolicMotifs: [],
    referenceImages: [],
    model: "Nano-banana",
    aspectRatio: "1:1"
  })
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [smartMessage, setSmartMessage] = useState("")
  const { toast } = useToast()

  // Smart conditional logic
  const isFlatVector = worldKit.artDirection === "Flat Vector"
  const isInterior = worldKit.environmentType === "Interior"
  const isSurreal = worldKit.mood === "surreal"
  const isBrandSynced = worldKit.brandSync

  // Dynamic aspect ratio filtering based on selected model
  const supportedRatios = getSupportedAspectRatios(worldKit.model as FalModel || 'Nano-banana')
  const availableAspectRatios = ALL_ASPECT_RATIOS.filter(ar => 
    supportedRatios.includes(ar.ratio)
  )

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles: File[] = []
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        newFiles.push(files[i])
      }
      setWorldKit(prev => ({
        ...prev,
        referenceImages: [...(prev.referenceImages || []), ...newFiles].slice(0, 3)
      }))
    }
  }

  const removeReferenceImage = (index: number) => {
    setWorldKit(prev => ({
      ...prev,
      referenceImages: prev.referenceImages?.filter((_, i) => i !== index) || []
    }))
  }

  const toggleMotif = (motif: string) => {
    setWorldKit(prev => ({
      ...prev,
      symbolicMotifs: prev.symbolicMotifs?.includes(motif)
        ? prev.symbolicMotifs.filter(m => m !== motif)
        : [...(prev.symbolicMotifs || []), motif]
    }))
  }

  // Reset aspect ratio when model changes to unsupported ratio
  useEffect(() => {
    if (worldKit.model && worldKit.aspectRatio) {
      const supported = getSupportedAspectRatios(worldKit.model as FalModel)
      if (!supported.includes(worldKit.aspectRatio)) {
        setWorldKit(prev => ({ ...prev, aspectRatio: "1:1" }))
      }
    }
  }, [worldKit.model])

  // Smart behavior logic
  useEffect(() => {
    let message = ""

    // Art Direction changes
    if (worldKit.artDirection === "flat-vector") {
      message = "DreamCut disabled lighting for flat vector style."
    }

    if (worldKit.artDirection === "watercolor") {
      message = "DreamCut selected soft ambient lighting for watercolor style."
    }

    if (worldKit.artDirection === "realistic") {
      message = "DreamCut applied natural lighting for realistic style."
    }

    // Environment type changes
    if (worldKit.environmentType === "interior") {
      message = "DreamCut limited atmospheric motion for interior environments."
    }

    // Brand sync changes
    if (worldKit.brandSync) {
      message = "DreamCut is applying your brand tones as environmental accents."
    }

    // Mood context changes
    if (worldKit.mood === "surreal") {
      message = "DreamCut enabled symbolic motifs for enhanced creativity in surreal mood."
    }

    setSmartMessage(message)
  }, [worldKit.artDirection, worldKit.environmentType, worldKit.brandSync, worldKit.mood])

  const generateWorld = async () => {
    if (!worldKit.prompt || !worldKit.name) {
      toast({
        title: "Missing required fields",
        description: "Please provide a world name and description.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    
    try {
      // Prepare FormData for file uploads
      const formData = new FormData()
      
      // Collect all creative fields (exclude metadata)
      const allFields = {
        worldPurpose: worldKit.worldPurpose || '',
        logoPlacement: worldKit.logoPlacement || '',
        customColor: worldKit.customColor || '#3b82f6',
        seedVariability: worldKit.seedVariability || 50,
        artDirection: worldKit.artDirection || '',
        visualInfluence: worldKit.visualInfluence || '',
        colorSystem: worldKit.colorSystem || '',
        lighting: worldKit.lighting || '',
        materialLanguage: worldKit.materialLanguage || '',
        textureDetail: worldKit.textureDetail || 50,
        environmentType: worldKit.environmentType || '',
        locationArchetype: worldKit.locationArchetype || '',
        cameraFraming: worldKit.cameraFraming || '',
        atmosphericMotion: worldKit.atmosphericMotion || '',
        depthLevel: worldKit.depthLevel || 50,
        compositionScale: worldKit.compositionScale || 50,
        spatialConsistencyLock: worldKit.spatialConsistencyLock || false,
        mood: worldKit.mood || '',
        culturalInfluence: worldKit.culturalInfluence || '',
        timeOfDay: worldKit.timeOfDay || '',
        emotionalTone: worldKit.emotionalTone || '',
        symbolicMotifs: worldKit.symbolicMotifs || [],
        storyHook: worldKit.storyHook || '',
        brandSync: worldKit.brandSync || false,
        brandPaletteMode: worldKit.brandPaletteMode || '',
        toneMatch: worldKit.toneMatch || 50,
        typographyInWorld: worldKit.typographyInWorld || ''
      }

      // Filter to only filled fields
      const filledFields = filterFilledFields(allFields)

      // Add original prompt
      formData.append('prompt', worldKit.prompt)
      
      // Add metadata fields (needed for database/tracking)
      formData.append('name', worldKit.name)
      formData.append('model', worldKit.model || 'Nano-banana')
      formData.append('aspectRatio', worldKit.aspectRatio || '1:1')
      formData.append('metadata', JSON.stringify({
        projectTitle,
        timestamp: new Date().toISOString()
      }))
      
      // Only add fields the user actually filled
      for (const [key, value] of Object.entries(filledFields)) {
        if (typeof value === 'boolean') {
          formData.append(key, value.toString())
        } else if (typeof value === 'number') {
          formData.append(key, value.toString())
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value))
        } else if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, String(value))
        }
      }
      
      // Add reference images
      worldKit.referenceImages?.forEach((file, index) => {
        formData.append(`referenceImage_${index}`, file)
      })
      
      // Add logo file if present
      if (worldKit.logoFile) {
        formData.append('logoFile', worldKit.logoFile)
      }

      console.log("Generating concept world with FormData")

      // Call the API
      const response = await fetch('/api/concept-world-generation', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate concept world')
      }

      const result = await response.json()
      console.log("Concept world generation result:", result)
      
      if (result.success) {
        toast({
          title: "🌍 Concept World Generated!",
          description: `"${worldKit.name}" has been created and saved to your collection. Check your library to view it!`,
        })
        
        // Close the interface to return to the generator panel
        // This will trigger a refresh of the concept worlds list
        setTimeout(() => {
          onClose()
        }, 2000) // Wait 2 seconds to show the success message
      } else {
        throw new Error(result.error || 'Generation failed')
      }
      
    } catch (error) {
      console.error('Generation failed:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate concept world. Please try again."
      setGenerationError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const getWorldDNASummary = () => {
    const dna = []
    if (worldKit.artDirection) dna.push(worldKit.artDirection)
    if (worldKit.colorSystem) dna.push(worldKit.colorSystem)
    if (worldKit.mood) dna.push(MOODS.find(m => m.value === worldKit.mood)?.label)
    if (worldKit.culturalInfluence) dna.push(worldKit.culturalInfluence)
    return dna.filter(Boolean).join(" • ")
  }

  return (
    <>
      {/* Loading Overlay */}
      {isGenerating && (
        <GenerationLoading 
          model={worldKit.model as "Nano-banana" | "gpt-image-1" | "seedream-v4"}
          onCancel={() => setIsGenerating(false)}
        />
      )}

      {/* Error Overlay */}
      {generationError && (
        <GenerationError
          error={generationError}
          model={worldKit.model as "Nano-banana" | "gpt-image-1" | "seedream-v4"}
          onRetry={() => {
            setGenerationError(null)
            generateWorld()
          }}
          onClose={() => setGenerationError(null)}
        />
      )}

      <div className="bg-background border border-border rounded-md h-[80vh] flex flex-col">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-500 bg-clip-text text-transparent truncate pr-2">
          Generate Concept World: {projectTitle}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 shrink-0">
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hover p-3 pb-6 space-y-3">
        {/* Smart Message */}
        {smartMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-xs text-blue-800">
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {smartMessage}
            </div>
      </div>
        )}

        {/* Required Field Info */}
        {/* <div className="bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>Only the <strong>Prompt</strong> field is required. All other fields are optional.</span>
            </div>
      </div> */}

        <div className="space-y-3">
        {/* 1️⃣ World Intent & Prompt */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-500 bg-clip-text text-transparent border-b pb-1">
              1️⃣ World Intent & Prompt
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">World Name</label>
                <Input
                  value={worldKit.name || ""}
                  onChange={(e) => setWorldKit(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your world name"
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Prompt <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={worldKit.prompt || ""}
                  onChange={(e) => setWorldKit(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="A floating eco-city above clouds powered by solar crystals..."
                  rows={2}
                  className="text-xs resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">AI Model</label>
                <Select
                  value={worldKit.model || "Nano-banana"}
                  onValueChange={(value) => setWorldKit(prev => ({ ...prev, model: value }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nano-banana">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🍌</span>
                        <span className="text-xs">Nano-banana</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gpt-image-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🤖</span>
                        <span className="text-xs">Gpt-image-1</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="seedream-v4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🌱</span>
                        <span className="text-xs">Seedream-v4</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">🎯 World Purpose</label>
                <Select
                  value={worldKit.worldPurpose || ""}
                  onValueChange={(value) => setWorldKit(prev => ({ ...prev, worldPurpose: value }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORLD_PURPOSES.map((purpose) => (
                      <SelectItem key={purpose} value={purpose.replace(/^[^\s]+\s/, '').toLowerCase().replace(/\s+/g, '-')}>
                        {purpose}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Reference Upload (Optional) - Max 3 images</label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="reference-upload"
                    disabled={(worldKit.referenceImages?.length || 0) >= 3}
                  />
                  <label htmlFor="reference-upload" className="cursor-pointer">
                    <div className="text-center space-y-1">
                      <Upload className="h-4 w-4 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground">
                        Upload images ({(worldKit.referenceImages?.length || 0)}/3)
                      </p>
                    </div>
                  </label>
                  
                  {worldKit.referenceImages && worldKit.referenceImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {worldKit.referenceImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img src={URL.createObjectURL(image)} alt={`Reference ${index + 1}`} className="w-full h-16 object-cover rounded-sm" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-1 -right-1 h-4 w-4"
                            onClick={() => removeReferenceImage(index)}
                          >
                            <X className="h-2 w-2" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">🏷️ Logo Placement</label>
                <Select
                  value={worldKit.logoPlacement || "None"}
                  onValueChange={(value) => setWorldKit(prev => ({ ...prev, logoPlacement: value }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select logo placement" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOGO_PLACEMENT_OPTIONS.map((placement) => (
                      <SelectItem key={placement} value={placement.replace(/^[^\s]+\s/, '')}>
                        {placement}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(worldKit.logoPlacement === "Top-Left" || worldKit.logoPlacement === "Bottom-Right") && (
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setWorldKit(prev => ({ ...prev, logoFile: file }))
                        }
                      }}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-2 text-center">
                        <Upload className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">
                          {worldKit.logoFile ? "Logo uploaded" : "Upload logo"}
                        </p>
                      </div>
                    </label>
                    {worldKit.logoFile && (
                      <div className="mt-2">
                        <img src={URL.createObjectURL(worldKit.logoFile)} alt="Logo preview" className="w-16 h-16 object-cover rounded-md" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">🎨 Color</label>
                <Select
                  value={worldKit.customColor || "#3b82f6"}
                  onValueChange={(value) => setWorldKit(prev => ({ ...prev, customColor: value }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select color">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border border-border"
                          style={{ backgroundColor: worldKit.customColor || "#3b82f6" }}
                        />
                        <span>{PRESET_COLORS.find(c => c.value === (worldKit.customColor || "#3b82f6"))?.name || "Custom"}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border border-border"
                            style={{ backgroundColor: color.value }}
                          />
                          <span>{color.emoji} {color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-border bg-gradient-to-r from-red-500 to-blue-500" />
                        <span>🎨 Custom Color</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {worldKit.customColor && !PRESET_COLORS.find(c => c.value === worldKit.customColor) && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="color"
                      value={worldKit.customColor}
                      onChange={(e) => setWorldKit(prev => ({ ...prev, customColor: e.target.value }))}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={worldKit.customColor}
                      onChange={(e) => setWorldKit(prev => ({ ...prev, customColor: e.target.value }))}
                      placeholder="#3b82f6"
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">📐 Aspect Ratio</label>
                <Select
                  value={worldKit.aspectRatio || ""}
                  onValueChange={(value) => setWorldKit(prev => ({ ...prev, aspectRatio: value }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select aspect ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAspectRatios.map((ar) => (
                      <SelectItem key={ar.ratio} value={ar.ratio}>
                        {ar.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              <div>
                <label className="block text-xs font-medium mb-1">
                  Seed Variability: {worldKit.seedVariability}%
                </label>
                <Slider
                  value={[worldKit.seedVariability || 50]}
                  onValueChange={([value]) => setWorldKit(prev => ({ ...prev, seedVariability: value }))}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Consistent</span>
                  <span>Experimental</span>
                </div>
              </div>
            </div>
          </div>

          <hr />

        {/* 2️⃣ Visual DNA */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-500 bg-clip-text text-transparent border-b pb-1">
              2️⃣ Visual DNA
            </h4>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
              <div>
                  <label className="block text-xs font-medium mb-1">🎨 Art Direction</label>
                  <Select
                    value={worldKit.artDirection || ""}
                    onValueChange={(value) => setWorldKit(prev => ({ ...prev, artDirection: value }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select art direction" />
                    </SelectTrigger>
                    <SelectContent>
                      {ART_DIRECTIONS.map((direction) => (
                        <SelectItem key={direction} value={direction.replace(/^[^\s]+\s/, '').toLowerCase().replace(/\s+/g, '-')}>
                          {direction}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">✨ Visual Influence</label>
                  <Select
                    value={worldKit.visualInfluence || ""}
                    onValueChange={(value) => setWorldKit(prev => ({ ...prev, visualInfluence: value }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select influence" />
                    </SelectTrigger>
                    <SelectContent>
                      {VISUAL_INFLUENCES.map((influence) => (
                        <SelectItem key={influence} value={influence.replace(/^[^\s]+\s/, '').toLowerCase().replace(/\s+/g, '-')}>
                          {influence}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

                <div>
                  <label className="block text-xs font-medium mb-1">🌈 Color System</label>
                  <Select
                    value={worldKit.colorSystem || ""}
                    onValueChange={(value) => setWorldKit(prev => ({ ...prev, colorSystem: value }))}
                    disabled={isBrandSynced}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select color system" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_SYSTEMS.map((system) => (
                        <SelectItem key={system} value={system.replace(/^[^\s]+\s/, '').toLowerCase().replace(/\s+/g, '-')}>
                          {system}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">💡 Lighting Preset</label>
                  <Select
                    value={worldKit.lighting || ""}
                    onValueChange={(value) => setWorldKit(prev => ({ ...prev, lighting: value }))}
                    disabled={isFlatVector}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select lighting" />
                    </SelectTrigger>
                    <SelectContent>
                      {LIGHTING_PRESETS.map((preset) => (
                        <SelectItem key={preset} value={preset.replace(/^[^\s]+\s/, '').toLowerCase().replace(/\s+/g, '-')}>
                          {preset}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isFlatVector && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Lighting disabled for Flat Vector
                    </p>
                  )}
              </div>

                <div>
                  <label className="block text-xs font-medium mb-1">🏗️ Material Language</label>
                  <Select
                    value={worldKit.materialLanguage || ""}
                    onValueChange={(value) => setWorldKit(prev => ({ ...prev, materialLanguage: value }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_LANGUAGES.map((material) => (
                        <SelectItem key={material} value={material.replace(/^[^\s]+\s/, '').toLowerCase().replace(/\s+/g, '-')}>
                          {material}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Texture Detail: {worldKit.textureDetail}%
                  </label>
                  <Slider
                    value={[worldKit.textureDetail || 50]}
                    onValueChange={([value]) => setWorldKit(prev => ({ ...prev, textureDetail: value }))}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Minimal</span>
                    <span>Rich Detail</span>
                  </div>
                </div>
              </div>
                </div>
              </div>

          <hr />

        {/* 3️⃣ Spatial DNA */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-500 bg-clip-text text-transparent border-b pb-1">
              3️⃣ Spatial DNA
            </h4>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
              <div>
                  <label className="block text-xs font-medium mb-1">🌍 Environment Type</label>
                  <Select
                    value={worldKit.environmentType || ""}
                    onValueChange={(value) => setWorldKit(prev => ({ ...prev, environmentType: value }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENVIRONMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type.replace(/^[^\s]+\s/, '').toLowerCase()}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">📍 Location Archetype</label>
                  <Select
                    value={worldKit.locationArchetype || ""}
                    onValueChange={(value) => setWorldKit(prev => ({ ...prev, locationArchetype: value }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_ARCHETYPES.map((archetype) => (
                        <SelectItem key={archetype} value={archetype.replace(/^[^\s]+\s/, '').toLowerCase().replace(/\s+/g, '-')}>
                          {archetype}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

                <div>
                  <label className="block text-xs font-medium mb-1">📷 Camera Framing</label>
                  <Select
                    value={worldKit.cameraFraming || ""}
                    onValueChange={(value) => setWorldKit(prev => ({ ...prev, cameraFraming: value }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select framing" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMERA_FRAMINGS.map((framing) => (
                        <SelectItem key={framing} value={framing.replace(/^[^\s]+\s/, '').toLowerCase().replace(/\s+/g, '-')}>
                          {framing}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">🌪️ Atmospheric Motion</label>
                  <Select
                    value={worldKit.atmosphericMotion || ""}
                    onValueChange={(value) => setWorldKit(prev => ({ ...prev, atmosphericMotion: value }))}
                    disabled={isInterior}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select motion" />
                    </SelectTrigger>
                    <SelectContent>
                      {ATMOSPHERIC_MOTIONS.map((motion) => (
                        <SelectItem key={motion} value={motion.replace(/^[^\s]+\s/, '').toLowerCase().replace(/\s+/g, '-')}>
                          {motion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInterior && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Motion limited for interior
                    </p>
                  )}
              </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Depth Level: {worldKit.depthLevel}%
                  </label>
                  <Slider
                    value={[worldKit.depthLevel || 50]}
                    onValueChange={([value]) => setWorldKit(prev => ({ ...prev, depthLevel: value }))}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Flat (2D)</span>
                    <span>Volumetric (3D)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Composition Scale: {worldKit.compositionScale}%
                  </label>
                  <Slider
                    value={[worldKit.compositionScale || 50]}
                    onValueChange={([value]) => setWorldKit(prev => ({ ...prev, compositionScale: value }))}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Micro (object)</span>
                    <span>Macro (world)</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="spatial-consistency"
                  checked={worldKit.spatialConsistencyLock || false}
                  onCheckedChange={(checked) => setWorldKit(prev => ({ ...prev, spatialConsistencyLock: checked }))}
                />
                  <label htmlFor="spatial-consistency" className="text-xs font-medium">
                  Spatial Consistency Lock
                </label>
              </div>
                  </div>
                </div>
            </div>

          <hr />

        {/* 4️⃣ Narrative DNA */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-500 bg-clip-text text-transparent border-b pb-1">
              4️⃣ Narrative DNA
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">🎭 Mood Context</label>
                <Select
                  value={worldKit.mood || ""}
                  onValueChange={(value) => setWorldKit(prev => ({ ...prev, mood: value }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOODS.map((mood) => (
                      <SelectItem key={mood.value} value={mood.value}>
                        <div className="flex items-center gap-2">
                          <span>{mood.emoji}</span>
                          <span>{mood.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">🏛️ Cultural Influence</label>
                  <Select
                    value={worldKit.culturalInfluence || ""}
                    onValueChange={(value) => setWorldKit(prev => ({ ...prev, culturalInfluence: value }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select culture" />
                    </SelectTrigger>
                    <SelectContent>
                      {CULTURAL_INFLUENCES.map((culture) => (
                        <SelectItem key={culture} value={culture.replace(/^[^\s]+\s/, '').toLowerCase().replace(/\s+/g, '-')}>
                          {culture}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">⏰ Time of Day / Era</label>
                  <Select
                    value={worldKit.timeOfDay || ""}
                    onValueChange={(value) => setWorldKit(prev => ({ ...prev, timeOfDay: value }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OF_DAY_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time.replace(/^[^\s]+\s/, '').toLowerCase()}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

              <div>
                  <label className="block text-xs font-medium mb-1">💭 Emotional Tone</label>
                <Select
                  value={worldKit.emotionalTone || ""}
                  onValueChange={(value) => setWorldKit(prev => ({ ...prev, emotionalTone: value }))}
                >
                    <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMOTIONAL_TONES.map((tone) => (
                        <SelectItem key={tone} value={tone.replace(/^[^\s]+\s/, '').toLowerCase().replace(/\s+/g, '-')}>
                        {tone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                  <label className="block text-xs font-medium mb-1">🔮 Symbolic Motifs</label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      const motifText = value.replace(/^[^\s]+\s/, '');
                      if (!worldKit.symbolicMotifs?.includes(motifText)) {
                        setWorldKit(prev => ({
                          ...prev,
                          symbolicMotifs: [...(prev.symbolicMotifs || []), motifText]
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Add symbolic motif" />
                    </SelectTrigger>
                    <SelectContent>
                      {SYMBOLIC_MOTIFS.filter(motif => !worldKit.symbolicMotifs?.includes(motif.replace(/^[^\s]+\s/, ''))).map((motif) => (
                        <SelectItem key={motif} value={motif}>
                          {motif}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {worldKit.symbolicMotifs && worldKit.symbolicMotifs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {worldKit.symbolicMotifs.map((motif) => (
                        <Badge key={motif} variant="secondary" className="text-xs">
                          {SYMBOLIC_MOTIFS.find(m => m.replace(/^[^\s]+\s/, '') === motif) || motif}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-3 w-3 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => toggleMotif(motif)}
                          >
                            <X className="h-2 w-2" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {isSurreal && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Surreal mood enables symbolic motifs
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Story Hook (Optional)</label>
                <Textarea
                  value={worldKit.storyHook || ""}
                  onChange={(e) => setWorldKit(prev => ({ ...prev, storyHook: e.target.value }))}
                  placeholder="A society that grows gardens in the sky..."
                  rows={2}
                    className="text-xs resize-none"
                />
              </div>
                  </div>
                </div>
            </div>

          <hr />

        {/* 5️⃣ Brand Integration */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-500 bg-clip-text text-transparent border-b pb-1">
              5️⃣ Brand Integration
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="brand-sync"
                  checked={worldKit.brandSync || false}
                  onCheckedChange={(checked) => setWorldKit(prev => ({ ...prev, brandSync: checked }))}
                />
                <label htmlFor="brand-sync" className="text-xs font-medium">
                  Brand Sync
                </label>
              </div>

              {isBrandSynced && (
                <div className="grid grid-cols-1 gap-3">
                    <div>
                    <label className="block text-xs font-medium mb-1">Brand Palette Mode</label>
                      <Select
                        value={worldKit.brandPaletteMode || ""}
                        onValueChange={(value) => setWorldKit(prev => ({ ...prev, brandPaletteMode: value }))}
                      >
                      <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select palette mode" />
                        </SelectTrigger>
                        <SelectContent>
                          {BRAND_PALETTE_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode.replace(/^[^\s]+\s/, '').toLowerCase()}>
                              {mode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                    <label className="block text-xs font-medium mb-1">Logo Placement (Optional)</label>
                      <Select
                        value={worldKit.logoPlacement || ""}
                        onValueChange={(value) => setWorldKit(prev => ({ ...prev, logoPlacement: value }))}
                      >
                      <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select placement" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOGO_PLACEMENTS.map((placement) => (
                          <SelectItem key={placement} value={placement.replace(/^[^\s]+\s/, '').toLowerCase().replace(/\s+/g, '-')}>
                              {placement}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>

                    <div>
                    <label className="block text-xs font-medium mb-1">
                        Tone Match: {worldKit.toneMatch}%
                      </label>
                      <Slider
                        value={[worldKit.toneMatch || 50]}
                        onValueChange={([value]) => setWorldKit(prev => ({ ...prev, toneMatch: value }))}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>World Palette</span>
                        <span>Brand Palette</span>
                      </div>
                    </div>

                    <div>
                    <label className="block text-xs font-medium mb-1">Typography in World</label>
                      <Select
                        value={worldKit.typographyInWorld || ""}
                        onValueChange={(value) => setWorldKit(prev => ({ ...prev, typographyInWorld: value }))}
                      >
                      <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select typography" />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPOGRAPHY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option.replace(/^[^\s]+\s/, '').toLowerCase().replace(/\s+/g, '-')}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
              )}
            </div>
                </div>

              </div>

        {/* Generate Button - Fixed at bottom */}
        <div className="flex justify-end pt-3 border-t">
                <Button
                  onClick={generateWorld}
            disabled={isGenerating || !worldKit.prompt?.trim()}
            className="min-w-[120px] h-8 text-xs bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isGenerating ? (
                    <>
                <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                Generating...
                    </>
                  ) : (
                    <>
                <Sparkles className="h-3 w-3 mr-1" />
                 Generate Concept World
                    </>
                  )}
                </Button>
              </div>
            </div>
    </div>
    {/* Previous Generations */}
    <PreviousGenerations contentType="concept_worlds" userId={user?.id || ''} className="mt-8" />
    </>
  )
}
