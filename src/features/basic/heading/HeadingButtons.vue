<template>
  <ToolbarGroup>
    <ToolbarButton
      v-for="heading in headings"
      :key="heading.level"
      :title="heading.title"
      :active="isHeadingActive(heading.level)"
      @click="heading.action"
      class="heading-btn"
      :data-level="heading.level"
    >
      H{{ heading.level }}
    </ToolbarButton>
  </ToolbarGroup>
</template>

<script setup lang="ts">
/**
 * HeadingButtons - heading button group
 * @description A reusable heading button component (H1, H2, H3, etc.)
 */
import { computed } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { ToolbarButton, ToolbarGroup } from '@/ui'
import { createCommandRunner } from '@/utils/editorCommands'
import { createStateCheckers, useReactiveEditor } from '@/utils/editorState'
import { t } from '@/locales'
import type { HeadingLevel } from '@/configs/toolbar'

// ===== Props =====
interface Props {
  editor: Editor | null | undefined
  /** Heading levels to display, defaults to [1, 2, 3] */
  levels?: HeadingLevel[]
}

const props = withDefaults(defineProps<Props>(), {
  levels: () => [1, 2, 3],
})

// Transaction-driven reactive editor: the isActive highlight is re-evaluated on cursor/content changes
const editor = useReactiveEditor(() => props.editor)

// ===== Utility functions =====
const runCommand = createCommandRunner(editor)
const { isHeadingActive } = createStateCheckers(editor)

// ===== Heading configuration =====
const headings = computed(() =>
  props.levels.map((level) => ({
    level,
    action: runCommand((chain) => chain.toggleHeading({ level })),
    title: t(`editor.h${level}`),
  }))
)
</script>

<style scoped>
.heading-btn {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, sans-serif;
  font-size: 14px;
  font-weight: bold;
}
</style>

