/**
 * Simulated Document Agent - AI document assistant demo mode
 * @description Local simulation used when no real AI is configured: lightweight keyword matching of the user's instruction,
 * calls the real documentTools to edit the document and callbacks each step, letting visitors experience "edit the document with text instructions".
 * Consistent with the simulateAiStream demo convention used by other AI features when not configured;
 * a real API Key should be configured by the integrator in the project (VITE_AI_* or the AI settings modal).
 */

import type { Editor } from '@tiptap/core'
import { t } from '@/locales'
import { getDocumentTool } from './documentTools'
import type { AgentCallbacks, DocumentAgentResult } from './agentLoop'

export interface RunSimulatedAgentOptions {
  editor: Editor
  instruction: string
  signal?: AbortSignal
  callbacks?: AgentCallbacks
}

interface SimulatedStep {
  tool: string
  args: Record<string, unknown>
}

/** Interruptible delay (simulates network pacing so the steps feel realistic) */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => resolve(), ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true }
    )
  })
}

/** Take the leading characters of the document's first top-level block that has text (as the search target for the bold demo) */
function firstTextSnippet(editor: Editor, maxLen: number): string {
  let snippet = ''
  editor.state.doc.forEach((node) => {
    if (!snippet) {
      const text = node.textContent.trim()
      if (text) snippet = text.slice(0, maxLen)
    }
  })
  return snippet
}

/** Combine the content of the document's first two blocks with text into a "summary-like" passage */
function summarySource(editor: Editor, maxLen: number): string {
  const parts: string[] = []
  editor.state.doc.forEach((node) => {
    if (parts.length < 2) {
      const text = node.textContent.trim()
      if (text) parts.push(text)
    }
  })
  return parts.join(' · ').slice(0, maxLen)
}

/** Keyword-matching of user instructions -> demo editing script (actually modifies the document) */
function planSteps(editor: Editor, instruction: string): SimulatedStep[] {
  const zhTable = t('aiChat.demo.tableCaption')
  const demoParagraph = t('aiChat.demo.paragraph')
  const end = (html: string): SimulatedStep => ({
    tool: 'insert_blocks',
    args: { position: 'documentEnd', html },
  })

  // Split each instruction type into 2-3 edit steps: cursor flies multiple times, highlight blinks multiple times, making the takeover visible
  if (/表格|table/i.test(instruction)) {
    return [
      end(`<h3>${t('aiChat.demo.sectionTitle')}</h3>`),
      end(
        `<table><tr><th>${t('aiChat.demo.colA')}</th><th>${t('aiChat.demo.colB')}</th><th>${t('aiChat.demo.colC')}</th></tr>` +
          `<tr><td>${zhTable} 1</td><td>—</td><td>—</td></tr>` +
          `<tr><td>${zhTable} 2</td><td>—</td><td>—</td></tr></table>`
      ),
      end(`<p>${demoParagraph}</p>`),
    ]
  }

  if (/总结|總結|摘要|summar/i.test(instruction)) {
    const source = summarySource(editor, 120)
    return [
      end(`<h2>${t('aiChat.demo.summaryTitle')}</h2>`),
      end(`<p>${source || demoParagraph}</p>`),
      end(`<p>${demoParagraph}</p>`),
    ]
  }

  if (/列表|清单|清單|list/i.test(instruction)) {
    return [
      end(`<h3>${t('aiChat.demo.sectionTitle')}</h3>`),
      end(
        `<ul><li>${t('aiChat.demo.listItem')} 1</li><li>${t('aiChat.demo.listItem')} 2</li><li>${t('aiChat.demo.listItem')} 3</li></ul>`
      ),
      end(`<p>${demoParagraph}</p>`),
    ]
  }

  if (/加粗|粗体|粗體|bold/i.test(instruction)) {
    const snippet = firstTextSnippet(editor, 8)
    if (snippet) {
      return [
        { tool: 'format_text', args: { find: snippet, occurrence: 1, formats: ['bold'] } },
        end(`<p>${demoParagraph}</p>`),
      ]
    }
  }

  if (/标题|標題|heading|章节|章節/i.test(instruction)) {
    return [
      end(`<h2>${t('aiChat.demo.sectionTitle')}</h2>`),
      end(`<p>${demoParagraph}</p>`),
      end(`<ul><li>${t('aiChat.demo.listItem')} 1</li><li>${t('aiChat.demo.listItem')} 2</li></ul>`),
    ]
  }

  // Default: heading + paragraph + list, a three-step demo
  return [
    end(`<h3>${t('aiChat.demo.sectionTitle')}</h3>`),
    end(`<p>${demoParagraph}</p>`),
    end(`<ul><li>${t('aiChat.demo.listItem')} 1</li><li>${t('aiChat.demo.listItem')} 2</li></ul>`),
  ]
}

/**
 * Run the demo-mode agent: truly edits the document (undoable with Cmd/Ctrl+Z),
 * renders each step via callbacks, and finally returns a reply with "how to integrate real AI" instructions.
 */
export async function runSimulatedDocumentAgent(
  options: RunSimulatedAgentOptions
): Promise<DocumentAgentResult> {
  const { editor, instruction, signal, callbacks = {} } = options

  // First "read the document" step, matching the feel of the real agent
  await sleep(900, signal)
  const read = getDocumentTool('read_document')!
  callbacks.onToolCall?.('read_document', {})
  const readResult = read.execute(editor, {})
  callbacks.onToolResult?.('read_document', readResult, false)

  let toolCallCount = 1
  const steps = planSteps(editor, instruction)

  for (const step of steps) {
    await sleep(1300, signal)
    if (editor.isDestroyed) throw new Error('Editor was destroyed while the agent was running.')
    const tool = getDocumentTool(step.tool)
    if (!tool) continue
    callbacks.onToolCall?.(step.tool, step.args)
    toolCallCount++
    try {
      const result = tool.execute(editor, step.args)
      callbacks.onToolResult?.(step.tool, result, false)
    } catch (error) {
      // Demo mode should avoid failing: fall back to inserting a demo paragraph on any script failure
      callbacks.onToolResult?.(step.tool, String(error), true)
      const fallback = getDocumentTool('insert_blocks')!
      const result = fallback.execute(editor, {
        position: 'documentEnd',
        html: `<p>${t('aiChat.demo.paragraph')}</p>`,
      })
      callbacks.onToolCall?.('insert_blocks', {})
      toolCallCount++
      callbacks.onToolResult?.('insert_blocks', result, false)
    }
  }

  // Pause briefly after editing so the takeover overlay/cursor finishes naturally
  await sleep(1200, signal)
  const finalText = t('aiChat.demo.done')
  callbacks.onAssistantMessage?.(finalText)
  return { finalText, toolCallCount }
}
