/**
 * Editor Commands Utilities
 * @description Editor command execution utility functions
 */

import type { Ref } from 'vue'
import type { Editor } from '@tiptap/core'

/**
 * Chain command type
 */
export type EditorChain = ReturnType<Editor['chain']>

/**
 * Command builder function type
 */
export type CommandBuilder = (chain: EditorChain) => EditorChain

/**
 * Create a command runner
 * @description Create a command execution function that automatically handles editor instance checking and focus management
 * @param editor - editor instance reference
 * @returns command execution function
 *
 * @example
 * ```typescript
 * const runCommand = createCommandRunner(editor)
 * const toggleBold = runCommand((chain) => chain.toggleBold())
 * toggleBold() // execute bold toggle
 * ```
 */
export function createCommandRunner(editor: Ref<Editor | null | undefined>) {
  return (fn: CommandBuilder) => () => {
    const e = editor.value
    if (!e) {
      console.warn('[editorCommands] Editor instance is null or undefined')
      return
    }
    fn(e.chain().focus()).run()
  }
}

/**
 * Create a command runner without focus
 * @description similar to createCommandRunner, but does not automatically set focus
 * @param editor - editor instance reference
 * @returns command execution function
 */
export function createCommandRunnerWithoutFocus(editor: Ref<Editor | null | undefined>) {
  return (fn: CommandBuilder) => () => {
    const e = editor.value
    if (!e) {
      console.warn('[editorCommands] Editor instance is null or undefined')
      return
    }
    fn(e.chain()).run()
  }
}

/**
 * Execute a command directly
 * @description immediately execute an editor command
 * @param editor - editor instance reference
 * @param fn - command builder function
 * @param withFocus - whether to auto focus, default true
 * @returns whether the command executed successfully
 *
 * @example
 * ```typescript
 * executeCommand(editor, (chain) => chain.toggleBold())
 * ```
 */
export function executeCommand(
  editor: Ref<Editor | null | undefined>,
  fn: CommandBuilder,
  withFocus = true
): boolean {
  const e = editor.value
  if (!e) {
    console.warn('[editorCommands] Editor instance is null or undefined')
    return false
  }

  const chain = withFocus ? e.chain().focus() : e.chain()
  return fn(chain).run()
}

/**
 * Execute commands in batch
 * @description execute multiple commands in sequence
 * @param editor - editor instance reference
 * @param commands - array of command builder functions
 * @param withFocus - whether to auto focus, default true
 * @returns whether all commands executed successfully
 *
 * @example
 * ```typescript
 * executeBatchCommands(editor, [
 *   (chain) => chain.toggleBold(),
 *   (chain) => chain.setColor('#ff0000')
 * ])
 * ```
 */
export function executeBatchCommands(
  editor: Ref<Editor | null | undefined>,
  commands: CommandBuilder[],
  withFocus = true
): boolean {
  const e = editor.value
  if (!e) {
    console.warn('[editorCommands] Editor instance is null or undefined')
    return false
  }

  let chain = withFocus ? e.chain().focus() : e.chain()

  for (const command of commands) {
    chain = command(chain)
  }

  return chain.run()
}


