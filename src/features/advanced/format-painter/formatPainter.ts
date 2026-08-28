/**
 * FormatPainter Extension - Format Painter
 * @description Samples current selection style and applies to target selection
 */
import { Extension } from '@tiptap/core'
import type { Editor } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'

// Add type declarations for custom commands to extend RawCommands
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    formatPainter: {
      /** 
       * Enable format painter and sample current selection style
       * @param mode - Mode: 1 for single-use (default), 2 for continuous mode
       */
      startFormatPainting: (mode?: 1 | 2) => ReturnType
      /** Enable continuous format painter mode */
      startContinuousFormatPainting: () => ReturnType
      /** Apply sampled style to current selection */
      applyFormat: () => ReturnType
      /** Cancel format painter state and clear cache */
      cancelFormatPainting: () => ReturnType
      /** Toggle continuous mode */
      toggleContinuousMode: () => ReturnType
    }
  }
}

export interface FormatPainterStorage {
  /** Whether format painter is active */
  isActive: boolean
  /** Whether continuous application mode */
  isContinuous: boolean
  /** Sampled format */
  formats: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    strike?: boolean
    subscript?: boolean
    superscript?: boolean
    color?: string | null
    highlight?: string | null
    fontFamily?: string | null
    fontSize?: string | null
    textAlign?: 'left' | 'center' | 'right' | 'justify' | null
    lineHeight?: string | null
  }
}

/** Local storage key name */
const STORAGE_KEY = 'tiptap-format-painter-formats'

export type FormatPainterFormats = FormatPainterStorage['formats']

/**
 * Sample formatting style of current selection
 * @param editor - Tiptap editor instance
 * @returns Format object, or null if sampling failed
 * @description Extract all formatting info from selection including text styles, colors, alignment, etc.
 */
export function sampleFormats(editor: Editor): FormatPainterFormats | null {
  try {
    const formats: FormatPainterFormats = {}

    // Basic text styles
    formats.bold = editor.isActive('bold')
    formats.italic = editor.isActive('italic')
    formats.underline = editor.isActive('underline')
    formats.strike = editor.isActive('strike')
    formats.subscript = editor.isActive('subscript')
    formats.superscript = editor.isActive('superscript')

    // Get color and font styles from textStyle
    const textStyleAttrs = editor.getAttributes('textStyle') as {
      color?: string
      fontFamily?: string
      fontSize?: string
      lineHeight?: string
    }
    formats.color = textStyleAttrs?.color ?? null
    formats.fontFamily = textStyleAttrs?.fontFamily ?? null
    formats.fontSize = textStyleAttrs?.fontSize ?? null
    formats.lineHeight = textStyleAttrs?.lineHeight ?? null

    // Get background highlight color from highlight mark
    const highlightAttrs = editor.getAttributes('highlight') as { color?: string }
    formats.highlight = highlightAttrs?.color ?? null

    // Alignment (may exist on paragraph or heading)
    const paragraphAttrs = editor.getAttributes('paragraph') as {
      textAlign?: 'left' | 'center' | 'right' | 'justify'
    }
    const headingAttrs = editor.getAttributes('heading') as {
      textAlign?: 'left' | 'center' | 'right' | 'justify'
    }
    formats.textAlign = paragraphAttrs?.textAlign ?? headingAttrs?.textAlign ?? null

    return formats
  } catch (error) {
    return null
  }
}

/**
 * Save format to browser local storage
 * @param formats - Format object
 */
function saveFormatsToStorage(formats: FormatPainterFormats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formats))
  } catch (error) {
    // ignore
  }
}

/**
 * Load format from browser local storage
 * @returns Format object, or null if not found
 */
function loadFormatsFromStorage(): FormatPainterFormats | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data) as FormatPainterFormats
    }
  } catch (error) {
    // ignore
  }
  return null
}

/**
 * Clear format in browser local storage
 */
function clearFormatsFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    // ignore
  }
}

/**
 * Update format painter cursor style
 * @param editor - Tiptap editor instance
 * @param add - Whether to add style class (true: add, false: remove)
 * @description Adds or removes format painter cursor style class
 */
