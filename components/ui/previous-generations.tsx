"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Trash2, 
  Eye,
  Calendar,
  Tag,
  RefreshCw,
  Grid3x3,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Download
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { getContentTypeInfo, getContentTypeDisplayName, getContentTypeApiRoute, isVideoContentType, isAudioContentType, isImageContentType } from "@/lib/types/content-types"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { useSectionCache } from "@/hooks/use-section-cache"
import { mutate } from "swr"

// Utility function to format duration in seconds to MM:SS format
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

interface PreviousGenerationsProps {
  contentType: string
  userId: string
  className?: string
}

export function PreviousGenerations({ contentType, userId, className = "" }: PreviousGenerationsProps) {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [isBulkAdding, setIsBulkAdding] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [selectedVideoItem, setSelectedVideoItem] = useState<any>(null)
  const [isRecovering, setIsRecovering] = useState(false)
  const [isBatchRecovering, setIsBatchRecovering] = useState(false)
  const [batchRecoveryProgress, setBatchRecoveryProgress] = useState(0)
  const [batchRecoveryResults, setBatchRecoveryResults] = useState<any>(null)
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  // Use the new section cache hook
  const { data: items = [], error, isLoading: loading, mutate } = useSectionCache(contentType, userId)

  const contentInfo = getContentTypeInfo(contentType)
  const displayName = getContentTypeDisplayName(contentType)
  const apiRoute = getContentTypeApiRoute(contentType)


  // Delete item
  const deleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`${apiRoute}/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Failed to delete item: ${response.statusText}`)
      }

      toast({
        title: "Item deleted",
        description: "Item has been removed successfully.",
      })

      // Refresh the list
      mutate()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle voice preview playback
  const handlePlayVoicePreview = (audioUrl: string, voiceId: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.onended = () => setPlayingVoiceId(null)
    }

    if (playingVoiceId === voiceId) {
      audioRef.current.pause()
      setPlayingVoiceId(null)
    } else {
      audioRef.current.src = audioUrl
      audioRef.current.play()
      setPlayingVoiceId(voiceId)
    }
  }

  // Handle voiceover playback
  const handlePlayVoiceover = (voiceoverId: string, storagePath: string) => {
    console.log('🎵 [PLAYBACK] Attempting to play voiceover:', voiceoverId)
    console.log('🎵 [PLAYBACK] Storage path:', storagePath)
    
    if (!storagePath) {
      console.error('❌ [PLAYBACK] No storage path provided')
      toast({
        title: "Playback failed",
        description: "Audio file not available",
        variant: "destructive"
      })
      return
    }
    
    // Try signed URL first, then proxy as fallback
    const signedUrl = items.find(item => item.id === voiceoverId)?.generated_audio_path
    const audioUrl = signedUrl || `/api/voiceovers/stream?path=${encodeURIComponent(storagePath)}`
    console.log('🎵 [PLAYBACK] Using audio URL:', audioUrl)
    console.log('🎵 [PLAYBACK] URL type:', signedUrl ? 'signed' : 'proxy')
    
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.onended = () => {
        console.log('🎵 [PLAYBACK] Audio ended')
        setPlayingVoiceId(null)
      }
      audioRef.current.onerror = (e) => {
        console.error('❌ [PLAYBACK] Audio error:', e)
        toast({
          title: "Playback failed",
          description: "Could not load audio file",
          variant: "destructive"
        })
        setPlayingVoiceId(null)
      }
    }

    if (playingVoiceId === voiceoverId) {
      console.log('🎵 [PLAYBACK] Pausing audio')
      audioRef.current.pause()
      setPlayingVoiceId(null)
    } else {
      // Stop any currently playing audio
      if (playingVoiceId) {
        console.log('🎵 [PLAYBACK] Stopping previous audio')
        audioRef.current.pause()
      }
      
              console.log('🎵 [PLAYBACK] Starting playback...')
              audioRef.current.src = audioUrl
      audioRef.current.play()
        .then(() => {
          console.log('✅ [PLAYBACK] Audio playing successfully')
          setPlayingVoiceId(voiceoverId)
        })
        .catch((error) => {
          console.error('❌ [PLAYBACK] Play failed:', error)
          toast({
            title: "Playback failed",
            description: error.message || "Could not play audio",
            variant: "destructive"
          })
          setPlayingVoiceId(null)
        })
    }
  }

  // Handle voiceover download
  const handleDownloadVoiceover = async (voiceover: any) => {
    try {
      if (!voiceover.storage_path) {
        throw new Error('No storage path available')
      }
      
      const proxyUrl = `/api/voiceovers/stream?path=${encodeURIComponent(voiceover.storage_path)}`
      const response = await fetch(proxyUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${voiceover.title || 'voiceover'}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Download started",
        description: `Downloading ${voiceover.title || 'voiceover'}...`
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download failed",
        description: "Could not download the voiceover.",
        variant: "destructive"
      })
    }
  }

  // Handle video playback
  const handlePlayVideo = async (video: any) => {
    console.log('🎬 [VIDEO] Attempting to play video:', video.id)
    
    try {
      // Fetch fresh signed URL from API
      const response = await fetch('/api/talking-avatars')
      if (!response.ok) {
        throw new Error('Failed to fetch video data')
      }
      
      const data = await response.json()
      const freshVideo = data.talkingAvatars?.find((v: any) => v.id === video.id)
      
      if (!freshVideo?.generated_video_url) {
        throw new Error('Video URL not available')
      }
      
      // Open with fresh URL
      window.open(freshVideo.generated_video_url, '_blank')
      
      toast({
        title: "Opening video",
        description: `Playing ${video.title || 'talking avatar'}...`
      })
    } catch (error) {
      console.error('❌ [VIDEO] Playback failed:', error)
      toast({
        title: "Playback failed",
        description: "Unable to play video. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle video download
  const handleDownloadVideo = async (video: any) => {
    try {
      // Fetch fresh signed URL from API
      const response = await fetch('/api/talking-avatars')
      if (!response.ok) {
        throw new Error('Failed to fetch video data')
      }
      
      const data = await response.json()
      const freshVideo = data.talkingAvatars?.find((v: any) => v.id === video.id)
      
      if (!freshVideo?.generated_video_url) {
        throw new Error('Video URL not available')
      }
      
      // Download with fresh URL
      const link = document.createElement('a')
      link.href = freshVideo.generated_video_url
      link.download = `${video.title || 'talking-avatar'}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Download started",
        description: `Downloading ${video.title || 'talking avatar'}...`
      })
    } catch (error) {
      console.error('❌ [VIDEO] Download failed:', error)
      toast({
        title: "Download failed",
        description: "Unable to download video. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle avatar download
  const handleDownloadAvatar = async (item: any) => {
    try {
      const imageUrl = item.generated_images?.[0]
      if (!imageUrl) {
        throw new Error('No image available for download')
      }
      
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.title || 'avatar'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Download started",
        description: `Downloading ${item.title || 'avatar'}...`
      })
    } catch (error) {
      console.error('Avatar download error:', error)
      toast({
        title: "Download failed",
        description: "Could not download the avatar.",
        variant: "destructive"
      })
    }
  }

  // Handle product mockup download
  const handleDownloadMockup = async (item: any) => {
    try {
      const imageUrl = item.generated_images?.[0]
      if (!imageUrl) {
        throw new Error('No image available for download')
      }
      
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.title || 'mockup'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Download started",
        description: `Downloading ${item.title || 'mockup'}...`
      })
    } catch (error) {
      console.error('Mockup download error:', error)
      toast({
        title: "Download failed",
        description: "Could not download the mockup.",
        variant: "destructive"
      })
    }
  }

  // Handle charts & infographics download
  const handleDownloadChart = async (item: any) => {
    try {
      const imageUrl = item.generated_images?.[0]
      if (!imageUrl) {
        throw new Error('No image available for download')
      }
      
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.title || 'chart'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Download started",
        description: `Downloading ${item.title || 'chart'}...`
      })
    } catch (error) {
      console.error('Chart download error:', error)
      toast({
        title: "Download failed",
        description: "Could not download the chart.",
        variant: "destructive"
      })
    }
  }

  // Handle video download for diverse motion
  const handleDownloadDiverseMotionVideo = async (item: any) => {
    const videoUrl = item.generated_video_url || item.video_url || item.media_url || item.url
    if (!videoUrl) {
      toast({
        title: "Download failed",
        description: "Video URL not available",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.title || 'video'}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Download started",
        description: "Your video is being downloaded",
      })
    } catch (error) {
      console.error('Error downloading video:', error)
      toast({
        title: "Download failed",
        description: "Failed to download video. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle bulk add to ElevenLabs library
  const handleBulkAddToLibrary = async () => {
    console.log('📚 [BULK ADD] Starting bulk add to ElevenLabs library...')
    
    setIsBulkAdding(true)
    try {
      const response = await fetch('/api/voice-creation/bulk-add-to-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Bulk add failed: ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ [BULK ADD] Success:', result)

      toast({
        title: "Voices Added to ElevenLabs Library!",
        description: `Successfully added ${result.successful} voices to your ElevenLabs library. ${result.failed > 0 ? `${result.failed} failed.` : ''}`,
        variant: "default"
      })

      // Refresh the list to show updated status
      mutate()

    } catch (error) {
      console.error('❌ [BULK ADD] Error:', error)
      toast({
        title: "Failed to Add Voices",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive"
      })
    } finally {
      setIsBulkAdding(false)
    }
  }

  // Handle status checking for music jingles
  const handleCheckStatus = async (taskId: string) => {
    console.log('🔍 [STATUS CHECK] Checking status for task:', taskId)
    
    setIsCheckingStatus(true)
    try {
      const response = await fetch(`/api/suno/poll/${taskId}`)
      const result = await response.json()
      
      if (response.ok) {
        console.log('✅ [STATUS CHECK] Status check result:', result)
        
        toast({
          title: "Status Updated",
          description: result.message || 'Task status has been checked',
          variant: "default"
        })
        
        // Refresh the items to show updated status
        mutate()
      } else {
        throw new Error(result.message || 'Status check failed')
      }
    } catch (error) {
      console.error('❌ [STATUS CHECK] Error:', error)
      toast({
        title: "Status Check Failed",
        description: error instanceof Error ? error.message : 'Could not check task status',
        variant: "destructive"
      })
    } finally {
      setIsCheckingStatus(false)
    }
  }

  // Handle task recovery for stuck music jingles
  const handleRecoverTask = async (taskId: string) => {
    console.log('🔧 [RECOVERY] Attempting recovery for task:', taskId)
    
    setIsRecovering(true)
    try {
      const response = await fetch(`/api/admin/suno/recover/${taskId}`, {
        method: 'POST'
      })
      const result = await response.json()
      
      if (response.ok && result.success) {
        console.log('✅ [RECOVERY] Recovery successful:', result)
        
        toast({
          title: "Task Recovered!",
          description: result.message || 'Task has been successfully recovered',
          variant: "default"
        })
        
        // Refresh the items to show updated status
        mutate()
      } else {
        throw new Error(result.message || 'Recovery failed')
      }
    } catch (error) {
      console.error('❌ [RECOVERY] Error:', error)
      toast({
        title: "Recovery Failed",
        description: error instanceof Error ? error.message : 'Could not recover task',
        variant: "destructive"
      })
    } finally {
      setIsRecovering(false)
    }
  }

  // Check if a music jingle is stuck in processing (more than 5 minutes)
  const isStuckInProcessing = (item: any) => {
    if (item.status !== 'processing') return false
    
    const createdAt = new Date(item.created_at)
    const now = new Date()
    const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60)
    
    return minutesElapsed > 5
  }

  // Handle batch recovery of all stuck music jingles
  const handleBatchRecover = async () => {
    console.log('🔧 [BATCH RECOVERY] Starting batch recovery...')
    
    setIsBatchRecovering(true)
    setShowRecoveryDialog(true)
    setBatchRecoveryProgress(0)
    setBatchRecoveryResults(null)
    
    try {
      const response = await fetch('/api/admin/suno/recover-all', {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        console.log('✅ [BATCH RECOVERY] Batch recovery successful:', result)
        setBatchRecoveryResults(result)
        setBatchRecoveryProgress(100)
        
        toast({
          title: "Batch Recovery Complete!",
          description: `Successfully recovered ${result.successful} songs. ${result.failed > 0 ? `${result.failed} failed.` : ''} ${result.stillProcessing > 0 ? `${result.stillProcessing} still processing.` : ''}`,
          variant: "default"
        })
        
        // Refresh the items to show updated status
        mutate()
      } else {
        throw new Error(result.message || 'Batch recovery failed')
      }
    } catch (error) {
      console.error('❌ [BATCH RECOVERY] Error:', error)
      setBatchRecoveryResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      toast({
        title: "Batch Recovery Failed",
        description: error instanceof Error ? error.message : 'Could not recover songs',
        variant: "destructive"
      })
    } finally {
      setIsBatchRecovering(false)
    }
  }

  // Check if there are any processing items for batch recovery
  const hasProcessingItems = () => {
    return contentType === 'music_jingles' && items.some(item => item.status === 'processing')
  }

  // Get media icon based on content type
  const getMediaIcon = (item: any) => {
    const videoUrl = item.generated_video_url || item.video_url || item.media_url || item.url
    const audioUrl = item.generated_audio_path || item.audio_url || item.media_url || item.url
    const imageUrl = item.generated_image_url || item.image_url || item.image || item.media_url || item.url

    if (isVideoContentType(contentType) && videoUrl) {
      return <Play className="h-4 w-4" />
    } else if (isAudioContentType(contentType) && audioUrl) {
      return <Volume2 className="h-4 w-4" />
    } else if (isImageContentType(contentType) && imageUrl) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <Eye className="h-4 w-4" />
  }

  // Render media preview
  const renderMediaPreview = (item: any) => {
    // API routes return different field names, so we need to check multiple possibilities
    let videoUrl = item.generated_video_url || item.video_url || item.media_url || item.url
    let audioUrl = item.generated_audio_path || item.audio_url || item.media_url || item.url
    let imageUrl = item.generated_image_url || item.image_url || item.image || item.media_url || item.url
    
    // Handle different content types with their specific image fields
    if (contentType === 'product_mockups' || contentType === 'illustrations' || contentType === 'avatars_personas' || contentType === 'concept_worlds' || contentType === 'charts_infographics') {
      // Visual content types that use generated_images and storage_paths
      console.log(`🔍 Processing ${contentType} item:`, {
        id: item.id,
        title: item.title,
        status: item.status,
        hasGeneratedImages: !!item.generated_images,
        generatedImagesLength: item.generated_images?.length || 0,
        generatedImages: item.generated_images,
        hasStoragePaths: !!item.storage_paths,
        storagePathsLength: item.storage_paths?.length || 0,
        storagePaths: item.storage_paths
      })
      
      if (item.generated_images && item.generated_images.length > 0) {
        imageUrl = item.generated_images[0]
        console.log(`🖼️ Using generated image for ${contentType}:`, imageUrl)
      } else if (item.storage_paths && item.storage_paths.length > 0) {
        // For storage paths, we need to construct the Supabase URL
        imageUrl = `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/dreamcut/${item.storage_paths[0]}`
        console.log(`🖼️ Using storage path for ${contentType}:`, imageUrl)
      } else {
        // No images generated - this will show the placeholder with status message
        console.log(`⚠️ No images found for ${contentType} (status: ${item.status})`)
      }
    } else if (contentType === 'explainers' || contentType === 'ugc_ads' || contentType === 'product_motions' || contentType === 'talking_avatars') {
      // Motion content types that use video URLs
      if (item.output_url || item.output_video_url || item.generated_video_url) {
        videoUrl = item.output_url || item.output_video_url || item.generated_video_url
        console.log(`🎥 Using video URL for ${contentType}:`, videoUrl)
      } else {
        console.log(`⚠️ No video found for ${contentType} (status: ${item.status})`)
      }
    } else if (contentType === 'voices_creations') {
      // Voice creations have multiple previews in content.all_previews
      if (item.content?.all_previews && item.content.all_previews.length > 0) {
        // Use the first preview for the card thumbnail
        audioUrl = item.content.all_previews[0].signed_url
        console.log(`🎵 Voice creation has ${item.content.all_previews.length} previews`)
      } else if (item.generated_audio_path) {
        audioUrl = item.generated_audio_path
        console.log(`🎵 Using primary audio for voice creation`)
      }
    } else if (contentType === 'voiceovers' || contentType === 'music_jingles' || contentType === 'sound_fx') {
      // Other audio content types use single audio URLs
      if (item.generated_audio_path || item.audio_url || item.storage_path) {
        audioUrl = item.generated_audio_path || item.audio_url || item.storage_path
        console.log(`🎵 Using audio URL for ${contentType}:`, audioUrl)
      } else {
        console.log(`⚠️ No audio found for ${contentType} (status: ${item.status})`)
      }
    } else if (contentType === 'subtitles' || contentType === 'watermarks' || contentType === 'video_translations') {
      // Edit/utility content types
      if (item.output_video_url || item.translated_video_url || item.video_url) {
        videoUrl = item.output_video_url || item.translated_video_url || item.video_url
        console.log(`🎬 Using video URL for ${contentType}:`, videoUrl)
      } else {
        console.log(`⚠️ No video found for ${contentType} (status: ${item.status})`)
      }
    }
    
    // Fallback: For any content type, check generated_images if no specific URL found
    if (!imageUrl && !videoUrl && !audioUrl && item.generated_images && item.generated_images.length > 0) {
      imageUrl = item.generated_images[0]
      console.log(`🖼️ Fallback: Using generated image for ${contentType}:`, imageUrl)
    }

    if (isVideoContentType(contentType) && videoUrl) {
      return (
        <div className="relative w-full h-48 rounded-t-lg overflow-hidden">
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            poster="/placeholder.jpg"
            muted
            preload="metadata"
            onError={(e) => {
              console.error(`❌ Video failed to load for ${contentType}:`, e)
              // Fallback to placeholder if video fails to load
              const target = e.target as HTMLVideoElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <svg class="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                `
              }
            }}
          >
            Your browser does not support the video tag.
          </video>
          {/* Duration overlay for videos */}
          {item.actual_duration && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {formatDuration(item.actual_duration)}
            </div>
          )}
        </div>
      )
    } else if (isAudioContentType(contentType) && audioUrl) {
      // Special handling for music jingles with cover images
      if (contentType === 'music_jingles' && item.image_url) {
        return (
          <div className="relative w-full h-48 rounded-t-lg overflow-hidden">
            <img
              src={item.image_url}
              alt={item.title || 'Music cover'}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to gradient if image fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <svg class="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </div>
                  `
                }
              }}
            />
            {/* Duration overlay */}
            {item.actual_duration && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {formatDuration(item.actual_duration)}
              </div>
            )}
          </div>
        )
      } else {
        // Default audio preview for other content types or music without cover
        return (
          <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
            <Volume2 className="h-8 w-8 text-white" />
          </div>
        )
      }
    } else if (isImageContentType(contentType) && imageUrl) {
      console.log(`🖼️ Rendering image for ${contentType}:`, imageUrl)
      // Special handling for avatars_personas, product_mockups, and charts_infographics with responsive height
      const isAvatar = contentType === 'avatars_personas'
      const isMockup = contentType === 'product_mockups'
      const isChart = contentType === 'charts_infographics'
      const isVisualContent = isAvatar || isMockup || isChart
      return (
        <div className={`w-full ${isVisualContent ? 'h-48' : 'h-32'} rounded-t-lg overflow-hidden`}>
          <img
            src={imageUrl}
            alt={item.title || 'Generated content'}
            className="w-full h-full object-cover"
            onLoad={() => console.log(`✅ Image loaded successfully for ${contentType}`)}
            onError={(e) => console.error(`❌ Image failed to load for ${contentType}:`, e)}
          />
        </div>
      )
    } else {
      // Show different placeholder based on status
      const isFailed = item.status === 'failed'
      const isRejected = item.status === 'rejected'
      const isCompleted = item.status === 'completed'
      
      return (
        <div className={`w-full h-32 rounded-t-lg flex flex-col items-center justify-center ${
          isFailed 
            ? 'bg-gradient-to-br from-red-100 to-red-200' 
            : isRejected
            ? 'bg-gradient-to-br from-orange-100 to-orange-200'
            : isCompleted 
            ? 'bg-gradient-to-br from-yellow-100 to-yellow-200'
            : 'bg-gradient-to-br from-gray-200 to-gray-300'
        }`}>
          <Grid3x3 className={`h-6 w-6 mb-1 ${
            isFailed ? 'text-red-500' : isRejected ? 'text-orange-500' : isCompleted ? 'text-yellow-600' : 'text-gray-500'
          }`} />
          <span className={`text-xs font-medium ${
            isFailed ? 'text-red-600' : isRejected ? 'text-orange-600' : isCompleted ? 'text-yellow-700' : 'text-gray-600'
          }`}>
            {isFailed ? 'Generation Failed' : isRejected ? 'Content Rejected' : isCompleted ? 'No Images Generated' : 'Processing...'}
          </span>
        </div>
      )
    }
  }

  // Add retry handler for music jingles
  const handleRetry = async (item: any) => {
    if (!item.suno_task_id) return
    
    try {
      const response = await fetch(`/api/suno/poll/${item.suno_task_id}`)
      const data = await response.json()
      
      if (data.status === 'completed') {
        mutate()
        toast({
          title: "Success!",
          description: "Audio recovered successfully.",
        })
      } else {
        toast({
          title: "Still processing",
          description: `Status: ${data.status}`,
        })
      }
    } catch (error) {
      toast({
        title: "Retry failed",
        description: "Could not check status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Add status badge function
  const getStatusBadge = (item: any) => {
    if (item.content_type !== 'music_jingles') return null
    
    const status = item.status || 'unknown'
    
    const statusConfig = {
      completed: { label: 'Ready', color: 'bg-green-500', tooltip: 'Generation completed successfully' },
      processing: { label: 'Generating...', color: 'bg-yellow-500', tooltip: 'Your music is being generated' },
      pending: { label: 'Queued', color: 'bg-blue-500', tooltip: 'Waiting in queue for processing' },
      failed: { label: 'Failed', color: 'bg-red-500', tooltip: item.error_message || 'Generation failed due to technical error' },
      rejected: { label: 'Rejected', color: 'bg-orange-500', tooltip: item.error_message || 'Content rejected by Suno (likely due to artist names or policy violations)' },
      unknown: { label: 'Unknown', color: 'bg-gray-500', tooltip: 'Unknown status' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown
    
    return (
      <div className="flex items-center gap-2" title={config.tooltip}>
        <div className={`h-2 w-2 rounded-full ${config.color}`} />
        <span className="text-xs text-muted-foreground">{config.label}</span>
      </div>
    )
  }

  // Add retry button for failed/processing items
  const getActionButtons = (item: any) => {
    if (item.content_type !== 'music_jingles') return null
    
    const needsRetry = item.status === 'processing' || item.status === 'failed' || !item.audio_url
    
    if (!needsRetry) return null
    
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleRetry(item)}
        className="ml-2"
      >
        <RefreshCw className="h-3 w-3 mr-1" />
        Check Status
      </Button>
    )
  }

  // Add estimated completion time
  const getEstimatedTime = (item: any) => {
    if (item.status !== 'processing' || !item.created_at) return null
    
    const createdAt = new Date(item.created_at)
    const now = new Date()
    const elapsed = (now.getTime() - createdAt.getTime()) / 1000 // seconds
    
    // Typical generation takes 60-120 seconds
    const estimatedTotal = 90 // seconds
    const remaining = Math.max(0, estimatedTotal - elapsed)
    
    if (remaining === 0) {
      return <span className="text-xs text-muted-foreground">Should be ready soon...</span>
    }
    
    const minutes = Math.floor(remaining / 60)
    const seconds = Math.floor(remaining % 60)
    
    return (
      <span className="text-xs text-muted-foreground">
        ~{minutes > 0 ? `${minutes}m ` : ''}{seconds}s remaining
      </span>
    )
  }

  // Get title and description based on content type
  const getItemTitle = (item: any) => {
    switch (contentType) {
      case 'ugc_ads':
        return item.brand_name || 'Untitled Ad'
      case 'product_motions':
        return item.product_name || item.product_category || 'Untitled Motion'
      case 'sound_fx':
        return item.name || 'Untitled Sound'
      case 'voice_creations':
        return item.title || item.voice_name || 'Untitled Voice'
      case 'voiceovers':
        return item.title || 'Untitled Voiceover'
      case 'music_jingles':
        return item.title || 'Untitled Jingle'
      case 'talking_avatars':
        return item.avatar_name || 'Untitled Avatar'
      case 'watermarks':
        return item.watermark_text || 'Untitled Watermark'
      case 'subtitles':
        return item.subtitle_text || 'Untitled Subtitle'
      case 'video_translations':
        return item.target_language || 'Untitled Translation'
      default:
        return item.title || 'Untitled'
    }
  }

  const getItemDescription = (item: any) => {
    switch (contentType) {
      case 'ugc_ads':
        return item.brand_prompt || ''
      case 'product_motions':
        return item.prompt || ''
      case 'sound_fx':
        return item.prompt || ''
      case 'explainers':
      case 'illustrations':
      case 'product_mockups':
      case 'avatars_personas':
      case 'concept_worlds':
      case 'charts_infographics':
        return item.prompt || ''
      case 'voice_creations':
        return item.voice_description || ''
      case 'voiceovers':
        return item.description || item.prompt || ''
      case 'music_jingles':
        return item.description || item.prompt || ''
      case 'talking_avatars':
        return item.avatar_description || ''
      case 'watermarks':
        return item.watermark_text || ''
      case 'subtitles':
        return item.subtitle_text || ''
      case 'video_translations':
        return item.source_language || ''
      default:
        return item.description || ''
    }
  }

  if (!userId) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Previous {displayName}</h3>
          {hasProcessingItems() && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchRecover}
              disabled={isBatchRecovering}
              className="text-xs"
            >
              {isBatchRecovering ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Recovering...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Recover All Stuck Songs
                </>
              )}
            </Button>
          )}
          {items.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {items.length} items
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Bulk Add Button for Voice Creations */}
          {contentType === 'voices_creations' && (
            <Button 
              onClick={handleBulkAddToLibrary}
              disabled={isBulkAdding}
              size="sm"
              className="h-8 text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm hover:from-green-600 hover:to-emerald-700 disabled:bg-gray-400"
            >
              {isBulkAdding ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Add to Library
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => mutate()}
            title="Refresh previous generations"
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading previous generations...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <p className="text-sm text-destructive mb-2">Failed to load previous generations</p>
            <Button onClick={() => mutate()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <Grid3x3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <h4 className="text-sm font-medium mb-1">No previous generations</h4>
          <p className="text-xs text-muted-foreground">
            Start creating {displayName.toLowerCase()} to see them appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(items) ? items.map((item) => (
              <Card key={item.id} className={`group hover:shadow-lg transition-shadow relative ${(contentType === 'avatars_personas' || contentType === 'product_mockups' || contentType === 'charts_infographics' || contentType === 'voiceovers' || contentType === 'music_jingles' || contentType === 'music_videos' || contentType === 'talking_avatars') ? '!pt-0' : ''}`}>
                <div className="relative">
                  {renderMediaPreview(item)}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {displayName}
                    </Badge>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm line-clamp-1">{getItemTitle(item)}</CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">
                    {getItemDescription(item) || "No description"}
                  </CardDescription>
                  
                  {/* Status and Action UI for Music Jingles */}
                  {contentType === 'music_jingles' && (
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item)}
                        {getEstimatedTime(item)}
                      </div>
                      {getActionButtons(item)}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pt-0 overflow-hidden">
                  {/* Style Tags for Music Jingles */}
                  {contentType === 'music_jingles' && item.tags && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(() => {
                        const tags = item.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
                        const maxVisibleTags = 3
                        const visibleTags = tags.slice(0, maxVisibleTags)
                        const remainingCount = tags.length - maxVisibleTags
                        
                        return (
                          <>
                            {visibleTags.map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs max-w-[150px]">
                                <span className="block truncate">
                                  {tag}
                                </span>
                              </Badge>
                            ))}
                            {remainingCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                +{remainingCount} more
                              </Badge>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Eye icon and Download button for avatars, product mockups, and charts & infographics */}
                      {(contentType === 'avatars_personas' || contentType === 'product_mockups' || contentType === 'charts_infographics') && item.generated_images?.[0] ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedImage(item.generated_images[0])
                              setShowLightbox(true)
                            }}
                            title="View full size"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (contentType === 'avatars_personas') {
                                handleDownloadAvatar(item)
                              } else if (contentType === 'product_mockups') {
                                handleDownloadMockup(item)
                              } else if (contentType === 'charts_infographics') {
                                handleDownloadChart(item)
                              }
                            }}
                            title={`Download ${contentType === 'avatars_personas' ? 'avatar' : contentType === 'product_mockups' ? 'mockup' : 'chart'}`}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        getMediaIcon(item)
                      )}
                    </div>
                  </div>
                  
                  {/* Model Information for Music Jingles */}
                  {contentType === 'music_jingles' && item.model_name && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      Model: {item.model_name}
                    </div>
                  )}
                  
                  {/* Voiceover Play/Download Buttons - Only for voiceovers */}
                  {contentType === 'voiceovers' && (
                    <div className="flex items-center gap-2 mt-3">
                      {item.storage_path ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePlayVoiceover(item.id, item.storage_path)
                            }}
                          >
                            {playingVoiceId === item.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadVoiceover(item)
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Audio not available
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Music Jingles Play/Download Buttons - Only for music_jingles */}
                  {contentType === 'music_jingles' && (
                    <div className="flex items-center gap-2 mt-3">
                      {(item.audio_url || item.generated_audio_path) ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePlayVoiceover(item.id, item.audio_url || item.generated_audio_path)
                            }}
                          >
                            {playingVoiceId === item.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadVoiceover(item)
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Audio not available
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Talking Avatars Play/Download Buttons - Only for talking_avatars */}
                  {contentType === 'talking_avatars' && (
                    <div className="flex items-center gap-2 mt-3">
                      {(item.generated_video_url || item.storage_path) ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePlayVideo(item)
                            }}
                            title="Play video"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadVideo(item)
                            }}
                            title="Download video"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Video not available
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Video Play/Download Buttons - For video content types */}
                  {isVideoContentType(contentType) && contentType !== 'talking_avatars' && (
                    <div className="flex items-center gap-2 mt-3">
                      {(item.generated_video_url || item.video_url || item.media_url || item.url) ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVideo(item.generated_video_url || item.video_url || item.media_url || item.url)
                              setSelectedVideoItem(item)
                              setShowVideoModal(true)
                            }}
                            title="Play video"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadDiverseMotionVideo(item)
                            }}
                            title="Download video"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Video not available
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Voice Previews Section - Only for voice creations */}
                  {contentType === 'voices_creations' && item.content?.all_previews && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Voice Previews</p>
                      <div className="grid grid-cols-3 gap-2">
                        {item.content.all_previews.map((preview: any, index: number) => (
                          <div
                            key={preview.generated_voice_id}
                            className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePlayVoicePreview(preview.signed_url, preview.generated_voice_id)
                              }}
                            >
                              {playingVoiceId === preview.generated_voice_id ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <span className="text-xs text-muted-foreground">Voice {index + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-8">
                <p className="text-sm text-muted-foreground">No items to display</p>
              </div>
            )}
          </div>

          {/* View in Library Link */}
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Navigate to library with this content type filter
                window.location.href = `/library?content_type=${contentType}`
              }}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View all in Library
            </Button>
          </div>
        </>
      )}

      {/* Batch Recovery Progress Dialog */}
      <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>
            {isBatchRecovering ? 'Recovering Stuck Songs' : 'Recovery Complete'}
          </DialogTitle>
          
          {isBatchRecovering ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing songs...</span>
                  <span>{batchRecoveryProgress}%</span>
                </div>
                <Progress value={batchRecoveryProgress} className="w-full" />
              </div>
              <p className="text-sm text-muted-foreground">
                Checking Suno API and downloading completed audio files...
              </p>
            </div>
          ) : batchRecoveryResults ? (
            <div className="space-y-4">
              {batchRecoveryResults.success ? (
                <div className="space-y-2">
                  <div className="text-sm">
                    <p className="font-medium text-green-600">✅ Recovery Complete!</p>
                    <p>Successfully recovered: <strong>{batchRecoveryResults.successful}</strong> songs</p>
                    {batchRecoveryResults.failed > 0 && (
                      <p>Failed: <strong>{batchRecoveryResults.failed}</strong> songs</p>
                    )}
                    {batchRecoveryResults.stillProcessing > 0 && (
                      <p>Still processing: <strong>{batchRecoveryResults.stillProcessing}</strong> songs</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Completed in {Math.round(batchRecoveryResults.duration / 1000)}s
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm">
                  <p className="font-medium text-red-600">❌ Recovery Failed</p>
                  <p className="text-muted-foreground">{batchRecoveryResults.error}</p>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => setShowRecoveryDialog(false)}
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Avatar Lightbox Dialog */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 bg-background border-border">
          {/* Full-size image */}
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Avatar full size"
              className="w-full h-auto max-h-[85vh] object-contain bg-muted rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Video Player Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-6 bg-background border-border">
          <DialogTitle className="text-lg font-semibold mb-4">
            {selectedVideoItem?.title || 'Video Player'}
          </DialogTitle>
          {selectedVideo && (
            <div className="relative w-full bg-black rounded-lg overflow-hidden">
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="w-full max-h-[70vh]"
                onError={(e) => {
                  console.error('Video playback error:', e)
                  toast({
                    title: "Playback error",
                    description: "Failed to load video. Please try again.",
                    variant: "destructive"
                  })
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          {selectedVideoItem?.prompt && (
            <div className="mt-4 text-sm text-muted-foreground">
              <p className="font-medium mb-1">Prompt:</p>
              <p>{selectedVideoItem.prompt}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}