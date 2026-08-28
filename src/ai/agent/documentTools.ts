/**
 * Document Tools - AI document editing toolset
 * @description Wraps the editor's basic operations into structured "tools" (OpenAI function-calling format),
 * for the AI agent to invoke through a tool-use loop to "write and modify a document using text descriptions".
 *
 * Addressing design:
 * - Block-level operations use a "block index" (the index of the document's top-level node, returned by read_document)
 * - Inline operations use "text search" (find + occurrence), without exposing fragile ProseMirror positions
 * - After each modification, the latest document outline is returned, so the model doesn't need to call read_document again to align indexes
 */

import type { Editor } from '@tiptap/core'

// ============================================================================
// Types
// ============================================================================

/** Tool definition (parameters is a JSON Schema, aligned with OpenAI function calling) */
export interface DocumentTool {
  name: string
  description: string
  parameters: Record<string, unknown>
  /** Execute the tool; returns result text for the model to see; errors thrown are also relayed back to the model */
  execute: (editor: Editor, args: Record<string, unknown>) => string
}

interface BlockInfo {
  index: number
  /** Position before the block's start (the block boundary) */
  from: number
  /** Position after the block's end */
  to: number
  node: import('@tiptap/pm/model').Node
}

// ============================================================================
// Internal helper functions
// ============================================================================

/** Collects the document's top-level blocks */
function getBlocks(editor: Editor): BlockInfo[] {
  const blocks: BlockInfo[] = []
  editor.state.doc.forEach((node, offset, index) => {
    blocks.push({ index, from: offset, to: offset + node.nodeSize, node })
  })
  return blocks
}

/** A short description of a single block (type + truncated text) */
function describeBlock(node: import('@tiptap/pm/model').Node, maxLen: number): string {
  let type = node.type.name
  if (type === 'heading') type = `h${node.attrs.level}`
  else if (type === 'paragraph') type = 'p'
  else if (type === 'bulletList') type = 'ul'
  else if (type === 'orderedList') type = 'ol'
  else if (type === 'codeBlock') type = `code(${node.attrs.language || 'text'})`
  else if (type === 'table') {
    const rows = node.childCount
    const cols = rows > 0 ? node.firstChild!.childCount : 0
    return `table ${rows}x${cols}: ${truncate(node.textContent, maxLen)}`
  }

  const text = node.textContent.trim()
  return text ? `${type}: ${truncate(text, maxLen)}` : `${type}: (empty)`
}

function truncate(text: string, maxLen: number): string {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t
}

/** Document outline: [i] type: text (the model uses it to obtain block indexes) */
export function getDocumentOutline(editor: Editor, maxLenPerBlock = 150, maxBlocks = 300): string {
  const blocks = getBlocks(editor)
  if (blocks.length === 0) return '(document is empty)'
  const lines = blocks
    .slice(0, maxBlocks)
    .map((b) => `[${b.index}] ${describeBlock(b.node, maxLenPerBlock)}`)
  if (blocks.length > maxBlocks) {
    lines.push(`… (${blocks.length - maxBlocks} more blocks omitted)`)
  }
  return lines.join('\n')
}

/** Unified result returned to the model after a successful modification (with the latest outline, to avoid index drift) */
function okWithOutline(editor: Editor, message: string): string {
  return `${message}\nDocument now:\n${getDocumentOutline(editor, 80)}`
}

/** Validates and resolves a block index range */
function resolveBlockRange(
  editor: Editor,
  fromBlock: number,
  toBlock?: number
): { from: number; to: number; count: number } {
  const blocks = getBlocks(editor)
  const last = typeof toBlock === 'number' ? toBlock : fromBlock
  if (
    !Number.isInteger(fromBlock) ||
    !Number.isInteger(last) ||
    fromBlock < 0 ||
    last >= blocks.length ||
    fromBlock > last
  ) {
    throw new Error(
      `Invalid block range [${fromBlock}, ${last}]. Document has ${blocks.length} blocks (0-${blocks.length - 1}). Call read_document to get fresh indexes.`
    )
  }
  return { from: blocks[fromBlock].from, to: blocks[last].to, count: last - fromBlock + 1 }
}

interface TextMatch {
  from: number
  to: number
  /** The top-level block index where the match is located (used for multi-match disambiguation hints) */
  blockIndex: number
}

