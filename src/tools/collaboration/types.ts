/**
 * Collaboration Types - Collaboration Type Definitions
 * @description Collaboration type definitions
 */

/**
 * Collaboration user info
 */
export interface CollaboratorInfo {
  /** User ID */
  id: string | number
  /** User name */
  name: string
  /** User color (for cursor and selection highlight) */
  color: string
}

/**
 * User info (for setting awareness)
 */
export interface UserInfo {
  /** User ID */
  id: string | number
  /** User name */
  name: string
}

/**
 * Collaboration initialization options
 */
export interface CollaborationInitOptions {
  /** Document ID */
  documentId: string
  /** Whether read-only mode */
  readonly?: boolean
  /** Initial content (used for new documents or single-user editing) */
  initialContent?: string | object
  /** Editor instance (used to set initial content) */
  editor?: any
  /** User info getter function */
  getUserInfo?: () => UserInfo
  /** Collaboration status change callback */
  onCollaboratorsChange?: (count: number) => void
  /** Collaboration user list change callback */
  onCollaboratorsListChange?: (users: CollaboratorInfo[]) => void
}

/**
 * Collaboration editing instance
 */
export interface CollaborationInstance {
  /** Yjs document instance */
  doc: any
  /** WebSocket Provider instance */
  provider: any
  /** Set editor instance (used to update reference after editor creation) */
  setEditor?: (editor: any) => void
  /** Destroy function */
  destroy: () => void
}

