<template>
  <div class="tiptap-pro-editor" :class="{ 'notion-mode': isNotionMode, 'word-mode': !isNotionMode, 'is-preview-mode': isPreviewMode }">
    <!-- Toolbar (hidden in preview mode) -->
    <ToolbarNav
      v-if="editorInstance && !isPreviewMode"
      :editor="editorInstance"
      :config="toolbarConfig"
      :enabled="shouldShowHeaderNav"
      class="word-toolbar"
    >
      <!-- Collaboration status display (on the right side of toolbar) -->
      <template v-if="shouldShowCollaboration" #right>
        <CollaborationToggle
          v-model="collaborationEnabled"
          :collaborators-count="collaboration.collaboratorsCount.value"
          :collaborators-list="[...collaboration.collaboratorsList.value]"
          show-label
          @change="handleCollaborationChange"
        />
      </template>
    </ToolbarNav>

    <!-- Feature: Link bubble menu (disabled in preview mode) -->
    <LinkBubbleMenu
      v-if="editorInstance && !isPreviewMode && (props.features?.linkBubbleMenu ?? false)"
      :editor="editorInstance"
      :readonly="readonly"
      :enabled="props.features?.linkBubbleMenu ?? false"
    />

    <!-- Feature: Table toolbar (disabled in preview mode) -->
    <TableToolbar
      v-if="editorInstance && !isPreviewMode"
      :editor="editorInstance"
      :readonly="readonly"
      :show-mode="props.tableMenuShowMode ?? 2"
      :enabled="props.features?.tableToolbar ?? false"
    />

    <!-- Feature: Image toolbar (disabled in preview mode) -->
    <ImageToolbar
      v-if="editorInstance && !isPreviewMode && (props.features?.image ?? false)"
      :editor="editorInstance"
      :readonly="readonly"
      :enabled="props.features?.image ?? false"
    />

    <!-- Feature: Floating menu (disabled in preview mode) -->
    <FloatingMenu
      v-if="editorInstance && !isPreviewMode && (props.features?.floatingMenu ?? false)"
      :editor="editorInstance"
      :readonly="readonly"
      :enabled="props.features?.floatingMenu ?? false"
    />

    <!-- Feature: Slash command menu (disabled in preview mode) -->
    <SlashCommandMenu
      v-if="editorInstance && !isPreviewMode && (props.features?.slashCommand ?? false)"
      ref="slashCommandMenuRef"
      :editor="editorInstance"
      :custom-slash-commands="props.customSlashCommands"
      :transform-slash-commands="props.transformSlashCommands"
    />

    <!-- Feature: Drag handle menu (disabled in preview mode) -->
    <DragHandleMenu
      v-if="editorInstance && !isPreviewMode && (props.features?.dragHandleMenu ?? false)"
      ref="dragHandleMenuRef"
      :editor="editorInstance"
      :readonly="readonly"
    />

    <!-- Word document area container -->
    <div class="word-document-container" ref="containerRef">
      <div class="document-pages" :style="{ transform: `scale(${zoomLevel / 100})` }">
        <div class="continuous-pages">
          <EditorContent v-if="editorInstance" :editor="editorInstance" class="word-content-multi" />
          <div v-else class="editor-fallback">{{ editorError || t('editor.initializing') }}</div>
        </div>
      </div>
    </div>

    <!-- Footer navigation (hidden in preview mode) -->
    <FooterNav
      v-if="editorInstance && !isPreviewMode && shouldShowFooterNav"
      v-model:zoomLevel="zoomLevel"
      :totalPages="totalPages"
      :editor="editorInstance"
      :showCharCount="true"
    />

    <!-- AI document assistant (text-command editing, enabled with AI feature) -->
    <AiChatPanel
      v-if="aiChatEnabled"
      :editor="editorInstance"
      :show-settings-entry="props.features?.aiSettings !== false"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * TiptapProEditor - basic rich text editor
 * @description Tiptap editor supporting basic features
 */
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { debounce } from '@/utils/debounce'
import { Editor, EditorContent } from '@tiptap/vue-3'
import type { Editor as CoreEditor } from '@tiptap/core'
import type { TiptapProEditorProps } from './editorTypes'
import { A4_WIDTH_PX, A4_HEIGHT_PX, PAGE_PADDING_TOP_PX, PAGE_PADDING_BOTTOM_PX, PAGE_CONTENT_HEIGHT_PX } from '@/extensions/pageConstants'
// @vben/locales removed - using built-in i18n
import { createI18n, detectDefaultLocale, t, useI18n as useTiptapI18n, type LocaleCode } from '@/locales'

