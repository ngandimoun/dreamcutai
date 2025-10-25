"use client"

import { useState, useEffect } from "react"
import { User, LogOut, Settings, Mail, X, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface UserMenuProps {
  className?: string
  variant?: 'header' | 'sidebar'
  isCollapsed?: boolean
}

export function UserMenu({ className, variant = 'header', isCollapsed = false }: UserMenuProps) {
  const { user, loading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Ne pas rendre le composant avant le montage ou pendant le chargement
  if (!isMounted || loading) {
    return null
  }

  if (!user) return null

  const getUserDisplayName = () => {
    return user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.email?.split('@')[0] || 
           'User'
  }

  const getUserEmail = () => {
    return user.email || 'Email not available'
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      // Utiliser directement le client Supabase pour une déconnexion plus fiable
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Supabase sign out error:', error)
        toast.error('Error during sign out')
        setIsSigningOut(false)
        return
      }

      // Déconnexion réussie
      toast.success('Successfully signed out')
      setIsOpen(false) // Close the sidebar
      
      // Redirection vers la page d'accueil
      window.location.href = '/'
      
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Sign out error:', error)
      setIsSigningOut(false)
    }
  }

  const getTriggerButton = () => {
    if (variant === 'sidebar') {
      return (
        <Button 
          variant="ghost" 
          className={`w-full ${isCollapsed ? "justify-center px-0" : "justify-start"} gap-3 text-sidebar-foreground hover:bg-accent ${className}`}
          type="button"
        >
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarImage src={user.user_metadata?.avatar_url} alt="User" />
            <AvatarFallback>
              <User className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && <span>Profile</span>}
        </Button>
      )
    }
    
    return (
      <Button 
        size="icon"
        variant="outline" 
        className={`rounded-full cursor-pointer ${className}`}
        type="button"
      >
        <Avatar className="h-7 w-7">
          <AvatarImage src={user.user_metadata?.avatar_url} alt="User" />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </Button>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {getTriggerButton()}
      </SheetTrigger>
      <SheetContent side="right" className="w-72 flex flex-col p-6">
        <SheetHeader className="text-center pb-6">
          <SheetTitle className="flex flex-col items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.user_metadata?.avatar_url} alt="User" />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-sm font-semibold">{getUserDisplayName()}</p>
              <p className="text-xs text-muted-foreground">{getUserEmail()}</p>
            </div>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 space-y-6 px-2">
          {/* Profile Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Account
            </h3>
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                className="w-full text-xs justify-start gap-3 h-10"
                onClick={() => setIsOpen(false)}
              >
                <User className="h-4 w-4" />
                <span>My Profile</span>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-xs justify-start gap-3 h-10"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Button>
            </div>
          </div>

          {/* Support Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Support
            </h3>
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                className="w-full text-xs justify-start gap-3 h-10"
                onClick={() => setIsOpen(false)}
              >
                <Mail className="h-4 w-4" />
                <span>Contact Support</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer with sign out button */}
        <div className="border-t pt-4 px-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Alias pour la compatibilité avec l'ancien SidebarUserMenu
export const SidebarUserMenu = UserMenu
