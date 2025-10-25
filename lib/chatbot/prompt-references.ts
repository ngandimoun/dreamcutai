/**
 * Prompt Reference Examples
 * 
 * These are NOT templates to copy. They are learning references that show
 * the DEPTH and STRUCTURE of professional prompts. Use them to understand
 * principles, then apply creatively to ANY user request.
 * 
 * Each example teaches specific lessons about prompt construction.
 */

export interface ReferenceExample {
  id: string
  scenario: string
  teaches: string[]
  keyLessons: string
  structure: Record<string, any>
}

/**
 * VIDEO REFERENCE EXAMPLES
 * Study these to learn techniques, not to memorize scenarios
 */
export const VIDEO_REFERENCES: ReferenceExample[] = [
  {
    id: 'cctv-dog-comedy',
    scenario: 'CCTV footage of dog watching TV',
    teaches: [
      'How camera POV choice (security cam) creates comedic tone',
      'Importance of specific action sequence (dog gets caught, reacts)',
      'Technical details that sell the concept (grainy texture, timestamp)',
      'How lighting reinforces setting (TV glow in dark room)',
      'Audio design that supports story (TV sounds, remote thump)'
    ],
    keyLessons: 'POV camera choice can transform a simple idea into comedy. Specific timing and reactions make it work.',
    structure: {
      shot: {
        composition: 'fixed wide-angle corner shot emulating indoor CCTV footage',
        lens: '4mm fisheye security camera lens',
        frame_rate: '15fps',
        camera_movement: 'static'
      },
      subject: {
        description: 'photorealistic golden retriever lying on a couch, reclined like a human',
        wardrobe: '',
        props: 'TV remote held in one paw, TV glowing in front'
      },
      scene: {
        location: 'cozy living room with a soft beige couch and coffee table',
        time_of_day: 'night',
        environment: 'TV light flickering on walls, room otherwise dim'
      },
      visual_details: {
        action: 'dog is watching TV intently, paw pressing buttons on remote; suddenly notices owner entering from hallway, quickly tosses the remote onto the coffee table and sits upright like nothing happened',
        special_effects: 'grainy CCTV texture with timestamp overlay in corner',
        hair_clothing_motion: 'slight tail wag before it freezes when owner is seen'
      },
      cinematography: {
        lighting: 'low indoor light dominated by TV glow',
        color_palette: 'cool blues from TV light with warm shadows',
        tone: 'comedic and lighthearted'
      },
      audio: {
        music: '',
        ambient: 'soft sound from TV show and faint hum of indoor appliances',
        sound_effects: 'slight thump of remote hitting table',
        mix_level: 'ambient dominant with TV audio slightly higher than background'
      }
    }
  },
  {
    id: 'pov-kart-racing',
    scenario: 'POV kart racing through shopping mall',
    teaches: [
      'How first-person POV creates maximum immersion',
      'Use of high frame rate for action (120fps for slow-mo bursts)',
      'Importance of obstacle details (kiosks, benches, pillars)',
      'Motion blur and visual effects for speed sensation',
      'Immersive surround audio from driver perspective'
    ],
    keyLessons: 'POV + high speed + obstacles + dynamic audio = adrenaline. Technical specs matter for action.',
    structure: {
      shot: {
        composition: 'POV from kart cockpit, hands gripping steering wheel tightly, mall corridors stretching ahead at high speed',
        lens: 'GoPro ultra-wide dynamic lens',
        frame_rate: '120fps with speed-ramped slow motion bursts',
        camera_movement: 'fast forward rush with rapid swerves, head-bob tracking turns'
      },
      subject: {
        description: 'driver\'s hands steering violently as kart races through shopping mall corridors',
        wardrobe: 'racing gloves visible on wheel',
        props: 'HUD-style speed overlay, sparks from ground scrapes'
      },
      scene: {
        location: 'immense modern shopping mall with long corridors and storefronts',
        time_of_day: 'bright artificial lighting',
        environment: 'scattered obstacles like kiosks, sign stands, benches, and mall decorations'
      },
      visual_details: {
        action: 'kart accelerates at full throttle, swerves tightly to dodge kiosks and benches, narrowly missing pillars as speed increases',
        special_effects: 'motion blur streaks, dynamic reflections on polished floor, dust trails kicking up'
      },
      cinematography: {
        lighting: 'bright mall lighting with glossy floor reflections',
        color_palette: 'neon highlights, polished silver, warm mall tones',
        tone: 'fast, intense, adrenaline-charged'
      },
      audio: {
        music: 'fast electronic pulse track with rising intensity',
        ambient: 'mall ambience fading into rushing wind',
        sound_effects: 'engine roar, sharp tire screeches, near-miss whooshes as kart dodges obstacles',
        mix_level: 'immersive surround from driver POV'
      }
    }
  },
  {
    id: 'futuristic-fashion-show',
    scenario: 'Kids fashion show with futuristic tech clothing',
    teaches: [
      'How low-angle positioning creates impact',
      'Importance of specific lighting (uplighting from glass runway)',
      'How LED/emissive elements add visual interest',
      'Transition techniques (focus rack between subjects)',
      'Atmospheric elements (clean haze, volumetric light)'
    ],
    keyLessons: 'Commercial-grade prompts need precise lighting, camera position, and atmospheric effects. Details sell luxury.',
    structure: {
      description: 'A hyper-realistic, eye-level shot of a futuristic kids\' fashion show. Three child models walk a runway made of illuminated glass, showcasing avant-garde, tech-infused clothing.',
      mood: 'Playful, futuristic, high-fashion, cool, confident',
      camera: {
        type: 'Static, Low-Angle Shot',
        lens: '50mm Signature Prime Lens',
        aperture: 'f/2.0',
        position: 'Positioned at the edge of the runway, low to the ground, looking up slightly at the models as they walk towards and past the camera',
        movement: 'Completely static, locked-off shot. The focus smoothly racks from one model to the next as they pass'
      },
      environment: {
        location: 'A minimalist, dark, and cavernous event hall',
        runway: 'A long, elevated runway constructed from panels of frosted, illuminated glass. The light from within the runway shifts in a slow, pulsing pattern of cool white and electric blue',
        background: 'The background is completely dark and out of focus, except for the abstract, soft bokeh from distant architectural lighting and the silhouettes of the audience',
        atmosphere: 'A light, clean haze hangs in the air, catching the light from the runway and creating subtle volumetric light effects'
      },
      lighting: {
        primary_source: {
          type: 'Illuminated Runway',
          position: 'Underneath the models',
          color: 'Shifts between cool white (6500K) and electric blue',
          intensity: 'Provides a strong, clean uplight that illuminates the models and their clothing from below'
        },
        secondary_source: {
          type: 'Tracking Spotlights',
          position: 'High above and slightly in front of the models',
          color_temperature: '5600K (Neutral Daylight)',
          intensity: 'Softly illuminates the models\' faces and the upper parts of their outfits, ensuring they are clearly visible'
        },
        emissive_lights: 'LED elements on the models\' clothing provide dynamic, moving points of light'
      },
      audio: {
        style: 'Chic, upbeat, and modern',
        music: 'A cool, upbeat, and minimalist electronic music track with a strong, clean beat and a playful synth melody'
      }
    }
  },
  {
    id: 'futuristic-home-interface',
    scenario: 'Person controlling smart home with gestures',
    teaches: [
      'How to transition between shot types (wide → orbit → macro)',
      'Importance of adaptive lighting that responds to actions',
      'Holographic UI and interface design descriptions',
      'Smooth camera movement for premium feel',
      'Refined spatial audio design'
    ],
    keyLessons: 'High-end tech demos need multiple shot types, responsive effects, and refined audio. Transitions create flow.',
    structure: {
      shot: {
        composition: 'wide establishing shots transitioning to medium orbit and macro close-up',
        lens: '24mm for wide interior, 50mm for orbit, 90mm macro for device',
        frame_rate: '30fps standard with subtle ramping during gesture moments',
        camera_movement: 'smooth orbital tracking around subject, gentle push-in for close-up'
      },
      subject: {
        description: 'androgynous individual interacting with futuristic home interface',
        wardrobe: 'monochromatic high-tech loungewear with subtle metallic textures',
        props: 'transparent ripple-reactive interfaces, glass-like control device'
      },
      scene: {
        location: 'suspended apartment overlooking neon cyberpunk cityscape',
        time_of_day: 'twilight',
        environment: 'minimalist architecture with panoramic windows, glowing neon haze outside'
      },
      visual_details: {
        action: 'gestures in air controlling environment, responsive lighting, final close-up of device',
        special_effects: 'holographic UI, liquid ripple transitions, adaptive lighting',
        hair_clothing_motion: 'minimal motion, soft fabric flow with elegant gesturing'
      },
      cinematography: {
        lighting: 'ambient interior glow with reactive accents, neon reflections',
        color_palette: 'cool cyans, deep purples, soft whites with glass highlights',
        tone: 'elevated, futuristic, serene'
      },
      audio: {
        music: 'ambient synthwave with digital chimes and subtle builds',
        ambient: 'soft city hum, electronic interface whispers',
        sound_effects: 'gesture-triggered whooshes, soft chime on logo',
        mix_level: 'refined spatial mix with immersive clarity'
      }
    }
  }
]

