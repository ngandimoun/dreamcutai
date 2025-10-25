/**
 * Prompt Structure Framework
 * 
 * This file teaches the AI HOW to think about creating prompts for ANY scenario,
 * not WHAT specific prompts to generate. These are principles, not templates.
 */

export interface PromptElementGuide {
  category: string
  description: string
  purpose: string
  keyQuestions: string[]
  approaches: string[]
  whenToUse: string[]
}

/**
 * VIDEO PROMPT STRUCTURE FRAMEWORK
 * Apply these principles to ANY video idea the user imagines
 */
export const VIDEO_PROMPT_FRAMEWORK: Record<string, PromptElementGuide> = {
  shot: {
    category: 'SHOT',
    description: 'How the camera captures the scene - the technical foundation',
    purpose: 'Defines the viewers relationship to the subject and sets the visual tone',
    keyQuestions: [
      'What camera angle tells this story best?',
      'Should viewers feel close (intimate) or distant (observational)?',
      'Is the camera static (stable, observational) or moving (dynamic, immersive)?',
      'What lens creates the right emotion? (wide = epic, telephoto = intimate, fisheye = distorted)',
      'What frame rate? (24fps = cinematic, 60fps = smooth, 120fps = dramatic slow-mo)'
    ],
    approaches: [
      'POV (first-person) - Maximum immersion, viewers ARE the character',
      'Wide shot - Shows context, environment, scale',
      'Close-up - Emphasizes emotion, detail, intimacy',
      'Tracking shot - Follows action, creates energy and movement',
      'Static/locked-off - Observational, documentary feel, lets action unfold',
      'Orbital - Reveals subject from all angles, shows off design',
      'Low angle - Makes subject feel powerful, imposing',
      'High angle/birds-eye - Shows vulnerability, or provides god-like overview'
    ],
    whenToUse: [
      'Action scenes → tracking, handheld, dynamic movement',
      'Emotional moments → close-ups, slow camera movements',
      'Comedy → static, observational (like security cam)',
      'Product showcase → orbital, smooth sliders',
      'Immersive experience → POV, wide lenses'
    ]
  },

  subject: {
    category: 'SUBJECT',
    description: 'Who or what the viewer is watching - the star of the scene',
    purpose: 'Brings specificity and relatability to the prompt',
    keyQuestions: [
      'Who/what is the main focus?',
      'What are their physical characteristics? (age, appearance, species, etc.)',
      'What are they wearing? (tells us about character, time period, context)',
      'What props do they interact with?',
      'What makes them interesting or unique?'
    ],
    approaches: [
      'Specific details - "golden retriever" not just "dog"',
      'Human characteristics - posture, expression, personality traits',
      'Wardrobe tells story - formal suit vs casual vs futuristic tech wear',
      'Props reveal behavior - remote control, coffee mug, futuristic device',
      'Scale and presence - tiny, average, giant, imposing'
    ],
    whenToUse: [
      'Always be specific about species, age, ethnicity, style',
      'Add personality through posture and behavior',
      'Use wardrobe to set time period and character',
      'Props create interaction and story',
      'Consider what makes subject memorable'
    ]
  },

  scene: {
    category: 'SCENE',
    description: 'Where and when the action takes place - the world around the subject',
    purpose: 'Grounds the prompt in a believable environment and atmosphere',
    keyQuestions: [
      'Where is this happening? (be specific: living room, cyberpunk Tokyo street, etc.)',
      'What time of day? (affects lighting and mood)',
      'What is the weather/atmosphere? (rain, fog, clear, etc.)',
      'What environmental details make it feel real?',
      'Indoor or outdoor? Crowded or empty?'
    ],
    approaches: [
      'Specific locations - "cozy living room" vs "minimalist apartment" vs "abandoned warehouse"',
      'Time creates mood - dawn (hopeful), dusk (melancholic), night (mysterious)',
      'Weather adds drama - rain (emotional), fog (mysterious), sunshine (cheerful)',
      'Environmental storytelling - objects, decorations, wear and tear',
      'Atmosphere - clean, messy, futuristic, vintage, magical'
    ],
    whenToUse: [
      'Indoor scenes → describe furniture, decor, lighting sources',
      'Outdoor scenes → weather, landscape, urban vs nature',
      'Fantasy/sci-fi → unique environmental features',
      'Period pieces → era-appropriate details',
      'Product shots → minimal or context-rich depending on purpose'
    ]
  },

  visualDetails: {
    category: 'VISUAL DETAILS',
    description: 'What actually happens - the action and movement in the scene',
    purpose: 'Brings the prompt to life with specific behaviors and events',
    keyQuestions: [
      'What specific action is happening?',
      'What is the sequence of events?',
      'What are the small details that add personality?',
      'Are there any special effects needed?',
      'How do things move? (hair, clothing, objects)'
    ],
    approaches: [
      'Specific actions - not "dog moves" but "dog tosses remote onto table and sits upright"',
      'Sequence and timing - what happens first, then what',
      'Character behavior - personality through movement',
      'Special effects - particles, CGI, practical effects',
      'Motion details - fabric flow, hair movement, liquid dynamics',
      'Reactions and expressions - how subject responds to events'
    ],
    whenToUse: [
      'Comedy → precise timing of gags and reactions',
      'Drama → meaningful gestures and expressions',
      'Action → specific choreography and stunts',
      'Product demos → how item is used or shown',
      'Abstract → movement patterns and flow'
    ]
  },

  cinematography: {
    category: 'CINEMATOGRAPHY',
    description: 'The artistic style and mood - how it looks and feels',
    purpose: 'Elevates from functional to artistic, creates emotional impact',
    keyQuestions: [
      'What is the lighting like? (sources, temperature, mood)',
      'What colors dominate? (color palette)',
      'What is the overall tone/mood?',
      'What film or reference style?',
      'Clean and sharp or grainy and textured?'
    ],
    approaches: [
      'Lighting sources - natural sunlight, neon signs, TV glow, street lamps',
      'Color temperature - warm (cozy, nostalgic) vs cool (modern, mysterious)',
      'Color palette - specific colors that create mood (teal+orange, purple+pink)',
      'Tone - cinematic, documentary, security cam, commercial, artistic',
      'Texture - film grain, CCTV noise, pristine digital, vintage',
      'Contrast - high (dramatic) vs low (dreamy)'
    ],
    whenToUse: [
      'Emotional scenes → warm, soft lighting',
      'Thriller/mystery → cool, high contrast, shadows',
      'Comedy → bright, clear, natural',
      'Cyberpunk → neon, high contrast, colored lights',
      'Luxury/commercial → pristine, controlled lighting',
      'Vintage → grain, specific color grading'
    ]
  },

  audio: {
    category: 'AUDIO',
    description: 'The sound design - music, ambiance, and effects',
    purpose: 'Completes the immersion and reinforces mood',
    keyQuestions: [
      'What music style fits the mood?',
      'What ambient sounds create atmosphere?',
      'What sound effects emphasize action?',
      'What should be loudest in the mix?',
      'Dialogue or silent?'
    ],
    approaches: [
      'Music style - electronic, orchestral, acoustic, ambient, etc.',
      'Music mood - upbeat, tense, melancholic, mysterious',
      'Ambient sound - city noise, nature, indoor appliances, silence',
      'Sound effects - footsteps, whooshes, impacts, mechanical sounds',
      'Mix priorities - dialogue dominant, music dominant, ambient focused',
      'Spatial audio - surround, stereo, mono for effect'
    ],
    whenToUse: [
      'Action → impactful sound effects, intense music',
      'Drama → subtle ambient, emotional music',
      'Comedy → comedic timing in SFX, upbeat music',
      'Horror → sparse sound, sudden effects',
      'Commercial → clean, professional mix',
      'ASMR/ambient → focus on detailed environmental sounds'
    ]
  }
}

