"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X, Loader2, ChevronsUpDown, Scissors, Image as ImageIcon, CheckCircle, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SocialCutsFormProps {
  onSave: (project: { title: string; image: string; description: string }) => void
  onCancel: () => void
}

// Données de simulation pour les artifacts
const mockArtifacts = [
  { id: "1", title: "Quick Hook", image: "/placeholder.jpg", description: "Attention-grabbing opening" },
  { id: "2", title: "Viral Moment", image: "/placeholder.jpg", description: "Shareable content clip" },
  { id: "3", title: "Trending Sound", image: "/placeholder.jpg", description: "Popular audio integration" },
  { id: "4", title: "Call to Action", image: "/placeholder.jpg", description: "Engagement-driving segment" },
  { id: "5", title: "Behind Scenes", image: "/placeholder.jpg", description: "Authentic behind-the-scenes" },
  { id: "6", title: "User Reaction", image: "/placeholder.jpg", description: "Reaction and response content" },
  { id: "7", title: "Quick Tip", image: "/placeholder.jpg", description: "Fast educational content" },
  { id: "8", title: "Meme Format", image: "/placeholder.jpg", description: "Meme-style social content" }
]

export function SocialCutsForm({ onSave, onCancel }: SocialCutsFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedArtifact, setSelectedArtifact] = useState<string>("")
  const [artifactOpen, setArtifactOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Utiliser les données de simulation si la liste est vide
  const artifactsToShow = availableArtifacts.length > 0 ? availableArtifacts : mockArtifacts
  
  // Filtrer les artifacts basé sur le terme de recherche
  const filteredArtifacts = artifactsToShow.filter(artifact =>
    artifact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artifact.description.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Ref pour gérer le clic en dehors
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setArtifactOpen(false)
        setSearchTerm("") // Reset search when closing
      }
    }
    
    if (artifactOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [artifactOpen])

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
    if (title.trim() && imagePreview && description.trim() && selectedArtifact) {
      setIsLoading(true)
      
      // Simuler un délai de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      onSave({
        title: title.trim(),
        image: imagePreview,
        description: description.trim(),
        selectedArtifact
      })
      
      setTitle("")
      setDescription("")
      setImagePreview(null)
      setSelectedArtifact("")
      setIsLoading(false)
      
      toast({
        title: "Social Cut created successfully",
        description: `"${title.trim()}" has been added to your collection.`,
      })
    }
  }

  return (
    <div className="bg-background border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            New Social Cut
          </h3>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter social cut title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Upload Media
          </label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-muted-foreground/50 transition-colors">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleImageUpload}
              className="hidden"
              id="media-upload"
            />
            <label htmlFor="media-upload" className="cursor-pointer">
              {imagePreview ? (
                <div className="space-y-2">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-md mx-auto"
                  />
                  <p className="text-sm text-muted-foreground">Click to change media</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Click to upload media</p>
                </div>
              )}
            </label>
          </div>
        </div>

        <div>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your social cut concept..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          type="button"
          onClick={handleSave} 
          className="flex-1" 
          disabled={isLoading || !title.trim() || !imagePreview || !description.trim() || !selectedArtifact}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
        <Button 
          type="button"
          variant="outline" 
          onClick={onCancel} 
          className="flex-1"
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
