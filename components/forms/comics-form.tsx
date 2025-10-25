"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  X,
  Plus,
  Loader2,
  Upload,
  User,
  Save,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ChevronsUpDown
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CharacterVariations } from "@/components/character-variations"
import { useCharacterGeneration } from "@/hooks/use-character-generation"
import { useNavigation } from "@/hooks/use-navigation"
import { cn } from "@/lib/utils"

interface ComicsFormProps {
  onSave: (comic: ComicData) => Promise<void>
  onCancel: () => void
}

interface Character {
  id: string
  name: string
  description: string
  role: string
  customRole?: string
  skinTone: string
  hairColor: string
  eyeColor: string
  outfitMain: string
  outfitAccent?: string
  images?: string[]
  // Enhanced character design fields
  age?: string
  gender?: string
  bodyType?: string
  height?: string
  faceShape?: string
  distinctiveFeatures?: string
  personality?: string
  expression?: string
  pose?: string
  energy?: string
  accessories?: string
  outfitStyle?: string
  outfitDetails?: string
  footwear?: string
  // Character variation selection
  selectedVariation?: string // URL of the selected variation image
  selectedVariationIndex?: number // Index of the selected variation
  generatedVariations?: string[] // All generated variations for this character
  variationMetadata?: any // Metadata for the selected variation
}

interface ComicData {
  title: string
  image: string
  description: string
  selectedArtifact: string
  type: string[]
  vibe: string[]
  inspirationStyle: string[]
  characters: Character[]
  characterVariations?: string[] // Generated character variation URLs
  selectedCharacterVariations?: Array<{
    characterId: string
    characterName: string
    selectedVariation: string
    selectedVariationIndex: number
    variationMetadata?: any
  }> // Selected character variations with metadata
  hasPublicArtifact?: boolean // Whether a public artifact was selected
}

// Options pour le type
const typeOptions = [
  { value: "black-white", label: "Black and white" },
  { value: "color", label: "Color" }
]

// Options pour le vibe/tone
const vibeOptions = [
  { value: "none", label: "None", icon: "⚪" },
  { value: "action", label: "Action", icon: "⚡" },
  { value: "comedy", label: "Comedy", icon: "😂" },
  { value: "dark", label: "Dark", icon: "🌑" },
  { value: "romantic", label: "Romantic", icon: "💕" },
  { value: "drama", label: "Drama", icon: "🎭" },
  { value: "horror", label: "Horror", icon: "👻" },
  { value: "adventure", label: "Adventure", icon: "🗺️" },
  { value: "mystery", label: "Mystery", icon: "🔍" },
  { value: "fantasy", label: "Fantasy", icon: "🧙‍♂️" },
  { value: "sci-fi", label: "Sci-Fi", icon: "🚀" },
  { value: "thriller", label: "Thriller", icon: "😰" },
  { value: "slice-of-life", label: "Slice of Life", icon: "☕" },
  { value: "superhero", label: "Superhero", icon: "🦸‍♂️" },
  { value: "western", label: "Western", icon: "🤠" },
  { value: "noir", label: "Noir", icon: "🕵️‍♂️" },
  { value: "steampunk", label: "Steampunk", icon: "⚙️" },
  { value: "cyberpunk", label: "Cyberpunk", icon: "🤖" },
  { value: "post-apocalyptic", label: "Post-Apocalyptic", icon: "☢️" },
  { value: "coming-of-age", label: "Coming of Age", icon: "🌱" },
  { value: "family", label: "Family", icon: "👨‍👩‍👧‍👦" },
  { value: "educational", label: "Educational", icon: "📚" },
  { value: "inspirational", label: "Inspirational", icon: "✨" },
  { value: "surreal", label: "Surreal", icon: "🌀" }
]

// Options pour le style d'inspiration
const inspirationStyles = [
  { value: "none", label: "None", icon: "⚪" },
  { value: "ghibli", label: "Ghibli", icon: "🌿" },
  { value: "shonen-anime", label: "Shonen Anime", icon: "⚔️" },
  { value: "simpsons", label: "Simpsons", icon: "🟡" },
  { value: "marvel", label: "Marvel", icon: "🦸‍♂️" },
  { value: "dc", label: "DC", icon: "🦇" },
  { value: "manga", label: "Manga", icon: "📖" },
  { value: "western", label: "Western", icon: "🤠" },
  { value: "european", label: "European", icon: "🏰" },
  { value: "indie", label: "Indie", icon: "🎨" },
  { value: "classic", label: "Classic", icon: "📚" },
  { value: "disney", label: "Disney", icon: "🏰" },
  { value: "pixar", label: "Pixar", icon: "💡" },
  { value: "studio-ghibli", label: "Studio Ghibli", icon: "🐉" },
  { value: "anime", label: "Anime", icon: "🌸" },
  { value: "webtoon", label: "Webtoon", icon: "📱" },
  { value: "graphic-novel", label: "Graphic Novel", icon: "📘" },
  { value: "comic-book", label: "Comic Book", icon: "💥" },
  { value: "cartoon", label: "Cartoon", icon: "🎭" },
  { value: "retro", label: "Retro", icon: "📺" },
  { value: "vintage", label: "Vintage", icon: "🕰️" },
  { value: "modern", label: "Modern", icon: "✨" },
  { value: "minimalist", label: "Minimalist", icon: "⚪" },
  { value: "realistic", label: "Realistic", icon: "👁️" },
  { value: "stylized", label: "Stylized", icon: "🎨" },
  { value: "chibi", label: "Chibi", icon: "😊" },
  { value: "kawaii", label: "Kawaii", icon: "💖" },
  { value: "cyberpunk", label: "Cyberpunk", icon: "🤖" },
  { value: "steampunk", label: "Steampunk", icon: "⚙️" },
  { value: "fantasy", label: "Fantasy", icon: "🧙‍♂️" },
  { value: "sci-fi", label: "Sci-Fi", icon: "🚀" },
  { value: "horror", label: "Horror", icon: "👻" },
  { value: "noir", label: "Noir", icon: "🕵️‍♂️" },
  { value: "art-nouveau", label: "Art Nouveau", icon: "🌺" },
  { value: "art-deco", label: "Art Deco", icon: "💎" },
  { value: "pop-art", label: "Pop Art", icon: "🎨" },
  { value: "surreal", label: "Surreal", icon: "🌀" },
  { value: "abstract", label: "Abstract", icon: "🎭" },
  { value: "watercolor", label: "Watercolor", icon: "🎨" },
  { value: "digital", label: "Digital", icon: "💻" },
  
  // Comic Strip Styles
  { value: "calvin-hobbes", label: "Calvin & Hobbes", icon: "👦🐅" },
  { value: "peanuts", label: "Peanuts", icon: "🐕" },
  { value: "garfield", label: "Garfield", icon: "🐱" },
  { value: "spongebob", label: "SpongeBob", icon: "🧽" },
  
  // Specific Anime/Manga Series Styles
  { value: "naruto", label: "Naruto", icon: "🍜" },
  { value: "bleach", label: "Bleach", icon: "⚔️" },
  { value: "attack-on-titan", label: "Attack on Titan", icon: "👦" },
  { value: "one-piece", label: "One Piece", icon: "🏴‍☠️" },
  { value: "dragon-ball", label: "Dragon Ball", icon: "🐒" },
  { value: "demon-slayer", label: "Demon Slayer", icon: "🔥" },
  { value: "my-hero-academia", label: "My Hero Academia", icon: "💚" },
  { value: "one-punch-man", label: "One Punch Man", icon: "👨‍🦲" },
  { value: "fullmetal-alchemist", label: "Fullmetal Alchemist", icon: "⚗️" },
  { value: "death-note", label: "Death Note", icon: "📓" },
  { value: "code-geass", label: "Code Geass", icon: "👑" },
  { value: "cowboy-bebop", label: "Cowboy Bebop", icon: "🚬" },
  { value: "evangelion", label: "Evangelion", icon: "🤖" },
  { value: "ghost-in-shell", label: "Ghost in the Shell", icon: "🤖" },
  { value: "akira", label: "Akira", icon: "⚡" },
  { value: "spirited-away", label: "Spirited Away", icon: "👧" },
  { value: "princess-mononoke", label: "Princess Mononoke", icon: "🐺" },
  { value: "howls-moving-castle", label: "Howl's Moving Castle", icon: "🏰" },
  { value: "kikis-delivery", label: "Kiki's Delivery", icon: "🧹" },
  { value: "pokemon", label: "Pokémon", icon: "⚡" },
  { value: "digimon", label: "Digimon", icon: "🐾" },
  { value: "sailor-moon", label: "Sailor Moon", icon: "🌙" },
  { value: "dragon-ball-z", label: "Dragon Ball Z", icon: "🐒" },
  { value: "jojo-bizarre", label: "JoJo's Bizarre", icon: "💪" },
  { value: "hunter-x-hunter", label: "Hunter x Hunter", icon: "🎯" },
  { value: "fairy-tail", label: "Fairy Tail", icon: "🧚‍♀️" },
  { value: "black-clover", label: "Black Clover", icon: "🍀" },
  { value: "jujutsu-kaisen", label: "Jujutsu Kaisen", icon: "👹" },
  { value: "chainsaw-man", label: "Chainsaw Man", icon: "🪚" },
  { value: "spy-x-family", label: "Spy x Family", icon: "🕵️‍♂️" },
  { value: "tokyo-ghoul", label: "Tokyo Ghoul", icon: "👹" },
  { value: "mob-psycho", label: "Mob Psycho 100", icon: "👦" },
  { value: "haikyuu", label: "Haikyuu!!", icon: "🏐" },
  { value: "kuroko-basketball", label: "Kuroko's Basketball", icon: "🏀" },
  { value: "your-name", label: "Your Name", icon: "💫" },
  { value: "weathering-with-you", label: "Weathering with You", icon: "🌧️" },
  { value: "studio-trigger", label: "Studio Trigger", icon: "⚡" },
  { value: "bones-studio", label: "Bones Studio", icon: "🦴" },
  { value: "madhouse", label: "Madhouse", icon: "🎬" },
  { value: "wit-studio", label: "Wit Studio", icon: "🎭" }
]

