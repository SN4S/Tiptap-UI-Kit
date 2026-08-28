<template>
  <bubble-menu
    v-if="editor"
    :editor="editor"
    :tippy-options="{ duration: 100, placement: 'top', offset: [0, 8], zIndex: 1002 }"
    :should-show="shouldShow"
    class="link-bubble-menu"
  >
    <div class="link-bubble-menu-content">
      <!-- Link URL display -->
      <div class="link-url-display">
        <span class="link-url-text" :title="currentLinkUrl">{{ currentLinkUrl }}</span>
      </div>

      <!-- Action button group -->
      <div class="link-actions">
        <!-- Divider -->
        <div class="link-divider"></div>
        
        <!-- Edit link button -->
        <button
          class="link-action-btn"
          @click="editLink"
          :title="t('editor.editLink')"
        >
          <EditOutlined />
        </button>

        <!-- Divider -->
        <div class="link-divider"></div>

        <!-- Open link button -->
        <button
          class="link-action-btn"
          @click="openLink"
          :title="t('editor.openLink')"
        >
          <LinkOutlined />
        </button>

        <!-- Divider -->
        <div class="link-divider"></div>

        <!-- Delete link button -->
        <button
          class="link-action-btn link-action-btn--danger"
          @click="removeLink"
          :title="t('editor.removeLink')"
        >
          <DeleteOutlined />
        </button>
      </div>
    </div>

    <!-- Edit link modal -->
    <a-modal
      v-model:open="linkModalOpen"
      :title="t('editor.editLink')"
      @ok="applyLink"
      width="400px"
    >
      <a-input
        v-model:value="linkUrl"
        :placeholder="t('editor.linkPlaceholder')"
        @keyup.enter="applyLink"
      />
    </a-modal>
  </bubble-menu>
</template>

<script setup lang="ts">
/**
 * LinkBubbleMenu - Link bubble menu component
 * @description Displays bubble menu on selecting links, providing edit, open, delete capabilities
 * @description Located in tools/link-bubble folder, toggled via features.linkBubbleMenu
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import type { Editor } from '@tiptap/vue-3'
import { t } from '@/locales'
import { EditOutlined, LinkOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { createCommandRunner } from '@/utils/editorCommands'

const props = withDefaults(
  defineProps<{
    editor: Editor | null | undefined
    readonly?: boolean
    enabled?: boolean
  }>(),
  {
    readonly: false,
    enabled: false, // Default enabled
  }
)

const editor = computed(() => props.editor ?? null)
const runCommand = createCommandRunner(editor)

// Reactive state
const currentLinkUrl = ref('')
const linkModalOpen = ref(false)
const linkUrl = ref('')

/**
 * Update current link URL
 */
function updateCurrentLinkUrl() {
  const e = editor.value
  if (!e) {
    currentLinkUrl.value = ''
    return
  }

  if (e.isActive('link')) {
    const attrs = e.getAttributes('link')
    currentLinkUrl.value = attrs.href || ''
  } else {
    currentLinkUrl.value = ''
  }
}

/**
 * Check if link bubble menu should be displayed
 * @description Displays only when link text is selected
 */
const shouldShow = (bubbleProps: { editor: any; state: any; from: number; to: number }) => {
  // If feature disabled, do not display
  if (!props.enabled) {
    return false
  }

  // Do not display in read-only mode
  if (props.readonly) {
    return false
  }

  const e = bubbleProps.editor
  if (!e) {
    return false
  }

  const { from, to } = bubbleProps
  const { state } = bubbleProps

  // Key: display only when selection range is non-empty
  // If from === to, cursor position only, do not display
  if (from === to) {
    return false
  }

  // Check if selected text contains link mark
  // Ensure selected text itself is a link
  try {
    const start = Math.min(from, to)
    const end = Math.max(from, to)
    
    // Use resolve to get marks in selection range
    const $from = state.doc.resolve(start)
    const $to = state.doc.resolve(end)
    
    // Check start mark
    const marksAtStart = $from.marks()
    let linkMarkAtStart = null
    for (const mark of marksAtStart) {
      if (mark.type && mark.type.name === 'link' && mark.attrs?.href) {
        linkMarkAtStart = mark
        break
      }
    }
    
    // Check end mark
    const marksAtEnd = $to.marks()
    let linkMarkAtEnd = null
    for (const mark of marksAtEnd) {
      if (mark.type && mark.type.name === 'link' && mark.attrs?.href) {
        linkMarkAtEnd = mark
        break
      }
    }
    
    // Show bubble menu only when both start and end have matching link mark
    // Ensures selected text itself is a link
    if (linkMarkAtStart && linkMarkAtEnd) {
      // Compare href to check if same link
      if (linkMarkAtStart.attrs?.href === linkMarkAtEnd.attrs?.href) {
        currentLinkUrl.value = linkMarkAtStart.attrs.href
        return true
      }
    }
    
    // Check all text nodes in selection
    // Ensure all selected text nodes contain link mark
    let allNodesHaveLink = false
    let linkHref = ''
    let hasNonLinkText = false
    
    state.doc.nodesBetween(start, end, (node: any) => {
      // Only check text nodes
      if (node.isText) {
        if (node.marks && node.marks.length > 0) {
          const linkMark = node.marks.find(
            (mark: any) => mark.type && mark.type.name === 'link' && mark.attrs?.href
          )
          if (linkMark) {
            if (!linkHref) {
              linkHref = linkMark.attrs.href
            } else if (linkHref !== linkMark.attrs.href) {
              // Do not display if selection spans different links
              hasNonLinkText = true
              return false
            }
            allNodesHaveLink = true
          } else {
            // Do not display if text node lacks link mark
            hasNonLinkText = true
            return false
          }
        } else {
          // Do not display if text node has no marks
          hasNonLinkText = true
          return false
        }
      }
    })
    
    // Display only if all text nodes are link marked
    if (allNodesHaveLink && !hasNonLinkText && linkHref) {
      currentLinkUrl.value = linkHref
      return true
    }
  } catch (error) {
    // Ignore errors
  }

  return false
}

