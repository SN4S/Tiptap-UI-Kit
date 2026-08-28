/**
 * Version History Types
 * @description Type definitions for the version history system
 */

import type { JSONContent } from '@tiptap/core'

/** Version record */
export interface Version {
  /** Version ID */
  id: string
  /** Version name (optional, user can manually name) */
  name?: string
  /** Document content (JSON format) */
  content: JSONContent
  /** Creation timestamp */
  createdAt: number
  /** Whether it's an auto-save */
  isAutoSave: boolean
  /** Word count */
  wordCount?: number
}

/** Version diff */
export interface VersionDiff {
  /** Old version ID */
  oldVersionId: string
  /** New version ID */
  newVersionId: string
  /** Diff content (line-level) */
  changes: DiffChange[]
}

/** Diff change item */
export interface DiffChange {
  /** Change type */
  type: 'add' | 'remove' | 'unchanged'
  /** Text content */
  text: string
  /** Line number */
  lineNumber?: number
}

/** Version history config */
export interface VersionHistoryConfig {
  /** Document ID (for storage isolation) */
  documentId: string
  /** Maximum saved version count */
  maxVersions?: number
  /** Auto-save interval (ms), 0 means disabled */
  autoSaveInterval?: number
  /** Whether enabled */
  enabled?: boolean
}

/** Version history state */
export interface VersionHistoryState {
  /** All versions */
  versions: Version[]
  /** Currently selected version ID (for preview) */
  selectedVersionId: string | null
  /** Comparison version ID (for diff view) */
  compareVersionId: string | null
  /** Whether loading */
  loading: boolean
  /** Whether panel is open */
  panelOpen: boolean
}

/** Default config */
export const DEFAULT_VERSION_HISTORY_CONFIG: Required<Omit<VersionHistoryConfig, 'documentId'>> = {
  maxVersions: 50,
  autoSaveInterval: 60000, // 1 minute
  enabled: true,
}

/** Storage key prefix */
export const STORAGE_KEY_PREFIX = 'tiptap-version-history'