// Shared toolbar
import { ToolbarNav, BASIC_TOOLBAR_CONFIG, ADVANCED_TOOLBAR_CONFIG, type ToolbarToolsConfig } from '@/tools/header-nav'

// Feature module components
import { LinkBubbleMenu } from '@/tools/link-bubble'
import { AiChatPanel } from '@/ai/agent'
import { TableToolbar } from '@/tools/table-toolbar'
import { FooterNav } from '@/tools/footer-nav'
import { ImageToolbar } from '@/tools/image-toolbar'
import { FloatingMenu } from '@/tools/floating-menu'
import { DragHandleMenu } from '@/tools/drag-handle-menu'
import { SlashCommandMenu, SlashCommandExtension } from '@/tools/slash-command'
import type { SlashCommandState } from '@/tools/slash-command'

// Collaboration module (unified imports from collaboration module)
import {
  CollaborationToggle,
  useCollaboration,
  normalizeContent,
} from '@/tools/collaboration'

// User info retrieval
import { useUserStore } from '@/adapters'

// Extension configuration (dynamically loaded based on version)
import { getExtensionsByVersion } from '@/extensions/coreExtensions'
import { DragHandleWithMenuExtension } from '@/tools/drag-handle-menu'

// Styles (variables.css must load first to define CSS variables; base.css must load before other styles)
import '@/styles/variables.css'
import '@/styles/base.css'
import '@/styles/word-mode.css'
import '@/styles/notion-mode.css'
import '@/styles/toolbar.css'
import '@/styles/image-toolbar.css'
import '@/styles/floating-menu-toolbar.css'
import '@/styles/drag-handle-with-menu.css'
import '@/styles/image-resize.css'
import '@/styles/collaboration.css'
import '@/styles/slash-command.css'

// Theme presets (class-name scoped isolation: .theme-word / .theme-notion / ..., shipped with the package, no need for users to import separately)
import '@/themes/presets/word.css'
import '@/themes/presets/notion.css'
import '@/themes/presets/github.css'
import '@/themes/presets/typora.css'

const props = withDefaults(defineProps<TiptapProEditorProps>(), {
  zoomBarPlacement: 'bottom',
  readonly: false,
  previewMode: false,
  initialContent: '',
  // Full features by default: consistent with 0.1.x behavior (old documents with tables/formulas open normally, AI entry has corresponding extension support);
  // Users who want a smaller runtime should explicitly pass 'basic' / 'minimal'
  version: 'premium',
})

// ===== Notion & Layout Modes =====
const isNotionMode = computed(() => props.mode === 'notion' || props.themePreset === 'notion')

// ===== Preview Mode =====
const isPreviewMode = computed(() => props.previewMode)

const emit = defineEmits<{
  update: [content: any]
  'update:modelValue': [value: string | object]
  collaboratorsChange: [count: number]
  collaboratorsListChange: [users: Array<{ id: string | number; name: string; color: string }>]
}>()

// ===== Basic State =====
const editor = shallowRef<Editor | null>(null)
const editorError = ref<string | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const dragHandleMenuRef = ref<InstanceType<typeof DragHandleMenu> | null>(null)
const slashCommandMenuRef = ref<InstanceType<typeof SlashCommandMenu> | null>(null)
const totalPages = ref(1)
const zoomLevel = ref(100)
const isFirstInit = ref(true)
const isInitializing = ref(false)

const editorInstance = computed(() => editor.value as Editor)

// ===== User Info Retrieval =====
const userStore = useUserStore()

/**
 * Get user info
 */
const getUserInfo = (): { id: string | number; name: string } => {
  try {
    const userInfo = userStore.userInfo
    if (userInfo) {
      const id = userInfo.userId || (userInfo as any).id || (userInfo as any).user_id || 'anonymous'
      const name = userInfo.realName || userInfo.userName || (userInfo as any).name || (userInfo as any).real_name || (userInfo as any).username || t('editor.anonymousUser')
      return { id, name }
    }
  } catch {}
  return { id: 'anonymous', name: t('editor.anonymousUser') }
}

