"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2, LogOutIcon, Loader } from "lucide-react"
import { toast } from "sonner"

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        redirect: 'manual' // Empêche la redirection automatique
      })

      if (response.status === 302) {
        // Redirection détectée, suivre immédiatement
        toast.success('Déconnexion réussie')
        window.location.href = '/'
      } else if (response.ok) {
        toast.success('Déconnexion réussie')
        window.location.href = '/'
      } else {
        toast.error('Erreur lors de la déconnexion')
      }
    } catch (error) {
      toast.error('Une erreur inattendue s\'est produite')
      console.error('Erreur de déconnexion:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={isLoading}
      className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
      type="button"
    >
      {isLoading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
    </Button>
  )
}
