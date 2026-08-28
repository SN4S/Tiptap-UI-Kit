/**
 * Collaboration - Core collaboration logic
 * @description Provides real-time collaboration features using Yjs + WebSocket
 */

import type { AnyExtension } from '@tiptap/core'
import type { CollaborationInitOptions, CollaborationInstance, UserInfo } from './types'
import {
  getRandomColor,
  TimerManager,
  EventManager,
  isDocumentEmpty,
  getUniqueUsers,
  logger,
  normalizeWebSocketUrl,
  debounce,
} from './utils'

// Re-export getRandomColor for backward API compatibility
export { getRandomColor }

/** Default empty document */
const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] }

/** Configuration constants */
const CONFIG = {
  /** Maximum retry count waiting for editor creation */
  MAX_EDITOR_WAIT_RETRIES: 10,
  /** Retry interval (ms) */
  RETRY_INTERVAL: 500,
  /** Initialization delay (ms) */
  INIT_DELAY: 1000,
  /** Debounce delay (ms) */
  DEBOUNCE_DELAY: 200,
}

/**
 * Normalize content format
 * @description Ensures content is a complete document object (type: 'doc')
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeContent(content: any, options?: { silent?: boolean }): any {
  if (!content) return EMPTY_DOC
  if (typeof content === 'string') return content

  const log = options?.silent ? (() => {}) : logger.info.bind(logger)

  if (Array.isArray(content)) {
    log('Array format content, wrapping as document object')
    return { type: 'doc', content }
  }

  if (typeof content === 'object') {
    if (content.type === 'doc') return content
    if (Array.isArray(content.content)) {
      log('Non-doc type object, wrapping as document object')
      return { type: 'doc', content: content.content }
    }
    log('Single node object, wrapping as document object')
    return { type: 'doc', content: [content] }
  }

  logger.warn('Unknown content format, using empty document')
  return EMPTY_DOC
}

/** Get content node count */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getContentLength(content: any): number {
  if (Array.isArray(content)) return content.length
  return content?.content?.length ?? 0
}

/**
 * Determine whether to use initialContent
 */
function shouldUseInitialContent(
  isEmpty: boolean,
  onlineCount: number,
  initialContent: any,
  currentContent: any
): boolean {
  // Document empty -> use initialContent
  if (isEmpty) {
    logger.info('Document is empty, using initialContent')
    return true
  }
  
  // Single user editing -> use initialContent
  if (onlineCount <= 1) {
    logger.info('Single user editing, using initialContent')
    return true
  }
  
  // Multi-user collaboration -> compare content length
  const initialLen = getContentLength(initialContent)
  const currentLen = getContentLength(currentContent)
  
  if (initialLen > 0 && initialLen !== currentLen) {
    logger.info('Content length mismatch, using initialContent', { initialLen, currentLen })
    return true
  }
  
  logger.info('Multi-user collaboration, using Yjs data')
  return false
}

/**
 * Initialize Yjs collaboration
 */
