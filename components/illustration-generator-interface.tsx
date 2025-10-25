"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  X,
  Upload,
  FileText,
  Palette,
  Type,
  Layout,
  MessageSquare,
  Download,
  Sparkles,
  Eye,
  Settings,
  Zap,
  Image as ImageIcon,
  Camera,
  Layers,
  Target,
  Heart,
  Leaf,
  Moon,
  Sun,
  Droplets,
  Zap as Energy,
  Gem,
  PartyPopper
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { useCacheContext } from "@/hooks/use-cache-context"
import { cn } from "@/lib/utils"
import { filterFilledFields } from "@/lib/utils/prompt-builder"
import { getSupportedAspectRatios } from '@/lib/utils/aspect-ratio-utils'
import type { FalModel } from '@/lib/utils/fal-generation'
import { GenerationLoading } from "@/components/ui/generation-loading"
import { GenerationError } from "@/components/ui/generation-error"
import { PreviousGenerations } from "@/components/ui/previous-generations"
import { toast as sonnerToast } from "sonner"

interface IllustrationGeneratorInterfaceProps {
  onClose: () => void
  projectTitle: string
  projectData?: {title: string, image: string, description: string, isPublic?: boolean} | null
}

// Style maps and constants
const ART_DIRECTIONS = [
  { value: "flat-vector", label: "Flat Vector", description: "Clean, minimal 2D graphics", emoji: "📐" },
  { value: "isometric", label: "Isometric", description: "3D perspective with equal angles", emoji: "🎲" },
  { value: "stylized-3d", label: "Stylized 3D", description: "Simplified 3D with artistic flair", emoji: "🎨" },
  { value: "watercolor", label: "Watercolor", description: "Soft, flowing paint effects", emoji: "💧" },
  { value: "sketch", label: "Sketch", description: "Hand-drawn, organic lines", emoji: "✏️" },
  { value: "editorial", label: "Editorial", description: "Professional, magazine-style", emoji: "📰" },
  { value: "cartoon", label: "Cartoon", description: "Playful, animated style", emoji: "🎭" },
  { value: "surreal-concept", label: "Surreal Concept", description: "Dreamlike, abstract imagery", emoji: "🌀" },
  { value: "photorealistic", label: "Photorealistic", description: "Lifelike, detailed rendering", emoji: "📷" },
  { value: "minimalist", label: "Minimalist", description: "Clean, essential elements only", emoji: "⚪" },
  { value: "vintage", label: "Vintage", description: "Retro, nostalgic aesthetic", emoji: "📻" },
  { value: "cyberpunk", label: "Cyberpunk", description: "Futuristic, neon-lit style", emoji: "🌃" }
]

