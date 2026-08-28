<template>
  <teleport to="body">
    <div
      v-if="isVisible"
      ref="menuRef"
      class="slash-command-menu"
      :style="menuStyle"
      @mousedown.prevent
    >
      <!-- Search results -->
      <div v-if="filteredGroups.length > 0" class="slash-command-list">
        <template v-for="group in filteredGroups" :key="group.title">
          <div class="slash-command-group-title">{{ group.title }}</div>
          <button
            v-for="(item, itemIdx) in group.items"
            :key="item.id"
            class="slash-command-item"
            :class="{ active: isFlatIndex(group, itemIdx) === selectedIndex }"
            @click="selectItem(item)"
            @mouseenter="selectedIndex = isFlatIndex(group, itemIdx)"
          >
            <span class="slash-command-item-icon">
              <component :is="item.icon" />
            </span>
            <span class="slash-command-item-content">
              <span class="slash-command-item-title">{{ item.title }}</span>
              <span class="slash-command-item-desc">{{ item.description }}</span>
            </span>
          </button>
        </template>
      </div>

      <!-- No results -->
      <div v-else class="slash-command-empty">
        {{ t('slashCommand.noResults') }}
      </div>
    </div>

    <!-- Backdrop -->
    <div v-if="isVisible" class="slash-command-backdrop" @mousedown="hide" />
  </teleport>
</template>

<script setup lang="ts">
/**
 * SlashCommandMenu - Slash command menu component
 * @description Block type selection menu that appears when typing /
 */
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { Editor } from '@tiptap/core'
import { t } from '@/locales'
import { slashCommandKey, type SlashCommandState } from './SlashCommandExtension'
import {
  FileTextOutlined,
  FontSizeOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  CheckSquareOutlined,
  LineOutlined,
  CodeOutlined,
  TableOutlined,
  PictureOutlined,
  MinusOutlined,
  BulbOutlined,
  CaretRightOutlined,
  PaperClipOutlined,
  FileOutlined,
} from '@ant-design/icons-vue'

// ============================================================================
// Types
import {
  registeredGroups,
  type SlashCommandItem,
  type SlashCommandGroup,
} from './slashCommandRegistry'

export type { SlashCommandItem, SlashCommandGroup }

// ============================================================================
// Props
// ============================================================================

const props = defineProps<{
  editor: Editor | null | undefined
  customSlashCommands?: Array<SlashCommandGroup | SlashCommandItem>
  transformSlashCommands?: (groups: SlashCommandGroup[]) => SlashCommandGroup[]
}>()

// ============================================================================
// State
// ============================================================================

const isVisible = ref(false)
const position = ref({ x: 0, y: 0 })
const query = ref('')
const selectedIndex = ref(0)
const menuRef = ref<HTMLElement | null>(null)

// ============================================================================
// Menu Items
// ============================================================================

