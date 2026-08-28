<template>
  <NodeViewWrapper
    :class="['math-node-wrapper', { 'is-block': node.attrs.block, 'is-editing': isEditing, 'is-selected': selected }]"
    :as="node.attrs.block ? 'div' : 'span'"
  >
    <!-- Edit mode -->
    <div v-if="isEditing" class="math-editor">
      <textarea
        ref="textareaRef"
        v-model="latexInput"
        class="math-editor__input"
        :placeholder="t('editor.mathPlaceholder')"
        @keydown.enter.ctrl="saveAndClose"
        @keydown.escape="cancelEdit"
        @blur="handleBlur"
      />
      <div class="math-editor__preview">
        <span v-if="renderError" class="math-error">{{ renderError }}</span>
        <span v-else v-html="previewHtml" />
      </div>
      <div class="math-editor__actions">
        <button type="button" class="math-btn math-btn--cancel" @click="cancelEdit">
          {{ t('editor.cancel') }}
        </button>
        <button type="button" class="math-btn math-btn--save" @click="saveAndClose">
          {{ t('editor.accept') }}
        </button>
      </div>
    </div>

    <!-- Display mode -->
    <span
      v-else
      class="math-display"
      :class="{ 'math-empty': !node.attrs.latex }"
      @dblclick="startEdit"
      @click="handleClick"
      v-html="displayHtml"
    />
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, shallowRef } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { t } from '@/locales'

// KaTeX loaded on demand: katex is only downloaded when math formulas are actually rendered in the document.
// Note: katex's CSS (katex/dist/katex.min.css) must be imported by the consumer.
type KatexModule = typeof import('katex')['default']

// Module-level cache, multiple formula nodes share the same load
let katexModule: KatexModule | null = null
let katexLoadPromise: Promise<KatexModule> | null = null

function loadKatex(): Promise<KatexModule> {
  if (!katexLoadPromise) {
    katexLoadPromise = import('katex').then((m: any) => {
      katexModule = (m.default ?? m) as KatexModule
      return katexModule
    })
  }
  return katexLoadPromise
}

const props = defineProps(nodeViewProps)

const isEditing = ref(false)
const latexInput = ref('')
const renderError = ref<string | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Trigger re-render after katex finishes loading (already loaded -> immediately available)
const katexRef = shallowRef<KatexModule | null>(katexModule)
if (!katexModule) {
  loadKatex()
    .then((m) => {
      katexRef.value = m
    })
    .catch((e) => {
      renderError.value = e instanceof Error ? e.message : 'Failed to load katex'
    })
}

// HTML escaping (when katex isn't loaded, show the raw LaTeX as plain text)
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Render LaTeX as HTML
function renderLatex(latex: string, displayMode: boolean): string {
  if (!latex.trim()) {
    return `<span class="math-placeholder">${t('editor.mathEmpty')}</span>`
  }

  // katex hasn't finished loading yet: show the raw LaTeX text as placeholder first
  if (!katexRef.value) {
    return `<span class="math-loading">${escapeHtml(latex)}</span>`
  }

  try {
    renderError.value = null
    return katexRef.value.renderToString(latex, {
      displayMode,
      throwOnError: false,
      errorColor: '#cc0000',
      strict: false,
      trust: false,
    })
  } catch (e) {
    renderError.value = e instanceof Error ? e.message : 'Render error'
    return `<span class="math-error">${renderError.value}</span>`
  }
}

// Display mode HTML
const displayHtml = computed(() => {
  return renderLatex(props.node.attrs.latex, props.node.attrs.block)
})

// Preview HTML
const previewHtml = computed(() => {
  return renderLatex(latexInput.value, props.node.attrs.block)
})

// Start editing
function startEdit() {
  if (props.editor?.isEditable === false) return

  isEditing.value = true
  latexInput.value = props.node.attrs.latex || ''

  nextTick(() => {
    textareaRef.value?.focus()
    textareaRef.value?.select()
  })
}

// Save and close
function saveAndClose() {
  if (latexInput.value !== props.node.attrs.latex) {
    props.updateAttributes({ latex: latexInput.value })
  }
  isEditing.value = false
}

