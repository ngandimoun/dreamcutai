export interface MoodContext {
  name: string
  effect: {
    contrast?: string
    sat?: string
    temp?: "warm" | "cool" | "neutral"
  }
}

export interface VisualInfluence {
  label: string
  desc: string
  colorSystems: string[]
  annotationStyle: string
  moodContexts: MoodContext[]
}

export interface ChartStyleMap {
  [key: string]: VisualInfluence[]
}

export const STYLE_MAP: ChartStyleMap = {
  "Magazine Editorial": [
    {
      label: "New York Times Style",
      desc: "Clean typography, sophisticated layout",
      colorSystems: ["Editorial Blue", "Monochrome Accent"],
      annotationStyle: "Serif headlines, sans-serif data labels",
      moodContexts: [
        { name: "Professional", effect: { contrast: "+5%", sat: "-10%" } },
        { name: "Authoritative", effect: { contrast: "+10%", sat: "-5%" } }
      ]
    },
    {
      label: "Economist Infographic",
      desc: "Data-driven storytelling with elegant framing",
      colorSystems: ["Brand Red", "Neutral Grey"],
      annotationStyle: "Bold headlines, minimal legends",
      moodContexts: [
        { name: "Scholarly", effect: { contrast: "+8%", sat: "-15%" } }
      ]
    }
  ],

  "Social Media Ready": [
    {
      label: "Instagram Optimized",
      desc: "Vibrant colors, mobile-first design",
      colorSystems: ["Bright Gradient", "High Contrast"],
      annotationStyle: "Bold, readable fonts for small screens",
      moodContexts: [
        { name: "Energetic", effect: { sat: "+25%", temp: "warm" } },
        { name: "Engaging", effect: { contrast: "+15%", sat: "+20%" } }
      ]
    },
    {
      label: "LinkedIn Professional",
      desc: "Clean, corporate-friendly aesthetics",
      colorSystems: ["Corporate Blue", "Professional Grey"],
      annotationStyle: "Clean sans-serif, subtle highlights",
      moodContexts: [
        { name: "Professional", effect: { contrast: "+5%", sat: "-10%" } }
      ]
    }
  ],

  "Presentation Pro": [
    {
      label: "PowerPoint Ready",
      desc: "High contrast, presentation-optimized",
      colorSystems: ["Presentation Palette", "High Visibility"],
      annotationStyle: "Large, clear fonts for projection",
      moodContexts: [
        { name: "Clear", effect: { contrast: "+20%", sat: "+10%" } },
        { name: "Confident", effect: { contrast: "+15%", sat: "+5%" } }
      ]
    },
    {
      label: "Keynote Elegant",
      desc: "Apple-inspired minimalism with impact",
      colorSystems: ["Minimal Palette", "Subtle Gradients"],
      annotationStyle: "Clean typography, generous white space",
      moodContexts: [
        { name: "Elegant", effect: { contrast: "-5%", sat: "-15%" } }
      ]
    }
  ],

  "Infographic Pop": [
    {
      label: "Colorful Engagement",
      desc: "Bold colors, engaging visual elements",
      colorSystems: ["Rainbow Palette", "Vibrant Mix"],
      annotationStyle: "Playful fonts, dynamic layouts",
      moodContexts: [
        { name: "Playful", effect: { sat: "+30%", temp: "warm" } },
        { name: "Energetic", effect: { sat: "+25%", temp: "neutral" } }
      ]
    },
    {
      label: "Interactive Style",
      desc: "Modern web-inspired design",
      colorSystems: ["Digital Palette", "Hover Effects"],
      annotationStyle: "Modern sans-serif, interactive elements",
      moodContexts: [
        { name: "Modern", effect: { contrast: "+10%", sat: "+15%" } }
      ]
    }
  ],

  "Minimalist Modern": [
    {
      label: "Scandinavian Clean",
      desc: "Minimal design, maximum impact",
      colorSystems: ["Monochrome", "Single Accent"],
      annotationStyle: "Ultra-clean typography, lots of white space",
      moodContexts: [
        { name: "Calm", effect: { contrast: "-10%", sat: "-20%", temp: "cool" } },
        { name: "Focused", effect: { contrast: "+5%", sat: "-25%" } }
      ]
    },
    {
      label: "Swiss Grid",
      desc: "Precise typography, geometric layout",
      colorSystems: ["Black & White", "Primary Accent"],
      annotationStyle: "Grid-based layout, precise measurements",
      moodContexts: [
        { name: "Precise", effect: { contrast: "+15%", sat: "-30%" } }
      ]
    }
  ],

  "Retro Vintage": [
    {
      label: "70s Groovy",
      desc: "Warm colors, organic shapes",
      colorSystems: ["Earth Tones", "Warm Gradients"],
      annotationStyle: "Groovy fonts, psychedelic elements",
      moodContexts: [
        { name: "Nostalgic", effect: { sat: "+20%", temp: "warm" } },
        { name: "Vibrant", effect: { sat: "+25%", temp: "warm" } }
      ]
    },
    {
      label: "80s Neon",
      desc: "Bright neon colors, geometric patterns",
      colorSystems: ["Neon Palette", "High Contrast"],
      annotationStyle: "Bold, geometric fonts",
      moodContexts: [
        { name: "Bold", effect: { contrast: "+25%", sat: "+30%" } }
      ]
    }
  ],

  "Neon Cyberpunk": [
    {
      label: "Futuristic Glow",
      desc: "Neon effects, dark backgrounds",
      colorSystems: ["Cyber Neon", "Dark Base"],
      annotationStyle: "Glowing typography, sci-fi elements",
      moodContexts: [
        { name: "Futuristic", effect: { contrast: "+30%", temp: "cool" } },
        { name: "Cyber", effect: { sat: "+20%", temp: "cool" } }
      ]
    },
    {
      label: "Holographic",
      desc: "Iridescent effects, 3D depth",
      colorSystems: ["Holographic", "Rainbow Shift"],
      annotationStyle: "3D typography, depth effects",
      moodContexts: [
        { name: "Cutting-Edge", effect: { contrast: "+25%", sat: "+15%" } }
      ]
    }
  ],

  "Hand-Drawn Sketch": [
    {
      label: "Organic Sketch",
      desc: "Hand-drawn lines, natural imperfections",
      colorSystems: ["Paper Texture", "Sketch Colors"],
      annotationStyle: "Handwritten fonts, sketchy elements",
      moodContexts: [
        { name: "Friendly", effect: { sat: "+10%", temp: "warm" } },
        { name: "Casual", effect: { contrast: "-10%", sat: "-10%" } }
      ]
    },
    {
      label: "Notebook Style",
      desc: "Paper texture, margin lines",
      colorSystems: ["Paper Colors", "Ink Accents"],
      annotationStyle: "Handwritten style, paper texture",
      moodContexts: [
        { name: "Personal", effect: { contrast: "-5%", sat: "-15%" } }
      ]
    }
  ],

  "3D Data Art": [
    {
      label: "Isometric Design",
      desc: "Clean 3D isometric perspective with geometric precision",
      colorSystems: ["3D Gradients", "Depth Shadows"],
      annotationStyle: "3D typography with depth effects",
      moodContexts: [
        { name: "Modern", effect: { contrast: "+15%", sat: "+10%" } },
        { name: "Technical", effect: { contrast: "+20%", sat: "+5%" } }
      ]
    },
    {
      label: "Low Poly Style",
      desc: "Geometric faceted surfaces with angular lighting",
      colorSystems: ["Polygonal Colors", "Faceted Gradients"],
      annotationStyle: "Geometric fonts with angular styling",
      moodContexts: [
        { name: "Futuristic", effect: { contrast: "+25%", temp: "cool" } },
        { name: "Gaming", effect: { sat: "+20%", temp: "neutral" } }
      ]
    },
    {
      label: "Realistic 3D",
      desc: "Photorealistic 3D rendering with natural lighting",
      colorSystems: ["Realistic Materials", "Natural Lighting"],
      annotationStyle: "Clean typography with realistic shadows",
      moodContexts: [
        { name: "Premium", effect: { contrast: "+10%", sat: "+5%" } },
        { name: "Luxury", effect: { contrast: "+12%", sat: "+8%" } }
      ]
    }
  ],

  "Watercolor Artistic": [
    {
      label: "Watercolor Splash",
      desc: "Flowing watercolor effects with organic color bleeding",
      colorSystems: ["Watercolor Bleeds", "Organic Blends"],
      annotationStyle: "Artistic fonts with watercolor textures",
      moodContexts: [
        { name: "Artistic", effect: { sat: "+15%", temp: "warm" } },
        { name: "Creative", effect: { sat: "+20%", temp: "neutral" } }
      ]
    },
    {
      label: "Painted Canvas",
      desc: "Brush stroke textures with artistic paint effects",
      colorSystems: ["Brush Strokes", "Canvas Texture"],
      annotationStyle: "Hand-painted typography with texture",
      moodContexts: [
        { name: "Handmade", effect: { contrast: "-5%", sat: "+10%" } },
        { name: "Authentic", effect: { contrast: "-8%", sat: "+15%" } }
      ]
    }
  ],

  "Geometric Modern": [
    {
      label: "Bauhaus Style",
      desc: "Clean geometric forms with primary color accents",
      colorSystems: ["Primary Colors", "Geometric Shapes"],
      annotationStyle: "Bold sans-serif with geometric layouts",
      moodContexts: [
        { name: "Bold", effect: { contrast: "+20%", sat: "+15%" } },
        { name: "Structured", effect: { contrast: "+18%", sat: "+10%" } }
      ]
    },
    {
      label: "Memphis Design",
      desc: "Playful geometric patterns with vibrant colors",
      colorSystems: ["Vibrant Mix", "Geometric Patterns"],
      annotationStyle: "Playful fonts with geometric elements",
      moodContexts: [
        { name: "Playful", effect: { sat: "+30%", temp: "warm" } },
        { name: "Energetic", effect: { sat: "+25%", temp: "neutral" } }
      ]
    },
    {
      label: "Art Deco",
      desc: "Elegant geometric patterns with luxury materials",
      colorSystems: ["Luxury Metals", "Geometric Elegance"],
      annotationStyle: "Elegant serif fonts with geometric accents",
      moodContexts: [
        { name: "Luxury", effect: { contrast: "+15%", sat: "+8%" } },
        { name: "Elegant", effect: { contrast: "+12%", sat: "+5%" } }
      ]
    }
  ],

  "Tech & Digital": [
    {
      label: "Glassmorphism",
      desc: "Frosted glass effects with transparency and blur",
      colorSystems: ["Glass Effects", "Transparency Layers"],
      annotationStyle: "Clean typography with glass overlays",
      moodContexts: [
        { name: "Modern", effect: { contrast: "+10%", sat: "+5%" } },
        { name: "Futuristic", effect: { contrast: "+15%", temp: "cool" } }
      ]
    },
    {
      label: "Neumorphism",
      desc: "Soft, extruded plastic look with subtle shadows",
      colorSystems: ["Soft Shadows", "Plastic Materials"],
      annotationStyle: "Soft typography with extruded effects",
      moodContexts: [
        { name: "Soft", effect: { contrast: "-5%", sat: "-10%" } },
        { name: "Tactile", effect: { contrast: "+5%", sat: "-5%" } }
      ]
    },
    {
      label: "Material Design",
      desc: "Google's material design with elevation and motion",
      colorSystems: ["Material Colors", "Elevation Shadows"],
      annotationStyle: "Roboto typography with material principles",
      moodContexts: [
        { name: "Clean", effect: { contrast: "+8%", sat: "+10%" } },
        { name: "Functional", effect: { contrast: "+12%", sat: "+8%" } }
      ]
    }
  ],

  "Organic & Natural": [
    {
      label: "Botanical",
      desc: "Natural plant-inspired textures and organic shapes",
      colorSystems: ["Natural Greens", "Organic Textures"],
      annotationStyle: "Organic fonts with natural elements",
      moodContexts: [
        { name: "Natural", effect: { sat: "+10%", temp: "neutral" } },
        { name: "Fresh", effect: { sat: "+15%", temp: "cool" } }
      ]
    },
    {
      label: "Marble Texture",
      desc: "Luxurious marble patterns with natural veining",
      colorSystems: ["Marble Patterns", "Natural Veins"],
      annotationStyle: "Elegant typography with marble backgrounds",
      moodContexts: [
        { name: "Luxury", effect: { contrast: "+8%", sat: "+3%" } },
        { name: "Sophisticated", effect: { contrast: "+10%", sat: "+5%" } }
      ]
    },
    {
      label: "Wood Grain",
      desc: "Natural wood textures with organic patterns",
      colorSystems: ["Wood Tones", "Grain Patterns"],
      annotationStyle: "Warm typography with wood textures",
      moodContexts: [
        { name: "Warm", effect: { sat: "+5%", temp: "warm" } },
        { name: "Rustic", effect: { contrast: "-5%", sat: "+8%" } }
      ]
    }
  ]
}

