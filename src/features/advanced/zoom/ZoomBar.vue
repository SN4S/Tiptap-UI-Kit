<template>
  <div :class="classes">
    <a-button size="small" @click="onZoomOut">-</a-button>
    <span class="zoom-level">{{ zoomLevel }}%</span>
    <a-button size="small" @click="onZoomIn">+</a-button>
    <a-button size="small" @click="onReset">{{ t('stats.reset') }}</a-button>
    <span class="page-info">{{ t('stats.total') }} {{ totalPages }} {{ t('stats.pages') }}</span>
    <span v-if="showCharCount && editor" class="char-count">
      {{ characterCount }} {{ t('stats.characters') }} / {{ wordCount }} {{ t('stats.words') }}
    </span>
  </div>
</template>

<script setup lang="ts">
/**
 * ZoomBar - zoom control bar component
 * @description Provides document zoom, page count, and character/word count features
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Button as AButton } from 'ant-design-vue'
import type { Editor } from '@tiptap/vue-3'
import { t } from '@/locales'
import { debounce } from '@/utils/debounce'
import '@/styles/zoom-toolbar.css'

const props = withDefaults(
  defineProps<{
    zoomLevel: number
    totalPages: number
    editor?: Editor | null
    showCharCount?: boolean
    min?: number
    max?: number
    step?: number
    placement?: 'bottom' | 'belowToolbar'
  }>(),
  {
    min: 50,
    max: 200,
    step: 10,
    placement: 'belowToolbar',
    showCharCount: true,
  }
)

const emit = defineEmits<{
  (e: 'update:zoomLevel', value: number): void
  (e: 'change', value: number): void
  (e: 'reset', value: number): void
}>()

/**
 * Zoom in
 */
const onZoomIn = () => {
  if (props.zoomLevel < props.max) {
    const v = Math.min(props.zoomLevel + props.step, props.max)
    emit('update:zoomLevel', v)
    emit('change', v)
  }
}

/**
 * Zoom out
 */
const onZoomOut = () => {
  if (props.zoomLevel > props.min) {
    const v = Math.max(props.zoomLevel - props.step, props.min)
    emit('update:zoomLevel', v)
    emit('change', v)
  }
}

/**
 * Reset zoom
 */
const onReset = () => {
  const v = 100
  emit('update:zoomLevel', v)
  emit('change', v)
  emit('reset', v)
}

/**
 * Compute the style class names
 */
const classes = computed(() =>
  ['zoom-controls', props.placement === 'bottom' ? 'zoom-controls--bottom' : null]
    .filter(Boolean)
    .join(' ')
)

/**
 * Character and word count statistics (reactive)
 */
const characterCount = ref(0)
const wordCount = ref(0)

/**
 * Update the word count statistics
 */
const updateCounts = () => {
  if (!props.editor) {
    characterCount.value = 0
    wordCount.value = 0
    return
  }

  try {
    const storage = props.editor.storage.characterCount
    if (storage) {
      characterCount.value = storage.characters?.() ?? 0
      wordCount.value = storage.words?.() ?? 0
    } else {
      characterCount.value = 0
      wordCount.value = 0
    }
  } catch (error) {
    console.warn('Failed to get character count:', error)
    characterCount.value = 0
    wordCount.value = 0
  }
}

// Debounce: avoid recomputing the word count over the whole document on every keystroke
const debouncedUpdateCounts = debounce(updateCounts, 200)

// Watch editor content changes (only listen to update: cursor movement does not require recomputing the word count)
watch(
  () => props.editor,
  (editor, oldEditor) => {
    if (oldEditor) {
      // Clean up old listeners when the editor changes/gets destroyed
      oldEditor.off('update', debouncedUpdateCounts)
    }
    if (editor) {
      // Update once immediately on initialization
      updateCounts()
      // Listen for editor update events (debounced)
      editor.on('update', debouncedUpdateCounts)
    } else {
      // Reset to zero when the editor is destroyed
      updateCounts()
    }
  },
  { immediate: true }
)

// Clean up uniformly when the component is unmounted
onBeforeUnmount(() => {
  debouncedUpdateCounts.cancel()
  props.editor?.off('update', debouncedUpdateCounts)
})
</script>

