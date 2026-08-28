import { Node, mergeAttributes } from '@tiptap/core'

export interface FileAttachmentOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fileAttachment: {
      /**
       * Insert a file attachment block
       */
      insertFileAttachment: (attributes: {
        fileName: string
        fileSize?: string
        fileUrl: string
        fileType?: string
      }) => ReturnType
    }
  }
}

function fileAttachmentIcon(fileType?: string): string {
  const t = (fileType || '').toLowerCase()
  if (t.startsWith('image/')) return '🖼️'
  if (t.startsWith('audio/')) return '🎵'
  if (t.startsWith('video/')) return '🎬'
  if (t.includes('pdf')) return '📕'
  if (t.includes('msword') || t.includes('wordprocessingml') || t.includes('word')) return '📘'
  if (t.includes('spreadsheetml') || t.includes('excel') || t.includes('sheet')) return '📗'
  if (t.includes('presentationml') || t.includes('powerpoint') || t.includes('presentation')) return '📙'
  if (/zip|rar|7z|gzip|x-archive|uncompressed-archive/.test(t)) return '📦'
  if (t.includes('text/') || t.includes('json') || t.includes('xml') || t.includes('markdown')) return '📄'
  return '📎'
}

export const FileAttachmentExtension = Node.create<FileAttachmentOptions>({
  name: 'fileAttachment',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      fileName: {
        default: 'Document.pdf',
        parseHTML: element => element.getAttribute('data-filename') || 'Document.pdf',
        renderHTML: attributes => ({ 'data-filename': attributes.fileName }),
      },
      fileSize: {
        default: '',
        parseHTML: element => element.getAttribute('data-filesize') || '',
        renderHTML: attributes => ({ 'data-filesize': attributes.fileSize }),
      },
      fileUrl: {
        default: '#',
        parseHTML: element => element.getAttribute('data-fileurl') || '#',
        renderHTML: attributes => ({ 'data-fileurl': attributes.fileUrl }),
      },
      fileType: {
        default: 'file',
        parseHTML: element => element.getAttribute('data-filetype') || 'file',
        renderHTML: attributes => ({ 'data-filetype': attributes.fileType }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="file-attachment"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const fileName = HTMLAttributes['data-filename'] || 'Document.pdf'
    const fileSize = HTMLAttributes['data-filesize'] ? ` (${HTMLAttributes['data-filesize']})` : ''
    const fileUrl = HTMLAttributes['data-fileurl'] || '#'

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'file-attachment',
        class: 'notion-file-attachment',
        contenteditable: 'false',
      }),
      ['span', { class: 'notion-file-attachment__icon' }, fileAttachmentIcon(HTMLAttributes['data-filetype'])],
      ['span', { class: 'notion-file-attachment__name' }, `${fileName}${fileSize}`],
      [
        'a',
        {
          class: 'notion-file-attachment__download',
          href: fileUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        'Завантажити',
      ],
    ]
  },

  addCommands() {
    return {
      insertFileAttachment:
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
