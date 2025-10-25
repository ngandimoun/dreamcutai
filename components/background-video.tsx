"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode, HTMLAttributes, VideoHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

interface VideoSource {
  src: string
  type?: string
}

interface BackgroundVideoProps extends HTMLAttributes<HTMLDivElement> {
  /** Primary video source. Provide `sources` for multiple formats */
  src: string
  /** Optional list of alternative sources (e.g., webm/mp4). */
  sources?: VideoSource[]
  /** Poster image displayed before playback begins. */
  poster?: string
  /** Extra className applied to the <video> element. */
  videoClassName?: string
  /** Optional overlay rendered above the video (e.g., gradients). */
  overlay?: ReactNode
  /** Fallback UI displayed when the video fails to load. */
  fallback?: ReactNode
  /** Additional props forwarded to the <video> element. */
  videoProps?: VideoHTMLAttributes<HTMLVideoElement>
  /** Whether the video should begin playing automatically. */
  autoPlay?: boolean
  /** Whether the video should loop. */
  loop?: boolean
  /** Whether the video should be muted. */
  muted?: boolean
  /** Whether `playsInline` should be enabled. */
  playsInline?: boolean
  /** Preload strategy for the video asset. */
  preload?: "auto" | "metadata" | "none"
}

export function BackgroundVideo({
  src,
  sources,
  poster,
  videoClassName,
  overlay,
  fallback,
  videoProps,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  preload = "auto",
  className,
  ...divProps
}: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    setHasError(false)

    video.autoplay = autoPlay
    video.loop = loop
    video.muted = muted
    video.playsInline = playsInline
    video.preload = preload

    if (!autoPlay) {
      return
    }

    const attemptPlay = () => {
      const playPromise = video.play()
      if (playPromise && playPromise.catch) {
        playPromise.catch(() => {
          /* Autoplay might be blocked; ignore to prevent console errors */
        })
      }
    }

    if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      attemptPlay()
    } else {
      video.addEventListener("loadeddata", attemptPlay, { once: true })
      return () => {
        video.removeEventListener("loadeddata", attemptPlay)
      }
    }
  }, [autoPlay, loop, muted, playsInline, preload, src])

  const resolvedSources: VideoSource[] = sources ?? [{ src, type: undefined }]

  return (
    <div
      {...divProps}
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      {hasError && fallback ? (
        <div className="absolute inset-0 flex h-full w-full items-center justify-center">
          {fallback}
        </div>
      ) : (
        <video
          key={src}
          ref={videoRef}
          className={cn("h-full w-full object-cover", videoClassName)}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          preload={preload}
          {...videoProps}
          onError={(event) => {
            setHasError(true)
            videoProps?.onError?.(event)
          }}
        >
          {resolvedSources.map((source) => (
            <source key={`${source.src}-${source.type ?? "auto"}`} src={source.src} type={source.type} />
          ))}
        </video>
      )}

      {overlay ? (
        <div className="pointer-events-none absolute inset-0">{overlay}</div>
      ) : null}
    </div>
  )
}