export const CHART_PURPOSE_MAP = {
  "Comparison": ["Bar", "Column", "Stacked", "Grouped"],
  "Trend / Time": ["Line", "Area", "Sparkline", "Timeline"],
  "Distribution": ["Histogram", "Box", "Violin"],
  "Composition": ["Pie", "Donut", "Treemap"],
  "Relationship": ["Scatter", "Bubble", "Network"],
  "Process / Flow": ["Sankey", "Funnel", "Step Diagram"],
  "Ranking / Highlight": ["Lollipop", "Leaderboard", "Card Grid"]
}

export const MOOD_CONTEXTS = [
  { name: "Corporate Professional", emoji: "💼", effect: { contrast: "+5%", sat: "-10%", temp: "cool" } },
  { name: "Startup Energy", emoji: "🚀", effect: { sat: "+25%", temp: "warm", contrast: "+15%" } },
  { name: "Academic Scholarly", emoji: "🎓", effect: { contrast: "+8%", sat: "-15%", temp: "neutral" } },
  { name: "Creative Agency", emoji: "🎨", effect: { sat: "+20%", temp: "warm", contrast: "+10%" } },
  { name: "Luxury Brand", emoji: "✨", effect: { contrast: "+12%", sat: "+5%", temp: "warm" } }
]