// Cancel editing
function cancelEdit() {
  isEditing.value = false
  latexInput.value = props.node.attrs.latex || ''
}

// Handle blur
function handleBlur(e: FocusEvent) {
  // If the clicked element is a button inside the editor, don't close
  const relatedTarget = e.relatedTarget as HTMLElement
  if (relatedTarget?.closest('.math-editor')) {
    return
  }
  saveAndClose()
}

// Handle click (select node)
function handleClick() {
  const pos = props.getPos()
  if (typeof pos === 'number') {
    props.editor?.commands.setNodeSelection(pos)
  }
}

// If it's a newly created empty formula, automatically enter edit mode
onMounted(() => {
  if (!props.node.attrs.latex && props.editor?.isEditable) {
    startEdit()
  }
})

// Watch node changes
watch(
  () => props.node.attrs.latex,
  (newLatex) => {
    if (!isEditing.value) {
      latexInput.value = newLatex || ''
    }
  }
)
</script>

<style>
.math-node-wrapper {
  display: inline;
  position: relative;
}

.math-node-wrapper.is-block {
  display: block;
  text-align: center;
  margin: 1em 0;
}

.math-node-wrapper.is-selected .math-display {
  outline: 2px solid var(--tp-color-primary, #1890ff);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Display mode */
.math-display {
  display: inline-block;
  padding: 2px 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.math-display:hover {
  background-color: rgba(24, 144, 255, 0.1);
}

.math-node-wrapper.is-block .math-display {
  display: block;
  padding: 8px 16px;
}

.math-empty {
  color: var(--tp-color-text-muted, #999);
  font-style: italic;
}

.math-placeholder {
  color: var(--tp-color-text-muted, #999);
  font-style: italic;
}

/* katex loading: show raw LaTeX in monospace font */
.math-loading {
  color: var(--tp-color-text-muted, #999);
  font-family: 'Fira Code', 'Monaco', monospace;
  font-size: 0.9em;
}

.math-error {
  color: #cc0000;
  font-size: 12px;
}

/* Edit mode */
.math-editor {
  display: inline-flex;
  flex-direction: column;
  gap: 8px;
  min-width: 300px;
  padding: 12px;
  background: var(--tp-color-bg, #fff);
  border: 1px solid var(--tp-color-border, #e5e5e5);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.math-node-wrapper.is-block .math-editor {
  display: flex;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.math-editor__input {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  font-family: 'Fira Code', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: var(--tp-color-text, #1a1a1a);
  background: var(--tp-color-bg-secondary, #f5f5f5);
  border: 1px solid var(--tp-color-border, #e5e5e5);
  border-radius: 4px;
  resize: vertical;
  outline: none;
}

.math-editor__input:focus {
  border-color: var(--tp-color-primary, #1890ff);
}

.math-editor__preview {
  min-height: 40px;
  padding: 8px;
  text-align: center;
  background: var(--tp-color-bg-secondary, #f5f5f5);
  border-radius: 4px;
}

.math-editor__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.math-btn {
  padding: 4px 12px;
  font-size: 13px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.math-btn--cancel {
  color: var(--tp-color-text, #1a1a1a);
  background: var(--tp-color-bg-secondary, #f5f5f5);
}

.math-btn--cancel:hover {
  background: var(--tp-color-border, #e5e5e5);
}

.math-btn--save {
  color: #fff;
  background: var(--tp-color-primary, #1890ff);
}

.math-btn--save:hover {
  background: #40a9ff;
}

/* Dark mode */
[data-theme="dark"] .math-editor {
  background: #1f1f1f;
  border-color: #404040;
}

[data-theme="dark"] .math-editor__input {
  color: #e5e5e5;
  background: #2d2d2d;
  border-color: #404040;
}

[data-theme="dark"] .math-editor__preview {
  background: #2d2d2d;
}

[data-theme="dark"] .math-btn--cancel {
  color: #e5e5e5;
  background: #2d2d2d;
}

[data-theme="dark"] .math-btn--cancel:hover {
  background: #404040;
}
</style>