const defaultCommandGroups = computed<SlashCommandGroup[]>(() => [
  {
    title: t('slashCommand.basicBlocks'),
    items: [
      {
        id: 'paragraph',
        title: t('slashCommand.paragraph'),
        description: t('slashCommand.paragraphDesc'),
        icon: FileTextOutlined,
        keywords: ['paragraph', 'text', 'plain', 'body', 'paragraph', 'p'],
        action: (editor: Editor) => {
          editor.chain().focus().setParagraph().run()
        },
      },
      {
        id: 'heading1',
        title: t('slashCommand.heading1'),
        description: t('slashCommand.heading1Desc'),
        icon: FontSizeOutlined,
        keywords: ['heading', 'h1', 'heading', 'h1', 'title'],
        action: (editor: Editor) => {
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        },
      },
      {
        id: 'heading2',
        title: t('slashCommand.heading2'),
        description: t('slashCommand.heading2Desc'),
        icon: FontSizeOutlined,
        keywords: ['heading', 'h2', 'heading', 'h2', 'subtitle'],
        action: (editor: Editor) => {
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        },
      },
      {
        id: 'heading3',
        title: t('slashCommand.heading3'),
        description: t('slashCommand.heading3Desc'),
        icon: FontSizeOutlined,
        keywords: ['heading', 'h3', 'heading', 'h3'],
        action: (editor: Editor) => {
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        },
      },
    ],
  },
  {
    title: t('slashCommand.lists'),
    items: [
      {
        id: 'bulletList',
        title: t('slashCommand.bulletList'),
        description: t('slashCommand.bulletListDesc'),
        icon: UnorderedListOutlined,
        keywords: ['bullet', 'list', 'unordered', 'bullet-list', 'list', 'ul'],
        action: (editor: Editor) => {
          editor.chain().focus().toggleBulletList().run()
        },
      },
      {
        id: 'orderedList',
        title: t('slashCommand.orderedList'),
        description: t('slashCommand.orderedListDesc'),
        icon: OrderedListOutlined,
        keywords: ['ordered', 'list', 'number', 'ordered-list', 'number-list', 'ol'],
        action: (editor: Editor) => {
          editor.chain().focus().toggleOrderedList().run()
        },
      },
      {
        id: 'taskList',
        title: t('slashCommand.taskList'),
        description: t('slashCommand.taskListDesc'),
        icon: CheckSquareOutlined,
        keywords: ['task', 'todo', 'checklist', 'task-list', 'todo', 'checkbox'],
        action: (editor: Editor) => {
          editor.chain().focus().toggleTaskList().run()
        },
      },
    ],
  },
  {
    title: t('slashCommand.advanced'),
    items: [
      {
        id: 'blockquote',
        title: t('slashCommand.blockquote'),
        description: t('slashCommand.blockquoteDesc'),
        icon: LineOutlined,
        keywords: ['quote', 'blockquote', 'quote', 'citation', 'citation'],
        action: (editor: Editor) => {
          editor.chain().focus().toggleBlockquote().run()
        },
      },
      {
        id: 'codeBlock',
        title: t('slashCommand.codeBlock'),
        description: t('slashCommand.codeBlockDesc'),
        icon: CodeOutlined,
        keywords: ['code', 'block', 'codeblock', 'code', 'pre'],
        action: (editor: Editor) => {
          editor.chain().focus().toggleCodeBlock().run()
        },
      },
      {
        id: 'table',
        title: t('slashCommand.table'),
        description: t('slashCommand.tableDesc'),
        icon: TableOutlined,
        keywords: ['table', 'table', 'grid'],
        action: (editor: Editor) => {
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        },
      },
      {
        id: 'image',
        title: t('slashCommand.image'),
        description: t('slashCommand.imageDesc'),
        icon: PictureOutlined,
        keywords: ['image', 'picture', 'image', 'photo', 'img', 'photo'],
        action: (editor: Editor) => {
          // Insert image placeholder
          const url = window.prompt(t('slashCommand.imageUrlPrompt') || 'Enter image URL')
          if (url) {
            editor.chain().focus().setImage({ src: url }).run()
          }
        },
      },
      {
        id: 'callout',
        title: t('slashCommand.callout') || 'Callout',
        description: t('slashCommand.calloutDesc') || 'Colored callout box with icon',
        icon: BulbOutlined,
        keywords: ['callout', 'box', 'highlight', 'info', 'warning', 'notice', 'callout'],
        action: (editor: Editor) => {
          editor.chain().focus().setCallout({ icon: '💡', color: 'blue' }).run()
        },
      },
      {
        id: 'toggleItem',
        title: t('slashCommand.toggleItem') || 'Toggle List',
        description: t('slashCommand.toggleItemDesc') || 'Collapsible toggle list block',
        icon: CaretRightOutlined,
        keywords: ['toggle', 'details', 'collapse', 'expand', 'toggle'],
        action: (editor: Editor) => {
          editor.chain().focus().setToggleItem().run()
        },
      },
      {
        id: 'fileAttachment',
        title: t('slashCommand.fileAttachment') || 'File Attachment',
        description: t('slashCommand.fileAttachmentDesc') || 'Attach a downloadable file block',
        icon: PaperClipOutlined,
        keywords: ['file', 'attachment', 'upload', 'pdf', 'doc', 'download'],
        action: (editor: Editor) => {
          const url = window.prompt('Enter file URL:')
          if (url) {
            const name = url.split('/').pop() || 'Document.pdf'
            // @ts-ignore
            editor.chain().focus().insertFileAttachment({ fileName: name, fileUrl: url }).run()
          }
        },
      },
      {
        id: 'subpage',
        title: t('slashCommand.subpage') || 'Subpage Link',
        description: t('slashCommand.subpageDesc') || 'Link to another document or nested page',
        icon: FileOutlined,
        keywords: ['subpage', 'page', 'doc', 'link', 'nested'],
        action: (editor: Editor) => {
          const title = window.prompt('Enter Subpage Title:') || 'Untitled Subpage'
          // @ts-ignore
          editor.chain().focus().insertSubpage({ title }).run()
        },
      },
      {
        id: 'horizontalRule',
        title: t('slashCommand.horizontalRule'),
        description: t('slashCommand.horizontalRuleDesc'),
        icon: MinusOutlined,
        keywords: ['divider', 'hr', 'horizontal', 'rule', 'divider', 'hr'],
        action: (editor: Editor) => {
          editor.chain().focus().setHorizontalRule().run()
        },
      },
    ],
  },
])

