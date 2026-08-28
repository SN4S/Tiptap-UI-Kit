<!--
  PreviewMode - Preview mode component
  @description Pure preview mode, no toolbar, not editable, not clickable
  @features
    - Hide header toolbar
    - Hide footer navigation bar
    - Disable editing and text selection
    - Disable all click interactions
-->
<template>
  <div class="tiptap-preview-mode" :class="{ 'preview-mode--bordered': bordered }">
    <!-- Preview content area -->
    <div class="preview-content" ref="contentRef">
      <div class="preview-document" :style="documentStyle">
        <div
          class="preview-body"
          v-html="htmlContent"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * PreviewMode - Preview mode component
 * @description Provides pure preview functionality, not editable, not clickable
 */
import { computed, ref } from 'vue'

// Styles
import '@/styles/base.css'
import '@/styles/word-mode.css'
import './preview-mode.css'

// ===== Props =====
interface Props {
  /** HTML content */
  content?: string
  /** JSON content (lower priority than content) */
  jsonContent?: any
  /** Whether to show border */
  bordered?: boolean
  /** Zoom level (percentage, default 100) */
  zoomLevel?: number
  /** Max width (default 100%) */
  maxWidth?: string
  /** Background color */
  backgroundColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  jsonContent: undefined,
  bordered: false,
  zoomLevel: 100,
  maxWidth: '100%',
  backgroundColor: '#ffffff',
})

// ===== Refs =====
const contentRef = ref<HTMLElement | null>(null)

// ===== Computed properties =====
/**
 * HTML content
 * @description Uses content first, otherwise converts jsonContent to HTML
 */
const htmlContent = computed(() => {
  if (props.content) {
    return props.content
  }
  if (props.jsonContent) {
    // Simple JSON to HTML conversion (may need more complex conversion in production)
    return jsonToHtml(props.jsonContent)
  }
  return ''
})

/**
 * Document styles
 */
const documentStyle = computed(() => ({
  transform: `scale(${props.zoomLevel / 100})`,
  transformOrigin: 'top center',
  maxWidth: props.maxWidth,
  backgroundColor: props.backgroundColor,
}))

/**
 * Simple JSON to HTML conversion
 * @description Converts Tiptap JSON format to HTML
 */
function jsonToHtml(json: any): string {
  if (!json || typeof json !== 'object') return ''
  
  if (json.type === 'doc' && Array.isArray(json.content)) {
    return json.content.map((node: any) => nodeToHtml(node)).join('')
  }
  
  return nodeToHtml(json)
}

/**
 * Node to HTML
 */
function nodeToHtml(node: any): string {
  if (!node || typeof node !== 'object') return ''
  
  const { type, content, text, attrs, marks } = node
  
  // Text node
  if (type === 'text') {
    let result = text || ''
    // Apply marks
    if (marks && Array.isArray(marks)) {
      marks.forEach((mark: any) => {
        switch (mark.type) {
          case 'bold':
            result = `<strong>${result}</strong>`
            break
          case 'italic':
            result = `<em>${result}</em>`
            break
          case 'underline':
            result = `<u>${result}</u>`
            break
          case 'strike':
            result = `<s>${result}</s>`
            break
          case 'code':
            result = `<code>${result}</code>`
            break
          case 'link':
            result = `<a href="${mark.attrs?.href || '#'}" target="_blank" rel="noopener noreferrer">${result}</a>`
            break
          case 'textStyle':
            const styles: string[] = []
            if (mark.attrs?.color) styles.push(`color: ${mark.attrs.color}`)
            if (mark.attrs?.fontSize) styles.push(`font-size: ${mark.attrs.fontSize}`)
            if (mark.attrs?.fontFamily) styles.push(`font-family: ${mark.attrs.fontFamily}`)
            if (styles.length > 0) {
              result = `<span style="${styles.join('; ')}">${result}</span>`
            }
            break
          case 'highlight':
            result = `<mark style="background-color: ${mark.attrs?.color || '#ffff00'}">${result}</mark>`
            break
        }
      })
    }
    return result
  }
  
  // Child content
  const childrenHtml = content ? content.map((child: any) => nodeToHtml(child)).join('') : ''
  
  // Generate HTML based on node type
  switch (type) {
    case 'paragraph':
      const pStyle = attrs?.textAlign ? `text-align: ${attrs.textAlign}` : ''
      return `<p${pStyle ? ` style="${pStyle}"` : ''}>${childrenHtml || '<br>'}</p>`
    
    case 'heading':
      const level = attrs?.level || 1
      const hStyle = attrs?.textAlign ? `text-align: ${attrs.textAlign}` : ''
      return `<h${level}${hStyle ? ` style="${hStyle}"` : ''}>${childrenHtml}</h${level}>`
    
    case 'bulletList':
      return `<ul>${childrenHtml}</ul>`
    
    case 'orderedList':
      return `<ol>${childrenHtml}</ol>`
    
    case 'listItem':
      return `<li>${childrenHtml}</li>`
    
    case 'taskList':
      return `<ul class="task-list">${childrenHtml}</ul>`
    
    case 'taskItem':
      const checked = attrs?.checked ? 'checked' : ''
      return `<li class="task-item"><input type="checkbox" ${checked} disabled />${childrenHtml}</li>`
    
    case 'blockquote':
      return `<blockquote>${childrenHtml}</blockquote>`
    
    case 'codeBlock':
      return `<pre><code>${childrenHtml}</code></pre>`
    
    case 'horizontalRule':
      return '<hr />'
    
    case 'image':
      const src = attrs?.src || ''
      const alt = attrs?.alt || ''
      const width = attrs?.width ? `width="${attrs.width}"` : ''
      return `<img src="${src}" alt="${alt}" ${width} />`
    
    case 'table':
      return `<table>${childrenHtml}</table>`
    
    case 'tableRow':
      return `<tr>${childrenHtml}</tr>`
    
    case 'tableCell':
      const colspan = attrs?.colspan > 1 ? ` colspan="${attrs.colspan}"` : ''
      const rowspan = attrs?.rowspan > 1 ? ` rowspan="${attrs.rowspan}"` : ''
      return `<td${colspan}${rowspan}>${childrenHtml}</td>`
    
    case 'tableHeader':
      const thColspan = attrs?.colspan > 1 ? ` colspan="${attrs.colspan}"` : ''
      const thRowspan = attrs?.rowspan > 1 ? ` rowspan="${attrs.rowspan}"` : ''
      return `<th${thColspan}${thRowspan}>${childrenHtml}</th>`
    
    case 'hardBreak':
      return '<br />'
    
    default:
      return childrenHtml
  }
}

