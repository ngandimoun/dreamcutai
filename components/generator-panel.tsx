"use client"

import { useEffect, useState } from "react"
import { useNavigation } from "@/hooks/use-navigation"
import { ImageGeneratorInterface } from "@/components/image-generator-interface"
import { IllustrationGeneratorInterface } from "@/components/illustration-generator-interface"
import { AvatarPersonaGeneratorInterface } from "@/components/avatar-persona-generator-interface"
import { VideoGeneratorInterface } from "@/components/video-generator-interface"
import { ExplainerGeneratorInterface } from "@/components/explainer-generator-interface"
import { ExplainerVideoLibrary } from "@/components/explainer-video-library"
import { ProductMockupGeneratorInterface } from "@/components/product-mockup-generator-interface"
import { ChartsInfographicsGeneratorInterface } from "@/components/charts-infographics-generator-interface"
import { ConceptWorldsGeneratorInterface } from "@/components/concept-worlds-generator-interface"
import { VoiceCreationInterface } from "@/components/voice-creation-interface"
import { VoiceoverGeneratorInterface } from "@/components/voiceover-generator-interface"
import { SoundFxInterface } from "@/components/sound-fx-interface"
import { TalkingAvatarsGeneratorInterface } from "@/components/talking-avatars-generator-interface"
import { DiverseMotionSingleInterface } from "@/components/diverse-motion-single-interface"
import { DiverseMotionDualInterface } from "@/components/diverse-motion-dual-interface"
import { MusicJingleGeneratorInterface } from "@/components/music-jingle-generator-interface"
import { MusicVideoGeneratorInterface } from "@/components/music-video-generator-interface"
import { IllustrationForm } from "@/components/forms/illustration-form"
import { AvatarsForm } from "@/components/forms/avatars-form"
import { ProductMockupsForm } from "@/components/forms/product-mockups-form"
import { ConceptWorldsForm } from "@/components/forms/concept-worlds-form"
import { ChartsInfographicsForm } from "@/components/forms/charts-infographics-form"
import { ExplainersForm } from "@/components/forms/explainers-form"
import { SocialCutsForm } from "@/components/forms/social-cuts-form"
import { TalkingAvatarsForm } from "@/components/forms/talking-avatars-form"
import { ComicsForm } from "@/components/forms/comics-form"
import { SubtitleForm } from "@/components/forms/subtitle-form"
import { SoundToVideoInterface } from "@/components/sound-to-video-interface"
import { WatermarkForm } from "@/components/forms/watermark-form"
import { VideoTranslationForm } from "@/components/forms/video-translation-form"
import { VideoTranslationInterface } from "@/components/video-translation-interface"
import { ComicCard } from "@/components/comic-card"
import { LibraryHeader } from "@/components/library-header"
import { Button } from "@/components/ui/button"
import { Plus, FolderPlus, Globe, Lock } from "lucide-react"
import { AutocaptionModelInputs } from "@/lib/types/subtitles"
import { VideoTranslationInputs } from "@/lib/types/video-translation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function GeneratorPanel() {
  const [isMounted, setIsMounted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const { getDisplayTitle, selectedSection, showProjectForm, setShowProjectForm, setSelectedSection } = useNavigation()
  const { toast } = useToast()
  const supabase = createClient()
  
  // États locaux pour l'interface de génération d'images (Illustration, Avatars & Personas, Product Mockups, Concept Worlds, et Charts & Infographics)
  const [showImageGenerator, setShowImageGenerator] = useState(false)
  const [selectedProject, setSelectedProject] = useState<{title: string, image: string, description: string, isPublic?: boolean} | null>(null)
  const [imageGeneratorSection, setImageGeneratorSection] = useState<string | null>(null)
  
  // États locaux pour l'interface de génération vidéo (Explainers, Talking Avatars, Social Cuts, Cinematic Clips, Product in Motion, UGC Ads)
  const [showVideoGenerator, setShowVideoGenerator] = useState(false)
  const [selectedVideoProject, setSelectedVideoProject] = useState<{title: string, image: string, description: string} | null>(null)
  const [videoGeneratorSection, setVideoGeneratorSection] = useState<string | null>(null)
  
  // États locaux pour l'interface de création de voix
  const [showVoiceCreation, setShowVoiceCreation] = useState(false)
  
  // États locaux pour l'interface de génération de musique
  const [showMusicJingleGenerator, setShowMusicJingleGenerator] = useState(false)
  
  // États locaux pour l'interface de génération de vidéos musicales
  const [showMusicVideoGenerator, setShowMusicVideoGenerator] = useState(false)
  
  // États locaux pour l'interface de création de voiceovers
  const [showVoiceover, setShowVoiceover] = useState(false)
  
  // États locaux pour l'interface de création de Sound FX
  const [showSoundFx, setShowSoundFx] = useState(false)
  
  // États locaux pour l'interface de génération de talking avatars
  const [showTalkingAvatars, setShowTalkingAvatars] = useState(false)
  const [selectedTalkingAvatarProject, setSelectedTalkingAvatarProject] = useState<{title: string, image: string, description: string} | null>(null)
  
  // États locaux pour l'interface de génération de diverse motion
  const [showDiverseMotionSingle, setShowDiverseMotionSingle] = useState(false)
  const [showDiverseMotionDual, setShowDiverseMotionDual] = useState(false)
  

  // Sections qui supportent la génération d'images
  const imageGenerationSections = ['illustration', 'avatars-personas', 'product-mockups', 'concept-worlds', 'charts-infographics', 'comics']
  
  // Sections qui supportent la génération vidéo
  const videoGenerationSections = ['explainers', 'social-cuts']
  
  // Sections qui supportent la création de voix
  const voiceCreationSections = ['voice-creation']
  
  // Sections qui supportent la création de voiceovers
  const voiceoverSections = ['voiceovers']
  
  // Sections qui supportent la création de Sound FX
  const soundFxSections = ['sound-fx']
  
  // Sections qui supportent la génération de musique
  const musicJingleSections = ['music-jingles']
  
  // Sections qui supportent la génération de vidéos musicales
  const musicVideoSections = ['music-videos']
  
  // Sections qui supportent les nouveaux formulaires
  const newFormSections = ['social-cuts', 'talking-avatars', 'comics', 'add-subtitles', 'add-sound', 'add-watermark', 'video-translate']
  
  // Sections qui supportent la génération de talking avatars
  const talkingAvatarsSections = ['talking-avatars']
  
  // Sections qui supportent la génération de diverse motion
  const diverseMotionSections = ['diverse-motion-single', 'diverse-motion-dual']
  
  // Helper functions
  const isImageGenerationSection = (section: string) => imageGenerationSections.includes(section)
  const isVideoGenerationSection = (section: string) => videoGenerationSections.includes(section)
  const isVoiceCreationSection = (section: string) => voiceCreationSections.includes(section)
  const isVoiceoverSection = (section: string) => voiceoverSections.includes(section)
  const isSoundFxSection = (section: string) => soundFxSections.includes(section)
  
  // Helper function to determine if the section needs a scrollable container
  const needsScrollableContainer = () => {
    return !showImageGenerator && !showVideoGenerator
  }
  const isMusicJingleSection = (section: string) => musicJingleSections.includes(section)
  const isNewFormSection = (section: string) => newFormSections.includes(section)
  const isTalkingAvatarsSection = (section: string) => talkingAvatarsSections.includes(section)
  const isDiverseMotionSection = (section: string) => diverseMotionSections.includes(section)
  const shouldShowNewProjectButton = () => (isImageGenerationSection(selectedSection) || isNewFormSection(selectedSection) || selectedSection === 'explainers' || isDiverseMotionSection(selectedSection)) && selectedSection !== 'social-cuts' && !showProjectForm && !showImageGenerator && !showVideoGenerator && !showVoiceCreation && !showVoiceover && !showSoundFx && !showTalkingAvatars && !showDiverseMotionSingle && !showDiverseMotionDual && !showMusicJingleGenerator
  const shouldShowProjectGrid = () => (isImageGenerationSection(selectedSection) || isNewFormSection(selectedSection)) && false && !showImageGenerator && !showVideoGenerator && !showVoiceCreation && !showVoiceover && !showSoundFx && !showTalkingAvatars && !showMusicJingleGenerator
  const shouldShowEmptyState = () => (isImageGenerationSection(selectedSection) || isNewFormSection(selectedSection)) && true && !showProjectForm && !showImageGenerator && !showVideoGenerator && !showVoiceCreation && !showVoiceover && !showSoundFx && !showTalkingAvatars && !showMusicJingleGenerator

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [supabase.auth])

  // Fermer l'interface de génération d'images quand on change de section
  useEffect(() => {
    if (imageGeneratorSection && imageGeneratorSection !== selectedSection) {
      setShowImageGenerator(false)
      setSelectedProject(null)
      setImageGeneratorSection(null)
    }
  }, [selectedSection, imageGeneratorSection])

  // Fermer l'interface de génération vidéo quand on change de section
  useEffect(() => {
    if (videoGeneratorSection && videoGeneratorSection !== selectedSection) {
      setShowVideoGenerator(false)
      setSelectedVideoProject(null)
      setVideoGeneratorSection(null)
    }
  }, [selectedSection, videoGeneratorSection])

  // Fermer l'interface de création de voix quand on change de section
  useEffect(() => {
    if (showVoiceCreation && selectedSection !== 'voice-creation') {
      setShowVoiceCreation(false)
    }
  }, [selectedSection, showVoiceCreation])
  
  // Fermer l'interface de création de voiceovers quand on change de section
  useEffect(() => {
    if (showVoiceover && selectedSection !== 'voiceovers') {
      setShowVoiceover(false)
    }
  }, [selectedSection, showVoiceover])
  
  // Fermer l'interface de création de Sound FX quand on change de section
  useEffect(() => {
    if (showSoundFx && selectedSection !== 'sound-fx') {
      setShowSoundFx(false)
    }
  }, [selectedSection, showSoundFx])

  // Fermer l'interface de génération de musique quand on change de section
  useEffect(() => {
    if (showMusicJingleGenerator && selectedSection !== 'music-jingles') {
      setShowMusicJingleGenerator(false)
    }
  }, [selectedSection, showMusicJingleGenerator])

  // Fermer l'interface de génération de vidéos musicales quand on change de section
  useEffect(() => {
    if (showMusicVideoGenerator && selectedSection !== 'music-videos') {
      setShowMusicVideoGenerator(false)
    }
  }, [selectedSection, showMusicVideoGenerator])

  // Fermer l'interface de génération de talking avatars quand on change de section
  useEffect(() => {
    if (showTalkingAvatars && selectedSection !== 'talking-avatars') {
      setShowTalkingAvatars(false)
      setSelectedTalkingAvatarProject(null)
    }
  }, [selectedSection, showTalkingAvatars])

  useEffect(() => {
    // Effect for section changes
    if (selectedSection === 'music-videos') {
      setShowMusicVideoGenerator(true)
    }
  }, [selectedSection])

  // Fonctions pour gérer l'interface de génération d'images (Illustration, Avatars & Personas, Product Mockups, Concept Worlds, et Charts & Infographics)
  const handleProjectClick = (artifact: any) => {
    if (selectedSection === 'illustration' || selectedSection === 'avatars-personas' || selectedSection === 'product-mockups' || selectedSection === 'concept-worlds' || selectedSection === 'charts-infographics') {
      // For illustration, avatars-personas, product-mockups, concept-worlds, and charts-infographics sections, show project details in MainContent AND open generator
      // setSelectedArtifact removed
      setSelectedProject(artifact)
      setImageGeneratorSection(selectedSection)
      setShowImageGenerator(true)
    } else if (selectedSection === 'explainers') {
      // For explainers section, do nothing - we show video library directly
      // No need to open artifact details or generator
    } else if (selectedSection === 'talking-avatars') {
      // For talking-avatars section, show project details in MainContent AND open generator
      // setSelectedArtifact removed
      setSelectedTalkingAvatarProject(artifact)
      setShowTalkingAvatars(true)
    } else if (isImageGenerationSection(selectedSection)) {
      setSelectedProject(artifact)
      setImageGeneratorSection(selectedSection)
      setShowImageGenerator(true)
    } else if (isVideoGenerationSection(selectedSection)) {
      setSelectedVideoProject(artifact)
      setVideoGeneratorSection(selectedSection)
      setShowVideoGenerator(true)
    } else if (isTalkingAvatarsSection(selectedSection)) {
      setSelectedTalkingAvatarProject(artifact)
      setShowTalkingAvatars(true)
    }
  }

  const handleCloseImageGenerator = () => {
    setShowImageGenerator(false)
    setSelectedProject(null)
    setImageGeneratorSection(null)
    if (selectedSection === 'illustration' || selectedSection === 'avatars-personas' || selectedSection === 'product-mockups' || selectedSection === 'concept-worlds' || selectedSection === 'charts-infographics') {
      // setSelectedArtifact removed
    }
  }

  const handleCloseVideoGenerator = () => {
    setShowVideoGenerator(false)
    setSelectedVideoProject(null)
    setVideoGeneratorSection(null)
    if (selectedSection === 'explainers') {
      // setSelectedArtifact removed
    }
  }

  const handleCloseVoiceCreation = () => {
    setShowVoiceCreation(false)
  }

  const handleCloseVoiceover = () => {
    setShowVoiceover(false)
  }
  
  const handleCloseSoundFx = () => {
    setShowSoundFx(false)
  }

  const handleCloseTalkingAvatars = () => {
    setShowTalkingAvatars(false)
    setSelectedTalkingAvatarProject(null)
    if (selectedSection === 'talking-avatars') {
      // setSelectedArtifact removed
    }
  }

  // Composant pour le bouton New Project avec gradient dynamique
  const NewProjectButton = () => {
    const getGradientClass = () => {
      switch (selectedSection) {
        case 'illustration':
          return "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-500 hover:via-orange-600 hover:to-red-600"
        case 'avatars-personas':
          return "bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-600"
        case 'product-mockups':
          return "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600"
        case 'concept-worlds':
          return "bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 hover:from-sky-500 hover:via-blue-600 hover:to-indigo-600"
        case 'charts-infographics':
          return "bg-gradient-to-r from-lime-400 via-green-500 to-emerald-500 hover:from-lime-500 hover:via-green-600 hover:to-emerald-600"
        case 'explainers':
          return "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600"
        case 'talking-avatars':
          return "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600"
        default:
          return "bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 hover:from-rose-500 hover:via-pink-600 hover:to-purple-600"
      }
    }

    const getButtonLabel = () => {
      switch (selectedSection) {
        case 'illustration': return 'New Illustration'
        case 'avatars-personas': return 'New Avatar'
        case 'product-mockups': return 'New Mockup'
        case 'concept-worlds': return 'New World'
        case 'charts-infographics': return 'New Chart'
        case 'comics': return 'New Comic'
        case 'explainers': return 'New Explainer'
        case 'talking-avatars': return 'New Avatar'
        case 'add-subtitles': return 'New Subtitle'
        case 'add-watermark': return 'New Watermark'
        case 'video-translate': return 'New Translation'
        default: return 'New Project'
      }
    }

    return (
      <Button
        size="sm"
        onClick={() => {
          if (selectedSection === 'illustration') {
            // Créer un projet temporaire pour ouvrir le générateur
            setSelectedProject({ title: 'New Illustration', image: '', description: '', isPublic: true })
            setImageGeneratorSection('illustration')
            setShowImageGenerator(true)
          } else if (selectedSection === 'avatars-personas') {
            // Créer un projet temporaire pour ouvrir le générateur
            setSelectedProject({ title: 'New Avatar & Persona', image: '', description: '', isPublic: true })
            setImageGeneratorSection('avatars-personas')
            setShowImageGenerator(true)
          } else if (selectedSection === 'product-mockups') {
            // Créer un projet temporaire pour ouvrir le générateur
            setSelectedProject({ title: 'New Product Mockup', image: '', description: '', isPublic: true })
            setImageGeneratorSection('product-mockups')
            setShowImageGenerator(true)
          } else if (selectedSection === 'concept-worlds') {
            // Créer un projet temporaire pour ouvrir le générateur
            setSelectedProject({ title: 'New Concept World', image: '', description: '', isPublic: true })
            setImageGeneratorSection('concept-worlds')
            setShowImageGenerator(true)
          } else if (selectedSection === 'charts-infographics') {
            // Créer un projet temporaire pour ouvrir le générateur
            setSelectedProject({ title: 'New Chart & Infographic', image: '', description: '', isPublic: true })
            setImageGeneratorSection('charts-infographics')
            setShowImageGenerator(true)
          } else if (selectedSection === 'explainers') {
            // Créer un projet temporaire pour ouvrir le générateur explainers
            setSelectedVideoProject({ title: 'New Explainer Video', image: '', description: '' })
            setVideoGeneratorSection('explainers')
            setShowVideoGenerator(true)
          } else if (selectedSection === 'talking-avatars') {
            // Créer un projet temporaire pour ouvrir le générateur Talking Avatars
            setSelectedTalkingAvatarProject({ title: 'New Talking Avatar', image: '', description: '' })
            setShowTalkingAvatars(true)
          } else if (selectedSection === 'diverse-motion-single') {
            setShowDiverseMotionSingle(true)
          } else if (selectedSection === 'diverse-motion-dual') {
            setShowDiverseMotionDual(true)
          } else {
            setShowProjectForm(true)
          }
        }}
        className={`flex items-center gap-2 ${getGradientClass()} text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0`}
      >
        <FolderPlus className="h-4 w-4" />
        {getButtonLabel()}
      </Button>
    )
  }


  // Fonction pour rendre le bon formulaire selon la section
  const renderSectionForm = () => {

    switch (selectedSection) {
      case 'illustration':
        return (
          <IllustrationForm
            onSave={async () => {}}
            onCancel={() => setShowProjectForm(false)}
          />
        )
      case 'avatars-personas':
        return (
          <AvatarsForm
            onSave={async () => {}}
            onCancel={() => setShowProjectForm(false)}
          />
        )
      case 'product-mockups':
        return (
          <ProductMockupsForm
            onSave={async () => {}}
            onCancel={() => setShowProjectForm(false)}
          />
        )
      case 'concept-worlds':
        return (
          <ConceptWorldsForm
            onSave={async () => {}}
            onCancel={() => setShowProjectForm(false)}
          />
        )
      case 'charts-infographics':
        return (
          <ChartsInfographicsForm
            onSave={async () => {}}
            onCancel={() => setShowProjectForm(false)}
          />
        )
      case 'explainers':
        return (
          <ExplainersForm
            onSave={async () => {}}
            onCancel={() => setShowProjectForm(false)}
          />
        )
      case 'social-cuts':
        return (
          <SocialCutsForm
            onSave={async () => {}}
            onCancel={() => setShowProjectForm(false)}
          />
        )
      case 'talking-avatars':
        return (
          <TalkingAvatarsForm
            onSave={async () => {}}
            onCancel={() => setShowProjectForm(false)}
          />
        )
      case 'comics':
        return (
          <ComicsForm
            onSave={async () => {}}
            onCancel={() => setShowProjectForm(false)}
          />
        )
      case 'add-subtitles':
        return (
          <SubtitleForm
            isOpen={showProjectForm}
            onCancel={() => setShowProjectForm(false)}
            isLoading={false}
          />
        )
      case 'add-sound':
        return (
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-lg font-medium text-foreground mb-2">Sound-to-Video Form</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Form will be implemented later
              </p>
              <Button onClick={() => setShowProjectForm(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        )
      case 'add-watermark':
        return (
          <WatermarkForm
            isOpen={showProjectForm}
            onSubmit={async (formData) => {
              // This is now handled internally by the WatermarkForm component
              // The form calls /api/watermarks/generate directly
              setShowProjectForm(false)
            }}
            onCancel={() => setShowProjectForm(false)}
            isLoading={false}
          />
        )
      case 'video-translate':
        return (
          <VideoTranslationForm
            isOpen={showProjectForm}
            onSubmit={async (translationData: VideoTranslationInputs) => {
              try {
                const response = await fetch('/api/video-translations', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    ...translationData,
                    title: translationData.title || `Video Translation - ${new Date().toLocaleDateString()}`,
                    description: translationData.description || 'Video translation project'
                  }),
                })

                if (!response.ok) {
                  throw new Error('Failed to create video translation project')
                }

                const result = await response.json()
                console.log('🌍 Video translation project saved:', result)
                setShowProjectForm(false)
                
                // Optionally show a success message or redirect
              } catch (error) {
                console.error('Error saving video translation project:', error)
                // Handle error (show toast, etc.)
              }
            }}
            onCancel={() => setShowProjectForm(false)}
            isLoading={false}
          />
        )
      default:
        return null
    }
  }

  // Composant pour la grille de projets - empty since artifacts are removed
  const ProjectGrid = () => (
    <div className="text-center py-8">
      <p className="text-muted-foreground">No projects available</p>
    </div>
  )

  // Composant pour la grille de comics - empty since artifacts are removed
  const ComicsGrid = () => (
    <div className="text-center py-8">
      <p className="text-muted-foreground">No comics available</p>
    </div>
  )

  // Composant pour l'état vide
  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center text-muted-foreground py-8">
      <p>{message}</p>
    </div>
  )

  // Composant pour l'état de chargement
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="h-32 bg-muted animate-pulse rounded-lg" />
      <div className="h-32 bg-muted animate-pulse rounded-lg" />
    </div>
  )

  if (!isMounted) {
    return (
      <div className="w-[380px] border-r border-border bg-background overflow-y-auto scrollbar-hover">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Artifacts</h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-[380px] h-full border-r border-border bg-background ${needsScrollableContainer() ? 'overflow-y-auto scrollbar-hover' : 'overflow-hidden'}`}>
      <div className={`${(showImageGenerator || showVideoGenerator) ? 'p-4 space-y-4 h-full flex flex-col' : 'p-6 space-y-6'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{getDisplayTitle()}</h2>
          {shouldShowNewProjectButton() && <NewProjectButton />}
        </div>
        
        
        {(isImageGenerationSection(selectedSection) || isNewFormSection(selectedSection)) && showProjectForm && (
          renderSectionForm()
        )}
        
        {showImageGenerator && selectedProject && imageGeneratorSection === selectedSection && (
          selectedSection === 'illustration' ? (
            <IllustrationGeneratorInterface 
              onClose={handleCloseImageGenerator}
              projectTitle={selectedProject.title}
              projectData={selectedProject}
            />
          ) : selectedSection === 'avatars-personas' ? (
            <AvatarPersonaGeneratorInterface 
              onClose={handleCloseImageGenerator}
              projectTitle={selectedProject.title}
            />
          ) : selectedSection === 'product-mockups' ? (
            <ProductMockupGeneratorInterface 
              onClose={handleCloseImageGenerator}
              projectTitle={selectedProject.title}
              selectedArtifact={selectedProject as any}
            />
          ) : selectedSection === 'charts-infographics' ? (
            <ChartsInfographicsGeneratorInterface 
              onClose={handleCloseImageGenerator}
              projectTitle={selectedProject.title}
            />
          ) : selectedSection === 'concept-worlds' ? (
            <ConceptWorldsGeneratorInterface 
              onClose={handleCloseImageGenerator}
              projectTitle={selectedProject.title}
            />
          ) : (
            <ImageGeneratorInterface 
              onClose={handleCloseImageGenerator}
              projectTitle={selectedProject.title}
            />
          )
        )}
        
        {showVideoGenerator && selectedVideoProject && videoGeneratorSection === selectedSection && (
          <div className="flex-1 min-h-0">
            {selectedSection === 'explainers' ? (
              <ExplainerGeneratorInterface 
                onClose={handleCloseVideoGenerator}
                projectTitle={selectedVideoProject.title}
              />
            ) : (
              <VideoGeneratorInterface 
                onClose={handleCloseVideoGenerator}
                projectTitle={selectedVideoProject.title}
              />
            )}
          </div>
        )}
        
        {/* Voice Creation Interface */}
        {isVoiceCreationSection(selectedSection) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Craft unique, emotionally intelligent voices that match your world's DNA.</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowVoiceCreation(true)}
                className="flex items-center gap-2 text-xs bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
              >
                <Plus className="h-4 w-4" />
                New Voice
              </Button>
            </div>
            
            {showVoiceCreation && (
              <VoiceCreationInterface 
                onClose={handleCloseVoiceCreation}
                projectTitle="Voice Creation"
              />
            )}
          </div>
        )}
        
        {/* Voiceover Interface */}
        {isVoiceoverSection(selectedSection) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Generate high-quality voiceovers for your videos and projects.</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowVoiceover(true)}
                className="flex items-center gap-2 text-xs bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-500 hover:via-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
              >
                <Plus className="h-4 w-4" />
                New Voiceover
              </Button>
            </div>
            
            {showVoiceover && (
              <VoiceoverGeneratorInterface 
                onClose={handleCloseVoiceover}
                projectTitle="Voiceover Studio"
              />
            )}
          </div>
        )}

        {/* Sound FX Interface */}
        {isSoundFxSection(selectedSection) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Craft emotionally intelligent sound design synchronized with your world's mood and story.</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowSoundFx(true)}
                className="flex items-center gap-2 text-xs bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
              >
                <Plus className="h-4 w-4" />
                New Sound FX
              </Button>
            </div>
            
            {showSoundFx && (
              <SoundFxInterface 
                onClose={handleCloseSoundFx}
                projectTitle="Sound FX Studio"
              />
            )}
          </div>
        )}

        {/* Music & Jingles Interface */}
        {isMusicJingleSection(selectedSection) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Create custom music and jingles that perfectly match your brand and content needs.</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowMusicJingleGenerator(true)}
                className="flex items-center gap-2 text-xs bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 hover:from-rose-600 hover:via-pink-600 hover:to-fuchsia-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
              >
                <Plus className="h-4 w-4" />
                New Music Jingle
              </Button>
            </div>
            
            {showMusicJingleGenerator && (
              <MusicJingleGeneratorInterface 
                onClose={() => setShowMusicJingleGenerator(false)}
                projectTitle="Music & Jingle Studio"
              />
            )}
          </div>
        )}

        {/* Talking Avatars Interface */}
        {showTalkingAvatars && selectedTalkingAvatarProject && (
          <TalkingAvatarsGeneratorInterface 
            onClose={handleCloseTalkingAvatars}
            projectTitle={selectedTalkingAvatarProject.title}
            selectedArtifact={selectedTalkingAvatarProject as any}
          />
        )}

        {/* Diverse Motion Single Interface */}
        {showDiverseMotionSingle && (
          <DiverseMotionSingleInterface
            onClose={() => setShowDiverseMotionSingle(false)}
            projectTitle="New Diverse Motion - Single Asset"
          />
        )}

        {/* Diverse Motion Dual Interface */}
        {showDiverseMotionDual && (
          <DiverseMotionDualInterface
            onClose={() => setShowDiverseMotionDual(false)}
            projectTitle="New Diverse Motion - Dual Asset"
          />
        )}

        {/* Video Translation Interface */}
        {selectedSection === 'video-translate' && !showProjectForm && (
          <VideoTranslationInterface 
            onClose={() => setShowProjectForm(true)}
            projectTitle="Video Translation"
            hideHeader={true}
          />
        )}

        {/* Sound-to-Video Interface */}
        {selectedSection === 'add-sound' && !showProjectForm && (
          <SoundToVideoInterface 
            onClose={() => setShowProjectForm(true)}
            projectTitle="Add Sound to Video"
          />
        )}

        {/* Library Header */}
        {selectedSection === 'library' && (
          <LibraryHeader />
        )}
        
        {/* Explainers Video Library - Independent of artifact system */}
        {selectedSection === 'explainers' && !showVideoGenerator && !showProjectForm && (
          <>
            {console.log('🎬 GeneratorPanel: Rendering ExplainerVideoLibrary for explainers section')}
            {userId ? (
              <ExplainerVideoLibrary 
                userId={userId}
                onVideoSelect={(video) => {
                  console.log('Selected video:', video)
                }}
                onVideoClick={(video) => {
                  console.log('Video clicked, setting as selected artifact:', video)
                  // Convert video to artifact format for MainContent
                  const artifact = {
                    id: video.id,
                    title: video.title,
                    image: video.video_url || '/placeholder.jpg',
                    description: (video as any).description || 'Explainer video',
                    section: 'explainers',
                    type: 'explainer',
                    isPublic: false,
                    isDefault: false
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin mx-auto mb-2 rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading your videos...</p>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Loading state for all sections */}
        {false && selectedSection !== 'explainers' && (
          <LoadingSkeleton />
        )}
        
        {/* Artifacts grid - removed since artifacts are no longer used */}
        
        {/* Project grids */}
        {shouldShowProjectGrid() && selectedSection === 'comics' && !false && <ComicsGrid />}
        {shouldShowProjectGrid() && selectedSection !== 'comics' && selectedSection !== 'explainers' && selectedSection !== 'add-subtitles' && selectedSection !== 'add-sound' && selectedSection !== 'add-watermark' && !false && <ProjectGrid />}
        
        {/* Empty states */}
        {selectedSection === 'artifacts' && !false && true && !false && (
          <EmptyState message="" />
        )}
        
        
        {shouldShowEmptyState() && selectedSection !== 'explainers' && selectedSection !== 'add-subtitles' && selectedSection !== 'add-sound' && selectedSection !== 'add-watermark' && selectedSection !== 'social-cuts' && (
          <EmptyState message="" />
        )}
        
        {shouldShowEmptyState() && selectedSection === 'social-cuts' && (
          <div className="text-center py-12">
            <div className="max-w-lg mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                <span className="text-2xl">🚧</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Coming Soon
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Social Cuts feature is currently in development.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 border border-orange-200 rounded-full text-xs font-medium">
                <span>🚧</span>
                <span>Under Construction</span>
              </div>
            </div>
          </div>
        )}
        

        {/* Music Video Generator Interface */}
        {showMusicVideoGenerator && (
          <MusicVideoGeneratorInterface />
        )}
      </div>
    </div>
  )
}
