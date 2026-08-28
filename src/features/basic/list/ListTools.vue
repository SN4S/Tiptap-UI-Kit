<template>
  <ToolbarGroup>
    <ToolbarButton
      v-for="item in listItems"
      :key="item.name"
      :icon="item.icon"
      :title="item.title"
      :active="isActive(item.name)"
      @click="item.action"
    />
  </ToolbarGroup>
</template>

<script setup lang="ts">
/**
 * ListTools - list tool group
 * @description A reusable list tool component (bullet list, ordered list, task list)
 */
import { computed } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { ToolbarButton, ToolbarGroup } from '@/ui'
import { createCommandRunner } from '@/utils/editorCommands'
import { createStateCheckers, useReactiveEditor } from '@/utils/editorState'
import { t } from '@/locales'
import {
  UnorderedListOutlined,
  OrderedListOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons-vue'

// ===== Props =====
interface Props {
  editor: Editor | null | undefined
  /** Whether to show the task list button, defaults to false */
  showTaskList?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTaskList: false,
})

// Transaction-driven reactive editor: states like isActive are re-evaluated on cursor/content changes
const editor = useReactiveEditor(() => props.editor)

// ===== Utility functions =====
const runCommand = createCommandRunner(editor)
const { isActive } = createStateCheckers(editor)

// ===== List tool configuration =====
const listItems = computed(() => {
  const items = [
    {
      name: 'bulletList',
      icon: UnorderedListOutlined,
      title: t('editor.bulletList'),
      action: () => runCommand((chain) => chain.toggleBulletList())(),
    },
    {
      name: 'orderedList',
      icon: OrderedListOutlined,
      title: t('editor.orderedList'),
      action: () => runCommand((chain) => chain.toggleOrderedList())(),
    },
  ]

  // Optional task list button
  if (props.showTaskList) {
    items.push({
      name: 'taskList',
      icon: CheckSquareOutlined,
      title: t('editor.taskList'),
      action: () => runCommand((chain) => (chain as any).toggleTaskList?.() ?? chain)(),
    })
  }

  return items
})
</script>

