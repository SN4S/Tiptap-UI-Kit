/**
 * documentTools unit tests (headless Editor)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { documentTools, getDocumentTool, getDocumentOutline, toOpenAiTools } from '../documentTools'

let editor: Editor

function run(name: string, args: Record<string, unknown> = {}): string {
  const tool = getDocumentTool(name)
  if (!tool) throw new Error(`tool not found: ${name}`)
  return tool.execute(editor, args)
}

beforeEach(() => {
  editor = new Editor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Table,
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '<h1>Heading 1</h1><p>This is the <strong>first paragraph</strong> text.</p><p>Second paragraph text.</p>',
  })
})

afterEach(() => {
  editor.destroy()
})

describe('read_document / outline', () => {
  it('lists blocks with indexes and types', () => {
    const result = run('read_document')
    expect(result).toContain('3 block(s)')
    expect(result).toContain('[0] h1: Heading 1')
    expect(result).toContain('[1] p: This is the first paragraph text.')
    expect(result).toContain('[2] p: Second paragraph text.')
  })

  it('outline truncates long blocks', () => {
    editor.commands.setContent(`<p>${'Long'.repeat(300)}</p>`)
    const outline = getDocumentOutline(editor, 100)
    expect(outline).toContain('…')
    expect(outline.length).toBeLessThan(200)
  })
})

describe('get_selection', () => {
  it('reports no selection', () => {
    expect(run('get_selection')).toContain('No text is selected')
  })

  it('returns selected text', () => {
    editor.commands.setTextSelection({ from: 1, to: 5 })
    expect(run('get_selection')).toContain('Head')
  })
})

describe('insert_blocks', () => {
  it('inserts at document end', () => {
    run('insert_blocks', { html: '<p>New paragraph</p>', position: 'documentEnd' })
    expect(editor.getHTML()).toContain('New paragraph')
    expect(run('read_document')).toContain('[3] p: New paragraph')
  })

  it('inserts before a block', () => {
    run('insert_blocks', { html: '<h2>Inserted heading</h2>', position: 'beforeBlock', blockIndex: 1 })
    expect(run('read_document')).toContain('[1] h2: Inserted heading')
  })

  it('inserts after a block', () => {
    run('insert_blocks', { html: '<p>Inserted after heading</p>', position: 'afterBlock', blockIndex: 0 })
    expect(run('read_document')).toContain('[1] p: Inserted after heading')
  })

  it('inserts a table', () => {
    run('insert_blocks', {
      html: '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>',
      position: 'documentEnd',
    })
    expect(run('read_document')).toMatch(/table 2x2/)
  })

  it('rejects empty html', () => {
    expect(() => run('insert_blocks', { html: '  ', position: 'documentEnd' })).toThrow()
  })
})

describe('replace_blocks', () => {
  it('replaces a single block', () => {
    run('replace_blocks', { fromBlock: 2, html: '<h2>Replaced heading</h2>' })
    const outline = run('read_document')
    expect(outline).toContain('[2] h2: Replaced heading')
    expect(outline).not.toContain('Second paragraph text')
  })

  it('replaces a range of blocks', () => {
    run('replace_blocks', { fromBlock: 1, toBlock: 2, html: '<p>Merged into one paragraph</p>' })
    const outline = run('read_document')
    expect(outline).toContain('2 block(s)')
    expect(outline).toContain('[1] p: Merged into one paragraph')
  })

  it('rejects out-of-range indexes with helpful error', () => {
    expect(() => run('replace_blocks', { fromBlock: 99, html: '<p>x</p>' })).toThrow(/0-2/)
  })
})

describe('delete_blocks', () => {
  it('deletes one block', () => {
    run('delete_blocks', { fromBlock: 0 })
    const outline = run('read_document')
    expect(outline).toContain('2 block(s)')
    expect(outline).not.toContain('Heading 1')
  })

  it('deletes a range (trailing empty paragraph is kept by the editor)', () => {
    run('delete_blocks', { fromBlock: 1, toBlock: 2 })
    const outline = run('read_document')
    // StarterKit's TrailingNode keeps an empty paragraph at the end of the document; this is an editor interaction design
    expect(outline).toContain('Heading 1')
    expect(outline).not.toContain('Second paragraph')
    expect(outline).not.toContain('first paragraph')
  })
})

describe('edit_text', () => {
  it('replaces first occurrence and keeps formatting around', () => {
    run('edit_text', { find: 'first paragraph', replace: 'lead paragraph' })
    const html = editor.getHTML()
    expect(html).toContain('lead paragraph')
    expect(html).not.toContain('first paragraph')
    // The bold mark is still present
    expect(html).toContain('<strong>')
  })

  it('matches text spanning mark boundaries', () => {
    // "This is the first paragraph" spans plain text ("This is the ") and strong ("first paragraph")
    run('edit_text', { find: 'This is the first paragraph', replace: 'This section' })
    expect(editor.state.doc.textContent).toContain('This section text')
  })

  it('replaces the nth occurrence', () => {
    editor.commands.setContent('<p>Apple One</p><p>Apple Two</p>')
    run('edit_text', { find: 'Apple', replace: 'Banana', occurrence: 2 })
    const text = editor.state.doc.textContent
    expect(text).toContain('Apple One')
    expect(text).toContain('Banana Two')
  })

  it('replaceAll replaces every occurrence', () => {
    editor.commands.setContent('<p>cat and cat and cat</p>')
    const result = run('edit_text', { find: 'cat', replace: 'dog', replaceAll: true })
    expect(result).toContain('3 occurrence(s)')
    expect(editor.state.doc.textContent).toBe('dog and dog and dog')
  })

  it('replaceAll where replacement contains the find replaces each original match exactly once', () => {
    // 'a' -> 'aa': must not explode exponentially; each original match is replaced exactly once
    editor.commands.setContent('<p>a & a & a</p>')
    const result = run('edit_text', { find: 'a', replace: 'aa', replaceAll: true })
    expect(result).toContain('3 occurrence(s)')
    expect(editor.state.doc.textContent).toBe('aa & aa & aa')
  })

  it('does not match text spanning table cells', () => {
    editor.commands.setContent('<table><tr><td>Price</td><td>100</td></tr></table>')
    // 'ce100' spans two cells, so it must not be considered a match
    expect(() => run('edit_text', { find: 'ce100', replace: 'x' })).toThrow(/not found/i)
    // Text inside a single cell can still be matched normally
    run('edit_text', { find: '100', replace: '200' })
    expect(editor.state.doc.textContent).toContain('200')
  })

  it('throws when multiple matches and no occurrence is given', () => {
    editor.commands.setContent('<p>Apple One</p><p>Apple Two</p>')
    expect(() => run('edit_text', { find: 'Apple', replace: 'Banana' })).toThrow(/occurrence \(1-2\)/i)
    // The document was not modified
    expect(editor.state.doc.textContent).toContain('Apple One')
    expect(editor.state.doc.textContent).toContain('Apple Two')
  })

  it('throws helpful error when text not found', () => {
    expect(() => run('edit_text', { find: 'Nonexistent text', replace: 'x' })).toThrow(/not found/i)
  })
})

describe('format_text', () => {
  it('applies bold and italic', () => {
    run('format_text', { find: 'Second paragraph', formats: ['bold', 'italic'] })
    expect(editor.getHTML()).toMatch(/<(strong|em)>.*<(strong|em)>?/)
    const html = editor.getHTML()
    expect(html).toContain('strong')
    expect(html).toContain('em')
  })

  it('removes bold', () => {
    run('format_text', { find: 'first paragraph', formats: ['bold'], action: 'remove' })
    expect(editor.getHTML()).not.toContain('<strong>')
  })

  it('applies text color', () => {
    run('format_text', { find: 'Heading 1', formats: ['textColor'], color: '#ff0000' })
    expect(editor.getHTML()).toContain('#ff0000')
  })

  it('applies highlight with color', () => {
    run('format_text', { find: 'Second paragraph', formats: ['highlight'], color: '#ffff00' })
    expect(editor.getHTML()).toContain('mark')
  })

  it('throws when multiple matches and no occurrence is given', () => {
    editor.commands.setContent('<p>Key</p><p>Key</p>')
    expect(() => run('format_text', { find: 'Key', formats: ['bold'] })).toThrow(/occurrence \(1-2\)/i)
  })

  it('removes textColor by clearing only the color attribute (no throw, color gone)', () => {
    run('format_text', { find: 'Heading 1', formats: ['textColor'], color: '#ff0000' })
    expect(editor.getHTML()).toContain('#ff0000')
    // remove uses setMark('textStyle', { color: null }), not unsetMark on the whole textStyle,
    // so as not to also clear other textStyle attributes like fontSize/fontFamily (this test environment has no fontSize extension;
    // it only verifies that no error is thrown and the color is removed)
    run('format_text', { find: 'Heading 1', formats: ['textColor'], action: 'remove' })
    expect(editor.getHTML()).not.toContain('#ff0000')
  })
})

describe('OpenAI tools export', () => {
  it('produces valid function definitions', () => {
    const tools = toOpenAiTools()
    expect(tools).toHaveLength(documentTools.length)
    for (const t of tools) {
      expect(t.type).toBe('function')
      expect(t.function.name).toBeTruthy()
      expect(t.function.description).toBeTruthy()
      expect(t.function.parameters).toHaveProperty('type', 'object')
    }
  })
})
