/**
 * Math Extension
 * @description Tiptap math extension supporting LaTeX syntax and KaTeX rendering
 */

import { Node, mergeAttributes, InputRule } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import type { MathExtensionOptions } from './types'
import { DEFAULT_KATEX_OPTIONS } from './types'
import MathNodeView from './MathNodeView.vue'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    math: {
      /** Insert inline math */
      insertInlineMath: (latex?: string) => ReturnType
      /** Insert block math */
      insertBlockMath: (latex?: string) => ReturnType
      /** Update math content */
      updateMath: (latex: string) => ReturnType
    }
  }
}

export const MathExtension = Node.create<MathExtensionOptions>({
  name: 'math',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return {
      inline: true,
      block: true,
      katexOptions: DEFAULT_KATEX_OPTIONS,
    }
  },

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: element => element.getAttribute('data-latex') || element.textContent || '',
        renderHTML: attributes => ({
          'data-latex': attributes.latex,
        }),
      },
      block: {
        default: false,
        parseHTML: element => element.getAttribute('data-block') === 'true',
        renderHTML: attributes => ({
          'data-block': attributes.block ? 'true' : 'false',
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="math"]',
      },
      {
        tag: 'div[data-type="math"]',
      },
      // Support LaTeX pasted from Markdown
      {
        tag: 'span.math-inline',
      },
      {
        tag: 'div.math-block',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const isBlock = HTMLAttributes['data-block'] === 'true'
    const tag = isBlock ? 'div' : 'span'
    return [
      tag,
      mergeAttributes(HTMLAttributes, {
        'data-type': 'math',
        class: isBlock ? 'math-node math-block' : 'math-node math-inline',
      }),
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(MathNodeView)
  },

  addCommands() {
    return {
      insertInlineMath:
        (latex = '') =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { latex, block: false },
          })
        },

      insertBlockMath:
        (latex = '') =>
        ({ chain }) => {
          // Block math inserted as paragraph
          return chain()
            .insertContent({
              type: 'paragraph',
              content: [
                {
                  type: this.name,
                  attrs: { latex, block: true },
                },
              ],
            })
            .run()
        },

      updateMath:
        (latex: string) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { latex })
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      // Ctrl/Cmd + M: Insert inline math
      'Mod-m': () => this.editor.commands.insertInlineMath(),
      // Ctrl/Cmd + Shift + M: Insert block math
      'Mod-Shift-m': () => this.editor.commands.insertBlockMath(),
    }
  },

  addInputRules() {
    // Support $...$ syntax (inline math)
    const nodeType = this.type

    return [
      new InputRule({
        // Match $latex$ format
        find: /\$([^$]+)\$$/,
        handler: ({ state, range, match }) => {
          const latex = match[1]
          if (!latex) return null

          const { tr } = state
          tr.replaceWith(range.from, range.to, nodeType.create({ latex, block: false }))
        },
      }),
    ]
  },
})

export default MathExtension
