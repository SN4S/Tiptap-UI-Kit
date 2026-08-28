<template>
  <ToolbarGroup>
    <ToolbarDropdownButton
      :icon="currentAlignIcon"
      :title="t('editor.align')"
      :items="alignMenuItems"
      placement="bottomLeft"
    />
  </ToolbarGroup>
</template>

<script setup lang="ts">
/**
 * AlignDropdown - alignment dropdown menu component
 * @description A reusable alignment dropdown menu component (left, center, right, justify)
 */
import { computed } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { ToolbarGroup, ToolbarDropdownButton } from '@/ui'
import { createCommandRunner } from '@/utils/editorCommands'
import { createStateCheckers, useReactiveEditor } from '@/utils/editorState'
import type { AlignValue, MenuItemConfig } from '@/configs/toolbar'
import { t } from '@/locales'
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  MenuOutlined,
} from '@ant-design/icons-vue'

// ===== Props =====
interface Props {
  editor: Editor | null | undefined
}

const props = defineProps<Props>()
// Transaction-driven reactive editor: states like isActiveAlign are re-evaluated on cursor/content changes
const editor = useReactiveEditor(() => props.editor)

// ===== Utility functions =====
const runCommand = createCommandRunner(editor)
const { isActiveAlign } = createStateCheckers(editor)

// ===== Alignment menu items =====
const alignMenuItems = computed<MenuItemConfig[]>(() => [
  { key: 'align-left', label: t('editor.alignLeft'), icon: AlignLeftOutlined, action: () => setAlign('left') },
  { key: 'align-center', label: t('editor.alignCenter'), icon: AlignCenterOutlined, action: () => setAlign('center') },
  { key: 'align-right', label: t('editor.alignRight'), icon: AlignRightOutlined, action: () => setAlign('right') },
  { key: 'align-justify', label: t('editor.alignJustify'), icon: MenuOutlined, action: () => setAlign('justify') },
])

/**
 * Get the currently active alignment icon
 */
const currentAlignIcon = computed(() => {
  if (isActiveAlign('center')) return AlignCenterOutlined
  if (isActiveAlign('right')) return AlignRightOutlined
  if (isActiveAlign('justify')) return MenuOutlined
  return AlignLeftOutlined
})

/**
 * Set the text alignment
 */
function setAlign(value: AlignValue) {
  runCommand((chain) => chain.setTextAlign(value))()
}
</script>

