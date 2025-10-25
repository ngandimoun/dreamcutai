"use client"

import { useAuth } from '@/components/auth/auth-provider'
import { useState, useEffect } from 'react'

export function useAuthState() {
  const { user, session, loading } = useAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(!!user && !!session)
  }, [user, session])

  return {
    user,
    session,
    loading,
    isAuthenticated,
  }
}

export async function signInWithGoogle() {
  try {
    const response = await fetch('/auth/signin?provider=google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'manual' // Empêche la redirection automatique
    })

    if (response.status === 307 || response.status === 302) {
      // Redirection détectée, suivre l'URL de redirection
      const redirectUrl = response.headers.get('location')
      if (redirectUrl) {
        window.location.href = redirectUrl
        return { success: true }
      } else {
        throw new Error('URL de redirection manquante')
      }
    } else if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to sign in')
    }

    return { success: true }
  } catch (error) {
    console.error('Sign in error:', error)
    return { success: false, error: error.message }
  }
}

export async function signOut() {
  try {
    const response = await fetch('/auth/signout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to sign out')
    }

    return { success: true }
  } catch (error) {
    console.error('Sign out error:', error)
    return { success: false, error: error.message }
  }
}