// ===== Expose methods =====
defineExpose({
  /** Get preview container element */
  getContainer: () => contentRef.value,
})
</script>

<style scoped>
.tiptap-preview-mode {
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: #f5f5f5;
}

.tiptap-preview-mode.preview-mode--bordered {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) .tiptap-preview-mode {
  background-color: #141414;
}

:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) .tiptap-preview-mode.preview-mode--bordered {
  border-color: #303030;
}

.preview-content {
  display: flex;
  justify-content: center;
  padding: 24px;
  min-height: 100%;
}

.preview-document {
  width: 210mm;
  min-height: 297mm;
  padding: 25.4mm;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  box-sizing: border-box;
}

:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) .preview-document {
  background: #1f1f1f;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.preview-body {
  /* Disable text selection */
  user-select: none;
  /* Disable all click events */
  pointer-events: none;
  /* Inherit content styles from Tiptap editor */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.75;
  color: #262626;
}

:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) .preview-body {
  color: #f0f0f0;
}

/* Preview content styles */
.preview-body :deep(h1),
.preview-body :deep(h2),
.preview-body :deep(h3),
.preview-body :deep(h4),
.preview-body :deep(h5),
.preview-body :deep(h6) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.4;
}

.preview-body :deep(h1) { font-size: 2em; }
.preview-body :deep(h2) { font-size: 1.5em; }
.preview-body :deep(h3) { font-size: 1.25em; }
.preview-body :deep(h4) { font-size: 1.1em; }
.preview-body :deep(h5) { font-size: 1em; }
.preview-body :deep(h6) { font-size: 0.9em; }

.preview-body :deep(p) {
  margin: 0.5em 0;
}

.preview-body :deep(ul),
.preview-body :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.preview-body :deep(li) {
  margin: 0.25em 0;
}

.preview-body :deep(blockquote) {
  margin: 1em 0;
  padding: 0.5em 1em;
  border-left: 4px solid #d9d9d9;
  background: #fafafa;
  color: #666;
}

:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) .preview-body :deep(blockquote) {
  border-left-color: #434343;
  background: #262626;
  color: #a6a6a6;
}

.preview-body :deep(pre) {
  margin: 1em 0;
  padding: 1em;
  background: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
}

:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) .preview-body :deep(pre) {
  background: #262626;
}

.preview-body :deep(code) {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  padding: 0.2em 0.4em;
  background: #f5f5f5;
  border-radius: 3px;
}

:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) .preview-body :deep(code) {
  background: #262626;
}

.preview-body :deep(pre code) {
  padding: 0;
  background: transparent;
}

.preview-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.preview-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.preview-body :deep(th),
.preview-body :deep(td) {
  border: 1px solid #d9d9d9;
  padding: 8px 12px;
  text-align: left;
}

:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) .preview-body :deep(th),
:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) .preview-body :deep(td) {
  border-color: #434343;
}

.preview-body :deep(th) {
  background: #fafafa;
  font-weight: 600;
}

:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) .preview-body :deep(th) {
  background: #262626;
}

.preview-body :deep(hr) {
  margin: 1.5em 0;
  border: none;
  border-top: 1px solid #d9d9d9;
}

:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) .preview-body :deep(hr) {
  border-top-color: #434343;
}

.preview-body :deep(a) {
  color: #1890ff;
  text-decoration: none;
}

.preview-body :deep(.task-list) {
  list-style: none;
  padding-left: 0;
}

.preview-body :deep(.task-item) {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.preview-body :deep(.task-item input[type="checkbox"]) {
  margin-top: 0.3em;
}
</style>

