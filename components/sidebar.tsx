"use client"

import {
  Search,
  Users,
  Grid3x3,
  FolderOpen,
  Settings,
  Sun,
  Moon,
  MoreHorizontal,
  PanelLeft,
  User,
  Edit,
  Video,
  Music,
  Image,
  Heart,
  ChevronDown,
  ChevronRight,
  BookOpen,
  UserCircle,
  Package,
  Globe,
  BarChart3,
  Mic,
  Volume2,
  Zap,
  PlayCircle,
  Megaphone,
  Film,
  Scissors,
  MessageCircle,
  FileImage,
  FileText,
  Palette,
  Subtitles,
  Droplets,
  Plus,
  Languages,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { UserMenu } from "@/components/auth/user-menu"
import { useTheme } from "next-themes"
import { useAuth } from "@/components/auth/auth-provider"
import { useNavigation } from "@/hooks/use-navigation"
import { useState, useEffect } from "react"

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isMobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }: SidebarProps) {
  const [isMounted, setIsMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const { selectedSection, setSelectedSection } = useNavigation()
  const [isVisualsOpen, setIsVisualsOpen] = useState(false)
  const [isMixedAssetsOpen, setIsMixedAssetsOpen] = useState(false)
  const [isMotionsOpen, setIsMotionsOpen] = useState(false)
  const [isDiverseMotionOpen, setIsDiverseMotionOpen] = useState(false)
  const [isAudiosOpen, setIsAudiosOpen] = useState(false)
  const [isEditUtilitiesOpen, setIsEditUtilitiesOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const getThemeIcon = () => {
    if (!isMounted) return <Sun className="h-5 w-5" />
    return theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />
  }

  if (!isMounted) {
    return (
      <aside
        className={`${isCollapsed ? "w-16" : "w-60"} border-r border-sidebar-border bg-sidebar flex flex-col transition-all duration-300
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:relative z-50 h-full`}
      >
        <div className="h-16 flex items-center px-3 border-b border-sidebar-border justify-between">
          {!isCollapsed && 
          <span className="text-2xl font-bold text-primary">DreamCut</span>}
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8 shrink-0 hidden md:flex">
            <PanelLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 h-0 overflow-y-auto scrollbar-hover">
          <nav className="px-3 py-4 space-y-1">
          </nav>
        </div>
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className={`flex items-center ${isCollapsed ? "flex-col" : "justify-center"} gap-2 pt-2`}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 bg-accent">
              <Sun className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={`${isCollapsed ? "w-16" : "w-60"} border-r border-sidebar-border bg-sidebar flex flex-col transition-all duration-300
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:relative z-50 h-full`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-3 border-b border-sidebar-border justify-between">
        {!isCollapsed && <span className="text-2xl font-bold text-primary">DreamCut</span>}
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8 shrink-0 hidden md:flex">
          <PanelLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 h-0 overflow-y-auto scrollbar-hover">
        <nav className="px-3 py-4 space-y-1">
        <Button
          variant="ghost"
          className={`w-full ${isCollapsed ? "justify-center px-0" : "justify-start"} gap-3 ${
            selectedSection === 'library'
              ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
              : 'text-sidebar-foreground hover:bg-accent'
          }`}
          onClick={() => {
            setSelectedSection('library')
            onMobileClose()
          }}
        >
          <Grid3x3 className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Library</span>}
        </Button>

        {/* Pinned Section */}
        <div className="pt-6">
          {!isCollapsed && <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground">Pinned</div>}
          <Button
            variant="ghost"
            className={`w-full ${isCollapsed ? "justify-center px-0" : "justify-start"} gap-3 text-sidebar-foreground hover:bg-accent`}
            onClick={() => {
              if (!isCollapsed) {
                setIsVisualsOpen(!isVisualsOpen)
              }
              onMobileClose()
            }}
          >
            <Image className="h-5 w-5 shrink-0" />
            {!isCollapsed && (
              <>
                <span>Visuals</span>
                {isVisualsOpen ? (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </>
            )}
          </Button>
          
          {/* Visuals Submenu */}
          {!isCollapsed && isVisualsOpen && (
            <div className="ml-6 mt-1 space-y-1">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 text-xs ${
                  selectedSection === 'avatars-personas'
                    ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                    : 'text-sidebar-foreground hover:bg-accent'
                }`}
                onClick={() => {
                  setSelectedSection('avatars-personas')
                  onMobileClose()
                }}
              >
                <UserCircle className="h-4 w-4 shrink-0" />
                <span>Avatars & Personas</span>
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 text-xs ${
                  selectedSection === 'product-mockups'
                    ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                    : 'text-sidebar-foreground hover:bg-accent'
                }`}
                onClick={() => {
                  setSelectedSection('product-mockups')
                  onMobileClose()
                }}
              >
                <Package className="h-4 w-4 shrink-0" />
                <span>Product Mockups</span>
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 text-xs ${
                  selectedSection === 'charts-infographics'
                    ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                    : 'text-sidebar-foreground hover:bg-accent'
                }`}
                onClick={() => {
                  setSelectedSection('charts-infographics')
                  onMobileClose()
                }}
              >
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span>Charts & Infographics</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-xs text-muted-foreground cursor-not-allowed opacity-60"
                disabled
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>Comics</span>
                <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-xs text-muted-foreground cursor-not-allowed opacity-60"
                disabled
              >
                <Palette className="h-4 w-4 shrink-0" />
                <span>Illustration</span>
                <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-xs text-muted-foreground cursor-not-allowed opacity-60"
                disabled
              >
                <Globe className="h-4 w-4 shrink-0" />
                <span>Concept Worlds</span>
                <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
              </Button>
            </div>
          )}
        </div>

        {/* My Creations */}
        <Button
          variant="ghost"
          className={`w-full ${isCollapsed ? "justify-center px-0" : "justify-start"} gap-3 text-sidebar-foreground hover:bg-accent`}
          onClick={() => {
            if (!isCollapsed) {
              setIsAudiosOpen(!isAudiosOpen)
            }
            onMobileClose()
          }}
        >
          <Music className="h-5 w-5 shrink-0" />
          {!isCollapsed && (
            <>
              <span>Audios</span>
              {isAudiosOpen ? (
                <ChevronDown className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </>
          )}
        </Button>
        
        {/* Audios Submenu */}
        {!isCollapsed && isAudiosOpen && (
          <div className="ml-6 mt-1 space-y-1">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 text-xs ${
                selectedSection === 'voiceovers'
                  ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                  : 'text-sidebar-foreground hover:bg-accent'
              }`}
              onClick={() => {
                setSelectedSection('voiceovers')
                onMobileClose()
              }}
            >
              <Volume2 className="h-4 w-4 shrink-0" />
              <span>Voiceovers</span>
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 text-xs ${
                selectedSection === 'music-jingles'
                  ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                  : 'text-sidebar-foreground hover:bg-accent'
              }`}
              onClick={() => {
                setSelectedSection('music-jingles')
                onMobileClose()
              }}
            >
              <Music className="h-4 w-4 shrink-0" />
              <span>Music & Jingles</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-xs text-muted-foreground cursor-not-allowed opacity-60"
              disabled
            >
              <Film className="h-4 w-4 shrink-0" />
              <span>Music Videos</span>
              <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-xs text-muted-foreground cursor-not-allowed opacity-60"
              disabled
            >
              <Mic className="h-4 w-4 shrink-0" />
              <span>Voice Creation</span>
              <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-xs text-muted-foreground cursor-not-allowed opacity-60"
              disabled
            >
              <Zap className="h-4 w-4 shrink-0" />
              <span>Sound FX</span>
              <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
            </Button>
          </div>
        )}

        <Button
          variant="ghost"
          className={`w-full ${isCollapsed ? "justify-center px-0" : "justify-start"} gap-3 text-sidebar-foreground hover:bg-accent`}
          onClick={() => {
            if (!isCollapsed) {
              setIsMotionsOpen(!isMotionsOpen)
            }
            onMobileClose()
          }}
        >
          <Video className="h-5 w-5 shrink-0" />
          {!isCollapsed && (
            <>
              <span>Motions</span>
              {isMotionsOpen ? (
                <ChevronDown className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </>
          )}
        </Button>
        
        {/* Motions Submenu */}
        {!isCollapsed && isMotionsOpen && (
          <div className="ml-6 mt-1 space-y-1">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 text-xs ${
                selectedSection === 'talking-avatars'
                  ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                  : 'text-sidebar-foreground hover:bg-accent'
              }`}
              onClick={() => {
                setSelectedSection('talking-avatars')
                onMobileClose()
              }}
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span>Talking Avatars</span>
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 text-xs ${
                selectedSection === 'diverse-motion-single' || selectedSection === 'diverse-motion-dual'
                  ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                  : 'text-sidebar-foreground hover:bg-accent'
              }`}
              onClick={() => {
                if (!isCollapsed) {
                  setIsDiverseMotionOpen(!isDiverseMotionOpen)
                }
                onMobileClose()
              }}
            >
              <Layers className="h-4 w-4 shrink-0" />
              <span>Diverse Motion</span>
              {!isCollapsed && (
                isDiverseMotionOpen ? (
                  <ChevronDown className="h-3 w-3 ml-auto" />
                ) : (
                  <ChevronRight className="h-3 w-3 ml-auto" />
                )
              )}
            </Button>
            
            {/* Diverse Motion Submenu */}
            {!isCollapsed && isDiverseMotionOpen && (
              <div className="ml-8 mt-1 space-y-1">
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 text-xs ${
                    selectedSection === 'diverse-motion-single'
                      ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                      : 'text-sidebar-foreground hover:bg-accent'
                  }`}
                  onClick={() => {
                    setSelectedSection('diverse-motion-single')
                    onMobileClose()
                  }}
                >
                  <Layers className="h-3 w-3 shrink-0" />
                  <span>Single Asset</span>
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 text-xs ${
                    selectedSection === 'diverse-motion-dual'
                      ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                      : 'text-sidebar-foreground hover:bg-accent'
                  }`}
                  onClick={() => {
                    setSelectedSection('diverse-motion-dual')
                    onMobileClose()
                  }}
                >
                  <Layers className="h-3 w-3 shrink-0" />
                  <span>Dual Asset</span>
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-xs text-muted-foreground cursor-not-allowed opacity-60"
              disabled
            >
              <PlayCircle className="h-4 w-4 shrink-0" />
              <span>Explainers</span>
              <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-xs text-muted-foreground cursor-not-allowed opacity-60"
              disabled
            >
              <Scissors className="h-4 w-4 shrink-0" />
              <span>Social Cuts</span>
              <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
            </Button>
          </div>
        )}

        {/* Mixed Assets - Temporarily disabled */}
        {/* <Button
          variant="ghost"
          className={`w-full ${isCollapsed ? "justify-center px-0" : "justify-start"} gap-3 text-sidebar-foreground hover:bg-accent`}
          onClick={() => {
            if (!isCollapsed) {
              setIsMixedAssetsOpen(!isMixedAssetsOpen)
            }
            onMobileClose()
          }}
        >
          <Layers className="h-5 w-5 shrink-0" />
          {!isCollapsed && (
            <>
              <span>Mixed Assets</span>
              {isMixedAssetsOpen ? (
                <ChevronDown className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </>
          )}
        </Button> */}
        
        {/* Mixed Assets Submenu - Temporarily disabled */}
        {/* {!isCollapsed && isMixedAssetsOpen && (
          <div className="ml-6 mt-1 space-y-1">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 text-xs ${
                selectedSection === 'thumbnails-covers'
                  ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                  : 'text-sidebar-foreground hover:bg-accent'
              }`}
              onClick={() => {
                setSelectedSection('thumbnails-covers')
                onMobileClose()
              }}
            >
              <FileImage className="h-4 w-4 shrink-0" />
              <span>Thumbnails & Covers</span>
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 text-xs ${
                selectedSection === 'storyboards-scripts'
                  ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                  : 'text-sidebar-foreground hover:bg-accent'
              }`}
              onClick={() => {
                setSelectedSection('storyboards-scripts')
                onMobileClose()
              }}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span>Storyboards & Scripts</span>
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 text-xs ${
                selectedSection === 'ad-templates'
                  ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                  : 'text-sidebar-foreground hover:bg-accent'
              }`}
              onClick={() => {
                setSelectedSection('ad-templates')
                onMobileClose()
              }}
            >
              <Megaphone className="h-4 w-4 shrink-0" />
              <span>Ad Templates</span>
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 text-xs ${
                selectedSection === 'brand-kits'
                  ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                  : 'text-sidebar-foreground hover:bg-accent'
              }`}
              onClick={() => {
                setSelectedSection('brand-kits')
                onMobileClose()
              }}
            >
              <Palette className="h-4 w-4 shrink-0" />
              <span>Brand Kits</span>
            </Button>
          </div>
        )} */}

        <Button
          variant="ghost"
          className={`w-full ${isCollapsed ? "justify-center px-0" : "justify-start"} gap-3 text-sidebar-foreground hover:bg-accent`}
          onClick={() => {
            if (!isCollapsed) {
              setIsEditUtilitiesOpen(!isEditUtilitiesOpen)
            }
            onMobileClose()
          }}
        >
          <Edit className="h-5 w-5 shrink-0" />
          {!isCollapsed && (
            <>
              <span>Edit (Utilities)</span>
              {isEditUtilitiesOpen ? (
                <ChevronDown className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </>
          )}
        </Button>
        
        {/* Edit Utilities Submenu */}
        {!isCollapsed && isEditUtilitiesOpen && (
          <div className="ml-6 mt-1 space-y-1">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 text-xs ${
                selectedSection === 'add-subtitles'
                  ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                  : 'text-sidebar-foreground hover:bg-accent'
              }`}
              onClick={() => {
                setSelectedSection('add-subtitles')
                onMobileClose()
              }}
            >
              <Subtitles className="h-4 w-4 shrink-0" />
              <span>Add Subtitles</span>
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                className={`flex-1 justify-start gap-3 text-xs ${
                  selectedSection === 'add-watermark'
                    ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                    : 'text-sidebar-foreground hover:bg-accent'
                }`}
                onClick={() => {
                  setSelectedSection('add-watermark')
                  onMobileClose()
                }}
              >
                <Droplets className="h-4 w-4 shrink-0" />
                <span>Add Watermark</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 text-xs ${
                  selectedSection === 'add-watermark'
                    ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white hover:from-[#57e6f9] hover:via-blue-500 hover:to-purple-700'
                    : 'text-sidebar-foreground hover:bg-accent'
                }`}
                onClick={() => {
                  setSelectedSection('add-watermark')
                  onMobileClose()
                }}
                title="Create new watermark project"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {/* <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                className={`flex-1 justify-start gap-3 text-xs ${
                  selectedSection === 'video-translate'
                    ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white'
                    : 'text-sidebar-foreground hover:bg-accent'
                }`}
                onClick={() => {
                  setSelectedSection('video-translate')
                  onMobileClose()
                }}
              >
                <Languages className="h-4 w-4 shrink-0" />
                <span>Translate</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 text-xs ${
                  selectedSection === 'video-translate'
                    ? 'bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white hover:from-[#57e6f9] hover:via-blue-500 hover:to-purple-700'
                    : 'text-sidebar-foreground hover:bg-accent'
                }`}
                onClick={() => {
                  setSelectedSection('video-translate')
                  onMobileClose()
                }}
                title="Create new translation project"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div> */}
          </div>
        )}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {/* Mobile Header Buttons */}
        <div className="md:hidden space-y-2">
          {isMounted && user && (
            <UserMenu 
              variant="sidebar"
              isCollapsed={isCollapsed}
            />
          )}
        </div>

        {!isCollapsed && (
          <>
            <Button className="w-full bg-gradient-to-r from-[#57e6f9] via-blue-500 to-purple-700 text-white cursor-pointer">
              Get a plan
            </Button>
            <p className="text-xs text-center text-muted-foreground">Unlock more features</p>
          </>
        )}

        <div className={`flex items-center ${isCollapsed ? "flex-col" : "justify-center"} gap-2 pt-2`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 bg-accent"
            onClick={toggleTheme}
          >
            {getThemeIcon()}
          </Button>
          {!isCollapsed && (
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
