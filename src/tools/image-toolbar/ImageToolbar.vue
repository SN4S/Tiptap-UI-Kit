<template>
  <bubble-menu
    v-if="editor"
    :editor="editor"
    :tippy-options="{ duration: 100, placement: 'top', offset: [0, 16] }"
    :should-show="shouldShow"
    class="image-bubble-menu"
  >
    <div class="image-menu-content">
      <!-- Alignment -->
      <div class="image-menu-group">
        <button
          v-for="alignOption in alignOptions"
          :key="alignOption.value"
          class="image-menu-btn"
          :class="{ active: currentAlign === alignOption.value }"
          @click="setAlign(alignOption.value)"
          :title="alignOption.title"
        >
          <component :is="alignOption.icon" />
        </button>
      </div>

      <!-- Preview -->
      <div class="image-menu-group">
        <button class="image-menu-btn" @click="previewImage"           title="Preview">
          <EyeOutlined />
        </button>
      </div>

      <!-- Delete -->
      <div class="image-menu-group">
        <button
          class="image-menu-btn image-menu-btn--danger"
          @click="deleteImage"
          title="Delete image"
        >
          <DeleteOutlined />
        </button>
      </div>
    </div>

    <!-- Image preview modal -->
    <a-modal
      v-model:open="previewVisible"
      :footer="null"
      :width="800"
      centered
      @cancel="previewVisible = false"
    >
      <img
        v-if="currentImageSrc"
        :src="currentImageSrc"
        alt="Preview"
        style="width: 100%; height: auto;"
      />
    </a-modal>
  </bubble-menu>
</template>

<script setup lang="ts">
/**
 * ImageToolbar - Image toolbar component
 * @description Bubble menu for image alignment, preview, and deletion
 */
import { ref } from 'vue'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import type { Editor } from '@tiptap/vue-3'
import { NodeSelection } from '@tiptap/pm/state'
import {
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import { createCommandRunner, type EditorChain } from '@/utils/editorCommands'
import { useReactiveEditor } from '@/utils/editorState'

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

const editor = useReactiveEditor(() => props.editor)
const runCommand = createCommandRunner(editor)

// ===== State =====
const previewVisible = ref(false)
const currentImageSrc = ref('')
const currentAlign = ref<'left' | 'center' | 'right' | null>(null)

// ===== Alignment options config =====
const alignOptions = [
  { value: 'left' as const, icon: AlignLeftOutlined, title: 'Align left' },
  { value: 'center' as const, icon: AlignCenterOutlined, title: 'Align center' },
  { value: 'right' as const, icon: AlignRightOutlined, title: 'Align right' },
]

// ===== Utility functions =====

/**
 * Get the currently selected image node and position
 */
function getCurrentImageInfo() {
  const e = editor.value
  if (!e) return { node: null, pos: null }

  const { state } = e
  const { selection } = state
  let node = null
  let pos: number | null = null

  // Check if it's a NodeSelection
  if (selection instanceof NodeSelection && selection.node && selection.node.type.name === 'image') {
    node = selection.node
    pos = selection.from
    return { node, pos }
  }

  // Check nodes before and after cursor
  const $anchor = selection.$anchor
  const nodeAfter = $anchor.nodeAfter
  const nodeBefore = $anchor.nodeBefore

  if (nodeAfter?.type.name === 'image') {
    node = nodeAfter
  } else if (nodeBefore?.type.name === 'image') {
    node = nodeBefore
  }

  // If node found but position not found, search for position
  if (node && pos === null) {
    state.doc.descendants((n, p) => {
      if (n === node) {
        pos = p
        return false
      }
    })
  }

  return { node, pos }
}

/**
 * Get image alignment
 */
function getImageAlign() {
  const { node, pos } = getCurrentImageInfo()
  if (!node || pos === null) return null

  // Prefer checking the image node's own alignment attribute
  const nodeAlign = node.attrs.align
  if (nodeAlign === 'left' || nodeAlign === 'center' || nodeAlign === 'right') {
    return nodeAlign
  }

  // Check parent node's alignment
  const e = editor.value
  if (!e) return null
  const $pos = e.state.doc.resolve(pos)
  const parent = $pos.parent
  const parentAlign = parent?.attrs.textAlign || parent?.attrs.align
  if (parentAlign === 'left' || parentAlign === 'center' || parentAlign === 'right') {
    return parentAlign
  }

  return null
}

// ===== Event handlers =====

/**
 * Check if toolbar should be shown
 */
const shouldShow = (bubbleProps: { editor: any; state: any; from: number; to: number }) => {
  // If feature is not enabled, don't show
  if (!props.enabled) {
    return false
  }
  
  // Check if editor exists
  if (!bubbleProps.editor) {
    return false
  }
  
  if (props.readonly || !bubbleProps.editor.isActive('image')) {
    return false
  }

  // Update current image info
  const { node } = getCurrentImageInfo()
  if (node?.type.name === 'image') {
    currentImageSrc.value = node.attrs.src || ''
    currentAlign.value = getImageAlign()
  }

  return true
}

/**
 * Set image alignment
 */
function setAlign(align: 'left' | 'center' | 'right') {
  const e = editor.value
  if (!e) return

  const { node, pos } = getCurrentImageInfo()
  if (!node || pos === null) return

  const $pos = e.state.doc.resolve(pos)
  const parent = $pos.parent

  // Prefer setting parent node alignment (paragraph or heading)
  if (parent && (parent.type.name === 'paragraph' || parent.type.name === 'heading')) {
    const parentStart = $pos.start($pos.depth)
    e.chain()
      .setTextSelection({ from: parentStart, to: parentStart + parent.nodeSize })
      .setTextAlign(align)
      .run()
  }

  // Also set image node's alignment attribute
  e.chain()
    .focus()
    .setNodeSelection(pos)
    .updateAttributes('image', { align })
    .run()

  currentAlign.value = align
}

/**
 * Preview image
 */
function previewImage() {
  const { node } = getCurrentImageInfo()
  if (node?.type.name === 'image') {
    currentImageSrc.value = node.attrs.src || ''
    previewVisible.value = true
  }
}

/**
 * Delete image
 */
function deleteImage() {
  runCommand((chain: EditorChain) => chain.deleteSelection())()
}
</script>

<style scoped>
.image-bubble-menu {
  z-index: 1001;
}

.image-menu-content {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 8px;
  background: #fff;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    background: #1f1f1f;
    border-color: #434343;
  }
}

.image-menu-group {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 0 4px;
  border-right: 1px solid #e8e8e8;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    border-right-color: #434343;
  }
}

.image-menu-group:last-child {
  border-right: none;
}

.image-menu-btn {
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

.image-menu-btn:hover:not(:disabled) {
  background: #f5f5f5;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    background: #303030;
  }
}

.image-menu-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-menu-btn.active {
  color: #1677ff;
  background: #e6f4ff;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    color: #4fc3f7;
    background: #15395b;
  }
}

.image-menu-btn--danger {
  color: #ff4d4f;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    color: #ff7875;
  }
}

.image-menu-btn--danger:hover {
  color: #ff4d4f;
  background: #fff1f0;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    color: #ff7875;
    background: #3a1a1a;
  }
}
</style>

