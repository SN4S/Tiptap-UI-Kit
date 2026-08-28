<template>
  <a-select
    v-model:value="currentFont"
    :placeholder="t('toolbar.fontFamily')"
    class="font-family-select"
    style="width: 140px"
    @change="onFontChange"
  >
    <a-select-option v-for="font in FONT_FAMILIES" :key="font.value" :value="font.value">
      {{ font.value === '' ? t('toolbar.fontDefault') : font.label }}
    </a-select-option>
  </a-select>
</template>

<script setup lang="ts">
/**
 * FontFamilySelect - Font family selector component
 * @description Reusable font family selector component
 */
import { ref, watch } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { createCommandRunner, executeBatchCommands } from '@/utils/editorCommands'
import { useReactiveEditor } from '@/utils/editorState'
import { t } from '@/locales'
import { FONT_FAMILIES, DEFAULT_VALUES } from '@/configs/editorConstants'

// ===== Props =====
interface Props {
  editor: Editor | null | undefined
}

const props = defineProps<Props>()
// Transaction reactive editor: current font re-evaluates on cursor/content changes
const editor = useReactiveEditor(() => props.editor)

// ===== Utility functions =====
const runCommand = createCommandRunner(editor)

// ===== Reactive state =====
const currentFont = ref<string>(DEFAULT_VALUES.fontFamily)

// ===== Listen to editor state, update current font =====
watch(
  () => editor.value?.getAttributes('textStyle')?.fontFamily,
  (fontFamily) => {
    if (fontFamily) {
      currentFont.value = fontFamily
    } else {
      currentFont.value = DEFAULT_VALUES.fontFamily
    }
  },
  { deep: true, immediate: true }
)

/**
 * Font switch handler
 * @description Applies to whole paragraph if no selection, or to selection if present
 */
function onFontChange(val: string) {
  const e = editor.value
  if (!e) return

  currentFont.value = val

  // Empty value = clear font setting, revert to theme default
  const applyFont = (chain: any) => (val === '' ? chain.unsetFontFamily() : chain.setFontFamily(val))

  const { from, to, empty } = e.state.selection
  if (empty) {
    // No selection: select entire paragraph and apply font
    const $from = e.state.selection.$from
    const start = $from.start($from.depth)
    const end = $from.end($from.depth)
    executeBatchCommands(editor, [
      (chain) => chain.setTextSelection({ from: start, to: end }),
      applyFont,
      (chain) => chain.setTextSelection({ from, to }),
    ])
  } else {
    // With selection: apply directly to selection
    runCommand(applyFont)()
  }
}
</script>

<style scoped>
.font-family-select {
  font-size: 14px;
}
</style>

