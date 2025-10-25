"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Video, Music } from "lucide-react"
import { SoundToVideoForm } from "@/components/forms/sound-to-video-form"

interface SoundToVideoInterfaceProps {
  onClose: () => void
  projectTitle: string
}

export function SoundToVideoInterface({ onClose, projectTitle }: SoundToVideoInterfaceProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSubmit = async (formData: any) => {
    setIsGenerating(true)
    try {
      // Create FormData for file uploads
      const submitData = new FormData()
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'video_file' || key === 'audio_file') {
          if (formData[key]) {
            submitData.append(key, formData[key])
          }
        } else {
          submitData.append(key, formData[key])
        }
      })

      const response = await fetch('/api/sound-to-video', {
        method: 'POST',
        body: submitData
      })

      if (!response.ok) {
        throw new Error('Failed to create sound-to-video project')
      }

      const result = await response.json()
      console.log('Sound-to-video project created:', result)
      
      // Close the interface after successful creation
      onClose()
    } catch (error) {
      console.error('Error creating sound-to-video project:', error)
      // Handle error (you might want to show a toast or error message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-background border border-border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-blue-500" />
          <Music className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-bold text-foreground">
            {projectTitle}
          </h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form */}
      <SoundToVideoForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        isLoading={isGenerating}
      />
    </div>
  )
}