/**
 * Scans the full document and returns all match ranges of the find text (absolute positions).
 * Supports matches crossing inline node boundaries (e.g. half bold, half normal);
 * inserts unmatchable sentinel characters at block-level structural boundaries (nested paragraphs/table cells) and hard breaks,
 * to prevent cross-structure false matches such as "adjacent cell text concatenated happens to equal find".
 */
function findAllTextRanges(editor: Editor, find: string): TextMatch[] {
  if (!find) throw new Error('`find` must be a non-empty string.')
  const doc = editor.state.doc

  // Concatenate the text block by block and record the absolute position of each character, avoiding cross-block false matches
  const matches: TextMatch[] = []
  doc.forEach((block, blockOffset, blockIndex) => {
    let text = ''
    const positions: number[] = []
    block.descendants((node, pos) => {
      if (node.isText && node.text) {
        for (let i = 0; i < node.text.length; i++) {
          text += node.text[i]
          // +1 to skip the block's start token
          positions.push(blockOffset + 1 + pos + i)
        }
      } else if (node.isBlock || node.type.name === 'hardBreak') {
        // Structural boundary: the user's find will never contain \u0000, so cross-boundary false matches naturally fail
        if (text) {
          text += '\u0000'
          positions.push(-1)
        }
      }
      return true
    })
    let idx = text.indexOf(find)
    while (idx !== -1) {
      matches.push({
        from: positions[idx],
        to: positions[idx + find.length - 1] + 1,
        blockIndex,
      })
      idx = text.indexOf(find, idx + 1)
    }
  })
  return matches
}

/**
 * Resolves a single unique target match.
 * When occurrence is not explicitly passed and multiple matches exist, throws an error requesting disambiguation, to avoid silently editing the wrong position.
 */
function resolveSingleMatch(
  editor: Editor,
  find: string,
  occurrence: number | undefined
): { from: number; to: number } {
  const matches = findAllTextRanges(editor, find)
  if (matches.length === 0) {
    throw new Error(`Text not found: "${truncate(find, 60)}". Check exact wording with read_document.`)
  }
  if (occurrence === undefined) {
    if (matches.length > 1) {
      const blocks = [...new Set(matches.map((m) => m.blockIndex))].join(', ')
      throw new Error(
        `Found ${matches.length} matches for "${truncate(find, 60)}" (in block(s) ${blocks}). Pass occurrence (1-${matches.length}) to disambiguate.`
      )
    }
    return matches[0]
  }
  if (!Number.isInteger(occurrence) || occurrence < 1 || occurrence > matches.length) {
    throw new Error(`Occurrence ${occurrence} out of range: only ${matches.length} match(es) found.`)
  }
  return matches[occurrence - 1]
}

// ============================================================================
// Tool definitions
// ============================================================================

const readDocument: DocumentTool = {
  name: 'read_document',
  description:
    'Read the current document as an outline of top-level blocks with their indexes. Always call this first to understand the document and get fresh block indexes.',
  parameters: { type: 'object', properties: {}, additionalProperties: false },
  execute: (editor) => {
    const blocks = getBlocks(editor)
    return `Document has ${blocks.length} block(s):\n${getDocumentOutline(editor)}`
  },
}

const getSelection: DocumentTool = {
  name: 'get_selection',
  description:
    "Get the user's currently selected text, if any. Useful when the user refers to “the selected text” / “选中的文字”.",
  parameters: { type: 'object', properties: {}, additionalProperties: false },
  execute: (editor) => {
    const { from, to, empty } = editor.state.selection
    if (empty) return 'No text is selected.'
    const text = editor.state.doc.textBetween(from, to, '\n')
    return `Selected text (${text.length} chars): "${truncate(text, 2000)}"`
  },
}

