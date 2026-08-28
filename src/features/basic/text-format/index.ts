/**
 * Text Format Components - unified export of text format components
 */
export { default as TextFormatButtons } from './TextFormatButtons.vue'

// Type exports (backward compatibility)
// Note: all text-format-related types (TextFormatType, TextFormatConfig) have been migrated to shared/configs/toolbar.ts
// It is recommended that new code imports directly from shared/configs/toolbar for better type consistency
export type { TextFormatType, TextFormatConfig } from '@/configs/toolbar'

