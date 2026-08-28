<template>
  <ToolbarGroup>
    <ToolbarDropdownButton
      :icon="FileWordOutlined"
      :title="t('editor.word')"
      :items="menuItems"
      placement="bottomLeft"
    />
  </ToolbarGroup>

  <!-- Import Word file (drag and drop upload) -->
  <a-modal v-model:open="importModalOpen" :title="t('editor.importWord')" :footer="null">
    <a-upload-dragger
      :show-upload-list="false"
      :custom-request="handleImport"
      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      :disabled="importing"
    >
      <p class="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p class="ant-upload-text">{{ t('editor.clickOrDragUploadWord') }}</p>
      <p class="ant-upload-hint">{{ t('editor.onlySupportDocx') }}</p>
    </a-upload-dragger>
    <div v-if="importing" style="text-align: center; margin-top: 12px; color: #999">
      {{ t('editor.importing') }}
    </div>
  </a-modal>

  <!-- Export filename input -->
  <a-modal
    v-model:open="exportModalOpen"
    :title="t('editor.exportWord')"
    @ok="doExport"
    :ok-button-props="{ disabled: exporting }"
  >
    <a-input
      v-model:value="exportFilename"
      :placeholder="t('editor.exportFilenamePlaceholder')"
      @keyup.enter="doExport"
      :disabled="exporting"
    />
    <div v-if="exporting" style="text-align: center; margin-top: 12px; color: #999">
      {{ t('editor.exporting') }}
    </div>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * WordButton - Word import/export button component
 * @description Supports importing and exporting .docx files
 */
import { computed, ref } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { ToolbarGroup, ToolbarDropdownButton } from '@/ui'
import { t } from '@/locales'
import { FileWordOutlined, ImportOutlined, ExportOutlined, InboxOutlined } from '@ant-design/icons-vue'
import { importWordFile } from './wordImport'
import { exportToWord } from './wordExport'
import type { MenuItemConfig } from '@/configs/toolbar'

// ===== Props =====
interface Props {
  editor: Editor | null | undefined
}

const props = defineProps<Props>()
const editor = computed(() => props.editor ?? null)

// ===== State =====
const importModalOpen = ref(false)
const exportModalOpen = ref(false)
const exportFilename = ref('document')
const importing = ref(false)
const exporting = ref(false)

// ===== Menu Items =====
const menuItems = computed<MenuItemConfig[]>(() => [
  {
    key: 'import-word',
    label: t('editor.importWord'),
    icon: ImportOutlined,
    action: () => {
      importModalOpen.value = true
    },
  },
  {
    key: 'export-word',
    label: t('editor.exportWord'),
    icon: ExportOutlined,
    action: () => {
      exportFilename.value = 'document'
      exportModalOpen.value = true
    },
  },
])

/**
 * Handle Word file import
 */
async function handleImport(options: any) {
  const { file, onSuccess, onError } = options || {}
  const e = editor.value
  if (!e) return

  importing.value = true
  try {
    await importWordFile(e, file as File)
    importModalOpen.value = false
    onSuccess && onSuccess({})
  } catch (err) {
    console.error('[WordButton] Import failed:', err)
    onError && onError(err)
  } finally {
    importing.value = false
  }
}

/**
 * Execute Word export
 */
async function doExport() {
  const e = editor.value
  if (!e) return

  exporting.value = true
  try {
    const html = e.getHTML()
    const name = exportFilename.value.trim() || 'document'
    await exportToWord(html, name)
    exportModalOpen.value = false
  } catch (err) {
    console.error('[WordButton] Export failed:', err)
  } finally {
    exporting.value = false
  }
}
</script>
