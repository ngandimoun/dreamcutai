"use client"

import { Hero } from "@/components/hero"
import { SocialProof } from "@/components/social-proof"

export default function Home() {
  return (
    <div className="min-h-screen font-sans">
      {/* Conteneur du header avec masque de fondu */}
      <Hero />
    </div>
  )
}