const commandGroups = computed<SlashCommandGroup[]>(() => {
  const merged: SlashCommandGroup[] = defaultCommandGroups.value.map(g => ({
    ...g,
    items: [...g.items],
  }))

  // Merge registeredGroups from slashCommandRegistry
  for (const regGroup of registeredGroups.value) {
    const existingIdx = merged.findIndex(g => g.title === regGroup.title)
    if (existingIdx >= 0) {
      const existingItems = merged[existingIdx]!.items
      const newItems = regGroup.items.filter(item => !existingItems.some(i => i.id === item.id))
      existingItems.push(...newItems)
    } else {
      merged.push({ ...regGroup, items: [...regGroup.items] })
    }
  }

  // Merge customSlashCommands passed via props
  if (props.customSlashCommands) {
    for (const entry of props.customSlashCommands) {
      if ('items' in entry) {
        const existingIdx = merged.findIndex(g => g.title === entry.title)
        if (existingIdx >= 0) {
          const existingItems = merged[existingIdx]!.items
          const newItems = entry.items.filter(item => !existingItems.some(i => i.id === item.id))
          existingItems.push(...newItems)
        } else {
          merged.push({ ...entry, items: [...entry.items] })
        }
      } else {
        const customGroupTitle = 'Custom'
        const existingIdx = merged.findIndex(g => g.title === customGroupTitle)
        if (existingIdx >= 0) {
          if (!merged[existingIdx]!.items.some(i => i.id === entry.id)) {
            merged[existingIdx]!.items.push(entry)
          }
        } else {
          merged.push({ title: customGroupTitle, items: [entry] })
        }
      }
    }
  }

  if (props.transformSlashCommands) {
    return props.transformSlashCommands(merged)
  }

  return merged
})

// ============================================================================
// Computed
// ============================================================================

const filteredGroups = computed<SlashCommandGroup[]>(() => {
  const q = query.value.toLowerCase()
  if (!q) return commandGroups.value

  return commandGroups.value
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.keywords.some((kw) => kw.toLowerCase().includes(q))
      ),
    }))
    .filter((group) => group.items.length > 0)
})

const flatItems = computed(() => {
  return filteredGroups.value.flatMap((group) => group.items)
})

const menuStyle = computed(() => ({
  position: 'fixed' as const,
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  zIndex: 1002,
}))

// ============================================================================
// Methods
// ============================================================================

/**
 * Calculate the flat index of an item in flatItems
 */
function isFlatIndex(group: SlashCommandGroup, itemIdx: number): number {
  let idx = 0
  for (const g of filteredGroups.value) {
    if (g === group) return idx + itemIdx
    idx += g.items.length
  }
  return idx + itemIdx
}

/**
 * Select menu item and execute corresponding action
 */
function selectItem(item: SlashCommandItem) {
  const editor = props.editor
  if (!editor) return

  // First delete / and the following query text
  const pluginState = slashCommandKey.getState(editor.state) as SlashCommandState | undefined
  if (pluginState?.range) {
    editor.chain().focus().deleteRange(pluginState.range).run()
  }

  // Execute command
  item.action(editor)
  hide()
}

/**
 * Activate menu
 */
function activate(state: SlashCommandState) {
  if (!state.decorationPosition) return
  position.value = { x: state.decorationPosition.x, y: state.decorationPosition.y + 4 }
  query.value = state.query
  isVisible.value = true
  selectedIndex.value = 0

  nextTick(() => {
    adjustPosition()
  })
}

/**
 * Hide menu
 */
function hide() {
  if (!isVisible.value) return
  isVisible.value = false
  query.value = ''
  selectedIndex.value = 0

  // Close via plugin meta
  const editor = props.editor
  if (editor) {
    const { tr } = editor.state
    tr.setMeta(slashCommandKey, { deactivate: true })
    editor.view.dispatch(tr)
  }
}

/**
 * Update query
 */
function updateQuery(newQuery: string) {
  query.value = newQuery
  selectedIndex.value = 0
}

/**
 * Adjust menu position to avoid overflow
 */
function adjustPosition() {
  const el = menuRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const margin = 8

  let { x, y } = position.value

  // Right overflow
  if (x + rect.width + margin > viewportWidth) {
    x = viewportWidth - rect.width - margin
  }

  // Bottom overflow - move above cursor
  if (y + rect.height + margin > viewportHeight) {
    y = y - rect.height - 24 // Cursor height is approximately 24px
  }

  position.value = { x: Math.max(margin, x), y: Math.max(margin, y) }
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

function handleKeyDown(event: KeyboardEvent) {
  if (!isVisible.value) return

  const totalItems = flatItems.value.length
  if (totalItems === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = (selectedIndex.value + 1) % totalItems
      scrollToSelected()
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = (selectedIndex.value - 1 + totalItems) % totalItems
      scrollToSelected()
      break
    case 'Enter':
      event.preventDefault()
      if (flatItems.value[selectedIndex.value]) {
        selectItem(flatItems.value[selectedIndex.value])
      }
      break
    case 'Escape':
      event.preventDefault()
      hide()
      break
  }
}

function scrollToSelected() {
  nextTick(() => {
    const el = menuRef.value
    if (!el) return
    const activeItem = el.querySelector('.slash-command-item.active')
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' })
    }
  })
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown, true)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown, true)
})

// Watch query changes, reset selected item
watch(query, () => {
  selectedIndex.value = 0
})

// ============================================================================
// Expose
// ============================================================================

defineExpose({
  activate,
  hide,
  updateQuery,
  isVisible,
})
</script>
