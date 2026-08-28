import { Node, mergeAttributes } from '@tiptap/core'

export interface CalloutOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      /**
       * Set a callout block
       */
      setCallout: (attributes?: { icon?: string; color?: string }) => ReturnType
      /**
       * Toggle a callout block
       */
      toggleCallout: (attributes?: { icon?: string; color?: string }) => ReturnType
    }
  }
}

export const CalloutExtension = Node.create<CalloutOptions>({
  name: 'callout',

  group: 'block',

  content: 'block+',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      icon: {
        default: '💡',
        parseHTML: element => element.getAttribute('data-icon') || '💡',
        renderHTML: attributes => ({
          'data-icon': attributes.icon,
        }),
      },
      color: {
        default: 'blue',
        parseHTML: element => element.getAttribute('data-color') || 'blue',
        renderHTML: attributes => ({
          'data-color': attributes.color,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const icon = HTMLAttributes['data-icon'] || '💡'
    const color = HTMLAttributes['data-color'] || 'blue'

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'callout',
        class: `notion-callout notion-callout--${color}`,
      }),
      ['span', { class: 'notion-callout__icon', contenteditable: 'false' }, icon],
      ['div', { class: 'notion-callout__content' }, 0],
    ]
  },

  addCommands() {
    return {
      setCallout:
        attributes =>
        ({ commands }) => {
          return commands.setNode(this.name, attributes)
        },
      toggleCallout:
        attributes =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attributes)
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-c': () => this.editor.commands.toggleCallout(),
    }
  },
})
