"use client"

import { useState } from "react"
import { Globe, Lock, Palette, Sparkles, Package, BarChart3, User } from "lucide-react"
import { useNavigation } from "@/hooks/use-navigation"
import { CharacterVariations } from "@/components/character-variations"
import { LibraryInterface } from "@/components/library-interface"
import { LibraryGrid } from "@/components/library-grid"
import { Button } from "@/components/ui/button"
import { PreviousGenerations } from "@/components/ui/previous-generations"
import { useAuth } from "@/components/auth/auth-provider"
import { SubtitleInterface } from "@/components/subtitle-interface"
import { WatermarkInterface } from "@/components/watermark-interface"

export function MainContent() {
  const { 
    getDisplayTitle, 
    selectedSection, 
    characterVariations = [], 
    characterVariationsMetadata,
    isGeneratingVariations = false,
    showProjectForm,
    setShowProjectForm
  } = useNavigation()
  const { user } = useAuth()
  const [selectedVariation, setSelectedVariation] = useState<number | undefined>(undefined)

  // Debug global context
  console.log('🔍 MainContent global context:', {
    selectedSection,
    ...(characterVariations.length > 0 || isGeneratingVariations ? {
      characterVariationsCount: characterVariations.length,
      isGeneratingVariations,
      characterVariations: characterVariations
    } : {})
  })

  const handleSelectVariation = (index: number) => {
    console.log('🎯 Variation selected:', index)
    setSelectedVariation(index)
    console.log('🔄 Selected variation state updated to:', index)
  }


  return (
    <div className="flex-1 overflow-y-auto scrollbar-hover">
      <div className="p-8">
        
        {/* Character Variations for Comics section */}
        {selectedSection === 'comics' && (characterVariations.length > 0 || isGeneratingVariations) && (
          <div className="space-y-6">
            <CharacterVariations
              variations={characterVariations}
              variationsMetadata={characterVariationsMetadata || undefined}
              isLoading={isGeneratingVariations}
              onSelect={handleSelectVariation}
              onRegenerate={() => console.log('Regenerate clicked')}
              selectedIndex={selectedVariation}
            />
          </div>
        )}

        {selectedSection === 'add-watermark' && !showProjectForm && (
          <div className="space-y-6">
            <WatermarkInterface 
              onClose={() => setShowProjectForm(true)}
              projectTitle="Watermark Studio"
              hideCloseButton
              emptyState={(
                <div className="text-center py-12">
                  <div className="max-w-2xl mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-100 to-purple-100 flex items-center justify-center">
                      <span className="text-2xl">💧</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                      💧 Watermark Studio
                    </h2>
                    <div className="bg-gradient-to-r from-cyan-50 to-purple-50 border border-cyan-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-cyan-800 font-medium">
                        ✨ Protégez vos vidéos avec des filigranes personnalisés et élégants.
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Ajoutez rapidement un watermark DREAMCUT ou créez le vôtre avec taille et placement sur mesure. Idéal pour vos contenus sociaux, tutoriels et vidéos professionnelles.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      <span>Cliquez sur "New Watermark" pour générer votre première vidéo filigranée</span>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        )}
        
        {/* Library section */}
        {selectedSection === 'library' && (
          <LibraryGrid columns={3} />
        )}
        
        
        
        {/* Illustration section - Previous Generations */}
        {selectedSection === 'illustration' && (
          <div className="space-y-6">
            <PreviousGenerations 
              contentType="illustrations" 
              userId={user?.id || ''} 
            />
          </div>
        )}

        {/* Product Mockups section - Previous Generations */}
        {selectedSection === 'product-mockups' && (
          <div className="space-y-6">
            <PreviousGenerations 
              contentType="product_mockups" 
              userId={user?.id || ''} 
            />
          </div>
        )}

        {/* Concept Worlds section - Previous Generations */}
        {selectedSection === 'concept-worlds' && (
          <div className="space-y-6">
            <PreviousGenerations 
              contentType="concept_worlds" 
              userId={user?.id || ''} 
            />
          </div>
        )}

        {/* Charts & Infographics section - Previous Generations */}
        {selectedSection === 'charts-infographics' && (
          <div className="space-y-6">
            <PreviousGenerations 
              contentType="charts_infographics" 
              userId={user?.id || ''} 
            />
          </div>
        )}

        {/* Music Videos section - Previous Generations */}
        {selectedSection === 'music-videos' && (
          <div className="space-y-6">
            <PreviousGenerations 
              contentType="music_videos" 
              userId={user?.id || ''} 
            />
          </div>
        )}

        {/* Charts & Infographics section - Project details or Welcome message (OLD) */}
        {false && selectedSection === 'charts-infographics' && (
          false ? (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Project Image */}
                <div className="overflow-hidden rounded-lg border border-border">
                  <img 
                    src={"/placeholder.jpg"} 
                    alt={"Placeholder Title"}
                    className="w-full h-auto object-contain"
                  />
                </div>
                
                {/* Project Details */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">
                      {"Placeholder Title"}
                    </h2>
                  </div>
                  
                  {/* Project Status */}
                  <div className="flex items-center gap-2">
                    {false ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-sm">
                        <Globe className="h-4 w-4" />
                        Public
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-sm">
                        <Lock className="h-4 w-4" />
                        Private
                      </div>
                    )}
                  </div>
                  
                  {/* Project Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {"Placeholder description"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="max-w-lg mx-auto">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-lime-100 to-green-100 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-lime-600" />
                </div>
                <h2 className="text-xl font-bold mb-3 bg-gradient-to-r from-lime-600 via-green-500 to-emerald-500 bg-clip-text text-transparent">
                  Welcome to Charts & Infographics
                </h2>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Transform your data into beautiful visualizations with smart styling and custom branding. 
                  Create compelling charts, infographics, and data stories that communicate insights clearly 
                  and professionally across any platform.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  <span>Click "New Project" to create your first chart or infographic</span>
                </div>
              </div>
            </div>
          )
        )}

        {/* Avatars & Personas section - Previous Generations */}
        {selectedSection === 'avatars-personas' && (
          <div className="space-y-6">
            <PreviousGenerations 
              contentType="avatars_personas" 
              userId={user?.id || ''} 
            />
          </div>
        )}

        {/* Avatars & Personas section - Project details or Welcome message (OLD) */}
        {false && selectedSection === 'avatars-personas' && (
          false ? (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Project Image */}
                <div className="overflow-hidden rounded-lg border border-border">
                  <img 
                    src={"/placeholder.jpg"} 
                    alt={"Placeholder Title"}
                    className="w-full h-auto object-contain"
                  />
                </div>
                
                {/* Project Details */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">
                      {"Placeholder Title"}
                    </h2>
                  </div>
                  
                  {/* Project Status */}
                  <div className="flex items-center gap-2">
                    {false ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-sm">
                        <Globe className="h-4 w-4" />
                        Public
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-sm">
                        <Lock className="h-4 w-4" />
                        Private
                      </div>
                    )}
                  </div>
                  
                  {/* Project Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {"Placeholder description"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="max-w-lg mx-auto">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold mb-3 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                  Welcome to Avatars & Personas
                </h2>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Create AI-powered character avatars with unique personalities and appearances. Design custom personas 
                  with specific roles, demographics, and visual styles to bring your creative projects to life with 
                  authentic and engaging characters.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  <span>Click "New Project" to create your first avatar or persona</span>
                </div>
              </div>
            </div>
          )
        )}

        {/* Music & Jingles section - Previous Generations */}
        {selectedSection === 'music-jingles' && (
          <div className="space-y-6">
            <PreviousGenerations 
              contentType="music_jingles" 
              userId={user?.id || ''} 
            />
          </div>
        )}

        {/* Voice Creation section - Previous Generations */}
        {selectedSection === 'voice-creation' && (
          <div className="space-y-6">
            <PreviousGenerations 
              contentType="voices_creations" 
              userId={user?.id || ''} 
            />
          </div>
        )}

        {/* Voiceovers section - Previous Generations */}
        {selectedSection === 'voiceovers' && (
          <div className="space-y-6">
            <PreviousGenerations 
              contentType="voiceovers" 
              userId={user?.id || ''} 
            />
          </div>
        )}

        {/* Sound FX section - Previous Generations */}
        {selectedSection === 'sound-fx' && (
          <div className="space-y-6">
            <PreviousGenerations 
              contentType="sound_fx" 
              userId={user?.id || ''} 
            />
          </div>
        )}

        {/* Music & Jingles section - Project details or Welcome message (OLD) */}
        {false && selectedSection === 'music-jingles' && (
          false ? (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Project Image */}
                <div className="overflow-hidden rounded-lg border border-border">
                  <img 
                    src={"/placeholder.jpg"} 
                    alt={"Placeholder Title"}
                    className="w-full h-auto object-contain"
                  />
                </div>
                
                {/* Project Details */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">
                      {"Placeholder Title"}
                    </h2>
                  </div>
                  
                  {/* Project Status */}
                  <div className="flex items-center gap-2">
                    {false ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-sm">
                        <Globe className="h-4 w-4" />
                        Public
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-sm">
                        <Lock className="h-4 w-4" />
                        Private
                      </div>
                    )}
                  </div>
                  
                  {/* Project Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {"Placeholder description"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-lg mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                  <span className="text-2xl">🎵</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  🎵 No music jingles yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first music jingle to get started.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span>Click "New Music Jingle" to create your first musical piece</span>
                </div>
              </div>
            </div>
          )
        )}

        {/* Social Cuts section - Coming Soon */}
        {selectedSection === 'social-cuts' && (
          <div className="text-center py-16">
            <div className="max-w-2xl mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                <span className="text-4xl">✂️</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Social Cuts
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Create engaging social media clips and viral content that captures attention and drives engagement.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 border border-orange-200 rounded-full text-sm font-medium">
                <span>🚧</span>
                <span>Coming Soon</span>
              </div>
            </div>
          </div>
        )}


        {/* Explainers section - Previous Generations */}
        {selectedSection === 'explainers' && (
          <div className="space-y-6">
            <PreviousGenerations 
              contentType="explainers" 
              userId={user?.id || ''} 
            />
          </div>
        )}

        {/* Explainers section - Project details or Attention Message (OLD) */}
        {false && selectedSection === 'explainers' && (
          false ? (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Project Image/Video */}
                <div className="overflow-hidden rounded-lg border border-border">
                  {false ? (
                    <video
                      src={"/placeholder.jpg"}
                      controls
                      className="w-full h-auto object-contain"
                      poster="/placeholder.jpg"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img 
                      src={"/placeholder.jpg"} 
                      alt={"Placeholder Title"}
                      className="w-full h-auto object-contain"
                    />
                  )}
                </div>
                
                {/* Project Details */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">
                      {"Placeholder Title"}
                    </h2>
                  </div>
                  
                  {/* Project Status */}
                  <div className="flex items-center gap-2">
                    {false ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-sm">
                        <Globe className="h-4 w-4" />
                        Public
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-sm">
                        <Lock className="h-4 w-4" />
                        Private
                      </div>
                    )}
                  </div>
                  
                  {/* Project Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {"Placeholder description"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-2xl mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  🎯 Explainers Studio
                </h2>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-800 font-medium">
                    ✨ Transform complex ideas into engaging animated explanations that captivate your audience!
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Create professional explainer videos with AI-powered animations, custom voiceovers, and dynamic visual effects. 
                  Perfect for product demos, educational content, and marketing campaigns.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  <span>Click "New Project" to start creating your first explainer video</span>
                </div>
              </div>
            </div>
          )
        )}

        {/* Talking Avatars section - Previous Generations */}
        {selectedSection === 'talking-avatars' && (
          <div className="space-y-6">
            <PreviousGenerations 
              contentType="talking_avatars" 
              userId={user?.id || ''} 
            />
          </div>
        )}

        {/* Diverse Motion Single section - Previous Generations */}
        {selectedSection === 'diverse-motion-single' && (
          <div className="space-y-6">
            <PreviousGenerations 
              contentType="diverse_motion_single" 
              userId={user?.id || ''} 
            />
          </div>
        )}

        {/* Diverse Motion Dual section - Previous Generations */}
        {selectedSection === 'diverse-motion-dual' && (
          <div className="space-y-6">
            <PreviousGenerations 
              contentType="diverse_motion_dual" 
              userId={user?.id || ''} 
            />
          </div>
        )}

        {/* Talking Avatars section - Project details or Attention Message (OLD) */}
        {false && selectedSection === 'talking-avatars' && (
          false ? (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Project Image */}
                <div className="overflow-hidden rounded-lg border border-border">
                  <img 
                    src={"/placeholder.jpg"} 
                    alt={"Placeholder Title"}
                    className="w-full h-auto object-contain"
                  />
                </div>
                
                {/* Project Details */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">
                      {"Placeholder Title"}
                    </h2>
                  </div>
                  
                  {/* Project Status */}
                  <div className="flex items-center gap-2">
                    {false ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-sm">
                        <Globe className="h-4 w-4" />
                        Public
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-sm">
                        <Lock className="h-4 w-4" />
                        Private
                      </div>
                    )}
                  </div>
                  
                  {/* Project Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {"Placeholder description"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-2xl mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                  <span className="text-2xl">🗣️</span>
                </div>
                <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 bg-clip-text text-transparent">
                  🗣️ Talking Avatars
                </h2>
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-pink-800 font-medium">
                    🎭 Bring your avatars to life with realistic speech and natural expressions!
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Create engaging talking avatar videos with synchronized lip-sync, facial expressions, and natural voice synthesis. 
                  Perfect for presentations, tutorials, and interactive content.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  <span>Click "New Project" to create your first talking avatar</span>
                </div>
              </div>
            </div>
          )
        )}

        {/* Add Subtitles section - Project details or Attention Message */}
        {selectedSection === 'add-subtitles' && !showProjectForm && (
          <div className="space-y-6">
            <SubtitleInterface 
              onClose={() => setShowProjectForm(true)}
              projectTitle="Subtitles Studio"
              emptyState={(
                <div className="text-center py-12">
                  <div className="max-w-2xl mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <span className="text-2xl">🎬</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
                      🎬 Subtitles Studio
                    </h2>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-blue-800 font-medium">
                        ✨ Transform your videos with professional, AI-powered subtitles that engage your audience!
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Create accurate, customizable subtitles with AI transcription, emoji enrichment, keyword emphasis, 
                      and stunning visual styles. Perfect for social media content, tutorials, and professional videos.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      <span>Click "New Project" pour ajouter des sous-titres à votre première vidéo</span>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        )}

        {/* Video Translation section */}
        {selectedSection === 'video-translate' && (
          <div className="text-center py-12">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                <span className="text-2xl">🌍</span>
              </div>
              <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                🌍 Video Translation
              </h2>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800 font-medium">
                  ✨ Translate videos into over 150 languages with AI-powered technology!
                </p>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Break language barriers and reach global audiences. Upload your video, select your target language, 
                and get professional translations with synchronized audio and subtitles.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>Click "New Translation" to translate your first video</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
