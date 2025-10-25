"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Mic, Volume2, Settings, Globe, Heart, User, Sparkles, Play, Pause } from "lucide-react"
import { OPENAI_VOICES, type OpenAIVoice } from "@/lib/openai/text-to-speech"

interface VoiceoverFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading?: boolean
}


const VOICEOVER_USE_CASES = [
  "Narration",
  "Commercial", 
  "Educational",
  "Podcast",
  "Audiobook",
  "Documentary",
  "E-learning",
  "News",
  "Radio",
  "Storytelling",
  "Meditation",
  "ASMR",
  "Character Voice",
  "Brand Voice",
  "Customer Service",
  "Virtual Assistant",
  "Game NPC",
  "Trailer",
  "Promo",
  "Announcement"
]

const LANGUAGES = [
  "English",
  "French", 
  "Spanish",
  "Japanese",
  "Chinese (Mandarin)",
  "Chinese (Cantonese)",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Korean",
  "Arabic",
  "Hindi",
  "Dutch",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Polish",
  "Czech",
  "Hungarian",
  "Turkish",
  "Greek",
  "Hebrew",
  "Thai",
  "Vietnamese",
  "Indonesian",
  "Malay",
  "Filipino",
  "Multilingual"
]


export function VoiceoverForm({ onSubmit, onCancel, isLoading }: VoiceoverFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    script: "",
    language: "English",
    voice_id: "",
    speed: 50,
    pitch: 50,
    volume: 50,
    use_case: ""
  })

  // OpenAI Voice Selection
  const [selectedVoice, setSelectedVoice] = useState<OpenAIVoice | null>(null)
  
  // Voice Preview Audio
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null)


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    onSubmit({
      ...formData,
      voice_id: selectedVoice?.id || formData.voice_id,
      openai_voice: selectedVoice
    })
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleVoiceSelection = (voiceId: string) => {
    const voice = OPENAI_VOICES.find(v => v.id === voiceId)
    console.log('🎤 [VOICEOVER FORM] Selected OpenAI voice:', {
      name: voice?.name,
      id: voice?.id,
      description: voice?.description
    })
    setSelectedVoice(voice || null)
    handleInputChange("voice_id", voiceId)
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
      })
    }
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Provide the essential details for your voiceover.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter voiceover title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your voiceover project"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={formData.language} onValueChange={(value) => handleInputChange("language", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={formData.use_case} onValueChange={(value) => handleInputChange("use_case", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  {VOICEOVER_USE_CASES.map((useCase) => (
                    <SelectItem key={useCase} value={useCase.toLowerCase()}>
                      {useCase}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Script */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Script
          </CardTitle>
          <CardDescription>
            The text that will be converted to speech using ElevenLabs AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="script">Script Text *</Label>
            <Textarea
              id="script"
              value={formData.script}
              onChange={(e) => handleInputChange("script", e.target.value)}
              placeholder="Enter the text you want to convert to speech..."
              rows={6}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* OpenAI Voice Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            OpenAI Voice Selection
          </CardTitle>
          <CardDescription>
            Select a voice from OpenAI's GPT-4o-mini-TTS model.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>OpenAI Voice</Label>
            <Select 
              value={formData.voice_id} 
              onValueChange={handleVoiceSelection}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an OpenAI voice" />
              </SelectTrigger>
              <SelectContent>
                {OPENAI_VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      <div>
                        <div className="font-medium">
                          {voice.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {voice.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Voice Preview */}
          {selectedVoice && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mic className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{selectedVoice.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedVoice.description}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        OpenAI TTS
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {selectedVoice.id}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => handlePlayVoicePreview(selectedVoice.id)}
                  >
                    {playingVoiceId === selectedVoice.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>



      {/* Voice Characteristics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Voice Characteristics
          </CardTitle>
          <CardDescription>
            Fine-tune the voice characteristics for your voiceover using ElevenLabs parameters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Speed: {formData.speed}%</Label>
              <Slider
                value={[formData.speed]}
                onValueChange={(value) => handleInputChange("speed", value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pitch: {formData.pitch}%</Label>
              <Slider
                value={[formData.pitch]}
                onValueChange={(value) => handleInputChange("pitch", value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Volume: {formData.volume}%</Label>
              <Slider
                value={[formData.volume]}
                onValueChange={(value) => handleInputChange("volume", value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Quiet</span>
                <span>Loud</span>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>


      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !formData.title || !formData.script || !formData.voice_id}>
          {isLoading ? "Creating..." : "Create Voiceover"}
        </Button>
      </div>
    </form>
  )
}