// Options d'artifacts comics prédéfinies
const comicArtifacts = [
  {
    id: "comics-start",
    title: "Comics Start",
    image: "/placeholder.jpg",
    description: "Perfect for beginners - clean, simple layouts with clear storytelling",
    icon: "🚀"
  },
  {
    id: "comics-cosmos",
    title: "Comics Cosmos",
    image: "/placeholder.jpg",
    description: "Epic space adventures with cosmic themes and futuristic designs",
    icon: "🌌"
  },
  {
    id: "comics-joys",
    title: "Comics Joys",
    image: "/placeholder.jpg",
    description: "Bright, cheerful stories that bring happiness and positive vibes",
    icon: "😊"
  },
  {
    id: "comic-enjoys",
    title: "Comic Enjoys",
    image: "/placeholder.jpg",
    description: "Entertaining content designed to captivate and engage readers",
    icon: "🎭"
  }
]


export function ComicsForm({ onSave, onCancel }: ComicsFormProps) {
  const { setCharacterVariations, setCharacterVariationsMetadata, setIsGeneratingVariations } = useNavigation()
  
  // Check if character variations functions are available
  if (!setCharacterVariations || !setCharacterVariationsMetadata || !setIsGeneratingVariations) {
    console.warn('Character variations functions not available in navigation context')
  }
  
  // États du formulaire
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedArtifact, setSelectedArtifact] = useState<string>("")
  const [type, setType] = useState<string>("")
  const [vibe, setVibe] = useState<string[]>([])
  const [inspirationStyle, setInspirationStyle] = useState<string[]>([])
  const [characters, setCharacters] = useState<Character[]>([])

  // État pour la navigation par étapes
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 2

  // États pour les dialogs
  const [characterDialogOpen, setCharacterDialogOpen] = useState(false)
  const [artifactDialogOpen, setArtifactDialogOpen] = useState(false)
  const [vibeDialogOpen, setVibeDialogOpen] = useState(false)
  const [inspirationDialogOpen, setInspirationDialogOpen] = useState(false)

  // États pour le nouveau personnage
  const [newCharacterName, setNewCharacterName] = useState("")
  const [newCharacterDescription, setNewCharacterDescription] = useState("")
  const [newCharacterRole, setNewCharacterRole] = useState("")
  const [newCharacterCustomRole, setNewCharacterCustomRole] = useState("")
  const [newCharacterSkinTone, setNewCharacterSkinTone] = useState("")
  const [newCharacterHairColor, setNewCharacterHairColor] = useState("")
  const [newCharacterEyeColor, setNewCharacterEyeColor] = useState("")
  const [newCharacterOutfitMain, setNewCharacterOutfitMain] = useState("")
  const [newCharacterOutfitAccent, setNewCharacterOutfitAccent] = useState("")
  const [newCharacterImages, setNewCharacterImages] = useState<string[]>([])
  
  // Enhanced character design fields
  const [newCharacterAge, setNewCharacterAge] = useState("")
  const [newCharacterGender, setNewCharacterGender] = useState("")
  const [newCharacterBodyType, setNewCharacterBodyType] = useState("")
  const [newCharacterHeight, setNewCharacterHeight] = useState("")
  const [newCharacterFaceShape, setNewCharacterFaceShape] = useState("")
  const [newCharacterDistinctiveFeatures, setNewCharacterDistinctiveFeatures] = useState("")
  const [newCharacterPersonality, setNewCharacterPersonality] = useState("")
  const [newCharacterExpression, setNewCharacterExpression] = useState("")
  const [newCharacterPose, setNewCharacterPose] = useState("")
  const [newCharacterEnergy, setNewCharacterEnergy] = useState("")
  const [newCharacterAccessories, setNewCharacterAccessories] = useState("")
  const [newCharacterOutfitStyle, setNewCharacterOutfitStyle] = useState("")
  const [newCharacterOutfitDetails, setNewCharacterOutfitDetails] = useState("")
  const [newCharacterFootwear, setNewCharacterFootwear] = useState("")
  
  // Character variation selection state
  const [currentGeneratingCharacterId, setCurrentGeneratingCharacterId] = useState<string | null>(null)
  const [currentSelectingCharacterId, setCurrentSelectingCharacterId] = useState<string | null>(null)

  const { toast } = useToast()
  const {
    variations,
    isGenerating,
    selectedIndex,
    generationResult,
    generateCharacter,
    regenerateCharacter,
    selectVariation,
    confirmSelection,
    clearVariations,
  } = useCharacterGeneration()

  // Sync character variations with navigation context
  useEffect(() => {
    console.log('🔄 ComicsForm useEffect triggered:', {
      variationsCount: variations.length,
      isGenerating,
      variations: variations,
      generationResult: generationResult
    })
    setCharacterVariations?.(variations)
    setCharacterVariationsMetadata?.(generationResult?.variations || null)
    setIsGeneratingVariations?.(isGenerating)
    console.log('✅ ComicsForm useEffect completed - synced to global context')
  }, [variations, isGenerating, generationResult, setCharacterVariations, setCharacterVariationsMetadata, setIsGeneratingVariations])

  // Debug variations state
  console.log('🔍 Comics form variations state:', {
    variationsCount: variations.length,
    isGenerating,
    selectedIndex,
    variations: variations
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCharacterImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newImages: string[] = []
      const maxImages = 4
      const currentImageCount = newCharacterImages.length
      
      // Limit to max 4 images total
      const filesToProcess = Array.from(files).slice(0, maxImages - currentImageCount)
      
      if (filesToProcess.length === 0) {
        toast({
          title: "Maximum images reached",
          description: "You can upload up to 4 images maximum.",
          variant: "destructive"
        })
        return
      }
      
      filesToProcess.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
          newImages.push(e.target?.result as string)
          
          // When all files are processed, update state
          if (newImages.length === filesToProcess.length) {
            setNewCharacterImages(prev => [...prev, ...newImages])
          }
      }
      reader.readAsDataURL(file)
      })
    }
  }

  const removeCharacterImage = (index: number) => {
    setNewCharacterImages(prev => prev.filter((_, i) => i !== index))
  }

  // Fonctions pour gérer les sélections multiples

  const handleVibeChange = (value: string) => {
    // Sélection unique - remplacer complètement le tableau
    setVibe([value])
  }

  const handleInspirationChange = (value: string) => {
    // Sélection unique - remplacer complètement le tableau
    setInspirationStyle([value])
  }

  // Fonctions de navigation
  const canGoToNextStep = () => {
    if (currentStep === 1) {
      return title.trim() && description.trim() && selectedArtifact
    }
    return true
  }

  // Fonction pour obtenir le label du vibe sélectionné
  const getSelectedVibeLabel = () => {
    if (vibe.length === 0) return "Select vibe/tone..."
    const selectedVibe = vibeOptions.find(option => option.value === vibe[0])
    return selectedVibe ? selectedVibe.label : "Select vibe/tone..."
  }

  // Fonction pour obtenir le label du style d'inspiration sélectionné
  const getSelectedInspirationLabel = () => {
    if (inspirationStyle.length === 0) return "Select inspiration style..."
    const selected = inspirationStyles.find(option => option.value === inspirationStyle[0])
    return selected ? selected.label : "Select inspiration style..."
  }

  const handleNextStep = () => {
    if (canGoToNextStep() && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleAddCharacter = async () => {
    if (newCharacterDescription.trim()) {
      const characterId = Date.now().toString()
      const newCharacter: Character = {
        id: characterId,
        name: newCharacterName.trim() || "Unnamed Character",
        description: newCharacterDescription.trim(),
        role: newCharacterRole || "Other",
        customRole: newCharacterRole === "other" ? newCharacterCustomRole.trim() : undefined,
        skinTone: newCharacterSkinTone || "medium",
        hairColor: newCharacterHairColor || "brown",
        eyeColor: newCharacterEyeColor || "brown",
        outfitMain: newCharacterOutfitMain || "black",
        outfitAccent: newCharacterOutfitAccent || undefined,
        images: newCharacterImages.length > 0 ? newCharacterImages : undefined,
        // Enhanced character design fields
        age: newCharacterAge || undefined,
        gender: newCharacterGender || undefined,
        bodyType: newCharacterBodyType || undefined,
        height: newCharacterHeight || undefined,
        faceShape: newCharacterFaceShape || undefined,
        distinctiveFeatures: newCharacterDistinctiveFeatures || undefined,
        personality: newCharacterPersonality || undefined,
        expression: newCharacterExpression || undefined,
        pose: newCharacterPose || undefined,
        energy: newCharacterEnergy || undefined,
        accessories: newCharacterAccessories || undefined,
        outfitStyle: newCharacterOutfitStyle || undefined,
        outfitDetails: newCharacterOutfitDetails || undefined,
        footwear: newCharacterFootwear || undefined
      }

      // Add character to list first
      setCharacters(prev => [...prev, newCharacter])
      
      // Set this character as the one being generated
      setCurrentGeneratingCharacterId(characterId)
      
      // Show immediate feedback
      toast({
        title: "✅ Character Added!",
        description: "🎨 Generating 2 character variations using AI...",
      })

      // Prepare comic settings for generation
      const comicSettings = {
        inspirationStyle: inspirationStyle.length > 0 ? inspirationStyle[0] : "realistic",
        vibe: vibe.length > 0 ? vibe[0] : "neutral",
        type: type || "color"
      }

      // Generate character variations with comprehensive artifact info for auto-saving to Templates
      await generateCharacter(newCharacter, comicSettings, {
        comicTitle: title.trim() || 'Untitled Comic',
        selectedArtifact: selectedArtifactData ? {
          id: selectedArtifactData.id,
          title: selectedArtifactData.title,
          isPublic: (selectedArtifactData as any)?.isPublic || false,
          type: (selectedArtifactData as any)?.type || 'comic',
          section: (selectedArtifactData as any)?.section || 'user-artifacts'
        } : undefined
      })
      
      // Reset form
      setNewCharacterName("")
      setNewCharacterDescription("")
      setNewCharacterRole("")
      setNewCharacterCustomRole("")
      setNewCharacterSkinTone("")
      setNewCharacterHairColor("")
      setNewCharacterEyeColor("")
      setNewCharacterOutfitMain("")
      setNewCharacterOutfitAccent("")
      setNewCharacterImages([])
      // Reset enhanced fields
      setNewCharacterAge("")
      setNewCharacterGender("")
      setNewCharacterBodyType("")
      setNewCharacterHeight("")
      setNewCharacterFaceShape("")
      setNewCharacterDistinctiveFeatures("")
      setNewCharacterPersonality("")
      setNewCharacterExpression("")
      setNewCharacterPose("")
      setNewCharacterEnergy("")
      setNewCharacterAccessories("")
      setNewCharacterOutfitStyle("")
      setNewCharacterOutfitDetails("")
      setNewCharacterFootwear("")
      setCharacterDialogOpen(false)
    }
  }

  const handleRemoveCharacter = (characterId: string) => {
    setCharacters(prev => prev.filter(char => char.id !== characterId))
  }

  // Handle character variation selection
  const handleCharacterVariationSelect = (characterId: string, variationIndex: number) => {
    console.log('🎯 Character variation selected:', { characterId, variationIndex })
    
    // Update the character with the selected variation
    setCharacters(prev => prev.map(char => {
      if (char.id === characterId) {
        const selectedVariation = variations[variationIndex]
        const selectedMetadata = generationResult?.variations?.[variationIndex]
        
        return {
          ...char,
          selectedVariation: selectedVariation,
          selectedVariationIndex: variationIndex,
          generatedVariations: variations,
          variationMetadata: selectedMetadata
        }
      }
      return char
    }))
    
    // Set this character as the one being selected
    setCurrentSelectingCharacterId(characterId)
    
    toast({
      title: "✅ Character Variation Selected!",
      description: `Variation ${variationIndex + 1} has been chosen for ${characters.find(c => c.id === characterId)?.name || 'this character'}.`,
    })
    
    // Clear the generation state since selection is complete
    setCurrentGeneratingCharacterId(null)
    setCurrentSelectingCharacterId(null)
  }

  const handleSave = async () => {
    // Debug validation requirements
    console.log('🔍 Save validation check:', {
      title: title.trim(),
      description: description.trim(),
      selectedArtifact,
      type,
      vibe,
      vibeLength: vibe.length,
      vibeIncludesNone: vibe.includes('none'),
      inspirationStyle,
      inspirationStyleLength: inspirationStyle.length,
      allValid: title.trim() && description.trim() && selectedArtifact && type && vibe.length > 0 && !vibe.includes('none')
    })
    
    if (title.trim() && description.trim() && selectedArtifact && type && vibe.length > 0 && !vibe.includes('none')) {
      // Collect all selected character variations
      const selectedCharacterVariations = characters
        .filter(char => char.selectedVariation && char.selectedVariationIndex !== undefined)
        .map(char => ({
          characterId: char.id,
          characterName: char.name,
          selectedVariation: char.selectedVariation!,
          selectedVariationIndex: char.selectedVariationIndex!,
          variationMetadata: char.variationMetadata
        }))

      const comicData: ComicData = {
        title: title.trim(),
        image: imagePreview || "/placeholder.jpg",
        description: description.trim(),
        selectedArtifact,
        type: [type],
        vibe,
        inspirationStyle,
        characters,
        characterVariations: variations, // Pass generated character variations
        selectedCharacterVariations, // Pass selected character variations with metadata
        hasPublicArtifact: (selectedArtifactData as any)?.isPublic || false // Check if selected artifact is public
      }

      console.log('🔍 Comic data being saved:', {
        title: comicData.title,
        selectedArtifact: comicData.selectedArtifact,
        selectedArtifactData: selectedArtifactData,
        hasPublicArtifact: comicData.hasPublicArtifact,
        characterVariationsCount: comicData.characterVariations?.length || 0,
        characterVariations: comicData.characterVariations,
        selectedCharacterVariationsCount: comicData.selectedCharacterVariations?.length || 0,
        selectedCharacterVariations: comicData.selectedCharacterVariations
      })

      try {
        // Call onSave which now handles database persistence
        await onSave(comicData)

        // Reset form after successful save
        setTitle("")
        setDescription("")
        setImagePreview(null)
        setSelectedArtifact("")
        setType("")
        setVibe([])
        setInspirationStyle([])
        setCharacters([])
        setCurrentStep(1)

        // Show success toast
        toast({
          title: "🎬 Comic Created Successfully!",
          description: `"${comicData.title}" has been created and added to your comics collection.`,
        })

        // Navigate to comics section to view the created comic
        // This will be handled by the parent component
        console.log('🎯 Comic creation completed, should navigate to comics section')
        
      } catch (error) {
        console.error('Failed to save comic:', error)
        toast({
          title: "Error",
          description: "Failed to create comic. Please try again.",
          variant: "destructive"
        })
      }
    } else {
      // Show validation error message
      const missingFields = []
      if (!title.trim()) missingFields.push('Title')
      if (!description.trim()) missingFields.push('Description')
      if (!selectedArtifact) missingFields.push('Artifact')
      if (!type) missingFields.push('Type')
      if (vibe.length === 0) missingFields.push('Vibe/Tone')
      if (vibe.includes('none')) missingFields.push('Vibe/Tone (cannot be "none")')
      
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive"
      })
    }
  }

  // Use hardcoded comic artifacts
  const artifactsToShow = comicArtifacts
  const selectedArtifactData = artifactsToShow.find(artifact => artifact.id === selectedArtifact)

  // Composant pour l'indicateur de progression
  const StepIndicator = () => (
    <div className="space-y-4 mb-6">
      {/* Debug step info */}
      <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
        <div className="font-medium">Step Progress Debug</div>
        <div>Current Step: {currentStep} / {totalSteps}</div>
        <div>On Final Step: {currentStep >= totalSteps ? 'YES' : 'NO'}</div>
        <div>Save Button Visible: {currentStep >= totalSteps ? 'YES' : 'NO'}</div>
      </div>
      
      {/* Visual step indicator */}
      <div className="flex items-center justify-center space-x-4">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div key={index} className="flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              currentStep > index + 1
                ? "bg-primary text-primary-foreground"
                : currentStep === index + 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
            )}>
              {currentStep > index + 1 ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < totalSteps - 1 && (
              <div className={cn(
                "w-12 h-0.5 mx-2",
                currentStep > index + 1 ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  )

  // Étape 1: Informations de base
  const renderStep1 = () => (
    <div className="space-y-4">
      {/* Project Name */}
      <div>
        <label htmlFor="comic-title" className="block text-sm font-medium text-foreground mb-1">
          Project Name
        </label>
        <Input
          id="comic-title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter comic project name"
        />
      </div>

      {/* Upload */}
      <div>
        <div className="block text-sm font-medium text-foreground mb-1">
          Upload (Optional)
        </div>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-muted-foreground/50 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="comic-image-upload"
            name="image"
          />
          <label htmlFor="comic-image-upload" className="cursor-pointer block">
            {imagePreview ? (
              <div className="space-y-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-md mx-auto"
                />
                <p className="text-sm text-muted-foreground">Click to change image</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Click to upload media</p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Artifact Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Artifact Selection
        </label>

        {/* Bouton pour ouvrir la sélection */}
        <Button
          variant="outline"
          onClick={() => setArtifactDialogOpen(true)}
          className="w-full justify-between h-12 text-left"
        >
          <div className="flex items-center gap-3">
            {selectedArtifactData ? (
              <>
                {selectedArtifactData.icon ? (
                  <span className="text-lg">{selectedArtifactData.icon}</span>
                ) : (
                  <img 
                    src={selectedArtifactData.image} 
                    alt={selectedArtifactData.title}
                    className="w-5 h-5 object-cover rounded"
                  />
                )}
                <span className="font-medium">{selectedArtifactData.title}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Select artifact...</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>

        {/* Dialog pour la sélection d'artifacts */}
        <Dialog open={artifactDialogOpen} onOpenChange={setArtifactDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Artifact Selection</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {artifactsToShow.map((artifact) => (
                <div
                  key={artifact.id}
                  className={cn(
                    "relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.01] group",
                    selectedArtifact === artifact.id
                      ? "border-primary bg-gradient-to-r from-primary/10 to-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 bg-card"
                  )}
                  onClick={() => {
                    setSelectedArtifact(artifact.id)
                    setArtifactDialogOpen(false)
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center transition-all duration-300",
                        selectedArtifact === artifact.id
                          ? "from-primary/30 to-primary/20 shadow-md"
                          : "from-primary/20 to-primary/10"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                          selectedArtifact === artifact.id
                            ? "bg-primary/40 shadow-sm"
                            : "bg-primary/30"
                        )}>
                          {artifact.icon ? (
                            <span className="text-lg">{artifact.icon}</span>
                          ) : (
                            <img 
                              src={artifact.image} 
                              alt={artifact.title}
                              className="w-6 h-6 object-cover rounded"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "font-semibold text-sm mb-1 transition-colors duration-300",
                        selectedArtifact === artifact.id ? "text-primary" : "text-foreground"
                      )}>
                        {artifact.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {artifact.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {selectedArtifact === artifact.id && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {selectedArtifactData && (
          <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-xl shadow-sm animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center shadow-sm">
                {selectedArtifactData.icon ? (
                  <span className="text-lg">{selectedArtifactData.icon}</span>
                ) : (
                  <img 
                    src={selectedArtifactData.image} 
                    alt={selectedArtifactData.title}
                    className="w-6 h-6 object-cover rounded"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-primary text-sm">
                  {selectedArtifactData.title} Selected
                </p>
                <p className="text-xs text-muted-foreground">
                  Ready to create your comic with this style
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="comic-description" className="block text-sm font-medium text-foreground mb-1">
          Description
        </label>
        <Textarea
          id="comic-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter comic description"
          rows={3}
        />
      </div>
    </div>
  )

  // Étape 2: Sélections et personnages
  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Type
        </label>
        <RadioGroup value={type} onValueChange={setType} className="space-y-2">
          {typeOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`type-${option.value}`} />
              <label
                htmlFor={`type-${option.value}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {option.label}
              </label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Vibe/Tone */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Vibe/Tone
        </label>
        
        {/* Bouton pour ouvrir la sélection de vibe */}
        <Button
          variant="outline"
          onClick={() => setVibeDialogOpen(true)}
          className="w-full justify-between h-12 text-left"
        >
          <div className="flex items-center gap-3">
            {vibe.length > 0 && vibe[0] !== 'none' ? (
              <>
                <span className="text-lg">
                  {vibeOptions.find(option => option.value === vibe[0])?.icon}
          </span>
                <span className="font-medium">{getSelectedVibeLabel()}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{getSelectedVibeLabel()}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>

        {/* Dialog pour la sélection de vibe */}
        <Dialog open={vibeDialogOpen} onOpenChange={setVibeDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[400px] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Select Vibe/Tone</DialogTitle>
            </DialogHeader>
            <div className="max-h-[280px] overflow-y-auto overflow-x-hidden scrollbar-hover">
              <div className="grid grid-cols-3 gap-2 py-4 px-1">
                {vibeOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "relative p-2 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.02] group min-w-0",
                      vibe.includes(option.value)
                        ? "border-primary bg-gradient-to-r from-primary/10 to-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50 bg-card"
                    )}
                    onClick={() => {
                      handleVibeChange(option.value)
                      setVibeDialogOpen(false)
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 text-lg",
                        vibe.includes(option.value)
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border group-hover:border-primary/50 bg-card"
                      )}>
                        {option.icon}
                      </div>
                      <h3 className={cn(
                        "font-medium text-xs text-center transition-colors duration-300 leading-tight break-words",
                        vibe.includes(option.value) ? "text-primary" : "text-foreground"
                      )}>
                        {option.label}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inspiration Style */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Inspiration Style
        </label>
        
        {/* Bouton pour ouvrir la sélection d'inspiration */}
        <Button
          variant="outline"
          onClick={() => setInspirationDialogOpen(true)}
          className="w-full justify-between h-12 text-left"
        >
          <div className="flex items-center gap-3">
            {inspirationStyle.length > 0 && inspirationStyle[0] !== 'none' ? (
              <>
                <span className="text-lg">
                  {inspirationStyles.find(option => option.value === inspirationStyle[0])?.icon}
          </span>
                <span className="font-medium">{getSelectedInspirationLabel()}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{getSelectedInspirationLabel()}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>

        {/* Dialog pour la sélection d'inspiration */}
        <Dialog open={inspirationDialogOpen} onOpenChange={setInspirationDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[400px] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Select Inspiration Style</DialogTitle>
            </DialogHeader>
            <div className="max-h-[280px] overflow-y-auto overflow-x-hidden scrollbar-hover">
              <div className="grid grid-cols-3 gap-2 py-4 px-1">
                {inspirationStyles.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "relative p-2 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.02] group min-w-0",
                      inspirationStyle.includes(option.value)
                        ? "border-primary bg-gradient-to-r from-primary/10 to-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50 bg-card"
                    )}
                    onClick={() => {
                      handleInspirationChange(option.value)
                      setInspirationDialogOpen(false)
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 text-lg",
                        inspirationStyle.includes(option.value)
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border group-hover:border-primary/50 bg-card"
                      )}>
                        {option.icon}
                      </div>
                      <h3 className={cn(
                        "font-medium text-xs text-center transition-colors duration-300 leading-tight break-words",
                        inspirationStyle.includes(option.value) ? "text-primary" : "text-foreground"
                      )}>
                        {option.label}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Characters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-foreground">
            Characters
          </label>
          <Dialog open={characterDialogOpen} onOpenChange={setCharacterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Characters
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background to-muted/20">
              <DialogHeader className="text-center pb-4">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  ✨ Add Character
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Create a unique character for your comic story
                </p>
              </DialogHeader>
              <div className="space-y-8">
                {/* Name (Optional) */}
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <label className="text-sm font-semibold text-foreground">
                      Character Name (Optional)
                  </label>
                  </div>
                  <Input
                    value={newCharacterName}
                    onChange={(e) => setNewCharacterName(e.target.value)}
                    placeholder="Enter character name (e.g., Alice, Max, Luna)"
                    className="w-full border-border/50 focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Description (Required) */}
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <span className="text-blue-500 text-sm font-bold">📝</span>
                    </div>
                    <label className="text-sm font-semibold text-foreground">
                      Character Description <span className="text-red-500">*</span>
                  </label>
                  </div>
                  <Textarea
                    value={newCharacterDescription}
                    onChange={(e) => setNewCharacterDescription(e.target.value)}
                    placeholder="Describe your character in detail (e.g., 'A cheerful robot barista with glasses who loves making perfect coffee')"
                    rows={3}
                    className="w-full border-border/50 focus:border-primary/50 transition-colors resize-none"
                  />
                </div>

                {/* Role in Story (Optional) */}
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <span className="text-purple-500 text-sm font-bold">🎭</span>
                    </div>
                    <label className="text-sm font-semibold text-foreground">
                      Role in Story (Optional)
                    </label>
                  </div>
                  <RadioGroup value={newCharacterRole} onValueChange={setNewCharacterRole} className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-3 p-3 border border-border/30 rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer">
                      <RadioGroupItem value="hero" id="role-hero" />
                      <label htmlFor="role-hero" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                        <span className="text-yellow-500">🦸</span> Hero
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border border-border/30 rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer">
                      <RadioGroupItem value="villain" id="role-villain" />
                      <label htmlFor="role-villain" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                        <span className="text-red-500">🦹</span> Villain
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border border-border/30 rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer">
                      <RadioGroupItem value="mentor" id="role-mentor" />
                      <label htmlFor="role-mentor" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                        <span className="text-blue-500">🧙</span> Mentor
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border border-border/30 rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer">
                      <RadioGroupItem value="sidekick" id="role-sidekick" />
                      <label htmlFor="role-sidekick" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                        <span className="text-green-500">🤝</span> Sidekick
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border border-border/30 rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer col-span-2">
                      <RadioGroupItem value="other" id="role-other" />
                      <label htmlFor="role-other" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                        <span className="text-gray-500">❓</span> Other
                      </label>
                    </div>
                  </RadioGroup>
                  {newCharacterRole === "other" && (
                    <div className="mt-4">
                  <Input
                        value={newCharacterCustomRole}
                        onChange={(e) => setNewCharacterCustomRole(e.target.value)}
                        placeholder="Enter custom role description..."
                        className="w-full border-border/50 focus:border-primary/50 transition-colors"
                  />
                </div>
                  )}
                </div>

                {/* Color Slots */}
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 flex items-center justify-center">
                      <span className="text-pink-500 text-sm font-bold">🎨</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Character Appearance</h3>
                  </div>
                  <div className="space-y-6">
                  
                  {/* Skin Tone */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-orange-500">👤</span>
                      <label className="text-sm font-semibold text-foreground">
                        Skin Tone
                  </label>
                    </div>
                    <div className="space-y-3">
                      <Select value={newCharacterSkinTone} onValueChange={setNewCharacterSkinTone}>
                        <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                          <SelectValue placeholder="Select skin tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="porcelain">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-pink-100 border"></div>
                              <span>Porcelain</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="fair">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-pink-200 border"></div>
                              <span>Fair</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="light">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-yellow-100 border"></div>
                              <span>Light</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="medium-light">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-yellow-200 border"></div>
                              <span>Medium Light</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-orange-200 border"></div>
                              <span>Medium</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="medium-dark">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-orange-300 border"></div>
                              <span>Medium Dark</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-amber-600 border"></div>
                              <span>Dark</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="deep">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-amber-800 border"></div>
                              <span>Deep</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Additional skin details (e.g., 'freckles', 'tan lines', 'birthmarks')"
                        className="border-border/50 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Hair Color */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-amber-500">💇</span>
                      <label className="text-sm font-semibold text-foreground">
                        Hair Color
                      </label>
                    </div>
                    <div className="space-y-3">
                      <Select value={newCharacterHairColor} onValueChange={setNewCharacterHairColor}>
                        <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                          <SelectValue placeholder="Select hair color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="black">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-black border"></div>
                              <span>Black</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="dark-brown">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-amber-900 border"></div>
                              <span>Dark Brown</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="brown">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-amber-700 border"></div>
                              <span>Brown</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="light-brown">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-amber-600 border"></div>
                              <span>Light Brown</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="auburn">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-red-800 border"></div>
                              <span>Auburn</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="red">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-red-600 border"></div>
                              <span>Red</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="strawberry-blonde">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-orange-300 border"></div>
                              <span>Strawberry Blonde</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="blonde">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-yellow-300 border"></div>
                              <span>Blonde</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="platinum">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gray-200 border"></div>
                              <span>Platinum</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="white">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-white border"></div>
                              <span>White</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="gray">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gray-400 border"></div>
                              <span>Gray</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Hair style details (e.g., 'curly', 'straight', 'wavy', 'short', 'long')"
                        className="border-border/50 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Eye Color */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-blue-500">👁️</span>
                      <label className="text-sm font-semibold text-foreground">
                        Eye Color
                      </label>
                    </div>
                    <div className="space-y-3">
                      <Select value={newCharacterEyeColor} onValueChange={setNewCharacterEyeColor}>
                        <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                          <SelectValue placeholder="Select eye color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dark-brown">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-amber-900 border"></div>
                              <span>Dark Brown</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="brown">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-amber-700 border"></div>
                              <span>Brown</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="light-brown">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-amber-500 border"></div>
                              <span>Light Brown</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="hazel">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-green-600 border"></div>
                              <span>Hazel</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="green">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-green-500 border"></div>
                              <span>Green</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="blue">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-blue-500 border"></div>
                              <span>Blue</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="light-blue">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-blue-300 border"></div>
                              <span>Light Blue</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="gray">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gray-400 border"></div>
                              <span>Gray</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="violet">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-purple-500 border"></div>
                              <span>Violet</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Eye details (e.g., 'bright', 'deep', 'sparkling', 'mysterious')"
                        className="border-border/50 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Outfit Main */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-red-500">👕</span>
                      <label className="text-sm font-semibold text-foreground">
                        Outfit Main Color
                      </label>
                    </div>
                    <div className="space-y-3">
                      <Select value={newCharacterOutfitMain} onValueChange={setNewCharacterOutfitMain}>
                        <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                          <SelectValue placeholder="Select main outfit color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="black">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-black border"></div>
                              <span>Black</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="white">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-white border"></div>
                              <span>White</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="navy">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-blue-900 border"></div>
                              <span>Navy</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="blue">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-blue-500 border"></div>
                              <span>Blue</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="red">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-red-500 border"></div>
                              <span>Red</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="green">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-green-500 border"></div>
                              <span>Green</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="purple">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-purple-500 border"></div>
                              <span>Purple</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="brown">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-amber-700 border"></div>
                              <span>Brown</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="gray">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gray-500 border"></div>
                              <span>Gray</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="pink">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-pink-500 border"></div>
                              <span>Pink</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Describe the outfit style (e.g., 'Casual t-shirt', 'Formal suit', 'Armor')"
                        className="border-border/50 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Outfit Accent (Optional) */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-yellow-500">✨</span>
                      <label className="text-sm font-semibold text-foreground">
                        Outfit Accent Color (Optional)
                      </label>
                    </div>
                    <div className="space-y-3">
                      <Select value={newCharacterOutfitAccent} onValueChange={setNewCharacterOutfitAccent}>
                        <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                          <SelectValue placeholder="Select accent color (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gray-200 border-2 border-dashed border-gray-400"></div>
                              <span>None</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="gold">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-yellow-500 border"></div>
                              <span>Gold</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="silver">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gray-400 border"></div>
                              <span>Silver</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="bronze">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-amber-600 border"></div>
                              <span>Bronze</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="orange">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-orange-500 border"></div>
                              <span>Orange</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="yellow">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-yellow-400 border"></div>
                              <span>Yellow</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="teal">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-teal-500 border"></div>
                              <span>Teal</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="coral">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-orange-300 border"></div>
                              <span>Coral</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="lime">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-lime-500 border"></div>
                              <span>Lime</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="cyan">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-cyan-500 border"></div>
                              <span>Cyan</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Describe accent details (e.g., 'Gold trim', 'Silver buttons', 'Orange belt')"
                        className="border-border/50 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                  </div>
                </div>

                {/* Enhanced Character Design Fields */}
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                      <span className="text-purple-500 text-sm font-bold">🎭</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Character Design Details</h3>
                  </div>
                  <div className="space-y-6">
                    
                    {/* Age & Gender */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-blue-500">🎂</span>
                          <label className="text-sm font-semibold text-foreground">
                            Age
                          </label>
                        </div>
                        <Select value={newCharacterAge} onValueChange={setNewCharacterAge}>
                          <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                            <SelectValue placeholder="Select age range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="child">Child (5-12)</SelectItem>
                            <SelectItem value="teen">Teen (13-19)</SelectItem>
                            <SelectItem value="young-adult">Young Adult (20-30)</SelectItem>
                            <SelectItem value="adult">Adult (31-50)</SelectItem>
                            <SelectItem value="middle-aged">Middle-aged (51-65)</SelectItem>
                            <SelectItem value="elderly">Elderly (65+)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-pink-500">👤</span>
                          <label className="text-sm font-semibold text-foreground">
                            Gender
                          </label>
                        </div>
                        <Select value={newCharacterGender} onValueChange={setNewCharacterGender}>
                          <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="non-binary">Non-binary</SelectItem>
                            <SelectItem value="any">Any/Unspecified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Body Type & Height */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-green-500">💪</span>
                          <label className="text-sm font-semibold text-foreground">
                            Body Type
                          </label>
                        </div>
                        <Select value={newCharacterBodyType} onValueChange={setNewCharacterBodyType}>
                          <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                            <SelectValue placeholder="Select body type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slim">Slim</SelectItem>
                            <SelectItem value="athletic">Athletic</SelectItem>
                            <SelectItem value="muscular">Muscular</SelectItem>
                            <SelectItem value="average">Average</SelectItem>
                            <SelectItem value="heavy">Heavy</SelectItem>
                            <SelectItem value="stocky">Stocky</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-orange-500">📏</span>
                          <label className="text-sm font-semibold text-foreground">
                            Height
                          </label>
                        </div>
                        <Select value={newCharacterHeight} onValueChange={setNewCharacterHeight}>
                          <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                            <SelectValue placeholder="Select height" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">Short</SelectItem>
                            <SelectItem value="average">Average</SelectItem>
                            <SelectItem value="tall">Tall</SelectItem>
                            <SelectItem value="very-tall">Very Tall</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Face Shape & Distinctive Features */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-indigo-500">👁️</span>
                          <label className="text-sm font-semibold text-foreground">
                            Face Shape
                          </label>
                        </div>
                        <Select value={newCharacterFaceShape} onValueChange={setNewCharacterFaceShape}>
                          <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                            <SelectValue placeholder="Select face shape" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="round">Round</SelectItem>
                            <SelectItem value="oval">Oval</SelectItem>
                            <SelectItem value="square">Square</SelectItem>
                            <SelectItem value="heart">Heart</SelectItem>
                            <SelectItem value="diamond">Diamond</SelectItem>
                            <SelectItem value="long">Long</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-red-500">✨</span>
                          <label className="text-sm font-semibold text-foreground">
                            Distinctive Features
                          </label>
                        </div>
                        <Input
                          value={newCharacterDistinctiveFeatures}
                          onChange={(e) => setNewCharacterDistinctiveFeatures(e.target.value)}
                          placeholder="e.g., scars, tattoos, glasses, beard, freckles"
                          className="border-border/50 focus:border-primary/50 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Personality & Expression */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-yellow-500">😊</span>
                          <label className="text-sm font-semibold text-foreground">
                            Personality
                          </label>
                        </div>
                        <Select value={newCharacterPersonality} onValueChange={setNewCharacterPersonality}>
                          <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                            <SelectValue placeholder="Select personality" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="confident">Confident</SelectItem>
                            <SelectItem value="shy">Shy</SelectItem>
                            <SelectItem value="aggressive">Aggressive</SelectItem>
                            <SelectItem value="wise">Wise</SelectItem>
                            <SelectItem value="playful">Playful</SelectItem>
                            <SelectItem value="serious">Serious</SelectItem>
                            <SelectItem value="mysterious">Mysterious</SelectItem>
                            <SelectItem value="cheerful">Cheerful</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-cyan-500">😐</span>
                          <label className="text-sm font-semibold text-foreground">
                            Expression
                          </label>
                        </div>
                        <Select value={newCharacterExpression} onValueChange={setNewCharacterExpression}>
                          <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                            <SelectValue placeholder="Select expression" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="serious">Serious</SelectItem>
                            <SelectItem value="smiling">Smiling</SelectItem>
                            <SelectItem value="determined">Determined</SelectItem>
                            <SelectItem value="mysterious">Mysterious</SelectItem>
                            <SelectItem value="confident">Confident</SelectItem>
                            <SelectItem value="worried">Worried</SelectItem>
                            <SelectItem value="angry">Angry</SelectItem>
                            <SelectItem value="calm">Calm</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Pose & Energy */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-emerald-500">🤸</span>
                          <label className="text-sm font-semibold text-foreground">
                            Pose
                          </label>
                        </div>
                        <Select value={newCharacterPose} onValueChange={setNewCharacterPose}>
                          <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                            <SelectValue placeholder="Select pose" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standing">Standing</SelectItem>
                            <SelectItem value="sitting">Sitting</SelectItem>
                            <SelectItem value="action">Action</SelectItem>
                            <SelectItem value="relaxed">Relaxed</SelectItem>
                            <SelectItem value="defensive">Defensive</SelectItem>
                            <SelectItem value="heroic">Heroic</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="dynamic">Dynamic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-violet-500">⚡</span>
                          <label className="text-sm font-semibold text-foreground">
                            Energy
                          </label>
                        </div>
                        <Select value={newCharacterEnergy} onValueChange={setNewCharacterEnergy}>
                          <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                            <SelectValue placeholder="Select energy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="calm">Calm</SelectItem>
                            <SelectItem value="energetic">Energetic</SelectItem>
                            <SelectItem value="intense">Intense</SelectItem>
                            <SelectItem value="mysterious">Mysterious</SelectItem>
                            <SelectItem value="powerful">Powerful</SelectItem>
                            <SelectItem value="gentle">Gentle</SelectItem>
                            <SelectItem value="dynamic">Dynamic</SelectItem>
                            <SelectItem value="focused">Focused</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Enhanced Outfit Details */}
                    <div className="space-y-4">
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-rose-500">👔</span>
                          <label className="text-sm font-semibold text-foreground">
                            Outfit Style
                          </label>
                        </div>
                        <Select value={newCharacterOutfitStyle} onValueChange={setNewCharacterOutfitStyle}>
                          <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                            <SelectValue placeholder="Select outfit style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="formal">Formal</SelectItem>
                            <SelectItem value="military">Military</SelectItem>
                            <SelectItem value="fantasy">Fantasy</SelectItem>
                            <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                            <SelectItem value="medieval">Medieval</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="vintage">Vintage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-teal-500">👕</span>
                          <label className="text-sm font-semibold text-foreground">
                            Outfit Details
                          </label>
                        </div>
                        <Input
                          value={newCharacterOutfitDetails}
                          onChange={(e) => setNewCharacterOutfitDetails(e.target.value)}
                          placeholder="e.g., leather jacket, armor, robes, uniform"
                          className="border-border/50 focus:border-primary/50 transition-colors"
                        />
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-amber-500">👟</span>
                          <label className="text-sm font-semibold text-foreground">
                            Footwear
                          </label>
                        </div>
                        <Select value={newCharacterFootwear} onValueChange={setNewCharacterFootwear}>
                          <SelectTrigger className="w-full border-border/50 focus:border-primary/50 transition-colors">
                            <SelectValue placeholder="Select footwear" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="boots">Boots</SelectItem>
                            <SelectItem value="sneakers">Sneakers</SelectItem>
                            <SelectItem value="sandals">Sandals</SelectItem>
                            <SelectItem value="armor-boots">Armor Boots</SelectItem>
                            <SelectItem value="barefoot">Barefoot</SelectItem>
                            <SelectItem value="heels">Heels</SelectItem>
                            <SelectItem value="loafers">Loafers</SelectItem>
                            <SelectItem value="combat-boots">Combat Boots</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lime-500">🎒</span>
                          <label className="text-sm font-semibold text-foreground">
                            Accessories
                          </label>
                        </div>
                        <Input
                          value={newCharacterAccessories}
                          onChange={(e) => setNewCharacterAccessories(e.target.value)}
                          placeholder="e.g., weapons, jewelry, tools, magic items"
                          className="border-border/50 focus:border-primary/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Character Image (Optional) */}
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <span className="text-green-500 text-sm font-bold">🖼️</span>
                    </div>
                    <label className="text-sm font-semibold text-foreground">
                      Character Inspiration (Optional)
                    </label>
                  </div>
                  <div className="space-y-4">
                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-200">
                    <input
                      type="file"
                      accept="image/*"
                        multiple
                      onChange={handleCharacterImageUpload}
                      className="hidden"
                      id="character-image-upload"
                        disabled={newCharacterImages.length >= 4}
                      />
                      <label
                        htmlFor="character-image-upload"
                        className={`cursor-pointer block ${newCharacterImages.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                            <Upload className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {newCharacterImages.length >= 4 
                                ? "Maximum 4 images reached" 
                                : "Upload Character Images"
                              }
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {newCharacterImages.length >= 4 
                                ? "Remove some images to add more" 
                                : `Click to upload up to 4 images (${newCharacterImages.length}/4)`
                              }
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                    
                    {/* Image Previews */}
                    {newCharacterImages.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {newCharacterImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Character inspiration ${index + 1}`}
                              className="w-full h-28 object-cover rounded-xl border-2 border-border/30 shadow-sm group-hover:shadow-md transition-shadow"
                            />
                            <button
                              type="button"
                              onClick={() => removeCharacterImage(index)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90 shadow-lg hover:scale-110 transition-all"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                        </div>
                          </div>
                        ))}
                        </div>
                      )}
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-border/30">
                  <Button 
                    onClick={handleAddCharacter} 
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200" 
                    disabled={!newCharacterDescription.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Create Character
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCharacterDialogOpen(false)}
                    className="flex-1 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {characters.length > 0 && (
          <div className="space-y-6">
            {characters.map((character) => (
              <div key={character.id} className="space-y-4">
                {/* Character Info Card */}
                <Card className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Show selected variation image if available, otherwise show uploaded images or placeholder */}
                      {character.selectedVariation ? (
                        <div className="w-12 h-12 relative">
                          <img 
                            src={character.selectedVariation} 
                            alt={`${character.name} - Selected Variation`}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            ✓
                          </div>
                        </div>
                      ) : character.images && character.images.length > 0 ? (
                        <div className="w-12 h-12 relative">
                          <img 
                            src={character.images[0]} 
                            alt={character.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          {character.images.length > 1 && (
                            <div className="absolute -bottom-1 -right-1 bg-muted text-muted-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              +{character.images.length - 1}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-lg">{character.name}</span>
                          {character.role && (
                            <Badge variant="outline" className="text-xs">
                              {character.role === "other" && character.customRole ? character.customRole : character.role}
                            </Badge>
                          )}
                          {character.selectedVariation && (
                            <Badge variant="default" className="text-xs">
                              Variation Selected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{character.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {character.skinTone && (
                            <Badge variant="secondary" className="text-xs">
                              Skin: {character.skinTone}
                            </Badge>
                          )}
                          {character.hairColor && (
                            <Badge variant="secondary" className="text-xs">
                              Hair: {character.hairColor}
                            </Badge>
                          )}
                          {character.eyeColor && (
                            <Badge variant="secondary" className="text-xs">
                              Eyes: {character.eyeColor}
                            </Badge>
                          )}
                          {character.outfitMain && (
                            <Badge variant="secondary" className="text-xs">
                              Outfit: {character.outfitMain}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCharacter(character.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>

                {/* Character Variations - Show only for the character that was just generated */}
                {currentGeneratingCharacterId === character.id && (
                  <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                    <CharacterVariations
                      variations={variations}
                      variationsMetadata={generationResult?.variations}
                      isLoading={isGenerating}
                      onSelect={(index) => handleCharacterVariationSelect(character.id, index)}
                      onRegenerate={async () => {
                        // Regenerate variations for this specific character
                        setCurrentGeneratingCharacterId(character.id)
                        
                        // Prepare comic settings for regeneration
                        const comicSettings = {
                          inspirationStyle: inspirationStyle.length > 0 ? inspirationStyle[0] : "realistic",
                          vibe: vibe.length > 0 ? vibe[0] : "neutral",
                          type: type || "color"
                        }
                        
                        await regenerateCharacter(character, comicSettings, {
                          comicTitle: title.trim() || 'Untitled Comic',
                          selectedArtifact: selectedArtifactData ? {
                            id: selectedArtifactData.id,
                            title: selectedArtifactData.title,
                            isPublic: (selectedArtifactData as any)?.isPublic || false,
                            type: (selectedArtifactData as any)?.type || 'comic',
                            section: (selectedArtifactData as any)?.section || 'user-artifacts'
                          } : undefined
                        })
                      }}
                      selectedIndex={character.selectedVariationIndex}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Show selected variation details if available */}
                {character.selectedVariation && character.variationMetadata && (
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">Selected Character Variation</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <img 
                          src={character.selectedVariation} 
                          alt={`${character.name} - Selected`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Variation:</span> {character.selectedVariationIndex! + 1}</div>
                        <div><span className="font-medium">Style:</span> {character.variationMetadata.metadata?.comicSettings?.inspirationStyle}</div>
                        <div><span className="font-medium">Vibe:</span> {character.variationMetadata.metadata?.comicSettings?.vibe}</div>
                        <div><span className="font-medium">Generated:</span> {new Date(character.variationMetadata.metadata?.generationContext?.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="bg-background border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">New Comic Project</h3>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <StepIndicator />

      <div className="min-h-[400px]">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
      </div>

      <div className="flex gap-2 pt-4">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
        )}

        {currentStep < totalSteps ? (
          <Button
            onClick={handleNextStep}
            className="flex-1 flex items-center gap-2"
            disabled={!canGoToNextStep()}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <>
            {/* Debug info */}
            <div className="w-full mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <div className="font-medium">Debug: Final Step Reached</div>
              <div>Current Step: {currentStep} / {totalSteps}</div>
              <div>Save button should be visible below</div>
            </div>
            
            {/* Main Save Button - Primary Action */}
            <div className="w-full mb-3">
              <Button
                type="button"
                onClick={handleSave}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3"
                disabled={!title.trim() || !description.trim() || !selectedArtifact || !type || vibe.length === 0 || vibe.includes('none')}
              >
                <Save className="mr-2 h-5 w-5" />
                🎬 CREATE COMIC PROJECT
              </Button>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                This will create your comic and take you to the comic section
              </p>
            </div>
            
            {/* Secondary Actions */}
            <div className="space-y-2">
              {variations.length > 0 && (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {}}
                    className="w-full"
                  >
                    💾 Save Variations to Templates (Optional)
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    This only saves character variations, doesn't create the comic
                  </p>
                </div>
              )}
              {/* Debug button to manually sync variations */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  console.log('🔧 Manual sync triggered')
                  if (setCharacterVariations && setIsGeneratingVariations) {
                    setCharacterVariations(variations)
                    setIsGeneratingVariations(isGenerating)
                  }
                }}
                className="w-full text-xs"
              >
                🔧 Debug: Manual Sync Variations
              </Button>
            </div>
            
            {/* Validation status indicator */}
            {(!title.trim() || !description.trim() || !selectedArtifact || !type || vibe.length === 0 || vibe.includes('none')) && (
              <div className="w-full mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <div className="font-medium mb-1">Missing required fields:</div>
                <div className="space-y-1">
                  {!title.trim() && <div>• Title</div>}
                  {!description.trim() && <div>• Description</div>}
                  {!selectedArtifact && <div>• Artifact</div>}
                  {!type && <div>• Type</div>}
                  {vibe.length === 0 && <div>• Vibe/Tone</div>}
                  {vibe.includes('none') && <div>• Vibe/Tone (cannot be "none")</div>}
                </div>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </>
        )}
        
        {/* Always visible save button as fallback */}
        <div className="w-full mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-sm text-yellow-800 mb-2">
            <strong>Alternative Save Button (Always Visible):</strong>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold"
            disabled={!title.trim() || !description.trim() || !selectedArtifact || !type || vibe.length === 0 || vibe.includes('none')}
          >
            <Save className="mr-2 h-4 w-4" />
            🎬 SAVE COMIC PROJECT (Alternative)
          </Button>
        </div>
      </div>
    </div>
  )
}
