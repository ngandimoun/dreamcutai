"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { GeneratorPanel } from "@/components/generator-panel"
import { MainContent } from "@/components/main-content"
import { NavigationProvider } from "@/hooks/use-navigation"
import { ChatbotProvider } from "@/components/chatbot/chatbot-context"
import { FloatingChatbot } from "@/components/chatbot/floating-chatbot"
import { useNavigation } from "@/hooks/use-navigation"

function ContentPageInner() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const { selectedSection } = useNavigation()

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
        )}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
        <div className="flex flex-1 flex-col">
          <Header onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />
          <div className="flex flex-1 overflow-hidden">
            <GeneratorPanel />
            <MainContent />
          </div>
        </div>
      </div>
      <FloatingChatbot />
    </>
  )
}

function ChatbotWrapper() {
  const { selectedSection } = useNavigation()
  
  return (
    <ChatbotProvider currentSection={selectedSection || ''}>
      <ContentPageInner />
    </ChatbotProvider>
  )
}

export default function ContentPage() {
  return (
    <NavigationProvider>
      <ChatbotWrapper />
    </NavigationProvider>
  )
}
