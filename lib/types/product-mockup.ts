// Product Mockup Generation Types
export type LightingPreset = {
  name: string;
  mood: string;              // short human description
  hints?: string[];          // internal nudges (e.g., "prefer_rim", "no_hard_shadows")
};

export type BackgroundEnv = {
  name: string;
  mood: string;
  paletteHints?: ("brandPrimary" | "brandSecondary" | "neutralWarm" | "neutralCool")[];
  materialHints?: ("glass" | "metal" | "marble" | "wood" | "paper" | "velvet" | "concrete" | "fabric" | "acrylic")[];
};

export type MoodEffect = {
  expression?: "neutral" | "smile" | "serious" | "energetic" | "calm" | "mysterious";
  contrastDelta?: number;     // -40..+40 %
  saturationDelta?: number;   // -40..+40 %
  temp?: "warm" | "neutral" | "cool";
  fontBias?: "serif" | "sans" | "condensed" | "rounded" | "monospace" | "script" | "display" | "handwriting" | "decorative" | "modern" | "classic" | "futuristic" | "elegant" | "bold" | "minimal" | "vintage" | "tech" | "artistic" | "playful" | "professional" | "luxury" | "casual" | "formal" | "creative" | "clean" | "stylized" | "geometric" | "organic" | "industrial" | "romantic" | "edgy" | "sophisticated" | "friendly" | "dramatic" | "subtle" | "expressive" | "refined" | "dynamic" | "serene" | "energetic" | "mysterious" | "vibrant" | "calm" | "powerful" | "gentle" | "striking" | "smooth" | "rough" | "precise" | "flowing" | "structured" | "freeform" | "technical" | "corporate" | "personal" | "trendy" | "timeless" | "innovative" | "traditional" | "contemporary" | "retro" | "cutting-edge" | "nostalgic" | "avant-garde" | "minimalist" | "maximalist" | "raw" | "polished" | "rustic" | "urban" | "natural" | "synthetic" | "warm" | "cool" | "neutral" | "delicate" | "strong" | "soft" | "hard" | "fluid" | "rigid" | "curved" | "angular" | "sharp" | "blunt" | "pointed" | "textured" | "flat" | "dimensional" | "layered" | "simple" | "complex" | "abstract" | "literal" | "symbolic" | "direct" | "indirect" | "obvious" | "loud" | "quiet" | "bright" | "dark" | "light" | "heavy" | "thin" | "thick" | "wide" | "narrow" | "tall" | "short" | "expanded" | "extended" | "compressed" | "spacious" | "tight" | "loose" | "dense" | "sparse" | "full" | "empty" | "rich" | "poor" | "luxurious" | "basic" | "premium" | "standard" | "exclusive" | "common" | "rare" | "unique" | "ordinary" | "special" | "regular" | "irregular" | "consistent" | "inconsistent" | "stable" | "unstable" | "balanced" | "unbalanced" | "symmetrical" | "asymmetrical" | "proportional" | "disproportional" | "harmonious" | "discordant" | "melodic" | "rhythmic" | "static" | "still" | "moving" | "frozen" | "solid" | "liquid" | "gaseous" | "crystalline" | "amorphous" | "unstructured" | "organized" | "chaotic" | "orderly" | "random" | "planned" | "spontaneous" | "calculated" | "intuitive" | "logical" | "emotional" | "rational" | "irrational" | "scientific" | "mathematical" | "poetic" | "prosaic" | "lyrical" | "musical" | "visual" | "tactile" | "auditory" | "olfactory" | "gustatory" | "kinesthetic" | "spatial" | "temporal" | "conceptual" | "perceptual" | "cognitive" | "affective" | "behavioral" | "physiological" | "psychological" | "social" | "cultural" | "historical" | "postmodern" | "premodern" | "antique" | "neo" | "proto" | "meta" | "para" | "anti" | "pro" | "pre" | "post" | "inter" | "intra" | "trans" | "cis" | "ultra" | "infra" | "super" | "sub" | "hyper" | "hypo" | "macro" | "micro" | "mega" | "mini" | "maxi" | "giga" | "tera" | "peta" | "exa" | "zetta" | "yotta" | "deca" | "hecto" | "kilo" | "milli" | "nano" | "pico" | "femto" | "atto" | "zepto" | "yocto"; // Massive font collection
  ctaStyleHints?: string[];   // e.g., "boxed_glow", "underline", "no_bg"
};

