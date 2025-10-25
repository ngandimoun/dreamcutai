"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  X, 
  Sparkles, 
  Cpu,
  ChevronRight,
  Video,
  Clock,
  Monitor,
  Wand2,
  ImageUpIcon,
  ImageDown,
  ChevronDown,
  Plus
} from "lucide-react"

interface VideoGeneratorInterfaceProps {
  onClose: () => void
  projectTitle: string
}

// Aspect ratio visual components
const AspectRatioIcon = ({ ratio }: { ratio: string }) => {
  const getIconStyle = () => {
    switch (ratio) {
      case "1:1":
        return "w-3 h-3 border border-muted-foreground/50"
      case "16:9":
        return "w-4 h-2.5 border border-muted-foreground/50"
      case "4:3":
        return "w-3.5 h-2.5 border border-muted-foreground/50"
      case "9:16":
        return "w-2.5 h-4 border border-muted-foreground/50"
      default:
        return "w-3 h-3 border border-muted-foreground/50"
    }
  }

  return <div className={getIconStyle()} />
}

export function VideoGeneratorInterface({ onClose, projectTitle }: VideoGeneratorInterfaceProps) {
  const [prompt, setPrompt] = useState("")
  const [promptType, setPromptType] = useState<"text" | "visual">("text")
  const [duration, setDuration] = useState("Short (5-6s)")
  const [aspectRatio, setAspectRatio] = useState("16:9")

  return (
    <div className="bg-background border border-border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">
          Generate video
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Model Selection */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-foreground">Model</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-foreground">Auto</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Start and End Images */}
      <div className="flex justify-center gap-2">
        {/* Start Image */}
        <div className="bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors h-24 w-36">
          <ImageDown className="h-5 w-5 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground">Start image</span>
        </div>
        
        {/* End Image */}
        <div className="bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors h-24 w-36">
          <ImageUpIcon className="h-5 w-5 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground">End image</span>
        </div>
      </div>

      {/* Prompt Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">PROMPT</span>
          <div className="flex gap-1">
            <Button
              variant={promptType === "text" ? "default" : "outline"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setPromptType("text")}
            >
              Text
            </Button>
            <Button
              variant={promptType === "visual" ? "default" : "outline"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setPromptType("visual")}
            >
              Visual
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your video"
            className="min-h-[100px] pr-12 text-sm resize-none bg-muted/50 border-muted-foreground/25"
          />
          <div className="absolute bottom-2 right-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              disabled={!prompt.trim()}
            >
              <Wand2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Duration and Format */}
      <div className="grid grid-cols-2 gap-3">
        {/* Duration */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-foreground" />
                <span className="text-xs text-foreground">{duration}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 text-xs text-foreground space-y-1">
            <DropdownMenuItem 
              onClick={() => setDuration("Short (5-6s)")}
              className={duration === "Short (5-6s)" ? "bg-muted text-xs text-foreground" : ""}
            >
              Short (5-6s)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setDuration("Long (8-10s)")}
              className={duration === "Long (8-10s)" ? "bg-muted text-xs text-foreground" : ""}
            >
              Long (8-10s)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Format */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-foreground" />
                <span className="text-xs text-foreground">{aspectRatio}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 text-xs text-foreground space-y-1">
            <DropdownMenuItem 
              onClick={() => setAspectRatio("1:1")}
              className={`flex items-center gap-2 py-2 ${aspectRatio === "1:1" ? "bg-muted text-xs text-foreground" : ""}`}
            >
              <div className="flex items-center justify-center w-4 h-4">
                <AspectRatioIcon ratio="1:1" />
              </div>
              1:1 Square
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setAspectRatio("16:9")}
              className={`flex items-center gap-2 py-2 ${aspectRatio === "16:9" ? "bg-muted text-xs text-foreground" : ""}`}
            >
              <div className="flex items-center justify-center w-4 h-4">
                <AspectRatioIcon ratio="16:9" />
              </div>
              16:9 Widescreen
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setAspectRatio("4:3")}
              className={`flex items-center gap-2 py-2 ${aspectRatio === "4:3" ? "bg-muted text-xs text-foreground" : ""}`}
            >
              <div className="flex items-center justify-center w-4 h-4">
                <AspectRatioIcon ratio="4:3" />
              </div>
              4:3 Classic
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setAspectRatio("9:16")}
              className={`flex items-center gap-2 py-2 ${aspectRatio === "9:16" ? "bg-muted text-xs text-foreground" : ""}`}
            >
              <div className="flex items-center justify-center w-4 h-4">
                <AspectRatioIcon ratio="9:16" />
              </div>
              9:16 Social story
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>


      {/* Generate Button */}
      <Button 
        className="w-full bg-muted text-muted-foreground hover:bg-muted/80 h-10 text-sm font-medium" 
        disabled={!prompt.trim()}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Generate
      </Button>
    </div>
  )
}
