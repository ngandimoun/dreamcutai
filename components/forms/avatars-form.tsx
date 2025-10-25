"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, X, Loader2, Users, Image as ImageIcon, Loader } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface AvatarsFormProps {
  onSave: (project: { title: string; image: string; description: string; isPublic: boolean }) => void
  onCancel: () => void
}

export function AvatarsForm({ onSave, onCancel }: AvatarsFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPublic, setIsPublic] = useState<boolean>(true) // Default to Public
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
      setIsLoading(true)
      
      // Simuler un délai de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      onSave({
        title: title.trim(),
        image: imagePreview || "",
        description: description.trim(),
        isPublic
      })
      
      setTitle("")
      setDescription("")
      setImagePreview(null)
      setIsPublic(true) // Reset to default Public
      setIsLoading(false)
      
      toast({
        title: "Avatar created successfully",
        description: `"${title.trim()}" has been added to your collection.`,
      })
    }
  }

  return (
    <div className="bg-background border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              New Avatar & Persona
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[9px] font-medium px-1 rounded-full transition-colors",
              isPublic 
                ? "bg-green-100 text-green-700 border border-green-200" 
                : "bg-gray-100 text-gray-700 border border-gray-200"
            )}>
              {isPublic ? "Public" : "Private"}
            </span>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              className="scale-75"
            />
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}
        className="h-6 w-6"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Character Name
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter character name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Upload Reference Image <span className="text-muted-foreground text-xs">(optional)</span>
          </label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-muted-foreground/50 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
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

        {/* Artifact Selection - TEMPORARILY DISABLED */}
        {/* 
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Artifact Selection
          </label>
          {artifactsLoading && (
            <p className="text-xs text-muted-foreground mb-2">
              Loading artifacts from database...
            </p>
          )}
          {!artifactsLoading && artifactsToShow.length === 0 && (
            <p className="text-xs text-muted-foreground mb-2">
              No artifacts found. Create artifacts in the "Artifacts" section to use them here.
            </p>
          )}

          {/* Bouton pour ouvrir la sélection */}
          {/* 
          <Button
            variant="outline"
            onClick={() => setArtifactDialogOpen(true)}
            className="w-full justify-between h-12 text-left"
            disabled={artifactsLoading || artifactsToShow.length === 0}
          >
            <div className="flex items-center gap-3">
              {artifactsLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">Loading artifacts...</span>
                </>
              ) : selectedArtifactData ? (
                <>
                  <img 
                    src={selectedArtifactData.image} 
                    alt={selectedArtifactData.title}
                    className="w-5 h-5 object-cover rounded"
                  />
                  <span className="font-medium">{selectedArtifactData.title}</span>
                </>
              ) : artifactsToShow.length === 0 ? (
                <span className="text-muted-foreground">No artifacts available</span>
              ) : (
                <span className="text-muted-foreground">Select artifact...</span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
          */}

          {/* Dialog pour la sélection d'artifacts */}
          {/* 
          <Dialog open={artifactDialogOpen} onOpenChange={setArtifactDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Artifact Selection</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-4">
                {artifactsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-muted-foreground">Loading artifacts...</span>
                  </div>
                ) : artifactsToShow.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">No artifacts available</p>
                    <p className="text-xs text-muted-foreground">
                      Create artifacts in the "Artifacts" section to use them here.
                    </p>
                  </div>
                ) : (
                  artifactsToShow.map((artifact) => (
                  <div
                    key={artifact.id}
                    className={cn(
                      "relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.01] group",
                      selectedArtifact === artifact.id
                        ? "border-primary bg-gradient-to-r from-primary/10 to-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50 bg-card"
                    )}
                    onClick={() => {
                      setSelectedArtifact(artifact.id)
                      setArtifactDialogOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className={cn(
                          "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center transition-all duration-300",
                          selectedArtifact === artifact.id
                            ? "from-primary/30 to-primary/20 shadow-md"
                            : "from-primary/20 to-primary/10"
                        )}>
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                            selectedArtifact === artifact.id
                              ? "bg-primary/40 shadow-sm"
                              : "bg-primary/30"
                          )}>
                            <img 
                              src={artifact.image} 
                              alt={artifact.title}
                              className="w-6 h-6 object-cover rounded"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "font-semibold text-sm mb-1 transition-colors duration-300",
                          selectedArtifact === artifact.id ? "text-primary" : "text-foreground"
                        )}>
                          {artifact.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {artifact.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {selectedArtifact === artifact.id && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
          */}

          {/* Selected Artifact Display */}
          {/* 
          {selectedArtifactData && (
            <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-xl shadow-sm animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center shadow-sm">
                  <img 
                    src={selectedArtifactData.image} 
                    alt={selectedArtifactData.title}
                    className="w-6 h-6 object-cover rounded"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-primary text-sm">
                    {selectedArtifactData.title} Selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ready to create your avatar with this style
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              </div>
            </div>
          )}
          */}
        {/* </div> */}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Character Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your character's background, traits, and story..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          type="button"
          onClick={handleSave} 
          className="flex-1" 
          disabled={isLoading || !title.trim() || !description.trim()}
        >
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Avatar"
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