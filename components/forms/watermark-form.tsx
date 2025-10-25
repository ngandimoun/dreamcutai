"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  X,
  Video,
  Play,
  CheckCircle,
  Database
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { v4 as uuidv4 } from 'uuid'
import { WatermarkFormData, DEFAULT_WATERMARK_VALUES, WATERMARK_CONSTRAINTS, WatermarkModelInputs, DEFAULT_WATERMARK_INPUTS } from "@/lib/types/watermark"
import { useToast } from "@/hooks/use-toast"

interface WatermarkFormProps {
  onSubmit: (data: FormData) => void
  onCancel: () => void
  isLoading?: boolean
  isOpen?: boolean
}

export function WatermarkForm({ onSubmit, onCancel, isLoading = false, isOpen = true }: WatermarkFormProps) {
  const [formData, setFormData] = useState<WatermarkModelInputs>(DEFAULT_WATERMARK_INPUTS)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [videoSource, setVideoSource] = useState<'upload' | 'supabase'>('upload')
  const [selectedVideo, setSelectedVideo] = useState<{id: string, title: string, image: string, video_url: string, content_type: string} | null>(null)
  const [availableVideos, setAvailableVideos] = useState<Array<{id: string, title: string, image: string, video_url: string, content_type: string}>>([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const videoInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load videos from API endpoints when supabase source is selected
  useEffect(() => {
    if (videoSource === 'supabase') {
      loadVideosFromAPIs()
    }
  }, [videoSource])

  const loadVideosFromAPIs = async () => {
    setLoadingVideos(true)
    try {
      // Query all 3 API endpoints in parallel with status=completed filter
      const [talkingAvatarsRes, explainersRes, subtitlesRes] = await Promise.all([
        fetch('/api/talking-avatars?status=completed'),
        fetch('/api/explainers?status=completed'),
        fetch('/api/subtitles?status=completed')
      ])

      const [talkingAvatarsData, explainersData, subtitlesData] = await Promise.all([
        talkingAvatarsRes.ok ? talkingAvatarsRes.json() : { talkingAvatars: [] },
        explainersRes.ok ? explainersRes.json() : { explainers: [] },
        subtitlesRes.ok ? subtitlesRes.json() : { subtitles: [] }
      ])

      const videos: Array<{id: string, title: string, image: string, video_url: string, content_type: string}> = []


      // Process Talking Avatars
      if (talkingAvatarsData.talkingAvatars) {
        talkingAvatarsData.talkingAvatars.forEach((item: any) => {
          const video_url = item.generated_video_url || item.content?.video_url || item.content?.output_video_url || ''
          if (video_url) {
            videos.push({
              id: `talking_avatars_${item.id}`,
              title: item.title || 'Talking Avatar',
              image: item.content?.image || item.content?.images?.[0] || '/placeholder.jpg',
              video_url,
              content_type: 'talking_avatars'
            })
          }
        })
      }


      // Process Explainers
      if (explainersData.explainers) {
        explainersData.explainers.forEach((item: any) => {
          const video_url = item.content?.video_url || item.content?.output_video_url || ''
          if (video_url) {
            videos.push({
              id: `explainers_${item.id}`,
              title: item.title || 'Explainer',
              image: item.content?.image || item.content?.images?.[0] || '/placeholder.jpg',
              video_url,
              content_type: 'explainers'
            })
          }
        })
      }

      // Process Subtitles
      if (subtitlesData.subtitles) {
        subtitlesData.subtitles.forEach((item: any) => {
          const video_url = item.content?.video_url || item.content?.output_video_url || ''
          if (video_url) {
            videos.push({
              id: `subtitles_${item.id}`,
              title: item.title || 'Subtitled Video',
              image: item.content?.image || item.content?.images?.[0] || '/placeholder.jpg',
              video_url,
              content_type: 'subtitles'
            })
          }
        })
      }

      console.log(`🎬 Total videos loaded from APIs: ${videos.length}`)
      setAvailableVideos(videos)
    } catch (error) {
      console.error('❌ Error loading videos from APIs:', error)
      toast({
        title: "Error loading videos",
        description: "Failed to load videos from your content. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingVideos(false)
    }
  }

  const handleInputChange = (field: keyof WatermarkModelInputs, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Helper function to upload video to Supabase
  const uploadVideoToSupabase = async (file: File): Promise<string> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('User not authenticated')

    // Upload video file to Supabase storage
    const fileName = `${uuidv4()}-${file.name}`
    const filePath = `renders/watermarks/${user.id}/inputs/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('dreamcut')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600'
      })

    if (uploadError) {
      throw new Error(`Failed to upload video: ${uploadError.message}`)
    }

    // Generate signed URL for the uploaded video
    const { data: signedData } = await supabase.storage
      .from('dreamcut')
      .createSignedUrl(filePath, 86400)

    if (!signedData?.signedUrl) {
      throw new Error('Failed to generate signed URL for video')
    }

    return signedData.signedUrl
  }

  const handleVideoSourceChange = (source: 'upload' | 'supabase') => {
    setVideoSource(source)
    if (source === 'upload') {
      setSelectedVideo(null)
      setVideoPreview(null)
      handleInputChange("video_file_input", "")
    } else {
      setVideoPreview(null)
      handleInputChange("video_file_input", "")
    }
  }

  const handleVideoSelect = (video: {id: string, title: string, image: string, video_url: string, content_type: string}) => {
    setSelectedVideo(video)
    setVideoPreview(video.video_url)
    handleInputChange("video_file_input", video.video_url)
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setVideoPreview(url)
      handleInputChange("video_file_input", file)
    }
  }

  const handleGenerate = async () => {
    // Validation
    if (videoSource === 'supabase' && !selectedVideo) {
      toast({
        title: "Please select a video",
        description: "Choose a video from your content library.",
        variant: "destructive"
      })
      return
    }

    if (videoSource === 'upload' && !formData.video_file_input) {
      toast({
        title: "Please upload a video",
        description: "Choose a video file to add watermark to.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      // Prepare the data
      let videoUrl: string
      
      if (videoSource === 'supabase') {
        videoUrl = selectedVideo?.video_url || ''
      } else {
        // Handle file upload
        if (formData.video_file_input instanceof File) {
          videoUrl = await uploadVideoToSupabase(formData.video_file_input)
        } else {
          videoUrl = formData.video_file_input as string
        }
      }

      const generationData = {
        ...formData,
        title: `Watermark Project - ${new Date().toLocaleDateString()}`,
        video_file_input: videoUrl
      }

      // Call API
      const response = await fetch('/api/watermarks/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate watermark')
      }

      const result = await response.json()
      console.log('Watermark generated:', result)

      // Success toast
      toast({
        title: "Watermark Generated!",
        description: "Successfully generated your watermarked video.",
      })

      // Close form
      onCancel()
      
    } catch (error) {
      console.error('Generation failed:', error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate watermark. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }


  if (!isOpen) return null

  return (
    <div className="bg-background border border-border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">✨ Add Watermark</h2>
          <p className="text-xs sm:text-sm text-slate-600">🎬 Add a watermark to your video</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} className="self-end sm:self-auto hover:bg-slate-100 h-8 w-8">
          <X className="h-3 w-3 text-slate-500" />
        </Button>
      </div>

      <div className="space-y-3 sm:space-y-4">

        {/* Video Input */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg py-3">
            <CardTitle className="text-slate-800 text-sm">
              🎥 Video Input *
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs">
              📋 Select the video you want to add a watermark to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 py-3">
            {/* Video Source Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">📹 Video Source</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={videoSource === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleVideoSourceChange('upload')}
                  className="w-full h-9 text-xs font-medium"
                >
                  📤 Upload File
                </Button>
                <Button
                  type="button"
                  variant={videoSource === 'supabase' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleVideoSourceChange('supabase')}
                  className="w-full h-9 text-xs font-medium"
                >
                  📚 From Library
                </Button>
              </div>
            </div>

            {/* Video Upload */}
            {videoSource === 'upload' && (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-3 sm:p-4 text-center hover:border-muted-foreground/50 transition-colors">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  {videoPreview ? (
                    <div className="space-y-2">
                      <video 
                        src={videoPreview} 
                        className="w-full h-20 sm:h-24 object-cover rounded-md mx-auto"
                        controls
                      />
                      <p className="text-xs text-muted-foreground">Click to change video</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Video className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground mx-auto" />
                      <p className="text-xs sm:text-sm text-muted-foreground">Click to upload video</p>
                    </div>
                  )}
                </label>
              </div>
            )}

            {/* Supabase Videos Section */}
            {videoSource === 'supabase' && (
              <div className="space-y-3">
                {loadingVideos ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm">Loading videos from your library...</p>
                  </div>
                ) : availableVideos.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      {availableVideos.length} video{availableVideos.length > 1 ? 's' : ''} available from Motions category
                    </Label>
                    <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-2">
                      {availableVideos.map((video) => (
                        <div
                          key={video.id}
                          className={`group border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                            selectedVideo?.id === video.id 
                              ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200' 
                              : 'border-muted-foreground/25 hover:border-blue-300 hover:shadow-sm'
                          }`}
                          onClick={() => handleVideoSelect(video)}
                        >
                          <div className="flex gap-3 p-3">
                            {/* Video Thumbnail */}
                            <div className="flex-shrink-0 relative">
                              {video.video_url ? (
                                <div className="relative w-24 h-16 bg-black rounded overflow-hidden">
                                  <video 
                                    src={video.video_url}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                    onMouseEnter={(e) => e.currentTarget.play()}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.pause()
                                      e.currentTarget.currentTime = 0
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                    <Play className="h-6 w-6 text-white opacity-80" />
                                  </div>
                                </div>
                              ) : (
                                <img 
                                  src={video.image} 
                                  alt={video.title}
                                  className="w-24 h-16 object-cover rounded"
                                />
                              )}
                              {selectedVideo?.id === video.id && (
                                <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                                  <CheckCircle className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                            
                            {/* Video Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <p className="text-sm font-semibold text-foreground truncate mb-0.5">
                                {video.title}
                              </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Video className="h-3 w-3" />
                                  <span>{video.content_type.replace('_', ' ')}</span>
                                </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">No videos found in your content</p>
                    <p className="text-xs mt-1">Create videos in these generators first:</p>
                    <p className="text-xs text-muted-foreground/80">UGC Ads, Talking Avatars, Product Motion, Explainers, Subtitles</p>
                  </div>
                )}
              </div>
            )}

            {/* Video Preview */}
            {videoPreview && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">👀 Video Preview</Label>
                <div className="relative w-full max-w-sm mx-auto">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full rounded-lg border border-slate-200 shadow-sm"
                    style={{ maxHeight: '150px' }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Watermark Settings */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg py-3">
            <CardTitle className="text-slate-800 text-sm">
              ✨ Watermark Settings
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs">
              🎨 Configure your watermark appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 py-3">
            {/* Watermark Text */}
            <div className="space-y-1">
              <Label htmlFor="watermark_text" className="text-sm font-medium text-slate-700">✍️ Watermark Text *</Label>
              <Textarea
                id="watermark_text"
                value={formData.watermark_text}
                onChange={(e) => handleInputChange("watermark_text", e.target.value)}
                placeholder="DREAMCUT.AI"
                maxLength={WATERMARK_CONSTRAINTS.WATERMARK_TEXT_MAX_LENGTH}
                rows={2}
                className="border-slate-200 focus:border-purple-300 focus:ring-purple-200 text-sm"
              />
              <p className="text-xs text-slate-500">
                💡 Shift + Return to add a new line
              </p>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label htmlFor="font_size" className="text-sm font-medium text-slate-700">📏 Font Size</Label>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-xs text-slate-600 font-medium">
                    📊 Size: {formData.font_size}
                  </span>
                  <Badge variant="outline" className="w-fit bg-purple-50 text-purple-700 border-purple-200 text-xs">
                    {WATERMARK_CONSTRAINTS.FONT_SIZE_MIN} - {WATERMARK_CONSTRAINTS.FONT_SIZE_MAX}
                  </Badge>
                </div>
                <Slider
                  value={[formData.font_size]}
                  onValueChange={(value) => handleInputChange("font_size", value[0])}
                  min={WATERMARK_CONSTRAINTS.FONT_SIZE_MIN}
                  max={WATERMARK_CONSTRAINTS.FONT_SIZE_MAX}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  💡 Default: {WATERMARK_CONSTRAINTS.FONT_SIZE_DEFAULT}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isGenerating}
            className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 h-9 text-sm"
          >
            ❌ Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !formData.video_file_input || !formData.watermark_text}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 h-9 text-sm"
          >
            {isGenerating ? (
              <>
                ⏳ Processing...
              </>
            ) : (
              <>
                ✨ Generate Watermark
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