export const LIGHTING_PRESETS = [
  { name: "Soft Top Light", desc: "Gentle daylight simulation" },
  { name: "Studio Glow", desc: "Center vignette for emphasis" },
  { name: "Grid Beam", desc: "Holographic effect (Tech style)" },
  { name: "Sketch Paper Light", desc: "Low contrast with vignette" },
  { name: "Dual Rim Cool/Warm", desc: "Cinematic 3D lighting" }
]

export const COLOR_PALETTES = {
  // Original Palettes
  "Sunset Gradient": {
    colors: ["#FF6B6B", "#FFA07A", "#FFD700", "#FF8C00"],
    description: "Warm sunset tones for engaging visuals"
  },
  "Ocean Breeze": {
    colors: ["#0077BE", "#00B4D8", "#90E0EF", "#CAF0F8"],
    description: "Cool ocean blues for professional charts"
  },
  "Forest Earth": {
    colors: ["#2D6A4F", "#52B788", "#95D5B2", "#D8F3DC"],
    description: "Natural greens for eco-friendly content"
  },
  "Neon Night": {
    colors: ["#FF006E", "#FB5607", "#FFBE0B", "#8338EC"],
    description: "Vibrant neons for high-energy visuals"
  },
  "Pastel Dream": {
    colors: ["#FFC8DD", "#FFAFCC", "#BDE0FE", "#A2D2FF"],
    description: "Soft pastels for gentle, friendly charts"
  },
  "Monochrome Elegance": {
    colors: ["#000000", "#404040", "#808080", "#C0C0C0"],
    description: "Sophisticated grays for minimalist design"
  },

  // Business Palettes
  "Corporate Blue": {
    colors: ["#1E3A8A", "#3B82F6", "#60A5FA", "#93C5FD"],
    description: "Professional blue tones for corporate presentations"
  },
  "Enterprise Green": {
    colors: ["#065F46", "#10B981", "#34D399", "#6EE7B7"],
    description: "Trustworthy greens for enterprise applications"
  },
  "Financial Gold": {
    colors: ["#92400E", "#D97706", "#F59E0B", "#FCD34D"],
    description: "Premium gold tones for financial data"
  },
  "Tech Purple": {
    colors: ["#581C87", "#7C3AED", "#A78BFA", "#C4B5FD"],
    description: "Modern purple for technology companies"
  },

  // Seasonal Palettes
  "Spring Bloom": {
    colors: ["#EC4899", "#F472B6", "#FBBF24", "#A3E635"],
    description: "Fresh spring colors for growth and renewal"
  },
  "Summer Bright": {
    colors: ["#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"],
    description: "Vibrant summer colors for energetic content"
  },
  "Autumn Harvest": {
    colors: ["#DC2626", "#EA580C", "#D97706", "#CA8A04"],
    description: "Warm autumn tones for seasonal content"
  },
  "Winter Frost": {
    colors: ["#1E40AF", "#7C2D12", "#374151", "#F3F4F6"],
    description: "Cool winter colors for professional content"
  },

  // Themed Palettes
  "Healthcare": {
    colors: ["#059669", "#0D9488", "#0891B2", "#0284C7"],
    description: "Medical blues and greens for healthcare data"
  },
  "Education": {
    colors: ["#7C3AED", "#C026D3", "#DB2777", "#DC2626"],
    description: "Academic colors for educational content"
  },
  "Real Estate": {
    colors: ["#92400E", "#B45309", "#D97706", "#F59E0B"],
    description: "Warm earth tones for real estate data"
  },
  "Food & Beverage": {
    colors: ["#DC2626", "#EA580C", "#F59E0B", "#84CC16"],
    description: "Appetizing colors for food industry charts"
  },
  "Technology": {
    colors: ["#1E40AF", "#7C3AED", "#DB2777", "#059669"],
    description: "Modern tech colors for digital products"
  },
  "Finance": {
    colors: ["#1F2937", "#374151", "#6B7280", "#9CA3AF"],
    description: "Professional grays for financial data"
  },

  // Creative Palettes
  "Rainbow Burst": {
    colors: ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6"],
    description: "Full spectrum colors for creative projects"
  },
  "Tropical Paradise": {
    colors: ["#F59E0B", "#10B981", "#06B6D4", "#8B5CF6"],
    description: "Tropical colors for vacation and travel content"
  },
  "Desert Sands": {
    colors: ["#F59E0B", "#D97706", "#B45309", "#92400E"],
    description: "Warm desert tones for nature content"
  },
  "Northern Lights": {
    colors: ["#059669", "#0891B2", "#7C3AED", "#DB2777"],
    description: "Aurora-inspired colors for magical content"
  },

  // Classic Palettes
  "Primary Colors": {
    colors: ["#EF4444", "#3B82F6", "#F59E0B", "#10B981"],
    description: "Classic primary colors for universal appeal"
  },
  "Earth Tones": {
    colors: ["#92400E", "#B45309", "#D97706", "#F59E0B"],
    description: "Natural earth colors for organic content"
  },
  "Jewel Tones": {
    colors: ["#7C2D12", "#581C87", "#1E40AF", "#065F46"],
    description: "Rich jewel colors for luxury content"
  },
  "Metallic Shine": {
    colors: ["#374151", "#6B7280", "#9CA3AF", "#D1D5DB"],
    description: "Metallic grays for premium products"
  }
}

