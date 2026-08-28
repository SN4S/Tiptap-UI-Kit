/**
 * Document Agent Loop - document editing AI agent loop
 * @description A tool-use loop based on the OpenAI function-calling format:
 * the model receives the user's natural-language instruction -> calls documentTools to modify the document -> until it produces a final reply.
 * All supported providers (OpenAI/Anthropic/DeepSeek/Aliyun/Ollama/custom) go through the
 * OpenAI-compatible /chat/completions (Anthropic officially provides an OpenAI-compatible layer).
 */

import type { Editor } from '@tiptap/core'
import { getAiConfig, getBaseUrl } from '@/api/ai'
import { getProviderInfo, type AiProvider } from '@/ai/config/types'
import { documentTools, toOpenAiTools, type DocumentTool } from './documentTools'

// ============================================================================
// Types
// ============================================================================

/** Conversation message (a subset of the OpenAI chat format) */
export interface AgentChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
  tool_call_id?: string
}

/** Agent process event callbacks (drive the UI to display steps) */
export interface AgentCallbacks {
  /** The model requests execution of a tool (triggered before execution) */
  onToolCall?: (name: string, args: Record<string, unknown>) => void
  /** Tool execution completed (success or failure) */
  onToolResult?: (name: string, result: string, isError: boolean) => void
  /** The model produced the final text reply */
  onAssistantMessage?: (text: string) => void
}

export interface RunDocumentAgentOptions {
  editor: Editor
  /** The user's natural-language instruction */
  instruction: string
  /** Prior conversation (only user/assistant text turns, used for multi-turn context) */
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  /** Abort signal (stop button) */
  signal?: AbortSignal
  /** Maximum number of tool-call turns, default 12 */
  maxTurns?: number
  /** UI language, used to prompt the model to reply in the same language */
  locale?: string
  /** Custom toolset (defaults to the full set of documentTools) */
  tools?: DocumentTool[]
  callbacks?: AgentCallbacks
}

export interface DocumentAgentResult {
  /** The model's final text reply */
  finalText: string
  /** The number of tool calls executed */
  toolCallCount: number
}

/** Thrown when AI is not configured (no API key); the UI catches it and guides the user to configure */
export class AgentNotConfiguredError extends Error {
  constructor() {
    super('AI is not configured: missing API key.')
    this.name = 'AgentNotConfiguredError'
  }
}

// ============================================================================
// System prompt
// ============================================================================

function buildSystemPrompt(locale?: string): string {
  return [
    'You are a document editing assistant embedded in a rich-text editor.',
    'The user gives natural-language instructions; you edit the document by calling tools.',
    '',
    'Workflow:',
    '1. Call read_document first to see the document structure and block indexes.',
    '2. Make edits with the editing tools. Block indexes change after every edit — rely on the "Document now" outline returned by each tool, or call read_document again.',
    '3. When done, reply with a brief summary of what you changed (no raw HTML in the reply).',
    '',
    'Rules:',
    '- Keep HTML simple: p, h1-h6, ul/ol/li, table/tr/th/td, blockquote, pre/code, strong, em, u, s, a, hr.',
    '- Prefer edit_text/format_text for small inline changes; replace_blocks for structural rewrites.',
    '- Never fabricate document content you have not read.',
    '- If the instruction is ambiguous, make a reasonable choice and mention it in your summary.',
    `- Reply to the user in ${locale === 'zh-CN' ? 'Simplified Chinese' : locale === 'zh-TW' ? 'Traditional Chinese' : 'the same language as their instruction'}.`,
  ].join('\n')
}

// ============================================================================
// Main loop
// ============================================================================

const DEFAULT_MAX_TURNS = 12

/** The start marker of the document outline in a tool result (aligned with documentTools' okWithOutline) */
const OUTLINE_MARKER = '\nDocument now:\n'

/** Truncates stale document outlines in historical tool messages, to avoid repeatedly carrying old outlines and inflating the context */
function supersedeOldOutlines(messages: AgentChatMessage[]): void {
  for (const m of messages) {
    if (m.role !== 'tool' || typeof m.content !== 'string') continue
    const idx = m.content.indexOf(OUTLINE_MARKER)
    if (idx === -1) continue
    m.content = `${m.content.slice(0, idx)}\n(outline superseded by a later edit)`
  }
}

/**
 * Runs the document editing agent
 * @description Blocks until the model gives a final reply, reaches the turn limit, or is interrupted by a signal.
 * Edits take effect in real time through editor transactions (the user can undo at any time with Cmd+Z).
 */
