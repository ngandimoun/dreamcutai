"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  X, 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  User, 
  Palette,
  Type,
  Layout,
  Camera,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Check,
  Loader2,
  Eye,
  Download,
  RefreshCw
} from "lucide-react"
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "sonner"
import { GenerationLoading } from "@/components/ui/generation-loading"
import { GenerationError } from "@/components/ui/generation-error"
import { cn } from "@/lib/utils"
import { STYLE_MAP } from "@/lib/styles/style-map"
import { filterFilledFields } from "@/lib/utils/prompt-builder"
import { getSupportedAspectRatios } from '@/lib/utils/aspect-ratio-utils'
import type { FalModel } from '@/lib/utils/fal-generation'
import { convertToSignedUrls } from "@/lib/storage/signed-urls"
import { 
  ProductMockupGenerationRequest, 
  AvailableAvatar,
  ProductMockupGenerationResult 
} from "@/lib/types/product-mockup"

// Logo Placement options (multi-select)
const LOGO_PLACEMENT_OPTIONS = [
  { value: "Top-Right", label: "Top-Right Corner", icon: "↗️", desc: "Logo overlay in top-right" },
  { value: "Bottom-Left", label: "Bottom-Left Corner", icon: "↙️", desc: "Logo overlay in bottom-left" },
  { value: "Bottom-Right", label: "Bottom-Right Corner", icon: "↘️", desc: "Logo overlay in bottom-right" },
  { value: "Top-Left", label: "Top-Left Corner", icon: "↖️", desc: "Logo overlay in top-left" },
  { value: "On-Product", label: "On Product", icon: "📦", desc: "Logo on product surface" },
  { value: "On-Packaging", label: "On Packaging", icon: "📋", desc: "Logo on packaging/label" },
  { value: "On-Accessory", label: "On Accessory", icon: "👜", desc: "Logo on accessory item" },
  { value: "Background-Wall", label: "Background", icon: "🖼️", desc: "Logo on background wall" },
  { value: "Center-Badge", label: "Center Badge", icon: "🏷️", desc: "Logo as centered badge" }
]

interface ProductMockupGeneratorInterfaceProps {
  onClose: () => void
  projectTitle: string
  selectedArtifact?: {
    id: string
    title: string
    image: string
    description: string
  }
}

// Aspect ratio visual components
const AspectRatioIcon = ({ ratio }: { ratio: string }) => {
  const getIconStyle = () => {
    switch (ratio) {
      case "1:1": return "w-3 h-3 border border-muted-foreground/50"
      case "4:5": return "w-3 h-4 border border-muted-foreground/50"
      case "16:9": return "w-4 h-2.5 border border-muted-foreground/50"
      case "9:16": return "w-2.5 h-4 border border-muted-foreground/50"
      case "2:1": return "w-4 h-2 border border-muted-foreground/50"
      case "3:4": return "w-3.5 h-4 border border-muted-foreground/50"
      case "2:3": return "w-3 h-4 border border-muted-foreground/50"
      case "4:3": return "w-4 h-3 border border-muted-foreground/50"
      case "3:2": return "w-4 h-3 border border-muted-foreground/50"
      default: return "w-3 h-3 border border-muted-foreground/50"
    }
  }
  return <div className={getIconStyle()} />
}