const insertBlocks: DocumentTool = {
  name: 'insert_blocks',
  description:
    'Insert new content into the document as HTML. Supported tags: p, h1-h6, ul/ol/li, table/tr/th/td, blockquote, pre/code, strong, em, u, s, a, img, hr. Keep HTML simple and valid.',
  parameters: {
    type: 'object',
    properties: {
      html: { type: 'string', description: 'HTML content to insert' },
      position: {
        type: 'string',
        enum: ['documentStart', 'documentEnd', 'beforeBlock', 'afterBlock'],
        description: 'Where to insert',
      },
      blockIndex: {
        type: 'number',
        description: 'Required when position is beforeBlock/afterBlock: the anchor block index',
      },
    },
    required: ['html', 'position'],
    additionalProperties: false,
  },
  execute: (editor, args) => {
    const html = String(args.html || '')
    if (!html.trim()) throw new Error('`html` must not be empty.')
    const position = String(args.position)
    let pos: number
    if (position === 'documentStart') {
      pos = 0
    } else if (position === 'documentEnd') {
      pos = editor.state.doc.content.size
    } else if (position === 'beforeBlock' || position === 'afterBlock') {
      const blockIndex = Number(args.blockIndex)
      const range = resolveBlockRange(editor, blockIndex)
      pos = position === 'beforeBlock' ? range.from : range.to
    } else {
      throw new Error(`Unknown position: ${position}`)
    }
    const ok = editor.chain().insertContentAt(pos, html).run()
    if (!ok) throw new Error('Insert failed: the HTML may be invalid for this position.')
    return okWithOutline(editor, 'Inserted.')
  },
}

const replaceBlocks: DocumentTool = {
  name: 'replace_blocks',
  description:
    'Replace a range of top-level blocks (inclusive) with new HTML content. Use read_document indexes.',
  parameters: {
    type: 'object',
    properties: {
      fromBlock: { type: 'number', description: 'First block index to replace' },
      toBlock: { type: 'number', description: 'Last block index (defaults to fromBlock)' },
      html: { type: 'string', description: 'Replacement HTML content' },
    },
    required: ['fromBlock', 'html'],
    additionalProperties: false,
  },
  execute: (editor, args) => {
    const html = String(args.html || '')
    if (!html.trim()) throw new Error('`html` must not be empty. To remove blocks use delete_blocks.')
    const { from, to, count } = resolveBlockRange(
      editor,
      Number(args.fromBlock),
      args.toBlock === undefined ? undefined : Number(args.toBlock)
    )
    const ok = editor.chain().insertContentAt({ from, to }, html).run()
    if (!ok) throw new Error('Replace failed: the HTML may be invalid.')
    return okWithOutline(editor, `Replaced ${count} block(s).`)
  },
}

const deleteBlocks: DocumentTool = {
  name: 'delete_blocks',
  description: 'Delete a range of top-level blocks (inclusive). Use read_document indexes.',
  parameters: {
    type: 'object',
    properties: {
      fromBlock: { type: 'number', description: 'First block index to delete' },
      toBlock: { type: 'number', description: 'Last block index (defaults to fromBlock)' },
    },
    required: ['fromBlock'],
    additionalProperties: false,
  },
  execute: (editor, args) => {
    const { from, to, count } = resolveBlockRange(
      editor,
      Number(args.fromBlock),
      args.toBlock === undefined ? undefined : Number(args.toBlock)
    )
    const ok = editor.chain().deleteRange({ from, to }).run()
    if (!ok) throw new Error('Delete failed.')
    return okWithOutline(editor, `Deleted ${count} block(s).`)
  },
}

const editText: DocumentTool = {
  name: 'edit_text',
  description:
    'Replace an exact text snippet with new plain text (keeps surrounding formatting). For structural changes use replace_blocks instead.',
  parameters: {
    type: 'object',
    properties: {
      find: { type: 'string', description: 'Exact text to find (case-sensitive)' },
      replace: { type: 'string', description: 'Replacement plain text (may be empty to delete)' },
      occurrence: {
        type: 'number',
        description:
          'Which match to replace, 1-based. Required when there are multiple matches (unless replaceAll).',
      },
      replaceAll: { type: 'boolean', description: 'Replace every match. Default false.' },
    },
    required: ['find', 'replace'],
    additionalProperties: false,
  },
  execute: (editor, args) => {
    const find = String(args.find ?? '')
    const replace = String(args.replace ?? '')

    if (args.replaceAll) {
      // Collect all ranges at once and replace from back to front within a single transaction:
      // earlier positions are unaffected, each original match is replaced exactly once, and one Cmd+Z undoes everything
      const matches = findAllTextRanges(editor, find)
      if (matches.length === 0) throw new Error(`Text not found: "${truncate(find, 60)}"`)
      editor
        .chain()
        .command(({ tr }) => {
          for (let i = matches.length - 1; i >= 0; i--) {
            tr.insertText(replace, matches[i].from, matches[i].to)
          }
          return true
        })
        .run()
      return okWithOutline(editor, `Replaced ${matches.length} occurrence(s).`)
    }

    const occurrence = args.occurrence === undefined ? undefined : Number(args.occurrence)
    const { from, to } = resolveSingleMatch(editor, find, occurrence)
    editor
      .chain()
      .command(({ tr }) => {
        tr.insertText(replace, from, to)
        return true
      })
      .run()
    return okWithOutline(editor, 'Text replaced.')
  },
}

