<template>
  <ToolbarGroup>
    <ToolbarDropdownButton
      :icon="PictureOutlined"
      :title="t('editor.image')"
      :items="imageMenuItems"
      placement="bottomLeft"
    />
  </ToolbarGroup>

  <!-- Network image upload modal -->
  <a-modal v-model:open="imageModalOpen" :title="t('editor.insertImage')" @ok="applyImage">
    <a-input v-model:value="imageUrl" :placeholder="t('editor.imagePlaceholder')" />
  </a-modal>

  <!-- Local image upload (drag-and-drop upload, supports batch) -->
  <a-modal v-model:open="localUploadOpen" :title="t('editor.localUploadImage')" :footer="null">
    <a-upload-dragger :show-upload-list="false" :custom-request="handleLocalUpload" accept="image/*" multiple>
      <p class="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p class="ant-upload-text">{{ t('editor.clickOrDragUpload') }}</p>
      <p class="ant-upload-hint">{{ t('editor.onlySupportImage') }}</p>
    </a-upload-dragger>
  </a-modal>

  <!-- Local video upload (drag-and-drop upload, supports batch) -->
  <a-modal v-model:open="videoUploadOpen" :title="t('editor.localUploadVideo')" :footer="null">
    <a-upload-dragger :show-upload-list="false" :custom-request="handleVideoUpload" accept="video/*" multiple>
      <p class="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p class="ant-upload-text">{{ t('editor.clickOrDragUpload') }}</p>
      <p class="ant-upload-hint">{{ t('editor.onlySupportVideo') }}</p>
    </a-upload-dragger>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * ImageUpload - media upload component
 * @description Supports local and network image upload, and local video upload
 */
import { computed, ref } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { ToolbarGroup, ToolbarDropdownButton } from '@/ui'
import { createCommandRunner } from '@/utils/editorCommands'
import { t } from '@/locales'
import { PictureOutlined, UploadOutlined, LinkOutlined, InboxOutlined, VideoCameraOutlined } from '@ant-design/icons-vue'
import type { MenuItemConfig } from '@/configs/toolbar'

// ===== Props =====
interface Props {
  editor: Editor | null | undefined
  /** Image upload function (optional) */
  uploadImage?: (file: File) => Promise<string>
  /** Video upload function (optional) */
  uploadVideo?: (file: File) => Promise<string>
}

const props = withDefaults(defineProps<Props>(), {
  uploadImage: undefined,
  uploadVideo: undefined,
})

const editor = computed(() => props.editor ?? null)
const runCommand = createCommandRunner(editor)

// ===== State =====
const imageModalOpen = ref(false)
const imageUrl = ref('')
const localUploadOpen = ref(false)
const videoUploadOpen = ref(false)

// ===== Media upload menu items =====
const imageMenuItems = computed<MenuItemConfig[]>(() => [
  {
    key: 'upload-local',
    label: t('editor.localUpload'),
    icon: UploadOutlined,
    action: () => (localUploadOpen.value = true),
  },
  {
    key: 'upload-url',
    label: t('editor.webUpload'),
    icon: LinkOutlined,
    action: () => (imageModalOpen.value = true),
  },
  {
    key: 'upload-video',
    label: t('editor.uploadVideo'),
    icon: VideoCameraOutlined,
    action: () => (videoUploadOpen.value = true),
  },
])

/**
 * Insert an image (network upload)
 */
function applyImage() {
  if (imageUrl.value) {
    runCommand((chain) => chain.insertContent({ type: 'image', attrs: { src: imageUrl.value } }))()
  }
  imageModalOpen.value = false
  imageUrl.value = ''
}

/**
 * Handle local image upload (custom upload logic)
 * - If the parent component provides an uploadImage(file) callback, use the URL it returns
 * - Otherwise, fall back to inserting a local DataURL directly
 */
async function handleLocalUpload(options: any) {
  const { file, onSuccess, onError } = options || {}
  try {
    let url: string
    if (props.uploadImage) {
      url = await props.uploadImage(file as File)
    } else {
      // Use Base64 encoding
      url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file as File)
      })
    }
    // Insert the image
    runCommand((chain) => chain.insertContent({ type: 'image', attrs: { src: url } }))()
    localUploadOpen.value = false
    onSuccess && onSuccess({ url })
  } catch (e) {
    onError && onError(e)
  }
}

/**
 * Handle local video upload (custom upload logic)
 * - If the parent component provides an uploadVideo(file) callback, use the URL it returns
 * - Otherwise, fall back to inserting a local DataURL directly
 */
async function handleVideoUpload(options: any) {
  const { file, onSuccess, onError } = options || {}
  try {
    let url: string
    if (props.uploadVideo) {
      url = await props.uploadVideo(file as File)
    } else {
      // Use Base64 encoding
      url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file as File)
      })
    }
    // Insert the video
    runCommand((chain) => chain.insertContent({ type: 'video', attrs: { src: url } }))()
    videoUploadOpen.value = false
    onSuccess && onSuccess({ url })
  } catch (e) {
    onError && onError(e)
  }
}
</script>