// ===== Collaboration (using Composable) =====
const collaboration = useCollaboration({
  getUserInfo,
  onCollaboratorsChange: (count) => emit('collaboratorsChange', count),
  onCollaboratorsListChange: (users) => emit('collaboratorsListChange', users),
})

// Collaboration toggle state (for UI binding)
const collaborationEnabled = ref(false)

/**
 * Sync collaborator count to editor.storage (for extension reading)
 * - `FormatPainter` extension reads `editor.storage.__collaborationUsersCount` to decide whether to disable with multiple users
 */
watch(
  () => [editor.value, collaboration.collaboratorsCount.value] as const,
  ([e, count]) => {
    if (!e) return
    try {
      ;(e as any).storage.__collaborationUsersCount = count
    } catch {}
  },
  { immediate: true }
)

/**
 * Get feature config value
 */
const getFeatureConfig = (featureName: 'headerNav' | 'footerNav' | 'collaboration'): boolean => {
  if (props.features?.[featureName] !== undefined) {
    return props.features[featureName] as boolean
  }
  if (props.versionConfig?.features?.[featureName] !== undefined) {
    return props.versionConfig.features[featureName] as boolean
  }
  return false
}

// ===== Feature Display Control =====
const shouldShowHeaderNav = computed(() => getFeatureConfig('headerNav'))
const shouldShowFooterNav = computed(() => getFeatureConfig('footerNav'))

// Collaboration requires env var VITE_COLLABORATION_WS_URL
const collaborationWsUrl = computed(() => import.meta.env?.VITE_COLLABORATION_WS_URL || '')

// Whether collaboration feature is enabled (features.collaboration)
const isCollaborationFeatureEnabled = computed(() => getFeatureConfig('collaboration'))

// Check and warn: if collaboration is enabled but WS URL is not configured
const shouldShowCollaboration = computed(() => {
  if (isCollaborationFeatureEnabled.value && !collaborationWsUrl.value) {
    console.warn('[Tiptap UI Kit] Collaboration feature enabled but VITE_COLLABORATION_WS_URL is not configured in .env')
    return false
  }
  return isCollaborationFeatureEnabled.value && !!collaborationWsUrl.value
})

/**
 * Check if collaboration feature is available
 */
const isCollaborationAvailable = computed(() => {
  return collaborationEnabled.value && shouldShowCollaboration.value && !!props.documentId
})

// ===== Collaboration Toggle Handler =====
const handleCollaborationChange = async (enabled: boolean) => {
  if (collaborationEnabled.value !== enabled) {
    collaborationEnabled.value = enabled
  }
}

// Watch shouldShowCollaboration changes, sync to collaborationEnabled
watch(
  () => shouldShowCollaboration.value,
  (newValue) => {
    if (collaborationEnabled.value !== newValue) {
      collaborationEnabled.value = newValue
    }
  },
  { immediate: true }
)

// Watch collaborationEnabled changes, reinitialize editor
watch(
  () => collaborationEnabled.value,
  async (newValue, oldValue) => {
    if (oldValue === undefined) return
    if (newValue !== oldValue && editor.value && !isInitializing.value) {
      await initEditor()
    }
  }
)

// ===== Toolbar Configuration =====
const toolbarConfig = computed<ToolbarToolsConfig>(() => {
  // In collaboration mode, disable undo/redo and format painter buttons when there are two or more users
  // Not disabled for a single user, keeping a normal experience
  const disableUndoRedo = isCollaborationAvailable.value && collaboration.collaboratorsCount.value > 1
  
  switch (props.version) {
    case 'advanced':
    case 'premium':
      return {
        ...ADVANCED_TOOLBAR_CONFIG,
        codeBlock: true,
        link: true,
        table: true,
        font: true,
        lineHeight: true,
        clearFormat: true,
        undoRedo: true,
        undoRedoDisabled: disableUndoRedo,
        subscriptSuperscript: true,
        formatPainter: true,
        formatPainterDisabled: disableUndoRedo,
      }
    case 'basic':
    default:
      return {
        ...BASIC_TOOLBAR_CONFIG,
        undoRedo: true,
        undoRedoDisabled: disableUndoRedo,
      }
  }
})