/**
 * IMAGE REFERENCE EXAMPLES
 * Study these to learn composition, lighting, and mood techniques
 */
export const IMAGE_REFERENCES: ReferenceExample[] = [
  {
    id: 'tokyo-rainy-cyberpunk',
    scenario: 'POV through car windshield at rainy Tokyo crossing',
    teaches: [
      'How POV framing creates immersion and context',
      'Layering atmospheric effects (rain, reflections, neon)',
      'Mixing photorealism with whimsical elements',
      'Specific color palette for cyberpunk mood',
      'Importance of environmental storytelling details'
    ],
    keyLessons: 'Atmosphere = weather + lighting + reflections + color. POV adds immersion. Mix realism with magic carefully.',
    structure: {
      view: 'POV from inside a car, dash-cam perspective through rain-streaked windshield',
      scene: {
        time: '02:00',
        city: 'Tokyo',
        location_detail: 'Shibuya Crossing',
        weather: 'torrential rain',
        ground_state: 'wet asphalt with puddles and reflective sheen',
        neon_signs: 'pink neon kanji reflected on road surface'
      },
      subjects: [
        {
          id: 'cat_bus',
          category: 'magical vehicle',
          style_hint: 'Ghibli-inspired (soft, friendly forms; not flat cel shading)',
          material: 'translucent body panels',
          scale: 'giant',
          state: 'idling at a red light',
          lighting: 'interior glowing soft amber',
          position: 'mid-ground, lane ahead of the car'
        },
        {
          id: 'girl',
          category: 'teenage human',
          footwear: 'LED sneakers (subtle light on soles)',
          wardrobe: 'rain-soaked streetwear',
          prop: 'transparent umbrella',
          pose_action: 'leans down and kisses the corgi',
          emotion: 'tender'
        },
        {
          id: 'corgi',
          category: 'dog',
          wardrobe: 'hoodie',
          pose_action: 'standing upright on hind legs under the umbrella',
          expression: 'content'
        }
      ],
      composition: {
        framing: 'windshield edges implied; subjects off-center for natural documentary feel',
        focus: 'sharp focus on girl and corgi; cat bus readable; foreground raindrops semi-sharp',
        depth_of_field: 'shallow-to-medium',
        scale_cues: ['zebra crosswalk', 'street signals', 'crowd silhouettes in rain']
      },
      cinematography: {
        lens: 'anamorphic look',
        effects: ['cinematic lens flares', 'slight chromatic aberration'],
        grade: 'high-contrast teal–orange with cyber-pink accents',
        texture: ['fine film-grain', 'puddle bokeh', 'steam wisps near street grates']
      },
      look_and_feel: {
        rendering_style: 'photoreal with whimsical magical-realism',
        mood: ['cozy', 'yearning'],
        palette: ['teal', 'orange', 'cyber-pink', 'amber', 'indigo']
      }
    }
  },
  {
    id: 'bus-stop-portrait',
    scenario: 'Young woman at foggy night-time bus stop',
    teaches: [
      'How specific percentages for emotion create nuance (70% annoyed, 30% amused)',
      'Importance of hidden details (reflection in shoe)',
      'Environmental storytelling (steamed glass, finger drawing)',
      'How fog can be used compositionally',
      'Cold color grading for night atmosphere'
    ],
    keyLessons: 'Emotional nuance through percentages. Hidden details reward close viewing. Weather creates atmosphere.',
    structure: {
      description: 'A hyper-realistic, 4K, full-body night-time portrait of a 23-year-old Korean woman',
      subject: {
        age: 23,
        ethnicity: 'Korean',
        skin_tone: 'pale',
        hair: {
          colour: 'black',
          style: 'long, straight, tucked behind one ear'
        },
        pose: 'standing at a frost-covered bus stop, arms folded against the cold',
        expression: '70% quiet annoyance, 30% amused resignation, as if re-reading a text she regrets sending'
      },
      outfit: {
        top_layers: ['black blazer', 'navy sweatshirt', 'crisp white dress shirt', 'thin black tie'],
        bottom: 'ultra-short black pleated skirt',
        legwear: 'brand-new white knee-length pelerine socks',
        footwear: 'polished black shoes'
      },
      environment: {
        location: 'night-time city bus stop',
        ground: 'icy pavement reflecting distant headlights',
        fog: 'dense, occupying the top third of the frame',
        bus_shelter: {
          glass: 'steamed-up with one finger-drawn smiley that melts faster than the surrounding condensation'
        },
        lighting: 'cool blue-white, high contrast, cinematic'
      },
      hidden_detail: 'reflection in her left shoe: a blurred red double-decker bus that may or may not be arriving',
      camera: {
        angle: 'low eye-level, full body in frame',
        lens_simulation: 'Phase-One medium-format realism',
        depth_of_field: 'sharp focus on subject, soft bokeh on distant lights'
      },
      output: {
        style: 'hyper-realistic, cinematic, cool colour grading'
      }
    }
  },
  {
    id: 'street-musician-simple',
    scenario: 'Street musician at dusk (simple format example)',
    teaches: [
      'How a single-line prompt can still be effective',
      'Pipe-separated format for quick copy-paste',
      'Essential elements: subject, lighting, mood, technical style',
      'When to use simple vs detailed formats'
    ],
    keyLessons: 'Not every prompt needs to be JSON. Simple pipe-separated format works for straightforward concepts.',
    structure: 'Street musician playing guitar at dusk, warm streetlights illuminating the crowd, rain-soaked cobblestones reflecting light | cinematic realism | moody urban lighting, shallow depth of field | natural expressions, dynamic composition, subtle lens flare'
  }
]

