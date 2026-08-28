/**
 * Editor State Utilities
 * @description Editor state checking utility functions
 */

import { onBeforeUnmount, shallowRef, triggerRef, watch } from 'vue'
import type { Ref } from 'vue'
import type { Editor } from '@tiptap/core'

/** Attribute value type for editor state checks */
type AttributeValue = string | number | boolean | null | undefined

/**
 * Make the editor instance "transaction-reactive"
 * @description Tiptap transactions do not trigger Vue reactive updates (the editor instance identity stays the same),
 * so computeds that depend on the editor (isActive/getAttributes, etc.) are not re-evaluated as the cursor moves.
 * This composable subscribes to the editor's transaction event internally and uses triggerRef to force-notify dependent parties.
 * Note: you cannot use "a computed depending on a tick" here - after the computed re-evaluates it still returns the same
 * Editor instance, and Vue skips downstream effects because of value equality (===); you must use triggerRef to bypass that cutoff.
 * Automatically handles instance replacement and unmount cleanup. Must be called in the component setup.
 *
 * @example
 * ```typescript
 * const editor = useReactiveEditor(() => props.editor)
 * const { isActive } = createStateCheckers(editor) // isActive now follows cursor changes
 * ```
 */
export function useReactiveEditor<T extends Editor>(
  getEditor: () => T | null | undefined
): Ref<T | null> {
  // watch's immediate callback writes the current value immediately, so only null initialization is needed here
  const editorRef = shallowRef(null) as Ref<T | null>
  let current: Editor | null = null
  const onTransaction = () => {
    if (current && !current.isDestroyed) triggerRef(editorRef)
  }
  watch(
    getEditor,
    (e) => {
      if (current) current.off('transaction', onTransaction)
      current = e ?? null
      editorRef.value = (e ?? null) as T | null
      if (current) current.on('transaction', onTransaction)
    },
    { immediate: true }
  )
  onBeforeUnmount(() => {
    if (current) {
      current.off('transaction', onTransaction)
      current = null
    }
  })
  return editorRef
}

/**
 * State checker interface
 */
export interface StateCheckers {
  /** Check whether a node/mark is active */
  isActive: (name: string, attributes?: Record<string, AttributeValue>) => boolean
  /** Check whether a heading level is active */
  isHeadingActive: (level: number) => boolean
  /** Check whether an alignment is active */
  isActiveAlign: (value: 'left' | 'center' | 'right' | 'justify') => boolean
  /** Check whether a command is executable */
  canExecute: (command: string) => boolean
}

/**
 * Create state checkers
 * @description Create a set of functions for checking editor state
 * @param editor - editor instance reference
 * @returns set of state checking functions
 *
 * @example
 * ```typescript
 * const { isActive, isHeadingActive, canExecute } = createStateCheckers(editor)
 *
 * if (isActive('bold')) {
 *   console.log('Text is bold')
 * }
 *
 * if (isHeadingActive(1)) {
 *   console.log('This is heading 1')
 * }
 *
 * if (canExecute('toggleBold')) {
 *   console.log('Can toggle bold')
 * }
 * ```
 */
export function createStateCheckers(editor: Ref<Editor | null | undefined>): StateCheckers {
  return {
    /**
     * Check whether a node/mark is active
     * @param name - node or mark name
     * @param attributes - optional attribute object
     * @returns whether active
     */
    isActive: (name: string, attributes?: Record<string, AttributeValue>) => {
      const e = editor.value
      if (!e) return false
      return attributes ? e.isActive(name, attributes) : e.isActive(name)
    },

    /**
     * Check whether a heading level is active
     * @param level - heading level (1-6)
     * @returns whether active
     */
    isHeadingActive: (level: number) => {
      const e = editor.value
      if (!e) return false
      return e.isActive('heading', { level })
    },

    /**
     * Check whether alignment is active
     * @param value - alignment
     * @returns whether active
     */
    isActiveAlign: (value: 'left' | 'center' | 'right' | 'justify') => {
      const e = editor.value
      if (!e) return false
      return e.isActive({ textAlign: value })
    },

    /**
     * Check whether a command is executable
     * @param command - command name
     * @returns whether executable
     */
    canExecute: (command: string) => {
      const e = editor.value
      if (!e) return false
      // Tiptap commands are dynamically added, use type assertion through unknown
      const canObj = e.can() as unknown as Record<string, ((...args: unknown[]) => boolean) | undefined>
      const fn = canObj[command]
      return typeof fn === 'function' ? fn() : false
    },
  }
}

/**
 * Check whether a node/mark is active
 * @description direct check, no need to create a checker object
 * @param editor - editor instance reference
 * @param name - node or mark name
 * @param attributes - optional attribute object
 * @returns whether active
 *
 * @example
 * ```typescript
 * if (isActive(editor, 'bold')) {
 *   console.log('Bold is active')
 * }
 * ```
 */
export function isActive(
  editor: Ref<Editor | null | undefined>,
  name: string,
  attributes?: Record<string, AttributeValue>
): boolean {
  const e = editor.value
  if (!e) return false
  return attributes ? e.isActive(name, attributes) : e.isActive(name)
}

/**
 * Check whether a heading level is active
 * @param editor - editor instance reference
 * @param level - heading level (1-6)
 * @returns whether active
 */
export function isHeadingActive(
  editor: Ref<Editor | null | undefined>,
  level: number
): boolean {
  const e = editor.value
  if (!e) return false
  return e.isActive('heading', { level })
}

/**
 * Check whether alignment is active
 * @param editor - editor instance reference
 * @param value - alignment
 * @returns whether active
 */
export function isActiveAlign(
  editor: Ref<Editor | null | undefined>,
  value: 'left' | 'center' | 'right' | 'justify'
): boolean {
  const e = editor.value
  if (!e) return false
  return e.isActive({ textAlign: value })
}

/**
 * Check whether a command is executable
 * @param editor - editor instance reference
 * @param command - command name
 * @returns whether executable
 */
export function canExecute(
  editor: Ref<Editor | null | undefined>,
  command: string
): boolean {
  const e = editor.value
  if (!e) return false
  const canObj = e.can() as unknown as Record<string, ((...args: unknown[]) => boolean) | undefined>
  const fn = canObj[command]
  return typeof fn === 'function' ? fn() : false
}

/**
 * Get current paragraph style
 * @description Get the paragraph style at the current cursor position (body text or heading level)
 * @param editor - editor instance reference
 * @returns paragraph style identifier ('paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6')
 */
export function getCurrentParagraphStyle(
  editor: Ref<Editor | null | undefined>
): string {
  const e = editor.value
  if (!e) return 'paragraph'

  for (let i = 1; i <= 6; i++) {
    if (e.isActive('heading', { level: i })) {
      return `h${i}`
    }
  }

  return 'paragraph'
}

/**
 * Get current text alignment
 * @description Get the text alignment at the current cursor position
 * @param editor - editor instance reference
 * @returns alignment ('left' | 'center' | 'right' | 'justify')
 */
export function getCurrentTextAlign(
  editor: Ref<Editor | null | undefined>
): 'left' | 'center' | 'right' | 'justify' {
  const e = editor.value
  if (!e) return 'left'

  const alignments: Array<'left' | 'center' | 'right' | 'justify'> = [
    'left',
    'center',
    'right',
    'justify',
  ]

  for (const align of alignments) {
    if (e.isActive({ textAlign: align })) {
      return align
    }
  }

  return 'left'
}


