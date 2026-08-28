/**
 * Font - Font Feature Module
 * @description Provides font, font size, and line height features
 */

// Component exports
export { default as FontFamilySelect } from './FontFamilySelect.vue'
export { default as FontSizeSelect } from './FontSizeSelect.vue'

// Extension exports (re-exported from shared/extensions)
export { FontSize } from '@/extensions/fontSize'
export { LineHeight } from '@/extensions/lineHeight'

// Constants exports (re-exported from shared/configs/editorConstants)
export {
  FONT_FAMILIES,
  FONT_SIZES,
  LINE_HEIGHTS,
  DEFAULT_VALUES,
} from '@/configs/editorConstants'