// AI document assistant: only available in tiers that load AI extensions (advanced/premium);
// versionConfig.features.ai and features.aiChat can both be explicitly disabled; hidden in preview/readonly mode
const aiChatEnabled = computed(
  () =>
    (props.version === 'advanced' || props.version === 'premium') &&
    props.versionConfig?.features?.ai !== false &&
    props.features?.aiChat !== false &&
    !isPreviewMode.value &&
    !props.readonly
)

// ===== Internationalization =====
// Use locale from props instead of @vben/locales
// When locale is not passed, auto-detect by browser language (zh -> zh-CN/zh-TW, others -> en-US)
const currentLocale = computed(() => props.locale || detectDefaultLocale())

const mapLocaleToTiptapLocale = (locale: string): LocaleCode => {
  const localeMap: Record<string, LocaleCode> = {
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW',
    'zh-HK': 'zh-TW',
    'en-US': 'en-US',
    'en': 'en-US',
  }
  if (localeMap[locale]) return localeMap[locale]
  if (locale.startsWith('zh')) return locale.includes('TW') || locale.includes('HK') ? 'zh-TW' : 'zh-CN'
  if (locale.startsWith('en')) return 'en-US'
  return 'zh-CN'
}

const initTiptapI18n = () => {
  const tiptapLocale = mapLocaleToTiptapLocale(currentLocale.value)
  createI18n({ locale: tiptapLocale, fallbackLocale: 'en-US' })
}

initTiptapI18n()

watch(
  () => currentLocale.value,
  (newLocale) => {
    const tiptapLocale = mapLocaleToTiptapLocale(newLocale)
    const tiptapI18n = useTiptapI18n()
    tiptapI18n.setLocale(tiptapLocale)
  },
  { immediate: false }
)

// ===== Page Calculation =====
const calculatePages = () => {
  nextTick(() => {
    const proseMirrorEl = containerRef.value?.querySelector('.ProseMirror')
    if (!proseMirrorEl) return

    const style = getComputedStyle(proseMirrorEl as Element)
    const paddingTop = parseFloat(style.paddingTop) || 0
    const paddingBottom = parseFloat(style.paddingBottom) || 0
    const contentHeight = proseMirrorEl.scrollHeight - (paddingTop + paddingBottom)
    const pageContentHeight = A4_HEIGHT_PX - (paddingTop + paddingBottom)
    const pages = Math.ceil(contentHeight / pageContentHeight)
    totalPages.value = Math.max(pages, 1)
  })
}

// Pagination calculation: debounce + requestAnimationFrame frame coalescing, avoiding frequent forced reflows while typing
// (The first pagination calculation after editor initialization still calls calculatePages directly, so the first screen doesn't jump)
let pagesRafId: number | null = null
const schedulePageCalculation = debounce(() => {
  if (pagesRafId !== null) cancelAnimationFrame(pagesRafId)
  pagesRafId = requestAnimationFrame(() => {
    pagesRafId = null
    calculatePages()
  })
}, 200)

// update event debounced dispatch (getJSON full-text serialization is expensive)
const emitUpdateDebounced = debounce((editorInst: CoreEditor) => {
  if (editorInst.isDestroyed) return
  emit('update', editorInst.getJSON())
}, 200)

// ===== Editor Content Management =====
const getEditorContent = () => {
  try {
    return editor.value?.getJSON() ?? null
  } catch {
    return null
  }
}

const getInitialContent = (): any => {
  // Non-first initialization and collaboration not enabled: keep current content
  if (!isFirstInit.value && editor.value && !isCollaborationAvailable.value) {
    const currentContent = getEditorContent()
    if (currentContent) return currentContent
  }
  // Use collaboration module's normalizeContent (modelValue takes priority over initialContent)
  return normalizeContent(props.modelValue ?? props.initialContent, { silent: true })
}

// ===== v-model support =====
// Determine whether v-model is enabled by "whether an update:modelValue listener is bound":
// Using ref<string>() (initial undefined) bound to v-model is a common pattern, and cannot be judged via modelValue !== undefined
const hasModelValueListener = !!getCurrentInstance()?.vnode.props?.['onUpdate:modelValue']

// Record the most recently emitted value: short-circuit in O(1) on v-model loopback write, avoiding a second full-text serialization per keystroke
let lastEmittedModelValue: string | object | undefined

