<template>
  <ToolbarGroup>
    <ToolbarButton
      :icon="LinkOutlined"
      :title="t('editor.link')"
      :active="isActive('link')"
      @click="handleClick"
    />
  </ToolbarGroup>

  <!-- Link input modal -->
  <a-modal
    v-model:open="linkModalOpen"
    :title="t('editor.insertLink')"
    @ok="applyLink"
    width="400px"
  >
    <a-input
      v-model:value="linkUrl"
      :placeholder="t('editor.linkPlaceholder')"
      @keyup.enter="applyLink"
    />
  </a-modal>
</template>

<script setup lang="ts">
/**
 * LinkButton - Link button
 * @description Reusable link button component containing link insert/edit capabilities
 */
import { ref } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { ToolbarButton, ToolbarGroup } from '@/ui'
import { createCommandRunner } from '@/utils/editorCommands'
import { createStateCheckers, useReactiveEditor } from '@/utils/editorState'
import { t } from '@/locales'
import { LinkOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

// ===== Props =====
interface Props {
  editor: Editor | null | undefined
}

const props = defineProps<Props>()
const editor = useReactiveEditor(() => props.editor)

// ===== Reactive state =====
const linkModalOpen = ref(false)
const linkUrl = ref('')

// ===== Utility functions =====
const runCommand = createCommandRunner(editor)
const { isActive } = createStateCheckers(editor)

// ===== Methods =====
/**
 * Handle link button click
 */
function handleClick() {
  const e = editor.value
  if (!e) return

  // If already a link, get current link URL
  if (e.isActive('link')) {
    linkUrl.value = e.getAttributes('link')?.href ?? ''
  } else {
    linkUrl.value = ''
  }

  linkModalOpen.value = true
}

/**
 * Validate if URL is valid
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Build link attributes
 */
function buildLinkAttrs(href: string) {
  return {
    href,
    target: '_blank',
    rel: 'noopener noreferrer',
  }
}

/**
 * Apply link
 */
function applyLink() {
  const rawUrl = linkUrl.value.trim()
  const e = editor.value
  if (!e) return

  // If URL is empty, remove link
  if (!rawUrl) {
    runCommand((chain) => chain.unsetLink())()
    linkModalOpen.value = false
    linkUrl.value = ''
    return
  }

  // Validate URL
  if (!isValidUrl(rawUrl)) {
    message.warning(t('editor.enterValidLink'))
    return
  }

  const hasSelection = !e.state.selection.empty
  const chain = e.chain().focus()

  if (hasSelection) {
    chain.extendMarkRange('link').setLink(buildLinkAttrs(rawUrl)).run()
  } else {
    chain
      .insertContent([
        {
          type: 'text',
          text: rawUrl,
          marks: [{ type: 'link', attrs: buildLinkAttrs(rawUrl) }],
        },
      ])
      .run()
  }

  linkModalOpen.value = false
  linkUrl.value = ''
}
</script>

