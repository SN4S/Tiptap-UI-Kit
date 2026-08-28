/**
 * TiptapPro Tenant Editor Types
 * @description Editor type definitions (supports version configuration)
 */
import type { JSONContent } from '@tiptap/core'
import type { Editor } from '@tiptap/vue-3'

/**
 * Version type
 */
export type EditorVersion = 'minimal' | 'basic' | 'advanced' | 'premium'

/**
 * Editor feature configuration
 */
export interface FeatureConfig {
  /** Whether to enable drag functionality */
  dragHandle?: boolean
  /** Whether to enable the six-dot (drag handle menu) feature */
  dragHandleMenu?: boolean
  /** Whether to enable table feature */
  table?: boolean
  /** Whether to enable the table toolbar (disabled by default, must be explicitly enabled) */
  tableToolbar?: boolean
  /** Whether to enable @mention feature */
  mention?: boolean
  /** Whether to enable slash command menu (type / to show block type selection) */
  slashCommand?: boolean
  /** Whether to enable the AI document assistant chat panel (text-command editing), follows the AI feature, can be explicitly disabled */
  aiChat?: boolean
  /** Whether to show the "AI Settings" entry (dialog where end users enter their own API Key).
   *  Recommended to disable for public-facing sites - visitors won't fill in their keys on unfamiliar pages; AI configuration should be done by the integrator in the project */
  aiSettings?: boolean
  /** Whether to enable the floating menu feature */
  floatingMenu?: boolean
  /** Whether to enable the image toolbar feature */
  image?: boolean
  /** Whether to enable the link bubble menu feature */
  linkBubbleMenu?: boolean
  /** Whether to enable collaboration editing */
  collaboration?: boolean
  /** Whether to enable the header navigation */
  headerNav?: boolean
  /** Whether to enable the footer navigation */
  footerNav?: boolean
}

/**
 * Version configuration interface
 */
export interface VersionConfig {
  /** Version type (basic/advanced/pro) */
  version?: EditorVersion
  /** Feature toggle configuration */
  features?: {
    /** Basic version features */
    basic?: boolean
    /** Advanced version features */
    advanced?: boolean
    /** AI features */
    ai?: boolean
    /** Collaboration editing */
    collaboration?: boolean
    /** Header navigation */
    headerNav?: boolean
    /** Footer navigation */
    footerNav?: boolean
    /** Preview mode */
    previewMode?: boolean
  }
}

/**
 * Editor Props
 */
export interface TiptapProEditorProps {
  /** Version configuration */
  version?: EditorVersion
  /** Version config object (mutually exclusive with version) */
  versionConfig?: VersionConfig
  /** Zoom bar placement: bottom fixed or below toolbar */
  zoomBarPlacement?: 'bottom' | 'belowToolbar'
  /** Whether readonly mode */
  readonly?: boolean
  /** Whether preview mode (no header/footer navigation, non-editable, non-clickable) */
  previewMode?: boolean
  /** Document ID (used for loading, saving and the collaboration room) */
  documentId?: string
  /** v-model bound content - HTML string or JSON object (HTML synced when string, JSON when object); takes priority over initialContent as initial content */
  modelValue?: string | object
  /** initial content - can be HTML string or JSON object (ProseMirror format) */
  initialContent?: string | object
  /** Table bubble display mode: 1=focus display; 2=cell-selected display */
  tableMenuShowMode?: 1 | 2
  /** Feature config (backward-compatible) */
  features?: FeatureConfig
  /** Language setting */
  locale?: string
}

/**
 * Collaborator user info
 */
export interface CollaboratorInfo {
  id: string | number
  name: string
  color: string
}

/**
 * Editor instance reference
 */
export interface EditorInstance {
  editor: Editor | null
  getEditor: () => Editor | null
  getJSON: () => JSONContent | null
  getHTML: () => string
  getText: () => string
}

/**
 * Editor exposed methods
 */
export interface TiptapProEditorExpose {
  getEditor: () => Editor | null
  getJSON: () => JSONContent | null
  getHTML: () => string
  getText: () => string
}

