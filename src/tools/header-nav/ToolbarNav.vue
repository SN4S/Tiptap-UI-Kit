<template>
  <div v-if="enabled" class="editor-toolbar-container">
    <div class="editor-toolbar">
      <!-- Left: Basic tools -->
      <div class="toolbar-left">
        <!-- Group 1: Undo/Redo -->
        <div v-if="config.undoRedo" class="tool-group">
          <UndoRedoButton :editor="editor" :disabled="config.undoRedoDisabled" />
        </div>

        <!-- Group 2: Format Painter -->
        <div v-if="config.formatPainter" class="tool-group">
          <FormatPainterButton :editor="editor" :disabled="config.formatPainterDisabled" />
        </div>

        <!-- Group 3: Clear Format -->
        <div v-if="config.clearFormat" class="tool-group">
          <ClearFormatButton :editor="editor" />
        </div>

        <!-- Group 4: Font tools -->
        <div v-if="config.font" class="tool-group">
          <FontFamilySelect :editor="editor" />
          <FontSizeSelect :editor="editor" />
        </div>

        <!-- Group 5: Text format (bold, italic, underline, strike, inline code) -->
        <div v-if="config.textFormat || config.codeBlock" class="tool-group">
          <TextFormatButtons :editor="editor" :show-code="config.codeBlock" />
        </div>

        <!-- Group 6: Color picker (text color, background color) -->
        <div v-if="config.colorPicker" class="tool-group">
          <ToolbarGroup>
            <ColorPicker
              :icon="FontColorsOutlined"
              type="text"
              :model-value="currentTextColor"
              :title="t('editor.textColor')"
              @select="setTextColor"
            />
            <ColorPicker
              :icon="HighlightOutlined"
              type="background"
              :model-value="currentBgColor"
              :title="t('editor.backgroundColor')"
              @select="setHighlight"
            />
          </ToolbarGroup>
        </div>

        <!-- Group 7: Heading & list tools -->
        <div v-if="config.heading || config.list" class="tool-group">
          <HeadingDropdown v-if="config.heading" :editor="editor" />
          <ListTools v-if="config.list" :editor="editor" :show-task-list="true" />
        </div>

        <!-- Group 8: Alignment tools -->
        <div v-if="config.align" class="tool-group">
          <AlignDropdown :editor="editor" />
        </div>

        <!-- Group 9: Link, Table, Image -->
        <div v-if="config.link || config.table || config.image" class="tool-group">
          <LinkButton v-if="config.link" :editor="editor" />
          <TableButton v-if="config.table" :editor="editor" />
          <ImageUpload v-if="config.image" :editor="editor" />
        </div>

        <!-- Group 10: Subscript/Superscript tools -->
        <div v-if="config.subscriptSuperscript" class="tool-group">
          <SubscriptSuperscriptButton :editor="editor" />
        </div>

        <!-- Group 11: Word import/export -->
        <div v-if="config.word" class="tool-group">
          <WordButton :editor="editor" />
        </div>

        <!-- Group 12: Templates & Gallery -->
        <div v-if="config.template || config.gallery" class="tool-group">
          <TemplateButton v-if="config.template" :editor="editor" />
          <GalleryButton v-if="config.gallery" :editor="editor" />
        </div>

        <!-- Group 13: AI tools -->
        <div v-if="config.ai && editor" class="tool-group">
          <AiMenuButton
            :editor="editor"
            :icon="ThunderboltOutlined"
            :label="t('editor.ai')"
            :title="t('editor.ai')"
          />
        </div>

        <!-- More tools can be extended via slots -->
        <slot name="extra" />
      </div>

      <!-- Right: Extra tools (e.g. Collaboration toggle) -->
      <div v-if="$slots.right" class="toolbar-right">
        <slot name="right" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ToolbarNav - Public Toolbar Navigation component
 * @description Configurable toolbar component supporting toggle of individual tools
 * @example
 * ```vue
 * <ToolbarNav :editor="editor" :config="{ textFormat: true, colorPicker: true }" />
 * <ToolbarNav :editor="editor" :enabled="false" /> // Disable toolbar
 * ```
 */
import { computed, ref, watch } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { ToolbarGroup } from '@/ui'
import { ColorPicker } from '@/features/basic/color'
import { TextFormatButtons } from '@/features/basic/text-format'
import { ListTools } from '@/features/basic/list'
import { HeadingDropdown } from '@/features/basic/heading'
import { AlignDropdown } from '@/features/basic/align'
import { ImageUpload } from '@/features/basic/image'

