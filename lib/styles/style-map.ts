import { StyleMap } from '@/lib/types/product-mockup';

export const STYLE_MAP: StyleMap = {
  /* ========================= Realism Cluster ========================= */

  "Realistic Studio": [
    {
      label: "Softbox Hero",
      desc: "Clean studio hero with balanced highlights",
      lightingPresets: [
        { name: "Softbox 45°", mood: "Even key, soft shadow", hints: ["no_harsh_shadows"] },
        { name: "Key+Rim", mood: "Bright face, crisp edge light", hints: ["prefer_rim"] },
        { name: "Gradient Back", mood: "Subtle hue fade backdrop" }
      ],
      backgroundEnvironments: [
        { name: "White Cyclorama", mood: "Pure studio curve", paletteHints: ["neutralWarm","neutralCool"] },
        { name: "Paper Roll", mood: "Seamless backdrop", paletteHints: ["brandPrimary"] },
        { name: "Gradient Wall", mood: "Soft color fade", paletteHints: ["brandSecondary"] }
      ],
      moodContexts: [
        { name: "Clean Minimal", effect: { contrastDelta: -10, saturationDelta: -10, temp: "neutral", fontBias: "sans", ctaStyleHints: ["no_bg","underline"] } },
        { name: "Premium",      effect: { contrastDelta: +10, saturationDelta: +5,  temp: "cool",    fontBias: "serif", ctaStyleHints: ["boxed_glow"] } },
        { name: "Energetic",    effect: { contrastDelta: +20, saturationDelta: +20, temp: "warm",    fontBias: "condensed", ctaStyleHints: ["underline"] } }
      ],
      compositionHints: {
        templates: ["Centered Hero","Rule of Thirds"],
        defaultObjectCount: 1,
        shadow: ["Soft","Mirror"]
      },
      materialBias: { prefer: ["metal","glass","acrylic"], avoid: [] }
    },
    {
      label: "Macro Material Focus",
      desc: "Close-up textures for materials & details",
      lightingPresets: [
        { name: "Top Beam", mood: "Tight highlight", hints: [] },
        { name: "Low Fill", mood: "Shadow depth for texture", hints: [] }
      ],
      backgroundEnvironments: [
        { name: "Neutral Matte", mood: "No reflections", paletteHints: ["neutralCool"] },
        { name: "Paper Texture", mood: "Soft fiber detail", paletteHints: ["neutralWarm"] }
      ],
      moodContexts: [
        { name: "Precision", effect: { contrastDelta: +15, saturationDelta: -5, temp: "neutral", fontBias: "sans" } },
        { name: "Luxury",    effect: { contrastDelta: +10, saturationDelta: +10, temp: "warm",   fontBias: "serif", ctaStyleHints: ["boxed_glow"] } }
      ],
      compositionHints: { templates: ["Centered Hero"], defaultObjectCount: 1, shadow: ["Soft"] },
      materialBias: { prefer: ["metal","leather","fabric"], avoid: [] }
    },
    {
      label: "Product in Hand",
      desc: "Human touch for scale & trust",
      lightingPresets: [
        { name: "Ambient Overcast", mood: "Soft daylight", hints: ["no_harsh_shadows"] },
        { name: "Window Key", mood: "Directional natural light" }
      ],
      backgroundEnvironments: [
        { name: "Studio Neutral", mood: "Subtle grey", paletteHints: ["neutralCool"] },
        { name: "Soft Home Set", mood: "Implied lifestyle", paletteHints: ["neutralWarm"] }
      ],
      moodContexts: [
        { name: "Trust",   effect: { contrastDelta: -5, saturationDelta: 0, temp: "neutral", fontBias: "rounded" } },
        { name: "Warmth",  effect: { contrastDelta: 0,  saturationDelta: +10, temp: "warm", fontBias: "sans" } }
      ],
      compositionHints: { templates: ["Rule of Thirds"], defaultObjectCount: 1, shadow: ["Soft"] },
      materialBias: { prefer: ["all"], avoid: [] }
    }
  ],

  "Lifestyle Documentary": [
    {
      label: "Morning Routine",
      desc: "Natural, lived-in vibe",
      lightingPresets: [
        { name: "Diffuse Daylight", mood: "Soft room light", hints: ["no_harsh_shadows"] },
        { name: "Backlit Window",  mood: "Gentle rim from window" }
      ],
      backgroundEnvironments: [
        { name: "Bathroom Counter", mood: "Tiles & mirror", materialHints: ["marble"] },
        { name: "Kitchen Top",      mood: "Wood & ceramic", materialHints: ["wood"] }
      ],
      moodContexts: [
        { name: "Natural",   effect: { contrastDelta: -10, saturationDelta: -5,  temp: "neutral", fontBias: "sans" } },
        { name: "Fresh",     effect: { contrastDelta: 0,   saturationDelta: +10, temp: "cool",    fontBias: "rounded" } }
      ],
      compositionHints: { templates: ["Rule of Thirds","Collage"], defaultObjectCount: 1, shadow: ["Soft"] },
      materialBias: { prefer: ["glass","fabric","wood"], avoid: ["high_gloss"] }
    },
    {
      label: "Urban On-the-Go",
      desc: "Street authenticity",
      lightingPresets: [
        { name: "Golden Diffuse", mood: "Late afternoon warmth" },
        { name: "Even Ambient",  mood: "Balanced outdoor tone" }
      ],
      backgroundEnvironments: [
        { name: "Street Scene",   mood: "Candid backdrop" },
        { name: "Desk to Go",     mood: "Work essentials flat" }
      ],
      moodContexts: [
        { name: "Confident", effect: { contrastDelta: +10, saturationDelta: +5, temp: "warm", fontBias: "condensed" } },
        { name: "Relaxed",   effect: { contrastDelta: -5,  saturationDelta: -5, temp: "neutral", fontBias: "sans" } }
      ],
      compositionHints: { templates: ["Rule of Thirds","Centered Hero"], defaultObjectCount: 1, shadow: ["Soft"] },
      materialBias: { prefer: ["all"], avoid: [] }
    }
  ],

  "Minimalist Editorial": [
    {
      label: "Floating Object",
      desc: "Clean negative space with levitation",
      lightingPresets: [
        { name: "Top Beam", mood: "Strong downlight" },
        { name: "Studio Gradient Backlight", mood: "Soft hue fade" }
      ],
      backgroundEnvironments: [
        { name: "White Void", mood: "Pure minimal field" },
        { name: "Pastel Gradient", mood: "Brand-tinted backdrop", paletteHints: ["brandSecondary"] }
      ],
      moodContexts: [
        { name: "Minimal",   effect: { contrastDelta: -5,  saturationDelta: -10, temp: "neutral", fontBias: "sans", ctaStyleHints: ["no_bg"] } },
        { name: "Playful",   effect: { contrastDelta: +5,  saturationDelta: +20, temp: "warm",    fontBias: "rounded", ctaStyleHints: ["underline"] } }
      ],
      compositionHints: { templates: ["Centered Hero"], defaultObjectCount: 1, shadow: ["Floating"] },
      materialBias: { prefer: ["all"], avoid: [] }
    },
    {
      label: "Flat Lay",
      desc: "Top-down editorial arrangement",
      lightingPresets: [
        { name: "Even Diffuse", mood: "Shadowless flat light", hints: ["no_harsh_shadows"] },
        { name: "Softbox Glow", mood: "Gentle gradient" }
      ],
      backgroundEnvironments: [
        { name: "Paper Sheet", mood: "Soft fiber texture", materialHints: ["paper"] },
        { name: "Marble Slab", mood: "Premium minimal", materialHints: ["marble"] }
      ],
      moodContexts: [
        { name: "Orderly", effect: { contrastDelta: 0, saturationDelta: -5, temp: "neutral", fontBias: "sans" } },
        { name: "Chic",    effect: { contrastDelta: +10, saturationDelta: 0, temp: "cool", fontBias: "serif" } }
      ],
      compositionHints: { templates: ["Flat Lay","Collage"], defaultObjectCount: 3, shadow: ["Soft"] },
      materialBias: { prefer: ["fabric","paper","marble"], avoid: [] }
    }
  ],

  "Luxury Commercial": [
    {
      label: "Gold-Edge Glow",
      desc: "Cinematic warmth with reflective richness",
      lightingPresets: [
        { name: "Rim Glow", mood: "Edge highlight, soft center", hints: ["prefer_rim"] },
        { name: "Reflective Bounce", mood: "Gloss emphasis on curves" }
      ],
      backgroundEnvironments: [
        { name: "Velvet Backdrop", mood: "Deep texture luxe", materialHints: ["velvet"], paletteHints: ["neutralWarm"] },
        { name: "Mirror Floor",    mood: "Elegant reflection", materialHints: ["glass"] }
      ],
      moodContexts: [
        { name: "Indulgent", effect: { contrastDelta: +15, saturationDelta: +10, temp: "warm", fontBias: "serif", ctaStyleHints: ["boxed_glow"] } },
        { name: "Black-Tie", effect: { contrastDelta: +25, saturationDelta: -10, temp: "cool", fontBias: "serif", ctaStyleHints: ["underline"] } }
      ],
      compositionHints: { templates: ["Centered Hero","Rule of Thirds"], defaultObjectCount: 1, shadow: ["Mirror","Soft"] },
      materialBias: { prefer: ["glass","metal"], avoid: [] }
    },
    {
      label: "Crystal Reflection",
      desc: "Prismatic highlights for premium feel",
      lightingPresets: [
        { name: "Low Key", mood: "High contrast depth" },
        { name: "Prism Edge", mood: "Subtle rainbow refraction" }
      ],
      backgroundEnvironments: [
        { name: "Crystal Pedestal", mood: "Facet reflections", materialHints: ["glass"] },
        { name: "Black Velvet",     mood: "Ultra-premium base", materialHints: ["velvet"] }
      ],
      moodContexts: [
        { name: "Precise", effect: { contrastDelta: +20, saturationDelta: -5, temp: "cool", fontBias: "serif" } },
        { name: "Opulent", effect: { contrastDelta: +10, saturationDelta: +10, temp: "warm", fontBias: "serif", ctaStyleHints: ["boxed_glow"] } }
      ],
      compositionHints: { templates: ["Centered Hero"], defaultObjectCount: 1, shadow: ["Mirror"] },
      materialBias: { prefer: ["glass","metal"], avoid: [] }
    }
  ],

  "Stylized 3D": [
    {
      label: "Diorama Display Box",
      desc: "Mini set with playful scale",
      lightingPresets: [
        { name: "Soft GI Warm", mood: "Gentle indirect glow" },
        { name: "Side Spotlight", mood: "Mini stage look" }
      ],
      backgroundEnvironments: [
        { name: "Miniature Set", mood: "Toy-like props" },
        { name: "Pastel Room",   mood: "Soft colored walls", paletteHints: ["brandSecondary"] }
      ],
      moodContexts: [
        { name: "Playful", effect: { contrastDelta: +10, saturationDelta: +25, temp: "warm", fontBias: "rounded", ctaStyleHints: ["underline"] } },
        { name: "Cute",    effect: { contrastDelta: -5,  saturationDelta: +20, temp: "neutral", fontBias: "rounded" } }
      ],
      compositionHints: { templates: ["Centered Hero","Floating Object"], defaultObjectCount: 1, shadow: ["Floating"] },
      materialBias: { prefer: ["all"], avoid: [] }
    },
    {
      label: "Unreal Look",
      desc: "Crisp CG with dramatic contrast",
      lightingPresets: [
        { name: "HDR Glow Edge", mood: "Glossy edges pop" },
        { name: "Spot Trio Setup", mood: "Showroom light geometry" }
      ],
      backgroundEnvironments: [
        { name: "CG Tunnel", mood: "Geometric gradient" },
        { name: "Glass Platform", mood: "Modern tech pedestal", materialHints: ["glass"] }
      ],
      moodContexts: [
        { name: "Futuristic", effect: { contrastDelta: +20, saturationDelta: 0, temp: "cool", fontBias: "condensed" } },
        { name: "Bold",       effect: { contrastDelta: +25, saturationDelta: +10, temp: "neutral", fontBias: "condensed" } }
      ],
      compositionHints: { templates: ["Centered Hero","Rule of Thirds"], defaultObjectCount: 1, shadow: ["Mirror","Hard"] },
      materialBias: { prefer: ["metal","glass","acrylic"], avoid: [] }
    }
  ],

  "Flat / Vector Editorial": [
    {
      label: "Graphic Poster",
      desc: "Bold shapes and flat color",
      lightingPresets: [
        { name: "Flat Bright", mood: "No shadow, crisp fills", hints: ["no_harsh_shadows"] }
      ],
      backgroundEnvironments: [
        { name: "Color Field", mood: "Brand color canvas", paletteHints: ["brandPrimary"] },
        { name: "Geometric Grid", mood: "Modern vector pattern", paletteHints: ["brandSecondary"] }
      ],
      moodContexts: [
        { name: "Modern",   effect: { contrastDelta: +10, saturationDelta: +10, temp: "neutral", fontBias: "sans" } },
        { name: "Retro",    effect: { contrastDelta: +5,  saturationDelta: -10, temp: "warm",   fontBias: "serif" } }
      ],
      compositionHints: { templates: ["Centered Hero","Collage"], defaultObjectCount: 1, shadow: ["Floating"] },
      materialBias: { prefer: ["all"], avoid: [] }
    }
  ],

  "Surreal Conceptual": [
    {
      label: "Floating Geometry",
      desc: "Symbolic shapes orbiting product",
      lightingPresets: [
        { name: "Ambient Bloom", mood: "Soft bloom around subject" },
        { name: "Dual Tone Neon", mood: "Opposing color wash" }
      ],
      backgroundEnvironments: [
        { name: "Abstract Gradient", mood: "Dreamlike hue field", paletteHints: ["brandSecondary"] },
        { name: "Particle Field", mood: "Light motes & mist" }
      ],
      moodContexts: [
        { name: "Mysterious", effect: { contrastDelta: +20, saturationDelta: -10, temp: "cool", fontBias: "sans" } },
        { name: "Visionary",  effect: { contrastDelta: +15, saturationDelta: +10, temp: "warm", fontBias: "condensed" } }
      ],
      compositionHints: { templates: ["Centered Hero","Floating Object"], defaultObjectCount: 1, shadow: ["Floating"] },
      materialBias: { prefer: ["all"], avoid: [] }
    },
    {
      label: "Liquid Motion",
      desc: "Splash, gel, smoke motifs",
      lightingPresets: [
        { name: "Volumetric Mist", mood: "Shafts through vapor" },
        { name: "Reflective Bounce", mood: "Wet sheen highlights" }
      ],
      backgroundEnvironments: [
        { name: "Liquid Sheet", mood: "Glossy fluid backdrop" },
        { name: "Fog Gradient", mood: "Soft fade with particles" }
      ],
      moodContexts: [
        { name: "Dynamic", effect: { contrastDelta: +25, saturationDelta: +20, temp: "neutral", fontBias: "condensed" } },
        { name: "Sensual", effect: { contrastDelta: +10, saturationDelta: +5,  temp: "warm",    fontBias: "serif" } }
      ],
      compositionHints: { templates: ["Centered Hero"], defaultObjectCount: 1, shadow: ["Soft","Mirror"] },
      materialBias: { prefer: ["glass","metal"], avoid: [] }
    }
  ],

  "Futuristic Techno": [
    {
      label: "Neon Corridor",
      desc: "Tech runway vibe",
      lightingPresets: [
        { name: "Dual Tone Neon", mood: "Teal/Magenta wash" },
        { name: "Rim Glow", mood: "Sharp edge highlight" }
      ],
      backgroundEnvironments: [
        { name: "Neon Hall", mood: "Repeating light frames" },
        { name: "Hologram Grid", mood: "Digital floor grid" }
      ],
      moodContexts: [
        { name: "Cutting-Edge", effect: { contrastDelta: +20, saturationDelta: +10, temp: "cool", fontBias: "condensed" } },
        { name: "Cyber Luxe",   effect: { contrastDelta: +15, saturationDelta: +15, temp: "cool", fontBias: "serif" } }
      ],
      compositionHints: { templates: ["Centered Hero","Rule of Thirds"], defaultObjectCount: 1, shadow: ["Mirror","Hard"] },
      materialBias: { prefer: ["metal","glass","acrylic"], avoid: [] }
    }
  ],

  "Eco-Natural": [
    {
      label: "Botanical Shadow",
      desc: "Leaf-cast daylight patterns",
      lightingPresets: [
        { name: "Golden Diffuse", mood: "Soft warm sun", hints: ["no_harsh_shadows"] },
        { name: "Ambient Overcast", mood: "Cloudy even light" }
      ],
      backgroundEnvironments: [
        { name: "Wood Table", mood: "Organic surface", materialHints: ["wood"] },
        { name: "Paper Kraft", mood: "Sustainable vibe", materialHints: ["paper"] }
      ],
      moodContexts: [
        { name: "Pure",   effect: { contrastDelta: -10, saturationDelta: -5, temp: "neutral", fontBias: "sans" } },
        { name: "Fresh",  effect: { contrastDelta: 0,   saturationDelta: +10, temp: "cool",    fontBias: "rounded" } }
      ],
      compositionHints: { templates: ["Rule of Thirds","Flat Lay"], defaultObjectCount: 1, shadow: ["Soft"] },
      materialBias: { prefer: ["fabric","paper","wood"], avoid: ["mirror"] }
    }
  ],

  "Retro Revival": [
    {
      label: "Film Print",
      desc: "Analog texture & color",
      lightingPresets: [
        { name: "Low Key", mood: "Moody shadows" },
        { name: "Soft Backfill", mood: "Subtle retro fill" }
      ],
      backgroundEnvironments: [
        { name: "Paper Backdrop", mood: "Muted tones", materialHints: ["paper"] },
        { name: "CRT Glow Field", mood: "Retro gradient glow" }
      ],
      moodContexts: [
        { name: "Nostalgic", effect: { contrastDelta: 0, saturationDelta: -15, temp: "warm", fontBias: "serif" } },
        { name: "Pop Retro", effect: { contrastDelta: +10, saturationDelta: +10, temp: "neutral", fontBias: "sans" } }
      ],
      compositionHints: { templates: ["Centered Hero","Collage"], defaultObjectCount: 1, shadow: ["Soft"] },
      materialBias: { prefer: ["all"], avoid: [] }
    }
  ],

  "Product + Persona Hybrid": [
    {
      label: "Model + Hero",
      desc: "Person with product hero",
      lightingPresets: [
        { name: "Softbox 45°", mood: "Balanced face+product" },
        { name: "Sunset Rim Blend", mood: "Warm rim, cool fill" }
      ],
      backgroundEnvironments: [
        { name: "Editorial Wall", mood: "Simple texture" },
        { name: "Lifestyle Neutral", mood: "Implied set" }
      ],
      moodContexts: [
        { name: "Approachable", effect: { contrastDelta: -5, saturationDelta: +5, temp: "warm", fontBias: "rounded" } },
        { name: "Professional", effect: { contrastDelta: +5, saturationDelta: 0, temp: "neutral", fontBias: "sans" } }
      ],
      compositionHints: { templates: ["Rule of Thirds","Centered Hero"], defaultObjectCount: 1, shadow: ["Soft"] },
      materialBias: { prefer: ["all"], avoid: [] }
    }
  ],

  /* ========================= E-Commerce & Social Media ========================= */

  "E-Commerce Hero": [
    {
      label: "Product Showcase",
      desc: "Clean e-commerce product display",
      lightingPresets: [
        { name: "White Background", mood: "Clean, bright, no shadows", hints: ["no_harsh_shadows"] },
        { name: "Soft Fill", mood: "Gentle, even illumination" },
        { name: "Rim Light", mood: "Edge definition, clean separation" }
      ],
      backgroundEnvironments: [
        { name: "Pure White", mood: "E-commerce standard", paletteHints: ["neutralCool"] },
        { name: "Light Gray", mood: "Subtle contrast", paletteHints: ["neutralWarm"] },
        { name: "Brand Color", mood: "Branded background", paletteHints: ["brandPrimary"] }
      ],
      moodContexts: [
        { name: "Clean", effect: { contrastDelta: 0, saturationDelta: 0, temp: "neutral", fontBias: "sans", ctaStyleHints: ["no_bg"] } },
        { name: "Premium", effect: { contrastDelta: +10, saturationDelta: +5, temp: "cool", fontBias: "serif", ctaStyleHints: ["boxed_glow"] } },
        { name: "Vibrant", effect: { contrastDelta: +15, saturationDelta: +20, temp: "warm", fontBias: "condensed", ctaStyleHints: ["underline"] } }
      ],
      compositionHints: { templates: ["Centered Hero"], defaultObjectCount: 1, shadow: ["Soft"] },
      materialBias: { prefer: ["all"], avoid: [] }
    },
    {
      label: "360° View",
      desc: "Multiple angle product display",
      lightingPresets: [
        { name: "Even Studio", mood: "Consistent across angles" },
        { name: "Rotating Key", mood: "Dynamic lighting movement" }
      ],
      backgroundEnvironments: [
        { name: "Seamless White", mood: "Professional backdrop" },
        { name: "Gradient Floor", mood: "Depth and dimension" }
      ],
      moodContexts: [
        { name: "Technical", effect: { contrastDelta: +5, saturationDelta: -5, temp: "neutral", fontBias: "sans" } },
        { name: "Interactive", effect: { contrastDelta: +10, saturationDelta: +10, temp: "warm", fontBias: "rounded" } }
      ],
      compositionHints: { templates: ["Centered Hero","Rule of Thirds"], defaultObjectCount: 1, shadow: ["Soft"] },
      materialBias: { prefer: ["all"], avoid: [] }
    }
  ],

  "Social Media Ready": [
    {
      label: "Instagram Feed",
      desc: "Square format, scroll-stopping design",
      lightingPresets: [
        { name: "Bright & Bold", mood: "High contrast, eye-catching" },
        { name: "Soft Glow", mood: "Gentle, approachable" },
        { name: "Dramatic Shadows", mood: "Moody, artistic" }
      ],
      backgroundEnvironments: [
        { name: "Gradient Background", mood: "Modern, trendy", paletteHints: ["brandSecondary"] },
        { name: "Pattern Overlay", mood: "Textured, interesting" },
        { name: "Minimal White", mood: "Clean, focused" }
      ],
      moodContexts: [
        { name: "Trendy", effect: { contrastDelta: +20, saturationDelta: +15, temp: "warm", fontBias: "condensed", ctaStyleHints: ["underline"] } },
        { name: "Aesthetic", effect: { contrastDelta: -5, saturationDelta: -10, temp: "cool", fontBias: "sans", ctaStyleHints: ["no_bg"] } },
        { name: "Bold", effect: { contrastDelta: +25, saturationDelta: +25, temp: "neutral", fontBias: "condensed", ctaStyleHints: ["boxed_glow"] } }
      ],
      compositionHints: { templates: ["Centered Hero","Rule of Thirds"], defaultObjectCount: 1, shadow: ["Soft","Hard"] },
      materialBias: { prefer: ["all"], avoid: [] }
    },
    {
      label: "Story Format",
      desc: "Vertical, full-screen impact",
      lightingPresets: [
        { name: "Full Frame", mood: "Immersive, engaging" },
        { name: "Top Light", mood: "Natural, phone-like" }
      ],
      backgroundEnvironments: [
        { name: "Full Bleed", mood: "Edge-to-edge coverage" },
        { name: "Safe Zone", mood: "Text-friendly areas" }
      ],
      moodContexts: [
        { name: "Immersive", effect: { contrastDelta: +15, saturationDelta: +10, temp: "warm", fontBias: "condensed" } },
        { name: "Natural", effect: { contrastDelta: 0, saturationDelta: +5, temp: "neutral", fontBias: "sans" } }
      ],
      compositionHints: { templates: ["Centered Hero"], defaultObjectCount: 1, shadow: ["Soft"] },
      materialBias: { prefer: ["all"], avoid: [] }
    }
  ],

  "TikTok & Short Form": [
    {
      label: "Quick Impact",
      desc: "Fast-scrolling, attention-grabbing",
      lightingPresets: [
        { name: "High Energy", mood: "Bright, dynamic" },
        { name: "Neon Accent", mood: "Colorful, vibrant" },
        { name: "Flash Effect", mood: "Dramatic, bold" }
      ],
      backgroundEnvironments: [
        { name: "Color Burst", mood: "Vibrant, energetic", paletteHints: ["brandPrimary","brandSecondary"] },
        { name: "Motion Blur", mood: "Dynamic, fast" },
        { name: "Neon Grid", mood: "Futuristic, tech" }
      ],
      moodContexts: [
        { name: "High Energy", effect: { contrastDelta: +30, saturationDelta: +30, temp: "warm", fontBias: "condensed", ctaStyleHints: ["underline"] } },
        { name: "Viral", effect: { contrastDelta: +25, saturationDelta: +20, temp: "neutral", fontBias: "condensed", ctaStyleHints: ["boxed_glow"] } },
        { name: "Trending", effect: { contrastDelta: +20, saturationDelta: +25, temp: "cool", fontBias: "rounded", ctaStyleHints: ["underline"] } }
      ],
      compositionHints: { templates: ["Centered Hero","Rule of Thirds"], defaultObjectCount: 1, shadow: ["Hard","Floating"] },
      materialBias: { prefer: ["all"], avoid: [] }
    }
  ],

  /* ========================= Product Categories ========================= */

  "Tech & Electronics": [
    {
      label: "Sleek Tech",
      desc: "Modern technology product showcase",
      lightingPresets: [
        { name: "Blue Accent", mood: "Tech blue highlights" },
        { name: "Screen Glow", mood: "Display illumination" },
        { name: "Precision Light", mood: "Sharp, clean edges" }
      ],
      backgroundEnvironments: [
        { name: "Dark Tech", mood: "Black, premium feel", paletteHints: ["neutralCool"] },
        { name: "Circuit Pattern", mood: "Tech-inspired texture" },
        { name: "Glass Surface", mood: "Reflective, modern", materialHints: ["glass"] }
      ],
      moodContexts: [
        { name: "Futuristic", effect: { contrastDelta: +20, saturationDelta: 0, temp: "cool", fontBias: "condensed" } },
        { name: "Premium Tech", effect: { contrastDelta: +15, saturationDelta: +5, temp: "cool", fontBias: "sans", ctaStyleHints: ["boxed_glow"] } },
        { name: "Innovation", effect: { contrastDelta: +10, saturationDelta: +10, temp: "neutral", fontBias: "condensed", ctaStyleHints: ["underline"] } }
      ],
      compositionHints: { templates: ["Centered Hero","Rule of Thirds"], defaultObjectCount: 1, shadow: ["Hard","Mirror"] },
      materialBias: { prefer: ["metal","glass","acrylic"], avoid: ["fabric","wood"] }
    }
  ],

  "Fashion & Beauty": [
    {
      label: "Style Showcase",
      desc: "Fashion and beauty product display",
      lightingPresets: [
        { name: "Beauty Light", mood: "Soft, flattering" },
        { name: "Fashion Glow", mood: "Elegant, sophisticated" },
        { name: "Runway Spot", mood: "Dramatic, high-fashion" }
      ],
      backgroundEnvironments: [
        { name: "Luxury Fabric", mood: "Premium texture", materialHints: ["velvet","fabric"] },
        { name: "Marble Surface", mood: "Elegant, timeless", materialHints: ["marble"] },
        { name: "Pastel Gradient", mood: "Soft, feminine", paletteHints: ["brandSecondary"] }
      ],
      moodContexts: [
        { name: "Elegant", effect: { contrastDelta: +10, saturationDelta: +5, temp: "warm", fontBias: "serif", ctaStyleHints: ["boxed_glow"] } },
        { name: "Fresh", effect: { contrastDelta: 0, saturationDelta: +15, temp: "cool", fontBias: "rounded", ctaStyleHints: ["underline"] } },
        { name: "Glamorous", effect: { contrastDelta: +20, saturationDelta: +10, temp: "warm", fontBias: "serif", ctaStyleHints: ["boxed_glow"] } }
      ],
      compositionHints: { templates: ["Centered Hero","Rule of Thirds","Floating Object"], defaultObjectCount: 1, shadow: ["Soft","Mirror"] },
      materialBias: { prefer: ["fabric","velvet","marble"], avoid: ["metal"] }
    }
  ],

  "Food & Beverage": [
    {
      label: "Appetizing Display",
      desc: "Food and drink product photography",
      lightingPresets: [
        { name: "Natural Light", mood: "Fresh, appetizing" },
        { name: "Warm Glow", mood: "Cozy, inviting" },
        { name: "Fresh Bright", mood: "Clean, healthy" }
      ],
      backgroundEnvironments: [
        { name: "Wood Table", mood: "Rustic, natural", materialHints: ["wood"] },
        { name: "Marble Counter", mood: "Clean, modern", materialHints: ["marble"] },
        { name: "Paper Texture", mood: "Organic, simple", materialHints: ["paper"] }
      ],
      moodContexts: [
        { name: "Fresh", effect: { contrastDelta: +5, saturationDelta: +20, temp: "warm", fontBias: "rounded", ctaStyleHints: ["underline"] } },
        { name: "Healthy", effect: { contrastDelta: 0, saturationDelta: +10, temp: "neutral", fontBias: "sans", ctaStyleHints: ["no_bg"] } },
        { name: "Indulgent", effect: { contrastDelta: +15, saturationDelta: +15, temp: "warm", fontBias: "serif", ctaStyleHints: ["boxed_glow"] } }
      ],
      compositionHints: { templates: ["Centered Hero","Rule of Thirds","Flat Lay"], defaultObjectCount: 1, shadow: ["Soft"] },
      materialBias: { prefer: ["wood","paper","marble"], avoid: ["metal","glass"] }
    }
  ],

  "Home & Lifestyle": [
    {
      label: "Lifestyle Setting",
      desc: "Home and lifestyle product context",
      lightingPresets: [
        { name: "Home Light", mood: "Cozy, lived-in" },
        { name: "Window Light", mood: "Natural, bright" },
        { name: "Ambient Glow", mood: "Warm, inviting" }
      ],
      backgroundEnvironments: [
        { name: "Living Room", mood: "Cozy, comfortable" },
        { name: "Kitchen Counter", mood: "Functional, clean" },
        { name: "Bedroom Setting", mood: "Relaxed, personal" }
      ],
      moodContexts: [
        { name: "Cozy", effect: { contrastDelta: -5, saturationDelta: +5, temp: "warm", fontBias: "rounded", ctaStyleHints: ["underline"] } },
        { name: "Modern", effect: { contrastDelta: +10, saturationDelta: 0, temp: "neutral", fontBias: "sans", ctaStyleHints: ["no_bg"] } },
        { name: "Comfortable", effect: { contrastDelta: 0, saturationDelta: +10, temp: "warm", fontBias: "sans", ctaStyleHints: ["underline"] } }
      ],
      compositionHints: { templates: ["Rule of Thirds","Centered Hero"], defaultObjectCount: 1, shadow: ["Soft"] },
      materialBias: { prefer: ["wood","fabric","paper"], avoid: ["metal"] }
    }
  ],

  /* ========================= Seasonal & Trending ========================= */

  "Seasonal Themes": [
    {
      label: "Holiday Magic",
      desc: "Seasonal and holiday product displays",
      lightingPresets: [
        { name: "Warm Holiday", mood: "Cozy, festive" },
        { name: "Sparkle Light", mood: "Magical, twinkling" },
        { name: "Golden Hour", mood: "Warm, nostalgic" }
      ],
      backgroundEnvironments: [
        { name: "Holiday Colors", mood: "Festive palette", paletteHints: ["brandPrimary","brandSecondary"] },
        { name: "Snow Texture", mood: "Winter wonderland" },
        { name: "Gift Wrap", mood: "Celebratory, wrapped" }
      ],
      moodContexts: [
        { name: "Festive", effect: { contrastDelta: +15, saturationDelta: +20, temp: "warm", fontBias: "serif", ctaStyleHints: ["boxed_glow"] } },
        { name: "Cozy", effect: { contrastDelta: -5, saturationDelta: +10, temp: "warm", fontBias: "rounded", ctaStyleHints: ["underline"] } },
        { name: "Magical", effect: { contrastDelta: +10, saturationDelta: +15, temp: "cool", fontBias: "serif", ctaStyleHints: ["boxed_glow"] } }
      ],
      compositionHints: { templates: ["Centered Hero","Rule of Thirds"], defaultObjectCount: 1, shadow: ["Soft"] },
      materialBias: { prefer: ["all"], avoid: [] }
    }
  ]
};
