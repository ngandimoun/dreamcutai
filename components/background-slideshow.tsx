"use client"

import { useState, useEffect } from "react"
import { GradientBackground } from "@/components/gradient-background"
import InfiniteGallery from "@/components/infinite-gallery"
import { BackgroundVideo } from "@/components/background-video"

const TOTAL_BACKGROUNDS = 3

export function BackgroundSlideshow() {
  const [activeBackground, setActiveBackground] = useState(0)

  const sampleImages = [
    { src: "/1.webp", alt: "Image 1" },
    { src: "/2.webp", alt: "Image 2" },
    { src: "/3.webp", alt: "Image 3" },
    { src: "/4.webp", alt: "Image 4" },
    { src: "/5.webp", alt: "Image 5" },
    { src: "/6.webp", alt: "Image 6" },
    { src: "/7.webp", alt: "Image 7" },
    { src: "/8.webp", alt: "Image 8" },
    { src: "/9.png", alt: "Image 9" },
    { src: "/12.png", alt: "Image 12" },
    { src: "/13.png", alt: "Image 13" },
    { src: "/14.jpg", alt: "Image 14" },
    { src: "/15.png", alt: "Image 15" },
    { src: "/16.jpg", alt: "Image 16" },
    { src: "/17.png", alt: "Image 17" },
    { src: "/18.png", alt: "Image 18" },
    { src: "/colorful-lightbulb-with-paint-splatter-creative.jpg", alt: "Image colorful-lightbulb-with-paint-splatter-creative" },
    { src: "/desert-landscape-with-sand-dunes-golden-hour.jpg", alt: "Image desert-landscape-with-sand-dunes-golden-hour" },
    { src: "/stack-of-pancakes-with-syrup.jpg", alt: "Image stack-of-pancakes-with-syrup" },
    { src: "/surreal-door-with-orange-and-blue-sky.jpg", alt: "Image surreal-door-with-orange-and-blue-sky" },
    { src: "/silhouette-person-on-horse-at-sunset-orange-sky.jpg", alt: "Image silhouette-person-on-horse-at-sunset-orange-sky" },
  ]

  // Background durations in milliseconds
  const GRADIENT_DURATION = 30000 // 30 seconds for gradient animation
  const GALLERY_DURATION = 60000 // 30 seconds for gallery animation
  const VIDEO_DURATION = 20000 // 20 seconds for video (adjust based on actual video length)

  useEffect(() => {
    const durations = [GRADIENT_DURATION, GALLERY_DURATION, VIDEO_DURATION]
    const duration = durations[activeBackground] ?? GRADIENT_DURATION

    const timer = setTimeout(() => {
      setActiveBackground((prev) => (prev + 1) % TOTAL_BACKGROUNDS)
    }, duration)

    return () => clearTimeout(timer)
  }, [activeBackground])

  return (
    <div className="absolute inset-0 -z-10">
      {/* Background 0: Gradient */}
      <div
        className={`absolute inset-0 transition-opacity duration-[2000ms] ${
          activeBackground === 0 ? "opacity-100" : "opacity-0"
        }`}
        style={{ pointerEvents: activeBackground === 0 ? "auto" : "none" }}
      >
        <GradientBackground />
      </div>

      {/* Background 1: Infinite Gallery */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-[2000ms] ${
          activeBackground === 1 ? "opacity-100" : "opacity-0"
        }`}
        style={{ pointerEvents: activeBackground === 1 ? "auto" : "none" }}
      >
        <InfiniteGallery
          images={sampleImages}
          speed={1.2}
          zSpacing={3}
          visibleCount={12}
          falloff={{ near: 0.8, far: 14 }}
          fadeSettings={{
            fadeIn: { start: 0.05, end: 0.25 },
            fadeOut: { start: 0.4, end: 0.43 },
          }}
          blurSettings={{
            blurIn: { start: 0.0, end: 0.1 },
            blurOut: { start: 0.4, end: 0.43 },
            maxBlur: 8.0,
          }}
          className="h-full w-full rounded-lg overflow-hidden"
        />
      </div>

      {/* Background 2: Video */}
      <div
        className={`absolute inset-0 transition-opacity duration-[2000ms]  ${
          activeBackground === 2 ? "opacity-100" : "opacity-0"
        }`}
        style={{ pointerEvents: activeBackground === 2 ? "auto" : "none" }}
      >
        <BackgroundVideo
          src="/alt.mp4"
          className="h-full w-full"
          videoClassName="h-full w-full object-cover"
          fallback={<div className="flex h-full w-full items-center justify-center text-white">Video unavailable</div>}
        />
      </div>
    </div>
  )
}
