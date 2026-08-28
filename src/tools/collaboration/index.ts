/**
 * Collaboration - Collaboration Tool Module
 * @description Provides real-time collaboration features using Yjs + WebSocket
 */

// Type exports
export * from './types'

// Core features
export {
  initCollaboration,
  createCollaborationExtensions,
  normalizeContent,
  getRandomColor,
} from './collaboration'

// Helper functions
export {
  logger,
  TimerManager,
  EventManager,
  isDocumentEmpty,
  getUniqueUsers,
  normalizeWebSocketUrl,
  debounce,
} from './utils'

// Composable
export { useCollaboration } from './useCollaboration'
export type { UseCollaborationOptions, UseCollaborationReturn } from './useCollaboration'

// Components
export { default as CollaborationToggle } from './CollaborationToggle.vue'

// Style files need to be imported separately when used
// import './tools/collaboration/collaboration.css'