const VISUAL_INFLUENCES = {
  "flat-vector": [
    { value: "bauhaus-geometry", label: "Bauhaus Geometry", description: "Geometric precision", emoji: "🔷" },
    { value: "dribbble-minimal", label: "Dribbble Minimal", description: "Clean, modern design", emoji: "💎" },
    { value: "retro-80s", label: "Retro 80s", description: "Neon and synthwave vibes", emoji: "🌈" },
    { value: "material-design", label: "Material Design", description: "Google's design language", emoji: "🎯" }
  ],
  "isometric": [
    { value: "pixar-soft", label: "Pixar Soft", description: "Friendly, rounded forms", emoji: "🎪" },
    { value: "retro-80s", label: "Retro 80s", description: "Vibrant, nostalgic colors", emoji: "🌈" },
    { value: "tech-illustration", label: "Tech Illustration", description: "Modern, clean tech style", emoji: "💻" },
    { value: "game-art", label: "Game Art", description: "Video game aesthetics", emoji: "🎮" }
  ],
  "stylized-3d": [
    { value: "pixar-soft", label: "Pixar Soft", description: "Smooth, friendly 3D", emoji: "🎪" },
    { value: "vogue-editorial", label: "Vogue Editorial", description: "High-fashion styling", emoji: "👗" },
    { value: "blender-cycles", label: "Blender Cycles", description: "Realistic rendering", emoji: "🔧" },
    { value: "low-poly", label: "Low Poly", description: "Geometric, faceted style", emoji: "🔺" }
  ],
  "watercolor": [
    { value: "ukiyo-e", label: "Ukiyo-e", description: "Japanese woodblock style", emoji: "🎌" },
    { value: "ghibli-warm", label: "Ghibli Warm", description: "Studio Ghibli aesthetic", emoji: "🌿" },
    { value: "impressionist", label: "Impressionist", description: "Soft, painterly strokes", emoji: "🌻" },
    { value: "botanical", label: "Botanical", description: "Natural, organic forms", emoji: "🌱" }
  ],
  "sketch": [
    { value: "behance-editorial", label: "Behance Editorial", description: "Professional sketches", emoji: "✍️" },
    { value: "vogue-editorial", label: "Vogue Editorial", description: "Fashion illustration", emoji: "👗" },
    { value: "architectural", label: "Architectural", description: "Technical drawing style", emoji: "🏗️" },
    { value: "life-drawing", label: "Life Drawing", description: "Classical figure study", emoji: "👤" }
  ],
  "editorial": [
    { value: "behance-editorial", label: "Behance Editorial", description: "Modern editorial style", emoji: "✍️" },
    { value: "vogue-editorial", label: "Vogue Editorial", description: "High-fashion editorial", emoji: "👗" },
    { value: "new-yorker", label: "New Yorker", description: "Classic magazine style", emoji: "📰" },
    { value: "national-geographic", label: "National Geographic", description: "Documentary style", emoji: "🌍" }
  ],
  "cartoon": [
    { value: "pixar-soft", label: "Pixar Soft", description: "Disney/Pixar animation", emoji: "🎪" },
    { value: "ghibli-warm", label: "Ghibli Warm", description: "Studio Ghibli charm", emoji: "🌿" },
    { value: "adventure-time", label: "Adventure Time", description: "Surreal cartoon style", emoji: "🎈" },
    { value: "rick-morty", label: "Rick & Morty", description: "Adult animation style", emoji: "🧪" }
  ],
  "surreal-concept": [
    { value: "vogue-editorial", label: "Vogue Editorial", description: "High-fashion surrealism", emoji: "👗" },
    { value: "behance-editorial", label: "Behance Editorial", description: "Modern surreal art", emoji: "✍️" },
    { value: "dali-inspired", label: "Dalí Inspired", description: "Classic surrealism", emoji: "🕰️" },
    { value: "magritte-style", label: "Magritte Style", description: "Conceptual surrealism", emoji: "🍎" }
  ],
  "photorealistic": [
    { value: "hyperrealism", label: "Hyperrealism", description: "Ultra-detailed realism", emoji: "🔍" },
    { value: "cinematic", label: "Cinematic", description: "Movie-quality rendering", emoji: "🎬" },
    { value: "product-photography", label: "Product Photography", description: "Commercial quality", emoji: "📦" },
    { value: "portrait-photography", label: "Portrait Photography", description: "Professional portraits", emoji: "👤" }
  ],
  "minimalist": [
    { value: "scandinavian", label: "Scandinavian", description: "Nordic design principles", emoji: "❄️" },
    { value: "japanese-wabi-sabi", label: "Japanese Wabi-Sabi", description: "Imperfect beauty", emoji: "🍃" },
    { value: "swiss-design", label: "Swiss Design", description: "Typography-focused", emoji: "📝" },
    { value: "brutalist", label: "Brutalist", description: "Raw, functional beauty", emoji: "🧱" }
  ],
  "vintage": [
    { value: "art-deco", label: "Art Deco", description: "1920s geometric luxury", emoji: "💎" },
    { value: "mid-century", label: "Mid-Century", description: "1950s-60s modernism", emoji: "🪑" },
    { value: "victorian", label: "Victorian", description: "Ornate, detailed style", emoji: "🏰" },
    { value: "retro-futurism", label: "Retro Futurism", description: "Past's vision of future", emoji: "🚀" }
  ],
  "cyberpunk": [
    { value: "blade-runner", label: "Blade Runner", description: "Neo-noir sci-fi", emoji: "🌃" },
    { value: "ghost-in-shell", label: "Ghost in the Shell", description: "Anime cyberpunk", emoji: "🤖" },
    { value: "matrix-style", label: "Matrix Style", description: "Digital rain aesthetic", emoji: "💚" },
    { value: "synthwave", label: "Synthwave", description: "80s neon nostalgia", emoji: "🌆" }
  ]
}

