/**
 * Toolbar Types
 * @description Type definitions related to the toolbar
 */

import type { Component } from 'vue'
import type { Editor } from '@tiptap/core'

/**
 * Text format type names
 */
export type TextFormatType = 'bold' | 'italic' | 'underline' | 'strike' | 'code'

/**
 * Text format config interface
 */
export interface TextFormatConfig {
  /** format type name */
  name: TextFormatType
  /** icon component */
  icon: Component
  /** format title */
  title: string
  /** operation executed on click */
  action: () => void
}

/**
 * Toolbar button config interface
 */
export interface ToolbarButtonConfig {
  /** button name/identifier */
  name: string
  /** button icon component */
  icon?: Component
  /** button title (hover tooltip) */
  title: string
  /** operation executed on click */
  action: () => void
  /** whether disabled */
  disabled?: boolean
}

/**
 * Heading level type
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Heading value type (includes body text)
 */
export type HeadingValue = 'paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

/**
 * Heading config interface
 */
export interface HeadingConfig {
  /** heading level (1-6) */
  level: HeadingLevel
  /** heading title */
  title: string
  /** operation executed on click */
  action: () => void
}

/**
 * Color tool config interface
 */
export interface ColorToolConfig {
  /** color type (text or background) */
  type: 'text' | 'bg' | 'highlight'
  /** tool title */
  title: string
  /** icon component */
  icon: Component
  /** operation executed when selecting a color */
  action: (color: string) => void
}

/**
 * Table operation config interface
 */
export interface TableOperationConfig {
  /** operation name */
  name: string
  /** icon component */
  icon: Component
  /** operation title */
  title: string
  /** corresponding editor command name */
  command: string
  /** operation executed on click */
  action: () => void
}

/**
 * List type names
 */
export type ListType = 'bulletList' | 'orderedList' | 'taskList'

/**
 * List tool config interface
 */
export interface ListToolConfig {
  /** list type name */
  name: ListType
  /** icon component */
  icon: Component
  /** tool title */
  title: string
  /** operation executed on click */
  action: () => void
}

/**
 * Alignment type
 */
export type AlignValue = 'left' | 'center' | 'right' | 'justify'

/**
 * Alignment tool config interface
 */
export interface AlignToolConfig {
  /** alignment value */
  value: AlignValue
  /** icon component */
  icon: Component
  /** tool title */
  title: string
  /** operation executed on click */
  action: () => void
}

/**
 * Insert tool config interface
 */
export interface InsertToolConfig {
  /** inserted content type */
  name: 'link' | 'image' | 'table' | 'codeBlock'
  /** icon component */
  icon: Component
  /** tool title */
  title: string
  /** operation executed on click */
  action: () => void
}

/**
 * AI tool config interface
 */
export interface AiToolConfig {
  /** AI feature name */
  name: 'continueWriting' | 'polish' | 'summarize' | 'translate' | 'customAi'
  /** icon component */
  icon: Component
  /** tool title */
  title: string
  /** operation executed on click */
  action: () => void
}

/**
 * Dropdown menu item interface
 */
export interface MenuItemConfig {
  /** menu item key */
  key: string
  /** menu item label */
  label: string
  /** icon component (optional) */
  icon?: Component
  /** operation executed on click */
  action: () => void
  /** whether disabled */
  disabled?: boolean
  /** whether a danger operation (red) */
  danger?: boolean
  /** whether active (used to show active state) */
  active?: boolean
  /** sub menu items (optional) */
  children?: MenuItemConfig[]
}

/**
 * Menu group interface
 */
export interface MenuGroupConfig {
  /** group title */
  title: string
  /** menu items in the group */
  items: MenuItemConfig[]
}

/**
 * Toolbar config factory function type
 */
export type ToolbarConfigFactory<T> = (editor: Editor) => T[]

/**
 * Edit action config interface
 */
export interface EditActionConfig {
  /** icon component */
  icon: Component
  /** action title */
  title: string
  /** operation executed on click */
  action: () => void | Promise<void>
  /** whether a danger operation */
  danger?: boolean
}

/**
 * Selector option interface
 */
export interface SelectOption<T = string> {
  /** display label */
  label: string
  /** option value */
  value: T
}

/**
 * Toolbar group config interface
 */
