/**
 * Core Extensions - core extension configuration
 * @description Dynamically load editor extensions based on version
 */

import type { AnyExtension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import { Underline } from '@tiptap/extension-underline'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import { ResizableImage } from '@/features/basic/image'
import { Link } from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
// import { CodeBlock } from '@tiptap/extension-code-block'
import { FontFamily } from '@tiptap/extension-font-family'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { CharacterCount } from '@tiptap/extension-character-count'
import { FontSize } from './fontSize'
import { PasteImage } from './pasteImage'
import { PasteWord } from './pasteWord'
import { Video } from './video'
import { ListShortcuts } from './listShortcuts'
import { LineHeight } from './lineHeight'
import { FormatPainter } from '@/features/advanced/format-painter'
import { MathExtension } from '@/extensions/math'
import { CalloutExtension } from './calloutExtension'
import { ToggleExtension, ToggleSummary, ToggleContent } from './toggleExtension'
import { t } from '@/locales'
import {
  CustomAiExtension,
  ContinueWritingExtension,
  PolishExtension,
  SummarizeExtension,
  TranslationExtension,
  AiHighlightMark,
} from '@/ai'

/**
 * Editor version type
 * - 'minimal' / 1: minimal set (basic text format + lists + undo/redo)
 * - 'basic' / 2: basic set (colors, alignment, images, links, etc., without tables / math formulas / format painter / AI)
 * - 'advanced' / 'premium' / 'all' / 'full' / 3 / 4: full set (consistent with historical behavior, loaded in full)
 */
export type EditorVersion =
  | 'minimal'
  | 'basic'
  | 'advanced'
  | 'premium'
  | 'all'
  | 'full'
  | 1
  | 2
  | 3
  | 4

/** internal feature tier: 1=minimal 2=basic 3=full (advanced/premium/all are all full, kept backward compatible) */
type ExtensionTier = 1 | 2 | 3

function resolveTier(version: EditorVersion): ExtensionTier {
  switch (version) {
    case 'minimal':
    case 1:
      return 1
    case 'basic':
    case 2:
      return 2
    // advanced/premium/all/full remain consistent with historical behavior: loaded in full
    case 'advanced':
    case 'premium':
    case 'all':
    case 'full':
    case 3:
    case 4:
    default:
      return 3
  }
}

/**
 * Extension config options
 */
export interface ExtensionsOptions {
  /** whether to enable image enhancement (drag resize), default true */
  enableImageResize?: boolean
  /** whether to disable the history extension (needed in collaboration mode), default false */
  disableHistory?: boolean
}

/**
 * Get extension config based on version
 * @param version editor version. When not passed, defaults to full loading (consistent with historical behavior);
 *                'minimal' / 'basic' load only the corresponding subset (heavy extensions like tables, math formulas, format painter, AI are excluded)
 * @param optionsOrEnableImageResize config options or whether to enable image enhancement (backward-compatible old API)
 * @returns array of extension configs
 */
export function getExtensionsByVersion(
  version: EditorVersion = 'all',
  optionsOrEnableImageResize: boolean | ExtensionsOptions = true
): AnyExtension[] {
  // Backward-compatible old API: if a boolean is passed, convert it to a config object
  const options: ExtensionsOptions = typeof optionsOrEnableImageResize === 'boolean'
    ? { enableImageResize: optionsOrEnableImageResize }
    : optionsOrEnableImageResize

  const { enableImageResize = true, disableHistory = false } = options

  const tier = resolveTier(version)
  const extensions: AnyExtension[] = []

  // ===== Minimal set (included in all versions): basic text format, lists, undo/redo =====
  // Disable history in collaboration mode, because @tiptap/extension-collaboration has its own history management
  const starterKitConfig: Record<string, unknown> = {
    // Disable some advanced features; provided by other extensions in the basic version
    heading: {
      levels: [1, 2, 3, 4, 5, 6],
    },
    // Disable link and underline, because they are added separately with configured versions later
    link: false,
    underline: false,
  }

  // Disable history in collaboration mode
  if (disableHistory) {
    starterKitConfig.history = false
  }

  extensions.push(StarterKit.configure(starterKitConfig))

  // Placeholder extension (function form: gets the new copy after language switch)
  extensions.push(
    Placeholder.configure({
      placeholder: () => t('placeholder.default'),
    })
  )

  // Underline extension
  extensions.push(Underline)

  // Task list extension
  extensions.push(TaskList)
  extensions.push(
    TaskItem.configure({
      nested: true,
    })
  )

  // List shortcuts, character count (lightweight, included in all versions)
  extensions.push(ListShortcuts)
  extensions.push(CharacterCount)

  // Notion extensions: Callout and Toggle blocks
  extensions.push(CalloutExtension)
  extensions.push(ToggleSummary)
  extensions.push(ToggleContent)
  extensions.push(ToggleExtension)

  if (tier < 2) {
    return extensions
  }

  // ===== Basic set (basic and above): colors, alignment, images, links, fonts, etc. =====

  // Text alignment extension
  extensions.push(
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    })
  )

  // Color and text style extensions
  extensions.push(Color)
  extensions.push(TextStyle)
  extensions.push(Highlight.configure({
    multicolor: true,
  }))

  // Image extension (uses a resizable image extension, supports drag resize)
  extensions.push(
    ResizableImage.configure({
      inline: true,
      allowBase64: true,
      enableResize: enableImageResize, // decide whether to enable image enhancement based on config
    })
  )

  // Link extension
  extensions.push(
    Link.configure({
      openOnClick: true, // allow clicking links to navigate
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    })
  )

  // Font extensions
  extensions.push(FontFamily)
  extensions.push(FontSize)

  // Subscript/superscript extensions
  extensions.push(Subscript)
  extensions.push(Superscript)

  // Line height extension
  extensions.push(LineHeight)

  // Video extension
  extensions.push(
    Video.configure({
      inline: false,
      allowBase64: true,
    })
  )

  // Paste extensions
  extensions.push(PasteImage)
  extensions.push(PasteWord)

  if (tier < 3) {
    return extensions
  }

  // ===== Full set (advanced / premium / all): tables, format painter, math formulas, AI =====

  // Table extensions
  extensions.push(
    Table.configure({
      resizable: true,
    })
  )
  extensions.push(TableRow)
  extensions.push(TableCell)
  extensions.push(TableHeader)

  // Format painter extension
  extensions.push(FormatPainter)

  // Math formula extension
  extensions.push(MathExtension)

  // AI feature extensions
  extensions.push(AiHighlightMark)
  extensions.push(CustomAiExtension)
  extensions.push(ContinueWritingExtension)
  extensions.push(PolishExtension)
  extensions.push(SummarizeExtension)
  extensions.push(TranslationExtension)

  return extensions
}

/**
 * Get the basic version extension config
 * @description this function internally calls getExtensionsByVersion('basic').
 *              Note: the basic version now loads only the basic subset (without tables / math formulas / format painter / AI);
 *              for the full set use getExtensionsByVersion('all')
 * @deprecated recommended to directly use getExtensionsByVersion('basic') or getExtensionsByVersion(2)
 */
export function getBasicExtensions() {
  return getExtensionsByVersion('basic')
}
