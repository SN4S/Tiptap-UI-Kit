<template>
  <ToolbarButton
    :icon="FormatPainterOutlined"
    :title="t('editor.formatPainter')"
    :active="isFormatPainterActive"
    :disabled="isDisabled"
    @click="toggleFormatPainter"
    @dblclick="toggleFormatPainterContinuous"
  />
</template>

<script setup lang="ts">
/**
 * FormatPainterButton - Format painter button component
 * @description Reusable format painter button component, providing format sampling and application
 * Supports single-click single mode and double-click continuous mode
 */
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { FormatPainterOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ToolbarButton } from '@/ui'
import { t } from '@/locales'
import type { FormatPainterStorage } from './formatPainter'

// ===== Props =====
interface Props {
  editor: Editor | null | undefined
  /** External disabled prop (takes precedence over internal collaboration detection) */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: undefined,
})
const editor = computed(() => props.editor ?? null)

// ===== Type definitions =====
interface EditorWithStorage {
  storage?: {
    formatPainter?: FormatPainterStorage
  }
}

// ===== Disabled state check =====
/**
 * Compute if format painter is disabled
 * @description Prefers external disabled prop, otherwise checks if collaboration extension exists
 */
const isDisabled = computed(() => {
  // If external disabled prop provided, use external value
  if (props.disabled !== undefined) {
    return props.disabled
  }
  // Otherwise check if collaboration extension exists
  const e = editor.value
  if (!e) return false
  try {
    const collaborationExt = e.extensionManager.extensions.find(
      (ext) => ext.name === 'collaboration'
    )
    return !!collaborationExt
  } catch (error) {
    return false
  }
})

// ===== Format painter state management =====
/**
 * Get format painter storage object
 */
function getFormatPainterStorage(): FormatPainterStorage | undefined {
  const e = editor.value as EditorWithStorage | null
  return e?.storage?.formatPainter
}

// Use reactive refs to subscribe to editor events for live active status updates
const isFormatPainterActive = ref(false)

/**
 * Update format painter active state
 */
function updateFormatPainterActive() {
  const storage = getFormatPainterStorage()
  isFormatPainterActive.value = Boolean(storage?.isActive)
}

/**
 * Setup format painter event subscriptions
 */
function setupFormatPainterSubscriptions() {
  // Clean up previous subscriptions
  cleanupFormatPainterSubscriptions()
  const e = editor.value
  if (!e) return
  // Initialize state once
  updateFormatPainterActive()
  // Subscribe to events triggering state changes
  e.on('update', updateFormatPainterActive)
  e.on('selectionUpdate', updateFormatPainterActive)
  e.on('transaction', updateFormatPainterActive)
}

/**
 * Clean up format painter event subscriptions
 */
function cleanupFormatPainterSubscriptions() {
  const e = editor.value
  if (!e) return
  try {
    e.off('update', updateFormatPainterActive)
    e.off('selectionUpdate', updateFormatPainterActive)
    e.off('transaction', updateFormatPainterActive)
  } catch (error) {
    // Ignore errors when unsubscribing
  }
}

// Setup subscriptions on init and editor changes
if (editor.value) setupFormatPainterSubscriptions()
// Watch editor reference changes (triggered after parent passes instance)
watch(editor, setupFormatPainterSubscriptions, { immediate: true })

// Clean up subscriptions on component unmount
onBeforeUnmount(() => {
  cleanupFormatPainterSubscriptions()
})

// ===== Format painter commands =====
/**
 * Single click to toggle format painter (single mode)
 * @description Single click format painter button to sample or apply format
 */
function toggleFormatPainter() {
  const e = editor.value as any
  if (!e) return
  
  // Check if disabled; notify if disabled
  if (isDisabled.value) {
    message.warning(t('editor.collaborationNoFormatPainter'))
    return
  }
  
  const active = e.storage?.formatPainter?.isActive ?? false
  
  if (!active) {
    // Format painter inactive: check if selection exists
    try {
      const selection = e.state.selection
      if (!selection || selection.empty) {
        message.warning(t('editor.pleaseSelectTextToSample'))
        return
      }
    } catch (error) {
      message.warning(t('editor.pleaseSelectTextToSampleShort'))
      return
    }
    
    // Sample format and activate format painter (single mode)
    const success = e.commands.startFormatPainting()
    if (success) {
      message.success(t('editor.sampleSuccessSingle'))
      updateFormatPainterActive()
    }
  } else {
    // Format painter active: cancel format painter state
    e.commands.cancelFormatPainting()
    updateFormatPainterActive()
    message.info(t('editor.formatPainterExited'))
  }
}

/**
 * Double click to toggle continuous format painter mode
 * @description Double click format painter button to enable continuous mode
 */
function toggleFormatPainterContinuous() {
  const e = editor.value as any
  if (!e) return
  
  // Check if disabled; notify if disabled
  if (isDisabled.value) {
    message.warning(t('editor.collaborationNoFormatPainter'))
    return
  }
  
  const active = e.storage?.formatPainter?.isActive ?? false
  
  if (!active) {
    // Format painter inactive: check if selection exists
    try {
      const selection = e.state.selection
      if (!selection || selection.empty) {
        message.warning(t('editor.pleaseSelectTextToSampleDouble'))
        return
      }
    } catch (error) {
      message.warning(t('editor.pleaseSelectTextToSampleShort'))
      return
    }
    
    // Sample format and activate format painter (continuous mode)
    const success = e.commands.startContinuousFormatPainting()
    if (success) {
      message.success(t('editor.sampleSuccessContinuous'))
      updateFormatPainterActive()
    }
  } else {
    // Format painter active: cancel format painter
    e.commands.cancelFormatPainting()
    updateFormatPainterActive()
    message.info(t('editor.formatPainterExited'))
  }
}
</script>

