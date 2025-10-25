"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { FileArchive, Download, Loader2 } from "lucide-react"

interface LibraryExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LibraryExportDialog({ open, onOpenChange }: LibraryExportDialogProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['visuals', 'audios', 'motions', 'edit'])
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [maxItems, setMaxItems] = useState(500)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const categories = [
    { id: 'visuals', label: 'Visuals', description: 'Comics, illustrations, avatars, product mockups' },
    { id: 'audios', label: 'Audios', description: 'Voice creations, music, sound effects' },
    { id: 'motions', label: 'Motions', description: 'Explainers, talking avatars' },
    { id: 'edit', label: 'Edit Utils', description: 'Subtitles, watermarks, translations' }
  ]

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleExport = async () => {
    if (selectedCategories.length === 0) {
      alert('Please select at least one category')
      return
    }

    setIsExporting(true)
    setProgress(10)

    try {
      const response = await fetch('/api/library/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: selectedCategories,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          includeMetadata,
          maxItems
        })
      })

      setProgress(50)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      setProgress(80)

      // Download the ZIP file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Get filename from response headers if available
      const contentDisposition = response.headers.get('content-disposition')
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/)
      const filename = filenameMatch ? filenameMatch[1] : `dreamcut_export_${Date.now()}.zip`
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setProgress(100)

      // Close dialog after successful export
      setTimeout(() => {
        onOpenChange(false)
        setIsExporting(false)
        setProgress(0)
      }, 500)

    } catch (error) {
      console.error('Error exporting library:', error)
      alert(`Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsExporting(false)
      setProgress(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Library</DialogTitle>
          <DialogDescription>
            Export your content as a ZIP archive with organized folders and metadata.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Categories</Label>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                    disabled={isExporting}
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor={category.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {category.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Range (Optional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  disabled={isExporting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dateTo" className="text-xs text-muted-foreground">To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  disabled={isExporting}
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="metadata"
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                  disabled={isExporting}
                />
                <Label
                  htmlFor="metadata"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Include metadata manifest (JSON)
                </Label>
              </div>
              <div className="space-y-1">
                <Label htmlFor="maxItems" className="text-xs text-muted-foreground">
                  Maximum items to export (default: 500)
                </Label>
                <Input
                  id="maxItems"
                  type="number"
                  min="1"
                  max="1000"
                  value={maxItems}
                  onChange={(e) => setMaxItems(parseInt(e.target.value) || 500)}
                  disabled={isExporting}
                  className="w-32"
                />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Exporting...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedCategories.length === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export to ZIP
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