export type CompositionHint = {
  templates: ("Centered Hero" | "Rule of Thirds" | "Floating Object" | "Flat Lay" | "Collage")[];
  defaultObjectCount: 1 | 2 | 3;
  shadow: ("Soft" | "Hard" | "Floating" | "Mirror")[];
};

export type VisualInfluence = {
  label: string;
  desc: string;
  thumb?: string;
  lightingPresets: LightingPreset[];
  backgroundEnvironments: BackgroundEnv[];
  moodContexts: { name: string; effect: MoodEffect; desc?: string }[];
  compositionHints?: CompositionHint;
  materialBias?: { prefer?: string[]; avoid?: string[] }; // e.g., prefer: ["metal","glass"]
};

export type StyleMap = {
  [artDirection: string]: VisualInfluence[];
};

// Product Mockup Generation Request
export type ProductMockupGenerationRequest = {
  // Basic Settings
  prompt: string;
  imageCount?: number; // 1-4 (optional, backend decides default)
  aspectRatio: "1:1" | "4:5" | "16:9" | "9:16" | "2:1" | "3:4" | "2:3" | "4:3" | "3:2";
  
  // Product Photos (base64 encoded strings)
  productPhotos?: string[];
  
  // Logo Upload (base64 encoded string)
  logoFile?: string; // Single logo file as base64
  logoUsagePrompt?: string; // How to use the logo in the mockup
  
  // Art Direction & Visual Influence
  artDirection?: string;
  visualInfluence?: string;
  lightingPreset?: string;
  backgroundEnvironment?: string;
  moodContext?: string;
  
  // Composition & Branding
  compositionTemplate: "Centered Hero" | "Rule of Thirds" | "Floating Object" | "Flat Lay" | "Collage";
  objectCount: 1 | 2 | 3;
  shadowType: "Soft" | "Hard" | "Floating" | "Mirror";
  logoPlacement: string[];
  logoDescription?: string;
  
  // Text & CTA Overlay
  headline?: string;
  headlineColor?: string;
  headlineColorAuto?: boolean;
  subtext?: string;
  subtextColor?: string;
  subtextColorAuto?: boolean;
  ctaText?: string;
  ctaColor?: string;
  ctaColorAuto?: boolean;
  fontFamily: "serif" | "sans" | "condensed" | "rounded" | "monospace" | "script" | "display" | "handwriting" | "decorative" | "modern" | "classic" | "futuristic" | "elegant" | "bold" | "minimal" | "vintage" | "tech" | "artistic" | "playful" | "professional" | "luxury" | "casual" | "formal" | "creative" | "clean" | "stylized" | "geometric" | "organic" | "industrial" | "romantic" | "edgy" | "sophisticated" | "friendly" | "dramatic" | "subtle" | "expressive" | "refined" | "dynamic" | "serene" | "energetic" | "mysterious" | "vibrant" | "calm" | "powerful" | "gentle" | "striking" | "smooth" | "rough" | "precise" | "flowing" | "structured" | "freeform" | "technical" | "corporate" | "personal" | "trendy" | "timeless" | "innovative" | "traditional" | "contemporary" | "retro" | "cutting-edge" | "nostalgic" | "avant-garde" | "minimalist" | "maximalist" | "raw" | "polished" | "rustic" | "urban" | "natural" | "synthetic" | "warm" | "cool" | "neutral" | "delicate" | "strong" | "soft" | "hard" | "fluid" | "rigid" | "curved" | "angular" | "sharp" | "blunt" | "pointed" | "textured" | "flat" | "dimensional" | "layered" | "simple" | "complex" | "abstract" | "literal" | "symbolic" | "direct" | "indirect" | "obvious" | "loud" | "quiet" | "bright" | "dark" | "light" | "heavy" | "thin" | "thick" | "wide" | "narrow" | "tall" | "short" | "expanded" | "extended" | "compressed" | "spacious" | "tight" | "loose" | "dense" | "sparse" | "full" | "empty" | "rich" | "poor" | "luxurious" | "basic" | "premium" | "standard" | "exclusive" | "common" | "rare" | "unique" | "ordinary" | "special" | "regular" | "irregular" | "consistent" | "inconsistent" | "stable" | "unstable" | "balanced" | "unbalanced" | "symmetrical" | "asymmetrical" | "proportional" | "disproportional" | "harmonious" | "discordant" | "melodic" | "rhythmic" | "static" | "still" | "moving" | "frozen" | "solid" | "liquid" | "gaseous" | "crystalline" | "amorphous" | "unstructured" | "organized" | "chaotic" | "orderly" | "random" | "planned" | "spontaneous" | "calculated" | "intuitive" | "logical" | "emotional" | "rational" | "irrational" | "scientific" | "mathematical" | "poetic" | "prosaic" | "lyrical" | "musical" | "visual" | "tactile" | "auditory" | "olfactory" | "gustatory" | "kinesthetic" | "spatial" | "temporal" | "conceptual" | "perceptual" | "cognitive" | "affective" | "behavioral" | "physiological" | "psychological" | "social" | "cultural" | "historical" | "postmodern" | "premodern" | "antique" | "neo" | "proto" | "meta" | "para" | "anti" | "pro" | "pre" | "post" | "inter" | "intra" | "trans" | "cis" | "ultra" | "infra" | "super" | "sub" | "hyper" | "hypo" | "macro" | "micro" | "mega" | "mini" | "maxi" | "giga" | "tera" | "peta" | "exa" | "zetta" | "yotta" | "deca" | "hecto" | "kilo" | "milli" | "nano" | "pico" | "femto" | "atto" | "zepto" | "yocto"; // Massive font collection
  fontWeight: "light" | "normal" | "medium" | "bold";
  textCase: "uppercase" | "title" | "sentence";
  letterSpacing: number;
  lineHeight: number;
  textAlignment: "left" | "center" | "right";
  textEffects: string[]; // ["brilliance", "frosted_glass", "drop_shadow"]
  
  // Advanced Typography
  highlightStyle: "underline" | "boxed" | "glow" | "gradient" | "none";
  accentElement: "line" | "shape" | "dot" | "none";
  brilliance: number;
  frostedGlass: boolean;
  dropShadowIntensity: number;
  motionAccent: "fade" | "slide" | "sweep" | "none";
  
  // Alignment & Positioning
  layoutMode: "centered" | "left" | "right" | "split";
  verticalPosition: number;
  horizontalOffset: number;
  smartAnchor: boolean;
  safeZones: boolean;
  
  // Casting & Multiplicity
  useAvatars: boolean;
  selectedAvatarId?: string; // From existing AvatarPersonaGeneratorInterface
  useBasicAvatar?: boolean;
  basicAvatar?: {
    age: "18-25" | "26-35" | "36-45" | "46-55" | "55+";
    race: "Caucasian" | "African" | "Asian" | "Hispanic" | "Middle Eastern" | "Mixed" | "Other";
    gender: "Male" | "Female" | "Non-binary";
    description?: string;
  };
  avatarRole: "Model" | "User" | "Mascot" | "Spokesperson";
  avatarInteraction: "Holding" | "Wearing" | "Using" | "Observing";
  productMultiplicity: "Single" | "Lineup" | "Bundle";
  angleVarietyCount: 1 | 2 | 3 | 4 | 5;
  
  // Platform Target
  platformTarget?: "Instagram" | "Facebook" | "TikTok" | "YouTube" | "Banner" | "Print";
  
  // Brand Kit
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // Metadata
  metadata?: Record<string, any>;
};

