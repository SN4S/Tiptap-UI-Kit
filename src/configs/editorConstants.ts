/**
 * Editor Constants
 * @description Editor constant configuration (colors, fonts, font sizes, etc.)
 */

/**
 * Text color options
 */
export const TEXT_COLORS = [
  '#000000', // black
  '#ff0000', // red
  '#ff9900', // orange
  '#ffff00', // yellow
  '#00ff00', // green
  '#00ffff', // cyan
  '#0000ff', // blue
  '#9900ff', // purple
] as const

/**
 * Background color options
 */
export const BACKGROUND_COLORS = [
  '#ffffff', // white
  '#f5f5f5', // light gray
  '#e8f5e9', // light green
  '#e3f2fd', // light blue
  '#fff3e0', // light orange
  '#fce4ec', // light pink
  '#f3e5f5', // light purple
  '#e0f2f1', // light cyan
] as const

/**
 * Table cell background color options
 */
export const TABLE_CELL_COLORS = BACKGROUND_COLORS

/**
 * Font family options
 */
export const FONT_FAMILIES = [
  /** empty value means font follows theme default; display text is rendered by components using i18n */
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Monospace', value: 'monospace' },
  { label: 'Microsoft YaHei', value: 'Microsoft YaHei' },
  { label: 'SimSun', value: 'SimSun' },
  { label: 'SimHei', value: 'SimHei' },
  { label: 'PMingLiU', value: 'PMingLiU' },
] as const

/**
 * Font size options (Chinese print standard)
 */
export const FONT_SIZES = [
  { label: '12', value: '12px' },
  { label: '14', value: '14px' },
  { label: '16', value: '16px' },
  { label: '18', value: '18px' },
  { label: '20', value: '20px' },
  { label: '24', value: '24px' },
  { label: '28', value: '28px' },
  { label: '32', value: '32px' },
] as const

/**
 * Line height options
 */
export const LINE_HEIGHTS = [
  { label: '1.0', value: '1' },
  { label: '1.5', value: '1.5' },
  { label: '2.0', value: '2' },
  { label: '2.5', value: '2.5' },
  { label: '3.0', value: '3' },
] as const

/**
 * Paragraph style options
 */
export const HEADING_OPTIONS = [
  { label: 'Paragraph', value: 'paragraph' },
  { label: 'H1', value: 'h1' },
  { label: 'H2', value: 'h2' },
  { label: 'H3', value: 'h3' },
  { label: 'H4', value: 'h4' },
  { label: 'H5', value: 'h5' },
  { label: 'H6', value: 'h6' },
] as const

/**
 * Code block language options
 */
export const CODE_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'html',
  'css',
  'json',
  'bash',
  'sql',
  'php',
  'go',
  'rust',
  'c',
  'cpp',
  'csharp',
  'swift',
  'kotlin',
  'ruby',
  'markdown',
  'xml',
] as const

/**
 * Alignment options
 */
export const TEXT_ALIGN_OPTIONS = [
  { label: 'Align Left', value: 'left' },
  { label: 'Align Center', value: 'center' },
  { label: 'Align Right', value: 'right' },
  { label: 'Justify', value: 'justify' },
] as const

/**
 * Table border style options
 */
export const TABLE_BORDER_STYLES = [
  { label: 'Default Border', value: 'default' },
  { label: 'No Border', value: 'none' },
  { label: 'Outer Border', value: 'outer' },
] as const

/**
 * Default config values
 */
export const DEFAULT_VALUES = {
  /** default font (empty = follows theme default, not written into style) */
  fontFamily: '',
  /** default font size */
  fontSize: '16px',
  /** default line height */
  lineHeight: '1.5',
  /** default text color */
  textColor: '#000000',
  /** default background color */
  backgroundColor: '#ffffff',
  /** default alignment */
  textAlign: 'left',
  /** default code language */
  codeLanguage: 'javascript',
} as const

/**
 * Editor limits
 */
export const EDITOR_LIMITS = {
  /** minimum zoom */
  minZoom: 50,
  /** maximum zoom */
  maxZoom: 200,
  /** zoom step */
  zoomStep: 10,
  /** maximum document length (characters) */
  maxDocumentLength: 1000000,
  /** maximum heading level */
  maxHeadingLevel: 6,
} as const

/**
 * Keyboard shortcut config
 */
export const KEYBOARD_SHORTCUTS = {
  bold: 'Mod-b',
  italic: 'Mod-i',
  underline: 'Mod-u',
  strike: 'Mod-Shift-s',
  code: 'Mod-e',
  codeBlock: 'Mod-Shift-e',
  link: 'Mod-k',
  undo: 'Mod-z',
  redo: ['Mod-Shift-z', 'Mod-y'],
  paragraph: 'Mod-Alt-0',
  heading1: 'Mod-Alt-1',
  heading2: 'Mod-Alt-2',
  heading3: 'Mod-Alt-3',
  bulletList: 'Mod-Shift-8',
  orderedList: 'Mod-Shift-7',
  taskList: 'Mod-Shift-9',
} as const

/**
 * UI config
 */
export const UI_CONFIG = {
  /** toolbar button size */
  toolbarButtonSize: 28,
  /** toolbar height */
  toolbarHeight: 56,
  /** toolbar gap */
  toolbarGap: 6,
  /** color panel column count */
  colorPanelColumns: 8,
  /** color panel swatch size */
  colorItemSize: 24,
  /** bubble menu offset */
  bubbleMenuOffset: 8,
} as const

/**
 * @note all type definitions have been migrated to shared/configs/toolbar.ts
 * To use types, import from shared/configs/toolbar
 * This file only keeps constant configs; type definitions have been removed
 */

