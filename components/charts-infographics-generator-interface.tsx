"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  X, 
  Upload, 
  FileText, 
  Table, 
  BarChart3, 
  Palette, 
  Type, 
  Layout, 
  MessageSquare,
  Download,
  Sparkles,
  Eye,
  Settings,
  Info,
} from "lucide-react"
import { STYLE_MAP, CHART_PURPOSE_MAP, MOOD_CONTEXTS, LIGHTING_PRESETS, COLOR_PALETTES, EXPORT_PRESETS, BACKGROUND_OPTIONS, TEXTURE_OPTIONS } from "@/lib/styles/chart-style-map"
import { useAuth } from "@/components/auth/auth-provider"
import { cn } from "@/lib/utils"
import { filterFilledFields } from "@/lib/utils/prompt-builder"
import { getSupportedAspectRatios } from '@/lib/utils/aspect-ratio-utils'
import type { FalModel } from '@/lib/utils/fal-generation'
import { GenerationLoading } from "@/components/ui/generation-loading"
import { GenerationError } from "@/components/ui/generation-error"

// Logo Placement options (multi-select)
const LOGO_PLACEMENT_OPTIONS = [
  { value: "top-right", label: "Top-Right Corner", icon: "↗️", desc: "Logo overlay in top-right" },
  { value: "bottom-left", label: "Bottom-Left Corner", icon: "↙️", desc: "Logo overlay in bottom-left" },
  { value: "bottom-right", label: "Bottom-Right Corner", icon: "↘️", desc: "Logo overlay in bottom-right" },
  { value: "top-left", label: "Top-Left Corner", icon: "↖️", desc: "Logo overlay in top-left" },
  { value: "on-chart", label: "On Chart", icon: "📊", desc: "Logo on chart area" },
  { value: "on-title", label: "On Title", icon: "📝", desc: "Logo near chart title" },
  { value: "on-legend", label: "On Legend", icon: "🏷️", desc: "Logo on legend area" },
  { value: "background", label: "Background", icon: "🖼️", desc: "Logo on background" },
  { value: "center-badge", label: "Center Badge", icon: "🎯", desc: "Logo as centered badge" }
]

interface ChartsInfographicsGeneratorInterfaceProps {
  onClose: () => void
  projectTitle: string
}

interface ChartState {
  data: {
    title: string
    source: "file" | "text" | "manual"
    dataFile: File | null
    textData: string
    autoDetected: boolean
    aggregationType: string
    units: string
    labels: string
  }
  purpose: {
    purpose: string
    chartType: string
    axisMapping: Record<string, string>
    multiSeries: boolean
    orientation: "horizontal" | "vertical" | "radial" | "custom"
  }
  style: {
    artDirection: string
    visualInfluence: string
    chartDepth: number
    backgroundTexture: string
    accentShapes: boolean
  }
  mood: {
    moodContext: string
    toneIntensity: number
    lightingTemperature: number
    motionAccent: string
  }
  branding: {
    brandSync: boolean
    paletteMode: "categorical" | "sequential" | "diverging" | "custom"
    background: "light" | "dark" | "transparent" | "gradient" | "custom"
    fontFamily: string
    logoUpload: File | null
    logoPlacement: string[]
    logoDescription: string
    colorPalette: string
  }
  annotations: {
    dataLabels: boolean
    labelPlacement: string
    legends: string
    callouts: boolean
    calloutThreshold: number
    tooltipStyle: string
    axisTitles: string
    gridlines: string
  }
  layout: {
    layoutTemplate: string
    aspectRatio: string
    marginDensity: number
    safeZoneOverlay: boolean
    exportPreset: string
  }
  narrative: {
    headline: string
    caption: string
    tone: string
    platform: string
  }
}

const initialChartState: ChartState = {
  data: {
    title: "",
    source: "text",
    dataFile: null,
    textData: "",
    autoDetected: false,
    aggregationType: "sum",
    units: "",
    labels: ""
  },
  purpose: {
    purpose: "",
    chartType: "",
    axisMapping: {},
    multiSeries: false,
    orientation: "vertical"
  },
  style: {
    artDirection: "",
    visualInfluence: "",
    chartDepth: 0,
    backgroundTexture: "",
    accentShapes: false
  },
  mood: {
    moodContext: "",
    toneIntensity: 50,
    lightingTemperature: 50,
    motionAccent: "none"
  },
  branding: {
    brandSync: false,
    paletteMode: "categorical",
    background: "light",
    fontFamily: "Inter",
    logoUpload: null,
    logoPlacement: [],
    logoDescription: "",
    colorPalette: "auto"
  },
  annotations: {
    dataLabels: false,
    labelPlacement: "auto",
    legends: "auto",
    callouts: false,
    calloutThreshold: 3,
    tooltipStyle: "minimal",
    axisTitles: "",
    gridlines: "light"
  },
  layout: {
    layoutTemplate: "auto",
    aspectRatio: "16:9",
    marginDensity: 50,
    safeZoneOverlay: false,
    exportPreset: "custom"
  },
  narrative: {
    headline: "",
    caption: "",
    tone: "formal",
    platform: "web"
  }
}

