"use client"

import { useEffect } from 'react'

export function GoogleScript() {
  useEffect(() => {
    // Charger le script Google Identity
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    return () => {
      // Nettoyer le script lors du démontage
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
    }
  }, [])

  return null
}
