/**
 * DragHandleMenu Configuration
 * @description Menu item configuration and action helper functions
 */

import type { Editor } from '@tiptap/core'
import type { Component } from 'vue'
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  CheckSquareOutlined,
  ScissorOutlined,
  CopyOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'

// Use shared helper functions
import { selectNodeContent, cutBlock, copyBlock, deleteBlock } from '@/utils/clipboard'

// ============================================================================
// Type definitions
// ============================================================================

export interface HeadingMenuItem {
  level: number
  title: string
  action: () => void
}

export interface NamedMenuItem {
  name: string
  icon?: Component
  title: string
  action: () => void
}

export interface MenuConfig {
  headings: HeadingMenuItem[]
  textFormats: NamedMenuItem[]
  listItems: NamedMenuItem[]
}

// ============================================================================
// Constants
// ============================================================================

export const COLORS = [
  '#000000',
  '#ff0000',
  '#ff9900',
  '#ffff00',
  '#00ff00',
  '#00ffff',
  '#0000ff',
  '#9900ff',
]

// ============================================================================
// Menu configuration generator
// ============================================================================

// ============================================================================
// Menu configuration generator
// ============================================================================

/**
 * Create menu configuration
 * @description Generate configuration items for drag handle menu
 */
export function createMenuConfig(
  editor: Editor,
  nodePos: number,
  nodeTo: number,
  onClose: () => void,
  t: (key: string) => string
): MenuConfig {
  const nodeFrom = nodePos

  /**
   * Create heading menu items
   */
  const createHeadingItem = (level: number): HeadingMenuItem => ({
    level,
    title: t(`editor.h${level}`),
    action: () => {
      // @ts-ignore - toggleHeading dynamically added by StarterKit
      editor.chain().focus().setTextSelection(nodeFrom).toggleHeading({ level }).run()
      onClose()
    },
  })

  /**
   * Create text format menu items
   */
  const createTextFormatItem = (
    name: string,
    icon: Component,
    titleKey: string,
    command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>
  ): NamedMenuItem => ({
    name,
    icon,
    title: t(titleKey),
    action: () => {
      selectNodeContent(editor, nodeFrom, nodeTo)
      // @ts-ignore - Commands dynamically added by extension
      command(editor.chain().focus()).run()
      onClose()
    },
  })

  /**
   * Create list menu items
   */
  const createListItem = (
    name: string,
    icon: Component,
    titleKey: string,
    command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>
  ): NamedMenuItem => ({
    name,
    icon,
    title: t(titleKey),
    action: () => {
      // @ts-ignore - Commands dynamically added by extension
      command(editor.chain().focus().setTextSelection(nodeFrom)).run()
      onClose()
    },
  })

  return {
    // Heading
    headings: [1, 2, 3].map(createHeadingItem),

    // Text formatting
    textFormats: [
      createTextFormatItem('bold', BoldOutlined, 'editor.bold', (chain) => chain.toggleBold()),
      createTextFormatItem('italic', ItalicOutlined, 'editor.italic', (chain) => chain.toggleItalic()),
      createTextFormatItem('underline', UnderlineOutlined, 'editor.underline', (chain) => chain.toggleUnderline()),
      createTextFormatItem('strike', StrikethroughOutlined, 'editor.strike', (chain) => chain.toggleStrike()),
    ],

    // List
    listItems: [
      createListItem('bulletList', UnorderedListOutlined, 'editor.bulletList', (chain) => chain.toggleBulletList()),
      createListItem('orderedList', OrderedListOutlined, 'editor.orderedList', (chain) => chain.toggleOrderedList()),
      createListItem('taskList', CheckSquareOutlined, 'editor.taskList', (chain) => chain.toggleTaskList()),
    ],
  }
}

/**
 * Create edit action menu items
 * @description Generates cut, copy, delete edit action menu items
 */
export function createEditActions(
  editor: Editor,
  nodePos: number,
  nodeTo: number,
  onClose: () => void,
  t: (key: string) => string
) {
  return [
    {
      icon: ScissorOutlined,
      title: t('editor.cut'),
      action: async () => {
        await cutBlock(editor, nodePos, nodeTo)
        onClose()
      },
    },
    {
      icon: CopyOutlined,
      title: t('editor.copy'),
      action: async () => {
        await copyBlock(editor, nodePos, nodeTo)
        onClose()
      },
    },
    {
      icon: DeleteOutlined,
      title: t('editor.delete'),
      action: () => {
        deleteBlock(editor, nodePos, nodeTo)
        onClose()
      },
      danger: true,
    },
  ]
}

