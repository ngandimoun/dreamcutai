"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  Save, 
  Download, 
  Upload, 
  Copy, 
  Edit, 
  Trash2, 
  Star,
  Share2,
  Settings,
  FileText,
  Calendar,
  User,
  Eye,
  EyeOff
} from "lucide-react"

interface Preset {
  id: string
  name: string
  description: string
  category: string
  settings: any
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  usageCount: number
  isStarred?: boolean
}

interface PresetManagerProps {
  isOpen: boolean
  onClose: () => void
  onLoadPreset: (preset: Preset) => void
  currentSettings: any
  currentCategory: string
}

export function PresetManager({
  isOpen,
  onClose,
  onLoadPreset,
  currentSettings,
  currentCategory
}: PresetManagerProps) {
  const [presets, setPresets] = useState<Preset[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [newPresetName, setNewPresetName] = useState("")
  const [newPresetDescription, setNewPresetDescription] = useState("")
  const [newPresetPublic, setNewPresetPublic] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Mock presets data - in real implementation, this would come from API
  const mockPresets: Preset[] = [
    {
      id: '1',
      name: 'Cinematic Logo Reveal',
      description: 'Epic logo animation with dramatic lighting and sound',
      category: 'Logo Animation',
      settings: {
        visualStyle: 'Cinematic',
        emotionalTone: 'Epic',
        cameraEnergy: 70,
        soundMode: 'Hybrid',
        revealType: 'Emerge'
      },
      isPublic: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      usageCount: 45,
      isStarred: true
    },
    {
      id: '2',
      name: 'Data Visualization Flow',
      description: 'Smooth animated charts with professional styling',
      category: 'Data Visualizations',
      settings: {
        visualStyle: 'Stylized CG',
        emotionalTone: 'Calm',
        cameraEnergy: 40,
        soundMode: 'SFX only',
        revealType: 'Assemble'
      },
      isPublic: false,
      createdAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-14'),
      usageCount: 23
    },
    {
      id: '3',
      name: 'UI Button Interactions',
      description: 'Micro-interactions for button states and transitions',
      category: 'UI/UX Element',
      settings: {
        visualStyle: 'Stylized CG',
        emotionalTone: 'Calm',
        cameraEnergy: 45,
        soundMode: 'SFX only',
        environment: 'Studio white'
      },
      isPublic: true,
      createdAt: new Date('2024-01-13'),
      updatedAt: new Date('2024-01-13'),
      usageCount: 67
    }
  ]

  // Load presets
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      // Simulate API call
      setTimeout(() => {
        setPresets(mockPresets)
        setIsLoading(false)
      }, 500)
    }
  }, [isOpen])

  // Handle save preset
  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return

    const newPreset: Preset = {
      id: Date.now().toString(),
      name: newPresetName,
      description: newPresetDescription,
      category: currentCategory,
      settings: currentSettings,
      isPublic: newPresetPublic,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    }

    setPresets([newPreset, ...presets])
    setShowSaveDialog(false)
    setNewPresetName("")
    setNewPresetDescription("")
    setNewPresetPublic(false)

    // TODO: Save to API
    console.log('Saving preset:', newPreset)
  }

  // Handle load preset
  const handleLoadPreset = (preset: Preset) => {
    onLoadPreset(preset)
    setShowLoadDialog(false)
    setSelectedPreset(null)
  }

  // Handle delete preset
  const handleDeletePreset = (presetId: string) => {
    setPresets(presets.filter(p => p.id !== presetId))
    // TODO: Delete from API
  }

  // Handle export preset
  const handleExportPreset = (preset: Preset) => {
    const dataStr = JSON.stringify(preset, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${preset.name.replace(/\s+/g, '-').toLowerCase()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Handle import preset
  const handleImportPreset = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedPreset = JSON.parse(e.target?.result as string)
        setPresets([importedPreset, ...presets])
        // TODO: Save to API
      } catch (error) {
        console.error('Error importing preset:', error)
      }
    }
    reader.readAsText(file)
  }

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Data Visualizations': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'Infographic': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      'Logo Animation': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      'UI/UX Element': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      'Cinematic Videos': 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300'
    }
    return colors[category] || 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Preset Manager
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col space-y-4">
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowSaveDialog(true)}>
                <Save className="h-4 w-4 mr-2" />
                Save Current Settings
              </Button>
              <Button variant="outline" onClick={() => setShowLoadDialog(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Load Preset
              </Button>
              <Button variant="outline" onClick={() => document.getElementById('import-preset')?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <input
                id="import-preset"
                type="file"
                accept=".json"
                onChange={handleImportPreset}
                className="hidden"
              />
            </div>

            {/* Presets List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : presets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Settings className="h-12 w-12 mb-4" />
                  <p className="text-lg font-medium">No presets found</p>
                  <p className="text-sm">Save your first preset to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{preset.name}</h3>
                            {preset.isStarred && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                            <Badge className={getCategoryColor(preset.category)}>
                              {preset.category}
                            </Badge>
                            {preset.isPublic && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <Share2 className="h-3 w-3 mr-1" />
                                Public
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {preset.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(preset.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {preset.usageCount} uses
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLoadPreset(preset)}
                            title="Load preset"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportPreset(preset)}
                            title="Export preset"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const dataStr = JSON.stringify(preset.settings, null, 2)
                              navigator.clipboard.writeText(dataStr)
                            }}
                            title="Copy settings"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePreset(preset.id)}
                            title="Delete preset"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Preset</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Preset Name</label>
              <Input
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Enter preset name..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={newPresetDescription}
                onChange={(e) => setNewPresetDescription(e.target.value)}
                placeholder="Describe what this preset does..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="public-preset"
                checked={newPresetPublic}
                onChange={(e) => setNewPresetPublic(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="public-preset" className="text-sm">
                Make this preset public (shareable with others)
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={!newPresetName.trim()}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Preset Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Preset</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleLoadPreset(preset)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{preset.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {preset.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getCategoryColor(preset.category)}>
                        {preset.category}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {preset.usageCount} uses
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Load
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