/**
 * Sync v-model (not debounced, v-model semantics require sync)
 * @description when modelValue is currently an object, output JSON, otherwise output HTML string
 */
const emitModelValue = (editorInst: CoreEditor) => {
  if (!hasModelValueListener) return
  const isObjectMode = typeof props.modelValue === 'object' && props.modelValue !== null
  const value = isObjectMode ? editorInst.getJSON() : editorInst.getHTML()
  lastEmittedModelValue = value
  emit('update:modelValue', value)
}

// Sync external modelValue changes to editor (first compare with current content to avoid v-model loop updates)
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue === undefined || !editor.value) return
    // The value we just emitted is written back by the parent component (v-model loopback), short-circuit directly
    if (newValue === lastEmittedModelValue) return
    // In collaboration mode content is managed by the Yjs shared document; external whole-content setContent would overwrite all collaborators' content
    if (isCollaborationAvailable.value) {
      console.warn('[TiptapProEditor] Ignoring external modelValue write while collaboration is active.')
      return
    }
    const isObjectMode = typeof newValue === 'object' && newValue !== null
    const isSame = isObjectMode
      ? JSON.stringify(editor.value.getJSON()) === JSON.stringify(newValue)
      : editor.value.getHTML() === newValue
    if (!isSame) {
      editor.value.commands.setContent(newValue as any, { emitUpdate: false })
      schedulePageCalculation()
    }
  }
)

// ===== Collaboration Feature Initialization (using useCollaboration) =====
const initCollaborationFeature = async (initialContent: any, extensions: any[]) => {
  if (!isCollaborationAvailable.value) {
    collaboration.disable()
    return
  }

  try {
    // If a collaboration instance already exists, destroy it first
    if (collaboration.instance.value) {
      collaboration.disable()
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Use useCollaboration's initWithExtensions method
    // This automatically handles state updates (collaboratorsCount, collaboratorsList)
    const collabExtensions = await collaboration.initWithExtensions({
      documentId: props.documentId!,
      readonly: props.readonly,
      initialContent,
      getUserInfo,
    })

    if (collabExtensions.length === 0) {
      return
    }

    // Add collaboration extensions
    extensions.push(...collabExtensions)
  } catch {}
}

// Note: the "transaction -> reactive" bridging of toolbar state is done by each subcomponent's useReactiveEditor (src/utils/editorState.ts)
// subscribing on its own; this component does not need (nor should it) do triggerRef broadcasting at the parent level.

// ===== Editor Initialization =====
const initEditor = async () => {
  if (isInitializing.value) return

  try {
    isInitializing.value = true

    const initialContentToUse = getInitialContent()

    if (isFirstInit.value) {
      isFirstInit.value = false
    }

    // Get extension configuration
    // History extension must be disabled in collaboration mode, because @tiptap/extension-collaboration has its own history management
    const enableImageResize = props.versionConfig?.features?.advanced !== false
    const extensions = getExtensionsByVersion(props.version, {
      enableImageResize,
      disableHistory: isCollaborationAvailable.value,
    })

    // Add drag handle extension
    if (props.features?.dragHandleMenu) {
      extensions.push(
        DragHandleWithMenuExtension.configure({
          onHandleClick: (event) => dragHandleMenuRef.value?.handleDragHandleClick(event),
        })
      )
    }

    // Add slash command extension
    if (props.features?.slashCommand) {
      extensions.push(
        SlashCommandExtension.configure({
          onActivate: (state: SlashCommandState) => slashCommandMenuRef.value?.activate(state),
          onDeactivate: () => slashCommandMenuRef.value?.hide(),
          onQueryChange: (query: string) => slashCommandMenuRef.value?.updateQuery(query),
        })
      )
    }

    // Initialize collaboration feature
    await initCollaborationFeature(initialContentToUse, extensions)

    // Destroy old editor (flush pending update first, to avoid losing input from the last 200ms)
    if (editor.value) {
      emitUpdateDebounced.flush()
      editor.value.destroy()
      editor.value = null
    }

    await nextTick()

    // Don't set initial content in collaboration mode
    const shouldSetContentOnInit = !isCollaborationAvailable.value

    // Create editor (also non-editable in preview mode)
    editor.value = new Editor({
      editable: !props.readonly && !isPreviewMode.value,
      extensions,
      content: shouldSetContentOnInit ? initialContentToUse : undefined,
      editorProps: {
        attributes: { class: 'word-editor-content' },
      },
      onUpdate: ({ editor }) => {
        schedulePageCalculation()
        // v-model sync is not debounced, update event is dispatched debounced
        emitModelValue(editor)
        emitUpdateDebounced(editor)
      },
    })

    await nextTick()

    // Update editor reference in collaboration instance
    if (collaboration.instance.value && editor.value) {
      collaboration.setEditor(editor.value)
    }

    // Initialize CSS variables
    if (containerRef.value) {
      containerRef.value.style.setProperty('--a4-width-px', `${A4_WIDTH_PX}px`)
      containerRef.value.style.setProperty('--padding-top-px', `${PAGE_PADDING_TOP_PX}px`)
      containerRef.value.style.setProperty('--padding-bottom-px', `${PAGE_PADDING_BOTTOM_PX}px`)
      containerRef.value.style.setProperty('--page-content-height-px', `${PAGE_CONTENT_HEIGHT_PX}px`)
    }

    calculatePages()
    // Observe content element dimensions: height changes caused by fonts/images/async NodeView loading all trigger page recalculation
    observeContentResize()
  } catch (error) {
    console.error('[TiptapProEditor] Editor initialization failed:', error)
    editorError.value = t('editor.initFailed')
  } finally {
    isInitializing.value = false
  }
}

// ===== Cleanup =====
const destroyEditor = async () => {
  collaboration.disable()
  if (editor.value) {
    // Flush pending update first, to avoid losing input from the last 200ms (for autosave scenarios)
    emitUpdateDebounced.flush()
    editor.value.destroy()
    editor.value = null
  }
}

// ===== Lifecycle =====
// Observe size changes of "content element + outer container" to recompute pages:
// content element (.ProseMirror) covers font/image loading and height changes from async NodeView;
// outer container covers layout scenarios like window resize and editor becoming visible from a hidden container
let containerResizeObserver: ResizeObserver | null = null

const observeContentResize = () => {
  if (typeof ResizeObserver === 'undefined') return
  if (!containerResizeObserver) {
    containerResizeObserver = new ResizeObserver(() => {
      schedulePageCalculation()
    })
  } else {
    containerResizeObserver.disconnect()
  }
  if (containerRef.value) containerResizeObserver.observe(containerRef.value)
  const contentDom = editor.value?.view?.dom
  if (contentDom) containerResizeObserver.observe(contentDom)
}

onMounted(async () => {
  await initEditor()
  // Content height changes after fonts finish loading; correct the page count once more after ready
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    document.fonts.ready.then(() => schedulePageCalculation()).catch(() => {})
  }
})