const MEDIUM_TEXTURES = [
  { value: "paper-grain", label: "Paper Grain", description: "Natural paper texture", emoji: "📄" },
  { value: "digital-smooth", label: "Digital Smooth", description: "Clean, vector-like finish", emoji: "💻" },
  { value: "canvas", label: "Canvas", description: "Traditional painting surface", emoji: "🖼️" },
  { value: "glossy-3d", label: "Glossy 3D", description: "Shiny, reflective surface", emoji: "✨" },
  { value: "pencil", label: "Pencil", description: "Graphite drawing texture", emoji: "✏️" },
  { value: "charcoal", label: "Charcoal", description: "Soft, smudged texture", emoji: "⚫" },
  { value: "ink-wash", label: "Ink Wash", description: "Flowing, transparent ink", emoji: "🖋️" },
  { value: "acrylic", label: "Acrylic", description: "Bold, opaque paint", emoji: "🎨" },
  { value: "oil-paint", label: "Oil Paint", description: "Rich, layered texture", emoji: "🖌️" },
  { value: "pastel", label: "Pastel", description: "Soft, chalky finish", emoji: "🌸" },
  { value: "metallic", label: "Metallic", description: "Shiny, reflective metal", emoji: "🔩" },
  { value: "matte", label: "Matte", description: "Non-reflective, flat finish", emoji: "🎯" }
]

const LIGHTING_PRESETS = [
  { value: "soft-ambient", label: "Soft Ambient", description: "Even, gentle lighting", emoji: "💡" },
  { value: "golden-hour", label: "Golden Hour", description: "Warm, sunset lighting", emoji: "🌅" },
  { value: "studio-spot", label: "Studio Spot", description: "Focused, dramatic light", emoji: "🎬" },
  { value: "diffused", label: "Diffused", description: "Soft, scattered light", emoji: "☁️" },
  { value: "glow-rim", label: "Glow Rim", description: "Backlit, glowing edges", emoji: "✨" },
  { value: "dramatic-shadow", label: "Dramatic Shadow", description: "High contrast, moody", emoji: "🌑" },
  { value: "neon-glow", label: "Neon Glow", description: "Electric, vibrant lighting", emoji: "💫" },
  { value: "natural-daylight", label: "Natural Daylight", description: "Clear, bright sunlight", emoji: "☀️" },
  { value: "moonlight", label: "Moonlight", description: "Cool, silvery light", emoji: "🌙" },
  { value: "candlelight", label: "Candlelight", description: "Warm, flickering glow", emoji: "🕯️" },
  { value: "fluorescent", label: "Fluorescent", description: "Harsh, artificial light", emoji: "💡" },
  { value: "volumetric", label: "Volumetric", description: "Visible light rays", emoji: "🌫️" }
]

const PURPOSE_OPTIONS = [
  { value: "hero-visual", label: "Hero Visual", emoji: "🦸" },
  { value: "scene", label: "Scene", emoji: "🎬" },
  { value: "icon", label: "Icon", emoji: "🔷" },
  { value: "diagram", label: "Diagram", emoji: "📊" },
  { value: "background", label: "Background", emoji: "🖼️" },
  { value: "thumbnails-covers", label: "Thumbnails & Covers", emoji: "🎨" }
]

const MOOD_CONTEXTS = [
  { value: "happy", label: "Happy", emoji: "😊", icon: Heart },
  { value: "calm", label: "Calm", emoji: "🌿", icon: Leaf },
  { value: "mysterious", label: "Mysterious", emoji: "🌑", icon: Moon },
  { value: "hopeful", label: "Hopeful", emoji: "🌅", icon: Sun },
  { value: "tragic", label: "Tragic", emoji: "💧", icon: Droplets },
  { value: "energetic", label: "Energetic", emoji: "⚡", icon: Energy },
  { value: "elegant", label: "Elegant", emoji: "💎", icon: Gem },
  { value: "playful", label: "Playful", emoji: "🎈", icon: PartyPopper }
]

const COLOR_PALETTE_MODES = [
  { value: "brand-core", label: "Brand Core", emoji: "🎯" },
  { value: "analogous", label: "Analogous", emoji: "🌈" },
  { value: "complementary", label: "Complementary", emoji: "🎨" },
  { value: "neutral", label: "Neutral", emoji: "⚪" }
]

const FONT_STYLES = [
  { value: "playfair", label: "Playfair", emoji: "📖" },
  { value: "inter", label: "Inter", emoji: "💼" },
  { value: "lora", label: "Lora", emoji: "✍️" },
  { value: "bebas-neue", label: "Bebas Neue", emoji: "🎯" }
]

const COMPOSITION_TEMPLATES = [
  { value: "hero-scene", label: "Hero Scene", emoji: "🌟" },
  { value: "concept-diagram", label: "Concept Diagram", emoji: "📊" },
  { value: "character-portrait", label: "Character Portrait", emoji: "👤" },
  { value: "scene-composition", label: "Scene Composition", emoji: "🎭" },
  { value: "background-texture", label: "Background Texture", emoji: "🖼️" },
  { value: "icon-set", label: "Icon Set (Batch)", emoji: "🔷" },
  { value: "poster-layout", label: "Poster Layout", emoji: "📰" }
]

