/**
 * ListShortcuts Extension - List shortcut extension
 * @description Provides keyboard shortcut support for lists
 */

import { Extension } from '@tiptap/core'

export const ListShortcuts = Extension.create({
  name: 'listShortcuts',

  addKeyboardShortcuts() {
    return {
      // Enter key creates new item in list items
      Enter: ({ editor }) => {
        const { state } = editor
        const { selection } = state
        const { $from } = selection

        if ($from.node(-1)?.type.name === 'taskItem') {
          return editor.commands.splitListItem('taskItem')
        }
        if ($from.node(-1)?.type.name === 'listItem') {
          return editor.commands.splitListItem('listItem')
        }
        return false
      },
      // Shift+Enter creates new line in list items
      'Shift-Enter': ({ editor }) => {
        return editor.commands.first([
          () => editor.commands.newlineInCode(),
          () => editor.commands.createParagraphNear(),
        ])
      },
    }
  },
})

