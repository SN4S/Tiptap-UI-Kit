# Footer Nav - Footer Navigation Component

The footer navigation component provides document zooming, page count, and word count statistics, fixed at page bottom.

## Features

- ✅ **Zoom Control**: Supports zooming in, zooming out, and resetting scale
- ✅ **Page Count**: Real-time display of total document pages
- ✅ **Word Count**: Displays character and word counts
- ✅ **Bottom Fixed**: Sticky positioning, fixed at page bottom
- ✅ **Responsive Design**: Adapts to various screen sizes
- ✅ **Dark Mode**: Automatically adapts to dark theme

## Usage

### Basic Usage

```vue
<template>
  <div class="editor-container">
    <EditorContent :editor="editor" />
    <FooterNav
      v-model:zoomLevel="zoomLevel"
      :totalPages="totalPages"
      :editor="editor"
    />
  </div>
</template>

<script setup lang="ts">
import { FooterNav } from '#/components/tiptapPro-tenant/tools/footer-nav'
import type { Editor } from '@tiptap/vue-3'

const editor = ref<Editor | null>(null)
const zoomLevel = ref(100)
const totalPages = ref(1)
</script>
```

### Custom Zoom Range

```vue
<template>
  <FooterNav
    v-model:zoomLevel="zoomLevel"
    :totalPages="totalPages"
    :editor="editor"
    :min="25"
    :max="300"
    :step="5"
  />
</template>
```

### Hide Word Count

```vue
<template>
  <FooterNav
    v-model:zoomLevel="zoomLevel"
    :totalPages="totalPages"
    :editor="editor"
    :showCharCount="false"
  />
</template>
```

## API

### FooterNav

#### Props

| Property | Type | Default | Description |
|------|------|--------|------|
| zoomLevel | `number` | - | Current zoom scale (two-way binding) |
| totalPages | `number` | - | Total document pages |
| editor | `Editor \| null \| undefined` | - | Tiptap editor instance |
| showCharCount | `boolean` | `true` | Whether to show word count |
| min | `number` | `50` | Minimum zoom ratio |
| max | `number` | `200` | Maximum zoom ratio |
| step | `number` | `10` | Zoom step |

#### Events

| Event Name | Parameters | Description |
|--------|------|------|
| update:zoomLevel | `(value: number)` | Zoom scale update event |
| change | `(value: number)` | Zoom scale change event |
| reset | `(value: number)` | Reset zoom event |

## Style Instructions

Footer nav styles are defined in `footer-nav.css`, including:

- **Bottom Sticky Positioning**: Fixed at bottom via `position: sticky` and `bottom: 0`
- **Top Border**: Top border design separating from content
- **Subtle Shadow**: Elevation shadow enhancing visual hierarchy
- **Responsive Layout**: Adapts to tablet and mobile screens
- **Dark Mode**: Automatically adapts to dark theme

### Style Classes

- `.footer-nav-container` - Footer navigation container
- `.zoom-controls` - Zoom control bar (inherited from ZoomBar)
- `.zoom-level` - Zoom ratio display
- `.page-info` - Page count info
- `.char-count` - Word count

## Notes

1. **Zooming**: Zooming works with CSS `transform: scale()`, ensure parent container supports scaling
2. **Word Count**: Word count requires `CharacterCount` extension configured in editor
3. **Page Count**: Page count requires manual calculation or external provider
4. **Style Import**: Style files are imported automatically
5. **Multi-language Support**: Multi-language support is integrated into `locales` module

## Complete Example

```vue
<template>
  <div class="tiptap-pro-editor word-mode">
    <!-- Toolbar -->
    <ToolbarNav v-if="editor" :editor="editor" />
    
    <!-- Document Content -->
    <div class="word-document-container">
      <div class="document-pages" :style="{ transform: `scale(${zoomLevel / 100})` }">
        <EditorContent :editor="editor" />
      </div>
    </div>
    
    <!-- Footer Navigation -->
    <FooterNav
      v-model:zoomLevel="zoomLevel"
      :totalPages="totalPages"
      :editor="editor"
    />
  </div>
</template>

<script setup lang="ts">
import { FooterNav } from '#/components/tiptapPro-tenant/tools/footer-nav'
import { ToolbarNav } from '#/components/tiptapPro-tenant/tools/header-nav'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import CharacterCount from '@tiptap/extension-character-count'

const editor = useEditor({
  extensions: [
    StarterKit,
    CharacterCount,
    // ... other extensions
  ],
})

const zoomLevel = ref(100)
const totalPages = computed(() => {
  // Calculate total pages logic
  return 1
})
</script>
```

## File Structure

```
footer-nav/
├── FooterNav.vue      # Footer navigation component
├── footer-nav.css     # Footer navigation style
├── index.ts           # Unified exports
└── README.md          # Documentation
```

## Technical Implementation

- Uses `ZoomBar` component for zoom features
- Uses `position: sticky` for bottom sticky placement
- Uses `v-model:zoomLevel` for two-way binding
- Supports responsive layout and dark mode
- Styles migrated from `tiptapPro` `zoom-toolbar.css`

