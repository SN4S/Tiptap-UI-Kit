/**
 * Version History Module
 * @description Version history system
 */

export * from './types'
export * from './versionManager'
export { useVersionHistory } from './useVersionHistory'
export type { UseVersionHistoryOptions, UseVersionHistoryReturn } from './useVersionHistory'
export { default as VersionHistoryPanel } from './VersionHistoryPanel.vue'
export { default as VersionDiffView } from './VersionDiffView.vue'