/**
 * IMAGE PROMPT STRUCTURE FRAMEWORK
 * Apply these principles to ANY image idea the user imagines
 */
export const IMAGE_PROMPT_FRAMEWORK: Record<string, PromptElementGuide> = {
  view: {
    category: 'VIEW/COMPOSITION',
    description: 'The camera perspective and framing',
    purpose: 'Establishes how the viewer sees and relates to the subject',
    keyQuestions: [
      'What camera angle creates the right emotion?',
      'How much of the subject do we see?',
      'First-person POV or observational?',
      'Centered or off-center composition?',
      'What framing emphasizes the message?'
    ],
    approaches: [
      'Camera angles - low (powerful), high (vulnerable), eye-level (neutral), dutch-tilt (unease)',
      'Framing - extreme close-up, close-up, medium, full-body, wide environmental',
      'POV options - first-person, third-person, bird's eye, worm's eye',
      'Composition rules - rule of thirds, centered symmetry, leading lines',
      'Aspect ratio - square, vertical (phone), horizontal (cinematic), panoramic'
    ],
    whenToUse: [
      'Portraits → close-up or medium, eye-level or slight angle',
      'Products → clean centered or rule-of-thirds',
      'Environmental → wide to show context',
      'Dramatic → low or high angles',
      'Immersive → POV perspective'
    ]
  },

  subject: {
    category: 'SUBJECT',
    description: 'The main focus of the image',
    purpose: 'Creates specificity and emotional connection',
    keyQuestions: [
      'Who or what is the subject?',
      'What is their pose and expression?',
      'What are they wearing?',
      'What emotion are they conveying?',
      'What makes them visually interesting?'
    ],
    approaches: [
      'Detailed description - specific age, ethnicity, features',
      'Pose - standing, sitting, dynamic action, relaxed',
      'Expression - specific emotions (70% annoyance, 30% amusement)',
      'Wardrobe - style, era, colors, condition',
      'Accessories - jewelry, props, items held',
      'Body language - confident, shy, aggressive, peaceful'
    ],
    whenToUse: [
      'Portraits → focus on expression and personality',
      'Fashion → emphasize clothing and style',
      'Products → subject may be the product itself',
      'Storytelling → pose and props tell narrative',
      'Abstract → subject might be shapes, colors, concepts'
    ]
  },

  scene: {
    category: 'SCENE',
    description: 'The environment and setting',
    purpose: 'Provides context and atmosphere',
    keyQuestions: [
      'Where is this taking place?',
      'What time of day/year?',
      'What's the weather?',
      'What environmental details matter?',
      'Indoor or outdoor?'
    ],
    approaches: [
      'Location specificity - "frost-covered bus stop" not just "bus stop"',
      'Time indicators - dawn, noon, dusk, night, golden hour',
      'Weather effects - rain, fog, snow, sunshine, clouds',
      'Ground state - wet pavement, icy, dusty, pristine',
      'Background elements - architecture, nature, objects',
      'Atmosphere - clear, hazy, foggy, smoky'
    ],
    whenToUse: [
      'Outdoor → weather and time of day critical',
      'Urban → specific city or architectural style',
      'Indoor → furniture, decor, lighting',
      'Studio → minimal or elaborate backdrop',
      'Natural → landscape features and conditions'
    ]
  },

  lighting: {
    category: 'LIGHTING',
    description: 'How light shapes the image and mood',
    purpose: 'Creates atmosphere and guides viewer's eye',
    keyQuestions: [
      'What are the light sources?',
      'Warm or cool color temperature?',
      'Soft and diffused or hard and dramatic?',
      'Where is light coming from?',
      'What mood does lighting create?'
    ],
    approaches: [
      'Natural light - sunlight, golden hour, overcast, moonlight',
      'Artificial light - streetlights, neon, indoor lamps, studio lights',
      'Color temperature - warm (2700K-4000K) vs cool (5000K-7000K)',
      'Quality - soft (diffused) vs hard (sharp shadows)',
      'Direction - front, back, side, top, bottom lit',
      'Mood - bright & cheerful, dim & mysterious, dramatic & contrasty'
    ],
    whenToUse: [
      'Portraits → soft, flattering light from angle',
      'Drama → hard light with strong shadows',
      'Product → clean, even lighting or creative accents',
      'Night scenes → mix of ambient and accent lights',
      'Cyberpunk → neon, colored lights, high contrast'
    ]
  },

  cinematography: {
    category: 'CINEMATOGRAPHY',
    description: 'Technical camera and lens characteristics',
    purpose: 'Achieves specific visual style and technical quality',
    keyQuestions: [
      'What lens/focal length creates desired effect?',
      'How much depth of field?',
      'What camera/film style to reference?',
      'Any special optical effects?',
      'Digital clean or film texture?'
    ],
    approaches: [
      'Lens simulation - wide-angle (24mm), normal (50mm), telephoto (85mm+), macro',
      'Depth of field - shallow (blurred background) vs deep (all in focus)',
      'Camera references - Phase One, Canon 5D, iPhone, film camera',
      'Optical effects - bokeh, lens flare, chromatic aberration, vignette',
      'Film stock - Kodak Portra, Fuji, digital pristine',
      'Format - full-frame, medium format, phone camera'
    ],
    whenToUse: [
      'Portraits → 85mm+ with shallow depth of field',
      'Landscapes → wide angle with deep focus',
      'Products → macro for details or normal for context',
      'Cinematic look → film grain, color grading',
      'Realistic → full frame digital simulation'
    ]
  },

  lookAndFeel: {
    category: 'LOOK & FEEL',
    description: 'Overall aesthetic style and emotional tone',
    purpose: 'Unifies all elements into cohesive artistic vision',
    keyQuestions: [
      'What overall style? (photorealistic, artistic, stylized)',
      'What mood should viewer feel?',
      'What color palette dominates?',
      'What references or aesthetics to evoke?',
      'Any specific artistic movement or era?'
    ],
    approaches: [
      'Style - hyperrealistic, cinematic realism, artistic, painterly, minimalist',
      'Mood - cozy, tense, melancholic, joyful, mysterious, serene',
      'Color palette - complementary, analogous, monochrome, vibrant, muted',
      'References - Blade Runner, Wes Anderson, street photography, fashion editorial',
      'Era - modern, vintage, retro, futuristic',
      'Texture - clean, gritty, ethereal, glossy'
    ],
    whenToUse: [
      'Commercial → clean, polished, specific brand aesthetic',
      'Artistic → creative interpretation, unique style',
      'Editorial → fashion forward, trendsetting',
      'Documentary → realistic, authentic, minimal manipulation',
      'Fantasy → otherworldly, imaginative, non-realistic'
    ]
  }
}