export function ProductMockupGeneratorInterface({ 
  onClose, 
  projectTitle, 
  selectedArtifact 
}: ProductMockupGeneratorInterfaceProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Basic Settings
  const [title, setTitle] = useState("")
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "4:5" | "16:9" | "9:16" | "2:1" | "3:4" | "2:3" | "4:3" | "3:2">("1:1")

  // Available aspect ratios for Nano-banana model
  const availableAspectRatios = ["1:1", "4:5", "16:9", "9:16", "2:1", "3:4", "2:3", "4:3", "3:2"]
  
  // Product Photos
  const [productPhotos, setProductPhotos] = useState<File[]>([])
  const [productPhotoPreviews, setProductPhotoPreviews] = useState<string[]>([])
  
  // Logo Upload
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUsagePrompt, setLogoUsagePrompt] = useState("")
  const [logoPlacementOption, setLogoPlacementOption] = useState<string[]>([])
  const [logoDescription, setLogoDescription] = useState<string>("")
  
  // Art Direction & Visual Influence
  const [artDirection, setArtDirection] = useState<string>("")
  const [visualInfluence, setVisualInfluence] = useState<string>("")
  const [lightingPreset, setLightingPreset] = useState<string>("")
  const [backgroundEnvironment, setBackgroundEnvironment] = useState<string>("")
  const [moodContext, setMoodContext] = useState<string>("")
  
  // Composition & Branding
  const [compositionTemplate, setCompositionTemplate] = useState<"Centered Hero" | "Rule of Thirds" | "Floating Object" | "Flat Lay" | "Collage" | "custom">("Centered Hero")
  const [objectCount, setObjectCount] = useState<1 | 2 | 3 | "custom">(1)
  const [shadowType, setShadowType] = useState<"Soft" | "Hard" | "Floating" | "Mirror" | "custom">("Soft")
  
  // Text & CTA Overlay
  const [headline, setHeadline] = useState("")
  const [headlineColor, setHeadlineColor] = useState("#000000")
  const [headlineColorAuto, setHeadlineColorAuto] = useState(true)
  const [subtext, setSubtext] = useState("")
  const [subtextColor, setSubtextColor] = useState("#666666")
  const [subtextColorAuto, setSubtextColorAuto] = useState(true)
  const [ctaText, setCtaText] = useState("")
  const [ctaColor, setCtaColor] = useState("#3B82F6") // Brand primary by default
  const [ctaColorAuto, setCtaColorAuto] = useState(true)
  const [fontFamily, setFontFamily] = useState<"serif" | "sans" | "condensed" | "rounded" | "monospace" | "script" | "display" | "handwriting" | "decorative" | "modern" | "classic" | "futuristic" | "elegant" | "bold" | "minimal" | "vintage" | "tech" | "artistic" | "playful" | "professional" | "luxury" | "casual" | "formal" | "creative" | "clean" | "stylized" | "geometric" | "organic" | "industrial" | "romantic" | "edgy" | "sophisticated" | "friendly" | "dramatic" | "subtle" | "expressive" | "refined" | "dynamic" | "serene" | "energetic" | "mysterious" | "vibrant" | "calm" | "powerful" | "gentle" | "striking" | "smooth" | "rough" | "precise" | "flowing" | "structured" | "freeform" | "technical" | "artistic" | "corporate" | "personal" | "trendy" | "timeless" | "innovative" | "traditional" | "contemporary" | "retro" | "cutting-edge" | "nostalgic" | "futuristic" | "classic" | "avant-garde" | "minimalist" | "maximalist" | "elegant" | "raw" | "polished" | "rustic" | "urban" | "natural" | "synthetic" | "warm" | "cool" | "neutral" | "bold" | "delicate" | "strong" | "soft" | "hard" | "fluid" | "rigid" | "curved" | "angular" | "rounded" | "sharp" | "blunt" | "pointed" | "smooth" | "textured" | "flat" | "dimensional" | "layered" | "simple" | "complex" | "abstract" | "literal" | "symbolic" | "direct" | "indirect" | "obvious" | "subtle" | "loud" | "quiet" | "bright" | "dark" | "light" | "heavy" | "thin" | "thick" | "wide" | "narrow" | "tall" | "short" | "expanded" | "condensed" | "extended" | "compressed" | "spacious" | "tight" | "loose" | "dense" | "sparse" | "full" | "empty" | "rich" | "poor" | "luxurious" | "basic" | "premium" | "standard" | "exclusive" | "common" | "rare" | "unique" | "ordinary" | "special" | "regular" | "irregular" | "consistent" | "inconsistent" | "stable" | "unstable" | "balanced" | "unbalanced" | "symmetrical" | "asymmetrical" | "proportional" | "disproportional" | "harmonious" | "discordant" | "melodic" | "rhythmic" | "static" | "dynamic" | "still" | "moving" | "frozen" | "flowing" | "solid" | "liquid" | "gaseous" | "crystalline" | "amorphous" | "structured" | "unstructured" | "organized" | "chaotic" | "orderly" | "random" | "planned" | "spontaneous" | "calculated" | "intuitive" | "logical" | "emotional" | "rational" | "irrational" | "scientific" | "artistic" | "mathematical" | "poetic" | "prosaic" | "lyrical" | "prosaic" | "musical" | "visual" | "tactile" | "auditory" | "olfactory" | "gustatory" | "kinesthetic" | "spatial" | "temporal" | "conceptual" | "perceptual" | "cognitive" | "affective" | "behavioral" | "physiological" | "psychological" | "social" | "cultural" | "historical" | "contemporary" | "traditional" | "modern" | "postmodern" | "premodern" | "antique" | "vintage" | "retro" | "neo" | "proto" | "meta" | "para" | "anti" | "pro" | "pre" | "post" | "inter" | "intra" | "trans" | "cis" | "ultra" | "infra" | "super" | "sub" | "hyper" | "hypo" | "macro" | "micro" | "mega" | "mini" | "maxi" | "mega" | "giga" | "tera" | "peta" | "exa" | "zetta" | "yotta" | "deca" | "hecto" | "kilo" | "milli" | "micro" | "nano" | "pico" | "femto" | "atto" | "zepto" | "yocto" | "custom">("sans")
  const [fontWeight, setFontWeight] = useState<"light" | "normal" | "medium" | "bold" | "custom">("normal")
  const [textCase, setTextCase] = useState<"uppercase" | "title" | "sentence" | "custom">("sentence")
  const [letterSpacing, setLetterSpacing] = useState(0)
  const [lineHeight, setLineHeight] = useState(1.2)
  const [textAlignment, setTextAlignment] = useState<"left" | "center" | "right">("center")
  const [textEffects, setTextEffects] = useState<string[]>([])
  
  // Advanced Typography
  const [highlightStyle, setHighlightStyle] = useState<"underline" | "boxed" | "glow" | "gradient" | "none" | "custom">("none")
  const [accentElement, setAccentElement] = useState<"line" | "shape" | "dot" | "none" | "custom">("none")
  const [brilliance, setBrilliance] = useState(0)
  const [frostedGlass, setFrostedGlass] = useState(false)
  const [dropShadowIntensity, setDropShadowIntensity] = useState(0)
  const [motionAccent, setMotionAccent] = useState<"fade" | "slide" | "sweep" | "none" | "custom">("none")
  
  // Alignment & Positioning
  const [layoutMode, setLayoutMode] = useState<"centered" | "left" | "right" | "split" | "custom">("centered")
  const [verticalPosition, setVerticalPosition] = useState(50)
  const [horizontalOffset, setHorizontalOffset] = useState(0)
  const [smartAnchor, setSmartAnchor] = useState(true)
  const [safeZones, setSafeZones] = useState(true)
  
  // Casting & Multiplicity
  const [useAvatars, setUseAvatars] = useState(false)
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("")
  const [avatarRole, setAvatarRole] = useState<"Model" | "User" | "Mascot" | "Spokesperson">("Model")
  const [avatarInteraction, setAvatarInteraction] = useState<"Holding" | "Wearing" | "Using" | "Observing">("Holding")
  const [productMultiplicity, setProductMultiplicity] = useState<"Single" | "Lineup" | "Bundle" | "custom">("Single")
  const [angleVarietyCount, setAngleVarietyCount] = useState<1 | 2 | 3 | 4 | 5>(1)
  
  // Platform Target
  const [platformTarget, setPlatformTarget] = useState<"Instagram" | "Facebook" | "TikTok" | "YouTube" | "Banner" | "Print" | undefined>(undefined)
  
  // Custom field states
  const [customArtDirection, setCustomArtDirection] = useState("")
  const [customComposition, setCustomComposition] = useState("")
  const [customObjectCount, setCustomObjectCount] = useState("")
  const [customShadow, setCustomShadow] = useState("")
  const [customFont, setCustomFont] = useState("")
  const [customWeight, setCustomWeight] = useState("")
  const [customTextEffects, setCustomTextEffects] = useState("")
  const [customTextCase, setCustomTextCase] = useState("")
  const [customHighlightStyle, setCustomHighlightStyle] = useState("")
  const [customAccentElement, setCustomAccentElement] = useState("")
  const [customMotionAccent, setCustomMotionAccent] = useState("")
  const [customLayoutMode, setCustomLayoutMode] = useState("")
  const [customProductCount, setCustomProductCount] = useState("")
  const [customPlatform, setCustomPlatform] = useState("")
  
  // Brand Colors
  const [brandColors, setBrandColors] = useState({
    primary: "#3B82F6",
    secondary: "#10B981",
    accent: "#F59E0B"
  })
  
  // Available Avatars (from existing AvatarPersonaGeneratorInterface)
  const [availableAvatars, setAvailableAvatars] = useState<AvailableAvatar[]>([])
  const [loadingAvatars, setLoadingAvatars] = useState(false)
  
  // Basic Avatar Options
  const [useBasicAvatar, setUseBasicAvatar] = useState(true)
  const [basicAvatarAge, setBasicAvatarAge] = useState<"18-25" | "26-35" | "36-45" | "46-55" | "55+">("26-35")
  const [basicAvatarRace, setBasicAvatarRace] = useState<"Caucasian" | "African" | "Asian" | "Hispanic" | "Middle Eastern" | "Mixed" | "Other">("Caucasian")
  const [basicAvatarGender, setBasicAvatarGender] = useState<"Male" | "Female" | "Non-binary">("Female")
  const [basicAvatarDescription, setBasicAvatarDescription] = useState("")
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [signedImageUrls, setSignedImageUrls] = useState<string[]>([])
  const [urlsLoading, setUrlsLoading] = useState(false)
  const [generationResult, setGenerationResult] = useState<ProductMockupGenerationResult | null>(null)
  
  // UI State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    productPhotos: true,
    artDirection: true,
    composition: false,
    textOverlay: false,
    casting: false,
    platform: false
  })

  // Helper function for avatar image URL
  const getAvatarImageUrl = (avatar: AvailableAvatar): string | null => {
    return avatar.generated_images?.[0] || 
           avatar.image || 
           null
  }

  // Convert storage paths to signed URLs when generatedImages change
  useEffect(() => {
    if (generatedImages.length > 0) {
      setUrlsLoading(true)
      convertToSignedUrls(generatedImages)
        .then(urls => {
          setSignedImageUrls(urls)
          setUrlsLoading(false)
        })
        .catch(error => {
          console.error('Error generating signed URLs:', error)
          setSignedImageUrls(generatedImages) // Fallback to original URLs
          setUrlsLoading(false)
        })
    }
  }, [generatedImages])

  // Load available avatars on mount
  useEffect(() => {
    loadAvailableAvatars()
  }, [])

  // Update visual influence options when art direction changes
  useEffect(() => {
    if (artDirection && STYLE_MAP[artDirection]) {
      const influences = STYLE_MAP[artDirection]
      if (influences.length > 0) {
        // Check if current visual influence is still valid
        const currentInfluenceValid = influences.some(influence => influence.label === visualInfluence)
        if (visualInfluence && !currentInfluenceValid) {
          // Reset to empty string when current selection is invalid
          setVisualInfluence("")
          setLightingPreset("")
          setBackgroundEnvironment("")
          setMoodContext("")
        }
      }
    } else {
      // Reset all fields when no art direction is selected
      setVisualInfluence("")
      setLightingPreset("")
      setBackgroundEnvironment("")
      setMoodContext("")
    }
  }, [artDirection, visualInfluence])

  // Update lighting/background options when visual influence changes
  useEffect(() => {
    if (artDirection && visualInfluence && STYLE_MAP[artDirection]) {
      const influence = STYLE_MAP[artDirection].find(inf => inf.label === visualInfluence)
      if (influence) {
        // Check if current lighting preset is still valid
        if (lightingPreset && influence.lightingPresets.length > 0 && !influence.lightingPresets.find(lp => lp.name === lightingPreset)) {
          setLightingPreset("")
        }
        // Check if current background environment is still valid
        if (backgroundEnvironment && influence.backgroundEnvironments.length > 0 && !influence.backgroundEnvironments.find(be => be.name === backgroundEnvironment)) {
          setBackgroundEnvironment("")
        }
        // Check if current mood context is still valid
        if (moodContext && influence.moodContexts.length > 0 && !influence.moodContexts.find(mc => mc.name === moodContext)) {
          setMoodContext("")
        }
      }
    } else {
      // Reset all fields when no visual influence is selected
      setLightingPreset("")
      setBackgroundEnvironment("")
      setMoodContext("")
    }
  }, [visualInfluence, artDirection, lightingPreset, backgroundEnvironment, moodContext])

  const loadAvailableAvatars = async () => {
    setLoadingAvatars(true)
    try {
      // Fetch avatars from the avatar-persona-generation API
      const response = await fetch('/api/avatar-persona-generation')
      if (response.ok) {
        const data = await response.json()
        setAvailableAvatars(data.avatars || [])
      }
    } catch (error) {
      console.error('Failed to load avatars:', error)
    } finally {
      setLoadingAvatars(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Limit to 2 images max
    const newFiles = [...productPhotos, ...files].slice(0, 2)
    setProductPhotos(newFiles)

    // Create previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file))
    setProductPhotoPreviews(newPreviews)
  }

  const removeProductPhoto = (index: number) => {
    const newFiles = productPhotos.filter((_, i) => i !== index)
    const newPreviews = productPhotoPreviews.filter((_, i) => i !== index)
    setProductPhotos(newFiles)
    setProductPhotoPreviews(newPreviews)
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const preview = URL.createObjectURL(file)
      setLogoPreview(preview)
    }
  }

  const removeLogo = () => {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview)
    }
    setLogoFile(null)
    setLogoPreview(null)
    setLogoUsagePrompt("")
    setLogoPlacementOption([])
  }

  const toggleTextEffect = (effect: string) => {
    setTextEffects(prev => 
      prev.includes(effect) 
        ? prev.filter(e => e !== effect)
        : [...prev, effect]
    )
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for your product mockup.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      // Prepare FormData for file uploads
      const formData = new FormData()
      
      // Collect all creative fields
      const allFields = {
        // Basic settings
        title,
        aspectRatio,
        
        // Visual Style
        artDirection: artDirection || '',
        visualInfluence: visualInfluence || '',
        lightingPreset: lightingPreset || '',
        backgroundEnvironment: backgroundEnvironment || '',
        moodContext: moodContext || '',
        compositionTemplate,
        objectCount,
        shadowType,
        logoPlacement: logoPlacementOption,
        logoDescription: logoDescription,
        
        // Typography
        headline: headline || '',
        headlineColor: headlineColorAuto ? 'auto' : headlineColor,
        headlineColorAuto,
        subtext: subtext || '',
        subtextColor: subtextColorAuto ? 'auto' : subtextColor,
        subtextColorAuto,
        ctaText: ctaText || '',
        ctaColor: ctaColorAuto ? 'auto' : ctaColor,
        ctaColorAuto,
        fontFamily,
        fontWeight,
        textCase,
        letterSpacing,
        lineHeight,
        textAlignment,
        textEffects,
        
        // Visual Effects
        highlightStyle,
        accentElement,
        brilliance,
        frostedGlass,
        dropShadowIntensity,
        motionAccent,
        
        // Layout
        layoutMode,
        verticalPosition,
        horizontalOffset,
        smartAnchor,
        safeZones,
        
        // Avatars
        useAvatars,
        selectedAvatarId: selectedAvatarId || '',
        useBasicAvatar,
        basicAvatar: useBasicAvatar ? {
          age: basicAvatarAge,
          race: basicAvatarRace,
          gender: basicAvatarGender,
          description: basicAvatarDescription
        } : null,
        avatarRole,
        avatarInteraction,
        
        // Product
        productMultiplicity,
        angleVarietyCount,
        platformTarget: platformTarget || '',
        brandColors
      }

      // Filter to only filled fields
      const filledFields = filterFilledFields(allFields)

      // Add original prompt
      formData.append('prompt', prompt.trim())
      
      // Add metadata fields (needed for database/tracking)
      formData.append('title', title)
      formData.append('description', prompt.trim())
      formData.append('aspectRatio', aspectRatio)
      formData.append('artDirection', artDirection || '')
      formData.append('visualInfluence', visualInfluence || '')
      formData.append('lightingPreset', lightingPreset || '')
      formData.append('backgroundEnvironment', backgroundEnvironment || '')
      formData.append('moodContext', moodContext || '')
      formData.append('compositionTemplate', compositionTemplate)
      formData.append('objectCount', objectCount.toString())
      formData.append('shadowType', shadowType)
      formData.append('logoPlacement', JSON.stringify(logoPlacementOption))
      formData.append('logoDescription', logoDescription)
      formData.append('headline', headline || '')
      formData.append('headlineColor', headlineColorAuto ? 'auto' : headlineColor)
      formData.append('headlineColorAuto', headlineColorAuto.toString())
      formData.append('subtext', subtext || '')
      formData.append('subtextColor', subtextColorAuto ? 'auto' : subtextColor)
      formData.append('subtextColorAuto', subtextColorAuto.toString())
      formData.append('ctaText', ctaText || '')
      formData.append('ctaColor', ctaColorAuto ? 'auto' : ctaColor)
      formData.append('ctaColorAuto', ctaColorAuto.toString())
      formData.append('fontFamily', fontFamily)
      formData.append('fontWeight', fontWeight)
      formData.append('textCase', textCase)
      formData.append('letterSpacing', letterSpacing.toString())
      formData.append('lineHeight', lineHeight.toString())
      formData.append('textAlignment', textAlignment)
      formData.append('textEffects', JSON.stringify(textEffects))
      formData.append('highlightStyle', highlightStyle)
      formData.append('accentElement', accentElement)
      formData.append('brilliance', brilliance.toString())
      formData.append('frostedGlass', frostedGlass.toString())
      formData.append('dropShadowIntensity', dropShadowIntensity.toString())
      formData.append('motionAccent', motionAccent)
      formData.append('layoutMode', layoutMode)
      formData.append('verticalPosition', verticalPosition.toString())
      formData.append('horizontalOffset', horizontalOffset.toString())
      formData.append('smartAnchor', smartAnchor.toString())
      formData.append('safeZones', safeZones.toString())
      formData.append('useAvatars', useAvatars.toString())
      formData.append('selectedAvatarId', selectedAvatarId || '')
      formData.append('useBasicAvatar', useBasicAvatar.toString())
      formData.append('basicAvatar', useBasicAvatar ? JSON.stringify({
        age: basicAvatarAge,
        race: basicAvatarRace,
        gender: basicAvatarGender,
        description: basicAvatarDescription
      }) : '')
      formData.append('avatarRole', avatarRole)
      formData.append('avatarInteraction', avatarInteraction)
      formData.append('productMultiplicity', productMultiplicity)
      formData.append('angleVarietyCount', angleVarietyCount.toString())
      formData.append('platformTarget', platformTarget || '')
      formData.append('brandColors', JSON.stringify(brandColors))
      formData.append('metadata', JSON.stringify({
        projectTitle,
        title,
        selectedArtifact,
        timestamp: new Date().toISOString()
      }))
      
      // Add custom field values if provided
      if (customArtDirection) formData.append('custom_art_direction', customArtDirection)
      if (customComposition) formData.append('custom_composition', customComposition)
      if (customObjectCount) formData.append('custom_object_count', customObjectCount)
      if (customShadow) formData.append('custom_shadow', customShadow)
      if (customFont) formData.append('custom_font', customFont)
      if (customWeight) formData.append('custom_weight', customWeight)
      if (customTextEffects) formData.append('custom_text_effects', customTextEffects)
      if (customTextCase) formData.append('custom_text_case', customTextCase)
      if (customHighlightStyle) formData.append('custom_highlight_style', customHighlightStyle)
      if (customAccentElement) formData.append('custom_accent_element', customAccentElement)
      if (customMotionAccent) formData.append('custom_motion_accent', customMotionAccent)
      if (customLayoutMode) formData.append('custom_layout_mode', customLayoutMode)
      if (customProductCount) formData.append('custom_product_count', customProductCount)
      if (customPlatform) formData.append('custom_platform', customPlatform)
      
      // Add product photos
      productPhotos.forEach((file, index) => {
        formData.append(`productPhoto_${index}`, file)
      })
      
      // Add logo file if present
      if (logoFile) {
        formData.append('logoFile', logoFile)
      }

      console.log("Generating product mockup with FormData")

      // Call the API
      const response = await fetch('/api/product-mockup-generation', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate product mockup')
      }

      const result: ProductMockupGenerationResult = await response.json()
      console.log("Product mockup generation result:", result)
      
      if (result.success) {
        setGeneratedImages(result.images)
        setGenerationResult(result)
        
        toast({
          title: "🎨 Product Mockups Generated!",
          description: `Successfully generated ${result.images.length} mockup variations. Check your library to view them!`,
        })
        
        // Close the interface to return to the generator panel
        // This will trigger a refresh of the product mockups list
        setTimeout(() => {
          onClose()
        }, 2000) // Wait 2 seconds to show the success message
      } else {
        throw new Error(result.error || 'Generation failed')
      }
      
    } catch (error) {
      console.error('Generation failed:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate product mockup. Please try again."
      setGenerationError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const getCurrentVisualInfluence = () => {
    if (!artDirection || !visualInfluence) return null
    return STYLE_MAP[artDirection]?.find(inf => inf.label === visualInfluence)
  }

  const currentInfluence = getCurrentVisualInfluence()

  return (
    <>
      {/* Loading Overlay */}
      {isGenerating && (
        <GenerationLoading 
          model="Nano-banana"
          onCancel={() => setIsGenerating(false)}
        />
      )}

      {/* Error Overlay */}
      {generationError && (
        <GenerationError
          error={generationError}
          model="Nano-banana"
          onRetry={() => {
            setGenerationError(null)
            handleGenerate()
          }}
          onClose={() => setGenerationError(null)}
        />
      )}

      <div className="bg-background border border-border rounded-lg p-2 space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hover">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-background z-10 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-xs font-semibold bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
              Product Mockup Generator
            </h3>
            <p className="text-xs text-muted-foreground">
              {projectTitle}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Title Field */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter product mockup title"
          className="h-8 text-xs"
        />
      </div>

      {/* Product Photos Upload */}
      <Collapsible 
        open={expandedSections.productPhotos} 
        onOpenChange={() => toggleSection('productPhotos')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Upload className="h-3 w-3 text-primary" />
              </div>
              <div className="text-left">
                <span className="text-xs font-medium text-foreground">Product Photos</span>
                <p className="text-xs text-muted-foreground">
                  {productPhotos.length === 0 
                    ? "Upload up to 2 product images" 
                    : `${productPhotos.length}/2 images uploaded`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {productPhotos.length > 0 && (
                <div className="flex -space-x-1">
                  {productPhotoPreviews.slice(0, 2).map((preview, index) => (
                    <div key={index} className="w-6 h-6 rounded-full border-2 border-background overflow-hidden">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              {expandedSections.productPhotos ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          {/* Upload Area */}
          <div 
            className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-2 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-muted/50 rounded-full group-hover:bg-primary/10 transition-colors">
                <Upload className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground mb-1">
                  {productPhotos.length === 0 ? "Drop your product photos here" : "Add more photos"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG up to 10MB • {productPhotos.length}/2 photos
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                <Upload className="h-3 w-3 mr-1" />
                Choose Files
              </Button>
            </div>
          </div>

          {/* Photo Grid */}
          {productPhotos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">Uploaded Photos</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setProductPhotos([])
                    setProductPhotoPreviews([])
                  }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {productPhotoPreviews.map((preview, index) => (
                  <div key={index} className="relative group bg-muted/30 rounded-lg p-2 border">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted/50 flex-shrink-0">
                        <img 
                          src={preview} 
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">
                          {productPhotos[index]?.name || `Product ${index + 1}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(productPhotos[index]?.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600">Ready</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => removeProductPhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </CollapsibleContent>
      </Collapsible>

      {/* User Prompt */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Prompt</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your product mockup vision..."
          className="min-h-[60px] text-xs resize-none"
        />
      </div>


      {/* Logo Upload with Dropdown */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">Logo Placement (Optional)</span>
        </div>
        
        <div className="space-y-2">
          {/* Logo Placement Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Logo Positions (select multiple)</label>
            <div className="grid grid-cols-2 gap-2">
              {LOGO_PLACEMENT_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`logo-${option.value}`}
                    checked={logoPlacementOption.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setLogoPlacementOption([...logoPlacementOption, option.value])
                      } else {
                        setLogoPlacementOption(logoPlacementOption.filter(p => p !== option.value))
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

          {/* Conditional Logo Upload - Only show if positions selected */}
          {logoPlacementOption.length > 0 && (
        <div className="space-y-2">
          {!logoFile ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-2 text-center hover:border-muted-foreground/50 transition-colors">
              <div className="flex flex-col items-center gap-2">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                <div className="text-xs">
                      <span className="font-medium text-foreground">Upload Logo</span>
                  <p className="text-xs text-muted-foreground mt-1">
                        PNG/JPG recommended
                  </p>
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="text-xs"
                >
                  <Upload className="h-3 w-3 mr-1" />
                      Choose Logo
                </Button>
              </div>
            </div>
          ) : (
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border">
                <img 
                    src={logoPreview || ""} 
                  alt="Logo preview" 
                  className="w-12 h-12 object-contain rounded border"
                />
                <div className="flex-1">
                  <div className="text-xs font-medium">{logoFile.name}</div>
                  <div className="text-xs text-muted-foreground">
                      {(logoFile.size / 1024 / 1024).toFixed(2)} MB • {logoPlacementOption}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeLogo}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              )}

              {/* Logo Description Field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Logo Description (optional)</label>
                <Textarea
                  placeholder="Describe your logo style (e.g., modern tech company logo with blue accent, vintage circular badge, minimalist geometric symbol)"
                  value={logoDescription}
                  onChange={(e) => setLogoDescription(e.target.value)}
                  className="min-h-[50px] text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  You can upload a logo image and/or describe it. The AI will use both to create the logo appearance.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Art Direction & Visual Influence */}
      <Collapsible 
        open={expandedSections.artDirection} 
        onOpenChange={() => toggleSection('artDirection')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <div className="flex items-center gap-2">
              <Palette className="h-3 w-3" />
              <span className="text-xs font-medium">Art Direction</span>
            </div>
            {expandedSections.artDirection ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          {/* Art Direction */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Art Direction</label>
            <Select value={artDirection} onValueChange={(value) => {
              console.log('Art Direction selected:', value)
              setArtDirection(value)
            }}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select Art Direction" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center text-xs">
                      🚫
                    </div>
                    <div>
                      <div className="font-medium">None</div>
                      <div className="text-xs text-muted-foreground">No art direction</div>
                    </div>
                  </div>
                </SelectItem>
                {Object.keys(STYLE_MAP).map((direction) => {
                  // Mapping des emojis pour chaque direction d'art
                  const getEmoji = (dir: string) => {
                    switch (dir) {
                      case "Realistic Studio": return "📸"
                      case "Lifestyle Documentary": return "📱"
                      case "Minimalist Editorial": return "🎨"
                      case "Luxury Commercial": return "💎"
                      case "Stylized 3D": return "🎮"
                      case "Flat / Vector Editorial": return "🎯"
                      case "Surreal Conceptual": return "🌌"
                      case "Futuristic Techno": return "⚡"
                      case "Eco-Natural": return "🌿"
                      case "Retro Revival": return "📼"
                      case "Product + Persona Hybrid": return "👤"
                      case "E-Commerce Hero": return "🛒"
                      case "Social Media Ready": return "📲"
                      case "TikTok & Short Form": return "🎬"
                      case "Tech & Electronics": return "💻"
                      case "Fashion & Beauty": return "👗"
                      case "Food & Beverage": return "🍽️"
                      case "Home & Lifestyle": return "🏠"
                      case "Seasonal Themes": return "🎄"
                      default: return "🎨"
                    }
                  }
                  
                  return (
                  <SelectItem key={direction} value={direction} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span>{getEmoji(direction)}</span>
                    {direction}
                      </div>
                  </SelectItem>
                  )
                })}
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <span>✏️</span>
                    <span>Custom</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {artDirection === 'custom' && (
              <Input
                value={customArtDirection}
                onChange={(e) => setCustomArtDirection(e.target.value)}
                placeholder="Enter custom art direction..."
                className="h-8 text-xs mt-2"
              />
            )}
          </div>

          {/* Visual Influence */}
          {artDirection && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Visual Influence</label>
              <Select value={visualInfluence} onValueChange={setVisualInfluence}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select Visual Influence" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none" className="text-xs">
                    <div className="flex items-center gap-2">
                      <span>🚫</span>
                      <span>None</span>
                    </div>
                  </SelectItem>
                  {STYLE_MAP[artDirection]?.map((influence) => {
                    // Mapping des emojis pour chaque influence visuelle
                    const getInfluenceEmoji = (label: string) => {
                      const lowerLabel = label.toLowerCase()
                      if (lowerLabel.includes('softbox') || lowerLabel.includes('hero')) return "💡"
                      if (lowerLabel.includes('macro') || lowerLabel.includes('material')) return "🔍"
                      if (lowerLabel.includes('hand') || lowerLabel.includes('touch')) return "✋"
                      if (lowerLabel.includes('morning') || lowerLabel.includes('routine')) return "🌅"
                      if (lowerLabel.includes('urban') || lowerLabel.includes('street')) return "🏙️"
                      if (lowerLabel.includes('floating') || lowerLabel.includes('object')) return "🎈"
                      if (lowerLabel.includes('flat lay') || lowerLabel.includes('flat')) return "📋"
                      if (lowerLabel.includes('gold') || lowerLabel.includes('glow')) return "✨"
                      if (lowerLabel.includes('crystal') || lowerLabel.includes('reflection')) return "💎"
                      if (lowerLabel.includes('diorama') || lowerLabel.includes('display')) return "🏠"
                      if (lowerLabel.includes('unreal') || lowerLabel.includes('look')) return "🎮"
                      if (lowerLabel.includes('graphic') || lowerLabel.includes('poster')) return "🎨"
                      if (lowerLabel.includes('geometry') || lowerLabel.includes('floating')) return "🔮"
                      if (lowerLabel.includes('liquid') || lowerLabel.includes('motion')) return "💧"
                      if (lowerLabel.includes('neon') || lowerLabel.includes('corridor')) return "⚡"
                      if (lowerLabel.includes('botanical') || lowerLabel.includes('shadow')) return "🌿"
                      if (lowerLabel.includes('film') || lowerLabel.includes('print')) return "🎞️"
                      if (lowerLabel.includes('model') || lowerLabel.includes('hero')) return "👤"
                      if (lowerLabel.includes('showcase') || lowerLabel.includes('product')) return "🛍️"
                      if (lowerLabel.includes('360') || lowerLabel.includes('view')) return "🔄"
                      if (lowerLabel.includes('instagram') || lowerLabel.includes('feed')) return "📸"
                      if (lowerLabel.includes('story') || lowerLabel.includes('format')) return "📱"
                      if (lowerLabel.includes('quick') || lowerLabel.includes('impact')) return "⚡"
                      if (lowerLabel.includes('sleek') || lowerLabel.includes('tech')) return "💻"
                      if (lowerLabel.includes('style') || lowerLabel.includes('showcase')) return "👗"
                      if (lowerLabel.includes('appetizing') || lowerLabel.includes('display')) return "🍽️"
                      if (lowerLabel.includes('lifestyle') || lowerLabel.includes('setting')) return "🏠"
                      if (lowerLabel.includes('holiday') || lowerLabel.includes('magic')) return "🎄"
                      return "🎨"
                    }
                    
                    return (
                    <SelectItem key={influence.label} value={influence.label} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span>{getInfluenceEmoji(influence.label)}</span>
                          {influence.label}
                      </div>
                    </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Lighting Preset */}
          {currentInfluence && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Lighting</label>
              <Select value={lightingPreset} onValueChange={setLightingPreset}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select Lighting" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none" className="text-xs">
                    <div className="flex items-center gap-2">
                      <span>🚫</span>
                      <span>None</span>
                    </div>
                  </SelectItem>
                  {currentInfluence.lightingPresets.map((preset) => {
                    // Mapping des emojis pour chaque preset d'éclairage
                    const getLightingEmoji = (name: string) => {
                      const lowerName = name.toLowerCase()
                      if (lowerName.includes('softbox') || lowerName.includes('soft')) return "💡"
                      if (lowerName.includes('key') || lowerName.includes('rim')) return "🔦"
                      if (lowerName.includes('gradient') || lowerName.includes('back')) return "🌈"
                      if (lowerName.includes('top') || lowerName.includes('beam')) return "☀️"
                      if (lowerName.includes('low') || lowerName.includes('fill')) return "🕯️"
                      if (lowerName.includes('ambient') || lowerName.includes('overcast')) return "☁️"
                      if (lowerName.includes('window') || lowerName.includes('natural')) return "🪟"
                      if (lowerName.includes('diffuse') || lowerName.includes('daylight')) return "🌤️"
                      if (lowerName.includes('golden') || lowerName.includes('warm')) return "🌅"
                      if (lowerName.includes('even') || lowerName.includes('balanced')) return "🌆"
                      if (lowerName.includes('backlit') || lowerName.includes('rim')) return "💫"
                      if (lowerName.includes('studio') || lowerName.includes('glow')) return "✨"
                      if (lowerName.includes('spotlight') || lowerName.includes('spot')) return "🎯"
                      if (lowerName.includes('gi') || lowerName.includes('indirect')) return "🌟"
                      if (lowerName.includes('hdr') || lowerName.includes('glow')) return "⚡"
                      if (lowerName.includes('trio') || lowerName.includes('setup')) return "🔆"
                      if (lowerName.includes('flat') || lowerName.includes('bright')) return "💡"
                      if (lowerName.includes('rim') || lowerName.includes('glow')) return "💎"
                      if (lowerName.includes('reflective') || lowerName.includes('bounce')) return "🪞"
                      if (lowerName.includes('low key') || lowerName.includes('contrast')) return "🌑"
                      if (lowerName.includes('prism') || lowerName.includes('edge')) return "🔮"
                      if (lowerName.includes('volumetric') || lowerName.includes('mist')) return "🌫️"
                      if (lowerName.includes('dual tone') || lowerName.includes('neon')) return "🎨"
                      if (lowerName.includes('bloom') || lowerName.includes('ambient')) return "🌸"
                      if (lowerName.includes('flash') || lowerName.includes('effect')) return "📸"
                      if (lowerName.includes('high energy') || lowerName.includes('dynamic')) return "⚡"
                      if (lowerName.includes('precision') || lowerName.includes('clean')) return "🎯"
                      if (lowerName.includes('screen') || lowerName.includes('display')) return "📱"
                      if (lowerName.includes('blue') || lowerName.includes('accent')) return "🔵"
                      if (lowerName.includes('beauty') || lowerName.includes('flattering')) return "💄"
                      if (lowerName.includes('fashion') || lowerName.includes('elegant')) return "👗"
                      if (lowerName.includes('runway') || lowerName.includes('dramatic')) return "🎭"
                      if (lowerName.includes('natural') || lowerName.includes('fresh')) return "🌿"
                      if (lowerName.includes('warm') || lowerName.includes('cozy')) return "🔥"
                      if (lowerName.includes('fresh') || lowerName.includes('bright')) return "🌱"
                      if (lowerName.includes('holiday') || lowerName.includes('festive')) return "🎄"
                      if (lowerName.includes('sparkle') || lowerName.includes('magical')) return "✨"
                      if (lowerName.includes('golden hour') || lowerName.includes('nostalgic')) return "🌇"
                      return "💡"
                    }
                    
                    return (
                    <SelectItem key={preset.name} value={preset.name} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span>{getLightingEmoji(preset.name)}</span>
                          {preset.name}
                      </div>
                    </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Background Environment */}
          {currentInfluence && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Background</label>
              <Select value={backgroundEnvironment} onValueChange={setBackgroundEnvironment}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select Background" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none" className="text-xs">
                    <div className="flex items-center gap-2">
                      <span>🚫</span>
                      <span>None</span>
                    </div>
                  </SelectItem>
                  {currentInfluence.backgroundEnvironments.map((env) => {
                    // Mapping des emojis pour chaque environnement de fond
                    const getBackgroundEmoji = (name: string) => {
                      const lowerName = name.toLowerCase()
                      if (lowerName.includes('white') || lowerName.includes('cyclorama')) return "⚪"
                      if (lowerName.includes('paper') || lowerName.includes('roll')) return "📄"
                      if (lowerName.includes('gradient') || lowerName.includes('wall')) return "🌈"
                      if (lowerName.includes('neutral') || lowerName.includes('matte')) return "🔘"
                      if (lowerName.includes('texture') || lowerName.includes('fiber')) return "🧵"
                      if (lowerName.includes('studio') || lowerName.includes('grey')) return "🎬"
                      if (lowerName.includes('home') || lowerName.includes('set')) return "🏠"
                      if (lowerName.includes('bathroom') || lowerName.includes('counter')) return "🛁"
                      if (lowerName.includes('kitchen') || lowerName.includes('top')) return "🍳"
                      if (lowerName.includes('street') || lowerName.includes('scene')) return "🏙️"
                      if (lowerName.includes('desk') || lowerName.includes('go')) return "💼"
                      if (lowerName.includes('void') || lowerName.includes('minimal')) return "⬜"
                      if (lowerName.includes('pastel') || lowerName.includes('tinted')) return "🎨"
                      if (lowerName.includes('sheet') || lowerName.includes('fiber')) return "📋"
                      if (lowerName.includes('marble') || lowerName.includes('slab')) return "🏛️"
                      if (lowerName.includes('velvet') || lowerName.includes('backdrop')) return "🟣"
                      if (lowerName.includes('mirror') || lowerName.includes('floor')) return "🪞"
                      if (lowerName.includes('crystal') || lowerName.includes('pedestal')) return "💎"
                      if (lowerName.includes('black') || lowerName.includes('velvet')) return "⚫"
                      if (lowerName.includes('miniature') || lowerName.includes('set')) return "🏘️"
                      if (lowerName.includes('room') || lowerName.includes('walls')) return "🏠"
                      if (lowerName.includes('tunnel') || lowerName.includes('geometric')) return "🕳️"
                      if (lowerName.includes('glass') || lowerName.includes('platform')) return "🪟"
                      if (lowerName.includes('color') || lowerName.includes('field')) return "🎨"
                      if (lowerName.includes('grid') || lowerName.includes('pattern')) return "🔲"
                      if (lowerName.includes('abstract') || lowerName.includes('gradient')) return "🌀"
                      if (lowerName.includes('particle') || lowerName.includes('field')) return "✨"
                      if (lowerName.includes('liquid') || lowerName.includes('sheet')) return "💧"
                      if (lowerName.includes('fog') || lowerName.includes('fade')) return "🌫️"
                      if (lowerName.includes('neon') || lowerName.includes('hall')) return "⚡"
                      if (lowerName.includes('hologram') || lowerName.includes('grid')) return "🔮"
                      if (lowerName.includes('wood') || lowerName.includes('table')) return "🪵"
                      if (lowerName.includes('kraft') || lowerName.includes('paper')) return "📦"
                      if (lowerName.includes('backdrop') || lowerName.includes('muted')) return "🎭"
                      if (lowerName.includes('crt') || lowerName.includes('glow')) return "📺"
                      if (lowerName.includes('editorial') || lowerName.includes('wall')) return "📰"
                      if (lowerName.includes('lifestyle') || lowerName.includes('neutral')) return "🏡"
                      if (lowerName.includes('seamless') || lowerName.includes('white')) return "🤍"
                      if (lowerName.includes('floor') || lowerName.includes('dimension')) return "🏢"
                      if (lowerName.includes('living') || lowerName.includes('room')) return "🛋️"
                      if (lowerName.includes('kitchen') || lowerName.includes('counter')) return "🍽️"
                      if (lowerName.includes('bedroom') || lowerName.includes('setting')) return "🛏️"
                      if (lowerName.includes('colors') || lowerName.includes('festive')) return "🎨"
                      if (lowerName.includes('snow') || lowerName.includes('texture')) return "❄️"
                      if (lowerName.includes('gift') || lowerName.includes('wrap')) return "🎁"
                      if (lowerName.includes('circuit') || lowerName.includes('pattern')) return "🔌"
                      if (lowerName.includes('glass') || lowerName.includes('surface')) return "🪟"
                      if (lowerName.includes('fabric') || lowerName.includes('luxury')) return "🧵"
                      if (lowerName.includes('surface') || lowerName.includes('elegant')) return "🏛️"
                      if (lowerName.includes('overlay') || lowerName.includes('textured')) return "🎭"
                      if (lowerName.includes('bleed') || lowerName.includes('coverage')) return "📱"
                      if (lowerName.includes('safe') || lowerName.includes('zone')) return "🛡️"
                      if (lowerName.includes('burst') || lowerName.includes('energetic')) return "💥"
                      if (lowerName.includes('motion') || lowerName.includes('blur')) return "🌪️"
                      if (lowerName.includes('grid') || lowerName.includes('tech')) return "⚡"
                      return "🖼️"
                    }
                    
                    return (
                    <SelectItem key={env.name} value={env.name} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span>{getBackgroundEmoji(env.name)}</span>
                          {env.name}
                      </div>
                    </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mood Context */}
          {currentInfluence && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Mood</label>
              <Select value={moodContext} onValueChange={setMoodContext}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select Mood" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none" className="text-xs">
                    <div className="flex items-center gap-2">
                      <span>🚫</span>
                      <span>None</span>
                    </div>
                  </SelectItem>
                  {currentInfluence.moodContexts.map((mood) => {
                    // Mapping des emojis pour chaque contexte d'humeur
                    const getMoodEmoji = (name: string) => {
                      const lowerName = name.toLowerCase()
                      if (lowerName.includes('clean') || lowerName.includes('minimal')) return "✨"
                      if (lowerName.includes('premium') || lowerName.includes('luxury')) return "💎"
                      if (lowerName.includes('energetic') || lowerName.includes('dynamic')) return "⚡"
                      if (lowerName.includes('precision') || lowerName.includes('technical')) return "🎯"
                      if (lowerName.includes('luxury') || lowerName.includes('indulgent')) return "👑"
                      if (lowerName.includes('trust') || lowerName.includes('reliable')) return "🤝"
                      if (lowerName.includes('warmth') || lowerName.includes('cozy')) return "🔥"
                      if (lowerName.includes('natural') || lowerName.includes('organic')) return "🌿"
                      if (lowerName.includes('fresh') || lowerName.includes('clean')) return "🌱"
                      if (lowerName.includes('confident') || lowerName.includes('bold')) return "💪"
                      if (lowerName.includes('relaxed') || lowerName.includes('calm')) return "😌"
                      if (lowerName.includes('minimal') || lowerName.includes('simple')) return "⚪"
                      if (lowerName.includes('playful') || lowerName.includes('fun')) return "🎈"
                      if (lowerName.includes('orderly') || lowerName.includes('organized')) return "📋"
                      if (lowerName.includes('chic') || lowerName.includes('elegant')) return "👗"
                      if (lowerName.includes('indulgent') || lowerName.includes('rich')) return "🍫"
                      if (lowerName.includes('black-tie') || lowerName.includes('formal')) return "🎩"
                      if (lowerName.includes('precise') || lowerName.includes('exact')) return "🎯"
                      if (lowerName.includes('opulent') || lowerName.includes('lavish')) return "💎"
                      if (lowerName.includes('playful') || lowerName.includes('cute')) return "🐰"
                      if (lowerName.includes('futuristic') || lowerName.includes('modern')) return "🚀"
                      if (lowerName.includes('bold') || lowerName.includes('strong')) return "💪"
                      if (lowerName.includes('modern') || lowerName.includes('contemporary')) return "🏙️"
                      if (lowerName.includes('retro') || lowerName.includes('vintage')) return "📼"
                      if (lowerName.includes('mysterious') || lowerName.includes('enigmatic')) return "🌙"
                      if (lowerName.includes('visionary') || lowerName.includes('innovative')) return "🔮"
                      if (lowerName.includes('dynamic') || lowerName.includes('energetic')) return "⚡"
                      if (lowerName.includes('sensual') || lowerName.includes('smooth')) return "🌹"
                      if (lowerName.includes('cutting-edge') || lowerName.includes('advanced')) return "⚡"
                      if (lowerName.includes('cyber') || lowerName.includes('tech')) return "🤖"
                      if (lowerName.includes('pure') || lowerName.includes('clean')) return "🤍"
                      if (lowerName.includes('fresh') || lowerName.includes('crisp')) return "🌿"
                      if (lowerName.includes('nostalgic') || lowerName.includes('memories')) return "📸"
                      if (lowerName.includes('pop') || lowerName.includes('vibrant')) return "🎨"
                      if (lowerName.includes('approachable') || lowerName.includes('friendly')) return "😊"
                      if (lowerName.includes('professional') || lowerName.includes('business')) return "💼"
                      if (lowerName.includes('clean') || lowerName.includes('bright')) return "☀️"
                      if (lowerName.includes('premium') || lowerName.includes('high-end')) return "💎"
                      if (lowerName.includes('vibrant') || lowerName.includes('colorful')) return "🌈"
                      if (lowerName.includes('technical') || lowerName.includes('precise')) return "🔧"
                      if (lowerName.includes('interactive') || lowerName.includes('engaging')) return "👆"
                      if (lowerName.includes('trendy') || lowerName.includes('fashionable')) return "🔥"
                      if (lowerName.includes('aesthetic') || lowerName.includes('beautiful')) return "✨"
                      if (lowerName.includes('bold') || lowerName.includes('striking')) return "💥"
                      if (lowerName.includes('immersive') || lowerName.includes('engaging')) return "🎭"
                      if (lowerName.includes('natural') || lowerName.includes('organic')) return "🌿"
                      if (lowerName.includes('high energy') || lowerName.includes('intense')) return "⚡"
                      if (lowerName.includes('viral') || lowerName.includes('popular')) return "📈"
                      if (lowerName.includes('trending') || lowerName.includes('hot')) return "🔥"
                      if (lowerName.includes('futuristic') || lowerName.includes('advanced')) return "🚀"
                      if (lowerName.includes('innovation') || lowerName.includes('new')) return "💡"
                      if (lowerName.includes('elegant') || lowerName.includes('sophisticated')) return "👗"
                      if (lowerName.includes('glamorous') || lowerName.includes('glam')) return "💄"
                      if (lowerName.includes('healthy') || lowerName.includes('good')) return "💚"
                      if (lowerName.includes('indulgent') || lowerName.includes('treat')) return "🍰"
                      if (lowerName.includes('comfortable') || lowerName.includes('cozy')) return "🛋️"
                      if (lowerName.includes('modern') || lowerName.includes('contemporary')) return "🏠"
                      if (lowerName.includes('festive') || lowerName.includes('celebration')) return "🎉"
                      if (lowerName.includes('magical') || lowerName.includes('wonder')) return "🪄"
                      return "😊"
                    }
                    
                    return (
                    <SelectItem key={mood.name} value={mood.name} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span>{getMoodEmoji(mood.name)}</span>
                          {mood.name}
                      </div>
                    </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Composition & Branding */}
      <Collapsible 
        open={expandedSections.composition} 
        onOpenChange={() => toggleSection('composition')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <div className="flex items-center gap-2">
              <Layout className="h-3 w-3" />
              <span className="text-xs font-medium">Composition & Branding</span>
            </div>
            {expandedSections.composition ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          {/* Aspect Ratio & Image Count */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Aspect Ratio</label>
              <Select value={aspectRatio} onValueChange={(value) => setAspectRatio(value as any)}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select Aspect Ratio" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableAspectRatios.map((ratio) => {
                    // Mapping des emojis pour chaque ratio d'aspect
                    const getAspectRatioEmoji = (ratio: string) => {
                      switch (ratio) {
                        case "1:1": return "⬜" // Carré
                        case "4:5": return "📱" // Portrait mobile
                        case "16:9": return "📺" // Paysage vidéo
                        case "9:16": return "📲" // Portrait vertical
                        case "2:1": return "🖥️" // Paysage large
                        case "3:4": return "📄" // Portrait document
                        case "2:3": return "🖼️" // Portrait photo
                        case "4:3": return "📷" // Paysage photo
                        case "3:2": return "📸" // Paysage classique
                        default: return "📐"
                      }
                    }
                    
                    return (
                    <SelectItem key={ratio} value={ratio} className="text-xs">
                      <div className="flex items-center gap-2">
                          <span>{getAspectRatioEmoji(ratio)}</span>
                        {ratio}
                      </div>
                    </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* Composition Template */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Composition</label>
            <Select value={compositionTemplate} onValueChange={(value) => setCompositionTemplate(value as any)}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select Composition" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center text-xs">
                      🚫
                    </div>
                    <div>
                      <div className="font-medium">None</div>
                      <div className="text-xs text-muted-foreground">No composition template</div>
                    </div>
                  </div>
                </SelectItem>
                {["Centered Hero", "Rule of Thirds", "Floating Object", "Flat Lay", "Collage"].map((template) => {
                  // Mapping des emojis pour chaque template de composition
                  const getCompositionEmoji = (template: string) => {
                    switch (template) {
                      case "Centered Hero": return "🎯" // Centré
                      case "Rule of Thirds": return "📐" // Règle des tiers
                      case "Floating Object": return "🎈" // Objet flottant
                      case "Flat Lay": return "📋" // Mise à plat
                      case "Collage": return "🧩" // Collage
                      default: return "🎨"
                    }
                  }
                  
                  return (
                  <SelectItem key={template} value={template} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span>{getCompositionEmoji(template)}</span>
                    {template}
                      </div>
                  </SelectItem>
                  )
                })}
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <span>✏️</span>
                    <span>Custom</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {compositionTemplate === 'custom' && (
              <Input
                value={customComposition}
                onChange={(e) => setCustomComposition(e.target.value)}
                placeholder="Enter custom composition..."
                className="h-8 text-xs mt-2"
              />
            )}
          </div>

          {/* Object Count & Shadow */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Objects</label>
              <Select value={objectCount.toString()} onValueChange={(value) => setObjectCount(value === "custom" ? "custom" : parseInt(value) as any)}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select Count" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3].map((count) => (
                    <SelectItem key={count} value={count.toString()} className="text-xs">
                      {count}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom" className="text-xs">
                    <div className="flex items-center gap-2">
                      <span>✏️</span>
                      <span>Custom</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {objectCount === 'custom' && (
                <Input
                  value={customObjectCount}
                  onChange={(e) => setCustomObjectCount(e.target.value)}
                  placeholder="Enter custom object count..."
                  className="h-8 text-xs mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Shadow</label>
              <Select value={shadowType} onValueChange={(value) => setShadowType(value as any)}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select Shadow" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center text-xs">
                        🚫
                      </div>
                      <div>
                        <div className="font-medium">None</div>
                        <div className="text-xs text-muted-foreground">No shadow</div>
                      </div>
                    </div>
                  </SelectItem>
                  {["Soft", "Hard", "Floating", "Mirror"].map((shadow) => {
                    // Mapping des emojis pour chaque type d'ombre
                    const getShadowEmoji = (shadow: string) => {
                      switch (shadow) {
                        case "Soft": return "☁️" // Ombre douce
                        case "Hard": return "⚫" // Ombre dure
                        case "Floating": return "🎈" // Ombre flottante
                        case "Mirror": return "🪞" // Ombre miroir
                        default: return "🌑"
                      }
                    }
                    
                    return (
                    <SelectItem key={shadow} value={shadow} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span>{getShadowEmoji(shadow)}</span>
                      {shadow}
                        </div>
                    </SelectItem>
                    )
                  })}
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <span>✏️</span>
                      <span>Custom</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {shadowType === 'custom' && (
                <Input
                  value={customShadow}
                  onChange={(e) => setCustomShadow(e.target.value)}
                  placeholder="Enter custom shadow..."
                  className="h-8 text-xs mt-2"
                />
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Text & CTA Overlay */}
      <Collapsible 
        open={expandedSections.textOverlay} 
        onOpenChange={() => toggleSection('textOverlay')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span className="text-sm font-medium">Text & CTA</span>
            </div>
            {expandedSections.textOverlay ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          {/* Text Inputs with Color Controls */}
          <div className="space-y-2">
            {/* Headline with Color */}
            <div className="flex items-center gap-2">
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Headline (optional)"
                className="text-xs h-8 flex-1"
              />
              <Button
                variant={headlineColorAuto ? "default" : "outline"}
                size="sm"
                onClick={() => setHeadlineColorAuto(!headlineColorAuto)}
                className="w-14 h-8 text-xs"
                type="button"
              >
                Auto
              </Button>
              <input
                type="color"
                value={headlineColor}
                onChange={(e) => setHeadlineColor(e.target.value)}
                disabled={headlineColorAuto}
                className="w-10 h-8 rounded border cursor-pointer disabled:opacity-50"
                title="Headline color"
              />
            </div>
            
            {/* Subtext with Color */}
            <div className="flex items-center gap-2">
              <Input
                value={subtext}
                onChange={(e) => setSubtext(e.target.value)}
                placeholder="Subtext (optional)"
                className="text-xs h-8 flex-1"
              />
              <Button
                variant={subtextColorAuto ? "default" : "outline"}
                size="sm"
                onClick={() => setSubtextColorAuto(!subtextColorAuto)}
                className="w-14 h-8 text-xs"
                type="button"
              >
                Auto
              </Button>
              <input
                type="color"
                value={subtextColor}
                onChange={(e) => setSubtextColor(e.target.value)}
                disabled={subtextColorAuto}
                className="w-10 h-8 rounded border cursor-pointer disabled:opacity-50"
                title="Subtext color"
              />
            </div>
            
            {/* CTA with Color */}
            <div className="flex items-center gap-2">
              <Input
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="CTA Text (optional)"
                className="text-xs h-8 flex-1"
              />
              <Button
                variant={ctaColorAuto ? "default" : "outline"}
                size="sm"
                onClick={() => setCtaColorAuto(!ctaColorAuto)}
                className="w-14 h-8 text-xs"
                type="button"
              >
                Auto
              </Button>
              <input
                type="color"
                value={ctaColor}
                onChange={(e) => setCtaColor(e.target.value)}
                disabled={ctaColorAuto}
                className="w-10 h-8 rounded border cursor-pointer disabled:opacity-50"
                title="CTA color"
              />
            </div>
          </div>

          {/* Typography Controls */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Font</label>
              <Select value={fontFamily} onValueChange={(value) => setFontFamily(value as any)}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select Font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center text-xs">
                        🚫
                      </div>
                      <div>
                        <div className="font-medium">None</div>
                        <div className="text-xs text-muted-foreground">No font family</div>
                      </div>
                    </div>
                  </SelectItem>
                  {["serif", "sans", "condensed", "rounded", "monospace", "script", "display", "handwriting", "decorative", "modern", "classic", "futuristic", "elegant", "bold", "minimal", "vintage", "tech", "artistic", "playful", "professional", "luxury", "casual", "formal", "creative", "clean", "stylized", "geometric", "organic", "industrial", "romantic", "edgy", "sophisticated", "friendly", "dramatic", "subtle", "expressive", "refined", "dynamic", "serene", "energetic", "mysterious", "vibrant", "calm", "powerful", "gentle", "striking", "smooth", "rough", "precise", "flowing", "structured", "freeform", "technical", "corporate", "personal", "trendy", "timeless", "innovative", "traditional", "contemporary", "retro", "cutting-edge", "nostalgic", "avant-garde", "minimalist", "maximalist", "raw", "polished", "rustic", "urban", "natural", "synthetic", "warm", "cool", "neutral", "delicate", "strong", "soft", "hard", "fluid", "rigid", "curved", "angular", "sharp", "blunt", "pointed", "textured", "flat", "dimensional", "layered", "simple", "complex", "abstract", "literal", "symbolic", "direct", "indirect", "obvious", "loud", "quiet", "bright", "dark", "light", "heavy", "thin", "thick", "wide", "narrow", "tall", "short", "expanded", "extended", "compressed", "spacious", "tight", "loose", "dense", "sparse", "full", "empty", "rich", "poor", "luxurious", "basic", "premium", "standard", "exclusive", "common", "rare", "unique", "ordinary", "special", "regular", "irregular", "consistent", "inconsistent", "stable", "unstable", "balanced", "unbalanced", "symmetrical", "asymmetrical", "proportional", "disproportional", "harmonious", "discordant", "melodic", "rhythmic", "static", "still", "moving", "frozen", "solid", "liquid", "gaseous", "crystalline", "amorphous", "unstructured", "organized", "chaotic", "orderly", "random", "planned", "spontaneous", "calculated", "intuitive", "logical", "emotional", "rational", "irrational", "scientific", "mathematical", "poetic", "prosaic", "lyrical", "musical", "visual", "tactile", "auditory", "olfactory", "gustatory", "kinesthetic", "spatial", "temporal", "conceptual", "perceptual", "cognitive", "affective", "behavioral", "physiological", "psychological", "social", "cultural", "historical", "postmodern", "premodern", "antique", "neo", "proto", "meta", "para", "anti", "pro", "pre", "post", "inter", "intra", "trans", "cis", "ultra", "infra", "super", "sub", "hyper", "hypo", "macro", "micro", "mega", "mini", "maxi", "giga", "tera", "peta", "exa", "zetta", "yotta", "deca", "hecto", "kilo", "milli", "nano", "pico", "femto", "atto", "zepto", "yocto"].map((font) => {
                    // Mapping des emojis pour chaque famille de police
                    const getFontEmoji = (font: string) => {
                      switch (font) {
                        case "serif": return "📚" // Police serif classique
                        case "sans": return "📝" // Police sans-serif moderne
                        case "condensed": return "📏" // Police condensée
                        case "rounded": return "⭕" // Police arrondie
                        case "monospace": return "💻" // Police monospace
                        case "script": return "✍️" // Police script/cursive
                        case "display": return "🎭" // Police d'affichage
                        case "handwriting": return "✏️" // Police manuscrite
                        case "decorative": return "🎨" // Police décorative
                        case "modern": return "🚀" // Police moderne
                        case "classic": return "🏛️" // Police classique
                        case "futuristic": return "⚡" // Police futuriste
                        case "elegant": return "👑" // Police élégante
                        case "bold": return "💪" // Police audacieuse
                        case "minimal": return "⚪" // Police minimaliste
                        case "vintage": return "📼" // Police vintage
                        case "tech": return "🔧" // Police technologique
                        case "artistic": return "🎨" // Police artistique
                        case "playful": return "🎈" // Police ludique
                        case "professional": return "💼" // Police professionnelle
                        case "luxury": return "💎" // Police luxueuse
                        case "casual": return "👕" // Police décontractée
                        case "formal": return "🎩" // Police formelle
                        case "creative": return "🎨" // Police créative
                        case "clean": return "✨" // Police propre
                        case "stylized": return "🎭" // Police stylisée
                        case "geometric": return "📐" // Police géométrique
                        case "organic": return "🌿" // Police organique
                        case "industrial": return "🏭" // Police industrielle
                        case "romantic": return "🌹" // Police romantique
                        case "edgy": return "⚡" // Police audacieuse
                        case "sophisticated": return "🍷" // Police sophistiquée
                        case "friendly": return "😊" // Police amicale
                        case "dramatic": return "🎭" // Police dramatique
                        case "subtle": return "🌙" // Police subtile
                        case "expressive": return "🎨" // Police expressive
                        case "refined": return "🥂" // Police raffinée
                        case "dynamic": return "⚡" // Police dynamique
                        case "serene": return "🕊️" // Police sereine
                        case "energetic": return "⚡" // Police énergique
                        case "mysterious": return "🌙" // Police mystérieuse
                        case "vibrant": return "🌈" // Police vibrante
                        case "calm": return "🌊" // Police calme
                        case "powerful": return "💪" // Police puissante
                        case "gentle": return "🕊️" // Police douce
                        case "striking": return "💥" // Police frappante
                        case "smooth": return "🌊" // Police fluide
                        case "rough": return "🪨" // Police rugueuse
                        case "precise": return "🎯" // Police précise
                        case "flowing": return "🌊" // Police fluide
                        case "structured": return "🏗️" // Police structurée
                        case "freeform": return "🎨" // Police libre
                        case "technical": return "🔧" // Police technique
                        case "corporate": return "🏢" // Police d'entreprise
                        case "personal": return "👤" // Police personnelle
                        case "trendy": return "🔥" // Police tendance
                        case "timeless": return "⏰" // Police intemporelle
                        case "innovative": return "💡" // Police innovante
                        case "traditional": return "📜" // Police traditionnelle
                        case "contemporary": return "🏙️" // Police contemporaine
                        case "retro": return "📺" // Police rétro
                        case "cutting-edge": return "⚡" // Police avant-gardiste
                        case "nostalgic": return "📸" // Police nostalgique
                        case "avant-garde": return "🎨" // Police avant-gardiste
                        case "minimalist": return "⚪" // Police minimaliste
                        case "maximalist": return "🎨" // Police maximaliste
                        case "raw": return "🪨" // Police brute
                        case "polished": return "✨" // Police polie
                        case "rustic": return "🪵" // Police rustique
                        case "urban": return "🏙️" // Police urbaine
                        case "natural": return "🌿" // Police naturelle
                        case "synthetic": return "🧪" // Police synthétique
                        case "warm": return "🔥" // Police chaleureuse
                        case "cool": return "❄️" // Police fraîche
                        case "neutral": return "⚪" // Police neutre
                        case "delicate": return "🌸" // Police délicate
                        case "strong": return "💪" // Police forte
                        case "soft": return "☁️" // Police douce
                        case "hard": return "🪨" // Police dure
                        case "fluid": return "🌊" // Police fluide
                        case "rigid": return "📏" // Police rigide
                        case "curved": return "🌙" // Police courbée
                        case "angular": return "📐" // Police angulaire
                        case "sharp": return "⚡" // Police nette
                        case "blunt": return "🪨" // Police émoussée
                        case "pointed": return "📍" // Police pointue
                        case "textured": return "🧵" // Police texturée
                        case "flat": return "📄" // Police plate
                        case "dimensional": return "📦" // Police dimensionnelle
                        case "layered": return "📚" // Police en couches
                        case "simple": return "⚪" // Police simple
                        case "complex": return "🧩" // Police complexe
                        case "abstract": return "🎨" // Police abstraite
                        case "literal": return "📝" // Police littérale
                        case "symbolic": return "🔮" // Police symbolique
                        case "direct": return "➡️" // Police directe
                        case "indirect": return "↗️" // Police indirecte
                        case "obvious": return "👁️" // Police évidente
                        case "loud": return "📢" // Police forte
                        case "quiet": return "🤫" // Police silencieuse
                        case "bright": return "☀️" // Police lumineuse
                        case "dark": return "🌑" // Police sombre
                        case "light": return "💡" // Police légère
                        case "heavy": return "⚖️" // Police lourde
                        case "thin": return "📏" // Police fine
                        case "thick": return "📚" // Police épaisse
                        case "wide": return "↔️" // Police large
                        case "narrow": return "↕️" // Police étroite
                        case "tall": return "📏" // Police haute
                        case "short": return "📏" // Police courte
                        case "expanded": return "↔️" // Police étendue
                        case "extended": return "↔️" // Police étendue
                        case "compressed": return "📏" // Police compressée
                        case "spacious": return "🌌" // Police spacieuse
                        case "tight": return "📏" // Police serrée
                        case "loose": return "🌊" // Police lâche
                        case "dense": return "📚" // Police dense
                        case "sparse": return "🌌" // Police clairsemée
                        case "full": return "📦" // Police pleine
                        case "empty": return "⬜" // Police vide
                        case "rich": return "💰" // Police riche
                        case "poor": return "💸" // Police pauvre
                        case "luxurious": return "💎" // Police luxueuse
                        case "basic": return "📝" // Police basique
                        case "premium": return "👑" // Police premium
                        case "standard": return "📋" // Police standard
                        case "exclusive": return "🔒" // Police exclusive
                        case "common": return "👥" // Police commune
                        case "rare": return "💎" // Police rare
                        case "unique": return "🦄" // Police unique
                        case "ordinary": return "📝" // Police ordinaire
                        case "special": return "⭐" // Police spéciale
                        case "regular": return "📋" // Police régulière
                        case "irregular": return "🎨" // Police irrégulière
                        case "consistent": return "📏" // Police cohérente
                        case "inconsistent": return "🎨" // Police incohérente
                        case "stable": return "⚖️" // Police stable
                        case "unstable": return "🌊" // Police instable
                        case "balanced": return "⚖️" // Police équilibrée
                        case "unbalanced": return "🌊" // Police déséquilibrée
                        case "symmetrical": return "🔄" // Police symétrique
                        case "asymmetrical": return "🎨" // Police asymétrique
                        case "proportional": return "📐" // Police proportionnelle
                        case "disproportional": return "🎨" // Police disproportionnée
                        case "harmonious": return "🎵" // Police harmonieuse
                        case "discordant": return "🎨" // Police discordante
                        case "melodic": return "🎵" // Police mélodique
                        case "rhythmic": return "🥁" // Police rythmique
                        case "static": return "📷" // Police statique
                        case "still": return "📷" // Police immobile
                        case "moving": return "🎬" // Police mobile
                        case "frozen": return "❄️" // Police gelée
                        case "solid": return "🪨" // Police solide
                        case "liquid": return "🌊" // Police liquide
                        case "gaseous": return "☁️" // Police gazeuse
                        case "crystalline": return "💎" // Police cristalline
                        case "amorphous": return "🌊" // Police amorphe
                        case "unstructured": return "🎨" // Police non structurée
                        case "organized": return "📋" // Police organisée
                        case "chaotic": return "🌪️" // Police chaotique
                        case "orderly": return "📋" // Police ordonnée
                        case "random": return "🎲" // Police aléatoire
                        case "planned": return "📋" // Police planifiée
                        case "spontaneous": return "🎨" // Police spontanée
                        case "calculated": return "🧮" // Police calculée
                        case "intuitive": return "🔮" // Police intuitive
                        case "logical": return "🧠" // Police logique
                        case "emotional": return "❤️" // Police émotionnelle
                        case "rational": return "🧮" // Police rationnelle
                        case "irrational": return "🎨" // Police irrationnelle
                        case "scientific": return "🔬" // Police scientifique
                        case "mathematical": return "📐" // Police mathématique
                        case "poetic": return "📜" // Police poétique
                        case "prosaic": return "📝" // Police prosaïque
                        case "lyrical": return "🎵" // Police lyrique
                        case "musical": return "🎵" // Police musicale
                        case "visual": return "👁️" // Police visuelle
                        case "tactile": return "✋" // Police tactile
                        case "auditory": return "👂" // Police auditive
                        case "olfactory": return "👃" // Police olfactive
                        case "gustatory": return "👅" // Police gustative
                        case "kinesthetic": return "🏃" // Police kinesthésique
                        case "spatial": return "🌌" // Police spatiale
                        case "temporal": return "⏰" // Police temporelle
                        case "conceptual": return "💭" // Police conceptuelle
                        case "perceptual": return "👁️" // Police perceptuelle
                        case "cognitive": return "🧠" // Police cognitive
                        case "affective": return "❤️" // Police affective
                        case "behavioral": return "🏃" // Police comportementale
                        case "physiological": return "🫀" // Police physiologique
                        case "psychological": return "🧠" // Police psychologique
                        case "social": return "👥" // Police sociale
                        case "cultural": return "🏛️" // Police culturelle
                        case "historical": return "📜" // Police historique
                        case "postmodern": return "🎨" // Police postmoderne
                        case "premodern": return "📜" // Police prémoderne
                        case "antique": return "🏺" // Police antique
                        case "neo": return "🆕" // Police néo
                        case "proto": return "🔬" // Police proto
                        case "meta": return "🔮" // Police méta
                        case "para": return "🔄" // Police para
                        case "anti": return "🚫" // Police anti
                        case "pro": return "✅" // Police pro
                        case "pre": return "⏪" // Police pré
                        case "post": return "⏩" // Police post
                        case "inter": return "🔗" // Police inter
                        case "intra": return "📦" // Police intra
                        case "trans": return "🔄" // Police trans
                        case "cis": return "📦" // Police cis
                        case "ultra": return "⚡" // Police ultra
                        case "infra": return "📡" // Police infra
                        case "super": return "🦸" // Police super
                        case "sub": return "📦" // Police sub
                        case "hyper": return "⚡" // Police hyper
                        case "hypo": return "📉" // Police hypo
                        case "macro": return "🔍" // Police macro
                        case "micro": return "🔬" // Police micro
                        case "mega": return "💥" // Police méga
                        case "mini": return "🔍" // Police mini
                        case "maxi": return "📏" // Police maxi
                        case "giga": return "💥" // Police giga
                        case "tera": return "💥" // Police téra
                        case "peta": return "💥" // Police péta
                        case "exa": return "💥" // Police exa
                        case "zetta": return "💥" // Police zetta
                        case "yotta": return "💥" // Police yotta
                        case "deca": return "🔟" // Police déca
                        case "hecto": return "💯" // Police hecto
                        case "kilo": return "🔢" // Police kilo
                        case "milli": return "📏" // Police milli
                        case "nano": return "🔬" // Police nano
                        case "pico": return "🔬" // Police pico
                        case "femto": return "🔬" // Police femto
                        case "atto": return "🔬" // Police atto
                        case "zepto": return "🔬" // Police zepto
                        case "yocto": return "🔬" // Police yocto
                        default: return "🔤"
                      }
                    }
                    
                    return (
                    <SelectItem key={font} value={font} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span>{getFontEmoji(font)}</span>
                      {font}
                        </div>
                    </SelectItem>
                    )
                  })}
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <span>✏️</span>
                      <span>Custom</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {fontFamily === 'custom' && (
                <Input
                  value={customFont}
                  onChange={(e) => setCustomFont(e.target.value)}
                  placeholder="Enter custom font..."
                  className="h-8 text-xs mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Weight</label>
              <Select value={fontWeight} onValueChange={(value) => setFontWeight(value as any)}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select Weight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center text-xs">
                        🚫
                      </div>
                      <div>
                        <div className="font-medium">None</div>
                        <div className="text-xs text-muted-foreground">No font weight</div>
                      </div>
                    </div>
                  </SelectItem>
                  {["light", "normal", "medium", "bold"].map((weight) => {
                    // Mapping des emojis pour chaque poids de police
                    const getWeightEmoji = (weight: string) => {
                      switch (weight) {
                        case "light": return "🪶" // Police légère
                        case "normal": return "📝" // Police normale
                        case "medium": return "📄" // Police moyenne
                        case "bold": return "📚" // Police grasse
                        default: return "🔤"
                      }
                    }
                    
                    return (
                    <SelectItem key={weight} value={weight} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span>{getWeightEmoji(weight)}</span>
                      {weight}
                        </div>
                    </SelectItem>
                    )
                  })}
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <span>✏️</span>
                      <span>Custom</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {fontWeight === 'custom' && (
                <Input
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value)}
                  placeholder="Enter custom weight..."
                  className="h-8 text-xs mt-2"
                />
              )}
            </div>
          </div>

          {/* Text Effects */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Text Effects</label>
            <Select value={textEffects[0] || "none"} onValueChange={(value) => {
              if (value && value !== "none") {
                setTextEffects([value])
              } else {
                setTextEffects([])
              }
            }}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select Text Effect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">
                  <div className="flex items-center gap-2">
                    <span>🚫</span>
                    None
                  </div>
                </SelectItem>
                {["brilliance", "frosted_glass", "drop_shadow"].map((effect) => {
                  // Mapping des emojis pour chaque effet de texte
                  const getTextEffectEmoji = (effect: string) => {
                    switch (effect) {
                      case "brilliance": return "✨" // Effet de brillance
                      case "frosted_glass": return "🪟" // Effet verre dépoli
                      case "drop_shadow": return "🌑" // Ombre portée
                      default: return "🎨"
                    }
                  }
                  
                  return (
                    <SelectItem key={effect} value={effect} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span>{getTextEffectEmoji(effect)}</span>
                  {effect.replace('_', ' ')}
            </div>
                    </SelectItem>
                  )
                })}
                <SelectItem value="custom" className="text-xs">
                  <div className="flex items-center gap-2">
                    <span>✏️</span>
                    <span>Custom</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {textEffects[0] === 'custom' && (
              <Input
                value={customTextEffects}
                onChange={(e) => setCustomTextEffects(e.target.value)}
                placeholder="Enter custom text effects..."
                className="h-8 text-xs mt-2"
              />
            )}
          </div>

          {/* Advanced Typography */}
          <div className="space-y-3 p-3 bg-muted/20 rounded-lg border">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Advanced Typography</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Text Case</label>
                <Select value={textCase} onValueChange={(value) => setTextCase(value as any)}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Select Text Case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center text-xs">
                          🚫
                        </div>
                        <div>
                          <div className="font-medium">None</div>
                          <div className="text-xs text-muted-foreground">No text case</div>
                        </div>
                      </div>
                    </SelectItem>
                    {["sentence", "title", "uppercase"].map((caseType) => {
                      // Mapping des emojis pour chaque cas de texte
                      const getTextCaseEmoji = (caseType: string) => {
                        switch (caseType) {
                          case "sentence": return "📝" // Cas de phrase
                          case "title": return "📰" // Cas de titre
                          case "uppercase": return "🔤" // Cas majuscule
                          default: return "📄"
                        }
                      }
                      
                      return (
                        <SelectItem key={caseType} value={caseType} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span>{getTextCaseEmoji(caseType)}</span>
                      {caseType}
                </div>
                        </SelectItem>
                      )
                    })}
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <span>✏️</span>
                        <span>Custom</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {textCase === 'custom' && (
                  <Input
                    value={customTextCase}
                    onChange={(e) => setCustomTextCase(e.target.value)}
                    placeholder="Enter custom text case..."
                    className="h-8 text-xs mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Highlight Style</label>
                <Select value={highlightStyle} onValueChange={(value) => setHighlightStyle(value as any)}>
                  <SelectTrigger className="w-full h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["none", "underline", "boxed", "glow", "gradient"].map((style) => {
                      // Mapping des emojis pour chaque style de surbrillance
                      const getHighlightStyleEmoji = (style: string) => {
                        switch (style) {
                          case "none": return "🚫" // Aucun style
                          case "underline": return "📝" // Soulignement
                          case "boxed": return "📦" // Encadré
                          case "glow": return "✨" // Lueur
                          case "gradient": return "🌈" // Dégradé
                          default: return "🎨"
                        }
                      }
                      
                      return (
                      <SelectItem key={style} value={style} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span>{getHighlightStyleEmoji(style)}</span>
                        {style}
                          </div>
                      </SelectItem>
                      )
                    })}
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <span>✏️</span>
                        <span>Custom</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {highlightStyle === 'custom' && (
                  <Input
                    value={customHighlightStyle}
                    onChange={(e) => setCustomHighlightStyle(e.target.value)}
                    placeholder="Enter custom highlight style..."
                    className="h-8 text-xs mt-2"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Letter Spacing ({letterSpacing}px)</label>
                <Slider
                  value={[letterSpacing]}
                  onValueChange={(value) => setLetterSpacing(value[0])}
                  max={5}
                  min={-2}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Line Height ({lineHeight})</label>
                <Slider
                  value={[lineHeight]}
                  onValueChange={(value) => setLineHeight(value[0])}
                  max={2}
                  min={0.8}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Brilliance ({brilliance}%)</label>
                <Slider
                  value={[brilliance]}
                  onValueChange={(value) => setBrilliance(value[0])}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Drop Shadow ({dropShadowIntensity}%)</label>
                <Slider
                  value={[dropShadowIntensity]}
                  onValueChange={(value) => setDropShadowIntensity(value[0])}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Accent Element</label>
                <Select value={accentElement} onValueChange={(value) => setAccentElement(value as any)}>
                  <SelectTrigger className="w-full h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["none", "line", "shape", "dot"].map((element) => {
                      // Mapping des emojis pour chaque élément d'accent
                      const getAccentElementEmoji = (element: string) => {
                        switch (element) {
                          case "none": return "🚫" // Aucun élément
                          case "line": return "📏" // Ligne
                          case "shape": return "🔷" // Forme
                          case "dot": return "⚫" // Point
                          default: return "🎨"
                        }
                      }
                      
                      return (
                      <SelectItem key={element} value={element} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span>{getAccentElementEmoji(element)}</span>
                        {element}
                          </div>
                      </SelectItem>
                      )
                    })}
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <span>✏️</span>
                        <span>Custom</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {accentElement === 'custom' && (
                  <Input
                    value={customAccentElement}
                    onChange={(e) => setCustomAccentElement(e.target.value)}
                    placeholder="Enter custom accent element..."
                    className="h-8 text-xs mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Motion Accent</label>
                <Select value={motionAccent} onValueChange={(value) => setMotionAccent(value as any)}>
                  <SelectTrigger className="w-full h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["none", "fade", "slide", "sweep"].map((motion) => {
                      // Mapping des emojis pour chaque accent de mouvement
                      const getMotionAccentEmoji = (motion: string) => {
                        switch (motion) {
                          case "none": return "🚫" // Aucun mouvement
                          case "fade": return "🌅" // Fondu
                          case "slide": return "➡️" // Glissement
                          case "sweep": return "🧹" // Balayage
                          default: return "🎬"
                        }
                      }
                      
                      return (
                      <SelectItem key={motion} value={motion} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span>{getMotionAccentEmoji(motion)}</span>
                        {motion}
                          </div>
                      </SelectItem>
                      )
                    })}
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <span>✏️</span>
                        <span>Custom</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {motionAccent === 'custom' && (
                  <Input
                    value={customMotionAccent}
                    onChange={(e) => setCustomMotionAccent(e.target.value)}
                    placeholder="Enter custom motion accent..."
                    className="h-8 text-xs mt-2"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Frosted Glass</label>
              <Switch
                checked={frostedGlass}
                onCheckedChange={setFrostedGlass}
                className="scale-75"
              />
            </div>
          </div>

          {/* Alignment & Positioning */}
          <div className="space-y-3 p-3 bg-muted/20 rounded-lg border">
            <div className="flex items-center gap-2">
              <Layout className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Alignment & Positioning</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Layout Mode</label>
              <Select value={layoutMode} onValueChange={(value) => setLayoutMode(value as any)}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select Layout Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center text-xs">
                        🚫
                      </div>
                      <div>
                        <div className="font-medium">None</div>
                        <div className="text-xs text-muted-foreground">No layout mode</div>
                      </div>
                    </div>
                  </SelectItem>
                  {["centered", "left", "right", "split"].map((mode) => {
                    // Mapping des emojis pour chaque mode de mise en page
                    const getLayoutModeEmoji = (mode: string) => {
                      switch (mode) {
                        case "centered": return "🎯" // Centré
                        case "left": return "⬅️" // Gauche
                        case "right": return "➡️" // Droite
                        case "split": return "↔️" // Divisé
                        default: return "📐"
                      }
                    }
                    
                    return (
                      <SelectItem key={mode} value={mode} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span>{getLayoutModeEmoji(mode)}</span>
                    {mode}
              </div>
                      </SelectItem>
                    )
                  })}
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <span>✏️</span>
                      <span>Custom</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {layoutMode === 'custom' && (
                <Input
                  value={customLayoutMode}
                  onChange={(e) => setCustomLayoutMode(e.target.value)}
                  placeholder="Enter custom layout mode..."
                  className="h-8 text-xs mt-2"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Vertical Position ({verticalPosition}%)</label>
                <Slider
                  value={[verticalPosition]}
                  onValueChange={(value) => setVerticalPosition(value[0])}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Horizontal Offset ({horizontalOffset}px)</label>
                <Slider
                  value={[horizontalOffset]}
                  onValueChange={(value) => setHorizontalOffset(value[0])}
                  max={100}
                  min={-100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Smart Anchor</label>
              <Switch
                checked={smartAnchor}
                onCheckedChange={setSmartAnchor}
                className="scale-75"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Safe Zones</label>
              <Switch
                checked={safeZones}
                onCheckedChange={setSafeZones}
                className="scale-75"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Casting & Multiplicity */}
      <Collapsible 
        open={expandedSections.casting} 
        onOpenChange={() => toggleSection('casting')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Casting & Multiplicity</span>
            </div>
            {expandedSections.casting ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          {/* Use Avatars Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">Include Avatars</label>
            <Switch
              checked={useAvatars}
              onCheckedChange={setUseAvatars}
              className="scale-75"
            />
          </div>

          {useAvatars && (
            <>
              {/* Avatar Selection */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Select Avatar</label>
                {loadingAvatars ? (
                  <div className="text-xs text-muted-foreground">Loading avatars...</div>
                ) : (
                  <Select 
                    value={useBasicAvatar ? "basic" : (selectedAvatarId || "")} 
                    onValueChange={(value) => {
                      if (value === "basic") {
                        setUseBasicAvatar(true)
                        setSelectedAvatarId("")
                      } else {
                        setUseBasicAvatar(false)
                        setSelectedAvatarId(value)
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Select an avatar" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="basic" className="text-xs">
                        <div className="flex items-center gap-2">
                          <User className="w-6 h-6 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Basic Avatar</div>
                            <div className="text-muted-foreground text-xs">Create a custom basic avatar</div>
                          </div>
                        </div>
                      </SelectItem>
                      {availableAvatars.map((avatar) => (
                        <SelectItem key={avatar.id} value={avatar.id} className="text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🎭</span>
                            <span className="font-medium">{avatar.persona_name || avatar.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Avatar Preview */}
              {selectedAvatarId && !useBasicAvatar && (() => {
                const selectedAvatar = availableAvatars.find(a => a.id === selectedAvatarId)
                if (!selectedAvatar) return null
                
                const avatarImageUrl = getAvatarImageUrl(selectedAvatar)
                return (
                  <div className="p-3 bg-muted/30 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {avatarImageUrl ? (
                        <img 
                          src={avatarImageUrl} 
                          alt={selectedAvatar.persona_name || selectedAvatar.title}
                          className="w-12 h-12 object-cover rounded-lg border border-border"
                          onError={(e) => {
                            console.error('🎭 Avatar image failed to load:', avatarImageUrl)
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-lg border border-border flex items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-primary text-sm">
                          {selectedAvatar.persona_name || selectedAvatar.title}
                        </p>
                        {selectedAvatar.description && (
                          <p className="text-xs text-muted-foreground">
                            {selectedAvatar.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Basic Avatar Customization */}
              {useBasicAvatar && (
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Basic Avatar Settings</span>
                  </div>
                  
                  {/* Demographics Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Demographics</span>
                      <div className="flex-1 h-px bg-border"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      {/* Age Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground flex items-center gap-2">
                          <span>🎂</span>
                          Age Range
                        </label>
                        <Select value={basicAvatarAge} onValueChange={(value) => setBasicAvatarAge(value as any)}>
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="Select age range" />
                          </SelectTrigger>
                          <SelectContent>
                            {["18-25", "26-35", "36-45", "46-55", "55+"].map((age) => {
                              // Mapping des emojis pour chaque tranche d'âge
                              const getAgeEmoji = (age: string) => {
                                switch (age) {
                                  case "18-25": return "🌱" // Jeune adulte
                                  case "26-35": return "👨‍💼" // Adulte professionnel
                                  case "36-45": return "👩‍💼" // Adulte établi
                                  case "46-55": return "👨‍🎓" // Adulte expérimenté
                                  case "55+": return "👴" // Senior
                                  default: return "👤"
                                }
                              }
                              
                              return (
                                <SelectItem key={age} value={age} className="text-sm">
                                  <div className="flex items-center gap-2">
                                    <span>{getAgeEmoji(age)}</span>
                                    <span>{age} years</span>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Gender Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground flex items-center gap-2">
                          <span>⚧</span>
                          Gender Identity
                        </label>
                        <Select value={basicAvatarGender} onValueChange={(value) => setBasicAvatarGender(value as any)}>
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Male", "Female", "Non-binary"].map((gender) => {
                              // Mapping des emojis pour chaque genre
                              const getGenderEmoji = (gender: string) => {
                                switch (gender) {
                                  case "Male": return "👨" // Homme
                                  case "Female": return "👩" // Femme
                                  case "Non-binary": return "🧑" // Non-binaire
                                  default: return "👤"
                                }
                              }
                              
                              return (
                                <SelectItem key={gender} value={gender} className="text-sm">
                                  <div className="flex items-center gap-2">
                                    <span>{getGenderEmoji(gender)}</span>
                                    <span>{gender}</span>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Ethnicity Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground flex items-center gap-2">
                          <span>🌍</span>
                          Ethnicity
                        </label>
                        <Select value={basicAvatarRace} onValueChange={(value) => setBasicAvatarRace(value as any)}>
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="Select ethnicity" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Caucasian", "African", "Asian", "Hispanic", "Middle Eastern", "Mixed", "Other"].map((race) => {
                              // Mapping des emojis pour chaque ethnicité - représentation précise
                              const getEthnicityEmoji = (race: string) => {
                                switch (race) {
                                  case "Caucasian": return "👱‍♂️" // Caucasien - homme blond
                                  case "African": return "👨🏿" // Africain - homme à la peau foncée
                                  case "Asian": return "👨🏻" // Asiatique - homme à la peau claire
                                  case "Hispanic": return "👨🏽" // Hispanique - homme à la peau mate
                                  case "Middle Eastern": return "👳‍♂️" // Moyen-Orient - homme avec turban
                                  case "Mixed": return "🧑🏼" // Mixte - personne à la peau intermédiaire
                                  case "Other": return "👤" // Autre - silhouette neutre
                                  default: return "🌍"
                                }
                              }
                              
                              return (
                                <SelectItem key={race} value={race} className="text-sm">
                                  <div className="flex items-center gap-2">
                                    <span>{getEthnicityEmoji(race)}</span>
                                    <span>{race}</span>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Appearance & Style Description</label>
                    <Textarea
                      value={basicAvatarDescription}
                      onChange={(e) => setBasicAvatarDescription(e.target.value)}
                      placeholder="Describe how the avatar should look, dress, and style (e.g., 'Professional business attire, confident smile, modern hairstyle')"
                      className="min-h-[60px] text-xs resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Avatar Role & Interaction */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Role</label>
                  <Select value={avatarRole} onValueChange={(value) => setAvatarRole(value as any)}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Model", "User", "Mascot", "Spokesperson"].map((role) => (
                        <SelectItem key={role} value={role} className="text-xs">
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Interaction</label>
                  <Select value={avatarInteraction} onValueChange={(value) => setAvatarInteraction(value as any)}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Select Interaction" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Holding", "Wearing", "Using", "Observing"].map((interaction) => (
                        <SelectItem key={interaction} value={interaction} className="text-xs">
                          {interaction}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Product Multiplicity & Angle Variety */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Product Count</label>
              <Select value={productMultiplicity} onValueChange={(value) => setProductMultiplicity(value as any)}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select Count" />
                </SelectTrigger>
                <SelectContent>
                  {["Single", "Lineup", "Bundle"].map((multiplicity) => {
                    // Mapping des emojis pour chaque type de multiplicité de produit
                    const getProductCountEmoji = (multiplicity: string) => {
                      switch (multiplicity) {
                        case "Single": return "📦" // Produit unique
                        case "Lineup": return "📋" // Alignement de produits
                        case "Bundle": return "🎁" // Paquet de produits
                        default: return "📦"
                      }
                    }
                    
                    return (
                    <SelectItem key={multiplicity} value={multiplicity} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span>{getProductCountEmoji(multiplicity)}</span>
                      {multiplicity}
                        </div>
                    </SelectItem>
                    )
                  })}
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <span>✏️</span>
                      <span>Custom</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {productMultiplicity === 'custom' && (
                <Input
                  value={customProductCount}
                  onChange={(e) => setCustomProductCount(e.target.value)}
                  placeholder="Enter custom product count..."
                  className="h-8 text-xs mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Angles ({angleVarietyCount})</label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-6 w-6 rounded-full"
                  onClick={() => setAngleVarietyCount(Math.max(1, angleVarietyCount - 1) as any)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-xs font-medium min-w-[20px] text-center">{angleVarietyCount}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-6 w-6 rounded-full"
                  onClick={() => setAngleVarietyCount(Math.min(5, angleVarietyCount + 1) as any)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Platform Target */}
      <Collapsible 
        open={expandedSections.platform} 
        onOpenChange={() => toggleSection('platform')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span className="text-sm font-medium">Platform Target</span>
            </div>
            {expandedSections.platform ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Platform (Optional)</label>
            <Select value={platformTarget || "Auto"} onValueChange={(value) => setPlatformTarget(value === "Auto" ? undefined : value as any)}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Auto" className="text-xs">
                  <div className="flex items-center gap-2">
                    <span>🤖</span>
                  Auto
                  </div>
                </SelectItem>
                {["Instagram", "Facebook", "TikTok", "YouTube", "Banner", "Print"].map((platform) => {
                  // Mapping des emojis pour chaque plateforme
                  const getPlatformEmoji = (platform: string) => {
                    switch (platform) {
                      case "Instagram": return "📸" // Instagram
                      case "Facebook": return "👥" // Facebook
                      case "TikTok": return "🎵" // TikTok
                      case "YouTube": return "📺" // YouTube
                      case "Banner": return "🖼️" // Bannière
                      case "Print": return "🖨️" // Impression
                      default: return "📱"
                    }
                  }
                  
                  return (
                  <SelectItem key={platform} value={platform} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span>{getPlatformEmoji(platform)}</span>
                    {platform}
                      </div>
                  </SelectItem>
                  )
                })}
                <SelectItem value="custom" className="text-xs">
                  <div className="flex items-center gap-2">
                    <span>✏️</span>
                    <span>Custom</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {platformTarget === 'custom' as any && (
              <Input
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
                placeholder="Enter custom platform..."
                className="h-8 text-xs mt-2"
              />
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">Generated Mockups</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => setGeneratedImages([])}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {generatedImages.map((imageUrl, index) => {
              const displayUrl = signedImageUrls[index] || imageUrl
              return (
                <div key={index} className="relative group">
                  {urlsLoading ? (
                    <div className="w-full h-32 flex items-center justify-center bg-muted rounded-md">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <img 
                      src={displayUrl} 
                      alt={`Generated mockup ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
                    <Button variant="secondary" size="sm" className="text-xs h-6">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button variant="secondary" size="sm" className="text-xs h-6">
                      <Download className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <Button 
        className="w-full h-9 text-sm font-medium bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed" 
        disabled={!prompt.trim() || isGenerating}
        onClick={handleGenerate}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Product Mockups
          </>
        )}
      </Button>
    </div>

    </>
  )
}
