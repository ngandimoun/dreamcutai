"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  Video, 
  Music, 
  Settings, 
  Volume2, 
  Clock, 
  FileVideo, 
  FileAudio,
  Sparkles,
  Zap,
  Download,
  Copy,
  Play,
  Pause,
  RotateCcw
} from "lucide-react"

interface SoundToVideoFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading?: boolean
}

const MERGE_PRESETS = [
  {
    name: "🎙️ Voiceover Mode",
    config: {
      replace_audio: true,
      duration_mode: "video",
      audio_volume: 1.1,
      fade_in: 0.5,
      fade_out: 0.5,
      normalize: true
    }
  },
  {
    name: "🎧 Background Music",
    config: {
      replace_audio: false,
      audio_volume: 0.35,
      normalize: true,
      ducking: true,
      duration_mode: "video"
    }
  },
  {
    name: "📢 Ad or Promo",
    config: {
      replace_audio: true,
      duration_mode: "audio",
      fade_in: 1,
      fade_out: 1,
      audio_volume: 1.0
    }
  }
]

export function SoundToVideoForm({ onSubmit, onCancel, isLoading }: SoundToVideoFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_file: null as File | null,
    audio_file: null as File | null,
    video_url: "",
    audio_url: "",
    duration_mode: "video",
    audio_offset: 0,
    replace_audio: true,
    audio_volume: 1.0,
    original_audio_volume: 0.35,
    output_format: "mp4",
    video_codec: "h264",
    audio_codec: "aac",
    normalize: true,
    fade_in: 1,
    fade_out: 1,
    ducking: false,
    save_to_supabase: true,
    supabase_bucket: "videos",
    supabase_path_prefix: "merged/"
  })

  const [dragOver, setDragOver] = useState<"video" | "audio" | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>("")

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (file: File, type: "video" | "audio") => {
    if (type === "video") {
      handleInputChange("video_file", file)
      handleInputChange("video_url", "")
    } else {
      handleInputChange("audio_file", file)
      handleInputChange("audio_url", "")
    }
  }

  const handleUrlInput = (url: string, type: "video" | "audio") => {
    if (type === "video") {
      handleInputChange("video_url", url)
      handleInputChange("video_file", null)
    } else {
      handleInputChange("audio_url", url)
      handleInputChange("audio_file", null)
    }
  }

  const handlePresetSelect = (presetName: string) => {
    const preset = MERGE_PRESETS.find(p => p.name === presetName)
    if (preset) {
      setSelectedPreset(presetName)
      setFormData(prev => ({
        ...prev,
        ...preset.config
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleDragOver = (e: React.DragEvent, type: "video" | "audio") => {
    e.preventDefault()
    setDragOver(type)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(null)
  }

  const handleDrop = (e: React.DragEvent, type: "video" | "audio") => {
    e.preventDefault()
    setDragOver(null)
    
    const files = Array.from(e.dataTransfer.files)
    const file = files.find(f => {
      if (type === "video") {
        return f.type.startsWith("video/")
      } else {
        return f.type.startsWith("audio/")
      }
    })
    
    if (file) {
      handleFileUpload(file, type)
    }
  }

  const isFormValid = () => {
    return formData.title && 
           (formData.video_file || formData.video_url) && 
           (formData.audio_file || formData.audio_url)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header with Presets */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🎬 Video + Audio Merge</h2>
          <p className="text-muted-foreground">
            Upload a video and an audio file to merge them seamlessly. Ideal for voiceovers, music overlays, or replacing bad audio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPreset} onValueChange={handlePresetSelect}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Choose preset" />
            </SelectTrigger>
            <SelectContent>
              {MERGE_PRESETS.map((preset) => (
                <SelectItem key={preset.name} value={preset.name}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter project title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your video merge project"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* 1. Upload Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            1️⃣ Upload Files
          </CardTitle>
          <CardDescription>
            Upload your video and audio files to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video Upload */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video File
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver === "video" 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onDragOver={(e) => handleDragOver(e, "video")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "video")}
              >
                <FileVideo className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Drop video file here</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Supports MP4, MOV, AVI, MKV
                </p>
                <Input
                  type="file"
                  accept=".mp4,.mov,.avi,.mkv"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, "video")
                  }}
                  className="hidden"
                  id="video-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("video-upload")?.click()}
                >
                  Choose File
                </Button>
              </div>
              {formData.video_file && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <FileVideo className="h-4 w-4" />
                  <span className="text-sm flex-1 truncate">{formData.video_file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInputChange("video_file", null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="text-center text-sm text-muted-foreground">or</div>
              <Input
                placeholder="Paste video URL"
                value={formData.video_url}
                onChange={(e) => handleUrlInput(e.target.value, "video")}
              />
            </div>

            {/* Audio Upload */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                Audio File
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver === "audio" 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onDragOver={(e) => handleDragOver(e, "audio")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "audio")}
              >
                <FileAudio className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Drop audio file here</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Supports MP3, WAV, AAC, M4A
                </p>
                <Input
                  type="file"
                  accept=".mp3,.wav,.aac,.m4a"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, "audio")
                  }}
                  className="hidden"
                  id="audio-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("audio-upload")?.click()}
                >
                  Choose File
                </Button>
              </div>
              {formData.audio_file && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <FileAudio className="h-4 w-4" />
                  <span className="text-sm flex-1 truncate">{formData.audio_file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInputChange("audio_file", null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="text-center text-sm text-muted-foreground">or</div>
              <Input
                placeholder="Paste audio URL"
                value={formData.audio_url}
                onChange={(e) => handleUrlInput(e.target.value, "audio")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Sync & Alignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            2️⃣ Sync & Alignment
          </CardTitle>
          <CardDescription>
            Choose how to handle length differences and timing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Duration Mode</Label>
            <Select value={formData.duration_mode} onValueChange={(value) => handleInputChange("duration_mode", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Match Video Length (Trim Audio)</SelectItem>
                <SelectItem value="audio">Match Audio Length (Extend Video)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.duration_mode === "video" 
                ? "Audio will be trimmed to match video length"
                : "Video will be extended to match audio length (may freeze on last frame)"
              }
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Audio Start Offset: {formData.audio_offset}s</Label>
            <Slider
              value={[formData.audio_offset]}
              onValueChange={(value) => handleInputChange("audio_offset", value[0])}
              min={-10}
              max={10}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Start Earlier (-10s)</span>
              <span>Start Later (+10s)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Positive = delay audio; negative = start earlier
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Audio Mixing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            3️⃣ Audio Mixing
          </CardTitle>
          <CardDescription>
            Decide how to combine the new audio with the original video sound.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Replace Original Audio</Label>
              <p className="text-xs text-muted-foreground">
                Turn off to mix both sounds instead of replacing
              </p>
            </div>
            <Switch
              checked={formData.replace_audio}
              onCheckedChange={(checked) => handleInputChange("replace_audio", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>New Audio Volume: {formData.audio_volume}</Label>
            <Slider
              value={[formData.audio_volume]}
              onValueChange={(value) => handleInputChange("audio_volume", value[0])}
              min={0}
              max={5}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Silent</span>
              <span>1.0 = Original</span>
              <span className={formData.audio_volume > 1.5 ? "text-orange-500" : ""}>Loud</span>
            </div>
            {formData.audio_volume > 1.5 && (
              <p className="text-xs text-orange-500">⚠️ High volume may cause clipping</p>
            )}
          </div>

          {!formData.replace_audio && (
            <div className="space-y-2">
              <Label>Original Audio Volume: {formData.original_audio_volume}</Label>
              <Slider
                value={[formData.original_audio_volume]}
                onValueChange={(value) => handleInputChange("original_audio_volume", value[0])}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Silent</span>
                <span>Original Level</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Only applies when mixing both sounds
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Output Format */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            4️⃣ Output Format
          </CardTitle>
          <CardDescription>
            Choose the final file type and codecs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Output Format</Label>
              <Select value={formData.output_format} onValueChange={(value) => handleInputChange("output_format", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4 (Universal)</SelectItem>
                  <SelectItem value="mov">MOV (Apple)</SelectItem>
                  <SelectItem value="avi">AVI (Legacy)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Video Codec</Label>
              <Select value={formData.video_codec} onValueChange={(value) => handleInputChange("video_codec", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h264">H.264 (default)</SelectItem>
                  <SelectItem value="hevc">HEVC / H.265</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Audio Codec</Label>
              <Select value={formData.audio_codec} onValueChange={(value) => handleInputChange("audio_codec", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aac">AAC (default)</SelectItem>
                  <SelectItem value="mp3">MP3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Advanced Audio Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            5️⃣ Advanced Audio Controls
          </CardTitle>
          <CardDescription>
            Fine-tune your sound for a professional touch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Normalize Loudness</Label>
              <p className="text-xs text-muted-foreground">
                Balances volume to standard levels for consistent playback
              </p>
            </div>
            <Switch
              checked={formData.normalize}
              onCheckedChange={(checked) => handleInputChange("normalize", checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fade In: {formData.fade_in}s</Label>
              <Slider
                value={[formData.fade_in]}
                onValueChange={(value) => handleInputChange("fade_in", value[0])}
                min={0}
                max={5}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Smooth fade at the start</p>
            </div>

            <div className="space-y-2">
              <Label>Fade Out: {formData.fade_out}s</Label>
              <Slider
                value={[formData.fade_out]}
                onValueChange={(value) => handleInputChange("fade_out", value[0])}
                min={0}
                max={5}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Smooth fade at the end</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Auto Duck Music Under Voice</Label>
              <p className="text-xs text-muted-foreground">
                Automatically lowers music when speech is detected
              </p>
            </div>
            <Switch
              checked={formData.ducking}
              onCheckedChange={(checked) => handleInputChange("ducking", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 6. Output & Save */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            6️⃣ Output & Save
          </CardTitle>
          <CardDescription>
            Where and how to store the final file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Save to Supabase</Label>
              <p className="text-xs text-muted-foreground">
                Automatically store the merged video in your Supabase bucket
              </p>
            </div>
            <Switch
              checked={formData.save_to_supabase}
              onCheckedChange={(checked) => handleInputChange("save_to_supabase", checked)}
            />
          </div>

          {formData.save_to_supabase && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bucket Name</Label>
                <Input
                  value={formData.supabase_bucket}
                  onChange={(e) => handleInputChange("supabase_bucket", e.target.value)}
                  placeholder="videos"
                />
              </div>
              <div className="space-y-2">
                <Label>Path Prefix</Label>
                <Input
                  value={formData.supabase_path_prefix}
                  onChange={(e) => handleInputChange("supabase_path_prefix", e.target.value)}
                  placeholder="merged/"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Preview */}
      <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Fast CPU model</span>
          <Badge variant="secondary">~$0.003 per merge</Badge>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !isFormValid()}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Sparkles className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Merge Video & Audio
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
