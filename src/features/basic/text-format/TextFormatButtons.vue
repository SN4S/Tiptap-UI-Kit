<template>
  <ToolbarGroup>
    <ToolbarButton
      v-for="format in textFormats"
      :key="format.name"
      :icon="format.icon"
      :title="format.title"
      :active="format.activeCheck ? format.activeCheck() : isActive(format.name)"
      @click="format.action"
    />
  </ToolbarGroup>
</template>

<script setup lang="ts">
/**
 * TextFormatButtons - text format button group
 * @description A reusable text format button component (bold, italic, underline, strike, inline code)
 */
import { computed } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { ToolbarButton, ToolbarGroup } from '@/ui'
import { createCommandRunner } from '@/utils/editorCommands'
import { createStateCheckers, useReactiveEditor } from '@/utils/editorState'
import { t } from '@/locales'
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  CodeOutlined,
} from '@ant-design/icons-vue'

// ===== Props =====
interface Props {
  editor: Editor | null | undefined
  /** Whether to show the inline code button, defaults to false */
  showCode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCode: false,
})

// Transaction-driven reactive editor: states like isActive are re-evaluated on cursor/content changes
const editor = useReactiveEditor(() => props.editor)

// ===== Utility functions =====
const runCommand = createCommandRunner(editor)
const { isActive } = createStateCheckers(editor)

// ===== Text format configuration =====
interface TextFormat {
  name: string
  icon: typeof BoldOutlined
  title: string
  activeCheck?: () => boolean
  action: () => void
}

const textFormats = computed(() => {
  const formats: TextFormat[] = [
    {
      name: 'bold',
      icon: BoldOutlined,
      title: t('editor.bold'),
      action: () => runCommand((chain) => chain.toggleBold())(),
    },
    {
      name: 'italic',
      icon: ItalicOutlined,
      title: t('editor.italic'),
      action: () => runCommand((chain) => chain.toggleItalic())(),
    },
    {
      name: 'underline',
      icon: UnderlineOutlined,
      title: t('editor.underline'),
      action: () => runCommand((chain) => (chain as any).toggleUnderline?.() ?? chain)(),
    },
    {
      name: 'strike',
      icon: StrikethroughOutlined,
      title: t('editor.strike'),
      action: () => runCommand((chain) => chain.toggleStrike())(),
    },
  ]

  // Optional inline code button (automatically switches to a code block when multiple lines are selected)
  if (props.showCode) {
    formats.push({
      name: 'code',
      icon: CodeOutlined,
      title: t('editor.inlineCode'),
      activeCheck: () => isActive('code') || isActive('codeBlock'),
      action: () => {
        const e = editor.value
        if (!e) return

        // If already inside a code block, exit the code block
        if (e.isActive('codeBlock')) {
          runCommand((chain) => chain.setParagraph())()
          return
        }

        // Check whether the selection spans multiple text blocks
        const { from, to } = e.state.selection
        let blockCount = 0
        e.state.doc.nodesBetween(from, to, (node) => {
          if (node.isTextblock) {
            blockCount++
          }
        })

        if (blockCount > 1) {
          // Multiple lines selected: use a code block
          // Get the selected text content (keeping line breaks)
          const selectedText = e.state.doc.textBetween(from, to, '\n')
          
          // Delete the selection and insert a code block
          e.chain()
            .focus()
            .deleteSelection()
            .insertContent({
              type: 'codeBlock',
              attrs: { language: 'plaintext' },
              content: selectedText ? [{ type: 'text', text: selectedText }] : undefined
            })
            .run()
        } else {
          // Single line selected: use inline code
          runCommand((chain) => chain.toggleCode())()
        }
      },
    })
  }

  return formats
})
</script>