export const TEXTURE_OPTIONS = {
  // Natural Textures
  "Paper": {
    category: "natural",
    description: "Classic paper texture for traditional feel"
  },
  "Canvas": {
    category: "natural", 
    description: "Artistic canvas texture for creative charts"
  },
  "Fabric": {
    category: "natural",
    description: "Soft fabric texture for gentle presentations"
  },
  "Leather": {
    category: "natural",
    description: "Premium leather texture for luxury content"
  },
  "Wood": {
    category: "natural",
    description: "Natural wood grain for organic feel"
  },
  "Stone": {
    category: "natural",
    description: "Rough stone texture for industrial themes"
  },
  "Marble": {
    category: "natural",
    description: "Elegant marble veining for sophisticated charts"
  },

  // Technical Textures
  "Metal": {
    category: "technical",
    description: "Sleek metal surface for modern tech charts"
  },
  "Glass": {
    category: "technical",
    description: "Transparent glass effect for clean design"
  },
  "Carbon Fiber": {
    category: "technical",
    description: "High-tech carbon fiber pattern for futuristic charts"
  },
  "Circuit Board": {
    category: "technical",
    description: "Electronic circuit patterns for tech content"
  },

  // Abstract Textures
  "Watercolor": {
    category: "abstract",
    description: "Artistic watercolor bleeding effects"
  },
  "Grunge": {
    category: "abstract",
    description: "Distressed grunge texture for edgy content"
  },
  "Noise": {
    category: "abstract",
    description: "Subtle noise texture for vintage feel"
  },
  "Gradient Mesh": {
    category: "abstract",
    description: "Smooth gradient mesh for modern aesthetics"
  },

  // Special
  "None": {
    category: "special",
    description: "No texture overlay"
  }
}

