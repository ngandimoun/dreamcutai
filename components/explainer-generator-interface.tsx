"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  X, 
  Sparkles, 
  ChevronDown,
  ChevronUp,
  Play,
  Download,
  Volume2,
  VolumeX,
  Subtitles,
  Palette,
  Clock,
  Monitor,
  Settings,
  Wand2,
  CheckCircle,
  Loader2,
  ArrowUp,
  Code,
  FileText,
  AlertCircle,
  RefreshCw,
  Copy
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { ExplainerVideoLibrary } from "@/components/explainer-video-library"
import { PreviousGenerations } from "@/components/ui/previous-generations"

interface ExplainerGeneratorInterfaceProps {
  onClose: () => void
  projectTitle: string
}

// OpenAI voices for the voiceover
const OPENAI_VOICES = [
  { value: "alloy", label: "⚖️ Alloy - Neutral, balanced" },
  { value: "ash", label: "🗿 Ash - Deep, authoritative" },
  { value: "ballad", label: "🎵 Ballad - Warm, storytelling" },
  { value: "coral", label: "🌺 Coral - Bright, energetic" },
  { value: "echo", label: "📢 Echo - Clear, professional" },
  { value: "fable", label: "📚 Fable - Educational, clear" },
  { value: "onyx", label: "💎 Onyx - Rich, narrative" },
  { value: "nova", label: "⭐ Nova - Conversational, friendly" },
  { value: "sage", label: "🧙 Sage - Wise, calm" },
  { value: "shimmer", label: "✨ Shimmer - Soft, soothing" },
  { value: "verse", label: "🎭 Verse - Poetic, expressive" }
]

// Languages for voiceover - REMOVED as requested

