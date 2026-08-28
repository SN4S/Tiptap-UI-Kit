/**
 * TableCellWithBackground - TableCell extension supporting background color
 * @description Extends TableCell from TableKit, adding backgroundColor attribute support
 * Reference: https://tiptap.dev/docs/editor/extensions/table
 */
import { TableCell } from '@tiptap/extension-table'

/**
 * Custom TableCell extension supporting backgroundColor attribute
 * Used for setting background color in table floating toolbar
 */
export const TableCellWithBackground = TableCell.extend({
  addAttributes() {
    return {
      // Inherit all attributes from parent
      ...this.parent?.(),
      // Add backgroundColor attribute
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-background-color') || element.style.backgroundColor || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) {
            return {}
          }
          return {
            'data-background-color': attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`,
          }
        },
      },
      // Add textAlign attribute (if needed by TableToolbar)
      textAlign: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-text-align') || element.style.textAlign || null,
        renderHTML: (attributes) => {
          if (!attributes.textAlign) {
            return {}
          }
          return {
            'data-text-align': attributes.textAlign,
            style: `text-align: ${attributes.textAlign}`,
          }
        },
      },
    }
  },
})