export async function runDocumentAgent(options: RunDocumentAgentOptions): Promise<DocumentAgentResult> {
  const {
    editor,
    instruction,
    history = [],
    signal,
    maxTurns = DEFAULT_MAX_TURNS,
    locale,
    tools = documentTools,
    callbacks = {},
  } = options

  const config = getAiConfig()
  // Only consider it "not configured" when the provider requires an API key and the user hasn't set one (e.g. local Ollama needs no key)
  const providerInfo = getProviderInfo(config.provider as AiProvider)
  if ((providerInfo?.requiresApiKey ?? true) && !config.apiKey) {
    throw new AgentNotConfiguredError()
  }

  const baseUrl = getBaseUrl(config.provider, config.baseUrl)
  const timeout = config.timeout || 60000
  const openAiTools = toOpenAiTools(tools)

  // Omit the Authorization header when apiKey is empty (e.g. Ollama)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`

  const messages: AgentChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(locale) },
    ...history.map((m) => ({ role: m.role, content: m.content }) as AgentChatMessage),
    { role: 'user', content: instruction },
  ]

  let toolCallCount = 0

  for (let turn = 0; turn < maxTurns; turn++) {
    if (editor.isDestroyed) throw new Error('Editor was destroyed while the agent was running.')

    // Timeout fallback: manually combine the external signal with a timeout signal (a compatible alternative to AbortSignal.any)
    const timeoutController = new AbortController()
    const timer = setTimeout(() => timeoutController.abort(), timeout)
    const onExternalAbort = () => timeoutController.abort()
    if (signal?.aborted) timeoutController.abort()
    else signal?.addEventListener('abort', onExternalAbort)

    let data: { choices?: Array<{ message?: Record<string, unknown> }> }
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.model,
          messages,
          tools: openAiTools,
          tool_choice: 'auto',
        }),
        signal: timeoutController.signal,
      })

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`AI API error ${response.status}: ${body.slice(0, 300) || response.statusText}`)
      }

      data = await response.json()
    } catch (error) {
      // User intentionally stopped: let AbortError propagate; otherwise abort could only come from a timeout
      if ((error as Error | null)?.name === 'AbortError' && !signal?.aborted) {
        throw new Error('AI request timeout')
      }
      throw error
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onExternalAbort)
    }

    const message = data.choices?.[0]?.message as
      | { content?: unknown; tool_calls?: AgentChatMessage['tool_calls'] }
      | undefined
    if (!message) throw new Error('AI API returned no message.')

    const toolCalls = message.tool_calls

    if (!toolCalls || toolCalls.length === 0) {
      // Final reply
      const finalText = typeof message.content === 'string' ? message.content : ''
      if (finalText) callbacks.onAssistantMessage?.(finalText)
      return { finalText, toolCallCount }
    }

    // Record the assistant's tool-call message
    messages.push({
      role: 'assistant',
      content: typeof message.content === 'string' ? message.content : null,
      tool_calls: toolCalls,
    })

    // Execute each tool
    for (const call of toolCalls) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      if (editor.isDestroyed) throw new Error('Editor was destroyed while the agent was running.')

      const name = call.function?.name || ''
      let args: Record<string, unknown> = {}
      try {
        args = call.function?.arguments ? JSON.parse(call.function.arguments) : {}
      } catch {
        // Parameter parse failures are still passed back to the model so it can retry
      }

      callbacks.onToolCall?.(name, args)
      toolCallCount++

      let result: string
      let isError = false
      const tool = tools.find((t) => t.name === name)
      if (!tool) {
        result = `Error: unknown tool "${name}". Available: ${tools.map((t) => t.name).join(', ')}`
        isError = true
      } else {
        try {
          result = tool.execute(editor, args)
        } catch (error) {
          result = `Error: ${error instanceof Error ? error.message : String(error)}`
          isError = true
        }
      }

      callbacks.onToolResult?.(name, result, isError)
      // Control history growth: the document outline in old tool results is stale, truncate to a placeholder note,
      // so each request only carries the latest outline
      supersedeOldOutlines(messages)
      messages.push({ role: 'tool', tool_call_id: call.id, content: result })
    }
  }

  // Reached the turn limit: it would be better to let the model know and wrap up, but we return directly to control cost
  return {
    finalText: '',
    toolCallCount,
  }
}