/**
 * KEY LESSONS SUMMARY
 * Extract these principles to apply to ANY scenario
 */
export const UNIVERSAL_LESSONS = {
  camera_choice: 'POV creates immersion, static observes, tracking adds energy, low-angle empowers, high-angle shows vulnerability',
  
  specificity: 'Always be specific: "golden retriever" not "dog", "24mm lens" not "wide", "70% annoyed" not "slightly annoyed"',
  
  layering: 'Great prompts layer multiple elements: lighting + weather + color + texture + atmosphere',
  
  storytelling: 'Hidden details reward viewers: reflections, small actions, environmental clues',
  
  mood_through_tech: 'Technical choices create mood: CCTV = comedy/surveillance, slow-mo = drama, POV = immersion',
  
  lighting_is_key: 'Lighting does heavy lifting for mood: TV glow = intimate, neon = cyberpunk, natural = authentic',
  
  format_flexibility: 'Match format to need: simple pipe-separated for quick use, detailed paragraph for clarity, JSON for technical control',
  
  audio_completes: 'For video, audio design is 50% of the experience: music, ambient, effects, mix priorities'
}

/**
 * Get all references for learning
 */
export function getAllReferences() {
  return {
    video: VIDEO_REFERENCES,
    image: IMAGE_REFERENCES,
    lessons: UNIVERSAL_LESSONS
  }
}

/**
 * Get reference by scenario (for AI to learn from, not match to)
 */
export function getReferenceById(id: string): ReferenceExample | undefined {
  return [...VIDEO_REFERENCES, ...IMAGE_REFERENCES].find(ref => ref.id === id)
}



