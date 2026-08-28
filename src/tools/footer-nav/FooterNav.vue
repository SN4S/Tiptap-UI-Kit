<template>
  <div v-if="enabled" class="footer-nav-container">
    <ZoomBar
      v-model:zoomLevel="localZoomLevel"
      :totalPages="totalPages"
      :editor="editor"
      :showCharCount="showCharCount"
      :min="min"
      :max="max"
      :step="step"
      placement="bottom"
      @update:zoomLevel="handleZoomUpdate"
      @change="handleZoomChange"
      @reset="handleZoomReset"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * FooterNav - Footer navigation component
 * @description Footer navigation bar with zoom controls, page count, and word count
 * @example
 * ```vue
 * <FooterNav
 *   v-model:zoomLevel="zoomLevel"
 *   :totalPages="totalPages"
 *   :editor="editor"
 * />
 * <FooterNav :enabled="false" /> // Disable footer navigation
 * ```
 */
import { ref, watch } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { ZoomBar } from '@/features/advanced/zoom'
import './footer-nav.css'

// ===== Props =====
interface Props {
  /** Current zoom level (two-way binding) */
  zoomLevel: number
  /** Total page count */
  totalPages: number
  /** Tiptap editor instance */
  editor?: Editor | null
  /** Whether to show word count */
  showCharCount?: boolean
  /** Minimum zoom level */
  min?: number
  /** Maximum zoom level */
  max?: number
  /** Zoom step */
  step?: number
  /** Whether to enable footer navigation, default true */
  enabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  min: 50,
  max: 200,
  step: 10,
  showCharCount: true,
  enabled: true,
})

// ===== Emits =====
const emit = defineEmits<{
  (e: 'update:zoomLevel', value: number): void
  (e: 'change', value: number): void
  (e: 'reset', value: number): void
}>()

// ===== Reactive state =====
const localZoomLevel = ref(props.zoomLevel)

// ===== Watch external zoomLevel changes =====
watch(
  () => props.zoomLevel,
  (newValue) => {
    if (localZoomLevel.value !== newValue) {
      localZoomLevel.value = newValue
    }
  },
  { immediate: true }
)

// ===== Event handlers =====
/**
 * Handle zoom update
 */
const handleZoomUpdate = (value: number) => {
  localZoomLevel.value = value
  emit('update:zoomLevel', value)
}

/**
 * Handle zoom change
 */
const handleZoomChange = (value: number) => {
  emit('change', value)
}

/**
 * Handle zoom reset
 */
const handleZoomReset = (value: number) => {
  emit('reset', value)
}
</script>

<style lang="scss" scoped>
/* ===== Footer navigation container ===== */
.footer-nav-container {
  width: 100%;
  flex-shrink: 0;
  display: block; /* Ensure display */
  position: relative; /* Ensure positioning context */
}
</style>

