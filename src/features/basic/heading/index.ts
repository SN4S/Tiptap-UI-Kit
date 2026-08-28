/**
 * Heading Components - unified export of heading components
 */
export { default as HeadingDropdown } from './HeadingDropdown.vue'
export { default as HeadingButtons } from './HeadingButtons.vue'

// Type exports (backward compatibility)
// Note: all heading-related types (HeadingLevel, HeadingValue, HeadingConfig) have been migrated to shared/configs/toolbar.ts
// It is recommended that new code imports directly from shared/configs/toolbar for better type consistency
export type { HeadingLevel, HeadingValue, HeadingConfig } from '@/configs/toolbar'