export function ChartsInfographicsGeneratorInterface({ 
  onClose, 
  projectTitle 
}: ChartsInfographicsGeneratorInterfaceProps) {
  const { user } = useAuth()
  const [chartState, setChartState] = useState<ChartState>(initialChartState)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationPhase, setGenerationPhase] = useState<'analyzing' | 'enhancing' | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Custom field states
  const [customAggregationType, setCustomAggregationType] = useState("")
  const [customPurpose, setCustomPurpose] = useState("")
  const [customOrientation, setCustomOrientation] = useState("")
  const [customArtDirection, setCustomArtDirection] = useState("")
  const [customBackgroundTexture, setCustomBackgroundTexture] = useState("")
  const [customMoodContext, setCustomMoodContext] = useState("")
  const [customColorPalette, setCustomColorPalette] = useState("")
  const [customPaletteMode, setCustomPaletteMode] = useState("")
  const [customBackground, setCustomBackground] = useState("")
  const [customFontFamily, setCustomFontFamily] = useState("")
  const [customLabelPlacement, setCustomLabelPlacement] = useState("")
  const [customGridlines, setCustomGridlines] = useState("")
  const [customLayoutTemplate, setCustomLayoutTemplate] = useState("")
  const [customExportPreset, setCustomExportPreset] = useState("")
  const [customTone, setCustomTone] = useState("")
  const [customPlatform, setCustomPlatform] = useState("")

  // Dynamic aspect ratio filtering based on selected model (default to Nano-banana)
  const model = 'Nano-banana' as FalModel
  const supportedRatios = getSupportedAspectRatios(model)
  const availableAspectRatios = [
    { ratio: "1:1", label: "⬜ 1:1 (Square)" },
    { ratio: "4:5", label: "📱 4:5 (Portrait)" },
    { ratio: "16:9", label: "📺 16:9 (Widescreen)" },
    { ratio: "9:16", label: "📱 9:16 (Story)" }
  ].filter(ar => supportedRatios.includes(ar.ratio))

  // Smart visibility helpers
  const is3DStyle = () => chartState.style.artDirection === "3D Data Art"
  
  // Detect if should generate multiple variants
  const shouldGenerateMultiple = () => {
    return !chartState.purpose.chartType || // No specific chart type
           chartState.data.textData.includes("multiple") ||
           chartState.data.textData.includes("various") ||
           chartState.data.textData.includes("different styles")
  }
  const isPieChart = () => chartState.purpose.chartType === "Pie" || chartState.purpose.chartType === "Donut"
  const isPlayfulMood = () => chartState.mood.moodContext === "Playful"
  const isBrandSynced = () => chartState.branding.brandSync
  const isStoryAspect = () => chartState.layout.aspectRatio === "9:16"

  // Get available chart types based on purpose
  const getAvailableChartTypes = () => {
    if (!chartState.purpose.purpose) return []
    return CHART_PURPOSE_MAP[chartState.purpose.purpose as keyof typeof CHART_PURPOSE_MAP] || []
  }

  // Get available visual influences based on art direction
  const getAvailableVisualInfluences = () => {
    if (!chartState.style.artDirection) return []
    return STYLE_MAP[chartState.style.artDirection] || []
  }

  // Update chart state helper
  const updateChartState = (section: keyof ChartState, updates: Partial<ChartState[keyof ChartState]>) => {
    setChartState(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }))
  }

  // Handle data file upload
  const handleDataFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      updateChartState("data", { dataFile: file, source: "file" })
    }
  }

  // Handle data file removal
  const handleDataFileRemove = () => {
    updateChartState("data", { dataFile: null, source: "text" })
    // Reset the file input
    const fileInput = document.getElementById('data-file-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  // Handle export preset change and auto-set aspect ratio
  const handleExportPresetChange = (preset: string) => {
    if (preset && EXPORT_PRESETS[preset as keyof typeof EXPORT_PRESETS]) {
      const presetConfig = EXPORT_PRESETS[preset as keyof typeof EXPORT_PRESETS]
      updateChartState("layout", { 
        exportPreset: preset,
        aspectRatio: presetConfig.aspectRatio
      })
    } else {
      updateChartState("layout", { exportPreset: preset })
    }
  }

  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      updateChartState("branding", { logoUpload: file })
    }
  }

  // Handle logo removal
  const handleLogoRemove = () => {
    updateChartState("branding", { logoUpload: null })
    // Reset the file input
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }


  // Helper function to get texture display info
  const getTextureDisplay = (value: string) => {
    if (value === 'none') return { icon: '🚫', title: 'None' }
    if (value === 'custom') return { icon: '✏️', title: 'Custom' }
    
    const texture = Object.entries(TEXTURE_OPTIONS).find(([name]) => name.toLowerCase() === value)
    if (!texture) return { icon: '🌿', title: 'Select texture' }
    
    const [name, option] = texture
    const categoryIcons: Record<string, string> = {
      natural: '🌿',
      technical: '⚙️',
      abstract: '🎨'
    }
    
    return {
      icon: categoryIcons[option.category] || '🌿',
      title: name
    }
  }

  // Generate chart
  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerationPhase('analyzing')
    
    try {
      // Prepare FormData for file uploads
      const formData = new FormData()
      
      // Collect all creative fields
      const allFields = {
        // Data & Processing
        title: chartState.data.title || `Chart ${new Date().toLocaleDateString()}`,
        dataSource: chartState.data.source,
        autoDetected: chartState.data.autoDetected,
        aggregationType: chartState.data.aggregationType,
        units: chartState.data.units || '',
        labels: chartState.data.labels || '',
        
        // Purpose & Chart Configuration
        purpose: chartState.purpose.purpose || '',
        chartType: chartState.purpose.chartType || '',
        axisMapping: chartState.purpose.axisMapping,
        multiSeries: chartState.purpose.multiSeries,
        orientation: chartState.purpose.orientation,
        
        // Visual Style
        artDirection: chartState.style.artDirection || '',
        visualInfluence: chartState.style.visualInfluence || '',
        chartDepth: chartState.style.chartDepth,
        backgroundTexture: chartState.style.backgroundTexture || '',
        accentShapes: chartState.style.accentShapes,
        
        // Mood & Atmosphere
        moodContext: chartState.mood.moodContext || '',
        toneIntensity: chartState.mood.toneIntensity,
        lightingTemperature: chartState.mood.lightingTemperature,
        motionAccent: chartState.mood.motionAccent,
        
        // Branding
        brandSync: chartState.branding.brandSync,
        paletteMode: chartState.branding.paletteMode,
        backgroundType: chartState.branding.background,
        fontFamily: chartState.branding.fontFamily,
        logoPlacement: chartState.branding.logoPlacement,
        logoDescription: chartState.branding.logoDescription,
        
        // Annotations & Labels
        dataLabels: chartState.annotations.dataLabels,
        labelPlacement: chartState.annotations.labelPlacement,
        legends: chartState.annotations.legends,
        callouts: chartState.annotations.callouts,
        calloutThreshold: chartState.annotations.calloutThreshold,
        tooltipStyle: chartState.annotations.tooltipStyle,
        axisTitles: chartState.annotations.axisTitles || '',
        gridlines: chartState.annotations.gridlines,
        
        // Layout
        layoutTemplate: chartState.layout.layoutTemplate,
        aspectRatio: chartState.layout.aspectRatio,
        marginDensity: chartState.layout.marginDensity,
        safeZoneOverlay: chartState.layout.safeZoneOverlay,
        
        // Narrative
        headline: chartState.narrative.headline || '',
        caption: chartState.narrative.caption || '',
        tone: chartState.narrative.tone,
        platform: chartState.narrative.platform
      }

      // Filter to only filled fields
      const filledFields = filterFilledFields(allFields)

      // Add original prompt
      formData.append('prompt', chartState.data.textData || '')
      
      // Add metadata and required chart state fields
      formData.append('title', chartState.data.title || `Chart ${new Date().toLocaleDateString()}`)
      formData.append('description', chartState.narrative.caption || '')
      formData.append('dataSource', chartState.data.source)
      formData.append('autoDetected', chartState.data.autoDetected.toString())
      formData.append('aggregationType', chartState.data.aggregationType)
      formData.append('units', chartState.data.units || '')
      formData.append('labels', chartState.data.labels || '')
      formData.append('purpose', chartState.purpose.purpose || '')
      formData.append('chartType', chartState.purpose.chartType || '')
      formData.append('axisMapping', JSON.stringify(chartState.purpose.axisMapping))
      formData.append('multiSeries', chartState.purpose.multiSeries.toString())
      formData.append('orientation', chartState.purpose.orientation)
      formData.append('artDirection', chartState.style.artDirection || '')
      formData.append('visualInfluence', chartState.style.visualInfluence || '')
      formData.append('chartDepth', chartState.style.chartDepth.toString())
      formData.append('backgroundTexture', chartState.style.backgroundTexture || '')
      formData.append('accentShapes', chartState.style.accentShapes.toString())
      formData.append('moodContext', chartState.mood.moodContext || '')
      formData.append('toneIntensity', chartState.mood.toneIntensity.toString())
      formData.append('lightingTemperature', chartState.mood.lightingTemperature.toString())
      formData.append('motionAccent', chartState.mood.motionAccent)
      formData.append('brandSync', chartState.branding.brandSync.toString())
      formData.append('paletteMode', chartState.branding.paletteMode)
      formData.append('backgroundType', chartState.branding.background)
      formData.append('fontFamily', chartState.branding.fontFamily)
      formData.append('logoPlacement', JSON.stringify(chartState.branding.logoPlacement))
      formData.append('logoDescription', chartState.branding.logoDescription || '')
      formData.append('dataLabels', chartState.annotations.dataLabels.toString())
      formData.append('labelPlacement', chartState.annotations.labelPlacement)
      formData.append('legends', chartState.annotations.legends)
      formData.append('callouts', chartState.annotations.callouts.toString())
      formData.append('calloutThreshold', chartState.annotations.calloutThreshold.toString())
      formData.append('tooltipStyle', chartState.annotations.tooltipStyle)
      formData.append('axisTitles', chartState.annotations.axisTitles || '')
      formData.append('gridlines', chartState.annotations.gridlines)
      formData.append('layoutTemplate', chartState.layout.layoutTemplate)
      formData.append('aspectRatio', chartState.layout.aspectRatio)
      formData.append('marginDensity', chartState.layout.marginDensity.toString())
      formData.append('safeZoneOverlay', chartState.layout.safeZoneOverlay.toString())
      formData.append('headline', chartState.narrative.headline || '')
      formData.append('caption', chartState.narrative.caption || '')
      formData.append('tone', chartState.narrative.tone)
      formData.append('platform', chartState.narrative.platform)
      formData.append('colorPalette', chartState.branding.colorPalette)
      formData.append('exportPreset', chartState.layout.exportPreset)
      formData.append('generateVariants', shouldGenerateMultiple().toString())
      
      // Add custom fields if they exist
      if (customAggregationType) formData.append('custom_aggregation_type', customAggregationType)
      if (customPurpose) formData.append('custom_purpose', customPurpose)
      if (customOrientation) formData.append('custom_orientation', customOrientation)
      if (customArtDirection) formData.append('custom_art_direction', customArtDirection)
      if (customBackgroundTexture) formData.append('custom_background_texture', customBackgroundTexture)
      if (customMoodContext) formData.append('custom_mood_context', customMoodContext)
      if (customColorPalette) formData.append('custom_color_palette', customColorPalette)
      if (customPaletteMode) formData.append('custom_palette_mode', customPaletteMode)
      if (customBackground) formData.append('custom_background', customBackground)
      if (customFontFamily) formData.append('custom_font_family', customFontFamily)
      if (customLabelPlacement) formData.append('custom_label_placement', customLabelPlacement)
      if (customGridlines) formData.append('custom_gridlines', customGridlines)
      if (customLayoutTemplate) formData.append('custom_layout_template', customLayoutTemplate)
      if (customExportPreset) formData.append('custom_export_preset', customExportPreset)
      if (customTone) formData.append('custom_tone', customTone)
      if (customPlatform) formData.append('custom_platform', customPlatform)
      
      formData.append('metadata', JSON.stringify({
        projectTitle,
        timestamp: new Date().toISOString()
      }))
      
      // Add data file if present
      if (chartState.data.dataFile) {
        formData.append('dataFile', chartState.data.dataFile)
      }
      
      // Add logo file if present
      if (chartState.branding.logoUpload) {
        formData.append('logoFile', chartState.branding.logoUpload)
      }

      console.log('Generating chart with FormData')

      // Simulate phase progression (since API handles both phases internally)
      setTimeout(() => {
        setGenerationPhase('enhancing')
      }, 2000) // Switch to enhancing phase after 2 seconds

      // Call the API
      const response = await fetch('/api/charts-infographics', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate chart')
      }

      const result = await response.json()
      console.log('Chart generated successfully:', result)
      
      // TODO: Handle success (show preview, add to library, etc.)
      
    } catch (error) {
      console.error('Error generating chart:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate chart. Please try again."
      setGenerationError(errorMessage)
    } finally {
      setIsGenerating(false)
      setGenerationPhase(null)
    }
  }

  return (
    <>
      {/* Loading Overlay */}
      {isGenerating && (
        <GenerationLoading 
          model="gpt-image-1"
          onCancel={() => setIsGenerating(false)}
        />
      )}

      {/* Error Overlay */}
      {generationError && (
        <GenerationError
          error={generationError}
          model="gpt-image-1"
          onRetry={() => {
            setGenerationError(null)
            handleGenerate()
          }}
          onClose={() => setGenerationError(null)}
        />
      )}

      <div className="bg-background border border-border rounded-lg p-3 space-y-3 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hover">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-background z-10 pb-5 p-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-xs font-semibold bg-gradient-to-r from-lime-600 via-green-500 to-emerald-500 bg-clip-text text-transparent">
              📊 Generator
            </h3>
            <p className="text-xs text-muted-foreground">
              Create data-driven visuals for: {projectTitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Edit Mode */}
        <Accordion type="multiple" defaultValue={["data", "purpose"]} className="space-y-3">
          
          {/* Data Section */}
          <AccordionItem value="data" className="border border-border rounded-lg px-3">
            <AccordionTrigger className="hover:no-underline py-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs">📊 Data Source & Processing</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Only the <strong>Prompt</strong> field is required. All other fields are optional.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">

              {/* Title Section */}
              <div className="space-y-2">
                <Label className="text-xs">📝 Title</Label>
                <Input
                  placeholder="Enter chart title..."
                  value={chartState.data.title || ""}
                  onChange={(e) => updateChartState("data", { title: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              {/* Data File Upload Section */}
              <div className="space-y-2">
                <Label className="text-xs">📁 Data File Upload</Label>
                
                {!chartState.data.dataFile ? (
                  <div className="relative border-2 border-dashed border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          CSV, Excel, JSON, PDF, TXT, XML and more (up to 10MB)
                        </p>
                      </div>
                    </div>
                    <Input
                      id="data-file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls,.json,.txt,.pdf,.docx,.doc,.xml,.html,.md"
                      onChange={handleDataFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="border border-border rounded-lg p-2 bg-muted/30">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {chartState.data.dataFile.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {(chartState.data.dataFile.size / 1024 / 1024).toFixed(2)} MB • {chartState.data.dataFile.name.split('.').pop()?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleDataFileRemove}
                          className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Text Description Section */}
              <div className="space-y-2">
                <Label className="text-xs">📝 Prompt <span className="text-red-500">*</span></Label>
                <Textarea
                  placeholder="e.g., 'Compare revenue by region for 2024: North America $2.5M, Europe $1.8M, Asia $3.2M'"
                  value={chartState.data.textData}
                  onChange={(e) => updateChartState("data", { textData: e.target.value })}
                  className="min-h-[60px] text-xs resize-none"
                  required
                />
              </div>


              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">📊 Aggregation Type</Label>
                  <Select 
                    value={chartState.data.aggregationType} 
                    onValueChange={(value) => updateChartState("data", { aggregationType: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🤖</span>
                          <span className="text-sm">Auto</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="sum">➕ Sum</SelectItem>
                      <SelectItem value="average">📊 Average</SelectItem>
                      <SelectItem value="count">🔢 Count</SelectItem>
                      <SelectItem value="max">📈 Maximum</SelectItem>
                      <SelectItem value="min">📉 Minimum</SelectItem>
                      <SelectItem value="custom">✏️ Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {chartState.data.aggregationType === 'custom' && (
                    <Input
                      value={customAggregationType}
                      onChange={(e) => setCustomAggregationType(e.target.value)}
                      placeholder="Enter custom aggregation type..."
                      className="h-8 text-xs mt-2"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">🏷️ Units / Labels</Label>
                  <Input
                    placeholder="e.g., $, %, users"
                    value={chartState.data.units}
                    onChange={(e) => updateChartState("data", { units: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

            </AccordionContent>
          </AccordionItem>

          {/* Chart Purpose Section */}
          <AccordionItem value="purpose" className="border border-border rounded-lg px-3">
            <AccordionTrigger className="hover:no-underline py-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs">🎯 Chart Purpose & Type</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label className="text-xs">Purpose</Label>
                <Select 
                  value={chartState.purpose.purpose} 
                  onValueChange={(value) => updateChartState("purpose", { purpose: value, chartType: "" })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="What do you want to show?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🤖</span>
                        <span className="text-sm">Auto</span>
                      </div>
                    </SelectItem>
                    {Object.keys(CHART_PURPOSE_MAP).map((purpose) => {
                      const emojiMap: { [key: string]: string } = {
                        "Comparison": "⚖️",
                        "Trend / Time": "📈",
                        "Distribution": "📊",
                        "Composition": "🥧",
                        "Relationship": "🔗",
                        "Process / Flow": "🔄",
                        "Ranking / Highlight": "🏆"
                      }
                      return (
                        <SelectItem key={purpose} value={purpose}>
                          {emojiMap[purpose]} {purpose}
                        </SelectItem>
                      )
                    })}
                    <SelectItem value="custom">✏️ Custom</SelectItem>
                  </SelectContent>
                </Select>
                {chartState.purpose.purpose === 'custom' && (
                  <Input
                    value={customPurpose}
                    onChange={(e) => setCustomPurpose(e.target.value)}
                    placeholder="Enter custom purpose..."
                    className="h-8 text-xs mt-2"
                  />
                )}
              </div>

              {chartState.purpose.purpose && (
                <div className="space-y-2">
                  <Label className="text-xs">Chart Type</Label>
                  <RadioGroup 
                    value={chartState.purpose.chartType} 
                    onValueChange={(value) => updateChartState("purpose", { chartType: value })}
                    className="grid grid-cols-2 gap-3"
                  >
                    {getAvailableChartTypes().map((type) => (
                      <div key={type} className="flex items-center space-x-1">
                        <RadioGroupItem value={type} id={type} className="h-3 w-3" />
                        <Label htmlFor={type} className="text-xs">{type}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Orientation</Label>
                  <Select 
                    value={chartState.purpose.orientation} 
                    onValueChange={(value) => updateChartState("purpose", { orientation: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🚫</span>
                          <span className="text-sm">None</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="vertical">📊 Vertical</SelectItem>
                      <SelectItem value="horizontal">📈 Horizontal</SelectItem>
                      <SelectItem value="radial">⭕ Radial</SelectItem>
                      <SelectItem value="custom">✏️ Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {chartState.purpose.orientation === 'custom' && (
                    <Input
                      value={customOrientation}
                      onChange={(e) => setCustomOrientation(e.target.value)}
                      placeholder="Enter custom orientation..."
                      className="h-8 text-xs mt-2"
                    />
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <Switch
                    id="multi-series"
                    checked={chartState.purpose.multiSeries}
                    onCheckedChange={(checked) => updateChartState("purpose", { multiSeries: checked })}
                    className="h-4 w-7"
                  />
                  <Label htmlFor="multi-series" className="text-xs">Multi-Series</Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Visual Style Section */}
          <AccordionItem value="style" className="border border-border rounded-lg px-3">
            <AccordionTrigger className="hover:no-underline py-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs">🎨 Visual Style</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label className="text-xs">Art Direction</Label>
                <Select 
                  value={chartState.style.artDirection} 
                  onValueChange={(value) => updateChartState("style", { artDirection: value, visualInfluence: "" })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Choose your creative direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🚫</span>
                        <span className="text-sm">None</span>
                      </div>
                    </SelectItem>
                    {Object.keys(STYLE_MAP).map((direction) => {
                      const emojiMap: { [key: string]: string } = {
                        "Magazine Editorial": "📰",
                        "Social Media Ready": "📱",
                        "Presentation Pro": "📊",
                        "Infographic Pop": "🎨",
                        "Minimalist Modern": "✨",
                        "Retro Vintage": "🕺",
                        "Neon Cyberpunk": "🌃",
                        "Hand-Drawn Sketch": "✏️",
                        "3D Data Art": "🎲",
                        "Watercolor Artistic": "🎨",
                        "Geometric Modern": "📐",
                        "Tech & Digital": "💻",
                        "Organic & Natural": "🌿"
                      }
                      return (
                        <SelectItem key={direction} value={direction}>
                          {emojiMap[direction]} {direction}
                        </SelectItem>
                      )
                    })}
                    <SelectItem value="custom">✏️ Custom</SelectItem>
                  </SelectContent>
                </Select>
                {chartState.style.artDirection === 'custom' && (
                  <Input
                    value={customArtDirection}
                    onChange={(e) => setCustomArtDirection(e.target.value)}
                    placeholder="Enter custom art direction..."
                    className="h-8 text-xs mt-2"
                  />
                )}
              </div>

              {chartState.style.artDirection && (
                <div className="space-y-2">
                  <Label className="text-xs">Visual Influence</Label>
                  <Select 
                    value={chartState.style.visualInfluence} 
                    onValueChange={(value) => updateChartState("style", { visualInfluence: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select visual style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div>
                          <div className="font-medium text-xs">🚫 None</div>
                          <div className="text-xs text-muted-foreground">No visual influence</div>
                        </div>
                      </SelectItem>
                      {getAvailableVisualInfluences().map((influence) => (
                        <SelectItem key={influence.label} value={influence.label}>
                          <div>
                            <div className="font-medium text-xs">{influence.label}</div>
                            <div className="text-xs text-muted-foreground">{influence.desc}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {is3DStyle() && (
                <div className="space-y-2">
                  <Label className="text-xs">Chart Depth / Lighting</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[chartState.style.chartDepth]}
                      onValueChange={([value]) => updateChartState("style", { chartDepth: value })}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Flat</span>
                      <span>Deep 3D</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Background Texture</Label>
                  <Select 
                    value={chartState.style.backgroundTexture} 
                    onValueChange={(value) => updateChartState("style", { backgroundTexture: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      {chartState.style.backgroundTexture ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{getTextureDisplay(chartState.style.backgroundTexture).icon}</span>
                          <span className="text-sm">{getTextureDisplay(chartState.style.backgroundTexture).title}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Select texture</span>
                      )}
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🚫</span>
                          <span className="text-sm">None</span>
                        </div>
                      </SelectItem>
                      
                      {/* Natural Textures */}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t">Natural</div>
                      {Object.entries(TEXTURE_OPTIONS).filter(([_, option]) => option.category === "natural").map(([name, option]) => (
                        <SelectItem key={name} value={name.toLowerCase()}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">🌿</span>
                            <div>
                              <div className="text-sm font-medium">{name}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                      
                      {/* Technical Textures */}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t">Technical</div>
                      {Object.entries(TEXTURE_OPTIONS).filter(([_, option]) => option.category === "technical").map(([name, option]) => (
                        <SelectItem key={name} value={name.toLowerCase()}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">⚙️</span>
                            <div>
                              <div className="text-sm font-medium">{name}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                      
                      {/* Abstract Textures */}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t">Abstract</div>
                      {Object.entries(TEXTURE_OPTIONS).filter(([_, option]) => option.category === "abstract").map(([name, option]) => (
                        <SelectItem key={name} value={name.toLowerCase()}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">🎨</span>
                            <div>
                              <div className="text-sm font-medium">{name}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                      
                      {/* Custom Option */}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t">Custom</div>
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">✏️</span>
                          <div>
                            <div className="text-sm font-medium">Custom</div>
                            <div className="text-xs text-muted-foreground">Enter your own texture description</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {chartState.style.backgroundTexture === 'custom' && (
                    <Input
                      value={customBackgroundTexture}
                      onChange={(e) => setCustomBackgroundTexture(e.target.value)}
                      placeholder="Enter custom background texture..."
                      className="h-8 text-xs mt-2"
                    />
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <Switch
                    id="accent-shapes"
                    checked={chartState.style.accentShapes}
                    onCheckedChange={(checked) => updateChartState("style", { accentShapes: checked })}
                    className="h-4 w-7"
                  />
                  <Label htmlFor="accent-shapes" className="text-xs">Accent Shapes</Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Mood & Emotion Section */}
          <AccordionItem value="mood" className="border border-border rounded-lg px-3">
            <AccordionTrigger className="hover:no-underline py-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs">💭 Mood & Emotion</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label className="text-xs">🎭 Mood Context</Label>
                <Select 
                  value={chartState.mood.moodContext} 
                  onValueChange={(value) => updateChartState("mood", { moodContext: value })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select mood context" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🚫</span>
                        <span className="text-sm">None</span>
                      </div>
                    </SelectItem>
                    {MOOD_CONTEXTS.map((mood) => (
                      <SelectItem key={mood.name} value={mood.name}>
                        {mood.emoji} {mood.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">✏️ Custom</SelectItem>
                  </SelectContent>
                </Select>
                {chartState.mood.moodContext === 'custom' && (
                  <Input
                    value={customMoodContext}
                    onChange={(e) => setCustomMoodContext(e.target.value)}
                    placeholder="Enter custom mood context..."
                    className="h-8 text-xs mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Tone Intensity</Label>
                <div className="space-y-2">
                  <Slider
                    value={[chartState.mood.toneIntensity]}
                    onValueChange={([value]) => updateChartState("mood", { toneIntensity: value })}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Subtle</span>
                    <span>Bold</span>
                  </div>
                </div>
              </div>

              {!chartState.style.artDirection.includes("Flat") && (
                <div className="space-y-2">
                  <Label className="text-xs">Lighting Temperature</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[chartState.mood.lightingTemperature]}
                      onValueChange={([value]) => updateChartState("mood", { lightingTemperature: value })}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Cool</span>
                      <span>Warm</span>
                    </div>
                  </div>
                </div>
              )}

            </AccordionContent>
          </AccordionItem>

          {/* Branding & Typography Section */}
          <AccordionItem value="branding" className="border border-border rounded-lg px-3">
            <AccordionTrigger className="hover:no-underline py-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs">🏢 Branding & Typography</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="flex items-center space-x-1">
                <Switch
                  id="brand-sync"
                  checked={chartState.branding.brandSync}
                  onCheckedChange={(checked) => updateChartState("branding", { brandSync: checked })}
                  className="h-4 w-7"
                />
                <Label htmlFor="brand-sync" className="text-xs">Brand Sync</Label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">🌈 Color Palette</Label>
                <Select 
                  value={chartState.branding.colorPalette} 
                  onValueChange={(value) => updateChartState("branding", { colorPalette: value })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Choose color palette" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🚫</span>
                        <span className="text-sm">Auto</span>
                      </div>
                    </SelectItem>
                    {Object.entries(COLOR_PALETTES).map(([name, palette]) => (
                      <SelectItem key={name} value={name}>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {palette.colors.slice(0, 4).map((color, idx) => (
                              <div 
                                key={idx} 
                                className="w-3 h-3 rounded-full border border-gray-300" 
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <span className="text-sm">{name}</span>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">✏️ Custom</SelectItem>
                  </SelectContent>
                </Select>
                {chartState.branding.colorPalette === 'custom' && (
                  <Input
                    value={customColorPalette}
                    onChange={(e) => setCustomColorPalette(e.target.value)}
                    placeholder="Enter custom color palette..."
                    className="h-8 text-xs mt-2"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Palette Mode</Label>
                  <Select 
                    value={chartState.branding.paletteMode} 
                    onValueChange={(value) => updateChartState("branding", { paletteMode: value as any })}
                    disabled={isBrandSynced()}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🤖</span>
                          <span className="text-sm">Auto</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="categorical">🎨 Categorical</SelectItem>
                      <SelectItem value="sequential">📊 Sequential</SelectItem>
                      <SelectItem value="diverging">🔄 Diverging</SelectItem>
                      <SelectItem value="custom">✏️ Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {chartState.branding.paletteMode === 'custom' && (
                    <Input
                      value={customPaletteMode}
                      onChange={(e) => setCustomPaletteMode(e.target.value)}
                      placeholder="Enter custom palette mode..."
                      className="h-8 text-xs mt-2"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Background</Label>
                  <Select 
                    value={chartState.branding.background} 
                    onValueChange={(value) => updateChartState("branding", { background: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🚫</span>
                          <span className="text-sm">None</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="light">☀️ Light</SelectItem>
                      <SelectItem value="dark">🌙 Dark</SelectItem>
                      <SelectItem value="transparent">👻 Transparent</SelectItem>
                      <SelectItem value="gradient">🌈 Gradient</SelectItem>
                      
                      {/* Solid Colors */}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t">Solid Colors</div>
                      {Object.entries(BACKGROUND_OPTIONS).filter(([_, option]) => option.type === "solid").map(([name, option]) => (
                        <SelectItem key={name} value={name.toLowerCase()}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded border border-gray-300" 
                              style={{ backgroundColor: option.value }}
                            />
                            <span className="text-sm">{name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      
                      {/* Gradients */}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t">Gradients</div>
                      {Object.entries(BACKGROUND_OPTIONS).filter(([_, option]) => option.type === "gradient").map(([name, option]) => (
                        <SelectItem key={name} value={name.toLowerCase()}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border border-gray-300 bg-gradient-to-br from-orange-400 to-pink-500" />
                            <span className="text-sm">{name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      
                      {/* Patterns */}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t">Patterns</div>
                      {Object.entries(BACKGROUND_OPTIONS).filter(([_, option]) => option.type === "pattern").map(([name, option]) => (
                        <SelectItem key={name} value={name.toLowerCase()}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border border-gray-300 bg-gray-100" />
                            <span className="text-sm">{name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      
                      {/* Themed */}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t">Themed</div>
                      {Object.entries(BACKGROUND_OPTIONS).filter(([_, option]) => option.type === "themed").map(([name, option]) => (
                        <SelectItem key={name} value={name.toLowerCase()}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border border-gray-300 bg-gradient-to-br from-blue-100 to-blue-200" />
                            <span className="text-sm">{name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      
                      {/* Custom Option */}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t">Custom</div>
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">✏️</span>
                          <span className="text-sm">Custom</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {chartState.branding.background === 'custom' && (
                    <Input
                      value={customBackground}
                      onChange={(e) => setCustomBackground(e.target.value)}
                      placeholder="Enter custom background..."
                      className="h-8 text-xs mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Font Family</Label>
                <Select 
                  value={chartState.branding.fontFamily} 
                  onValueChange={(value) => updateChartState("branding", { fontFamily: value })}
                  disabled={isBrandSynced()}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🚫</span>
                        <span className="text-sm">None</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Inter">🔤 Inter</SelectItem>
                    <SelectItem value="Roboto">🤖 Roboto</SelectItem>
                    <SelectItem value="Helvetica">📝 Helvetica</SelectItem>
                    <SelectItem value="Georgia">📰 Georgia</SelectItem>
                    <SelectItem value="Monaco">💻 Monaco</SelectItem>
                    <SelectItem value="custom">✏️ Custom</SelectItem>
                  </SelectContent>
                </Select>
                {chartState.branding.fontFamily === 'custom' && (
                  <Input
                    value={customFontFamily}
                    onChange={(e) => setCustomFontFamily(e.target.value)}
                    placeholder="Enter custom font family..."
                    className="h-8 text-xs mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">🏷️ Logo Placement</Label>
                
                {/* Logo Placement Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Logo Positions (select multiple)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LOGO_PLACEMENT_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`logo-${option.value}`}
                          checked={chartState.branding.logoPlacement.includes(option.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateChartState("branding", { 
                                logoPlacement: [...chartState.branding.logoPlacement, option.value] 
                              })
                            } else {
                              updateChartState("branding", { 
                                logoPlacement: chartState.branding.logoPlacement.filter(p => p !== option.value) 
                              })
                            }
                          }}
                        />
                        <label htmlFor={`logo-${option.value}`} className="text-xs cursor-pointer">
                          <span className="mr-1">{option.icon}</span>
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {chartState.branding.logoPlacement.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs">📁 Upload Logo</Label>
                    
                    {!chartState.branding.logoUpload ? (
                      <div className="relative border-2 border-dashed border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              PNG, JPG, SVG up to 2MB
                            </p>
                          </div>
                        </div>
                        <Input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div className="border border-border rounded-lg p-2 bg-muted/30">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">
                                {chartState.branding.logoUpload.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {(chartState.branding.logoUpload.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleLogoRemove}
                              className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Logo Description Field */}
                    <div className="space-y-1">
                      <Label className="text-xs">Logo Description (optional)</Label>
                      <Textarea
                        placeholder="Describe your logo style (e.g., modern tech company logo with blue accent, vintage circular badge, minimalist geometric symbol)"
                        value={chartState.branding.logoDescription}
                        onChange={(e) => updateChartState("branding", { logoDescription: e.target.value })}
                        className="min-h-[50px] text-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        You can upload a logo image and/or describe it. The AI will use both to create the logo appearance.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Annotations & Labels Section */}
          <AccordionItem value="annotations" className="border border-border rounded-lg px-3">
            <AccordionTrigger className="hover:no-underline py-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs">🏷️ Annotations & Labels</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-1">
                  <Switch
                    id="data-labels"
                    checked={chartState.annotations.dataLabels}
                    onCheckedChange={(checked) => updateChartState("annotations", { dataLabels: checked })}
                    className="h-4 w-7"
                  />
                  <Label htmlFor="data-labels" className="text-xs">Data Labels</Label>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Switch
                    id="callouts"
                    checked={chartState.annotations.callouts}
                    onCheckedChange={(checked) => updateChartState("annotations", { callouts: checked })}
                    className="h-4 w-7"
                  />
                  <Label htmlFor="callouts" className="text-xs">Callouts</Label>
                </div>
              </div>

              {!isPieChart() && (
                <div className="space-y-2">
                  <Label className="text-xs">Label Placement</Label>
                  <Select 
                    value={chartState.annotations.labelPlacement} 
                    onValueChange={(value) => updateChartState("annotations", { labelPlacement: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🚫</span>
                          <span className="text-sm">None</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="auto">🤖 Auto</SelectItem>
                      <SelectItem value="top">⬆️ Top</SelectItem>
                      <SelectItem value="bottom">⬇️ Bottom</SelectItem>
                      <SelectItem value="left">⬅️ Left</SelectItem>
                      <SelectItem value="right">➡️ Right</SelectItem>
                      <SelectItem value="custom">✏️ Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {chartState.annotations.labelPlacement === 'custom' && (
                    <Input
                      value={customLabelPlacement}
                      onChange={(e) => setCustomLabelPlacement(e.target.value)}
                      placeholder="Enter custom label placement..."
                      className="h-8 text-xs mt-2"
                    />
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Legends</Label>
                  <Select 
                    value={chartState.annotations.legends} 
                    onValueChange={(value) => updateChartState("annotations", { legends: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🚫</span>
                          <span className="text-sm">None</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="auto">🤖 Auto</SelectItem>
                      <SelectItem value="inline">📝 Inline</SelectItem>
                      <SelectItem value="side">↔️ Side</SelectItem>
                      <SelectItem value="bottom">⬇️ Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Gridlines</Label>
                  <Select 
                    value={chartState.annotations.gridlines} 
                    onValueChange={(value) => updateChartState("annotations", { gridlines: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🚫</span>
                          <span className="text-sm">None</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="light">💡 Light</SelectItem>
                      <SelectItem value="strong">💪 Strong</SelectItem>
                      <SelectItem value="custom">✏️ Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {chartState.annotations.gridlines === 'custom' && (
                    <Input
                      value={customGridlines}
                      onChange={(e) => setCustomGridlines(e.target.value)}
                      placeholder="Enter custom gridlines..."
                      className="h-8 text-xs mt-2"
                    />
                  )}
                </div>
              </div>

              {chartState.annotations.callouts && (
                <div className="space-y-2">
                  <Label className="text-xs">Callout Threshold (top N values)</Label>
                  <Slider
                    value={[chartState.annotations.calloutThreshold]}
                    onValueChange={([value]) => updateChartState("annotations", { calloutThreshold: value })}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Layout & Composition Section */}
          <AccordionItem value="layout" className="border border-border rounded-lg px-3">
            <AccordionTrigger className="hover:no-underline py-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs">📐 Layout & Composition</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label className="text-xs">Layout Template</Label>
                <Select 
                  value={chartState.layout.layoutTemplate} 
                  onValueChange={(value) => updateChartState("layout", { layoutTemplate: value })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🚫</span>
                        <span className="text-sm">None</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="auto">🤖 Auto</SelectItem>
                    <SelectItem value="hero">🦸 Hero</SelectItem>
                    <SelectItem value="dashboard">📊 Dashboard</SelectItem>
                    <SelectItem value="story">📖 Story</SelectItem>
                    <SelectItem value="metric-cards">📈 Metric Cards</SelectItem>
                    <SelectItem value="timeline">⏰ Timeline</SelectItem>
                    <SelectItem value="custom">✏️ Custom</SelectItem>
                  </SelectContent>
                </Select>
                {chartState.layout.layoutTemplate === 'custom' && (
                  <Input
                    value={customLayoutTemplate}
                    onChange={(e) => setCustomLayoutTemplate(e.target.value)}
                    placeholder="Enter custom layout template..."
                    className="h-8 text-xs mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">📱 Export Preset</Label>
                <Select 
                  value={chartState.layout.exportPreset} 
                  onValueChange={handleExportPresetChange}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Choose export format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🚫</span>
                        <span className="text-sm">Custom</span>
                      </div>
                    </SelectItem>
                    {Object.entries(EXPORT_PRESETS).map(([name, preset]) => (
                      <SelectItem key={name} value={name}>
                        <div>
                          <div className="font-medium text-xs">{name}</div>
                          <div className="text-xs text-muted-foreground">
                            {preset.width}×{preset.height} • {preset.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom-input">✏️ Custom Input</SelectItem>
                  </SelectContent>
                </Select>
                {chartState.layout.exportPreset === 'custom-input' && (
                  <Input
                    value={customExportPreset}
                    onChange={(e) => setCustomExportPreset(e.target.value)}
                    placeholder="Enter custom export preset..."
                    className="h-8 text-xs mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Aspect Ratio</Label>
                <Select 
                  value={chartState.layout.aspectRatio} 
                  onValueChange={(value) => updateChartState("layout", { aspectRatio: value })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
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

              <div className="space-y-2">
                <Label className="text-xs">Margin Density</Label>
                <div className="space-y-2">
                  <Slider
                    value={[chartState.layout.marginDensity]}
                    onValueChange={([value]) => updateChartState("layout", { marginDensity: value })}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Tight</span>
                    <span>Spacious</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <Switch
                  id="safe-zone"
                  checked={chartState.layout.safeZoneOverlay}
                  onCheckedChange={(checked) => updateChartState("layout", { safeZoneOverlay: checked })}
                  className="h-4 w-7"
                />
                <Label htmlFor="safe-zone" className="text-xs">Safe Zone Overlay</Label>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Narrative & Export Section */}
          <AccordionItem value="narrative" className="border border-border rounded-lg px-3">
            <AccordionTrigger className="hover:no-underline py-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs">📝 Narrative & Export</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label className="text-xs">Headline</Label>
                <Input
                  placeholder="e.g., '2024 Smartphone Market Share'"
                  value={chartState.narrative.headline}
                  onChange={(e) => updateChartState("narrative", { headline: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Caption</Label>
                <Textarea
                  placeholder="e.g., 'Apple leads global growth, Xiaomi surges in APAC.'"
                  value={chartState.narrative.caption}
                  onChange={(e) => updateChartState("narrative", { caption: e.target.value })}
                  className="min-h-[60px] text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Tone</Label>
                  <Select 
                    value={chartState.narrative.tone} 
                    onValueChange={(value) => updateChartState("narrative", { tone: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🚫</span>
                          <span className="text-sm">None</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="formal">🎩 Formal</SelectItem>
                      <SelectItem value="friendly">😊 Friendly</SelectItem>
                      <SelectItem value="fun">🎉 Fun</SelectItem>
                      <SelectItem value="analytical">📊 Analytical</SelectItem>
                      <SelectItem value="urgent">⚡ Urgent</SelectItem>
                      <SelectItem value="custom">✏️ Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {chartState.narrative.tone === 'custom' && (
                    <Input
                      value={customTone}
                      onChange={(e) => setCustomTone(e.target.value)}
                      placeholder="Enter custom tone..."
                      className="h-8 text-xs mt-2"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Platform</Label>
                  <Select 
                    value={chartState.narrative.platform} 
                    onValueChange={(value) => updateChartState("narrative", { platform: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🚫</span>
                          <span className="text-sm">None</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="instagram">📸 Instagram</SelectItem>
                      <SelectItem value="story">📱 Story</SelectItem>
                      <SelectItem value="linkedin">💼 LinkedIn</SelectItem>
                      <SelectItem value="web">🌐 Web</SelectItem>
                      <SelectItem value="pdf">📄 PDF</SelectItem>
                      <SelectItem value="custom">✏️ Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {chartState.narrative.platform === 'custom' && (
                    <Input
                      value={customPlatform}
                      onChange={(e) => setCustomPlatform(e.target.value)}
                      placeholder="Enter custom platform..."
                      className="h-8 text-xs mt-2"
                    />
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="text-xs text-muted-foreground">
          {chartState.data.source === "file" && chartState.data.dataFile && `${chartState.data.dataFile.name.split('.').pop()?.toUpperCase()} uploaded • `}
          {chartState.purpose.purpose && `${chartState.purpose.purpose} • `}
          {chartState.style.artDirection && `${chartState.style.artDirection} • `}
          {chartState.mood.moodContext && `${chartState.mood.moodContext}`}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose} className="h-8 text-xs">
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !chartState.data.textData.trim()}
            className="flex items-center gap-1 h-8 text-xs bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500 text-white shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                {generationPhase === 'analyzing' ? 'Generating chart code...' : 
                 generationPhase === 'enhancing' ? 'Enhancing design...' : 
                 'Generating...'}
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                Generate Chart
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
    </>
  )
}