/**
 * THINKING FRAMEWORK - Helps AI approach ANY request creatively
 */
export interface ThinkingFramework {
  step: number
  name: string
  questions: string[]
  actions: string[]
}

export const CREATIVE_PROMPT_PROCESS: ThinkingFramework[] = [
  {
    step: 1,
    name: 'UNDERSTAND INTENT',
    questions: [
      'Is this for video or image?',
      'What is the main subject or idea?',
      'What mood or feeling do they want?',
      'Is there a specific style reference?',
      'What will this be used for?'
    ],
    actions: [
      'Identify the asset type',
      'Extract the core concept',
      'Detect any mood keywords',
      'Note any style references mentioned',
      'Consider the use case if mentioned'
    ]
  },
  {
    step: 2,
    name: 'EXPAND CREATIVELY',
    questions: [
      'What camera approach would work best?',
      'What specific details would make this vivid?',
      'What time and place enhance the concept?',
      'What lighting creates the right mood?',
      'What unexpected element adds wow factor?'
    ],
    actions: [
      'Choose appropriate camera angle and movement',
      'Add specific descriptive details',
      'Set time, location, and atmosphere',
      'Design lighting to match mood',
      'Consider one unique creative touch'
    ]
  },
  {
    step: 3,
    name: 'PROVIDE OPTIONS',
    questions: [
      'What are 2-3 different approaches?',
      'Which interpretation fits different moods?',
      'What complexity levels make sense?'
    ],
    actions: [
      'Offer simple (text), detailed (paragraph), and structured (JSON) versions',
      'Provide 2-3 creative variations if concept is ambiguous',
      'Explain briefly why each approach works'
    ]
  }
]

/**
 * Helper function to get relevant framework based on asset type
 */
export function getPromptFramework(assetType: 'video' | 'image') {
  return assetType === 'video' ? VIDEO_PROMPT_FRAMEWORK : IMAGE_PROMPT_FRAMEWORK
}

/**
 * Get the thinking process for generating prompts
 */
export function getCreativeProcess(): ThinkingFramework[] {
  return CREATIVE_PROMPT_PROCESS
}



