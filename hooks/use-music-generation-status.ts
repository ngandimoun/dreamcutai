import { useEffect, useRef, useState } from 'react'
import { mutate } from 'swr'

interface UseGenerationStatusOptions {
  taskId: string | null
  enabled: boolean
  onComplete?: () => void
  onError?: (error: string) => void
}

export function useMusicGenerationStatus({
  taskId,
  enabled,
  onComplete,
  onError
}: UseGenerationStatusOptions) {
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing')
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollCountRef = useRef(0)
  
  useEffect(() => {
    if (!enabled || !taskId) return
    
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/suno/poll/${taskId}`)
        const data = await response.json()
        
        setStatus(data.status)
        pollCountRef.current++
        
        // Update progress (simulate based on poll count)
        setProgress(Math.min(pollCountRef.current * 10, 90))
        
        if (data.status === 'completed') {
          setProgress(100)
          intervalRef.current && clearInterval(intervalRef.current)
          mutate('/api/music-jingles') // Refresh library
          onComplete?.()
        } else if (data.status === 'failed') {
          intervalRef.current && clearInterval(intervalRef.current)
          onError?.(data.message || 'Generation failed')
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }
    
    // Poll immediately, then every 30 seconds
    pollStatus()
    intervalRef.current = setInterval(pollStatus, 30000)
    
    // Cleanup after 10 minutes (20 polls)
    const maxPollTimeout = setTimeout(() => {
      intervalRef.current && clearInterval(intervalRef.current)
    }, 600000)
    
    return () => {
      intervalRef.current && clearInterval(intervalRef.current)
      clearTimeout(maxPollTimeout)
    }
  }, [taskId, enabled, onComplete, onError])
  
  return { status, progress }
}