// Avatar Selection (from existing AvatarPersonaGeneratorInterface)
// Updated to support avatar-persona-generation API fields
export type AvailableAvatar = {
  id: string;
  title: string;
  persona_name?: string; // Nouveau champ prioritaire
  image: string;
  description?: string;
  role_archetype?: string; // Format snake_case de l'API
  roleArchetype?: string; // Rétrocompatibilité
  age_range?: string;
  ageRange?: string;
  gender_expression?: string;
  genderExpression?: string;
  outfit_category?: string;
  outfitCategory?: string;
  art_direction?: string;
  visual_influence?: string;
  mood_context?: string;
  aspect_ratio?: string;
  image_count?: number;
  status?: string;
  created_at: string;
  updated_at?: string;
  content?: any;
  metadata?: any;
};

// Generation Result
export type ProductMockupGenerationResult = {
  success: boolean;
  images: string[]; // Now contains storage paths instead of temporary URLs
  metadata: {
    generationId: string;
    timestamp: string;
    settings: ProductMockupGenerationRequest;
    variations: Array<{
      storagePath: string;
      originalUrl?: string; // Keep original URL for reference
      variationType: string;
      settings: Partial<ProductMockupGenerationRequest>;
    }>;
    storagePaths?: string[]; // Include storage paths in metadata
  };
  error?: string;
};
