"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { useChatbot } from './chatbot-context'
import { ChatInterface } from './chat-interface'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { MessageCircle, X } from 'lucide-react'
import { PulsingBorder } from "@paper-design/shaders-react" // Import du nouveau design
import { motion } from "framer-motion" // Import pour l'animation

export function FloatingChatbot() {
  const { user } = useAuth()
  const { isOpen, setIsOpen, messages } = useChatbot()
  const [isMinimized, setIsMinimized] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // La logique pour suivre les messages non lus reste la même
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant') {
        setUnreadCount(prev => prev + 1)
      }
    } else if (isOpen) {
      setUnreadCount(0)
    }
  }, [isOpen, messages])

  // Ne rend rien si l'utilisateur n'est pas authentifié
  if (!user) {
    return null
  }

  const openChat = () => {
    setIsOpen(true)
    setIsMinimized(false)
  }

  const closeChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  const minimizeChat = () => {
    setIsMinimized(true)
    setIsOpen(false)
  }

  const handleSheetChange = (open: boolean) => {
    if (open) {
      openChat()
    } else {
      closeChat()
    }
  }

  return (
    <>
      {/* Bouton flottant - REMPLACÉ PAR LE NOUVEAU DESIGN */}
      {!isOpen && !isMinimized && (
        <div 
          className="fixed bottom-12 right-6 z-50 cursor-pointer group"
          onClick={openChat}
        >
          <div className="relative w-[75px] h-[75px] flex items-center justify-center">
            {/* Design du cercle pulsant */}
            <PulsingBorder
              colors={["#BEECFF", "#E77EDC", "#FF4C3E", "#00FF88", "#FFD700", "#FF6B35", "#8A2BE2"]}
              colorBack="#00000000"
              speed={1.5}
              roundness={1}
              thickness={0.1}
              softness={0.2}
              intensity={5}
              spotSize={0.1}
              pulse={0.1}
              smoke={0.5}
              smokeSize={4}
              scale={0.65}
              rotation={0}
              frame={9161408.251009725}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
              }}
            />

            {/* Texte rotatif autour du cercle */}
            <motion.svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              animate={{ rotate: 360 }}
              transition={{
                duration: 20,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              style={{ transform: "scale(1.6)" }}
            >
              <defs>
                <path id="circle" d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
              </defs>
              <text className="text-xs dark:fill-white instrument">
                {/* Vous pouvez personnaliser ce texte */}
                <textPath href="#circle" startOffset="0%">
                  DreamCut is amazing • DreamCut is amazing • DreamCut is amazing • DreamCut is amazing •
                </textPath>
              </text>
            </motion.svg>
            
            {/* Intégration du compteur de messages non lus */}
            {unreadCount > 0 && (
              <span className="absolute bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse z-10">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      )}

      {isMinimized && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-80 h-16 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">DreamCut AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={openChat}
                className="h-6 w-6 p-0"
                title="Reopen chat"
              >
                <MessageCircle className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={isOpen} onOpenChange={handleSheetChange}>
        <SheetContent
          side="right"
          className="p-0 h-full w-full max-w-full border-l-0 sm:border-l sm:max-w-md md:max-w-lg"
        >
          <ChatInterface onClose={closeChat} onMinimize={minimizeChat} />
        </SheetContent>
      </Sheet>
    </>
  )
}