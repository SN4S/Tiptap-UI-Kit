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
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state'
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
  // Atom blocks (subpage, fileAttachment) are always "empty" by design.
  if (node.content.size === 0 && !node.isAtom) return false

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
  handle.dataset.block = node.type.name
  handle.contentEditable = 'false'
  // The handle is draggable so the attached block can be moved around with it
  handle.draggable = true

  // Uses Ant Design Vue icon: HolderOutlined
  // Render directly inside handle element
  render(h(HolderOutlined), handle)

  // Prevent mousedown bubbling to avoid ProseMirror selection re-render
  // Resolves double-click requirement issue
  handle.addEventListener('mousedown', (e) => {
    e.stopPropagation()
    e.preventDefault()
  })

  // Native drag&drop of the attached block via the handle.
  // Setting view.dragging lets ProseMirror's dragover/drop handlers
  // move the whole node (with drop cursor) to the drop position.
  handle.addEventListener('dragstart', (e) => {
    e.stopPropagation()
    const dragNode = view.state.doc.nodeAt(pos)
    if (!dragNode || !e.dataTransfer) return

    const nodeSel = NodeSelection.create(view.state.doc, pos)
    view.dispatch(view.state.tr.setSelection(nodeSel).setMeta('uiEvent', 'drag'))

    const slice = nodeSel.content()
    const nodeDom = view.nodeDOM(pos) as HTMLElement | null
    e.dataTransfer.effectAllowed = 'copyMove'
    e.dataTransfer.setData('text/html', nodeDom ? nodeDom.outerHTML : '')
    e.dataTransfer.setData('text/plain', slice.content.textBetween(0, slice.content.size, '\n', '\n'))

    view.dragging = { slice, move: true, node: nodeSel }
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

              // Atom-like blocks (subpage, fileAttachment) are rendered as leaf nodes
              // without a content hole, so a widget cannot be placed inside them.
              // Put the handle just before the node in that case.
              const isAtomLike = node.isAtom || node.isLeaf
              // Insert handle inside block node (pos + 1) for CSS hover display
              decorations.push(
                Decoration.widget(
                  isAtomLike ? pos : pos + 1,
                  (view) => createDragHandle(node, pos, view, options.onHandleClick),
                  {
                    side: isAtomLike ? 1 : -1,
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

