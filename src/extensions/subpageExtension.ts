import { Node, mergeAttributes } from '@tiptap/core'

export interface SubpageOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    subpage: {
      /**
       * Insert a subpage link block
       */
      insertSubpage: (attributes: { title: string; pageId?: string; icon?: string }) => ReturnType
    }
  }
}

export const SubpageExtension = Node.create<SubpageOptions>({
  name: 'subpage',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      title: {
        default: 'Untitled Subpage',
        parseHTML: element => element.getAttribute('data-title') || 'Untitled Subpage',
        renderHTML: attributes => ({ 'data-title': attributes.title }),
      },
      pageId: {
        default: '',
        parseHTML: element => element.getAttribute('data-pageid') || '',
        renderHTML: attributes => ({ 'data-pageid': attributes.pageId }),
      },
      icon: {
        default: '📄',
        parseHTML: element => element.getAttribute('data-icon') || '📄',
        renderHTML: attributes => ({ 'data-icon': attributes.icon }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="subpage"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const title = HTMLAttributes['data-title'] || 'Untitled Subpage'
    const icon = HTMLAttributes['data-icon'] || '📄'

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'subpage',
        class: 'notion-subpage',
        contenteditable: 'false',
      }),
      ['span', { class: 'notion-subpage__icon' }, icon],
      ['span', { class: 'notion-subpage__title' }, title],
      ['span', { class: 'notion-subpage__arrow' }, '↗'],
    ]
  },

  addCommands() {
    return {
      insertSubpage:
        attributes =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          })
        },
    }
  },
})
