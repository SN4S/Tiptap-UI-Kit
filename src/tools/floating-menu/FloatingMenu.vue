<template>
  <bubble-menu
    v-if="editor"
    :editor="editor"
    :tippy-options="{ duration: 100, placement: 'top' }"
    :should-show="shouldShow"
    class="bubble-menu floating-menu"
  >
    <div class="bubble-menu-content menu-content">
      <!-- Heading quick buttons -->
      <div class="bubble-group menu-group">
        <HeadingButtons :editor="editor" />
      </div>

      <!-- Text formatting -->
      <div class="bubble-group menu-group">
        <TextFormatButtons :editor="editor" />
      </div>

      <!-- Color tools -->
      <div class="bubble-group menu-group">
        <ColorPicker
          :icon="FontColorsOutlined"
          type="text"
          :model-value="currentTextColor"
          :title="t('editor.textColor')"
          @select="setTextColor"
        />
        <ColorPicker
          :icon="HighlightOutlined"
          type="background"
          :model-value="currentBgColor"
          :title="t('editor.backgroundColor')"
          @select="setHighlight"
        />
      </div>

      <!-- Link -->
      <div class="bubble-group menu-group">
        <LinkButton :editor="editor" />
      </div>

      <!-- List tools -->
      <div class="bubble-group menu-group">
        <ListTools :editor="editor" :show-task-list="true" />
      </div>

      <!-- AI tools (dropdown button supporting translation submenu) -->
      <div class="bubble-group menu-group">
        <AiMenuButton
          v-if="editor"
          :editor="editor"
          :icon="ThunderboltOutlined"
          :label="t('editor.ai')"
          :title="t('editor.ai')"
          placement="top"
        />
      </div>
    </div>
  </bubble-menu>
</template>

<script setup lang="ts">
/**
 * FloatingMenu - Floating toolbar on text selection
 * @description Floating formatting toolbar displayed on text selection (similar to Medium, Notion)
 */
import { ref, watch } from 'vue'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import type { Editor } from '@tiptap/vue-3'
import { t } from '@/locales'

// Import helper functions and config
import { createCommandRunner } from '@/utils/editorCommands'
import { useReactiveEditor } from '@/utils/editorState'
import { HeadingButtons } from '@/features/basic/heading'
import { TextFormatButtons } from '@/features/basic/text-format'
import { ListTools } from '@/features/basic/list'
import { LinkButton } from '@/features/advanced/link'
import { ColorPicker } from '@/features/basic/color'
import { AiMenuButton } from '@/ai'

// Ant Design components and icons
import {
  FontColorsOutlined,
  HighlightOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons-vue'

// ===== Props =====
const props = withDefaults(
  defineProps<{
    editor: Editor | null | undefined
    readonly?: boolean
    enabled?: boolean
  }>(),
  {
    readonly: false,
    enabled: true,
  }
)
// Transaction reactive editor: colors re-evaluate on cursor/content changes
const editor = useReactiveEditor(() => props.editor)


// ===== Reactive state =====
// Current color values
const currentTextColor = ref<string>('#000000')
const currentBgColor = ref<string>('#ffffff')

// ===== Utility functions =====
const runCommand = createCommandRunner(editor)

// ===== Helper functions =====
/**
 * Standardize color values
 */
function normalizeColor(color: string | undefined): string {
  if (!color) return '#000000'
  const trimmed = color.trim()
  if (trimmed.startsWith('#')) {
    return trimmed.toLowerCase()
  }
  return trimmed.toLowerCase()
}

// Listen to editor state to update current colors
watch(
  () => editor.value?.getAttributes('textStyle'),
  (attrs) => {
    if (attrs?.color) {
      currentTextColor.value = normalizeColor(attrs.color)
    } else {
      currentTextColor.value = '#000000'
    }
  },
  { deep: true, immediate: true }
)

watch(
  () => editor.value?.getAttributes('highlight'),
  (attrs) => {
    if (attrs?.color) {
      currentBgColor.value = normalizeColor(attrs.color)
    } else {
      currentBgColor.value = '#ffffff'
    }
  },
  { deep: true, immediate: true }
)

/**
 * Control floating menu display condition
 * @description Display only when text is selected, hidden in read-only mode
 */
const shouldShow = (bubbleProps: { editor: any; state: any; from: number; to: number }) => {
  // Do not display if feature disabled
  if (!props.enabled) {
    return false
  }
  
  // Do not display in read-only mode
  if (props.readonly) return false

  const { from, to } = bubbleProps
  const isEmptySelection = from === to

  // Hidden when: no selection, inside code block, or inside table
  if (isEmptySelection) return false
  if (bubbleProps.editor.isActive('codeBlock')) return false
  if (bubbleProps.editor.isActive('table')) return false

  // Hidden when image node selected (images have dedicated toolbar)
  if (bubbleProps.editor.isActive('image')) return false
  
  // Check if selected node is an image
  const { state } = bubbleProps
  const { selection } = state
  if (selection.node && selection.node.type.name === 'image') {
    return false
  }
  
  // Check if surrounding nodes are images
  const $anchor = selection.$anchor
  const nodeAfter = $anchor.nodeAfter
  const nodeBefore = $anchor.nodeBefore
  if ((nodeAfter && nodeAfter.type.name === 'image') || (nodeBefore && nodeBefore.type.name === 'image')) {
    return false
  }

  // If link selected, do not show text bubble menu (links have dedicated bubble menu)
  if (bubbleProps.editor.isActive('link')) {
    return false
  }

  return true
}

/**
 * Set text color
 */
const setTextColor = (color: string) => {
  currentTextColor.value = color
  runCommand((chain) => chain.setColor(color))()
}

/**
 * Set background highlight
 */
const setHighlight = (color: string) => {
  currentBgColor.value = color
  runCommand((chain) => chain.setHighlight({ color }))()
}
</script>

<style scoped>


@media (max-width: 768px) {
  .bubble-menu-content {
    gap: 2px;
  }
}

.bubble-menu {
  z-index: 1010;
  display: flex;
  padding: 4px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
  border: 1px solid transparent;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    background: #1f1f1f;
    box-shadow: 0 4px 12px rgb(0 0 0 / 40%);
    border-color: #434343;
  }
}

.bubble-menu-content {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.bubble-group {
  display: flex;
  gap: 2px;
  align-items: center;
}

.bubble-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: #333;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  transition: all 0.2s;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    color: #f0f0f0;
  }
}

.bubble-btn:hover {
  background: #f5f5f5;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    background: #303030;
  }
}

.bubble-btn.active {
  color: #1890ff;
  background: #e6f4ff;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    color: #4fc3f7;
    background: #1a4d6e;
  }
}

.heading-btn {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, sans-serif;
  font-size: 14px;
  font-weight: bold;
}

.color-panel {
  display: grid;
  grid-template-columns: repeat(8, 24px);
  gap: 8px;
  padding: 12px;
  background: #fff;
  border-radius: 4px;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    background: #1f1f1f;
  }
}

.color-item {
  width: 24px;
  height: 24px;
  cursor: pointer;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: transform 0.2s;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    border-color: #434343;
  }
}

.color-item:hover {
  box-shadow: 0 2px 8px rgb(0 0 0 / 20%);
  transform: scale(1.2);

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    box-shadow: 0 2px 8px rgb(0 0 0 / 50%);
  }
}

/* Bubble Menu container style */
</style>

