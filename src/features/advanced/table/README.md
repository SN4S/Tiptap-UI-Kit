# Table - Table Feature Module

The table feature module provides table editing capabilities in the editor, including inserting/deleting rows/columns, merging/splitting cells, background colors, alignment, etc.

## Features

- ✅ Table Insertion Button: Click in toolbar to insert table (default 3x3 with header)
- ✅ Table Toolbar: Floats above table providing extensive table actions
- ✅ Row Operations: Insert rows above/below, delete row
- ✅ Column Operations: Insert columns left/right, delete column
- ✅ Cell Operations: Merge cells, split cells, toggle header row/col
- ✅ Style Settings: Set cell background color, text alignment
- ✅ Table Deletion: One-click deletion of entire table
- ✅ Extension Support: Table cell extension supporting background color and alignment

## Usage

### Basic Usage

#### Using Table Button (Toolbar)

```vue
<template>
  <ToolbarNav :editor="editor" :config="{ table: true }">
    <!-- Other toolbar buttons -->
  </ToolbarNav>
</template>

<script setup lang="ts">
import { ToolbarNav } from '#/components/tiptapPro-tenant/tools/header-nav'
import type { Editor } from '@tiptap/vue-3'

const editor = ref<Editor | null>(null)
</script>
```

#### Using Table Toolbar (Floating Menu)

```vue
<template>
  <TiptapProEditor :editor="editor">
    <TableToolbar :editor="editor" />
  </TiptapProEditor>
</template>

<script setup lang="ts">
import { TableToolbar } from '#/components/tiptapPro-tenant/tools/table-toolbar'
import type { Editor } from '@tiptap/vue-3'

const editor = ref<Editor | null>(null)
</script>
```

#### Using Table Button Alone

```vue
<template>
  <TableButton :editor="editor" />
</template>

<script setup lang="ts">
import { TableButton } from '#/components/tiptapPro-tenant/advanced/table'
import type { Editor } from '@tiptap/vue-3'

const editor = ref<Editor | null>(null)
</script>
```

### Using Extensions in Editor Configuration

```typescript
import { TableCellWithBackground } from '#/components/tiptapPro-tenant/advanced/table'
import { Table, TableRow, TableHeader } from '@tiptap/extension-table'

const editor = new Editor({
  extensions: [
    // ... other extensions
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCellWithBackground, // Use table cell extension supporting background color
  ],
})
```

## Component Description

### TableButton

Table insertion button component for inserting tables from toolbar.

#### Props

| Property | Type | Default | Description |
|------|------|--------|------|
| editor | `Editor \| null \| undefined` | - | Tiptap editor instance |

#### Features

- Click button to insert 3x3 table (with header row)
- If cursor is inside a table, button displays as active
- Button status updates automatically based on table state

### TableToolbar

Table toolbar component; floats automatically when cursor/selection is inside a table.

#### Props

| Property | Type | Default | Description |
|------|------|--------|------|
| editor | `Editor \| null \| undefined` | - | Tiptap editor instance |
| readonly | `boolean` | `false` | Whether read-only mode, toolbar hidden in read-only |
| showMode | `1 \| 2` | `2` | Display mode: 1-only in table, 2-only when cell selected |

#### Features

- **Row Operations**:
  - Insert row above
  - Insert row below
  - Delete current row

- **Column Operations**:
  - Insert column left
  - Insert column right
  - Delete current column

- **Cell Operations**:
  - Merge cells
  - Split cells
  - Toggle header row
  - Toggle header column

- **Style Settings**:
  - Set cell background color (8 preset colors)
  - Set text alignment (left, center, right)

- **Table Deletion**: One-click deletion of entire table

### TableCellWithBackground

Table cell extension supporting background color and alignment.

#### Features

- Supports `backgroundColor` attribute for cell background color
- Supports `textAlign` attribute for cell text alignment
- Compatible with all Tiptap TableKit features

#### Usage Example

```typescript
import { TableCellWithBackground } from '#/components/tiptapPro-tenant/advanced/table'

// Usage in Editor Configuration
const editor = new Editor({
  extensions: [
    Table,
    TableRow,
    TableHeader,
    TableCellWithBackground, // Replace default TableCell
  ],
})

// Set cell background color via commands
editor.chain().focus().setCellAttribute('backgroundColor', '#e3f2fd').run()

// Set cell alignment via commands
editor.chain().focus().setCellAttribute('textAlign', 'center').run()
```

## Constant Usage

```typescript
import { TABLE_CELL_COLORS } from '#/components/tiptapPro-tenant/shared/configs/editorConstants'

// Get all table cell background color options
console.log(TABLE_CELL_COLORS) // ['#ffffff', '#f5f5f5', '#e8f5e9', ...]
```

> **Note**: Constant definitions migrated to `shared/configs/editorConstants.ts`.

## File Structure

```
table/
├── TableButton.vue                # Table insertion button component
├── TableToolbar.vue               # Table toolbar component (floating menu)
├── TableCellWithBackground.ts    # Table cell extension supporting background color
├── TableCell.vue                 # Placeholder component (reserved)
├── index.ts                      # Unified exports
└── README.md                      # Documentation
```

## Style Files

Table related style files are located in `shared/styles/`:

- `table-bubble-menu.css` - Table bubble menu style
- `table-insert-plus.css` - Table insertion button style (if used)

## Notes

1. Ensure the following extensions are configured to use table features:
   - `Table` (from `@tiptap/extension-table`)
   - `TableRow` (from `@tiptap/extension-table-row`)
   - `TableHeader` (from `@tiptap/extension-table-header`)
   - `TableCellWithBackground` (provided by module or default `TableCell`)

2. Table toolbar uses `BubbleMenu` and displays automatically on entering a table or selecting cells

3. Cell background color and alignment features require `TableCellWithBackground` extension

4. Toolbar buttons auto enable/disable based on state (e.g. merge button disabled when unmergableView)

5. Multi-language support is integrated into `locales` module

6. Styles support dark mode

## Migration Notes

Migrated from `tiptapPro/features/table`, preserving same API and features adapted for tenant structure.

