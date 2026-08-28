<template>
  <teleport to="body">
    <!-- Drag handle menu -->
    <div
      v-if="isMenuVisible"
      ref="menuRef"
      class="drag-handle-menu"
      :style="menuStyle"
      @mouseenter="cancelHideMenu"
      @mouseleave="scheduleHideMenu"
      @click.stop
    >
      <!-- Top compact toolbar (icon buttons) -->
      <div class="inline-toolbar">
        <!-- Heading levels -->
        <div class="inline-group">
          <button
            v-for="heading in headings"
            :key="heading.level"
            class="icon-btn heading-btn"
            :class="{ active: isHeadingActive(heading.level) }"
            @click="heading.action"
            :data-level="heading.level"
            :title="heading.title"
          >
            H{{ heading.level }}
          </button>
        </div>
        <!-- Text formatting -->
        <div class="inline-group">
          <button
            v-for="format in textFormats"
            :key="format.name"
            class="icon-btn"
            :class="{ active: isActive(format.name) }"
            @click="format.action"
            :title="format.title"
          >
            <component :is="format.icon" />
          </button>
        </div>
        <!-- Lists -->
        <div class="inline-group">
          <button
            v-for="item in listItems"
            :key="item.name"
            class="icon-btn"
            :class="{ active: isActive(item.name) }"
            @click="item.action"
            :title="item.title"
          >
            <component :is="item.icon" />
          </button>
        </div>
      </div>

      <!-- Expandable group: Indent & Alignment -->
      <div class="menu-section compact">
        <button class="menu-item" @click="toggleIndentAlignPanel">
          <AlignLeftOutlined class="menu-item-icon" />
          <span class="menu-item-label">{{ t('editor.indentAndAlign') }}</span>
          <span class="menu-item-chevron">›</span>
        </button>
        <div v-if="indentAlignOpen" class="sub-panel">
          <div class="sub-group">
            <button class="icon-btn" :class="{ active: isActiveAlign('left') }" @click="setAlign('left')" :title="t('editor.alignLeft')">
              <AlignLeftOutlined />
            </button>
            <button class="icon-btn" :class="{ active: isActiveAlign('center') }" @click="setAlign('center')" :title="t('editor.alignCenter')">
              <AlignCenterOutlined />
            </button>
            <button class="icon-btn" :class="{ active: isActiveAlign('right') }" @click="setAlign('right')" :title="t('editor.alignRight')">
              <AlignRightOutlined />
            </button>
          </div>
          <div class="sub-group">
            <button class="icon-btn" @click="indentList" :title="t('editor.indent')">
              <MenuUnfoldOutlined />
            </button>
            <button class="icon-btn" @click="outdentList" :title="t('editor.outdent')">
              <MenuFoldOutlined />
            </button>
          </div>
        </div>
      </div>

      <!-- Expandable group: Colors -->
      <div class="menu-section compact">
        <button class="menu-item" @click="toggleColorPanel('text')">
          <FontColorsOutlined class="menu-item-icon" />
          <span class="menu-item-label">{{ t('editor.colors') }}</span>
          <span class="menu-item-chevron">›</span>
        </button>

        <div v-if="colorPanelType" class="color-picker-panel">
          <div class="color-picker-grid">
            <div
              v-for="c in COLORS"
              :key="c"
              class="color-picker-item"
              :style="{ background: c }"
              @click="applyColor(c)"
            />
          </div>
          <div class="sub-actions">
            <button class="mini-btn" @click="setColorMode('text')">{{ t('editor.text') }}</button>
            <button class="mini-btn" @click="setColorMode('highlight')">{{ t('editor.highlight') }}</button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="menu-section">
        <div class="menu-section-title">{{ t('editor.actions') }}</div>
        <button
          v-for="action in editActions"
          :key="action.title"
          class="menu-item"
          :class="{ 'menu-item-danger': action.danger }"
          @click="action.action"
        >
          <component :is="action.icon" class="menu-item-icon" />
          <span class="menu-item-label">{{ action.title }}</span>
        </button>
      </div>
    </div>

    <!-- Overlay -->
    <div v-if="isMenuVisible" class="drag-handle-menu-backdrop" @click="hideMenu" />
  </teleport>
</template>

<script setup lang="ts">
/**
 * DragHandleMenu - Drag handle menu component
 * @description UI component providing 6-dot handle and menu operations
 * @features
 * - Click 6-dot icon to display action menu
 * - Supports headings, text format, lists, alignment, colors
 * - Supports cut, copy, delete edit actions
 * - Auto-positions menu to prevent screen overflow
 */
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { t } from '@/locales'
import type { Editor } from '@tiptap/core'
import type { DragHandleClickEvent } from './DragHandleWithMenuExtension'
import {
  COLORS,
  createMenuConfig,
  createEditActions,
} from './dragHandleMenuConfig'
import type { HeadingMenuItem } from './dragHandleMenuConfig'