const CAMERA_ANGLES = [
  { value: "flat", label: "Flat", emoji: "➖" },
  { value: "isometric", label: "Isometric", emoji: "📐" },
  { value: "perspective", label: "Perspective", emoji: "👁️" }
]

const SUBJECT_PLACEMENTS = [
  { value: "left", label: "Left", emoji: "⬅️" },
  { value: "center", label: "Center", emoji: "⏺️" },
  { value: "right", label: "Right", emoji: "➡️" }
]

const WATERMARK_PLACEMENTS = [
  { value: "top-right", label: "Top-right", emoji: "↗️" },
  { value: "bottom-left", label: "Bottom-left", emoji: "↙️" },
  { value: "none", label: "None", emoji: "⭕" }
]

const OUTLINE_STYLES = [
  { value: "hard", label: "Hard", emoji: "⬛" },
  { value: "soft", label: "Soft", emoji: "⚪" },
  { value: "none", label: "None", emoji: "◻️" }
]

const ALL_ASPECT_RATIOS = [
  { 
    value: "1:1", 
    label: "Square (1:1)", 
    description: "Perfect for profile pictures, social media avatars",
    category: "Profile & Social",
    emoji: "🟦",
    icon: "⬜"
  },
  { 
    value: "3:4", 
    label: "Portrait (3:4)", 
    description: "Classic portrait format, ideal for headshots",
    category: "Portrait & Headshot",
    emoji: "📱",
    icon: "📱"
  },
  { 
    value: "4:5", 
    label: "Instagram Portrait (4:5)", 
    description: "Instagram feed format, great for character reveals",
    category: "Social Media",
    emoji: "📷",
    icon: "📷"
  },
  { 
    value: "2:3", 
    label: "Vertical (2:3)", 
    description: "Tall format, perfect for full-body character shots",
    category: "Full Body",
    emoji: "📏",
    icon: "📏"
  },
  { 
    value: "16:9", 
    label: "Wide (16:9)", 
    description: "Landscape format, great for banners and headers",
    category: "Banner & Header",
    emoji: "🖥️",
    icon: "🖥️"
  },
  { 
    value: "4:3", 
    label: "Standard (4:3)", 
    description: "Traditional format, versatile for various uses",
    category: "General Use",
    emoji: "🖼️",
    icon: "🖼️"
  },
  { 
    value: "9:16", 
    label: "Story (9:16)", 
    description: "Vertical story format, perfect for mobile stories",
    category: "Stories & Mobile",
    emoji: "📲",
    icon: "📲"
  },
  { 
    value: "21:9", 
    label: "Ultrawide (21:9)", 
    description: "Cinematic format, great for dramatic presentations",
    category: "Cinematic",
    emoji: "🎬",
    icon: "🎬"
  }
]

