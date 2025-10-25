"use client"

import { useState, useEffect, useRef } from "react"
import { mutate } from 'swr'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Mic, 
  Play, 
  Pause, 
  Volume2, 
  Download,
  Sparkles,
  X,
  Check,
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
  User,
  Clock,
  FileAudio,
  ExternalLink
} from "lucide-react"
import { OPENAI_VOICES, type OpenAIVoice } from "@/lib/openai/text-to-speech"
import { useToast} from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { useCacheContext } from "@/hooks/use-cache-context"
import { cn } from "@/lib/utils"
import { buildOpenAIInstructions } from "@/lib/utils/openai-voice-instructions-builder"

interface VoiceoverGeneratorInterfaceProps {
  onClose: () => void
  projectTitle?: string
}


interface VoiceoverPreview {
  id: string
  audio_base_64: string
  media_type: string
  duration_secs: number
  language: string
  variation: string
}

const VOICEOVER_USE_CASES = [
  "📖 Narration",
  "📢 Commercial", 
  "🎓 Educational",
  "🎙️ Podcast",
  "📚 Audiobook",
  "🎬 Documentary",
  "💻 E-learning",
  "📰 News",
  "📻 Radio",
  "📖 Storytelling",
  "🧘 Meditation",
  "🤫 ASMR",
  "🎭 Character Voice",
  "🏢 Brand Voice",
  "🎧 Customer Service",
  "🤖 Virtual Assistant",
  "🎮 Game NPC",
  "🎬 Trailer",
  "📢 Promo",
  "📢 Announcement"
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

const EMOTION_OPTIONS = [
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

// Voice Identity Options
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

// Emotional DNA Options
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


export function VoiceoverGeneratorInterface({ onClose, projectTitle }: VoiceoverGeneratorInterfaceProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { invalidateSection } = useCacheContext()
  
  // Voiceover Configuration
  const [prompt, setPrompt] = useState("")
  const [language, setLanguage] = useState("English")
  const [selectedVoice, setSelectedVoice] = useState<OpenAIVoice | null>(null)
  
  
  const [useCase, setUseCase] = useState("")
  
  // New Voice Identity states
  const [gender, setGender] = useState("")
  const [perceivedAge, setPerceivedAge] = useState("")
  const [accent, setAccent] = useState("")
  const [tone, setTone] = useState("")
  const [pitchLevel, setPitchLevel] = useState([50])
  const [pacing, setPacing] = useState("")
  const [fidelity, setFidelity] = useState("")
  
  // New Emotional DNA states
  const [moodContext, setMoodContext] = useState("")
  const [emotionalWeight, setEmotionalWeight] = useState([50])
  const [characterRole, setCharacterRole] = useState("")
  const [performanceStyle, setPerformanceStyle] = useState("")
  
  // Custom field states
  const [customLanguage, setCustomLanguage] = useState("")
  const [customVoice, setCustomVoice] = useState("")
  const [customGender, setCustomGender] = useState("")
  const [customPerceivedAge, setCustomPerceivedAge] = useState("")
  const [customAccent, setCustomAccent] = useState("")
  const [customTone, setCustomTone] = useState("")
  const [customPacing, setCustomPacing] = useState("")
  const [customFidelity, setCustomFidelity] = useState("")
  const [customMoodContext, setCustomMoodContext] = useState("")
  const [customCharacterRole, setCustomCharacterRole] = useState("")
  const [customPerformanceStyle, setCustomPerformanceStyle] = useState("")
  const [customUseCase, setCustomUseCase] = useState("")
  
  // Voice Preview Audio
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null)

  
  // Preview & Fine-tuning
  const [isGenerating, setIsGenerating] = useState(false)
  const [voiceoverPreviews, setVoiceoverPreviews] = useState<VoiceoverPreview[]>([])
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({})
  
  // Export & Save
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedArtifact, setSelectedArtifact] = useState("")


  // Smart behavior logic for voice parameters
  const [smartMessage, setSmartMessage] = useState("")
  
  useEffect(() => {
    let message = ""
    
    if (gender === "Robotic" || gender === "Creature") {
      message = "Robotic/Creature voice selected — accent options disabled, modulation depth available."
    } else if (gender === "ASMR Whisper" || tone === "ASMR Whisper") {
      message = "ASMR whisper detected — soft speaking mode, enhanced audio processing for relaxation."
    } else if (fidelity === "Broadcast") {
      message = "Broadcast audio quality selected — room reverb toggle available."
    } else if (moodContext === "playful") {
      message = "Playful mood selected — pitch and pacing automatically raised."
    } else if (performanceStyle === "theatrical") {
      message = "Theatrical delivery style selected — natural dynamic range applied."
    } else if (characterRole === "ASMR Artist") {
      message = "ASMR content detected — whisper mode recommended, background sounds available."
    } else if (fidelity === "ASMR Quality" || fidelity === "Meditation Quality") {
      message = "ASMR/Meditation audio quality selected — enhanced binaural audio, whisper-friendly processing."
    }
    
    setSmartMessage(message)
  }, [gender, fidelity, moodContext, performanceStyle, characterRole, tone])


  const handleGenerateVoiceover = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt describing the voiceover you want to create.",
        variant: "destructive"
      })
      return
    }

    if (!selectedVoice?.id) {
      toast({
        title: "Voice selection required",
        description: "Please select an OpenAI voice.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      console.log('🎤 [VOICEOVER] Starting voiceover generation...')
      console.log('📝 [VOICEOVER] Selected voice:', selectedVoice?.name)
      console.log('🆔 [VOICEOVER] Voice ID being used:', selectedVoice?.id)
      console.log('📝 [VOICEOVER] Text length:', prompt.length)

      // Build instructions from UI parameters
      const instructions = buildOpenAIInstructions({
        gender,
        age: perceivedAge,
        accent,
        tone,
        pitch: pitchLevel[0],
        pacing,
        mood: moodContext,
        emotionalWeight: emotionalWeight[0],
        role: characterRole,
        style: performanceStyle,
        useCase,
        language
      })

      console.log('✨ [VOICEOVER] Generated instructions:', instructions.substring(0, 200) + '...')

      // Prepare voiceover data
      const voiceoverData = {
        title: title || `${selectedVoice?.name || 'Voiceover'} - ${new Date().toLocaleString()}`,
        description: description || `Voiceover generated with ${selectedVoice?.name}`,
        prompt: prompt.trim(), // Use original prompt
        language: language === 'custom' ? customLanguage : language,
        voice_id: selectedVoice?.id === 'custom' ? 'alloy' : selectedVoice?.id, // Fallback to default voice for custom
        use_case: useCase === 'custom' ? customUseCase : useCase,
        content: {
          original_prompt: prompt, // User's original input
          instructions: instructions, // OpenAI instructions
          voice_identity: {
            gender: gender === 'custom' ? customGender : gender,
            age: perceivedAge === 'custom' ? customPerceivedAge : perceivedAge,
            accent: accent === 'custom' ? customAccent : accent,
            tone: tone === 'custom' ? customTone : tone,
            pitch: pitchLevel[0],
            pacing: pacing === 'custom' ? customPacing : pacing,
            fidelity: fidelity === 'custom' ? customFidelity : fidelity
          },
          emotional_dna: {
            mood: moodContext === 'custom' ? customMoodContext : moodContext,
            emotional_weight: emotionalWeight[0],
            role: characterRole === 'custom' ? customCharacterRole : characterRole,
            style: performanceStyle === 'custom' ? customPerformanceStyle : performanceStyle
          },
          custom_fields: {
            custom_voice: selectedVoice?.id === 'custom' ? customVoice : null,
            custom_language: language === 'custom' ? customLanguage : null,
            custom_gender: gender === 'custom' ? customGender : null,
            custom_age: perceivedAge === 'custom' ? customPerceivedAge : null,
            custom_accent: accent === 'custom' ? customAccent : null,
            custom_tone: tone === 'custom' ? customTone : null,
            custom_pacing: pacing === 'custom' ? customPacing : null,
            custom_fidelity: fidelity === 'custom' ? customFidelity : null,
            custom_mood: moodContext === 'custom' ? customMoodContext : null,
            custom_role: characterRole === 'custom' ? customCharacterRole : null,
            custom_style: performanceStyle === 'custom' ? customPerformanceStyle : null,
            custom_use_case: useCase === 'custom' ? customUseCase : null
          }
        }
      }

      console.log('🌐 [VOICEOVER] Calling /api/voiceovers...')

      // Call our voiceover generation API
      const response = await fetch('/api/voiceovers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voiceoverData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ [VOICEOVER] API error:', errorData)
        throw new Error(errorData.error || 'Voiceover generation failed')
      }

      const result = await response.json()
      console.log('✅ [VOICEOVER] Generation successful:', result)

      // Create preview object from the generated voiceover
      const preview: VoiceoverPreview = {
        id: result.voiceover.id,
        audio_base_64: result.voiceover.generated_audio_path,
        media_type: "audio/mpeg",
        duration_secs: 5.2, // This would be calculated from actual audio
        language: language,
        variation: "Generated"
      }
      
      setVoiceoverPreviews([preview])
      setSelectedPreview(preview.id)
      
      toast({
        title: "Voiceover generated successfully!",
        description: `Your voiceover has been saved to your library.`
      })

      // Invalidate cache to refresh the voiceovers section
      await invalidateSection('voiceovers')

      // Refresh the library to show the new voiceover
      mutate('/api/voiceovers')

    } catch (error) {
      console.error('❌ [VOICEOVER] Generation failed:', error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePlayPreview = (previewId: string) => {
    if (isPlaying === previewId) {
      setIsPlaying(null)
      audioRefs.current[previewId]?.pause()
    } else {
      setIsPlaying(previewId)
      const audio = audioRefs.current[previewId]
      if (audio) {
        audio.play()
      }
    }
  }

  const handlePlayVoicePreview = (voiceId: string) => {
    if (playingVoiceId === voiceId) {
      // Pause current voice
      voiceAudioRef.current?.pause()
      setPlayingVoiceId(null)
    } else {
      // Stop any currently playing voice
      if (playingVoiceId) {
        voiceAudioRef.current?.pause()
      }
      
      // Play new voice
      setPlayingVoiceId(voiceId)
      
      // Generate a sample audio for preview using OpenAI TTS
      const sampleText = "Hello, this is a preview of my voice. I can speak naturally and clearly."
      
      fetch('/api/openai/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voice: voiceId,
          response_format: 'mp3'
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.blob()
      })
      .then(blob => {
        const audioUrl = URL.createObjectURL(blob)
        const audio = new Audio(audioUrl)
        voiceAudioRef.current = audio
        
        audio.play().catch(error => {
          console.error('Error playing voice preview:', error)
          setPlayingVoiceId(null)
        })
        
        audio.onended = () => {
          setPlayingVoiceId(null)
          URL.revokeObjectURL(audioUrl)
        }
        audio.onerror = () => {
          console.error('Audio playback error')
          setPlayingVoiceId(null)
          URL.revokeObjectURL(audioUrl)
        }
      })
      .catch(error => {
        console.error('Error generating voice preview:', error)
        setPlayingVoiceId(null)
        toast({
          title: "Preview failed",
          description: "Could not generate voice preview. Please try again.",
          variant: "destructive"
        })
      })
    }
  }


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-1">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[calc(100vh-1rem)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div>
              <h2 className="text-xs font-bold">Voiceover Studio</h2>
              <p className="text-[10px] text-muted-foreground">Generate high-quality voiceovers using OpenAI's GPT-4o-mini-TTS with natural language instructions.</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-5 w-5 shrink-0">
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-6rem)] p-2 space-y-3 scrollbar-hover">
          
          {/* Script Input Section */}
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="flex items-center gap-2 text-xs">
                <Mic className="h-3 w-3" />
                🎤 Script & Voice Selection
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-blue-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md p-3 bg-white border-2 border-blue-200 shadow-xl max-h-[70vh] overflow-y-auto scrollbar-hover">
                      <div className="text-xs space-y-2 text-gray-800">
                        <p className="font-bold text-blue-900 text-sm">💡 Pro Tip: Use Audio Tags for Better Expression</p>
                        <p className="text-gray-700 text-xs">
                          Eleven v3 supports audio tags to control voice delivery and emotion. Here are all available tags:
                        </p>
                        
                        <div className="grid grid-cols-1 gap-2 text-[10px]">
                          <div className="space-y-2">
                            <div>
                              <p className="text-blue-900 font-bold mb-1 text-xs">🎭 Voice & Emotions:</p>
                              <div className="text-gray-700 space-y-1">
                                <p><code>[laughs]</code>, <code>[laughs harder]</code>, <code>[starts laughing]</code>, <code>[wheezing]</code></p>
                                <p><code>[whispers]</code>, <code>[sighs]</code>, <code>[exhales]</code></p>
                                <p><code>[sarcastic]</code>, <code>[curious]</code>, <code>[excited]</code>, <code>[crying]</code></p>
                                <p><code>[snorts]</code>, <code>[mischievously]</code>, <code>[happy]</code>, <code>[sad]</code></p>
                                <p><code>[angry]</code>, <code>[annoyed]</code>, <code>[appalled]</code>, <code>[thoughtful]</code></p>
                                <p><code>[surprised]</code>, <code>[professional]</code>, <code>[sympathetic]</code></p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-blue-900 font-bold mb-1 text-xs">🔊 Sound Effects:</p>
                              <div className="text-gray-700 space-y-1">
                                <p><code>[gunshot]</code>, <code>[applause]</code>, <code>[clapping]</code>, <code>[explosion]</code></p>
                                <p><code>[swallows]</code>, <code>[gulps]</code>, <code>[clears throat]</code></p>
                                <p><code>[short pause]</code>, <code>[long pause]</code>, <code>[exhales sharply]</code></p>
                                <p><code>[inhales deeply]</code>, <code>[chuckles]</code>, <code>[giggles]</code></p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-blue-900 font-bold mb-1 text-xs">🌍 Accents & Special:</p>
                              <div className="text-gray-700 space-y-1">
                                <p><code>[strong French accent]</code>, <code>[strong Russian accent]</code></p>
                                <p><code>[strong British accent]</code>, <code>[strong German accent]</code></p>
                                <p><code>[strong Spanish accent]</code>, <code>[strong Italian accent]</code></p>
                                <p><code>[sings]</code>, <code>[woo]</code>, <code>[fart]</code></p>
                                <p><code>[robotic voice]</code>, <code>[binary beeping]</code></p>
                                <p><code>[dramatically]</code>, <code>[warmly]</code>, <code>[delightedly]</code></p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-blue-900 font-bold mb-1 text-xs">🎬 Dialogue & Timing:</p>
                              <div className="text-gray-700 space-y-1">
                                <p><code>[starting to speak]</code>, <code>[jumping in]</code></p>
                                <p><code>[overlapping]</code>, <code>[interrupting]</code></p>
                                <p><code>[stopping abruptly]</code>, <code>[cautiously]</code></p>
                                <p><code>[questioning]</code>, <code>[reassuring]</code></p>
                                <p><code>[impressed]</code>, <code>[alarmed]</code>, <code>[sheepishly]</code></p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                          <p className="text-blue-900 font-bold text-xs mb-1">📝 Example Usage:</p>
                          <div className="text-gray-700 text-[10px] space-y-1">
                            <div>
                              <p className="font-medium mb-1">English Script:</p>
                              <p>"In the ancient land of Eldoria, where skies shimmered and forests whispered secrets to the wind, lived a dragon named Zephyros. [sarcastically] Not the 'burn it all down' kind... [giggles] but he was gentle, wise, with eyes like old stars. [whispers] Even the birds fell silent when he passed."</p>
                            </div>
                            <div>
                              <p className="font-medium mb-1">French Script (with English tags):</p>
                              <p>"Tu es une ordure, soldat ! Tu crois avoir ce qu'il faut pour être le MEILLEUR ?! [chuckles] tu es une honte pour la troupe - DÉGAGE DE MA VUE !! [voix aiguë] ooohh, mais c'est trop 'DIFFICILE'..,[voix aiguë] je n'ai pas assez de force ni de volonté, j'ai trop peur ! [rire] ASSEZ ! tu me fais rire, soldat, ET TU ME DONNES LA NAUSÉE !"</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-[10px] text-gray-700">
                          <p><strong>💡 Tips:</strong> Combine multiple tags, match tags to your voice's character, and experiment with different combinations for best results!</p>
                        </div>
                        
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded border-l-4 border-l-amber-400">
                          <div className="flex items-start gap-1">
                            <span className="text-amber-600 text-xs">⚠️</span>
                            <div className="text-[10px]">
                              <p className="text-amber-900 font-bold mb-1">Important: Audio Tags Language</p>
                              <p className="text-gray-700">
                                <strong>Always write audio tags in English</strong>, even if your script is in another language. 
                                The tags are processed by the AI model and must be in English to work correctly.
                              </p>
                              <p className="text-gray-700 mt-1">
                                <strong>Example:</strong> "Bonjour, comment allez-vous? [whispers] Je suis très heureux de vous voir." 
                                ✅ Correct - script in French, tags in English
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription className="text-[10px]">
                Enter your script and select a voice from your DreamCut voice library.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">📝 Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Product Demo Voiceover"
                    className="h-7 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">📝 Prompt *</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the voiceover you want to create... (e.g., A professional female voice narrating a product demo with enthusiasm)"
                    className="min-h-[60px] text-xs resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
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
                        <SelectItem value="custom">✏️ Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {language === 'custom' && (
                      <Input
                        value={customLanguage}
                        onChange={(e) => setCustomLanguage(e.target.value)}
                        placeholder="Enter custom language..."
                        className="h-7 text-xs mt-2"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">🎤 OpenAI Voice</Label>
                    <Select 
                      value={selectedVoice?.id || undefined} 
                      onValueChange={(value) => {
                        if (value === 'custom') {
                          setSelectedVoice({ id: 'custom', name: 'Custom Voice', description: 'Custom voice description' } as OpenAIVoice)
                        } else {
                          const voice = OPENAI_VOICES.find(v => v.id === value)
                          console.log('🎤 [OPENAI VOICE SELECTED]', {
                            name: voice?.name,
                            id: voice?.id,
                            description: voice?.description
                          })
                          setSelectedVoice(voice || null)
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select an OpenAI voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPENAI_VOICES.map((voice) => (
                          <SelectItem 
                            key={voice.id} 
                            value={voice.id}
                            className="cursor-pointer hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs truncate">
                                  {voice.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground truncate">
                                  {voice.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs truncate">✏️ Custom Voice</div>
                              <div className="text-[10px] text-muted-foreground truncate">Enter your own voice description</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedVoice?.id === 'custom' && (
                      <Input
                        value={customVoice}
                        onChange={(e) => setCustomVoice(e.target.value)}
                        placeholder="Enter custom voice description..."
                        className="h-7 text-xs mt-2"
                      />
                    )}
                  </div>

                </div>

                {/* Selected Voice Preview */}
                {selectedVoice && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Mic className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-xs">{selectedVoice.name}</h4>
                          <p className="text-[10px] text-muted-foreground">{selectedVoice.description}</p>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="secondary" className="text-[10px]">
                              OpenAI TTS
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {selectedVoice.id}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => handlePlayVoicePreview(selectedVoice.id)}
                        >
                          {playingVoiceId === selectedVoice.id ? (
                            <Pause className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>



          {/* Voice Settings Section */}
          <Card>
            <CardHeader className="p-2">
              <CardTitle className="flex items-center gap-2 text-xs">
                <Settings className="h-3 w-3" />
                ⚙️ Voice Settings
              </CardTitle>
              <CardDescription className="text-[10px]">
                Fine-tune the voice characteristics for your voiceover using advanced parameters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-3">
              
              {/* Voice Identity Parameters */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium flex items-center gap-2">
                  <Mic className="h-3 w-3" />
                  🎤 Voice Identity Parameters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                        <SelectItem value="custom">✏️ Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {gender === 'custom' && (
                      <Input
                        value={customGender}
                        onChange={(e) => setCustomGender(e.target.value)}
                        placeholder="Enter custom gender/timbre..."
                        className="h-7 text-xs mt-2"
                      />
                    )}
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
                        <SelectItem value="custom">✏️ Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {perceivedAge === 'custom' && (
                      <Input
                        value={customPerceivedAge}
                        onChange={(e) => setCustomPerceivedAge(e.target.value)}
                        placeholder="Enter custom age..."
                        className="h-7 text-xs mt-2"
                      />
                    )}
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
                        <SelectItem value="custom">✏️ Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {accent === 'custom' && (
                      <Input
                        value={customAccent}
                        onChange={(e) => setCustomAccent(e.target.value)}
                        placeholder="Enter custom accent..."
                        className="h-7 text-xs mt-2"
                      />
                    )}
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
                        <SelectItem value="custom">✏️ Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {tone === 'custom' && (
                      <Input
                        value={customTone}
                        onChange={(e) => setCustomTone(e.target.value)}
                        placeholder="Enter custom tone..."
                        className="h-7 text-xs mt-2"
                      />
                    )}
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
                        <SelectItem value="custom">✏️ Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {pacing === 'custom' && (
                      <Input
                        value={customPacing}
                        onChange={(e) => setCustomPacing(e.target.value)}
                        placeholder="Enter custom pacing..."
                        className="h-7 text-xs mt-2"
                      />
                    )}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">🔍 Audio Quality</Label>
                    <Select value={fidelity} onValueChange={setFidelity}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select audio quality" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIDELITY_OPTIONS.map((fidelityOption) => (
                          <SelectItem key={fidelityOption} value={fidelityOption.toLowerCase()}>
                            {fidelityOption}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">✏️ Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {fidelity === 'custom' && (
                      <Input
                        value={customFidelity}
                        onChange={(e) => setCustomFidelity(e.target.value)}
                        placeholder="Enter custom audio quality..."
                        className="h-7 text-xs mt-2"
                      />
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Emotional DNA Parameters */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium flex items-center gap-2">
                  <Heart className="h-3 w-3" />
                  💝 Emotional DNA Parameters
                </h4>
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
                        <SelectItem value="custom">✏️ Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {moodContext === 'custom' && (
                      <Input
                        value={customMoodContext}
                        onChange={(e) => setCustomMoodContext(e.target.value)}
                        placeholder="Enter custom mood..."
                        className="h-7 text-xs mt-2"
                      />
                    )}
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
                    <Label className="text-xs">🎭 Voice Character</Label>
                    <Select value={characterRole} onValueChange={setCharacterRole}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select character" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((role) => (
                          <SelectItem key={role} value={role.toLowerCase()}>
                            {role}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">✏️ Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {characterRole === 'custom' && (
                      <Input
                        value={customCharacterRole}
                        onChange={(e) => setCustomCharacterRole(e.target.value)}
                        placeholder="Enter custom character role..."
                        className="h-7 text-xs mt-2"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">🎪 Delivery Style</Label>
                    <Select value={performanceStyle} onValueChange={setPerformanceStyle}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select delivery style" />
                      </SelectTrigger>
                      <SelectContent>
                        {STYLE_OPTIONS.map((styleOption) => (
                          <SelectItem key={styleOption} value={styleOption.toLowerCase()}>
                            {styleOption}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">✏️ Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {performanceStyle === 'custom' && (
                      <Input
                        value={customPerformanceStyle}
                        onChange={(e) => setCustomPerformanceStyle(e.target.value)}
                        placeholder="Enter custom delivery style..."
                        className="h-7 text-xs mt-2"
                      />
                    )}
                  </div>

                </div>
              </div>

              <Separator />

              {/* Additional Voice Settings */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium flex items-center gap-2">
                  <Settings className="h-3 w-3" />
                  🎛️ Additional Voice Settings
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">🎯 Content Type</Label>
                    <Select value={useCase} onValueChange={setUseCase}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                      <SelectContent>
                        {VOICEOVER_USE_CASES.map((useCaseOption) => (
                          <SelectItem key={useCaseOption} value={useCaseOption.replace(/^[^\s]+\s/, '').toLowerCase()}>
                            {useCaseOption}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">✏️ Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {useCase === 'custom' && (
                      <Input
                        value={customUseCase}
                        onChange={(e) => setCustomUseCase(e.target.value)}
                        placeholder="Enter custom content type..."
                        className="h-7 text-xs mt-2"
                      />
                    )}
                  </div>
                </div>
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
          <Card className="border shadow-md bg-white dark:bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-end gap-4">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  className="h-10 text-sm font-semibold min-w-[100px] border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 shadow-sm"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerateVoiceover} 
                  disabled={!prompt.trim() || isGenerating} 
                  className="h-10 text-sm font-semibold min-w-[120px] bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Voiceover
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}