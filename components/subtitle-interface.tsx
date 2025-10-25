"use client"

import { useState, useEffect, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Video, 
  FileText, 
  Download, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Trash2,
  Edit,
  X,
  Calendar,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"

interface SubtitleProject {
  id: string
  title: string
  description: string
  status: 'draft' | 'processing' | 'completed' | 'failed'
  video_file_input: string
  transcript_file_input?: string
  emoji_enrichment: boolean
  keyword_emphasis: boolean
  created_at: string
  updated_at: string
  content?: any
  metadata?: any
}

interface SubtitleInterfaceProps {
  onClose: () => void
  projectTitle: string
  emptyState?: ReactNode
}

export function SubtitleInterface({ onClose, projectTitle, emptyState }: SubtitleInterfaceProps) {
  const [subtitleProjects, setSubtitleProjects] = useState<SubtitleProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchSubtitleProjects()
  }, [])

  const fetchSubtitleProjects = async () => {
    try {
      const response = await fetch('/api/subtitles')
      if (response.ok) {
        const data = await response.json()
        setSubtitleProjects(data.subtitles || [])
      }
    } catch (error) {
      console.error('Error fetching subtitle projects:', error)
      toast({
        title: "Error",
        description: "Failed to fetch subtitle projects",
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

  if (isLoading) {
    return (
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-700 bg-clip-text text-transparent">
            Subtitle Projects
          </h2>
          <p className="text-muted-foreground">
            Manage your generated subtitle videos
          </p>
        </div>
      </div>

      {/* Projects Grid */}
      {subtitleProjects.length === 0 ? (
        emptyState ?? (
          <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/20 dark:via-amber-950/20 dark:to-orange-950/20 rounded-lg p-8">
            <div className="text-center max-w-md space-y-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-600 blur-2xl opacity-30 animate-pulse"></div>
                <FileText className="relative h-24 w-24 text-transparent bg-gradient-to-r from-yellow-500 via-amber-600 to-orange-700 bg-clip-text mx-auto" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-700 bg-clip-text text-transparent">
                No Subtitle Projects Yet
              </h3>
              <p className="text-muted-foreground">
                Generate your first subtitle project to see it here.
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subtitleProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{project.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-1">
                      {project.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {getStatusIcon(project.status)}
                    {getStatusBadge(project.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Video Player */}
                {project.status === 'completed' && project.content?.video_url && (
                  <div className="relative">
                    <video
                      src={project.content.video_url}
                      controls
                      className="w-full h-48 object-cover rounded-lg"
                      poster="/placeholder.jpg"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {/* Project Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(project.created_at)}</span>
                  </div>
                  
                  {project.emoji_enrichment && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-lg">🎯</span>
                      <span>Emoji enrichment enabled</span>
                    </div>
                  )}
                  
                  {project.keyword_emphasis && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-lg">💡</span>
                      <span>Keyword emphasis enabled</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {project.status === 'completed' && project.content?.video_url && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(project.content.video_url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = project.content.video_url
                          link.download = `${project.title}-subtitles.mp4`
                          link.click()
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </>
                  )}
                  
                  {project.status === 'failed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        // TODO: Implement retry functionality
                        toast({
                          title: "Retry",
                          description: "Retry functionality coming soon",
                        })
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
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
