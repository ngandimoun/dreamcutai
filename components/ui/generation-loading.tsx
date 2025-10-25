"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface GenerationLoadingProps {
  model?: "Nano-banana" | "gpt-image-1" | "seedream-v4"
  onCancel?: () => void
}

const steps = [
  { label: "Analyzing your prompt...", duration: 2000, progress: 10 },
  { label: "Calling AI model...", duration: 3000, progress: 20 },
  { label: "Generating images...", duration: 40000, progress: 80 },
  { label: "Downloading results...", duration: 5000, progress: 90 },
  { label: "Saving to library...", duration: 3000, progress: 100 }
]

export function GenerationLoading({ model, onCancel }: GenerationLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    // Progress through steps
    let stepIndex = 0
    let accumulatedProgress = 0

    const progressInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex]
        const increment = (step.progress - accumulatedProgress) / (step.duration / 100)
        
        setProgress(prev => {
          const newProgress = Math.min(prev + increment, step.progress)
          if (newProgress >= step.progress && stepIndex < steps.length - 1) {
            accumulatedProgress = step.progress
            stepIndex++
            setCurrentStep(stepIndex)
          }
          return newProgress
        })
      }
    }, 100)

    // Elapsed time counter
    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(timeInterval)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mb-4 inline-block">
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              className="animate-pulse"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8">
                    <animate attributeName="stop-opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1">
                    <animate attributeName="stop-opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8">
                    <animate attributeName="stop-opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
                <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="50%" stopColor="white" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="transparent" />
                  <animateTransform
                    attributeName="gradientTransform"
                    type="translate"
                    values="-100 0;100 0;-100 0"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </linearGradient>
              </defs>
              
              {/* Wave paths */}
              <path
                d="M10 40 Q20 20, 30 40 T50 40 T70 40 T80 40"
                stroke="url(#waveGradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              >
                <animate
                  attributeName="d"
                  values="M10 40 Q20 20, 30 40 T50 40 T70 40 T80 40;M10 40 Q20 60, 30 40 T50 40 T70 40 T80 40;M10 40 Q20 20, 30 40 T50 40 T70 40 T80 40"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
              
              <path
                d="M10 50 Q20 30, 30 50 T50 50 T70 50 T80 50"
                stroke="url(#waveGradient)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity="0.7"
              >
                <animate
                  attributeName="d"
                  values="M10 50 Q20 30, 30 50 T50 50 T70 50 T80 50;M10 50 Q20 70, 30 50 T50 50 T70 50 T80 50;M10 50 Q20 30, 30 50 T50 50 T70 50 T80 50"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </path>
              
              <path
                d="M10 60 Q20 40, 30 60 T50 60 T70 60 T80 60"
                stroke="url(#waveGradient)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                opacity="0.5"
              >
                <animate
                  attributeName="d"
                  values="M10 60 Q20 40, 30 60 T50 60 T70 60 T80 60;M10 60 Q20 80, 30 60 T50 60 T70 60 T80 60;M10 60 Q20 40, 30 60 T50 60 T70 60 T80 60"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </path>
              
              {/* Shimmer overlay */}
              <rect
                x="0"
                y="0"
                width="80"
                height="80"
                fill="url(#shimmer)"
                opacity="0.3"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Generating...
          </h3>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Progress
            </span>
            <span className="text-sm font-medium">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-blue-400 to-purple-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-6">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-center gap-3 text-sm transition-all duration-300",
                index < currentStep && "opacity-50",
                index === currentStep && "opacity-100 scale-105",
                index > currentStep && "opacity-30"
              )}
            >
              {index < currentStep ? (
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              ) : index === currentStep ? (
                <div className="flex-shrink-0 w-5 h-5">
                  <div 
                    className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-muted" />
              )}
              <span className={cn(
                index === currentStep && "font-medium text-foreground",
                index !== currentStep && "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Time Estimate */}
        <div className="text-center space-y-2">
          <div className="text-xs text-muted-foreground">
            Elapsed: {formatTime(elapsedTime)}
          </div>
          <div className="text-xs text-muted-foreground">
            Estimated: 15-60 seconds
          </div>
        </div>

        {/* Helpful Tip */}
        <div className="mt-6 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            💡 Tip: Generation typically takes 20-40 seconds. Complex prompts may take longer.
          </p>
        </div>
      </div>
    </div>
  )
}