export interface ToolbarGroupConfig {
  /** group name */
  name: string
  /** button configs in the group */
  buttons: ToolbarButtonConfig[]
  /** whether to show a divider line */
  showDivider?: boolean
}

/**
 * Full toolbar config interface
 */
export interface FullToolbarConfig {
  /** text format tools */
  textFormats: ToolbarButtonConfig[]
  /** heading tools */
  headings: HeadingConfig[]
  /** color tools */
  colorTools: ColorToolConfig[]
  /** list tools */
  listTools: ListToolConfig[]
  /** alignment tools */
  alignTools: AlignToolConfig[]
  /** insert tools */
  insertTools: InsertToolConfig[]
  /** table tools */
  tableTools?: {
    rowTools: TableOperationConfig[]
    colTools: TableOperationConfig[]
    cellTools: TableOperationConfig[]
  }
  /** AI tools */
  aiTools: AiToolConfig[]
}

/**
 * Bubble menu config interface
 */
export interface BubbleMenuConfig {
  /** whether to show the menu */
  shouldShow: (props: {
    editor: Editor
    from: number
    to: number
    state: any
  }) => boolean
  /** menu position */
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** Tippy.js config options */
  tippyOptions?: Record<string, any>
}

/**
 * Command parameter type mapping
 */
export interface CommandParams {
  toggleBold: []
  toggleItalic: []
  toggleUnderline: []
  toggleStrike: []
  toggleSubscript: []
  toggleSuperscript: []
  toggleCode: []
  setColor: [color: string]
  setHighlight: [options: { color: string }]
  setFontFamily: [fontFamily: string]
  setFontSize: [fontSize: string]
  setTextAlign: [align: AlignValue]
  toggleHeading: [options: { level: number }]
  setHeading: [options: { level: number }]
  setParagraph: []
  toggleBulletList: []
  toggleOrderedList: []
  toggleTaskList: []
  insertTable: [options: { rows: number; cols: number; withHeaderRow?: boolean }]
  addRowBefore: []
  addRowAfter: []
  deleteRow: []
  addColumnBefore: []
  addColumnAfter: []
  deleteColumn: []
  mergeCells: []
  splitCell: []
  toggleHeaderRow: []
  toggleHeaderColumn: []
  deleteTable: []
  setLink: [options: { href: string }]
  unsetLink: []
  setCodeBlock: [options: { language: string }]
  insertContent: [content: string | Record<string, any>]
  setCellAttribute: [name: string, value: any]
}

/**
 * Editor state type
 */
export interface EditorStateInfo {
  /** whether undo is possible */
  canUndo: boolean
  /** whether redo is possible */
  canRedo: boolean
  /** currently active marks */
  activeMarks: string[]
  /** currently active nodes */
  activeNodes: string[]
  /** current paragraph style */
  paragraphStyle: string
  /** current text alignment */
  textAlign: string
  /** whether in a table */
  isInTable: boolean
  /** whether there is a selection */
  hasSelection: boolean
  /** whether the selection is empty */
  isEmptySelection: boolean
}

// ===== Type definitions migrated from editorConstants =====
// These types are derived from the constant arrays in editorConstants.ts
// The constant definitions remain in editorConstants.ts, type definitions are managed uniformly here
// Note: these types need to import constants from editorConstants.ts to derive precise types

/**
 * Text color type
 * @note the actual type is derived from the TEXT_COLORS constant, see editorConstants.ts
 */
export type TextColor = string

/**
 * Background color type
 * @note the actual type is derived from the BACKGROUND_COLORS constant, see editorConstants.ts
 */
export type BackgroundColor = string

/**
 * Font family type
 * @note the actual type is derived from the FONT_FAMILIES constant, see editorConstants.ts
 */
export type FontFamily = string

/**
 * Font size type
 * @note the actual type is derived from the FONT_SIZES constant, see editorConstants.ts
 */
export type FontSize = string

/**
 * Line height type
 * @note the actual type is derived from the LINE_HEIGHTS constant, see editorConstants.ts
 */
export type LineHeight = string

/**
 * Code language type
 * @note the actual type is derived from the CODE_LANGUAGES constant, see shared/configs/editorConstants.ts
 */
export type CodeLanguage = string

/**
 * Table border style type
 * @note the actual type is derived from the TABLE_BORDER_STYLES constant, see editorConstants.ts
 */
export type TableBorderStyle = string

