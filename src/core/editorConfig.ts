/**
 * Editor Configuration Types
 * Pluggable feature system
 */

/** Theme mode */
export type ThemeMode = 'light' | 'dark' | 'auto'

/** Theme preset */
export type ThemePreset = 'default' | 'notion' | 'typora' | 'word' | 'github' | 'custom'

/** Feature flags */
export interface FeatureFlags {
  // Basic features
  heading?: boolean
  textFormat?: boolean
  list?: boolean
  align?: boolean
  color?: boolean
  image?: boolean
  
  // Advanced features
  font?: boolean
  link?: boolean
  table?: boolean
  codeBlock?: boolean
  undoRedo?: boolean
  formatPainter?: boolean
  zoom?: boolean
  subscriptSuperscript?: boolean
  clearFormat?: boolean
  
  // Tools
  headerNav?: boolean
  footerNav?: boolean
  dragHandleMenu?: boolean
  floatingMenu?: boolean
  linkBubbleMenu?: boolean
  tableToolbar?: boolean
  imageToolbar?: boolean
  slashCommand?: boolean
  
  // AI
  ai?: boolean
  /** "AI Settings" entry (end users fill in their own API Key). Recommended to disable on public-facing sites */
  aiSettings?: boolean
}

/** AI configuration */
export interface AiConfig {
  provider: 'openai' | 'aliyun' | 'ollama' | 'deepseek'
  apiKey: string
  model?: string
  baseUrl?: string
}

/** Editor configuration */
export interface EditorConfig {
  /** Theme mode (light/dark/auto) */
  theme?: ThemeMode
  /** Theme preset */
  themePreset?: ThemePreset
  /** Custom theme CSS variables */
  customTheme?: Record<string, string>
  /** Feature flags */
  features?: FeatureFlags
  /** AI configuration */
  aiConfig?: AiConfig
  /** Locale */
  locale?: 'zh-CN' | 'zh-TW' | 'en-US'
  /** Readonly mode */
  readonly?: boolean
  /** Preview mode (no toolbar) */
  previewMode?: boolean
  /** Initial content */
  initialContent?: string
  /** Placeholder */
  placeholder?: string
  /** License key */
  licenseKey?: string
}

/** Preset configurations */
export const PRESET_CONFIGS = {
  /** Minimal config */
  minimal: {
    features: {
      textFormat: true,
      list: true,
      undoRedo: true,
    },
  } satisfies Partial<EditorConfig>,
  
  /** Basic config */
  basic: {
    features: {
      heading: true,
      textFormat: true,
      list: true,
      align: true,
      link: true,
      undoRedo: true,
      headerNav: true,
    },
  } satisfies Partial<EditorConfig>,
  
  /** Advanced config */
  advanced: {
    features: {
      heading: true,
      textFormat: true,
      list: true,
      align: true,
      color: true,
      image: true,
      font: true,
      link: true,
      table: true,
      codeBlock: true,
      undoRedo: true,
      formatPainter: true,
      zoom: true,
      headerNav: true,
      footerNav: true,
      dragHandleMenu: true,
      linkBubbleMenu: true,
      tableToolbar: true,
      imageToolbar: true,
      slashCommand: true,
    },
  } satisfies Partial<EditorConfig>,
  
  /** Full config (includes AI) */
  full: {
    features: {
      heading: true,
      textFormat: true,
      list: true,
      align: true,
      color: true,
      image: true,
      font: true,
      link: true,
      table: true,
      codeBlock: true,
      undoRedo: true,
      formatPainter: true,
      zoom: true,
      subscriptSuperscript: true,
      clearFormat: true,
      headerNav: true,
      footerNav: true,
      dragHandleMenu: true,
      floatingMenu: true,
      linkBubbleMenu: true,
      tableToolbar: true,
      imageToolbar: true,
      slashCommand: true,
      ai: true,
    },
  } satisfies Partial<EditorConfig>,
  
  /** Notion-style config - minimal toolbar + floating formatting */
  notion: {
    themePreset: 'notion' as ThemePreset,
    features: {
      // Fixed toolbar only keeps undo/redo
      undoRedo: true,
      
      // Floating toolbar (shown when text is selected)
      floatingMenu: true,
      linkBubbleMenu: true,

      // Slash command menu (type / to invoke)
      slashCommand: true,

      // Drag ordering (six-dot menu)
      dragHandleMenu: true,
      
      // Hide other buttons in the fixed toolbar
      heading: false,
      textFormat: false,
      list: false,
      align: false,
      color: false,
      image: false,
      font: false,
      link: false,
      table: false,
      codeBlock: false,
      formatPainter: false,
      zoom: false,
      headerNav: false,
      footerNav: false,
    },
  } satisfies Partial<EditorConfig>,
} as const

export type PresetName = keyof typeof PRESET_CONFIGS

/** Merge configs */
export function mergeConfig(
  preset: PresetName | Partial<EditorConfig>,
  overrides?: Partial<EditorConfig>
): EditorConfig {
  const base = typeof preset === 'string' ? PRESET_CONFIGS[preset] : preset
  return {
    theme: 'light',
    themePreset: 'default',
    locale: 'zh-CN',
    ...base,
    ...overrides,
    features: {
      ...base.features,
      ...overrides?.features,
    },
  }
}
