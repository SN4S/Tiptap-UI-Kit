<template>
  <ToolbarGroup>
    <ToolbarButton
      :icon="ClearOutlined"
      :title="t('editor.clearFormat')"
      @click="clearFormat"
    />
  </ToolbarGroup>
</template>

<script setup lang="ts">
/**
 * ClearFormatButton - Clear format button component
 * @description Reusable clear format button component
 */
import { computed } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { ClearOutlined } from '@ant-design/icons-vue'
import { ToolbarGroup, ToolbarButton } from '@/ui'
import { createCommandRunner } from '@/utils/editorCommands'
import { t } from '@/locales'

// ===== Props =====
interface Props {
  editor: Editor | null | undefined
}

const props = defineProps<Props>()
const editor = computed(() => props.editor ?? null)

// ===== Utility functions =====
const runCommand = createCommandRunner(editor)

/**
 * Clear format
 * @description Clear all formatting in current selection (text styles, colors, fonts, etc.)
 */
function clearFormat() {
  runCommand((chain) => chain.clearNodes().unsetAllMarks())()
}
</script>

