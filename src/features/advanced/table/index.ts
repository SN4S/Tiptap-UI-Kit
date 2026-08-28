/**
 * Table Feature Module
 * @description Table feature module unified exports
 * @deprecated TableToolbar has been migrated to tools/table-toolbar, please import from new path
 */
// Export TableButton locally
export { default as TableButton } from './TableButton.vue'
// Re-export TableToolbar from new location for backward compatibility
export { TableToolbar } from '@/tools/table-toolbar'
export { TableCellWithBackground } from './TableCellWithBackground'