// Import helper functions
import { createStateCheckers, useReactiveEditor } from '@/utils/editorState'
import { createCommandRunner, type EditorChain } from '@/utils/editorCommands'
import { selectNodeContent as selectNodeContentUtil } from '@/utils/clipboard'

// Ant Design icons
import {
  FontColorsOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons-vue'

// Import styles
import '@/styles/drag-handle-with-menu.css'

// ============================================================================
// Define constants
// ============================================================================

const HIDE_MENU_DELAY = 160 // Menu hide delay (ms)
const POSITION_SAFE_MARGIN = 8 // Position safe margin
const POSITION_GAP = 12 // Menu to handle gap

// ============================================================================
// Props
// ============================================================================

const props = withDefaults(
  defineProps<{
    editor: Editor | null | undefined
    readonly?: boolean
    positionStrategy?: 'auto' | 'right' | 'left'
  }>(),
  {
    readonly: false,
    positionStrategy: 'auto',
  }
)


// ============================================================================
// Menu state management
// ============================================================================

interface MenuState {
  visible: boolean
  position: { x: number; y: number }
  nodePos: number
  nodeTo: number
  handleElement: HTMLElement | null
}

const menuState = ref<MenuState>({
  visible: false,
  position: { x: 0, y: 0 },
  nodePos: 0,
  nodeTo: 0,
  handleElement: null,
})

/**
 * Handle drag handle click event
 */
const handleDragHandleClick = (event: DragHandleClickEvent) => {
  menuState.value = {
    visible: true,
    position: event.position,
    nodePos: event.nodePos,
    nodeTo: event.nodeTo,
    handleElement: event.handleElement,
  }
}

/**
 * Hide menu
 */
const hideMenu = () => {
  if (menuState.value.handleElement) {
    menuState.value.handleElement.classList.remove('active')
  }
  menuState.value.visible = false
  menuState.value.handleElement = null
}

const isMenuVisible = computed(() => menuState.value.visible)
const menuPosition = computed(() => menuState.value.position)

// ============================================================================
// Other state
// ============================================================================

const menuRef = ref<HTMLElement | null>(null)
const colorPanelType = ref<'text' | 'highlight' | null>(null)
const indentAlignOpen = ref(false)
let hideTimer: number | null = null

// ============================================================================
// Computed properties
// ============================================================================

// Transaction reactive editor: isActive/isHeadingActive re-evaluate on cursor/content changes
const editor = useReactiveEditor(() => props.editor)

// Create state checkers
const { isActive, isHeadingActive, isActiveAlign } = createStateCheckers(editor)
// Command runners
const runCommand = createCommandRunner(editor)

const menuStyle = computed(() => ({
  position: 'fixed' as const,
  left: `${menuPosition.value.x}px`,
  top: `${menuPosition.value.y}px`,
  zIndex: 1002,
}))

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Clamp number within specified range
 */
function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}

/**
 * Update menu position
 * @description Automatically adjusts menu position based on handle position and screen size to prevent overflow
 */
function updateMenuPosition(): void {
  const handle = menuState.value.handleElement
  const menuEl = menuRef.value
  if (!handle || !menuEl) return

  const handleRect = handle.getBoundingClientRect()
  const menuWidth = menuEl.offsetWidth
  const menuHeight = menuEl.offsetHeight
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Horizontal direction: determine position based on strategy
  let x: number
  if (props.positionStrategy === 'right') {
    x = handleRect.right + POSITION_GAP
  } else if (props.positionStrategy === 'left') {
    x = handleRect.left - menuWidth - POSITION_GAP
  } else {
    // auto: prefer right, fallback to left on overflow
    x = handleRect.right + POSITION_GAP
    if (x + menuWidth + POSITION_SAFE_MARGIN > viewportWidth) {
      x = handleRect.left - menuWidth - POSITION_GAP
    }
  }
  x = clamp(x, POSITION_SAFE_MARGIN, viewportWidth - menuWidth - POSITION_SAFE_MARGIN)

  // Vertical direction: prefer below handle, fallback to above on bottom overflow
  let y = handleRect.bottom + POSITION_GAP
  if (y + menuHeight + POSITION_SAFE_MARGIN > viewportHeight) {
    y = handleRect.top - menuHeight - POSITION_GAP
  }
  y = clamp(y, POSITION_SAFE_MARGIN, viewportHeight - menuHeight - POSITION_SAFE_MARGIN)

  menuState.value.position = { x, y }
}

/**
 * Schedule menu hide
 * @description Delayed menu hide, does not auto-close when child panels are expanded
 */