export function IllustrationGeneratorInterface({ onClose, projectTitle, projectData }: IllustrationGeneratorInterfaceProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { invalidateSection } = useCacheContext()

  // Entry & Intent
  const [title, setTitle] = useState("")
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState("Nano-banana")
  const [purpose, setPurpose] = useState("")
  const [referenceImages, setReferenceImages] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [aspectRatio, setAspectRatio] = useState("1:1") // Default to Square

  // Dynamic aspect ratio filtering based on selected model
  const supportedRatios = getSupportedAspectRatios(model as FalModel || 'Nano-banana')
  const availableAspectRatios = ALL_ASPECT_RATIOS.filter(ar => 
    supportedRatios.includes(ar.value)
  )

  // Art Direction & Visual Style
  const [artDirection, setArtDirection] = useState("")
  const [visualInfluence, setVisualInfluence] = useState("")
  const [mediumTexture, setMediumTexture] = useState("")
  const [lightingPreset, setLightingPreset] = useState("")
  const [outlineStyle, setOutlineStyle] = useState("hard")

  // Mood Context
  const [moodContext, setMoodContext] = useState("")
  const [toneIntensity, setToneIntensity] = useState([50])
  const [paletteWarmth, setPaletteWarmth] = useState([50])
  const [expressionHarmony, setExpressionHarmony] = useState(false)

  // Brand Sync & Palette
  const [brandSync, setBrandSync] = useState(false)
  const [colorPaletteMode, setColorPaletteMode] = useState("")
  const [accentColor, setAccentColor] = useState("#1E90FF")
  const [fontStyle, setFontStyle] = useState("")
  const [watermarkPlacement, setWatermarkPlacement] = useState("none")
  const [logoImage, setLogoImage] = useState<File | null>(null)

  // Composition Template
  const [compositionTemplate, setCompositionTemplate] = useState("")
  const [cameraAngle, setCameraAngle] = useState("")
  const [depthControl, setDepthControl] = useState([50])
  const [subjectPlacement, setSubjectPlacement] = useState("center")
  const [safeZoneOverlay, setSafeZoneOverlay] = useState(false)

  // Smart behavior states
  const [smartMessage, setSmartMessage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Reset aspect ratio when model changes to unsupported ratio
  useEffect(() => {
    if (model && aspectRatio) {
      const supported = getSupportedAspectRatios(model as FalModel)
      if (!supported.includes(aspectRatio)) {
        setAspectRatio("1:1")
      }
    }
  }, [model])

  // Smart behavior logic
  useEffect(() => {
    let message = ""

    // Art Direction changes
    if (artDirection === "flat-vector") {
      setLightingPreset("") // Disable lighting for flat vector
      setMediumTexture("digital-smooth") // Auto-select appropriate texture
      message = "DreamCut disabled lighting and selected digital smooth texture for flat vector style."
    }

    if (artDirection === "watercolor") {
      setMediumTexture("paper-grain") // Auto-select paper texture
      setLightingPreset("soft-ambient") // Soft lighting for watercolor
      message = "DreamCut selected paper grain texture and soft ambient lighting for watercolor style."
    }

    if (artDirection === "sketch") {
      setMediumTexture("pencil") // Auto-select pencil texture
      setLightingPreset("") // No lighting for sketches
      message = "DreamCut selected pencil texture and disabled lighting for sketch style."
    }

    if (artDirection === "photorealistic") {
      setMediumTexture("canvas") // Auto-select canvas
      setLightingPreset("natural-daylight") // Natural lighting
      message = "DreamCut selected canvas texture and natural daylight for photorealistic style."
    }

    if (artDirection === "cyberpunk") {
      setLightingPreset("neon-glow") // Auto-select neon lighting
      setMediumTexture("metallic") // Metallic texture
      message = "DreamCut selected neon glow lighting and metallic texture for cyberpunk style."
    }

    if (purpose === "icon") {
      setArtDirection("flat-vector") // Force flat vector for icons
      setLightingPreset("") // Disable lighting
      message = "DreamCut forced flat vector style and disabled lighting for icon generation."
    }

    if (purpose === "thumbnails-covers") {
      setCompositionTemplate("hero-scene") // Force hero scene composition for thumbnails
      setLightingPreset("golden-hour") // Warm, engaging lighting for thumbnails
      setToneIntensity([75]) // High contrast for visibility at small sizes
      setSubjectPlacement("center") // Center subject for thumbnail focus
      setSafeZoneOverlay(true) // Enable safe zone for text overlays
      message = "DreamCut optimized composition, lighting, and contrast for thumbnail visibility and engagement."
    }

    // Mood context changes
    if (moodContext === "calm") {
      setToneIntensity([30]) // Lower contrast
      setLightingPreset("soft-ambient") // Soft lighting
      message = "DreamCut tuned lighting and edge softness to match your calm mood."
    } else if (moodContext === "playful") {
      setToneIntensity([80]) // Higher saturation
      setLightingPreset("golden-hour") // Warm lighting
      message = "DreamCut boosted saturation and brightened highlights for playful mood."
    } else if (moodContext === "elegant") {
      setFontStyle("playfair") // Auto-apply serif
      setLightingPreset("studio-spot") // Dramatic lighting
      message = "DreamCut introduced softer gradients and minimal shapes for elegant style."
    } else if (moodContext === "mysterious") {
      setLightingPreset("dramatic-shadow") // Dark, moody lighting
      setToneIntensity([20]) // Low contrast
      message = "DreamCut applied dramatic shadows and low contrast for mysterious mood."
    } else if (moodContext === "energetic") {
      setLightingPreset("neon-glow") // Bright, electric lighting
      setToneIntensity([90]) // High contrast
      message = "DreamCut applied neon glow and high contrast for energetic mood."
    }

    // Brand sync changes
    if (brandSync) {
      setColorPaletteMode("brand-core")
      message = "DreamCut locked color palette to brand core colors."
    }

    // Template changes
    if (compositionTemplate === "icon-set") {
      setArtDirection("flat-vector")
      setLightingPreset("")
      message = "DreamCut forced consistent grid and shared palette for icon set."
    }

    if (compositionTemplate === "hero-scene") {
      setLightingPreset("golden-hour") // Hero scenes often use warm lighting
      message = "DreamCut applied golden hour lighting for hero scene composition."
    }

    // Brand color warning
    if (brandSync && accentColor === "#1E90FF" && moodContext === "calm") {
      message = "Your brand blue (#1E90FF) is too cold for a Calm mood — shifting hue slightly warmer."
      setAccentColor("#4A90E2") // Warmer blue
    }

    setSmartMessage(message)
  }, [artDirection, moodContext, brandSync, compositionTemplate, accentColor, purpose])

  // Update visual influences when art direction changes
  useEffect(() => {
    if (artDirection && VISUAL_INFLUENCES[artDirection as keyof typeof VISUAL_INFLUENCES]) {
      setVisualInfluence("") // Reset to allow new selection
    }
  }, [artDirection])


  const handleReferenceImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    processFiles(files)
  }

  const processFiles = (files: File[]) => {
    // Validate file types
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file.`,
          variant: "destructive"
        })
        return false
      }
      return true
    })

    // Check total count
    if (validFiles.length + referenceImages.length > 3) {
      toast({
        title: "Too many images",
        description: "Maximum 3 reference images allowed.",
        variant: "destructive"
      })
      return
    }

    // Check file sizes (max 10MB per file)
    const oversizedFiles = validFiles.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: `${oversizedFiles[0].name} is larger than 10MB.`,
        variant: "destructive"
      })
      return
    }

    setReferenceImages(prev => [...prev, ...validFiles])
    
    if (validFiles.length > 0) {
      toast({
        title: "Images uploaded",
        description: `Added ${validFiles.length} reference image(s).`,
      })
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(event.dataTransfer.files)
    processFiles(files)
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogoImage(file)
    }
  }

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for your illustration.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)

    try {
      const formData = new FormData()

      // Collect all creative fields
      const allFields = {
        // Art Direction & Visual Style
        artDirection,
        visualInfluence,
        mediumTexture,
        lightingPreset,
        outlineStyle,
        
        // Mood Context
        moodContext,
        toneIntensity: toneIntensity[0],
        paletteWarmth: paletteWarmth[0],
        expressionHarmony,
        
        // Brand Sync & Palette
        brandSync,
        colorPaletteMode,
        accentColor,
        fontStyle,
        watermarkPlacement,
        
        // Composition Template
        compositionTemplate,
        cameraAngle,
        depthControl: depthControl[0],
        subjectPlacement,
        safeZoneOverlay
      }

      // Filter to only filled fields (excludes empty/metadata fields)
      const filledFields = filterFilledFields(allFields)

      // Add original prompt
      formData.append('prompt', prompt)
      
      // Add metadata fields (needed for database/tracking)
      formData.append('title', title)
      formData.append('model', model)
      formData.append('purpose', purpose)
      formData.append('aspectRatio', aspectRatio)
      
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
      referenceImages.forEach((file, index) => {
        formData.append(`referenceImage_${index}`, file)
      })

      // Add logo if present
      if (logoImage) {
        formData.append('logoImage', logoImage)
      }


      const response = await fetch('/api/illustrations', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate illustration')
      }

      const result = await response.json()

      sonnerToast.success("🎨 Illustration Generated!", {
        description: `Successfully created illustration(s) for "${projectTitle}". Check your library to view them!`,
        duration: 5000,
      })

      // Invalidate cache to refresh the illustrations section
      await invalidateSection('illustrations')

      onClose()

    } catch (error) {
      console.error('Illustration generation failed:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate illustration. Please try again."
      setGenerationError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const getAvailableVisualInfluences = () => {
    if (!artDirection) return []
    return VISUAL_INFLUENCES[artDirection as keyof typeof VISUAL_INFLUENCES] || []
  }

  const isLightingDisabled = () => {
    return artDirection === "flat-vector" || purpose === "icon"
  }


  return (
    <>
      {/* Loading Overlay */}
      {isGenerating && (
        <GenerationLoading 
          model={model as "Nano-banana" | "gpt-image-1" | "seedream-v4"}
          onCancel={() => setIsGenerating(false)}
        />
      )}

      {/* Error Overlay */}
      {generationError && (
        <GenerationError
          error={generationError}
          model={model as "Nano-banana" | "gpt-image-1" | "seedream-v4"}
          onRetry={() => {
            setGenerationError(null)
            handleGenerate()
          }}
          onClose={() => setGenerationError(null)}
        />
      )}

      <div className="bg-background border border-border rounded-md max-h-[calc(100vh-8rem)] flex flex-col">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between p-2 border-b border-border sticky top-0 bg-background z-10">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h3 className="text-xs font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent">
            Generate Illustrations for: {projectTitle}
          </h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 shrink-0">
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hover p-2 pb-4 space-y-2">
        {/* Smart Message */}
        {smartMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-800">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              {smartMessage}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {/* Entry & Intent */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent border-b pb-1">Entry & Intent</h4>
            <div className="space-y-2">
              <div>
                <Label htmlFor="title" className="text-xs">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter illustration title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="prompt" className="text-xs">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Flat vector hero of people planting trees."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="model" className="text-xs">AI Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
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

              <hr className="" />

              <div>
                <Label htmlFor="purpose" className="text-xs">Purpose Selector</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                <SelectContent>
                  {PURPOSE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{option.emoji}</span>
                        <span className="text-xs">{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Reference Images (optional)</Label>
                <div className="mt-1 space-y-2">
                  {/* Drag & Drop Zone */}
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer",
                      isDragOver 
                        ? "border-blue-400 bg-blue-50" 
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
                      referenceImages.length > 0 && "border-green-300 bg-green-50"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('reference-file-input')?.click()}
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">
                          {referenceImages.length > 0 
                            ? `${referenceImages.length}/3 images uploaded` 
                            : "Drop images here or click to browse"
                          }
                        </span>
                        <p className="text-gray-500 mt-1">
                          Supports JPG, PNG, GIF • Max 10MB each • Up to 3 images
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hidden file input */}
                  <Input
                    id="reference-file-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReferenceImageUpload}
                    className="hidden"
                  />

                  {/* Image previews */}
                  {referenceImages.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">
                          Reference Images ({referenceImages.length}/3)
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReferenceImages([])}
                          className="h-6 text-xs"
                        >
                          Clear All
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {referenceImages.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Reference ${index + 1}`}
                              className="w-full h-20 object-cover rounded border shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded border" />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeReferenceImage(index)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <div className="absolute bottom-1 left-1 right-1">
                              <div className="bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded truncate">
                                {file.name}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>


              <div className="space-y-2">
                <Label htmlFor="aspect-ratio" className="text-xs">Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select aspect ratio">
                      {aspectRatio && (() => {
                        const selectedOption = ALL_ASPECT_RATIOS.find(option => option.value === aspectRatio)
                        return selectedOption ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{selectedOption.icon}</span>
                            <span>{selectedOption.label}</span>
                          </div>
                        ) : null
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableAspectRatios.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{option.icon}</span>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                            <span className="text-xs text-blue-600">{option.category}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Art Direction & Visual Style */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent border-b pb-1">🎨 Art Direction & Visual Style</h4>
            <div className="space-y-2">
              <div>
                <Label htmlFor="art-direction" className="text-xs">Art Direction</Label>
                <Select value={artDirection} onValueChange={setArtDirection}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select art direction" />
                  </SelectTrigger>
                <SelectContent>
                  {ART_DIRECTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{option.emoji}</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="visual-influence" className="text-xs">Visual Influence</Label>
                <Select
                  value={visualInfluence}
                  onValueChange={setVisualInfluence}
                  disabled={!artDirection}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select visual influence" />
                  </SelectTrigger>
                <SelectContent>
                  {getAvailableVisualInfluences().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{option.emoji}</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="medium-texture" className="text-xs">Medium Texture</Label>
                <Select value={mediumTexture} onValueChange={setMediumTexture}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select medium texture" />
                  </SelectTrigger>
                <SelectContent>
                  {MEDIUM_TEXTURES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{option.emoji}</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lighting-preset" className="text-xs">Lighting Preset</Label>
                <Select
                  value={lightingPreset}
                  onValueChange={setLightingPreset}
                  disabled={isLightingDisabled()}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select lighting preset" />
                  </SelectTrigger>
                <SelectContent>
                  {LIGHTING_PRESETS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{option.emoji}</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
                {isLightingDisabled() && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Lighting disabled for {artDirection === "flat-vector" ? "flat vector" : "icon"} style
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="outline-style" className="text-xs">Outline & Edge Style</Label>
                <Select value={outlineStyle} onValueChange={setOutlineStyle}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select outline style" />
                  </SelectTrigger>
                <SelectContent>
                  {OUTLINE_STYLES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{option.emoji}</span>
                        <span className="text-xs">{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Mood Context */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent border-b pb-1">🎭 Mood Context</h4>
            <hr className="" />
            <div className="space-y-2">
              <div>
                <Label htmlFor="mood-context" className="text-xs">Mood Context</Label>
                <Select value={moodContext} onValueChange={setMoodContext}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select mood context" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOOD_CONTEXTS.map((mood) => {
                      const IconComponent = mood.icon
                      return (
                        <SelectItem key={mood.value} value={mood.value}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{mood.emoji}</span>
                            <IconComponent className="h-3 w-3" />
                            <span className="text-xs">{mood.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Tone Intensity: {toneIntensity[0]}%</Label>
                <Slider
                  value={toneIntensity}
                  onValueChange={setToneIntensity}
                  max={100}
                  step={1}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Adjusts contrast, saturation, texture depth
                </p>
              </div>

              <div>
                <Label className="text-xs">Palette Warmth: {paletteWarmth[0]}%</Label>
                <Slider
                  value={paletteWarmth}
                  onValueChange={setPaletteWarmth}
                  max={100}
                  step={1}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Warm → Cool spectrum
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="expression-harmony"
                  checked={expressionHarmony}
                  onCheckedChange={setExpressionHarmony}
                  className="scale-75"
                />
                <Label htmlFor="expression-harmony" className="text-xs">
                  Expression Harmony
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Aligns character expressions & background tone
              </p>
            </div>
          </div>

          {/* Brand Sync & Palette */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent border-b pb-1">🎨 Brand Sync & Palette</h4>
            <hr className="" />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="brand-sync"
                  checked={brandSync}
                  onCheckedChange={setBrandSync}
                  className="scale-75"
                />
                <Label htmlFor="brand-sync" className="text-xs">Brand Sync</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Pulls Brand Kit (colors, fonts, logo)
              </p>

              <div className="space-y-2">
                <Label htmlFor="color-palette-mode" className="text-xs">Color Palette Mode</Label>
                <Select value={colorPaletteMode} onValueChange={setColorPaletteMode}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select color palette mode" />
                  </SelectTrigger>
                <SelectContent>
                  {COLOR_PALETTE_MODES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{option.emoji}</span>
                        <span className="text-xs">{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accent-color" className="text-xs">Accent Control</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#1E90FF"
                    className="flex-1 h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-style" className="text-xs">Font Style (for text inside illustration)</Label>
                <Select value={fontStyle} onValueChange={setFontStyle}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select font style" />
                  </SelectTrigger>
                <SelectContent>
                  {FONT_STYLES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{option.emoji}</span>
                        <span className="text-xs">{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="watermark-placement" className="text-xs">Logo Placement</Label>
                <Select value={watermarkPlacement} onValueChange={setWatermarkPlacement}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select watermark placement" />
                  </SelectTrigger>
                <SelectContent>
                  {WATERMARK_PLACEMENTS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{option.emoji}</span>
                        <span className="text-xs">{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              {watermarkPlacement !== "none" && (
                <div>
                  <Label className="text-xs">Logo Image Upload</Label>
                  <div className="mt-1 space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="h-8 text-xs"
                    />
                    {logoImage && (
                      <div className="relative w-20 h-20">
                        <img
                          src={URL.createObjectURL(logoImage)}
                          alt="Logo preview"
                          className="w-full h-full object-cover rounded border"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                          onClick={() => setLogoImage(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Composition Template */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent border-b pb-1">📐 Composition Template</h4>
            <hr className="" />
            <div className="space-y-2">
              <div className="space-y-2">
                <Label htmlFor="composition-template" className="text-xs">Composition Template</Label>
                <Select value={compositionTemplate} onValueChange={setCompositionTemplate}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select composition template" />
                  </SelectTrigger>
                <SelectContent>
                  {COMPOSITION_TEMPLATES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{option.emoji}</span>
                        <span className="text-xs">{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="camera-angle" className="text-xs">Camera Angle</Label>
                <Select value={cameraAngle} onValueChange={setCameraAngle}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select camera angle" />
                  </SelectTrigger>
                <SelectContent>
                  {CAMERA_ANGLES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{option.emoji}</span>
                        <span className="text-xs">{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Depth Control: {depthControl[0]}%</Label>
                <Slider
                  value={depthControl}
                  onValueChange={setDepthControl}
                  max={100}
                  step={1}
                  className="mt-1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject-placement" className="text-xs">Subject Placement</Label>
                <Select value={subjectPlacement} onValueChange={setSubjectPlacement}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select subject placement" />
                  </SelectTrigger>
                <SelectContent>
                  {SUBJECT_PLACEMENTS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{option.emoji}</span>
                        <span className="text-xs">{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="safe-zone-overlay"
                  checked={safeZoneOverlay}
                  onCheckedChange={setSafeZoneOverlay}
                  className="scale-75"
                />
                <Label htmlFor="safe-zone-overlay" className="text-xs">Safe Zone Overlay</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Hero layout centers your subject and keeps 25% safe zone for text overlays
              </p>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="min-w-[140px] bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                 Generate Illustration
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Previous Generations */}
      <PreviousGenerations contentType="illustrations" userId={user?.id || ''} className="mt-8" />
    </div>
    </>
  )
}