import { FontFamilySelect, FontSizeSelect } from '@/features/advanced/font'
import { ClearFormatButton } from '@/features/advanced/format-clear'
import { LinkButton } from '@/features/advanced/link'
import { TableButton } from '@/features/advanced/table'
import { SubscriptSuperscriptButton } from '@/features/advanced/subscript-superscript'
import { UndoRedoButton } from '@/features/advanced/undo-redo'
import { FormatPainterButton } from '@/features/advanced/format-painter'
import { WordButton } from '@/features/advanced/word'
import { TemplateButton } from '@/features/advanced/template'
import { GalleryButton } from '@/features/advanced/gallery'
import { AiMenuButton } from '@/ai'

import { createCommandRunner } from '@/utils/editorCommands'
import { useReactiveEditor } from '@/utils/editorState'
import { t } from '@/locales'
import type { ToolbarToolsConfig } from './toolbarConfig'
import { DEFAULT_TOOLBAR_CONFIG } from './toolbarConfig'
import {
  FontColorsOutlined,
  HighlightOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons-vue'

// ===== Props =====
interface Props {
  /** Editor instance */
  editor: Editor | null | undefined
  /** Toolbar config controlling tool visibility */
  config?: ToolbarToolsConfig
  /** Whether toolbar is enabled, default true */
  enabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  config: () => DEFAULT_TOOLBAR_CONFIG,
  enabled: true,
})

// Transaction reactive editor: colors re-evaluate on cursor change
const editor = useReactiveEditor(() => props.editor)

// ===== Merge configurations =====
const config = computed(() => {
  return {
    ...DEFAULT_TOOLBAR_CONFIG,
    ...props.config,
  }
})

// ===== Reactive state =====
const currentTextColor = ref<string>('#000000')
const currentBgColor = ref<string>('#ffffff')

// ===== Helper functions =====
/**
 * Standardize color values
 */
function normalizeColor(color: string | undefined): string {
  if (!color) return '#000000'
  const trimmed = color.trim()
  if (trimmed.startsWith('#')) {
    return trimmed.toLowerCase()
  }
  return trimmed.toLowerCase()
}

/**
 * Command runner
 */
const runCommand = createCommandRunner(editor)

// ===== Color application functions =====
const setTextColor = (color: string) => {
  currentTextColor.value = color
  runCommand((chain) => chain.setColor(color))()
}

const setHighlight = (color: string) => {
  currentBgColor.value = color
  runCommand((chain) => chain.setHighlight({ color }))()
}

// Listen to editor state to update current colors
watch(
  () => editor.value?.getAttributes('textStyle'),
  (attrs) => {
    if (attrs?.color) {
      currentTextColor.value = normalizeColor(attrs.color)
    } else {
      currentTextColor.value = '#000000'
    }
  },
  { deep: true, immediate: true }
)

watch(
  () => editor.value?.getAttributes('highlight'),
  (attrs) => {
    if (attrs?.color) {
      currentBgColor.value = normalizeColor(attrs.color)
    } else {
      currentBgColor.value = '#ffffff'
    }
  },
  { deep: true, immediate: true }
)
</script>

<style lang="scss" scoped>
// Dark mode selector variables (for managing dark theme styles)
$dark-selector: ':where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) &';

/* ===== Toolbar container ===== */
.editor-toolbar-container {
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
  background: #fff;
  box-shadow: 0 1px 4px rgb(0 0 0 / 8%);

  #{$dark-selector} {
    background: #1f1f1f;
    box-shadow: 0 1px 4px rgb(0 0 0 / 40%);
  }
}

/* ===== Toolbar main ===== */
.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  justify-content: flex-start;
  min-height: 48px;
  padding: 6px 12px;
}

/* ===== Toolbar left area ===== */
.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  align-items: center;
  min-width: 0;
  flex: 1;
}

/* ===== Toolbar right area ===== */
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  padding-left: 12px;
}

/* ===== Tool group ===== */
.tool-group {
  display: flex;
  gap: 2px;
  align-items: center;
  padding: 0 6px;
  border-right: 1px solid #e8e8e8;

  #{$dark-selector} {
    border-right-color: #434343;
  }

  &:last-child {
    border-right: none;
  }

  &:first-child {
    padding-left: 0;
  }
}
</style>

