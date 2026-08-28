/**
 * Basic Components - unified export of basic edition components
 * @description Unified export entry for the basic edition feature modules
 */

// Feature components
export * from './text-format'
export * from './list'
export * from './color'
export * from './heading'
export * from './align'
export * from './image'

// Note:
// - BasicToolbar has been migrated to tools/header-nav/ToolbarNav.vue
// - To use the toolbar, import from tools/header-nav:
//   import { ToolbarNav, BASIC_TOOLBAR_CONFIG } from '@/tools/header-nav'
// - The extension configuration has been migrated to shared/extensions/coreExtensions.ts
//   To use the extensions, import directly from shared/extensions/coreExtensions:
//   import { getExtensionsByVersion, getBasicExtensions } from '@/extensions/coreExtensions'

