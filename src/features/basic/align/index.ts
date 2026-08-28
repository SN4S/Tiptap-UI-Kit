/**
 * Align Components - unified export of alignment components
 */
export { default as AlignDropdown } from './AlignDropdown.vue'

// Type exports (backward compatibility)
// Note: all alignment-related types (AlignValue, AlignToolConfig) have been migrated to shared/configs/toolbar.ts
// It is recommended that new code imports directly from shared/configs/toolbar for better type consistency
export type { AlignValue } from '@/configs/toolbar'

