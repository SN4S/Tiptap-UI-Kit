/**
 * Version Manager
 * @description Version history localStorage manager
 */

import type { JSONContent } from '@tiptap/core'
import type { Version, VersionHistoryConfig, DiffChange } from './types'
import { STORAGE_KEY_PREFIX, DEFAULT_VERSION_HISTORY_CONFIG } from './types'

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Get storage key
 */
function getStorageKey(documentId: string): string {
  return `${STORAGE_KEY_PREFIX}-${documentId}`
}

/**
 * Safe localStorage operations
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/**
 * Convert JSON content to plain text (for diffing and word count)
 */
export function jsonToPlainText(content: JSONContent): string {
  if (!content) return ''

  const extractText = (node: JSONContent): string => {
    if (node.type === 'text' && node.text) {
      return node.text
    }

    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join('')
    }

    return ''
  }

  const nodes = content.content || []
  return nodes
    .map((node: JSONContent) => extractText(node))
    .filter(Boolean)
    .join('\n')
}

/**
 * Count words
 */
export function countWords(text: string): number {
  // Chinese characters counted individually, English words counted by word
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = text
    .replace(/[\u4e00-\u9fa5]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0).length
  return chineseChars + englishWords
}

/**
 * Simple text diff comparison
 */
export function computeDiff(oldText: string, newText: string): DiffChange[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const changes: DiffChange[] = []

  // Use simple LCS algorithm for comparison
  const maxLen = Math.max(oldLines.length, newLines.length)

  let oldIdx = 0
  let newIdx = 0

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldLines[oldIdx]
    const newLine = newLines[newIdx]

    if (oldIdx >= oldLines.length) {
      // Added line
      changes.push({ type: 'add', text: newLine, lineNumber: newIdx + 1 })
      newIdx++
    } else if (newIdx >= newLines.length) {
      // Removed line
      changes.push({ type: 'remove', text: oldLine, lineNumber: oldIdx + 1 })
      oldIdx++
    } else if (oldLine === newLine) {
      // Same line
      changes.push({ type: 'unchanged', text: newLine, lineNumber: newIdx + 1 })
      oldIdx++
      newIdx++
    } else {
      // Find next matching point
      let foundInNew = newLines.slice(newIdx + 1).indexOf(oldLine)
      let foundInOld = oldLines.slice(oldIdx + 1).indexOf(newLine)

      if (foundInNew >= 0 && (foundInOld < 0 || foundInNew <= foundInOld)) {
        // New version has insertion
        changes.push({ type: 'add', text: newLine, lineNumber: newIdx + 1 })
        newIdx++
      } else if (foundInOld >= 0) {
        // Old version has deletion
        changes.push({ type: 'remove', text: oldLine, lineNumber: oldIdx + 1 })
        oldIdx++
      } else {
        // Modified
        changes.push({ type: 'remove', text: oldLine, lineNumber: oldIdx + 1 })
        changes.push({ type: 'add', text: newLine, lineNumber: newIdx + 1 })
        oldIdx++
        newIdx++
      }
    }

    // Prevent infinite loop
    if (oldIdx + newIdx > maxLen * 3) break
  }

  return changes
}

/**
 * Version Manager
 */
export class VersionManager {
  private documentId: string
  private config: Required<Omit<VersionHistoryConfig, 'documentId'>>

  constructor(config: VersionHistoryConfig) {
    this.documentId = config.documentId
    this.config = {
      maxVersions: config.maxVersions ?? DEFAULT_VERSION_HISTORY_CONFIG.maxVersions,
      autoSaveInterval: config.autoSaveInterval ?? DEFAULT_VERSION_HISTORY_CONFIG.autoSaveInterval,
      enabled: config.enabled ?? DEFAULT_VERSION_HISTORY_CONFIG.enabled,
    }
  }

  /**
   * Get all versions
   */
  getVersions(): Version[] {
    const data = safeGetItem(getStorageKey(this.documentId))
    if (!data) return []

    try {
      const versions = JSON.parse(data) as Version[]
      // Sort by time in descending order
      return versions.sort((a, b) => b.createdAt - a.createdAt)
    } catch {
      return []
    }
  }

  /**
   * Get a single version
   */
  getVersion(versionId: string): Version | null {
    const versions = this.getVersions()
    return versions.find(v => v.id === versionId) || null
  }

  /**
   * Save new version
   */
  saveVersion(content: JSONContent, name?: string, isAutoSave: boolean = false): Version {
    const versions = this.getVersions()
    const plainText = jsonToPlainText(content)

    const newVersion: Version = {
      id: generateId(),
      name,
      content,
      createdAt: Date.now(),
      isAutoSave,
      wordCount: countWords(plainText),
    }

    // Add to beginning
    versions.unshift(newVersion)

    // Limit version count
    const trimmedVersions = versions.slice(0, this.config.maxVersions)

    // Save
    safeSetItem(getStorageKey(this.documentId), JSON.stringify(trimmedVersions))

    return newVersion
  }

  /**
   * Delete version
   */
  deleteVersion(versionId: string): boolean {
    const versions = this.getVersions()
    const filtered = versions.filter(v => v.id !== versionId)

    if (filtered.length === versions.length) {
      return false
    }

    safeSetItem(getStorageKey(this.documentId), JSON.stringify(filtered))
    return true
  }

  /**
   * Rename version
   */
  renameVersion(versionId: string, name: string): boolean {
    const versions = this.getVersions()
    const version = versions.find(v => v.id === versionId)

    if (!version) return false

    version.name = name
    safeSetItem(getStorageKey(this.documentId), JSON.stringify(versions))
    return true
  }

  /**
   * Compare two versions
   */
  compareVersions(oldVersionId: string, newVersionId: string): DiffChange[] {
    const oldVersion = this.getVersion(oldVersionId)
    const newVersion = this.getVersion(newVersionId)

    if (!oldVersion || !newVersion) return []

    const oldText = jsonToPlainText(oldVersion.content)
    const newText = jsonToPlainText(newVersion.content)

    return computeDiff(oldText, newText)
  }

  /**
   * Clear all versions
   */
  clearAllVersions(): void {
    try {
      localStorage.removeItem(getStorageKey(this.documentId))
    } catch {
      // ignore
    }
  }

  /**
   * Check if auto-save should trigger (content has changed)
   */
  shouldAutoSave(content: JSONContent): boolean {
    const versions = this.getVersions()
    if (versions.length === 0) return true

    const latestVersion = versions[0]
    const currentText = jsonToPlainText(content)
    const latestText = jsonToPlainText(latestVersion.content)

    // Only save if content is different
    return currentText !== latestText
  }
}

/**
 * Create version manager
 */
export function createVersionManager(config: VersionHistoryConfig): VersionManager {
  return new VersionManager(config)
}
