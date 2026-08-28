/**
 * Page Constants - Page constant configuration
 * @description Dimension constants for A4 page
 */

/**
 * A4 paper width (pixels)
 * Standard A4 size: 210mm × 297mm
 * At 96 DPI: 794px × 1123px
 */
export const A4_WIDTH_PX = 794

/**
 * A4 paper height (pixels)
 */
export const A4_HEIGHT_PX = 1123

/**
 * Page top padding (pixels)
 */
export const PAGE_PADDING_TOP_PX = 96

/**
 * Page bottom padding (pixels)
 */
export const PAGE_PADDING_BOTTOM_PX = 96

/**
 * Page content area height (pixels)
 * Total height minus top and bottom padding
 */
export const PAGE_CONTENT_HEIGHT_PX = A4_HEIGHT_PX - PAGE_PADDING_TOP_PX - PAGE_PADDING_BOTTOM_PX

