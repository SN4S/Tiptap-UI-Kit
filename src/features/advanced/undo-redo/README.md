# Undo Redo - Undo & Redo Feature Module

The undo/redo feature module provides history step-back and restoration capabilities for the editor.

## Features

- ✅ **Undo Action**: One-click undo to revert to previous edit state
- ✅ **Redo Action**: One-click redo to restore undone operation
- ✅ **State Detection**: Automatically detects undo/redo availability and updates button status
- ✅ **Shortcuts**: Supports `Ctrl+Z` (undo) and `Ctrl+Shift+Z` / `Ctrl+Y` (redo)

## Usage

### Basic Usage

```vue
<template>
  <div>
    <UndoRedoButton :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { UndoRedoButton } from '#/components/tiptapPro-tenant/advanced/undo-redo'
import type { Editor } from '@tiptap/vue-3'

const editor = ref<Editor | null>(null)
</script>
```

### Usage in Toolbar

```vue
<template>
  <ToolbarNav :editor="editor" :config="{ undoRedo: true }">
    <template #extra>
      <UndoRedoButton :editor="editor" />
    </template>
  </ToolbarNav>
</template>
```

## API

### UndoRedoButton

#### Props

| Property | Type | Default | Description |
|------|------|--------|------|
| editor | `Editor \| null \| undefined` | - | Tiptap editor instance |

#### Features

- **Undo Button**: Click to undo; disabled when no undo history is available
- **Redo Button**: Click to redo; disabled when no redo history is available
- **Automatic State Updates**: Button disabled status updates automatically based on editor history

## Keyboard Shortcuts

- `Ctrl+Z` (Windows/Linux) or `Cmd+Z` (Mac): Undo
- `Ctrl+Shift+Z` or `Ctrl+Y` (Windows/Linux) or `Cmd+Shift+Z` (Mac): Redo

> Note: Shortcuts are provided by Tiptap's History extension, no extra configuration required.

## File Structure

```
undo-redo/
├── UndoRedoButton.vue    # Undo/redo button component
├── index.ts               # Unified exports
└── README.md              # Documentation
```

## Notes

1. Undo/redo depends on Tiptap's `History` extension, ensure it is configured in editor
2. Button disabled status updates automatically based on editor history state
3. Multi-language support is integrated into `locales` module
4. Undo/redo history depth is determined by `History` extension configuration (default 50 steps)

## Technical Implementation

- Uses `createCommandRunner` utility function to create command runners
- Uses `computed` reactive properties to detect undo/redo availability
- Checks command executability via `editor.can().undo()` and `editor.can().redo()`

