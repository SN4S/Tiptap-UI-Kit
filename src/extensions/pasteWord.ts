/**
 * PasteWord Extension - Paste Word document extension
 * @description Supports pasting Word document content
 */

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export const PasteWord = Extension.create({
  name: 'pasteWord',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('pasteWord'),
        props: {
          transformPastedHTML: (html: string) => {
            if (!html) return html
            
            // Simple Word paste handling
            // Remove Word-specific styles and tags
            return html
              .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '')
              .replace(/<!--[\s\S]*?-->/gi, '')
              .replace(/<style>[\s\S]*?<\/style>/gi, '')
              .replace(/<meta[\s\S]*?>/gi, '')
              .replace(/<link[\s\S]*?>/gi, '')
          },
        },
      }),
    ]
  },
})

