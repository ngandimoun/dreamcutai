"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Download, 
  Calendar, 
  Clock, 
  User,
  Video,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ExplainerVideo {
  id: string
  title: string
  prompt: string
  status: string
  created_at: string
  video_url?: string
  duration?: number
  aspect_ratio?: string
  resolution?: string
  style?: string
}

interface ExplainerVideoLibraryProps {
  userId: string
  onVideoSelect?: (video: ExplainerVideo) => void
  onVideoClick?: (video: ExplainerVideo) => void
  className?: string
}

export function ExplainerVideoLibrary({ userId, onVideoSelect, onVideoClick, className }: ExplainerVideoLibraryProps) {
  const [videos, setVideos] = useState<ExplainerVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [selectedVideo, setSelectedVideo] = useState<ExplainerVideo | null>(null)
  
  const supabase = createClient()
  const { toast } = useToast()

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError("")
      console.log('🎬 ExplainerVideoLibrary: Starting to fetch videos for userId:', userId)

      // Fetch explainer jobs from database
      const { data: jobs, error: jobsError } = await supabase
        .from('explainers')
        .select('id, title, prompt, status, created_at, metadata')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (jobsError) {
        throw new Error(jobsError.message)
      }

      console.log('🎬 ExplainerVideoLibrary: Found', jobs?.length || 0, 'completed explainer jobs')

      // Get video URLs from storage
      const videosWithUrls = await Promise.all(
        jobs.map(async (job) => {
          try {
            // Construct the expected file path
            const filePath = `renders/explainers/${userId}/${job.id}.mp4`
            
            // Get signed URL for the video (1 hour expiry)
            const { data, error: urlError } = await supabase.storage
              .from('dreamcut')
              .createSignedUrl(filePath, 3600)

            if (urlError) {
              console.error(`Error creating signed URL for video ${job.id}:`, urlError)
            }

            const videoData = {
              id: job.id,
              title: job.title || 'Untitled Animation',
              prompt: job.prompt || '',
              status: job.status,
              created_at: job.created_at,
              video_url: data?.signedUrl,
              duration: job.metadata?.duration,
              aspect_ratio: job.metadata?.aspect_ratio,
              resolution: job.metadata?.resolution,
              style: job.metadata?.style
            }

            console.log('🎬 ExplainerVideoLibrary: Video data for', job.id, ':', {
              title: videoData.title,
              hasVideoUrl: !!videoData.video_url,
              videoUrl: videoData.video_url ? 'URL generated' : 'No URL'
            })

            return videoData
          } catch (error) {
            console.error(`Error getting URL for video ${job.id}:`, error)
            return {
              id: job.id,
              title: job.title || 'Untitled Animation',
              prompt: job.prompt || '',
              status: job.status,
              created_at: job.created_at,
              video_url: undefined
            }
          }
        })
      )

      console.log('🎬 ExplainerVideoLibrary: Final videos array:', videosWithUrls.length, 'videos')
      setVideos(videosWithUrls)
    } catch (error) {
      console.error('Error fetching videos:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch videos')
      toast({
        title: "Error loading videos",
        description: "Could not load your explainer videos. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchVideos()
    }
  }, [userId])

  const handleVideoSelect = (video: ExplainerVideo) => {
    setSelectedVideo(video)
    onVideoSelect?.(video)
    onVideoClick?.(video)
  }

  const handleDownload = async (video: ExplainerVideo) => {
    if (!video.video_url) return
    
    try {
      const response = await fetch(video.video_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Download started",
        description: "Your video is being downloaded.",
      })
    } catch (error) {
      console.error('Download failed:', error)
      toast({
        title: "Download failed",
        description: "Could not download the video. Please try again.",
        variant: "destructive"
      })
    }
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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds === 0 ? `${minutes}min` : `${minutes}min ${remainingSeconds}s`
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading your explainer videos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button onClick={fetchVideos} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (videos.length === 0) {
    console.log('🎬 ExplainerVideoLibrary: No videos found, showing empty state')
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center">
          <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Explainer Videos Yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first explainer animation to see it here.
          </p>
        </div>
      </div>
    )
  }

  console.log('🎬 ExplainerVideoLibrary: Rendering', videos.length, 'video cards')

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Explainer Videos</h3>
        <Button onClick={fetchVideos} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <Card 
            key={video.id} 
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              selectedVideo?.id === video.id && "ring-2 ring-primary"
            )}
            onClick={() => handleVideoSelect(video)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-medium line-clamp-2">
                  {video.title}
                </CardTitle>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {video.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {video.video_url ? (
                <div className="space-y-3">
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover"
                      poster="/placeholder.jpg"
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="secondary">
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(video)
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {video.prompt}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(video.created_at)}
                      </div>
                      {video.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {video.aspect_ratio && (
                        <Badge variant="outline" className="text-xs">
                          {video.aspect_ratio}
                        </Badge>
                      )}
                      {video.resolution && (
                        <Badge variant="outline" className="text-xs">
                          {video.resolution}
                        </Badge>
                      )}
                      {video.style && (
                        <Badge variant="outline" className="text-xs">
                          {video.style}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Video not available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedVideo && selectedVideo.video_url && (
        <div className="mt-6 p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Selected Video: {selectedVideo.title}</h4>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleDownload(selectedVideo)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          <video
            src={selectedVideo.video_url}
            controls
            className="w-full rounded-lg shadow-lg"
            poster="/placeholder.jpg"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  )
}
