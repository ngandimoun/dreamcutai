"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Video, 
  Languages, 
  Download, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Trash2,
  Edit
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { VideoTranslationForm } from "@/components/forms/video-translation-form"
import { VideoTranslationProject, VideoTranslationInputs } from "@/lib/types/video-translation"

interface VideoTranslationInterfaceProps {
  onClose: () => void
  projectTitle: string
  hideHeader?: boolean
}

export function VideoTranslationInterface({ onClose, projectTitle, hideHeader = false }: VideoTranslationInterfaceProps) {
  const [videoTranslations, setVideoTranslations] = useState<VideoTranslationProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchVideoTranslations()
  }, [])

  const fetchVideoTranslations = async () => {
    try {
      const response = await fetch('/api/video-translations')
      if (response.ok) {
        const data = await response.json()
        setVideoTranslations(data.videoTranslations || [])
      }
    } catch (error) {
      console.error('Error fetching video translations:', error)
      toast({
        title: "Error",
        description: "Failed to fetch video translation projects",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
      draft: 'outline'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSubmit = async (data: VideoTranslationInputs) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/video-translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: result.message || "Video translation project created successfully",
        })
        setShowForm(false)
        fetchVideoTranslations() // Refresh the list
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create video translation project",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating video translation:', error)
      toast({
        title: "Error",
        description: "Failed to create video translation project",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = (translation: VideoTranslationProject) => {
    if (translation.translated_video_url) {
      const link = document.createElement('a')
      link.href = translation.translated_video_url
      link.download = `${translation.title}_translated.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (showForm) {
    return (
      <VideoTranslationForm
        onSubmit={handleSubmit}
        onCancel={() => setShowForm(false)}
        isLoading={isSubmitting}
        isOpen={true}
      />
    )
  }

  return (
    <div className="bg-background border border-border rounded-lg p-6 space-y-6">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Languages className="h-6 w-6" />
              Video Translation Projects
            </h2>
            <p className="text-muted-foreground">Manage your video translation projects</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Translation
          </Button>
        </div>
      )}

      {/* Projects Grid */}
      {videoTranslations.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <Languages className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No translation projects yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first video translation project to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videoTranslations.map((translation) => (
            <Card key={translation.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{translation.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {translation.description || 'Video translation project'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {getStatusIcon(translation.status)}
                    {getStatusBadge(translation.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Video Preview */}
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  {translation.video_file_input ? (
                    <video
                      src={translation.video_file_input}
                      className="w-full h-full object-cover"
                      muted
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Project Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Languages className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Target:</span>
                    <span className="font-medium">{translation.output_language}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {formatDate(translation.created_at)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {translation.status === 'completed' && translation.translated_video_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(translation)}
                      className="flex-1"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                  
                  {translation.status === 'completed' && translation.translated_video_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(translation.translated_video_url, '_blank')}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {translation.status === 'processing' && (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Processing...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
