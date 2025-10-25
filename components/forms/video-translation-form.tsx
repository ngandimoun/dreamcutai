"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Upload, 
  Video, 
  FileVideo, 
  Sparkles,
  X,
  Database,
  Languages
} from "lucide-react"
import { VideoTranslationInputs, DEFAULT_VIDEO_TRANSLATION_INPUTS, TRANSLATION_LANGUAGES } from "@/lib/types/video-translation"
import { useToast } from "@/hooks/use-toast"

interface VideoTranslationFormProps {
  onSubmit: (data: VideoTranslationInputs) => void
  onCancel: () => void
  isLoading?: boolean
  isOpen?: boolean
}

export function VideoTranslationForm({ onSubmit, onCancel, isLoading = false, isOpen = true }: VideoTranslationFormProps) {
  const [formData, setFormData] = useState<VideoTranslationInputs>(DEFAULT_VIDEO_TRANSLATION_INPUTS)
  const [dragOver, setDragOver] = useState(false)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<{id: string, title: string, image: string, video_url: string} | null>(null)
  const [availableVideos, setAvailableVideos] = useState<Array<{id: string, title: string, image: string, video_url: string}>>([])
  const [videoSource, setVideoSource] = useState<'upload' | 'library'>('upload')
  const videoInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchAvailableVideos()
    }
  }, [isOpen])

  const fetchAvailableVideos = async () => {
    try {
      const response = await fetch('/api/library')
      if (response.ok) {
        const data = await response.json()
        const videoItems = data.items?.filter((item: any) => 
          item.content_type === 'explainers' || 
          item.content_type === 'videos' ||
          item.video_url
        ) || []
        setAvailableVideos(videoItems)
      }
    } catch (error) {
      console.error('Error fetching available videos:', error)
    }
  }

  const handleInputChange = (field: keyof VideoTranslationInputs, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleVideoSourceChange = (source: 'upload' | 'library') => {
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

  const handleVideoSelect = (video: {id: string, title: string, image: string, video_url: string}) => {
    setSelectedVideo(video)
    setVideoPreview(video.video_url)
    handleInputChange("video_file_input", video.video_url)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file)
        setVideoPreview(url)
        handleInputChange("video_file_input", url)
        toast({
          title: "Video uploaded",
          description: "Video file uploaded successfully",
        })
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a video file",
          variant: "destructive"
        })
      }
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file)
      setVideoPreview(url)
      handleInputChange("video_file_input", url)
      toast({
        title: "Video uploaded",
        description: "Video file uploaded successfully",
      })
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.video_file_input) {
      toast({
        title: "Video required",
        description: "Please upload a video file or select from library",
        variant: "destructive"
      })
      return
    }

    if (!formData.output_language) {
      toast({
        title: "Language required",
        description: "Please select an output language",
        variant: "destructive"
      })
      return
    }

    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="bg-background border border-border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:text-white flex items-center gap-2">
            <Languages className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Video Translation
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Translate videos into over 150 languages</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Video Upload */}
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-white">
              <Upload className="h-4 w-4" />
              Step 1: Video Upload
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Upload your video file or select from your library
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Video Source Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-blue-600 dark:text-white">Video Source *</Label>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={videoSource === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleVideoSourceChange('upload')}
                  className={`flex-1 h-8 text-xs ${videoSource === 'upload' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Upload File
                </Button>
                <Button
                  type="button"
                  variant={videoSource === 'library' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleVideoSourceChange('library')}
                  className={`flex-1 h-8 text-xs ${videoSource === 'library' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}
                >
                  <Database className="h-3 w-3 mr-1" />
                  From Library
                </Button>
              </div>

              {/* Upload Section */}
              {videoSource === 'upload' && (
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    dragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-blue-200 hover:border-blue-300'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                >
                  <Video className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-1">
                    Drag and drop your video file here, or click to browse
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                    Supported formats: MP4, MOV, AVI, MKV
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                    className="h-7 text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Choose File
                  </Button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Library Section */}
              {videoSource === 'library' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-blue-600 dark:text-blue-400">Select from Library</Label>
                  {availableVideos.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                      {availableVideos.map((video) => (
                        <div
                          key={video.id}
                          className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                            selectedVideo?.id === video.id
                              ? 'border-blue-400 bg-blue-50'
                              : 'border-blue-200 hover:border-blue-300'
                          }`}
                          onClick={() => handleVideoSelect(video)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-6 bg-blue-100 rounded flex items-center justify-center">
                              <FileVideo className="h-3 w-3 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate text-slate-700 dark:text-slate-200">{video.title}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">Video file</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-slate-500 dark:text-slate-400">
                      <Database className="h-6 w-6 mx-auto mb-1" />
                      <p className="text-xs">No videos found in your library</p>
                    </div>
                  )}
                </div>
              )}

              {/* Video Preview */}
              {videoPreview && (
                <div className="mt-3">
                  <Label className="text-sm font-medium text-blue-600 dark:text-blue-400">Preview</Label>
                  <div className="mt-1 border border-blue-200 rounded-lg overflow-hidden">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full h-32 object-contain bg-slate-50"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Language Selection */}
        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-white">
              <Languages className="h-4 w-4" />
              Step 2: Language Selection
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Choose the target language for translation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="output_language" className="text-sm font-medium text-purple-600 dark:text-white">
                Output Language *
              </Label>
              <Select
                value={formData.output_language}
                onValueChange={(value) => handleInputChange("output_language", value)}
              >
                <SelectTrigger className="h-8 text-xs border-purple-300 focus:border-purple-400">
                  <SelectValue placeholder="Select target language" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {TRANSLATION_LANGUAGES.map((language) => (
                    <SelectItem key={language.value} value={language.value} className="text-xs">
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Default: "English"
              </p>
            </div>
          </CardContent>
        </Card>


        {/* Action Buttons */}
        <div className="flex gap-2 pt-3">
          <Button
            type="submit"
            disabled={isLoading || !formData.video_file_input || !formData.output_language}
            className="flex-1 h-8 text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isLoading ? (
              <>
                <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Languages className="h-3 w-3 mr-1" />
                Translate Video
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="h-8 text-xs border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
