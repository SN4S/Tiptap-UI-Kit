# Image Toolbar - Image Toolbar

## Feature Overview

The image toolbar is a bubble menu component displayed when an image is selected, providing:

- ✅ Image alignment (left, center, right)
- ✅ Image preview (click preview button to enlarge)
- ✅ Image deletion

## File Structure

```
image-toolbar/
├── ImageToolbar.vue    # Image toolbar component
├── index.ts            # Export file
└── README.md           # Documentation
```

## Usage

### 1. Import Component

```typescript
import { ImageToolbar } from '@/components/tiptapPro-tenant/tools/image-toolbar'
```

### 2. Usage in Editor

```vue
<template>
  <div>
    <!-- Editor -->
    <EditorContent :editor="editor" />
    
    <!-- Image toolbar (displayed on image selection) -->
    <ImageToolbar :editor="editor" :readonly="false" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { ImageToolbar } from '@/components/tiptapPro-tenant/tools/image-toolbar'

const editor = useEditor({
  extensions: [
    // ... other extensions
    // Note: Requires ResizableImage extension
  ],
})
</script>
```

## Props

| Property | Type | Default | Description |
|------|------|--------|------|
| `editor` | `Editor \| null \| undefined` | - | Tiptap editor instance (required) |
| `readonly` | `boolean` | `false` | Whether read-only mode |

## Feature Description

### Alignment Feature

The toolbar provides three alignment buttons:
- **Left Align**: Aligns image to the left
- **Center**: Aligns image to center
- **Right Align**: Aligns image to the right

Alignment updates both the image node alignment attribute and parent node alignment.

### Preview Feature

Clicking preview button opens a modal displaying a large image preview.

### Delete Feature

Clicking delete button removes the selected image.

## Style Instructions

Toolbar styles are defined inside component (scoped), including:
- Bubble menu style
- Button styles (hover, active, danger)
- Dark mode support

## Notes

1. **Editor Instance**: Must provide valid Tiptap editor instance
2. **Image Extension**: Requires `ResizableImage` extension
3. **Auto Display**: Toolbar appears automatically when image is selected
4. **Read-only Mode**: Toolbar is hidden in read-only mode

## Related Modules

- **Image Upload**: `../basic/image/ImageUpload.vue`
- **Resizable Image Extension**: `../basic/image/ResizableImage.ts`
- **Image Styles**: `../shared/styles/image-toolbar.css`

