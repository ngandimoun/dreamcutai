"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Instrument_Serif } from "next/font/google"



const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
})


interface GoogleAccount {
  id: string
  email: string
  name: string
  picture: string
}

interface GoogleAuthPopupProps {
  isOpen: boolean
  onClose: () => void
}

function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.5 12.2c0-.7-.1-1.4-.2-2h-10v3.9h5.7c-.2 1.1-.8 2.1-1.8 2.7v2.3h2.9c1.7-1.6 2.7-3.9 2.7-6.9z"
      />
      <path
        fill="#34A853"
        d="M12.3 23c2.7 0 5-.9 6.7-2.5l-2.9-2.3c-.8.5-1.8.9-3.8.9-2.9 0-5.3-2-6.2-4.7H3v2.9C4.7 20.5 8.1 23 12.3 23z"
      />
      <path
        fill="#FBBC05"
        d="M6.1 14.4c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.7H3c-.6 1.2-1 2.6-1 4.1s.4 2.9 1 4.1l3.1-2.5z"
      />
      <path
        fill="#EA4335"
        d="M12.3 5.3c1.5 0 2.8.5 3.9 1.6l2.9-2.9C18.1 1.6 15 0.3 12.3 0.3 8.1 0.3 4.7 2.8 3 6.3l3.1 2.5c.9-2.7 3.3-3.5 6.2-3.5z"
      />
    </svg>
  )
}

export function GoogleAuthPopup({ isOpen, onClose }: GoogleAuthPopupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([])
  const [isDetectingAccounts, setIsDetectingAccounts] = useState(true)
  const supabase = createClient()

  // Detect signed-in Google accounts
  useEffect(() => {
    if (isOpen) {
      detectGoogleAccounts()
    }
  }, [isOpen])

  const detectGoogleAccounts = async () => {
    setIsDetectingAccounts(true)
    try {
      // Use Google Identity API to detect accounts
      if (typeof window !== 'undefined' && window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: () => {}, // Empty callback for detection only
        })

        // Detect available accounts
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // No account detected or user dismissed
            setGoogleAccounts([])
          }
        })
      }
    } catch (error) {
      console.error('Error while detecting Google accounts:', error)
    } finally {
      setIsDetectingAccounts(false)
    }
  }

  const signInWithGoogle = async (account?: GoogleAccount) => {
    setIsLoading(true)
    try {
      // Simplified approach: direct redirect
      toast.success('Redirecting to Google...')
      onClose()
      
      // Direct redirect to the authentication route
      window.location.href = '/auth/signin?provider=google'
      
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Unexpected error:', error)
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${instrumentSerif.className} sm:max-w-md overflow-hidden rounded-xl border border-slate-200/70 bg-white/95 p-0 shadow-[0_24px_70px_-30px_rgba(66,133,244,0.6)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/85`}>
        <DialogHeader className="space-y-3 bg-linear-to-br from-[#57e6f9] via-blue-500 to-purple-700 px-6 py-6 text-left text-white">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-white">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <GoogleIcon className="h-7 w-7" />
            </span>
            Secure Google sign-in
          </DialogTitle>
          <DialogDescription className="text-sm text-white/85">
            A seamless, reliable sign-in flow fully integrated with Dreamcut Studio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-6 pt-5">
          {isDetectingAccounts ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-6 py-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
              <Loader2 className="h-6 w-6 animate-spin text-[#4285F4]" />
              <div className="space-y-1">
                <p className="font-medium">Looking for your Google accounts…</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This only takes a few seconds.
                </p>
              </div>
            </div>
          ) : (
            <>
              <Button
                onClick={() => signInWithGoogle()}
                disabled={isLoading}
                className="group relative flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white py-3 text-sm font-medium text-slate-900 transition hover:border-[#4285F4] hover:bg-[#f5f9ff] hover:shadow-[0_18px_36px_-18px_rgba(66,133,244,0.6)] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-[#4285F4] dark:hover:bg-slate-800/70"
                type="button"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#4285F4]" />
                ) : (
                  <GoogleIcon className="h-5 w-5" />
                )}
                <span>Continue with Google</span>
              </Button>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-5 py-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                <p className="font-medium text-slate-600 dark:text-slate-200">
                  Why sign in with Google?
                </p>
                <ul className="mt-2 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4285F4]" />
                    Instant sync for your Dreamcut projects.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#34A853]" />
                    Enterprise-grade security from Google’s infrastructure.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FBBC05]" />
                    No extra passwords to remember.
                  </li>
                </ul>
              </div>

              <p className="text-center text-[10px] text-blue-400 dark:text-blue-500">
                By continuing, you agree to our Terms of Use and Privacy Policy.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Déclaration globale pour TypeScript
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: (callback: (notification: any) => void) => void
        }
      }
    }
  }
}
