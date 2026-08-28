<template>
  <a-select
    v-model:value="currentFontSize"
    :placeholder="t('toolbar.fontSize')"
    class="font-size-select"
    style="width: 100px"
    @change="onFontSizeChange"
  >
    <a-select-option v-for="size in FONT_SIZES" :key="size.value" :value="size.value">
      {{ size.label }}
    </a-select-option>
  </a-select>
</template>

<script setup lang="ts">
/**
 * FontSizeSelect - Font size selector component
 * @description Reusable font size selector component
 */
import { ref, watch } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { createCommandRunner, executeBatchCommands } from '@/utils/editorCommands'
import { useReactiveEditor } from '@/utils/editorState'
import { t } from '@/locales'
import { FONT_SIZES, DEFAULT_VALUES } from '@/configs/editorConstants'

// ===== Props =====
interface Props {
  editor: Editor | null | undefined
}

const props = defineProps<Props>()
// Transaction reactive editor: current font size re-evaluates on cursor/content changes
const editor = useReactiveEditor(() => props.editor)

// ===== Utility functions =====
const runCommand = createCommandRunner(editor)

// ===== Reactive state =====
const currentFontSize = ref<string>(DEFAULT_VALUES.fontSize)

// ===== Listen to editor state, update current font size =====
watch(
  () => editor.value?.getAttributes('textStyle')?.fontSize,
  (fontSize) => {
    if (fontSize) {
      currentFontSize.value = fontSize
    } else {
      currentFontSize.value = DEFAULT_VALUES.fontSize
    }
  },
  { deep: true, immediate: true }
)

/**
 * Font size switch handler
 * @description Applies to whole paragraph if no selection, or to selection if present
 */
function onFontSizeChange(val: string) {
  const e = editor.value
  if (!e) return

  currentFontSize.value = val

  const { from, to, empty } = e.state.selection
  if (empty) {
    // No selection: select entire paragraph and apply font size
    const $from = e.state.selection.$from
    const start = $from.start($from.depth)
    const end = $from.end($from.depth)
    executeBatchCommands(editor, [
      (chain) => chain.setTextSelection({ from: start, to: end }),
      (chain) => chain.setMark('textStyle', { fontSize: val }),
      (chain) => chain.setTextSelection({ from, to }),
    ])
  } else {
    // With selection: apply directly to selection
    runCommand((chain) => chain.setMark('textStyle', { fontSize: val }))()
  }
}
</script>

<style scoped>
.font-size-select {
  font-size: 14px;
}
</style>