/**
 * Sync link URL on editor selection change
 */
function handleSelectionUpdate() {
  updateCurrentLinkUrl()
}

// Listen to selection change event to update link URL
watch(
  () => editor.value,
  (newEditor, oldEditor) => {
    if (oldEditor) {
      oldEditor.off('selectionUpdate', handleSelectionUpdate)
    }
    if (newEditor) {
      updateCurrentLinkUrl()
      newEditor.on('selectionUpdate', handleSelectionUpdate)
    }
  },
  { immediate: true }
)

// Clean up listener on component unmount
onBeforeUnmount(() => {
  editor.value?.off('selectionUpdate', handleSelectionUpdate)
})

/**
 * Edit link
 */
function editLink() {
  const e = editor.value
  if (!e) return

  if (e.isActive('link')) {
    linkUrl.value = e.getAttributes('link').href || ''
  } else {
    linkUrl.value = ''
  }

  linkModalOpen.value = true
}

/**
 * Apply link edit
 */
function applyLink() {
  const e = editor.value
  if (!e) return

  const finalUrl = linkUrl.value.trim()
  
  if (finalUrl) {
    // Validate URL format
    let urlToSet = finalUrl
    try {
      const url = new URL(finalUrl)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Invalid protocol')
      }
      urlToSet = finalUrl
    } catch {
      // Add https:// if URL incomplete
      urlToSet = finalUrl.startsWith('http')
        ? finalUrl
        : `https://${finalUrl}`
    }
    
    // Update link using editor instance
    if (e) {
      const hasSelection = !e.state.selection.empty
      const chain = e.chain().focus()
      
      if (hasSelection) {
        // Extend mark range and set link if text selected
        const success = chain.extendMarkRange('link').setLink({ href: urlToSet, target: '_blank' }).run()
        if (success) {
          // Immediately update displayed link URL
          currentLinkUrl.value = urlToSet
          // Wait state sync then confirm
          nextTick(() => {
            updateCurrentLinkUrl()
          })
        }
      } else {
        // Set link at current cursor if no selection
        const success = chain.setLink({ href: urlToSet, target: '_blank' }).run()
        if (success) {
          currentLinkUrl.value = urlToSet
          nextTick(() => {
            updateCurrentLinkUrl()
          })
        }
      }
    }
  } else {
    // Remove link if URL empty
    runCommand((chain: any) => chain.unsetLink())()
    currentLinkUrl.value = ''
  }

  // Close modal and reset input
  linkModalOpen.value = false
  linkUrl.value = ''
}

/**
 * Open link
 */
function openLink() {
  const e = editor.value
  if (!e) return

  if (e.isActive('link')) {
    const attrs = e.getAttributes('link')
    const href = attrs.href || ''
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }
}

/**
 * Delete link
 */
function removeLink() {
  runCommand((chain: any) => chain.unsetLink())()
}
</script>

<style scoped>
/* Link bubble menu container */
.link-bubble-menu {
  z-index: 1002; /* Positioned above image toolbar */
}

.link-bubble-menu-content {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    background: #1f1f1f;
    border-color: #434343;
  }
}

/* Link URL display area */
.link-url-display {
  flex: 1;
  min-width: 0;
  padding-right: 12px;
}

.link-url-text {
  display: block;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #262626;
  line-height: 1.5;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    color: #f0f0f0;
  }
}

/* Action button group */
.link-actions {
  display: flex;
  align-items: center;
  gap: 0;
}

/* Divider */
.link-divider {
  width: 1px;
  height: 20px;
  background: #e8e8e8;
  margin: 0 4px;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    background: #434343;
  }
}

/* Action button */
.link-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: #262626;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  transition: all 0.2s;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    color: #f0f0f0;
  }
}

.link-action-btn:hover:not(:disabled) {
  background: #f5f5f5;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    background: #303030;
  }
}

.link-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Danger button style (Delete) */
.link-action-btn--danger {
  color: #ff4d4f;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    color: #ff7875;
  }
}

.link-action-btn--danger:hover {
  color: #ff4d4f;
  background: #fff1f0;

  :where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) & {
    color: #ff7875;
    background: #3a1a1a;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .link-bubble-menu-content {
    padding: 6px 10px;
  }

  .link-url-text {
    max-width: 200px;
    font-size: 13px;
  }

  .link-action-btn {
    width: 28px;
    height: 28px;
  }
}
</style>

