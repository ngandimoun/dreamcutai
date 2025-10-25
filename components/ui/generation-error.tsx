"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Key, Wifi, Clock, Download, Copy, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface GenerationErrorProps {
  error: string
  model: "Nano-banana" | "gpt-image-1" | "seedream-v4"
  onRetry: () => void
  onClose: () => void
}

interface ErrorInfo {
  type: "api_key" | "openai_key" | "network" | "timeout" | "download" | "general"
  icon: React.ReactNode
  title: string
  message: string
  suggestion: string
  action?: string
}

function parseError(error: string, model: string): ErrorInfo {
  const errorLower = error.toLowerCase()
  
  // API Key errors
  if (errorLower.includes("fal") && errorLower.includes("key")) {
    return {
      type: "api_key",
      icon: <Key className="w-5 h-5" />,
      title: "API Key Missing",
      message: "Fal.ai API key is not configured.",
      suggestion: "Please contact support to set up your API key.",
      action: "Contact Support"
    }
  }
  
  // OpenAI API Key errors (for gpt-image-1)
  if (errorLower.includes("openai") || (model === "gpt-image-1" && errorLower.includes("key"))) {
    return {
      type: "openai_key",
      icon: <Key className="w-5 h-5" />,
      title: "OpenAI API Key Required",
      message: "This model requires an OpenAI API key.",
      suggestion: "Try using Nano-banana or seedream-v4 instead, or contact support to set up OpenAI integration.",
      action: "Try Different Model"
    }
  }
  
  // Network errors
  if (errorLower.includes("network") || errorLower.includes("connection") || errorLower.includes("fetch")) {
    return {
      type: "network",
      icon: <Wifi className="w-5 h-5" />,
      title: "Connection Failed",
      message: "Unable to connect to the generation service.",
      suggestion: "Check your internet connection and try again.",
      action: "Retry"
    }
  }
  
  // Timeout errors
  if (errorLower.includes("timeout") || errorLower.includes("took too long")) {
    return {
      type: "timeout",
      icon: <Clock className="w-5 h-5" />,
      title: "Generation Timeout",
      message: "The generation took too long to complete.",
      suggestion: "Try again with a simpler prompt or different model.",
      action: "Try Again"
    }
  }
  
  // Download/Storage errors
  if (errorLower.includes("download") || errorLower.includes("upload") || errorLower.includes("storage")) {
    return {
      type: "download",
      icon: <Download className="w-5 h-5" />,
      title: "Save Failed",
      message: "Generated images couldn't be saved.",
      suggestion: "The images were created but couldn't be saved to your library. Please try again.",
      action: "Retry"
    }
  }
  
  // General errors
  return {
    type: "general",
    icon: <AlertCircle className="w-5 h-5" />,
    title: "Generation Failed",
    message: error,
    suggestion: "Something went wrong during generation. Please try again.",
    action: "Try Again"
  }
}

export function GenerationError({ error, model, onRetry, onClose }: GenerationErrorProps) {
  const [copied, setCopied] = useState(false)
  const errorInfo = parseError(error, model)

  const handleCopyError = async () => {
    try {
      await navigator.clipboard.writeText(error)
      setCopied(true)
      toast.success("Error details copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Failed to copy error details")
    }
  }

  const handleRetry = () => {
    onRetry()
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
            errorInfo.type === "api_key" && "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400",
            errorInfo.type === "openai_key" && "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
            errorInfo.type === "network" && "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
            errorInfo.type === "timeout" && "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
            errorInfo.type === "download" && "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
            errorInfo.type === "general" && "bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400"
          )}>
            {errorInfo.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {errorInfo.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              Model: {model}
            </p>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">
            {errorInfo.message}
          </p>
          <p className="text-sm text-muted-foreground">
            {errorInfo.suggestion}
          </p>
        </div>

        {/* Error Details (Collapsible) */}
        <details className="mb-4">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            Technical Details
          </summary>
          <div className="mt-2 p-3 bg-muted/50 rounded text-xs font-mono text-muted-foreground break-all">
            {error}
          </div>
        </details>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleRetry}
            className="flex-1"
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {errorInfo.action || "Retry"}
          </Button>
          
          <Button
            onClick={handleCopyError}
            variant="outline"
            size="icon"
            className="flex-shrink-0"
          >
            <Copy className={cn("w-4 h-4", copied && "text-green-600")} />
          </Button>
          
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
          >
            ×
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            💡 If this error persists, try a different model or contact support with the error details.
          </p>
        </div>
      </div>
    </div>
  )
}