function scheduleHideMenu(): void {
  // Do not auto-close when child panels are expanded
  if (indentAlignOpen.value || colorPanelType.value) {
    return
  }
  const el = menuRef.value
  if (hideTimer) window.clearTimeout(hideTimer)
  if (el) el.classList.add('closing')
  hideTimer = window.setTimeout(() => {
    hideTimer = null
    hideMenu()
    if (el) el.classList.remove('closing')
  }, HIDE_MENU_DELAY)
}

/**
 * Cancel menu hide
 */
function cancelHideMenu(): void {
  const el = menuRef.value
  if (hideTimer) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }
  if (el) el.classList.remove('closing')
}

// ============================================================================
// Lifecycle and event listeners
// ============================================================================

/**
 * Reposition menu
 * @description Recalculate menu position on scroll or window resize
 */
function onReposition(): void {
  if (!menuState.value.visible) return
  updateMenuPosition()
}

// Measure and position after menu is shown
watch(isMenuVisible, async (visible) => {
  if (!visible) return
  await nextTick()
  updateMenuPosition()
})

// Watch menu visibility change to reset child panel state
watch(isMenuVisible, (visible) => {
  if (!visible) {
    colorPanelType.value = null
    indentAlignOpen.value = false
  }
})

/**
 * Auto-hide menu when editor updates
 */
function handleEditorUpdate(): void {
  if (menuState.value.visible) {
    hideMenu()
  }
}

onMounted(() => {
  // Listen to scroll and resize to auto-adjust menu position
  window.addEventListener('scroll', onReposition, true)
  window.addEventListener('resize', onReposition, true)

  // Listen to editor changes to auto-hide menu
  if (editor.value) {
    editor.value.on('update', handleEditorUpdate)
    editor.value.on('selectionUpdate', handleEditorUpdate)
  }
})

onUnmounted(() => {
  // Clean up event listeners
  window.removeEventListener('scroll', onReposition, true)
  window.removeEventListener('resize', onReposition, true)

  // Clean up editor event listeners
  if (editor.value) {
    editor.value.off('update', handleEditorUpdate)
    editor.value.off('selectionUpdate', handleEditorUpdate)
  }

  // Clean up timer
  if (hideTimer) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }

  // Hide menu
  hideMenu()
})

// ============================================================================
// Menu config (using imported factory function)
// ============================================================================

const menuConfig = computed(() => {
  if (!editor.value) return null
  return createMenuConfig(editor.value, menuState.value.nodePos, menuState.value.nodeTo, hideMenu, t)
})

const editActions = computed(() => {
  if (!editor.value) return []
  return createEditActions(editor.value, menuState.value.nodePos, menuState.value.nodeTo, hideMenu, t)
})

const headings = computed<HeadingMenuItem[]>(() => menuConfig.value?.headings ?? [])
const textFormats = computed(() => menuConfig.value?.textFormats ?? [])
const listItems = computed(() => menuConfig.value?.listItems ?? [])

// ============================================================================
// Menu action functions
// ============================================================================

/**
 * Select node content
 */
const selectNodeContent = (from: number, to: number): void => {
  const e = editor.value
  if (!e) return
  selectNodeContentUtil(e, from, to)
}

// ============================================================================
// Color operations
// ============================================================================

/**
 * Toggle color panel
 */
const toggleColorPanel = (type: 'text' | 'highlight'): void => {
  colorPanelType.value = colorPanelType.value === type ? null : type
}

/**
 * Set color mode
 */
const setColorMode = (mode: 'text' | 'highlight'): void => {
  colorPanelType.value = mode
}

/**
 * Apply color
 */
const applyColor = (color: string): void => {
  selectNodeContent(menuState.value.nodePos, menuState.value.nodeTo)

  if (colorPanelType.value === 'text') {
    // @ts-ignore - setColor dynamically added by Color extension
    runCommand((chain: EditorChain) => chain.setColor(color))()
  } else if (colorPanelType.value === 'highlight') {
    // @ts-ignore - setHighlight dynamically added by Highlight extension
    runCommand((chain: EditorChain) => chain.setHighlight({ color }))()
  }

  colorPanelType.value = null
  hideMenu()
}

// ============================================================================
// Indent & alignment operations
// ============================================================================

/**
 * Toggle indent & alignment panel
 */
const toggleIndentAlignPanel = (): void => {
  indentAlignOpen.value = !indentAlignOpen.value
}

/**
 * Set text alignment
 */
const setAlign = (align: 'left' | 'center' | 'right'): void => {
  selectNodeContent(menuState.value.nodePos, menuState.value.nodeTo)
  runCommand((chain: EditorChain) => chain.setTextAlign(align))()
}

/**
 * Increase list indent
 */
const indentList = (): void => {
  runCommand((chain) => chain.sinkListItem('listItem'))()
}

/**
 * Decrease list indent
 */
const outdentList = (): void => {
  runCommand((chain) => chain.liftListItem('listItem'))()
}


// ============================================================================
// Expose methods
// ============================================================================

defineExpose({
  handleDragHandleClick,
})
</script>

