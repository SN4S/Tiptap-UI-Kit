/**
 * Version History Composable
 * @description Version history Vue composable
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'
import type { Editor } from '@tiptap/core'
import type { Version, DiffChange } from './types'
import { DEFAULT_VERSION_HISTORY_CONFIG } from './types'
import { VersionManager } from './versionManager'

export interface UseVersionHistoryOptions {
  /** Editor instance */
  editor: Ref<Editor | null | undefined>
  /** Document ID */
  documentId: string
  /** Maximum version count */
  maxVersions?: number
  /** Auto-save interval (ms) */
  autoSaveInterval?: number
  /** Whether enabled */
  enabled?: boolean
}

export interface UseVersionHistoryReturn {
  // State
  versions: Ref<Version[]>
  selectedVersion: Ref<Version | null>
  compareVersion: Ref<Version | null>
  diffChanges: Ref<DiffChange[]>
  panelOpen: Ref<boolean>
  loading: Ref<boolean>

  // Methods
  saveVersion: (name?: string) => Version | null
  deleteVersion: (versionId: string) => boolean
  renameVersion: (versionId: string, name: string) => boolean
  restoreVersion: (versionId: string) => boolean
  selectVersion: (versionId: string | null) => void
  setCompareVersion: (versionId: string | null) => void
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
  refreshVersions: () => void
}

/**
 * Version History composable
 */
export function useVersionHistory(options: UseVersionHistoryOptions): UseVersionHistoryReturn {
  const {
    editor,
    documentId,
    maxVersions = DEFAULT_VERSION_HISTORY_CONFIG.maxVersions,
    autoSaveInterval = DEFAULT_VERSION_HISTORY_CONFIG.autoSaveInterval,
    enabled = DEFAULT_VERSION_HISTORY_CONFIG.enabled,
  } = options

  // State
  const versions = ref<Version[]>([])
  const selectedVersionId = ref<string | null>(null)
  const compareVersionId = ref<string | null>(null)
  const panelOpen = ref(false)
  const loading = ref(false)

  // Manager instance
  let manager: VersionManager | null = null
  let autoSaveTimer: ReturnType<typeof setInterval> | null = null

  // Computed properties
  const selectedVersion = computed(() => {
    if (!selectedVersionId.value) return null
    return versions.value.find(v => v.id === selectedVersionId.value) || null
  })

  const compareVersion = computed(() => {
    if (!compareVersionId.value) return null
    return versions.value.find(v => v.id === compareVersionId.value) || null
  })

  const diffChanges = computed(() => {
    if (!selectedVersionId.value || !compareVersionId.value || !manager) {
      return []
    }
    return manager.compareVersions(compareVersionId.value, selectedVersionId.value)
  })

  // Initialize
  function init() {
    if (!enabled || !documentId) return

    manager = new VersionManager({
      documentId,
      maxVersions,
      autoSaveInterval,
      enabled,
    })

    refreshVersions()
    startAutoSave()
  }

  // Refresh version list
  function refreshVersions() {
    if (!manager) return
    versions.value = manager.getVersions()
  }

  // Save version
  function saveVersion(name?: string): Version | null {
    if (!manager || !editor.value) return null

    const content = editor.value.getJSON()
    const version = manager.saveVersion(content, name, false)
    refreshVersions()
    return version
  }

  // Delete version
  function deleteVersion(versionId: string): boolean {
    if (!manager) return false

    const result = manager.deleteVersion(versionId)
    if (result) {
      refreshVersions()
      // If deleted version is currently selected, clear selection
      if (selectedVersionId.value === versionId) {
        selectedVersionId.value = null
      }
      if (compareVersionId.value === versionId) {
        compareVersionId.value = null
      }
    }
    return result
  }

  // Rename version
  function renameVersion(versionId: string, name: string): boolean {
    if (!manager) return false

    const result = manager.renameVersion(versionId, name)
    if (result) {
      refreshVersions()
    }
    return result
  }

  // Restore version
  function restoreVersion(versionId: string): boolean {
    if (!manager || !editor.value) return false

    const version = manager.getVersion(versionId)
    if (!version) return false

    // Save current version first
    const content = editor.value.getJSON()
    if (manager.shouldAutoSave(content)) {
      manager.saveVersion(content, undefined, true)
    }

    // Restore content
    editor.value.commands.setContent(version.content)
    refreshVersions()

    return true
  }

  // Select version (preview)
  function selectVersion(versionId: string | null) {
    selectedVersionId.value = versionId
  }

  // Set compare version
  function setCompareVersion(versionId: string | null) {
    compareVersionId.value = versionId
  }

  // Panel control
  function openPanel() {
    panelOpen.value = true
    refreshVersions()
  }

  function closePanel() {
    panelOpen.value = false
    selectedVersionId.value = null
    compareVersionId.value = null
  }

  function togglePanel() {
    if (panelOpen.value) {
      closePanel()
    } else {
      openPanel()
    }
  }

  // Auto-save
  function startAutoSave() {
    if (!enabled || autoSaveInterval <= 0) return

    stopAutoSave()

    autoSaveTimer = setInterval(() => {
      if (!manager || !editor.value) return

      const content = editor.value.getJSON()
      if (manager.shouldAutoSave(content)) {
        manager.saveVersion(content, undefined, true)
        refreshVersions()
      }
    }, autoSaveInterval)
  }

  function stopAutoSave() {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  // Lifecycle
  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    stopAutoSave()
  })

  // Watch documentId changes
  watch(() => documentId, (newId, oldId) => {
    if (newId !== oldId) {
      stopAutoSave()
      selectedVersionId.value = null
      compareVersionId.value = null
      init()
    }
  })

  return {
    // State
    versions,
    selectedVersion,
    compareVersion,
    diffChanges,
    panelOpen,
    loading,

    // Methods
    saveVersion,
    deleteVersion,
    renameVersion,
    restoreVersion,
    selectVersion,
    setCompareVersion,
    openPanel,
    closePanel,
    togglePanel,
    refreshVersions,
  }
}
