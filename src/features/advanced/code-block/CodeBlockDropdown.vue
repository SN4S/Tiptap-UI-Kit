<template>
  <ToolbarGroup>
    <ToolbarButton
      :icon="CodeOutlined"
      :title="t('toolbar.insertCodeBlock')"
      :active="isCodeBlockActive"
      @click="insertCodeBlock"
    />
  </ToolbarGroup>
</template>

<script setup lang="ts">
/**
 * CodeBlockDropdown - Code block button component
 * @description Click to directly insert code block using default language
 */
import { computed } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { ToolbarGroup, ToolbarButton } from '@/ui'
import { createCommandRunner } from '@/utils/editorCommands'
import { createStateCheckers, useReactiveEditor } from '@/utils/editorState'
import { t } from '@/locales'
import { CodeOutlined } from '@ant-design/icons-vue'

// ===== Props =====
interface Props {
  editor: Editor | null | undefined
}

const props = defineProps<Props>()
const editor = useReactiveEditor(() => props.editor)

// ===== Utility functions =====
const runCommand = createCommandRunner(editor)
const { isActive } = createStateCheckers(editor)

// ===== Check if code block active =====
const isCodeBlockActive = computed(() => {
  return isActive('codeBlock')
})

/**
 * Insert code block (using default language)
 * Handle multi-line selection: merge all selected text into one code block
 */
function insertCodeBlock() {
  const e = editor.value
  if (!e) return

  // If already inside a code block, exit code block mode
  if (isCodeBlockActive.value) {
    runCommand((chain) => chain.setParagraph())()
    return
  }

  // Get selection
  const { from, to, empty } = e.state.selection

  // If no selection, insert empty code block
  if (empty) {
    runCommand((chain) => chain.setCodeBlock({ language: 'javascript' }))()
    return
  }

  // Get selected text content (preserving newlines)
  const selectedText = e.state.doc.textBetween(from, to, '\n')

  // Delete selection and insert code block
  e.chain()
    .focus()
    .deleteSelection()
    .insertContent({
      type: 'codeBlock',
      attrs: { language: 'javascript' },
      content: selectedText ? [{ type: 'text', text: selectedText }] : undefined
    })
    .run()
}
</script>

