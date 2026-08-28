# Format Clear - Format Clear Feature Module

The format clear feature module provides capabilities for clearing formatting in the editor.

## Features

- ✅ **Clear format**：One-click clearing of all formatting (text styles, colors, fonts, etc.) in current selection

## Usage

### Basic Usage

```vue
<template>
  <div>
    <ClearFormatButton :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { ClearFormatButton } from '#/components/tiptapPro-tenant/advanced/format-clear'
import type { Editor } from '@tiptap/vue-3'

const editor = ref<Editor | null>(null)
</script>
```

### Usage in Toolbar

```vue
<template>
  <ToolbarNav :editor="editor" :config="{ clearFormat: true }">
    <template #extra>
      <ClearFormatButton :editor="editor" />
    </template>
  </ToolbarNav>
</template>
```

## API

### ClearFormatButton

#### Props

| Property | Type | Default | Description |
|------|------|--------|------|
| editor | `Editor \| null \| undefined` | - | Tiptap editor instance |

#### Features

- Click button to clear all formatting in current selection
- Includes text styles (bold, italic, underline, etc.), colors, fonts, alignment, etc.

## File Structure

```
format-clear/
├── ClearFormatButton.vue    # Clear format button component
├── index.ts                  # Unified exports
└── README.md                 # Documentation
```

## Notes

1. Format clearing removes all formatting in current selection, including:
   - Text styles: bold, italic, underline, strike, subscript, superscript
   - Colors: text color, background highlight
   - Typography: font family, font size, line height
   - Alignment: align left, center, right, justify
2. Multi-language support integrated into `locales` module
