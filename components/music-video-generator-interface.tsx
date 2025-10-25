"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Film, 
  Music, 
  Play, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  User,
  Globe,
  AlertCircle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface MusicTrack {
  id: string
  title: string
  prompt: string
  audio_url: string
  suno_task_id: string
  suno_audio_id: string
  status: string
  created_at: string
}

interface MusicVideo {
  id: string
  suno_task_id: string
  status: string
  video_url?: string
  author?: string
  domain_name?: string
  source_task_id: string
  source_audio_id: string
  created_at: string
  updated_at: string
  music_jingle?: MusicTrack
}

export function MusicVideoGeneratorInterface() {
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([])
  const [musicVideos, setMusicVideos] = useState<MusicVideo[]>([])
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null)
  const [author, setAuthor] = useState("")
  const [domainName, setDomainName] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  // Load music tracks and videos on component mount
  useEffect(() => {
    loadMusicTracks()
    loadMusicVideos()
  }, [])

  const loadMusicTracks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('music_jingles')
        .select('id, title, prompt, audio_url, suno_task_id, suno_audio_id, status, created_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .not('suno_audio_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error loading music tracks:', error)
        return
      }

      setMusicTracks(data || [])
    } catch (error) {
      console.error('Error loading music tracks:', error)
    }
  }

  const loadMusicVideos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('music_videos')
        .select(`
          *,
          music_jingles (
            id,
            title,
            prompt,
            audio_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error loading music videos:', error)
        return
      }

      setMusicVideos(data || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading music videos:', error)
      setIsLoading(false)
    }
  }

  const handleGenerateVideo = async () => {
    if (!selectedTrack) {
      toast({
        title: "No track selected",
        description: "Please select a music track to create a video for",
        variant: "destructive"
      })
      return
    }

    if (!selectedTrack.suno_audio_id) {
      toast({
        title: "Invalid track",
        description: "This track doesn't have a valid Suno audio ID for video generation",
        variant: "destructive"
      })
      return
    }

    if (author.length > 50) {
      toast({
        title: "Author name too long",
        description: "Author name must be 50 characters or less",
        variant: "destructive"
      })
      return
    }

    if (domainName.length > 50) {
      toast({
        title: "Domain name too long",
        description: "Domain name must be 50 characters or less",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/music-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: selectedTrack.suno_task_id,
          audioId: selectedTrack.suno_audio_id, // Using Suno audio ID
          author: author || undefined,
          domainName: domainName || undefined,
          musicJingleId: selectedTrack.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create music video')
      }

      const result = await response.json()
      
      toast({
        title: "Video generation started!",
        description: `Your music video is being generated. Task ID: ${result.musicVideo.suno_task_id}`,
        duration: 5000
      })

      // Refresh videos list
      await loadMusicVideos()
      
      // Reset form
      setSelectedTrack(null)
      setAuthor("")
      setDomainName("")

    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-rose-500" />
      case 'generating':
        return <Loader2 className="h-4 w-4 text-sky-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-amber-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-emerald-500 text-xs">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive" className="bg-rose-500 text-xs">Failed</Badge>
      case 'generating':
        return <Badge variant="secondary" className="bg-sky-500 text-xs">Generating</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Pending</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-950 dark:to-blue-950">
          <Loader2 className="h-5 w-5 animate-spin text-sky-600 dark:text-sky-400" />
        </div>
        <span className="ml-2 text-sm">Loading music videos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-950 dark:to-purple-950">
          <Film className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Music Video Generator</h2>
          <p className="text-xs text-muted-foreground">
            Create MP4 videos with visualizations for your music tracks
          </p>
        </div>
      </div>

      {/* Generate New Video Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            <Film className="h-4 w-4" />
            Create New Music Video
          </CardTitle>
          <CardDescription className="text-xs">
            Select a completed music track to generate a video with visualizations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Track Selection */}
          <div className="space-y-2">
            <Label className="text-xs text-sky-600 dark:text-sky-400 font-medium">Select Music Track</Label>
            {musicTracks.length === 0 ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">
                  No completed music tracks found. Create some music first!
                </span>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-hover">
                {musicTracks.map((track) => (
                  <div
                    key={track.id}
                    className={`p-2 border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedTrack?.id === track.id
                        ? 'border-rose-500 bg-gradient-to-r from-rose-50 to-purple-50 dark:from-rose-950/20 dark:to-purple-950/20 shadow-sm'
                        : 'hover:bg-muted/50 hover:border-rose-200'
                    }`}
                    onClick={() => setSelectedTrack(track)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded bg-gradient-to-r from-rose-100 to-purple-100 dark:from-rose-900 dark:to-purple-900 flex-shrink-0 mt-0.5">
                        <Music className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-medium text-xs leading-tight line-clamp-1">{track.title || 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-tight">{track.prompt}</p>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <Badge variant="outline" className="text-xs">
                          {new Date(track.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author" className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <User className="h-3 w-3" />
                Artist Name (Optional)
              </Label>
              <Input
                id="author"
                placeholder="Your artist name"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                {author.length}/50 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain" className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400 font-medium">
                <Globe className="h-3 w-3" />
                Domain/Watermark (Optional)
              </Label>
              <Input
                id="domain"
                placeholder="yourwebsite.com"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                {domainName.length}/50 characters
              </p>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateVideo}
            disabled={!selectedTrack || isGenerating}
            className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white border-0 text-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Film className="h-4 w-4 mr-2" />
                Generate Music Video
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Videos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            <Film className="h-4 w-4" />
            Your Music Videos
          </CardTitle>
          <CardDescription className="text-xs">
            Track the status of your music video generations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {musicVideos.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <div className="p-3 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-950 dark:to-purple-950 w-fit mx-auto mb-3">
                <Film className="h-6 w-6 text-rose-500 dark:text-rose-400" />
              </div>
              <p className="text-sm">No music videos created yet</p>
              <p className="text-xs">Generate your first music video above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {musicVideos.map((video) => (
                <div key={video.id} className="p-3 border rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(video.status)}
                      <div>
                        <p className="font-medium text-sm">
                          {video.music_jingle?.title || 'Untitled Music Video'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(video.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(video.status)}
                  </div>

                  {video.music_jingle && (
                    <div className="mb-2 p-2 bg-gradient-to-r from-rose-50 to-purple-50 dark:from-rose-950/20 dark:to-purple-950/20 rounded-lg">
                      <p className="text-xs font-medium">Source Track:</p>
                      <p className="text-xs text-muted-foreground">{video.music_jingle.prompt}</p>
                    </div>
                  )}

                  {video.author && (
                    <p className="text-xs text-muted-foreground mb-1">
                      <span className="font-medium">Artist:</span> {video.author}
                    </p>
                  )}

                  {video.domain_name && (
                    <p className="text-xs text-muted-foreground mb-1">
                      <span className="font-medium">Domain:</span> {video.domain_name}
                    </p>
                  )}

                  {video.status === 'completed' && video.video_url && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => window.open(video.video_url, '_blank')}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = video.video_url!
                          link.download = `music-video-${video.id}.mp4`
                          link.click()
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}

                  {video.status === 'failed' && (
                    <p className="text-xs text-rose-500 mt-2">
                      Video generation failed. Please try again.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

