# Subscript Superscript - Subscript & Superscript Feature Module

The subscript & superscript feature module provides text subscript and superscript formatting toggle capabilities.

## Features

- ✅ Superscript toggle (Superscript)
- ✅ Subscript toggle (Subscript)
- ✅ State detection (displays current active status)
- ✅ Mutually exclusive (superscript and subscript cannot be active simultaneously)

## Usage

### Basic Usage

```vue
<template>
  <SubscriptSuperscriptButton :editor="editor" />
</template>

<script setup lang="ts">
import { SubscriptSuperscriptButton } from '#/components/tiptapPro-tenant/advanced/subscript-superscript'
import type { Editor } from '@tiptap/vue-3'

const editor = ref<Editor | null>(null)
</script>
```

### Usage in Toolbar

```vue
<template>
  <ToolbarNav :editor="editor" :config="{ subscriptSuperscript: true }">
    <!-- Other toolbar buttons -->
    <template #extra>
      <SubscriptSuperscriptButton :editor="editor" />
    </template>
  </ToolbarNav>
</template>
```

## Instructions

- **Superscript**: Click superscript button to set selected text to superscript format (e.g. x²)
- **Subscript**: Click subscript button to set selected text to subscript format (e.g. H₂O)
- **Toggle**: Click active button again to cancel subscript or superscript formatting
- **Mutually Exclusive**: Superscript and subscript are mutually exclusive; activating one cancels the other

## File Structure

```
subscript-superscript/
├── SubscriptSuperscriptButton.vue    # Subscript/superscript button component
├── index.ts                           # Unified exports
└── README.md                          # Documentation
```

## API

### SubscriptSuperscriptButton

#### Props

| Property | Type | Default | Description |
|------|------|--------|------|
| editor | `Editor \| null \| undefined` | - | Tiptap editor instance |

#### Features

- **Superscript Button**: Click to toggle subscript format on selected text
- **Subscript Button**: Click to toggle subscript format on selected text
- **Status Display**: Button displays active state based on selected text formatting

## Notes

1. Ensure editor is configured with `Subscript` and `Superscript` extensions
2. Superscript and subscript are mutually exclusive and cannot be applied together
3. Multi-language support is integrated into `locales` module
4. Icons use `SortDescendingOutlined` (superscript) and `SortAscendingOutlined` (subscript)

## Extension Configuration

When initializing editor, ensure the following extensions are included:

```typescript
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'

const editor = useEditor({
  extensions: [
    // ... other extensions
    Subscript,
    Superscript,
  ],
})
```

