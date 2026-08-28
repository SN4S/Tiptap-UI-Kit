/**
 * AI Document Agent - edit documents with text instructions
 * @description Wraps the editor's basic operations into a structured toolset; the AI uses a tool-use loop
 * to write and modify the document according to the user's natural-language instructions.
 */

export {
  documentTools,
  getDocumentTool,
  getDocumentOutline,
  toOpenAiTools,
} from './documentTools'
export type { DocumentTool } from './documentTools'

export { runDocumentAgent, AgentNotConfiguredError } from './agentLoop'
export type {
  AgentCallbacks,
  AgentChatMessage,
  DocumentAgentResult,
  RunDocumentAgentOptions,
} from './agentLoop'

export { default as AiChatPanel } from './AiChatPanel.vue'
