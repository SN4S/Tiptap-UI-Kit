/**
 * DragHandleWithMenu Extension - 6-dot display extension
 * @description Adds a clickable 6-dot drag handle to block elements
 * @features
 * - Displays 6-dot icon to the left of block elements
 * - Clicking 6 dots triggers menu display
 * - Automatically excludes special nodes like tables, images
 * - Intelligently handles nested lists
 */

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { h, render } from 'vue'
import { HolderOutlined } from '@ant-design/icons-vue'

// ============================================================================
// Constants
// ============================================================================

export const dragHandleWithMenuKey = new PluginKey('dragHandleWithMenu')

// Node types that do not display handle
const EXCLUDED_NODE_TYPES = ['doc', 'table', 'image', 'figure', 'tableCell', 'tableHeader'] as const
const EXCLUDED_LIST_TYPES = ['taskList', 'listItem', 'taskItem'] as const
const ALLOWED_LIST_TYPES = ['orderedList', 'bulletList'] as const

// ============================================================================
// Type definitions
// ============================================================================

export interface DragHandleClickEvent {
  position: { x: number; y: number }
  nodePos: number
  nodeTo: number
  handleElement: HTMLElement
}

export interface DragHandleWithMenuOptions {
  onHandleClick?: (event: DragHandleClickEvent) => void
}

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Determine if 6-dot handle should be displayed
 * @description Determines handle display based on node and parent types
 * @param node Current node
 * @param parent Parent node
 * @returns Whether to show handle
 */
function shouldShowHandle(node: ProseMirrorNode, parent: ProseMirrorNode): boolean {
  // Must be a block element and not root document node
  if (!node.isBlock || node.type.name === 'doc') return false

  // Exclude specific node types
  if (EXCLUDED_NODE_TYPES.includes(node.type.name as any)) return false
  if (parent.type.name === 'table') return false

  // List handling logic
  if (ALLOWED_LIST_TYPES.includes(node.type.name as any)) {
    return true // Ordered and bullet lists show handle
  }

  if (EXCLUDED_LIST_TYPES.includes(node.type.name as any)) {
    return false // Task lists and list items do not show handle
  }

  // Paragraphs inside list items do not display handle
  if (
    (parent.type.name === 'listItem' || parent.type.name === 'taskItem') &&
    node.type.name === 'paragraph'
  ) {
    return false
  }

  // Paragraphs inside ordered/bullet lists do not display handle
  if (
    ALLOWED_LIST_TYPES.includes(parent.type.name as any) &&
    node.type.name === 'paragraph'
  ) {
    return false
  }

  // Table cells do not display handle
  if (parent.type.name === 'tableCell' || parent.type.name === 'tableHeader') {
    return false
  }

  // Empty nodes do not display handle
  if (node.content.size === 0) return false

  return true
}

/**
 * Create 6-dot DOM element
 * @description 6-dot element handles display and click events
 * @param node Node
 * @param pos Node position
 * @param view Editor view
 * @param onHandleClick Click callback
 * @returns Handle DOM element
 */
function createDragHandle(
  node: ProseMirrorNode,
  pos: number,
  view: any,
  onHandleClick?: (event: DragHandleClickEvent) => void
): HTMLElement {
  const handle = document.createElement('div')
  handle.className = 'drag-handle'
  handle.contentEditable = 'false'
  // 6-dot element handles display and click only
  handle.draggable = false

  // Uses Ant Design Vue icon: HolderOutlined
  // Render directly inside handle element
  render(h(HolderOutlined), handle)

  // Prevent mousedown bubbling to avoid ProseMirror selection re-render
  // Resolves double-click requirement issue
  handle.addEventListener('mousedown', (e) => {
    e.stopPropagation()
    e.preventDefault()
  })

  // Click event handling
  handle.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const nodeTo = pos + node.nodeSize
    const handleRect = handle.getBoundingClientRect()

    // Remove active class from other handles
    view.dom.querySelectorAll('.drag-handle.active').forEach((el: Element) => {
      el.classList.remove('active')
    })

    // Add active class
    handle.classList.add('active')

    // Trigger callback with position and node info
    if (onHandleClick) {
      onHandleClick({
        position: { x: handleRect.right + 10, y: handleRect.top },
        nodePos: pos,
        nodeTo,
        handleElement: handle,
      })
    }
  })

  return handle
}

// ============================================================================
// Extension definition
// ============================================================================

export const DragHandleWithMenuExtension = Extension.create<DragHandleWithMenuOptions>({
  name: 'dragHandleWithMenu',

  addOptions() {
    return {
      onHandleClick: undefined,
    }
  },

  addProseMirrorPlugins() {
    const options = this.options

    return [
      new Plugin({
        key: dragHandleWithMenuKey,

        props: {
          decorations(state) {
            const decorations: Decoration[] = []

            state.doc.descendants((node, pos) => {
              const $pos = state.doc.resolve(pos)
              const parent = $pos.parent

              if (!shouldShowHandle(node, parent)) {
                return true
              }

              // Insert handle inside block node (pos + 1) for CSS hover display
              decorations.push(
                Decoration.widget(
                  pos + 1,
                  (view) => createDragHandle(node, pos, view, options.onHandleClick),
                  {
                    side: -1,
                    stopEvent: (e) => {
                      // Make ProseMirror ignore mousedown and click events on handle
                      // Ensure DOM events are captured by handle and child elements
                      return e.type === 'mousedown' || e.type === 'click'
                    },
                  }
                )
              )

              return true
            })

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})

