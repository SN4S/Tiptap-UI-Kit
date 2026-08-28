/**
 * Toolbar Configuration - Toolbar configuration types
 * @description Defines display configuration for toolbar tools
 */

/**
 * Toolbar tool configuration interface
 */
export interface ToolbarToolsConfig {
  /** Whether to display text formatting tools (bold, italic, underline, strike) */
  textFormat?: boolean
  /** Whether to display color picker (text color, background color) */
  colorPicker?: boolean
  /** Whether to display heading dropdown */
  heading?: boolean
  /** Whether to display list tools (ordered, bullet, task list) */
  list?: boolean
  /** Whether to display alignment tools */
  align?: boolean
  /** Whether to display image upload tool */
  image?: boolean
  /** Whether to display code block tool */
  codeBlock?: boolean
  /** Whether to display link tool */
  link?: boolean
  /** Whether to display table tool */
  table?: boolean
  /** Whether to display undo/redo tools */
  undoRedo?: boolean
  /** Whether to disable undo/redo tools (disabled in collaboration mode) */
  undoRedoDisabled?: boolean
  /** Whether to display format clear tool */
  clearFormat?: boolean
  /** Whether to display font tools */
  font?: boolean
  /** Whether to display line height tool */
  lineHeight?: boolean
  /** Whether to display subscript/superscript tools */
  subscriptSuperscript?: boolean
  /** Whether to display format painter tool */
  formatPainter?: boolean
  /** Whether to disable format painter tool in multi-user collaboration mode */
  formatPainterDisabled?: boolean
  /** Whether to display Word import/export tools */
  word?: boolean
  /** Whether to display template insertion tool */
  template?: boolean
  /** Whether to display gallery tool */
  gallery?: boolean
  /** Whether to display AI tools */
  ai?: boolean
}

/**
 * Default toolbar config (displays all tools)
 */
export const DEFAULT_TOOLBAR_CONFIG: ToolbarToolsConfig = {
  textFormat: true,
  colorPicker: true,
  heading: true,
  list: true,
  align: true,
  image: true,
  codeBlock: false,
  link: false,
  table: false,
  undoRedo: false,
  clearFormat: false,
  font: false,
  lineHeight: false,
  subscriptSuperscript: false,
  formatPainter: false,
  ai: true,
}

/**
 * Basic toolbar config (displays basic tools only)
 */
export const BASIC_TOOLBAR_CONFIG: ToolbarToolsConfig = {
  textFormat: true,
  colorPicker: true,
  heading: true,
  list: true,
  align: true,
  image: true,
  codeBlock: false,
  link: false,
  table: false,
  undoRedo: false,
  clearFormat: false,
  font: false,
  lineHeight: false,
  subscriptSuperscript: false,
  formatPainter: false,
  ai: true,
}

/**
 * Advanced toolbar config (includes extended features)
 */
export const ADVANCED_TOOLBAR_CONFIG: ToolbarToolsConfig = {
  textFormat: true,
  colorPicker: true,
  heading: true,
  list: true,
  align: true,
  image: true,
  codeBlock: true,
  link: true,
  table: true,
  undoRedo: true,
  clearFormat: true,
  font: true,
  lineHeight: true,
  subscriptSuperscript: true,
  formatPainter: true,
  word: true,
  template: true,
  gallery: true,
  ai: true,
}