function updateCursorStyle(editor: Editor, add: boolean): void {
  try {
    const dom = editor.view.dom as HTMLElement
    if (add) {
      dom.classList.add('cursor-format-painter')
    } else {
      dom.classList.remove('cursor-format-painter')
    }
  } catch (error) {
    // ignore
  }
}

/**
 * Whether in multi-user collaboration state
 * @description
 * - Collaboration extension alone doesn't guarantee multiple online users
 * - User count set in `editor.storage.__collaborationUsersCount`
 * - Disabled when count > 1 (multi-user collaboration)
 */
function isCollaborationMultiUser(editor: Editor): boolean {
  try {
    const hasCollaboration = editor.extensionManager.extensions.some((ext) => ext.name === 'collaboration')
    if (!hasCollaboration) return false

    // Business layer injection: synced by TiptapProEditor.vue
    const anyEditor = editor as any
    const count = Number(anyEditor?.storage?.__collaborationUsersCount ?? 0)
    return count > 1
  } catch (error) {
    return false
  }
}

export const FormatPainter = Extension.create<{}, FormatPainterStorage>({
  name: 'formatPainter',

  addStorage() {
    // Attempt restoring format from local storage
    const savedFormats = loadFormatsFromStorage()
    return {
      isActive: false,
      isContinuous: false,
      formats: savedFormats || {},
    } as FormatPainterStorage
  },

  addCommands() {
    return {
      /**
       * Sample formatting of current selection
       * @param mode - Mode: 1 for single-use (default), 2 for continuous mode
       * @description Extracts and saves all formatting info from selection based on mode
       */
      startFormatPainting:
        (mode?: 1 | 2) =>
        ({ editor }) => {
          // Disable format painter in multi-user collaboration
          if (isCollaborationMultiUser(editor)) {
            return false
          }

          // Check if selection exists
          try {
            const sel = editor.state.selection
            if (!sel || sel.empty) {
              return false
            }
          } catch (error) {
            return false
          }

          // Sample formatting info
          const formats = sampleFormats(editor)
          if (!formats) {
            return false
          }

          // Save format to memory and local storage
          this.storage.formats = formats
          this.storage.isActive = true
          // If 2 passed, use continuous mode, otherwise (1 or undefined) single mode
          this.storage.isContinuous = mode === 2
          saveFormatsToStorage(formats)

          // Update cursor style
          updateCursorStyle(editor, true)

          return true
        },

      /**
       * Sample formatting of current selection (continuous mode)
       * @description Extracts and saves selection formatting info for multiple continuous applications
       */
      startContinuousFormatPainting:
        () =>
        ({ editor }) => {
          // Disable format painter in multi-user collaboration
          if (isCollaborationMultiUser(editor)) {
            return false
          }

          // Check if selection exists
          try {
            const sel = editor.state.selection
            if (!sel || sel.empty) {
              return false
            }
          } catch (error) {
            return false
          }

          // Sample formatting info
          const formats = sampleFormats(editor)
          if (!formats) {
            return false
          }

          // Save format to memory and local storage
          this.storage.formats = formats
          this.storage.isActive = true
          this.storage.isContinuous = true
          saveFormatsToStorage(formats)

          // Update cursor style
          updateCursorStyle(editor, true)

          return true
        },

      /**
       * Apply saved format to current selection
       * @description Applies sampled format to currently selected text
       */
      applyFormat:
        () =>
        ({ editor }) => {
          // Disable format painter in multi-user collaboration
          if (isCollaborationMultiUser(editor)) {
            // If format painter active, deactivate it
            if (this.storage.isActive) {
              this.storage.isActive = false
              this.storage.isContinuous = false
              updateCursorStyle(editor, false)
            }
            return false
          }

          // Check if format painter is active
          if (!this.storage.isActive) {
            return false
          }

          // Check if selection exists
          try {
            const sel = editor.state.selection
            if (!sel || sel.empty) {
              return false
            }
          } catch (error) {
            return false
          }

          // Check for format info (prefer memory, fallback to local storage)
          let formats = this.storage.formats
          if (!formats || Object.keys(formats).length === 0) {
            const savedFormats = loadFormatsFromStorage()
            if (savedFormats) {
              this.storage.formats = savedFormats
              formats = savedFormats
            }
          }

          if (!formats || Object.keys(formats).length === 0) {
            return false
          }

          const { from, to } = editor.state.selection

          try {
            // Apply text-level formatting
            const chain = editor.chain().focus()

            // Handle bold
            if (formats.bold) chain.setMark('bold')
            else chain.unsetMark('bold')

            // Handle italic
            if (formats.italic) chain.setMark('italic')
            else chain.unsetMark('italic')

            // Handle underline
            if (formats.underline) chain.setMark('underline')
            else chain.unsetMark('underline')

            // Handle strike
            if (formats.strike) chain.setMark('strike')
            else chain.unsetMark('strike')

            // Handle subscript/superscript (mutually exclusive, clear first then set)
            chain.unsetMark('subscript').unsetMark('superscript')
            if (formats.subscript) chain.setMark('subscript')
            else if (formats.superscript) chain.setMark('superscript')

            // Build textStyle attributes object
            const textStyleAttrs: any = {}
            if (formats.color) textStyleAttrs.color = formats.color
            if (formats.fontFamily) textStyleAttrs.fontFamily = formats.fontFamily
            if (formats.fontSize) textStyleAttrs.fontSize = formats.fontSize

            // Apply textStyle if attributes present
            if (Object.keys(textStyleAttrs).length > 0) {
              chain.setMark('textStyle', textStyleAttrs)
            } else {
              chain.unsetMark('textStyle')
            }

            // Handle background highlight
            if (formats.highlight) {
              ;(chain as any).setHighlight({ color: formats.highlight })
            } else {
              ;(chain as any).unsetHighlight?.()
            }

            // Execute all text-level formatting
            chain.run()

            // Handle paragraph-level formatting (alignment & line height)
            if (formats.textAlign) {
              editor.chain().focus().setTextSelection({ from, to }).setTextAlign(formats.textAlign).run()
            }

            if (formats.lineHeight) {
              editor.chain().focus().setTextSelection({ from, to }).setLineHeight(formats.lineHeight).run()
            }
          } catch (error) {
            return false
          }

          // If not continuous mode, close format painter after application
          if (!this.storage.isContinuous) {
            this.storage.isActive = false
            updateCursorStyle(editor, false)
          }

          return true
        },

      /**
       * Cancel format painter state and clear cache
       * @description Clear format painter active state, saved format info, and browser storage
       */
      cancelFormatPainting:
        () =>
        ({ editor }) => {
          this.storage.isActive = false
          this.storage.isContinuous = false
          this.storage.formats = {}
          clearFormatsFromStorage()
          updateCursorStyle(editor, false)
          return true
        },

      /**
       * Toggle continuous application mode
       * @description Toggle continuous application mode for format painter
       */
      toggleContinuousMode:
        () =>
        () => {
          this.storage.isContinuous = !this.storage.isContinuous
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const ext = this
    return [
      new Plugin({
        props: {
          // Listen to keyboard events, ESC key exits format painter
          handleKeyDown(_view, event: KeyboardEvent) {
            const storage = ext.storage as FormatPainterStorage
            if (storage.isActive && event.key === 'Escape') {
              ext.editor?.commands.cancelFormatPainting()
              return true // Prevent default behavior
            }
            return false
          },

          // Listen to mouseup event to automatically apply format when active
          handleDOMEvents: {
            mouseup: () => {
              const storage = ext.storage as FormatPainterStorage
              if (storage.isActive && ext.editor) {
                // Use requestAnimationFrame instead of setTimeout for next frame execution
                requestAnimationFrame(() => {
                  // Re-check if format painter is still active
                  if (!storage.isActive || !ext.editor) {
                    return
                  }
                  
                  try {
                    // Get latest selection state
                    const { state } = ext.editor
                    const { empty } = state.selection
                    
                    // If selection exists, automatically apply format
                    if (!empty) {
                      ext.editor.commands.applyFormat()
                    }
                  } catch (error) {
                    // ignore
                  }
                })
              }
              return false
            },
          },
        },
      }),
    ]
  },
})