onBeforeUnmount(async () => {
  containerResizeObserver?.disconnect()
  containerResizeObserver = null
  // Drop pagination calculation directly; update event is flushed in destroyEditor (doesn't lose the last 200ms of input)
  schedulePageCalculation.cancel()
  if (pagesRafId !== null) {
    cancelAnimationFrame(pagesRafId)
    pagesRafId = null
  }
  await destroyEditor()
})

// ===== Prop Watchers =====
const watchAndReinit = (
  getter: () => any,
  shouldReinit: (newValue: any, oldValue: any) => boolean = (newVal, oldVal) => newVal !== oldVal
) => {
  watch(
    getter,
    async (newValue, oldValue) => {
      if (oldValue === undefined || !editor.value || isInitializing.value) return
      if (shouldReinit(newValue, oldValue)) {
        await nextTick()
        await initEditor()
      }
    }
  )
}

watchAndReinit(
  () => props.features?.dragHandleMenu,
  (newVal, oldVal) => (newVal ?? false) !== (oldVal ?? false)
)

watchAndReinit(
  () => props.features?.slashCommand,
  (newVal, oldVal) => (newVal ?? false) !== (oldVal ?? false)
)

watchAndReinit(
  () => props.documentId,
  (newId, oldId) => shouldShowCollaboration.value && newId !== oldId
)

// ===== Exposed Methods =====
defineExpose({
  getEditor: () => editor.value,
  getJSON: () => editor.value?.getJSON() || null,
  getHTML: () => editor.value?.getHTML() || '',
  getText: () => editor.value?.getText() || '',
})
</script>
