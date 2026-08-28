# Image Feature - Image feature module

## Overview

A complete image feature module, including:
- ✅ Image upload (local/network)
- ✅ Image drag-resize (proportional scaling)
- ✅ Image alignment (left, center, right)
- ✅ Image preview
- ✅ Image deletion
- ✅ Image drag-and-drop to move (move between text)

## File structure

```
image/
├── ImageUpload.vue          # Image upload component (toolbar button)
├── ResizableImage.ts        # Resizable image extension (standalone implementation, does not depend on drag-handle)
├── image-resize.css         # Image resize related styles
├── index.ts                 # Export file
└── README.md                # Documentation

Note: ImageToolbar has been migrated to ../tools/image-toolbar
```

## Usage

### 1. Import the extension and component

```typescript
import { ResizableImage, ImageUpload } from '@/components/tiptapPro-tenant/basic/image'
import { ImageToolbar } from '@/components/tiptapPro-tenant/tools/image-toolbar'
import '@/components/tiptapPro-tenant/basic/image/image-resize.css'
```

### 2. Use in the editor

#### Basic usage (image enhancement enabled by default)

```vue
<template>
  <div>
    <!-- Image upload button in the toolbar -->
    <ImageUpload :editor="editor" :upload-image="handleImageUpload" />
    
    <!-- Editor -->
    <EditorContent :editor="editor" />
    
    <!-- Image toolbar (shown when an image is selected) -->
    <ImageToolbar :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { ResizableImage, ImageUpload } from '@/components/tiptapPro-tenant/basic/image'
import { ImageToolbar } from '@/components/tiptapPro-tenant/tools/image-toolbar'
import '@/components/tiptapPro-tenant/basic/image/image-resize.css'

const editor = useEditor({
  extensions: [
    // ... other extensions
    ResizableImage, // Use the resizable image extension (enhancement enabled by default)
  ],
})

// Image upload handler function (optional)
const handleImageUpload = async (file: File): Promise<string> => {
  // Upload the image to the server and return the image URL
  // If not provided, Base64 encoding will be used
  return 'https://example.com/image.jpg'
}
</script>
```

#### Custom configuration (control the image enhancement feature)

```vue
<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { ResizableImage, ImageUpload } from '@/components/tiptapPro-tenant/basic/image'
import { ImageToolbar } from '@/components/tiptapPro-tenant/tools/image-toolbar'
import '@/components/tiptapPro-tenant/basic/image/image-resize.css'

// Decide whether to enable the image enhancement feature based on user configuration
const enableImageResize = ref(true) // enabled by default

const editor = useEditor({
  extensions: [
    // ... other extensions
    ResizableImage.configure({
      enableResize: enableImageResize.value, // Controls whether the image enhancement feature is enabled
    }),
  ],
})
</script>
```

## Feature description

### ResizableImage extension

- **Drag-resize**: a resize handle appears in the bottom-right corner when hovering over an image; drag it to resize the image (proportional scaling)
- **Drag to move**: images can be dragged directly to move them between text
- **Alignment support**: supports left, center, and right alignment
- **Standalone implementation**: does not depend on the `drag-handle` extension, fully independent
- **Configurable**: the `enableResize` option controls whether the image enhancement feature is enabled (default `true`)

#### Configuration options

```typescript
interface ResizableImageOptions {
  HTMLAttributes?: Record<string, any>
  inline?: boolean
  allowBase64?: boolean
  enableResize?: boolean // Whether to enable the image enhancement feature (drag-resize), defaults to true
}
```

### ImageToolbar component

> **Note**: `ImageToolbar` has been migrated to `@/components/tiptapPro-tenant/tools/image-toolbar`

A bubble menu appears when an image is selected, providing:
- **Alignment**: left, center, right
- **Preview**: click the preview button to view the image in full size
- **Delete**: delete the currently selected image

### ImageUpload component

The image upload button in the toolbar, supporting:
- **Local upload**: drag-and-drop or click to upload a local image
- **Network upload**: enter an image URL to insert an image
- **Custom upload**: provide custom upload logic via the `uploadImage` prop

## Style description

The `image-resize.css` style file contains:
- Image selected/hover styles
- Resize handle style (bottom-right dot)
- Image alignment styles
- Dark mode support

## Notes

1. **Style import**: when using the `ResizableImage` extension, you need to import the `image-resize.css` style file
2. **Standalone implementation**: the `ResizableImage` extension does not depend on the `drag-handle` extension and can be used independently
3. **Drag functionality**: the image drag-and-drop move uses Tiptap's native drag support, no extra configuration required