export const BACKGROUND_OPTIONS = {
  // Solid Colors
  "White": {
    type: "solid",
    value: "#FFFFFF",
    description: "Clean white background for maximum contrast"
  },
  "Black": {
    type: "solid", 
    value: "#000000",
    description: "Sleek black background for modern charts"
  },
  "Cream": {
    type: "solid",
    value: "#FEF7ED",
    description: "Warm cream background for elegant presentations"
  },
  "Navy": {
    type: "solid",
    value: "#1E3A8A",
    description: "Professional navy for corporate charts"
  },
  "Charcoal": {
    type: "solid",
    value: "#374151",
    description: "Sophisticated charcoal for premium content"
  },

  // Gradients
  "Sunrise": {
    type: "gradient",
    value: "linear-gradient(135deg, #FF6B6B, #FFD93D)",
    description: "Warm sunrise gradient for positive data"
  },
  "Sunset": {
    type: "gradient",
    value: "linear-gradient(135deg, #FF8A80, #FFB74D)",
    description: "Golden sunset gradient for engaging visuals"
  },
  "Ocean": {
    type: "gradient",
    value: "linear-gradient(135deg, #0077BE, #00B4D8)",
    description: "Cool ocean gradient for professional charts"
  },
  "Forest": {
    type: "gradient",
    value: "linear-gradient(135deg, #2D6A4F, #52B788)",
    description: "Natural forest gradient for eco-friendly content"
  },
  "Purple Haze": {
    type: "gradient",
    value: "linear-gradient(135deg, #7C3AED, #C026D3)",
    description: "Mystical purple gradient for creative content"
  },
  "Cotton Candy": {
    type: "gradient",
    value: "linear-gradient(135deg, #FFC8DD, #BDE0FE)",
    description: "Soft pastel gradient for gentle presentations"
  },

  // Patterns
  "Dots": {
    type: "pattern",
    value: "radial-gradient(circle, #E5E7EB 1px, transparent 1px)",
    description: "Subtle dot pattern for texture"
  },
  "Grid": {
    type: "pattern",
    value: "linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)",
    description: "Clean grid pattern for technical charts"
  },
  "Diagonal Lines": {
    type: "pattern",
    value: "repeating-linear-gradient(45deg, transparent, transparent 10px, #E5E7EB 10px, #E5E7EB 20px)",
    description: "Dynamic diagonal lines for movement"
  },
  "Hexagons": {
    type: "pattern",
    value: "radial-gradient(circle at 50% 50%, #E5E7EB 2px, transparent 2px)",
    description: "Modern hexagon pattern for tech content"
  },

  // Themed Backgrounds
  "Minimal White": {
    type: "themed",
    value: "#FFFFFF",
    description: "Ultra-clean white with subtle shadows"
  },
  "Corporate Blue": {
    type: "themed",
    value: "linear-gradient(135deg, #F8FAFC, #E0F2FE)",
    description: "Professional blue theme for business"
  },
  "Creative Colorful": {
    type: "themed",
    value: "linear-gradient(135deg, #FEF3C7, #FDE68A, #F3E8FF)",
    description: "Vibrant creative theme for artistic content"
  },
  "Dark Mode": {
    type: "themed",
    value: "linear-gradient(135deg, #1F2937, #374151)",
    description: "Modern dark theme for tech presentations"
  }
}

export const EXPORT_PRESETS = {
  "Instagram Post": { 
    width: 1080, 
    height: 1080, 
    aspectRatio: "1:1", 
    optimize: "vibrant",
    description: "Square format optimized for Instagram feed"
  },
  "LinkedIn Post": { 
    width: 1200, 
    height: 627, 
    aspectRatio: "16:9", 
    optimize: "professional",
    description: "Professional format for LinkedIn sharing"
  },
  "Twitter Card": { 
    width: 1200, 
    height: 675, 
    aspectRatio: "16:9", 
    optimize: "eye-catching",
    description: "Eye-catching format for Twitter/X posts"
  },
  "Blog Featured": { 
    width: 1920, 
    height: 1080, 
    aspectRatio: "16:9", 
    optimize: "editorial",
    description: "High-res format for blog headers"
  },
  "Pinterest Pin": { 
    width: 1000, 
    height: 1500, 
    aspectRatio: "2:3", 
    optimize: "vertical",
    description: "Vertical format for Pinterest pins"
  },
  "PowerPoint Slide": { 
    width: 1920, 
    height: 1080, 
    aspectRatio: "16:9", 
    optimize: "high-res",
    description: "Presentation-ready high resolution"
  }
}


