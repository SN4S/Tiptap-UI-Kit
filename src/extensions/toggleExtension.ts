import { Node, mergeAttributes } from '@tiptap/core'

export interface ToggleOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toggleItem: {
      /**
       * Insert or toggle a collapsible toggle list item
       */
      setToggleItem: () => ReturnType
    }
  }
}

export const ToggleSummary = Node.create({
  name: 'toggleSummary',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'summary' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['summary', mergeAttributes(HTMLAttributes, { class: 'notion-toggle__summary' }), 0]
  },
})

export const ToggleContent = Node.create({
  name: 'toggleContent',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div.notion-toggle__content' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'notion-toggle__content' }), 0]
  },
})

export const ToggleExtension = Node.create<ToggleOptions>({
  name: 'toggleItem',

  group: 'block',

  content: 'toggleSummary toggleContent',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'details[data-type="toggle"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'details',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'toggle',
        class: 'notion-toggle',
        open: true,
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setToggleItem:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              content: [
                {
                  type: 'toggleSummary',
                  content: [{ type: 'text', text: 'Toggle title' }],
                },
                {
                  type: 'toggleContent',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Toggle details content...' }] }],
                },
              ],
            })
            .run()
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-t': () => this.editor.commands.setToggleItem(),

      // Enter at the very start of a toggle summary creates an empty paragraph above
      // the toggle. Default Enter (splitBlock) does nothing here because the toggle
      // item content is `toggleSummary toggleContent`, which cannot be split.
      Enter: ({ editor }) => {
        const { state } = editor
        const { selection } = state
        if (!selection.empty) return false

        const { $from } = selection
        if ($from.parent.type.name !== 'toggleSummary' || $from.parentOffset !== 0) return false

        let toggleDepth = -1
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'toggleItem') {
            toggleDepth = d
            break
          }
        }
        if (toggleDepth !== 1) return false

        const insertPos = $from.before(1) === 1 ? 0 : $from.before(1)
        if (!editor.commands.insertContentAt(insertPos, { type: 'paragraph' })) return false
        return editor.commands.setTextSelection(insertPos + 1)
      },
    }
  },
})
