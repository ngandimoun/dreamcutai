"use client"

import { useEffect, useState } from "react"
import { BackgroundSlideshow } from "@/components/background-slideshow"
import { RainbowButton } from "@/components/ui/rainbow-button"
import { Instrument_Serif } from "next/font/google"
import { GoogleAuthPopup } from "@/components/auth/google-auth-popup"
import { useAuth } from "@/components/auth/auth-provider"

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
})

export function Hero() {
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handlePrimaryClick = () => {
    if (!isMounted) return
    if (user) {
      window.location.href = "/content"
      return
    }
    setIsAuthPopupOpen(true)
  }

  const buttonLabel = !isMounted ? "Loading..." : user ? "Access Application" : "Get Started"

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden py-8">
      <BackgroundSlideshow />
      <div className="absolute inset-0 -z-10 bg-black/20" />

      <div className="flex-1 flex items-center justify-center px-6">
        <section className="flex flex-col items-center gap-8">
          <h1
            className={`${instrumentSerif.className} text-white text-center text-balance font-normal tracking-tight text-7xl`}
          >
            imagination is limit
          </h1>

          <RainbowButton
            variant="outline"
            className="group"
            onClick={handlePrimaryClick}
            disabled={!isMounted}
            type="button"
          >
            <span className="font-medium">{buttonLabel}</span>
            <svg
              className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </RainbowButton>
        </section>
      </div>

      <footer className="flex flex-col items-center gap-4 px-6 pb-4">
        <div className="flex items-center gap-6">
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-full transition-all duration-300 hover:scale-110"
            aria-label="X (Twitter)"
          >
            <svg
              className="w-4 h-4 text-white/70 group-hover:text-white transition-colors"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-full transition-all duration-300 hover:scale-110"
            aria-label="LinkedIn"
          >
            <svg
              className="w-4 h-4 text-white/70 group-hover:text-white transition-colors"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </div>

        <p className="text-white/50 text-xs">Powered By DreamCut</p>
      </footer>

      <GoogleAuthPopup isOpen={isAuthPopupOpen} onClose={() => setIsAuthPopupOpen(false)} />
    </main>
  )
}
