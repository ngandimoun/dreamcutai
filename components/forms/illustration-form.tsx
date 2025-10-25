"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { X, Palette, Image as ImageIcon, Loader2, Loader } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface IllustrationFormProps {
  onSave: (project: { title: string; image: string; description: string; isPublic: boolean }) => Promise<void>
  onCancel: () => void
}

export function IllustrationForm({ onSave, onCancel }: IllustrationFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(true) // Default to Public
  const [isCreating, setIsCreating] = useState(false) // Loading state for creation
  const { toast } = useToast()


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (title.trim() && description.trim()) {
      setIsCreating(true) // Start loading state
      
      const illustrationData = {
        title: title.trim(),
        image: imagePreview || "/placeholder.jpg", // Use placeholder if no image
        description: description.trim(),
        isPublic // Ajout de isPublic
      }
      
      try {
        // Call onSave which now handles database persistence
        await onSave(illustrationData)
        
        // Clear form after successful save
        setTitle("")
        setDescription("")
        setImagePreview(null)
        setIsPublic(true) // Reset to Public
        
        // Show success toast
        toast({
          title: "Illustration created successfully",
          description: `"${illustrationData.title}" has been added to your collection.`,
        })
      } catch (error) {
        console.error('Failed to save illustration:', error)
        toast({
          title: "Error",
          description: "Failed to create illustration. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsCreating(false) // End loading state
      }
    }
  }

  return (
    <div className="bg-background border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              New Illustration
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="public-toggle" className="text-xs font-medium text-foreground">
              {isPublic ? 'Public' : 'Private'}
            </label>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              className="h-4 w-7 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#57e6f9] data-[state=checked]:via-blue-500 data-[state=checked]:to-purple-700"
            />
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="illustration-title" className="block text-sm font-medium text-foreground mb-1">
            Title
          </label>
          <Input
            id="illustration-title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter illustration title"
          />
        </div>

        <div>
          <div className="block text-sm font-medium text-foreground mb-1">
            Upload Reference Image <span className="text-muted-foreground text-xs">(optional)</span>
          </div>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-muted-foreground/50 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="illustration-image-upload"
              name="image"
            />
            <label htmlFor="illustration-image-upload" className="cursor-pointer block">
              {imagePreview ? (
                <div className="space-y-2">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-md mx-auto"
                  />
                  <p className="text-sm text-muted-foreground">Click to change image</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Click to upload reference image</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Artifact(s)
          </label>
          {availableArtifacts.length === 0 && (
            <p className="text-xs text-muted-foreground mb-2">
              Using demo artifacts for testing. Create real artifacts in the "Artifacts" section.
            </p>
          )}
          
          
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => {
                console.log('Button clicked, current state:', artifactOpen)
                setArtifactOpen(!artifactOpen)
              }}
            >
              {selectedArtifact
                ? artifactsToShow.find((artifact) => artifact.id === selectedArtifact)?.title
                : "Select artifact..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            
            {artifactOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto scrollbar-hover">
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Search artifact..."
                    className="w-full px-3 py-2 text-sm border border-border rounded-md mb-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="space-y-1">
                    {filteredArtifacts.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                        No artifacts found matching "{searchTerm}"
                      </div>
                    ) : (
                      filteredArtifacts.map((artifact) => (
                      <div
                        key={artifact.id}
                        className="flex items-center px-3 py-2 text-sm hover:bg-accent rounded-md cursor-pointer"
                        onClick={() => {
                          setSelectedArtifact(artifact.id)
                          setArtifactOpen(false)
                          setSearchTerm("") // Reset search when selecting
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedArtifact === artifact.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {artifact.title}
                      </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div> */}

        <div>
          <label htmlFor="illustration-description" className="block text-sm font-medium text-foreground mb-1">
            Description
          </label>
          <Textarea
            id="illustration-description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your illustration concept..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          type="button"
          onClick={handleSave} 
          className="flex-1" 
          disabled={!title.trim() || !description.trim() || isCreating}
        >
          {isCreating ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Illustration"
          )}
        </Button>
        <Button 
          type="button"
          variant="outline" 
          onClick={onCancel} 
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