export async function initCollaboration(
  options: CollaborationInitOptions
): Promise<CollaborationInstance | null> {
  const {
    documentId,
    readonly = false,
    initialContent,
    editor,
    getUserInfo: getUserInfoFn,
    onCollaboratorsChange,
    onCollaboratorsListChange,
  } = options

  if (readonly || !documentId) {
    logger.info('Collaboration feature disabled', { readonly, hasDocId: !!documentId })
    return null
  }

  try {
    logger.info('Initializing collaboration, document ID:', documentId)

    // Import dependencies in parallel
    const [{ getWebSocketUrl }, Y, { WebsocketProvider }] = await Promise.all([
      import('@/api/websocket'),
      import('yjs'),
      import('y-websocket'),
    ])

    // Get WebSocket URL
    const wsUrl = normalizeWebSocketUrl(getWebSocketUrl(documentId))
    if (!wsUrl) {
      logger.error('Invalid WebSocket URL')
      return null
    }

    // Create Yjs document and Provider
    const doc = new Y.Doc()
    const roomName = `document-${documentId}`
    const wsProvider = new WebsocketProvider(wsUrl, roomName, doc, { connect: true })

    // Utility manager
    const timerManager = new TimerManager()
    const eventManager = new EventManager()

    // User info
    const userInfo = getUserInfoFn?.() ?? { id: 'anonymous', name: 'Anonymous User' }
    const userColor = getRandomColor()

    const setUserInfo = () => {
      wsProvider.awareness.setLocalStateField('user', {
        id: userInfo.id,
        name: userInfo.name,
        color: userColor,
      })
    }

    const getRoomStatus = () => {
      const users = getUniqueUsers(wsProvider.awareness)
      return { users, count: users.length }
    }

    // State variables
    let currentEditor = editor
    let contentInitialized = false
    let syncProcessed = false
    let retryCount = 0

    // WebSocket state handling
    eventManager.on(wsProvider, 'status', ({ status }: { status: string }) => {
      logger.info('Connection status:', status)
      if (status === 'connected') setUserInfo()
    })

    // Sync handling
    const handleSync = (isSynced: boolean) => {
      if (!isSynced || (syncProcessed && contentInitialized)) return

      // Wait for editor
      if (!currentEditor) {
        if (retryCount >= CONFIG.MAX_EDITOR_WAIT_RETRIES) {
          logger.warn('Editor wait timeout')
          syncProcessed = true
          return
        }
        retryCount++
        timerManager.setTimeout(() => {
          currentEditor = options.editor ?? currentEditor
          handleSync(true)
        }, CONFIG.RETRY_INTERVAL)
        return
      }

      // Content initialization
      if (initialContent && !contentInitialized && !syncProcessed) {
        syncProcessed = true
        
        timerManager.setTimeout(() => {
          if (contentInitialized) return
          
          currentEditor = currentEditor || options.editor
          if (!currentEditor) {
            logger.warn('Editor not created, skipping content initialization')
            return
          }

          const { count } = getRoomStatus()
          const currentContent = currentEditor.getJSON()
          const isEmpty = isDocumentEmpty(currentContent)
          
          contentInitialized = true

          if (shouldUseInitialContent(isEmpty, count, initialContent, currentContent)) {
            currentEditor.commands.setContent(normalizeContent(initialContent))
          }
        }, CONFIG.RETRY_INTERVAL)
      }
    }
    eventManager.on(wsProvider, 'sync', handleSync)

    // Collaborators change (debounced)
    const debouncedUpdate = debounce(() => {
      const { users, count } = getRoomStatus()
      onCollaboratorsChange?.(count)
      onCollaboratorsListChange?.(users)
    }, CONFIG.DEBOUNCE_DELAY)
    eventManager.on(wsProvider.awareness, 'change', debouncedUpdate.run)

    // Cleanup function
    const cleanup = () => {
      debouncedUpdate.cancel()
      timerManager.clearAll()
      eventManager.removeAll()
    }

    // Wrap destroy
    const originalDestroy = wsProvider.destroy?.bind(wsProvider)
    wsProvider.destroy = () => {
      cleanup()
      originalDestroy?.()
    }

    // Initialization
    setUserInfo()
    timerManager.setTimeout(() => {
      const { users, count } = getRoomStatus()
      onCollaboratorsChange?.(count)
      onCollaboratorsListChange?.(users)
    }, CONFIG.INIT_DELAY)

    logger.success('Collaboration initialized successfully, room:', roomName)

    return {
      doc,
      provider: wsProvider,
      setEditor: (newEditor: any) => {
        currentEditor = newEditor
        if (wsProvider.synced && !contentInitialized) {
          handleSync(true)
        }
      },
      destroy: () => {
        cleanup()
        try { wsProvider.destroy() } catch {}
        try { doc.destroy() } catch {}
        logger.success('Collaboration instance destroyed')
      },
    }
  } catch (error) {
    logger.error('Initialization failed:', error)
    return null
  }
}

/**
 * Create collaboration editing extension
 */
export async function createCollaborationExtensions(
  instance: CollaborationInstance | null,
  getUserInfo?: () => UserInfo
): Promise<AnyExtension[]> {
  if (!instance) return []

  const [Collaboration, CollaborationCursor] = await Promise.all([
    import('@tiptap/extension-collaboration').then(m => m.default),
    import('@tiptap/extension-collaboration-cursor').then(m => m.default),
  ])

  const user = getUserInfo?.() ?? { id: 'anonymous', name: 'Anonymous User' }

  return [
    Collaboration.configure({ document: instance.doc }),
    CollaborationCursor.configure({
      provider: instance.provider,
      user: { id: user.id, name: user.name, color: getRandomColor() },
    }),
  ]
}
