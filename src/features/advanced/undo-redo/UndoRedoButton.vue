<template>
  <ToolbarGroup>
    <ToolbarButton
      :icon="UndoOutlined"
      :title="disabled ? t('editor.undoDisabledInCollab') : t('editor.undo')"
      :disabled="disabled || !canUndo"
      @click="undo"
    />
    <ToolbarButton
      :icon="RedoOutlined"
      :title="disabled ? t('editor.redoDisabledInCollab') : t('editor.redo')"
      :disabled="disabled || !canRedo"
      @click="redo"
    />
  </ToolbarGroup>
</template>

<script setup lang="ts">
/**
 * UndoRedoButton - Undo/redo button component
 * @description Reusable undo/redo button component providing undo and redo capabilities
 */
import { computed, ref, watch, onBeforeUnmount, nextTick } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { UndoOutlined, RedoOutlined } from '@ant-design/icons-vue'
import { ToolbarButton, ToolbarGroup } from '@/ui'
import { createCommandRunner } from '@/utils/editorCommands'
import { t } from '@/locales'

// ===== Props =====
interface Props {
  editor: Editor | null | undefined
  /** Whether disabled (needs to be disabled in collaboration mode) */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})
const editor = computed(() => props.editor ?? null)

// ===== Utility Functions =====
const runCommand = createCommandRunner(editor)

// ===== Undo/Redo State Management =====
/**
 * Use reactive refs to store undo/redo status for real-time updates
 */
const canUndo = ref(false)
const canRedo = ref(false)

/**
 * Flag indicating whether genuine editing operations took place
 * Used to distinguish initialization state from genuine edit operations
 */
const hasRealEdit = ref(false)

/**
 * Update undo/redo state
 * @description Check whether editor can perform undo/redo actions
 * Uses strict conditions to ensure button is disabled when initialized without undoable actions
 */
function updateUndoRedoState() {
  const e = editor.value
  if (!e) {
    canUndo.value = false
    canRedo.value = false
    return
  }
  
  try {
    // Check if can undo/redo
    const undoCheck = e.can().undo?.()
    const redoCheck = e.can().redo?.()
    
    // Only allow undo after genuine editing operations occur
    // Prevents misjudgment during initialization
    canUndo.value = undoCheck && hasRealEdit.value
    canRedo.value = Boolean(redoCheck)
  } catch (error) {
    // Default to disabled if check fails
    canUndo.value = false
    canRedo.value = false
  }
}

/**
 * Handle editor update event
 * @description Listen to editor updates to detect genuine edit operations
 */
function handleUpdate() {
  const e = editor.value
  if (!e) return
  
  // Update event fires on document content changes
  // Mark as having genuine edits
  hasRealEdit.value = true
  
  // Update button status
  updateUndoRedoState()
}

/**
 * Setup editor event subscriptions
 * @description Listen to editor state changes to update undo/redo button status
 */
function setupEditorSubscriptions() {
  // Clean up previous subscriptions first
  cleanupEditorSubscriptions()
  const e = editor.value
  if (!e) return
  
  // Reset editing flag
  hasRealEdit.value = false
  
  // Use nextTick to ensure editor fully initializes before checking status
  nextTick(() => {
    // Initialize status once (should be no undoable operations initially)
    updateUndoRedoState()
    
    // Subscribe to editor state change events
    e.on('update', handleUpdate) // Use dedicated update handler to detect document changes
    e.on('selectionUpdate', updateUndoRedoState)
    e.on('transaction', updateUndoRedoState)
    e.on('create', () => {
      // Reset edit flag when editor is created
      hasRealEdit.value = false
      updateUndoRedoState()
    })
  })
}

/**
 * Clean up editor event subscriptions
 */
function cleanupEditorSubscriptions() {
  const e = editor.value
  if (!e) return
  try {
    e.off('update', handleUpdate)
    e.off('selectionUpdate', updateUndoRedoState)
    e.off('transaction', updateUndoRedoState)
    e.off('create', updateUndoRedoState)
  } catch (error) {
    // Ignore errors when unsubscribing
  }
}

// Setup subscriptions on init and editor instance updates
if (editor.value) setupEditorSubscriptions()
// Watch for changes in editor reference
watch(editor, setupEditorSubscriptions, { immediate: true })

// Clean up subscriptions on component unmount
onBeforeUnmount(() => {
  cleanupEditorSubscriptions()
})

// ===== Undo/Redo Commands =====
/**
 * Undo command
 * @description Execute undo action, reverting to previous edit state
 */
const undo = runCommand((chain) => chain.undo())

/**
 * Redo command
 * @description Execute redo action, restoring state prior to undo
 */
const redo = runCommand((chain) => chain.redo())
</script>

