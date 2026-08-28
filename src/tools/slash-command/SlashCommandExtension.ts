/**
 * SlashCommand Extension - Slash command extension
 * @description Shows block type selection menu when typing / on an empty line (similar to Notion)
 * @features
 * - Listens for / input, shows command menu at cursor position
 * - Supports input filtering (e.g. /h1, /list)
 * - Keyboard navigation (up/down/enter/ESC)
 * - Auto-close: clicking outside, cursor movement, deleting /
 */

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

// ============================================================================
// Constants
// ============================================================================

export const slashCommandKey = new PluginKey('slashCommand')

// ============================================================================
// Type definitions
// ============================================================================

export interface SlashCommandState {
  active: boolean
  range: { from: number; to: number } | null
  query: string
  decorationPosition: { x: number; y: number } | null
}

export interface SlashCommandOptions {
  onActivate?: (state: SlashCommandState) => void
  onDeactivate?: () => void
  onQueryChange?: (query: string) => void
}

// ============================================================================
// Extension definition
// ============================================================================

export const SlashCommandExtension = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      onActivate: undefined,
      onDeactivate: undefined,
      onQueryChange: undefined,
    }
  },

  addProseMirrorPlugins() {
    const extensionOptions = this.options

    return [
      new Plugin({
        key: slashCommandKey,

        state: {
          init(): SlashCommandState {
            return { active: false, range: null, query: '', decorationPosition: null }
          },

          apply(tr, prev, _oldState, newState): SlashCommandState {
            // If there is an explicit mark to close the menu
            const meta = tr.getMeta(slashCommandKey)
            if (meta?.deactivate) {
              return { active: false, range: null, query: '', decorationPosition: null }
            }

            // No document change and selection unchanged, keep current state
            if (!tr.docChanged && !tr.selectionSet) {
              return prev
            }

            const { selection } = newState
            const { $from } = selection

            // Only handle cursor selection (not range selection)
            if (!selection.empty) {
              if (prev.active) return { active: false, range: null, query: '', decorationPosition: null }
              return prev
            }

            // Get current paragraph text
            const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc')

            // Match text starting with /
            const match = textBefore.match(/^\/(\S*)$/)

            if (match) {
              const query = match[1]
              const from = $from.start()
              const to = $from.pos

              return {
                active: true,
                range: { from, to },
                query,
                decorationPosition: null, // Computed by the component
              }
            }

            // No match, close if previously active
            if (prev.active) {
              return { active: false, range: null, query: '', decorationPosition: null }
            }

            return prev
          },
        },

        view() {
          return {
            update(view) {
              const state = slashCommandKey.getState(view.state) as SlashCommandState | undefined
              if (!state) return

              if (state.active && state.range) {
                // Calculate cursor position
                const coords = view.coordsAtPos(state.range.from)
                const newState: SlashCommandState = {
                  ...state,
                  decorationPosition: { x: coords.left, y: coords.bottom },
                }
                extensionOptions.onActivate?.(newState)
                extensionOptions.onQueryChange?.(state.query)
              } else {
                extensionOptions.onDeactivate?.()
              }
            },
          }
        },
      }),
    ]
  },
})
