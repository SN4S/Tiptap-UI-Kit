# Zoom - Zoom Feature Module

The zoom feature module provides document zooming, page count, and word count statistics.

## Features

- ✅ **Zoom Control**: Supports zooming in, zooming out, and resetting zoom scale
- ✅ **Page Count**: Real-time display of total document pages
- ✅ **Word Count**: Display character count and word count statistics
- ✅ **Placement**: Supports bottom and below-toolbar placements
- ✅ **Limit Range**: Configurable min/max zoom ratios and step

## Usage

### Basic Usage

```vue
<template>
  <div>
    <ZoomBar
      v-model:zoomLevel="zoomLevel"
      :totalPages="totalPages"
      :editor="editor"
    />
  </div>
</template>

<script setup lang="ts">
import { ZoomBar } from '#/components/tiptapPro-tenant/advanced/zoom'
import type { Editor } from '@tiptap/vue-3'

const editor = ref<Editor | null>(null)
const zoomLevel = ref(100)
const totalPages = ref(1)
</script>
```

### Usage in Editor

```vue
<template>
  <div class="editor-container">
    <EditorContent :editor="editor" />
    <ZoomBar
      v-model:zoomLevel="zoomLevel"
      :totalPages="totalPages"
      :editor="editor"
      :placement="'bottom'"
      :showCharCount="true"
    />
  </div>
</template>
```

### Custom Zoom Range

```vue
<template>
  <ZoomBar
    v-model:zoomLevel="zoomLevel"
    :totalPages="totalPages"
    :editor="editor"
    :min="25"
    :max="300"
    :step="5"
  />
</template>
```

## API

### ZoomBar

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
| placement | `'bottom' \| 'belowToolbar'` | `'belowToolbar'` | Zoom toolbar placement |

#### Events

| Event Name | Parameters | Description |
|--------|------|------|
| update:zoomLevel | `(value: number)` | Zoom scale update event |
| change | `(value: number)` | Zoom scale change event |
| reset | `(value: number)` | Reset zoom event |

#### Features

- **Zoom In Button (+)**: Click to zoom in by `step`, maximum up to `max`
- **Zoom Out Button (-)**: Click to zoom out by `step`, minimum down to `min`
- **Reset Button**: Click to reset zoom ratio to 100%
- **Zoom Scale Display**: Display current zoom ratio (e.g. 100%)
- **Page Count Info**: Display total document pages (e.g. Total 5 pages)
- **Word Count**: Display character and word count (requires `characterCount` extension)

## Style Configuration

Zoom bar styles are defined in `zoom-toolbar.css`, supporting:

- **Default Style**: Below toolbar placement with border and background
- **Bottom Style**: Bottom placement, sticky positioning with shadow and rounded corners
- **Dark Mode**: Automatically adapts to dark theme

## Notes

1. Zooming works with CSS `transform: scale()`, ensure parent container supports scaling
2. Word count requires `CharacterCount` extension configured in editor
3. Page count requires manual calculation or external provider
4. Style files are imported automatically
5. Multi-language support is integrated into `locales` module

## Usage Example

### Complete Editor Integration

```vue
<template>
  <div class="tiptap-pro-editor word-mode" :class="{ 'zoombar-bottom': zoomBarPlacement === 'bottom' }">
    <!-- Toolbar -->
    <ProToolbar v-if="editor" :editor="editor" />
    
    <!-- Document Content -->
    <div class="word-document-container">
      <div class="document-pages" :style="{ transform: `scale(${zoomLevel / 100})` }">
        <EditorContent :editor="editor" />
      </div>
    </div>
    
    <!-- Zoom Control -->
    <ZoomBar
      v-model:zoomLevel="zoomLevel"
      :totalPages="totalPages"
      :editor="editor"
      :placement="zoomBarPlacement"
    />
  </div>
</template>

<script setup lang="ts">
import { ZoomBar } from '#/components/tiptapPro-tenant/advanced/zoom'
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
const zoomBarPlacement = ref<'bottom' | 'belowToolbar'>('bottom')
const totalPages = computed(() => {
  // Calculate total pages logic
  return 1
})
</script>
```

## File Structure

```
zoom/
├── ZoomBar.vue          # Zoom bar component
├── index.ts             # Unified exports
└── README.md            # Documentation
```

## Style Files

Style files located in `shared/styles/zoom-toolbar.css`, including:

- `.zoom-controls` - Zoom bar base style
- `.zoom-level` - Zoom ratio display style
- `.page-info` - Page count info style
- `.char-count` - Word count style
- `.zoom-controls--bottom` - Bottom placement variant style

## Technical Implementation

- Uses `v-model:zoomLevel` for two-way binding
- Uses `computed` for character and word counts
- Implements zoom via CSS `transform: scale()`
- Supports responsive layout and dark mode