/** Inline format -> mark name and attributes */
const FORMAT_MARKS: Record<string, { mark: string; attrs?: (args: Record<string, unknown>) => Record<string, unknown> }> = {
  bold: { mark: 'bold' },
  italic: { mark: 'italic' },
  underline: { mark: 'underline' },
  strike: { mark: 'strike' },
  code: { mark: 'code' },
  highlight: {
    mark: 'highlight',
    attrs: (args) => (args.color ? { color: String(args.color) } : {}),
  },
  textColor: {
    mark: 'textStyle',
    attrs: (args) => ({ color: String(args.color || '#000000') }),
  },
}

const formatText: DocumentTool = {
  name: 'format_text',
  description:
    'Add or remove inline formatting on an exact text snippet. Formats: bold, italic, underline, strike, code, highlight, textColor. For highlight/textColor pass `color` (hex).',
  parameters: {
    type: 'object',
    properties: {
      find: { type: 'string', description: 'Exact text to format (case-sensitive)' },
      occurrence: {
        type: 'number',
        description: 'Which match, 1-based. Required when there are multiple matches.',
      },
      formats: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['bold', 'italic', 'underline', 'strike', 'code', 'highlight', 'textColor'],
        },
        description: 'Formats to apply or remove',
      },
      action: { type: 'string', enum: ['add', 'remove'], description: 'Default add' },
      color: { type: 'string', description: 'Hex color for highlight/textColor' },
    },
    required: ['find', 'formats'],
    additionalProperties: false,
  },
  execute: (editor, args) => {
    const find = String(args.find ?? '')
    const occurrence = args.occurrence === undefined ? undefined : Number(args.occurrence)
    const formats = Array.isArray(args.formats) ? args.formats.map(String) : []
    if (formats.length === 0) throw new Error('`formats` must not be empty.')
    const action = args.action === 'remove' ? 'remove' : 'add'

    const { from, to } = resolveSingleMatch(editor, find, occurrence)
    let chain = editor.chain().setTextSelection({ from, to })
    for (const format of formats) {
      const def = FORMAT_MARKS[format]
      if (!def) throw new Error(`Unknown format: ${format}`)
      if (action === 'add') {
        chain = chain.setMark(def.mark, def.attrs ? def.attrs(args) : undefined)
      } else if (format === 'textColor') {
        // Cannot unsetMark('textStyle'): it would also clear other textStyle attributes like fontSize/fontFamily
        chain = chain.setMark('textStyle', { color: null })
      } else {
        chain = chain.unsetMark(def.mark)
      }
    }
    const ok = chain.setTextSelection(to).run()
    if (!ok) {
      throw new Error(
        `Formatting failed. The "${formats.join(', ')}" mark(s) may not be enabled in this editor.`
      )
    }
    return okWithOutline(editor, `Formatting ${action === 'add' ? 'applied' : 'removed'}.`)
  },
}

// ============================================================================
// Exports
// ============================================================================

/** All document editing tools (the order is the recommended call priority) */
export const documentTools: DocumentTool[] = [
  readDocument,
  getSelection,
  insertBlocks,
  replaceBlocks,
  deleteBlocks,
  editText,
  formatText,
]

/** Finds a tool by name */
export function getDocumentTool(name: string): DocumentTool | undefined {
  return documentTools.find((t) => t.name === name)
}

/** Converts to the OpenAI function-calling tools array */
export function toOpenAiTools(tools: DocumentTool[] = documentTools) {
  return tools.map((t) => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }))
}