// Helper function to format duration
const formatDuration = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds}s`
  } else {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (remainingSeconds === 0) {
      return `${minutes}min`
    } else {
      return `${minutes}min ${remainingSeconds}s`
    }
  }
}

const ASPECT_RATIOS = [
  { value: "16:9", label: "📺 16:9 Widescreen" },
  { value: "9:16", label: "📱 9:16 Social" },
  { value: "1:1", label: "⬜ 1:1 Square" }
]

const RESOLUTIONS = [
  { value: "720p", label: "🎬 720p HD" },
  { value: "480p", label: "📺 480p SD" },
  { value: "1080p", label: "🎥 1080p Full HD" }
]

const STYLES = [
  { value: "auto", label: "🤖 Auto" },
  { value: "clean", label: "✨ Clean" },
  { value: "cinematic", label: "🎭 Cinematic" },
  { value: "academic", label: "🎓 Academic" }
]

export function ExplainerGeneratorInterface({ onClose, projectTitle }: ExplainerGeneratorInterfaceProps) {
  const { user } = useAuth()
  // Core state
  const [title, setTitle] = useState("")
  const [prompt, setPrompt] = useState("")
  const [hasVoiceover, setHasVoiceover] = useState(false)
  const [voiceStyle, setVoiceStyle] = useState("fable")
  
  // Smart options state
  const [isSmartOptionsOpen, setIsSmartOptionsOpen] = useState(false)
  const [duration, setDuration] = useState([8]) // Duration in seconds, default 8s
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [resolution, setResolution] = useState("720p")
  const [style, setStyle] = useState("auto")
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStep, setGenerationStep] = useState("")
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)
  const [hasSubtitles, setHasSubtitles] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  
  // Real-time job tracking
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<string>("")
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<string>("")
  const [manimCode, setManimCode] = useState<string>("")
  const [logs, setLogs] = useState<string>("")
  const [stderr, setStderr] = useState<string>("")
  
  // Refs and hooks
  const supabase = createClient()
  const { toast } = useToast()
  const realtimeChannel = useRef<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'generate' | 'library'>('generate')

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationStep("Starting generation...")
    setCurrentJobId(null)
    setJobStatus("")
    setRetryCount(0)
    setLastError("")
    setManimCode("")
    setLogs("")
    setStderr("")

    try {
      // Call the generation API
      const response = await fetch('/api/explainers/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          prompt,
          hasVoiceover,
          voiceStyle,
          duration: duration[0],
          aspectRatio,
          resolution,
          style
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start generation')
      }

      const result = await response.json()
      setCurrentJobId(result.jobId)
      setJobStatus("queued")
      
      toast({
        title: "Generation started",
        description: "Your animation is being created. You'll be notified when it's ready.",
      })

      // Subscribe to real-time updates
      subscribeToJobUpdates(result.jobId)

    } catch (error) {
      console.error("Generation failed:", error)
      toast({
        title: "Generation failed",
        description: (error as Error).message,
        variant: "destructive"
      })
      setIsGenerating(false)
    }
  }

  // Subscribe to real-time job updates
  const subscribeToJobUpdates = (jobId: string) => {
    // Clean up existing subscription
    if (realtimeChannel.current) {
      realtimeChannel.current.unsubscribe()
    }

    realtimeChannel.current = supabase
      .channel(`job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'explainers',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          console.log('Job update received:', payload.new)
          updateJobState(payload.new)
        }
      )
      .subscribe()
  }

  // Update local state based on job updates
  const updateJobState = (job: any) => {
    setJobStatus(job.status)
    
    // Read from metadata if columns don't exist
    const metadata = job.metadata || {}
    setRetryCount(metadata.retry_count || 0)
    setLastError(metadata.last_error || "")
    setManimCode(metadata.manim_code || "")
    setLogs(metadata.logs || "")
    setStderr(metadata.stderr || "")

    // Update progress and step based on status
    const statusMap: Record<string, { step: string; progress: number }> = {
      'draft': { step: 'Queued for processing...', progress: 5 },
      'processing': { step: 'Generating animation...', progress: 50 },
      'completed': { step: 'Complete!', progress: 100 },
      'failed': { step: 'Generation failed', progress: 0 }
    }

    const statusInfo = statusMap[job.status] || { step: job.status, progress: 0 }
    setGenerationStep(statusInfo.step)
    setGenerationProgress(statusInfo.progress)

    // Handle completion
    if (job.status === 'completed' && (job.output_url || metadata.output_url)) {
      // Get the public URL for the video
      const outputUrl = job.output_url || metadata.output_url
      const { data } = supabase.storage
        .from('dreamcut')
        .getPublicUrl(outputUrl)
      
      setGeneratedVideo(data.publicUrl)
      setIsGenerating(false)
      
      toast({
        title: "Animation complete!",
        description: "Your Manim animation is ready to watch.",
      })

      // Invalidate SWR cache to refresh previous generations
      mutate('/api/library?content_type=explainers')
    }

    // Handle failure
    if (job.status === 'failed') {
      setIsGenerating(false)
      toast({
        title: "Generation failed",
        description: metadata.last_error || job.last_error || "Unknown error occurred",
        variant: "destructive"
      })
    }
  }

  // Retry generation
  const handleRetry = async () => {
    if (!currentJobId) return
    
    setIsGenerating(true)
    setJobStatus("retrying")
    setLastError("")
    
    // Call the generation API again with the same parameters
    await handleGenerate()
  }

  // Copy code to clipboard
  const copyCodeToClipboard = async () => {
    if (manimCode) {
      await navigator.clipboard.writeText(manimCode)
      toast({
        title: "Code copied",
        description: "Manim code copied to clipboard",
      })
    }
  }

  const handleSmartAction = (action: string) => {
    console.log(`Smart action: ${action}`)
    // Handle smart actions like "Change Style", "Slow Down Motion", etc.
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }


  // Show scroll button when content is scrollable
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      setShowScrollButton(scrollTop > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [supabase.auth])

  // Cleanup realtime subscription on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannel.current) {
        realtimeChannel.current.unsubscribe()
      }
    }
  }, [])

  return (
    <div className="bg-background border border-border rounded-lg p-4 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-hover">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            🎞️ DreamCut Animation (Manim-Powered)
          </h3>
          <p className="text-xs text-muted-foreground">
            {projectTitle} - "Type it. Hear it. Watch it come alive."
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'generate' | 'library')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate New</TabsTrigger>
          <TabsTrigger value="library">My Videos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="space-y-4 mt-4">

      {!generatedVideo ? (
        <>
          {/* Step 1: Title */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
              📝 Title:
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is Entropy?"
              className="text-sm bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 focus:bg-gradient-to-r focus:from-amber-100 focus:to-orange-100 dark:focus:from-amber-900/30 dark:focus:to-orange-900/30 focus:border-amber-300 dark:focus:border-amber-700 transition-all duration-200"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              A short title for your animation (used for scene naming)
            </p>
          </div>

          {/* Step 2: Prompt */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
              ✏️ Prompt: <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Animate a rotating cube transforming into a pyramid on a dark background, with labels appearing as it morphs."
              className="min-h-[100px] text-sm resize-none bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 focus:bg-gradient-to-r focus:from-blue-100 focus:to-indigo-100 dark:focus:from-blue-900/30 dark:focus:to-indigo-900/30 focus:border-blue-300 dark:focus:border-blue-700 transition-all duration-200"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                DreamCut auto-understands: Scene type, objects, lighting, motion pacing, and duration
              </p>
              <p className={`text-xs ${prompt.length > 4500 ? 'text-orange-500' : prompt.length > 4000 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                {prompt.length}/5000 characters
              </p>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              * Only the Prompt field is required. All other fields are optional.
            </p>
          </div>

          {/* Step 3: Voiceover Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2">
                🎙️ Add AI Voiceover?
              </Label>
              <Switch
                checked={hasVoiceover}
                onCheckedChange={setHasVoiceover}
              />
            </div>
            
            {hasVoiceover && (
              <div className="grid grid-cols-1 gap-3 pl-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">🎤 Voice Style</Label>
                  <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                    <SelectTrigger className="w-full h-8 text-xs bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800 focus:bg-gradient-to-r focus:from-purple-100 focus:to-pink-100 dark:focus:from-purple-900/30 dark:focus:to-pink-900/30 focus:border-purple-300 dark:focus:border-purple-700 transition-all duration-200">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPENAI_VOICES.map((voice) => (
                        <SelectItem key={voice.value} value={voice.value} className="text-xs">
                          {voice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Smart Options */}
          <Collapsible open={isSmartOptionsOpen} onOpenChange={setIsSmartOptionsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                <Settings className="h-3 w-3" />
                Smart Options
                {isSmartOptionsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Duration ({formatDuration(duration[0])})
                  </Label>
                  <div className="px-2">
                    <Slider
                      value={duration}
                      onValueChange={setDuration}
                      max={180} // 3 minutes = 180 seconds
                      min={1}   // Minimum 1 second
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1s</span>
                      <span>30s</span>
                      <span>1min</span>
                      <span>2min</span>
                      <span>3min</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    Aspect Ratio
                  </Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Select aspect ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map((ratio) => (
                        <SelectItem key={ratio.value} value={ratio.value} className="text-xs">
                          {ratio.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Resolution</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Select resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOLUTIONS.map((res) => (
                        <SelectItem key={res.value} value={res.value} className="text-xs">
                          {res.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    Style
                  </Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLES.map((styleOption) => (
                        <SelectItem key={styleOption.value} value={styleOption.value} className="text-xs">
                          {styleOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Step 5: Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            size="sm"
            className="w-full h-10 text-sm font-medium bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Animation 🎞️
              </>
            )}
          </Button>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{generationStep}</span>
                <span className="text-muted-foreground">{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
            </div>
          )}
        </>
      ) : jobStatus === 'failed' ? (
        /* Error State */
        <div className="space-y-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Generation Failed
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {lastError || "Something went wrong during generation."}
            </p>
            
            {retryCount > 0 && (
              <p className="text-xs text-muted-foreground mb-4">
                Retried {retryCount} times
              </p>
            )}
          </div>

          {/* Error Actions */}
          <div className="flex gap-3 justify-center">
            <Button onClick={handleRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setGeneratedVideo(null)
                setJobStatus("")
                setCurrentJobId(null)
                setIsGenerating(false)
              }}
              className="flex items-center gap-2"
            >
              <Wand2 className="h-4 w-4" />
              New Animation
            </Button>
          </div>

          {/* Error Details */}
          {(stderr || logs) && (
            <div className="bg-muted/20 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2">Error Details:</h4>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                {stderr || logs}
              </pre>
            </div>
          )}
        </div>
      ) : (
        /* Step 5: Result Preview */
        <div className="space-y-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Animation Complete!
            </h3>
            <p className="text-sm text-muted-foreground">
              Your DreamCut animation is ready to watch and download.
            </p>
          </div>

          {/* Video Preview */}
          <div className="bg-muted/20 rounded-lg p-4">
            <video
              src={generatedVideo}
              controls
              className="w-full rounded-lg shadow-lg"
              poster="/placeholder.jpg"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Tabs for Code and Logs */}
          <Tabs defaultValue="output" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="output">Output</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="output" className="space-y-4">
              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Button className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Play
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>

              {/* Smart Action Chips */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSmartAction("change-style")}
                  className="flex items-center gap-1 text-xs"
                >
                  <Palette className="h-3 w-3" />
                  Change Style
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSmartAction("slow-motion")}
                  className="flex items-center gap-1 text-xs"
                >
                  <Clock className="h-3 w-3" />
                  Slow Down Motion
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHasSubtitles(!hasSubtitles)}
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    hasSubtitles && "bg-primary text-primary-foreground"
                  )}
                >
                  <Subtitles className="h-3 w-3" />
                  {hasSubtitles ? "Remove Subtitles" : "Add Subtitles"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHasVoiceover(!hasVoiceover)}
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    hasVoiceover && "bg-primary text-primary-foreground"
                  )}
                >
                  {hasVoiceover ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  {hasVoiceover ? "Remove Voiceover" : "Add Voiceover"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="code" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Generated Manim Code</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyCodeToClipboard}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              </div>
              <div className="bg-muted/20 rounded-lg p-4">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {manimCode || "No code available"}
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-4">
              <h4 className="text-sm font-medium">Generation Logs</h4>
              <div className="bg-muted/20 rounded-lg p-4">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {logs || "No logs available"}
                </pre>
              </div>
              
              {stderr && (
                <>
                  <h4 className="text-sm font-medium text-red-500">Error Output</h4>
                  <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
                    <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {stderr}
                    </pre>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Regenerate Button */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => {
                setGeneratedVideo(null)
                setGenerationProgress(0)
                setGenerationStep("")
                setJobStatus("")
                setCurrentJobId(null)
                setManimCode("")
                setLogs("")
                setStderr("")
                setLastError("")
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Create New Animation
            </Button>
          </div>
        </div>
      )}
        </TabsContent>
        
        <TabsContent value="library" className="space-y-4 mt-4">
          {userId ? (
            <ExplainerVideoLibrary 
              userId={userId}
              onVideoSelect={(video) => {
                // Handle video selection if needed
                console.log('Selected video:', video)
              }}
            />
          ) : (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading user information...</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Previous Generations */}
      <PreviousGenerations contentType="explainers" userId={user?.id || ''} className="mt-8" />

      {/* Floating Scroll to Top Button */}
      {showScrollButton && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-300"
          size="icon"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
