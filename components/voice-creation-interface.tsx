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
import { Label } from "@/components/ui/label"
import { 
  Mic, 
  Download,
  Sparkles,
  X,
  Info,
  Save,
  Settings,
  Globe,
  Heart,
  Zap,
  Droplets,
  Flame,
  Smile,
  Shield,
  Moon,
  Sun,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { filterFilledFields } from "@/lib/utils/prompt-builder"
import { buildVoicePrompt } from "@/lib/utils/voice-prompt-builder"
import { PreviousGenerations } from "@/components/ui/previous-generations"
import { GenerationLoading } from "@/components/ui/generation-loading"

interface VoiceCreationInterfaceProps {
  onClose: () => void
  projectTitle?: string
}


const VOICE_PURPOSES = [
  "📖 Narrator",
  "🎭 Character", 
  "🏢 Brand Voice",
  "🎓 Educator",
  "🤖 AI Persona",
  "🎮 Game NPC",
  "📞 Customer Service",
  "💬 Virtual Assistant",
  "🎙️ Podcast Host",
  "🎬 Documentary Voice",
  "📢 Commercial Voice",
  "📚 Audiobook Reader",
  "💻 E-learning Instructor",
  "📺 News Anchor",
  "📻 Radio DJ",
  "📚 Storyteller",
  "🧘 Meditation Guide",
  "🎧 ASMR Content Creator"
]

const LANGUAGES = [
  "🇺🇸 English",
  "🇫🇷 French", 
  "🇪🇸 Spanish",
  "🇯🇵 Japanese",
  "🇨🇳 Chinese (Mandarin)",
  "🇭🇰 Chinese (Cantonese)",
  "🇩🇪 German",
  "🇮🇹 Italian",
  "🇵🇹 Portuguese",
  "🇷🇺 Russian",
  "🇰🇷 Korean",
  "🇸🇦 Arabic",
  "🇮🇳 Hindi",
  "🇳🇱 Dutch",
  "🇸🇪 Swedish",
  "🇳🇴 Norwegian",
  "🇩🇰 Danish",
  "🇫🇮 Finnish",
  "🇵🇱 Polish",
  "🇨🇿 Czech",
  "🇭🇺 Hungarian",
  "🇹🇷 Turkish",
  "🇬🇷 Greek",
  "🇮🇱 Hebrew",
  "🇹🇭 Thai",
  "🇻🇳 Vietnamese",
  "🇮🇩 Indonesian",
  "🇲🇾 Malay",
  "🇵🇭 Filipino",
  "🌍 Multilingual"
]

const GENDER_OPTIONS = [
  "👨 Male",
  "👩 Female", 
  "⚧️ Androgynous",
  "🌈 Non-binary",
  "🤖 Robotic",
  "👹 Creature",
  "👶 Child-like",
  "👴 Elderly",
  "🎧 ASMR Whisper"
]

const AGE_OPTIONS = [
  "👶 Child",
  "🧒 Teen",
  "👨 Young Adult", 
  "👩 Mid-aged",
  "👴 Senior"
]

const ACCENT_OPTIONS = [
  "🇺🇸 Neutral American",
  "🇬🇧 British (RP)",
  "🇬🇧 British (Cockney)",
  "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scottish",
  "🇮🇪 Irish",
  "🇦🇺 Australian",
  "🇨🇦 Canadian",
  "🇺🇸 Southern US",
  "🇺🇸 New York",
  "🇺🇸 California",
  "🇺🇸 Texas",
  "🇮🇳 Indian",
  "🇿🇦 South African",
  "🇳🇿 New Zealand",
  "🇫🇷 French",
  "🇩🇪 German",
  "🇮🇹 Italian",
  "🇪🇸 Spanish",
  "🇷🇺 Russian",
  "🇯🇵 Japanese",
  "🇨🇳 Chinese",
  "🇰🇷 Korean",
  "🇸🇦 Arabic",
  "🇧🇷 Brazilian Portuguese",
  "🇲🇽 Mexican Spanish",
  "🇦🇷 Argentine Spanish",
  "🌍 No Accent (Neutral)"
]

const TONE_OPTIONS = [
  "🔥 Warm",
  "📢 Deep", 
  "🌊 Smooth",
  "🗣️ Raspy",
  "☀️ Light",
  "💨 Breathy",
  "🔧 Metallic",
  "📻 Resonant",
  "❄️ Crisp",
  "🍯 Mellow",
  "⚡ Sharp",
  "🌸 Soft",
  "💎 Rich",
  "💧 Clear",
  "🎤 Husky",
  "🦋 Velvety",
  "🏔️ Gravelly",
  "🕸️ Silky",
  "🧊 Brittle",
  "🎧 ASMR Whisper",
  "🧘 Meditation Tone",
  "😴 Sleepy Voice"
]

const PACING_OPTIONS = [
  "🐌 Slow",
  "💬 Conversational",
  "🏃 Fast", 
  "📏 Measured",
  "🎭 Erratic"
]

const FIDELITY_OPTIONS = [
  "🎙️ Studio",
  "📺 Broadcast",
  "📻 Vintage",
  "📞 Phone",
  "🤖 Robotic",
  "💎 High Definition",
  "💼 Professional",
  "🏠 Consumer",
  "🎙️ Podcast Quality",
  "📻 Radio Quality",
  "📺 TV Quality",
  "📱 Streaming Quality",
  "🎧 ASMR Quality",
  "🧘 Meditation Quality",
  "📻 Lo-fi",
  "💎 Hi-fi"
]

const MOOD_OPTIONS = [
  { value: "calm", label: "Calm", icon: "🌿" },
  { value: "energetic", label: "Energetic", icon: "⚡" },
  { value: "sad", label: "Sad", icon: "💧" },
  { value: "dramatic", label: "Dramatic", icon: "🔥" },
  { value: "playful", label: "Playful", icon: "🎈" },
  { value: "confident", label: "Confident", icon: "💪" },
  { value: "mysterious", label: "Mysterious", icon: "🌑" },
  { value: "hopeful", label: "Hopeful", icon: "🌅" },
  { value: "relaxed", label: "Relaxed", icon: "🧘" },
  { value: "sleepy", label: "Sleepy", icon: "😴" },
  { value: "soothing", label: "Soothing", icon: "🕊️" },
  { value: "meditative", label: "Meditative", icon: "🧘‍♀️" },
  { value: "whisper", label: "Whisper", icon: "🤫" },
  { value: "intimate", label: "Intimate", icon: "💕" },
  { value: "professional", label: "Professional", icon: "👔" },
  { value: "friendly", label: "Friendly", icon: "😊" },
  { value: "authoritative", label: "Authoritative", icon: "👑" },
  { value: "gentle", label: "Gentle", icon: "🕊️" }
]

const ROLE_OPTIONS = [
  "🦸 Hero",
  "😈 Villain",
  "🧙 Mentor",
  "📖 Narrator",
  "👨‍🏫 Teacher",
  "📢 Announcer",
  "🤖 AI Guide",
  "🤝 Sidekick",
  "🦸‍♂️ Protagonist",
  "🦹 Antagonist",
  "👥 Supporting Character",
  "👤 Background Character",
  "📞 Customer Service Rep",
  "💬 Virtual Assistant",
  "🎙️ Podcast Host",
  "📺 News Reporter",
  "🎬 Documentary Narrator",
  "📢 Commercial Voice",
  "📚 Audiobook Reader",
  "💻 E-learning Instructor",
  "📻 Radio DJ",
  "📚 Storyteller",
  "🧘 Meditation Guide",
  "🎧 ASMR Artist",
  "😴 Sleep Storyteller",
  "🧘 Relaxation Coach"
]

const STYLE_OPTIONS = [
  "🌿 Natural",
  "🎬 Cinematic",
  "🎭 Theatrical",
  "😏 Sarcastic",
  "💭 Dreamy",
  "🤫 Whispered",
  "👑 Commanding",
  "💬 Conversational",
  "👔 Formal",
  "😊 Casual",
  "🎭 Dramatic",
  "📏 Monotone",
  "🎪 Expressive",
  "🌸 Subtle",
  "🎪 Over-the-top",
  "💕 Intimate",
  "💼 Professional",
  "😊 Friendly",
  "👑 Authoritative",
  "🕊️ Gentle",
  "🎧 ASMR Style",
  "🧘 Meditation Style",
  "😴 Sleep Story Style",
  "🌊 Relaxation Style"
]

const AUDIO_QUALITY_OPTIONS = [
  "🎙️ Studio-grade",
  "🎬 Cinematic Mix",
  "📻 Lo-fi",
  "📞 Phone",
  "📼 Vintage Tape",
  "💎 High Definition",
  "💼 Professional",
  "📺 Broadcast Quality",
  "🎙️ Podcast Quality",
  "📻 Radio Quality",
  "📺 TV Quality",
  "📱 Streaming Quality",
  "🎧 ASMR Quality",
  "🧘 Meditation Quality",
  "😴 Sleep Quality",
  "🌊 Relaxation Quality",
  "🏠 Consumer Grade",
  "💎 Hi-fi",
  "🔊 Lossless"
]

const BRAND_PERSONA_OPTIONS = [
  "✨ Inspiring",
  "😊 Friendly",
  "🎓 Expert",
  "🕵️ Mysterious",
  "⚡ Energetic",
  "⚖️ Neutral",
  "💼 Professional",
  "😊 Casual",
  "👑 Authoritative",
  "🤝 Approachable",
  "🛡️ Trustworthy",
  "💡 Innovative",
  "🏛️ Traditional",
  "🚀 Modern",
  "💎 Luxury",
  "💰 Affordable",
  "👑 Premium",
  "🔒 Reliable",
  "🎨 Creative",
  "🔧 Technical",
  "🔥 Warm",
  "❄️ Cool",
  "🌊 Calm",
  "🎉 Exciting",
  "🌊 Soothing",
  "🎧 ASMR-friendly"
]

const SCRIPT_TONE_OPTIONS = [
  "📚 Informative",
  "💝 Emotional",
  "💬 Conversational",
  "🏢 Corporate",
  "🎭 Dramatic",
  "💼 Professional",
  "😊 Casual",
  "👔 Formal",
  "😊 Friendly",
  "👑 Authoritative",
  "🕊️ Gentle",
  "⚡ Energetic",
  "🌊 Calm",
  "🌊 Soothing",
  "🧘 Meditative",
  "🎧 ASMR",
  "😴 Sleep-inducing",
  "🌊 Relaxing",
  "💪 Motivational",
  "🎓 Educational",
  "🎪 Entertaining",
  "🎯 Persuasive",
  "⚖️ Neutral",
  "🔥 Warm",
  "❄️ Cool"
]

const ASMR_TRIGGERS = [
  "🤫 Whispering",
  "🌸 Soft Speaking",
  "💨 Breathing Sounds",
  "👄 Mouth Sounds",
  "👆 Tapping",
  "✋ Scratching",
  "🪥 Brushing",
  "📄 Paper Sounds",
  "💧 Water Sounds",
  "🌿 Nature Sounds",
  "⚪ White Noise",
  "🩷 Pink Noise",
  "🤎 Brown Noise",
  "🌧️ Rain Sounds",
  "🌊 Ocean Waves",
  "💨 Wind Sounds",
  "🔥 Fire Crackling",
  "🐦 Birds Chirping"
]

const ASMR_BACKGROUND_OPTIONS = [
  "❌ None",
  "🌧️ Soft Rain",
  "🌊 Ocean Waves",
  "🌲 Forest Sounds",
  "⚪ White Noise",
  "🩷 Pink Noise",
  "🤎 Brown Noise",
  "🔥 Fire Crackling",
  "🌳 Wind Through Trees",
  "🐦 Birds Chirping",
  "🎵 Gentle Music",
  "🌊 Ambient Sounds",
  "🔔 Meditation Bells",
  "🥣 Singing Bowl"
]

// Sound FX Integration Options
const SOUND_CATEGORIES = [
  "💥 Impact",
  "🌊 Ambience", 
  "🏃 Movement",
  "🖱️ Interface",
  "👹 Creature",
  "🌤️ Weather",
  "🎬 Foley",
  "🔄 Transition",
  "🎬 Trailer Hit"
]

const USAGE_CONTEXTS = [
  "🎬 Video",
  "🎮 Game", 
  "📢 Ad",
  "🖱️ UI",
  "🌊 Ambient Loop",
  "🎙️ Podcast",
  "🎮 Interactive"
]

const SOUND_TEXTURES = [
  "🔧 Metallic",
  "🌿 Organic",
  "🪵 Wooden", 
  "🤖 Synthetic",
  "💧 Watery",
  "💨 Airy",
  "🪨 Stone",
  "🧱 Plastic"
]

const ATTACK_TYPES = [
  "🌊 Soft fade",
  "⚡ Snappy hit",
  "🔪 Sharp transient",
  "🌊 Rolling onset"
]

const ENVIRONMENT_STYLES = [
  "🏠 Indoor",
  "🌳 Outdoor",
  "🏛️ Large Hall",
  "🌾 Open Field",
  "🌊 Submerged",
  "🚀 Space",
  "🎨 Abstract"
]

const REVERB_CHARACTERS = [
  "🔇 Dry",
  "🏠 Soft Room",
  "⛪ Cathedral",
  "🏛️ Metallic Hall",
  "🕳️ Cave",
  "🤖 Synthetic Space"
]

const STEREO_BEHAVIORS = [
  "🔊 Mono",
  "🎧 Wide Stereo",
  "🔄 Circular Pan",
  "🌊 Dynamic Sweep"
]

const AMBIENCE_LAYERS = [
  "🌧️ Rain",
  "💨 Wind",
  "👥 Crowd",
  "⚙️ Machines",
  "🌿 Nature",
  "🔇 Silence"
]

const MOTION_CHARACTERS = [
  "📈 Rising",
  "📉 Falling", 
  "💓 Pulsing",
  "📌 Sustained",
  "🎲 Randomized"
]

const PURPOSE_IN_SCENE_OPTIONS = [
  "📈 Build-Up",
  "💥 Impact",
  "🔄 Transition",
  "🌊 Background",
  "🎯 Cue",
  "🎨 Texture"
]

export function VoiceCreationInterface({ onClose, projectTitle }: VoiceCreationInterfaceProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  
  
  // Voice Identity
  const [voicePurpose, setVoicePurpose] = useState("")
  const [language, setLanguage] = useState("English")
  const [gender, setGender] = useState("")
  const [perceivedAge, setPerceivedAge] = useState("")
  const [accent, setAccent] = useState("")
  const [tone, setTone] = useState("")
  const [pitchLevel, setPitchLevel] = useState([50])
  const [pacing, setPacing] = useState("")
  const [fidelity, setFidelity] = useState("")
  
  // Emotional DNA
  const [moodContext, setMoodContext] = useState("")
  const [emotionalWeight, setEmotionalWeight] = useState([50])
  const [characterRole, setCharacterRole] = useState("")
  const [performanceStyle, setPerformanceStyle] = useState("")
  const [audioQualityIntent, setAudioQualityIntent] = useState("")
  const [guidanceScale, setGuidanceScale] = useState([50])
  const [previewText, setPreviewText] = useState("Welcome to DreamCut — where stories find their voice, visions take shape, and imagination turns moments into masterpieces.")
  
  
  // ASMR Voice Options
  const [isASMRVoice, setIsASMRVoice] = useState(false)
  const [asmrIntensity, setAsmrIntensity] = useState([50])
  const [asmrTriggers, setAsmrTriggers] = useState<string[]>([])
  const [asmrBackground, setAsmrBackground] = useState("")
  
  // Sound FX Integration Options
  const [soundCategory, setSoundCategory] = useState("")
  const [usageContext, setUsageContext] = useState("")
  const [soundTexture, setSoundTexture] = useState("")
  const [attackType, setAttackType] = useState("")
  const [environmentStyle, setEnvironmentStyle] = useState("")
  const [reverbCharacter, setReverbCharacter] = useState("")
  const [stereoBehavior, setStereoBehavior] = useState("")
  const [ambienceLayer, setAmbienceLayer] = useState("")
  const [motionCharacter, setMotionCharacter] = useState("")
  const [purposeInScene, setPurposeInScene] = useState("")
  
  // Preview & Fine-tuning
  const [isGenerating, setIsGenerating] = useState(false)
  const [fineTuningPitch, setFineTuningPitch] = useState([50])
  const [fineTuningSpeed, setFineTuningSpeed] = useState([50])
  const [fineTuningVolume, setFineTuningVolume] = useState([50])
  const [fineTuningWarmth, setFineTuningWarmth] = useState([50])
  const [fineTuningBreathiness, setFineTuningBreathiness] = useState([50])
  
  // Export & Save
  const [voiceName, setVoiceName] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [prompt, setPrompt] = useState("")
  
  // Smart behavior states
  const [smartMessage, setSmartMessage] = useState("")

  // Smart behavior logic
  useEffect(() => {
    let message = ""
    
    if (isASMRVoice) {
      message = "ASMR voice enabled — whisper mode activated, background sounds available, enhanced binaural processing."
    } else if (gender === "Robotic" || gender === "Creature") {
      message = "Robotic/Creature voice selected — accent options disabled, modulation depth available."
    } else if (gender === "ASMR Whisper" || tone === "ASMR Whisper") {
      message = "ASMR whisper detected — soft speaking mode, enhanced audio processing for relaxation."
    } else if (fidelity === "Broadcast") {
      message = "Broadcast quality selected — room reverb toggle available."
    } else if (moodContext === "playful") {
      message = "Playful mood selected — pitch and pacing automatically raised."
    } else if (performanceStyle === "theatrical") {
      message = "Theatrical style selected — natural dynamic range applied."
    } else if (audioQualityIntent === "lo-fi") {
      message = "Lo-fi quality selected — gentle distortion filter applied."
    } else if (audioQualityIntent === "ASMR Quality" || audioQualityIntent === "Meditation Quality") {
      message = "ASMR/Meditation quality selected — enhanced binaural audio, whisper-friendly processing."
    } else if (voicePurpose === "ASMR Content Creator" || characterRole === "ASMR Artist") {
      message = "ASMR content detected — whisper mode recommended, background sounds available."
    } else if (soundCategory) {
      message = `Sound category '${soundCategory}' selected — applying acoustic DNA and spatial characteristics.`
    } else if (usageContext === "UI") {
      message = "UI context selected — optimizing for short, crisp interface sounds."
    } else if (environmentStyle === "Space") {
      message = "Space environment selected — adding cosmic reverb and air filter effects."
    } else if (reverbCharacter === "Cathedral") {
      message = "Cathedral reverb selected — adding majestic, spacious audio processing."
    } else if (stereoBehavior === "Dynamic Sweep") {
      message = "Dynamic stereo sweep enabled — creating cinematic movement effects."
    } else if (motionCharacter === "Rising") {
      message = "Rising motion selected — building tension and crescendo effects."
    } else if (purposeInScene === "Impact") {
      message = "Impact purpose selected — emphasizing attack and punch characteristics."
    }
    
    setSmartMessage(message)
  }, [isASMRVoice, gender, fidelity, moodContext, performanceStyle, audioQualityIntent, voicePurpose, characterRole, tone, soundCategory, usageContext, environmentStyle, reverbCharacter, stereoBehavior, motionCharacter, purposeInScene])



  const handleSaveVoice = async () => {
    console.log('🎤 [VOICE CREATION] Starting voice generation...')
    
    if (!prompt.trim()) {
      console.log('❌ [VOICE CREATION] No prompt provided')
      toast({
        title: "Prompt required",
        description: "Please enter a prompt describing the voice you want to create.",
        variant: "destructive"
      })
      return
    }

    // Note: Preview text is optional - if not provided, ElevenLabs will auto-generate it

    try {
      console.log('📝 [VOICE CREATION] Building enhanced prompt...')
      // Build enhanced prompt from all UI parameters
      const enhancedPrompt = buildVoicePrompt({
        prompt: prompt.trim(),
        purpose: voicePurpose,
        language,
        gender,
        age: perceivedAge,
        accent,
        tone,
        pitch: pitchLevel[0],
        pacing,
        fidelity,
        mood: moodContext,
        emotional_weight: emotionalWeight[0],
        role: characterRole,
        style: performanceStyle,
        audio_quality: audioQualityIntent,
        guidance_scale: guidanceScale[0],
        preview_text: previewText,
        is_asmr_voice: isASMRVoice,
        asmr_intensity: asmrIntensity[0],
        asmr_triggers: asmrTriggers,
        asmr_background: asmrBackground,
        sound_category: soundCategory,
        usage_context: usageContext,
        sound_texture: soundTexture,
        attack_type: attackType,
        environment_style: environmentStyle,
        purpose_in_scene: purposeInScene
      })
      console.log('✅ [VOICE CREATION] Enhanced prompt:', enhancedPrompt.substring(0, 200) + '...')

      // Collect all creative fields for database storage
      const allFields = {
        name: voiceName || `Voice_${Date.now()}`,
        purpose: voicePurpose,
        language,
        gender,
        age: perceivedAge,
        accent,
        tone,
        pitch: pitchLevel[0],
        pacing,
        fidelity,
        mood: moodContext,
        emotional_weight: emotionalWeight[0],
        role: characterRole,
        style: performanceStyle,
        audio_quality: audioQualityIntent,
        guidance_scale: guidanceScale[0],
        preview_text: previewText,
        is_asmr_voice: isASMRVoice,
        asmr_intensity: asmrIntensity[0],
        asmr_triggers: asmrTriggers,
        asmr_background: asmrBackground,
        tags
      }

      // Filter to only filled fields
      const filledFields = filterFilledFields(allFields)

      const voiceData = {
        prompt: enhancedPrompt, // Enhanced prompt for AI
        name: voiceName || `Voice_${Date.now()}`,
        purpose: voicePurpose,
        language,
        gender,
        age: perceivedAge,
        accent,
        tone,
        pitch: pitchLevel[0],
        pacing,
        fidelity,
        mood: moodContext,
        emotional_weight: emotionalWeight[0],
        role: characterRole,
        style: performanceStyle,
        audio_quality: audioQualityIntent,
        guidance_scale: guidanceScale[0],
        preview_text: previewText,
        is_asmr_voice: isASMRVoice,
        asmr_intensity: asmrIntensity[0],
        asmr_triggers: asmrTriggers,
        asmr_background: asmrBackground,
        tags,
        auto_generate_text: false,
        created_at: new Date().toISOString()
      }
      console.log('📦 [VOICE CREATION] Payload:', JSON.stringify(voiceData, null, 2))

      console.log('🌐 [VOICE CREATION] Calling API...')
      // API call to save voice
      const response = await fetch('/api/voice-creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voiceData)
      })

      console.log('📡 [VOICE CREATION] Response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ [VOICE CREATION] Success:', result)
        

        // Refresh previous generations list immediately
        mutate('/api/library?content_type=voices_creations')

        toast({
          title: "Voice generated successfully!",
          description: `3 variations created and added to your ElevenLabs library.`
        })

        // Close the interface after brief delay
        setTimeout(() => onClose(), 1500)
      } else {
        const errorText = await response.text()
        console.error('❌ [VOICE CREATION] API Error:', errorText)
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error('❌ [VOICE CREATION] Exception:', error)
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      })
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }


  return (
    <>
      {/* Loading Overlay */}
      {isGenerating && (
        <GenerationLoading 
          model="Nano-banana"
          onCancel={() => setIsGenerating(false)}
        />
      )}
      
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-1">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[calc(100vh-1rem)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
          <div>
              <h2 className="text-xs font-bold">Voice Creation</h2>
              <p className="text-[10px] text-muted-foreground">Craft unique, emotionally intelligent voices that match your world's DNA.</p>
          </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-5 w-5 shrink-0">
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-6rem)] p-1 space-y-2 scrollbar-hover">
          
          {/* Voice Identity Section */}
          <Card>
            <CardHeader className="p-2">
              <CardTitle className="flex items-center gap-2 text-xs">
                <Mic className="h-3 w-3" />
                🎤 Voice Identity
              </CardTitle>
              <CardDescription className="text-[10px]">
                Define the vocal core — who is speaking, from where, and with what sound.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">📝 Voice Name</Label>
                  <Input
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="e.g., Ava – Calm Narrator"
                    className="h-7 text-xs"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">📝 Prompt *</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the voice you want to create... (e.g., A warm, friendly female voice with a slight British accent, perfect for educational content)"
                    className="min-h-[60px] text-xs resize-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">🎯 Voice Purpose</Label>
                  <Select value={voicePurpose} onValueChange={setVoicePurpose}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICE_PURPOSES.map((purpose) => (
                        <SelectItem key={purpose} value={purpose.replace(/^[^\s]+\s/, '').toLowerCase()}>
                          {purpose}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">🌍 Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang.replace(/^[^\s]+\s/, '')}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">👤 Gender / Timbre Base</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option.replace(/^[^\s]+\s/, '').toLowerCase()}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">🎂 Perceived Age</Label>
                  <Select value={perceivedAge} onValueChange={setPerceivedAge}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select age" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_OPTIONS.map((age) => (
                        <SelectItem key={age} value={age.toLowerCase()}>
                          {age}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">🗣️ Accent / Region</Label>
                  <Select 
                    value={accent} 
                    onValueChange={setAccent}
                    disabled={gender === "robotic" || gender === "creature"}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select accent" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCENT_OPTIONS.map((accentOption) => (
                        <SelectItem key={accentOption} value={accentOption.toLowerCase()}>
                          {accentOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">🎵 Tone / Timbre</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((toneOption) => (
                        <SelectItem key={toneOption} value={toneOption.toLowerCase()}>
                          {toneOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">📈 Pitch Level: {pitchLevel[0]}</Label>
                  <Slider
                    value={pitchLevel}
                    onValueChange={setPitchLevel}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">⏱️ Pacing / Rhythm</Label>
                  <Select value={pacing} onValueChange={setPacing}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select pacing" />
                    </SelectTrigger>
                    <SelectContent>
                      {PACING_OPTIONS.map((pacingOption) => (
                        <SelectItem key={pacingOption} value={pacingOption.toLowerCase()}>
                          {pacingOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">🔍 Clarity / Fidelity</Label>
                  <Select value={fidelity} onValueChange={setFidelity}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select fidelity" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIDELITY_OPTIONS.map((fidelityOption) => (
                        <SelectItem key={fidelityOption} value={fidelityOption.toLowerCase()}>
                          {fidelityOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>


                <div className="space-y-1">
                  <Label className="text-xs">🏷️ Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="h-7 text-xs"
                    />
                    <Button onClick={addTag} size="sm" className="h-7 text-xs">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1 text-xs">
                        {tag}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground italic">
                "Describe the physical quality of this voice — its texture, pace, and tone."
              </div>
            </CardContent>
          </Card>

          {/* Emotional DNA Section */}
          <Card>
            <CardHeader className="p-2">
              <CardTitle className="flex items-center gap-2 text-xs">
                <Heart className="h-3 w-3" />
                💝 Emotional DNA
              </CardTitle>
              <CardDescription className="text-[10px]">
                Shape the emotional and performance context.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">😊 Mood Context</Label>
                  <Select value={moodContext} onValueChange={setMoodContext}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select mood" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOOD_OPTIONS.map((mood) => (
                        <SelectItem key={mood.value} value={mood.value}>
                          <span className="text-xs">{mood.icon}</span> {mood.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">⚖️ Emotional Weight: {emotionalWeight[0]}</Label>
                  <Slider
                    value={emotionalWeight}
                    onValueChange={setEmotionalWeight}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Subtle</span>
                    <span>Expressive</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">🎭 Character Role</Label>
                  <Select value={characterRole} onValueChange={setCharacterRole}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role} value={role.toLowerCase()}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">🎪 Performance Style</Label>
                  <Select value={performanceStyle} onValueChange={setPerformanceStyle}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLE_OPTIONS.map((style) => (
                        <SelectItem key={style} value={style.toLowerCase()}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">🎧 Audio Quality Intent</Label>
                  <Select value={audioQualityIntent} onValueChange={setAudioQualityIntent}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIO_QUALITY_OPTIONS.map((quality) => (
                        <SelectItem key={quality} value={quality.toLowerCase()}>
                          {quality}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">🎯 Guidance Scale: {guidanceScale[0]}</Label>
                  <Slider
                    value={guidanceScale}
                    onValueChange={setGuidanceScale}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Creative Variation</span>
                    <span>Prompt Adherence</span>
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Text to Preview</Label>
                  <Textarea
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Enter text to preview the voice..."
                    className="min-h-[50px] text-xs"
                  />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{previewText.length} characters</span>
                    <span className="text-blue-500">
                      {previewText.length > 0 
                        ? "Custom text will be used" 
                        : "ElevenLabs will auto-generate text"
                      }
                    </span>
                  </div>
                </div>

              </div>

              <div className="text-xs text-muted-foreground italic">
                "Cinematic + Dramatic will apply reverb and deeper EQ tone."
              </div>
            </CardContent>
          </Card>







          {/* Smart Message */}
          {smartMessage && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <CardContent className="p-2">
                <div className="flex items-start gap-2">
                  <Info className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <p className="text-xs text-blue-800 dark:text-blue-200">{smartMessage}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card className="border border-gray-200 bg-white dark:bg-gray-900 shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  className="h-10 text-sm font-semibold min-w-[100px] border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 shadow-sm"
                >
            Cancel
          </Button>
                <Button 
                  onClick={handleSaveVoice} 
                  disabled={!prompt.trim()} 
                  className="h-10 text-sm font-semibold min-w-[120px] bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Voice
          </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


      {/* Previous Generations */}
      <PreviousGenerations 
        contentType="voices_creations" 
        userId={user?.id || ''} 
        className="mt-8"
      />
    </div>
    </>
  )
}
