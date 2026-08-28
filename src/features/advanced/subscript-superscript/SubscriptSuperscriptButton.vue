<template>
  <ToolbarGroup>
    <ToolbarButton
      v-for="format in formats"
      :key="format.name"
      :icon="format.icon"
      :title="format.title"
      :active="isActive(format.name)"
      @click="format.action"
    />
  </ToolbarGroup>
</template>

<script setup lang="ts">
/**
 * SubscriptSuperscriptButton - Subscript/superscript button group
 * @description Reusable subscript/superscript button component for subscript and superscript toggle
 */
import { computed } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { ToolbarButton, ToolbarGroup } from '@/ui'
import { createStateCheckers, useReactiveEditor } from '@/utils/editorState'
import { t } from '@/locales'
import { SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons-vue'

// ===== Props =====
interface Props {
  editor: Editor | null | undefined
}

const props = defineProps<Props>()
const editor = useReactiveEditor(() => props.editor)

// ===== Utility functions =====
const { isActive } = createStateCheckers(editor)

// ===== Format configuration =====
const formats = computed(() => [
  {
    name: 'superscript',
    icon: SortDescendingOutlined,
    title: t('editor.superscript'),
    action: () => {
      const e = editor.value
      if (!e) return
      e.chain().focus().toggleSuperscript().run()
    },
  },
  {
    name: 'subscript',
    icon: SortAscendingOutlined,
    title: t('editor.subscript'),
    action: () => {
      const e = editor.value
      if (!e) return
      e.chain().focus().toggleSubscript().run()
    },
  },
])
</script>

