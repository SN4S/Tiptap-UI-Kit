# Font - Font Feature Module

The font feature module provides capabilities for setting font family, font size, and line height in the editor.

## Features

- ✅ Font family selector: supports selecting font families
- ✅ Font size selector: supports selecting font sizes
- ✅ Line height extension: supports setting paragraph and heading line height
- ✅ Font size extension: supports setting text font sizes
- ✅ Automatic state synchronization: automatically syncs font and size states in the editor

## Usage

### Basic Usage

```vue
<template>
  <div>
    <FontFamilySelect :editor="editor" />
    <FontSizeSelect :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { FontFamilySelect, FontSizeSelect } from '#/components/tiptapPro-tenant/advanced/font'
import type { Editor } from '@tiptap/vue-3'

const editor = ref<Editor | null>(null)
</script>
```

### Usage in Toolbar

```vue
<template>
  <ToolbarNav :editor="editor" :config="{ font: true }">
    <template #extra>
      <FontFamilySelect :editor="editor" />
      <FontSizeSelect :editor="editor" />
    </template>
  </ToolbarNav>
</template>
```

## Extension Usage

### Usage in Editor Configuration

```typescript
import { FontSize, LineHeight } from '#/components/tiptapPro-tenant/advanced/font'
import { FontFamily } from '@tiptap/extension-font-family'

const editor = new Editor({
  extensions: [
    // ... other extensions
    FontFamily,
    FontSize,
    LineHeight,
  ],
})
```

## Constant Usage

```typescript
import {
  FONT_FAMILIES,
  FONT_SIZES,
  LINE_HEIGHTS,
  DEFAULT_VALUES,
} from '#/components/tiptapPro-tenant/advanced/font'

// Get all font family options (empty = follow theme default)
console.log(FONT_FAMILIES) // [{ label: 'Default', value: '' }, { label: 'Arial', value: 'Arial' }, ...]

// Get all font size options
console.log(FONT_SIZES) // [{ label: '12', value: '12px' }, ...]

// Get default values (empty = follow theme default)
console.log(DEFAULT_VALUES) // { fontFamily: '', fontSize: '16px', lineHeight: '1.5', ... }
```

> **Note**: Constant definitions migrated to `shared/configs/editorConstants.ts`, re-exported here.

## API

### FontFamilySelect

#### Props

| Property | Type | Default | Description |
|------|------|--------|------|
| editor | `Editor \| null \| undefined` | - | Tiptap editor instance |

#### Features

- Click dropdown menu to select font family
- If cursor is in text, applies to selected text
- If cursor is not in text, applies to paragraph
- Auto-syncs font family state in editor

### FontSizeSelect

#### Props

| Property | Type | Default | Description |
|------|------|--------|------|
| editor | `Editor \| null \| undefined` | - | Tiptap editor instance |

#### Features

- Click dropdown menu to select font size
- If cursor is in text, applies to selected text
- If cursor is not in text, applies to paragraph
- Automatically syncs font size state in editor

## File Structure

```
font/
├── FontFamilySelect.vue    # Font family selector component
├── FontSizeSelect.vue      # Font size selector component
├── index.ts                # Unified exports (extensions and constants re-exported from shared)
└── README.md               # Documentation
```

> **Note**:
> - Extension definitions located in `shared/extensions/fontSize.ts` and `shared/extensions/lineHeight.ts`
> - Constant definitions located in `shared/configs/editorConstants.ts`
> - Re-exported via `index.ts` for convenience

## Notes

1. Ensure editor is configured with `FontFamily` extension
2. Font size feature requires `FontSize` and `TextStyle` extensions
3. Line height feature requires `LineHeight` extension
4. Font family and font size sync automatically with editor state
5. Multi-language support is integrated into `locales` module

