# Format Painter - Format Painter Feature Module

The format painter feature module provides format sampling and application capabilities in the editor, similar to format painter in Microsoft Word.

## Features

- ✅ **Format Sampling**: Samples formatting of selected text including text styles, colors, fonts, alignment, etc.
- ✅ **Single Application Mode**: Click format painter button to sample format and apply once, auto-exiting after application
- ✅ **Continuous Mode**: Double click format painter button to sample format and apply continuously to multiple targets
- ✅ **Auto Application**: When format painter is active, selecting target text automatically applies formatting
- ✅ **Keyboard Exit**: Press `ESC` key to exit format painter mode
- ✅ **State Detection**: Automatically detects format painter active state and updates button status
- ✅ **Collaboration Detection**: Automatically detects collaboration mode and disables format painter
- ✅ **Local Storage**: Format info is saved to local storage for persistence across refresh

## Usage

### Basic Usage

```vue
<template>
  <div>
    <FormatPainterButton :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { FormatPainterButton } from '#/components/tiptapPro-tenant/advanced/format-painter'
import type { Editor } from '@tiptap/vue-3'

const editor = ref<Editor | null>(null)
</script>
```

### Usage in Toolbar

```vue
<template>
  <ToolbarNav :editor="editor" :config="{ formatPainter: true }">
    <template #extra>
      <FormatPainterButton :editor="editor" />
    </template>
  </ToolbarNav>
</template>
```

### Extension Usage in Editor

```vue
<template>
  <EditorContent :editor="editor" />
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { FormatPainter } from '#/components/tiptapPro-tenant/advanced/format-painter'

const editor = useEditor({
  extensions: [
    StarterKit,
    FormatPainter,
    // ... other extensions
  ],
})
</script>
```

## API

### FormatPainterButton

#### Props

| Property | Type | Default | Description |
|------|------|--------|------|
| editor | `Editor \| null \| undefined` | - | Tiptap editor instance |

#### Features

- **Single Click Button (Single Mode)**:
  - If format painter inactive: sample selected text format, activate single mode
  - If format painter active: cancel format painter state
- **Double Click Button (Continuous Mode)**:
  - If format painter inactive: sample selected text format, activate continuous mode
  - If format painter active: cancel format painter state
- **Automatic State Updates**: Button active state updates automatically
- **Collaboration Detection**: Disabled with notification in collaboration mode

### FormatPainter Extension

#### Commands

| Commands | Description |
|------|------|
| `startFormatPainting(mode?: 1 \| 2)` | Enable format painter and sample selection style (mode=1 single, mode=2 continuous) |
| `startContinuousFormatPainting()` | Enable continuous format painter mode |
| `applyFormat()` | Apply sampled style to current selection |
| `cancelFormatPainting()` | Cancel format painter state and clear cache |
| `toggleContinuousMode()` | Toggle continuous mode |

#### Storage

```typescript
interface FormatPainterStorage {
  /** Whether format painter is active */
  isActive: boolean
  /** Whether continuous application mode */
  isContinuous: boolean
  /** Sampled format */
  formats: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    strike?: boolean
    subscript?: boolean
    superscript?: boolean
    color?: string | null
    highlight?: string | null
    fontFamily?: string | null
    fontSize?: string | null
    textAlign?: 'left' | 'center' | 'right' | 'justify' | null
    lineHeight?: string | null
  }
}
```

## Usage Flow

### Single Application Mode

1. Select text to sample (containing target format)
2. Click format painter button
3. Select target text to apply format
4. Format applies automatically to target text, format painter auto-exits

### Continuous Mode

1. Select text to sample (containing target format)
2. Double click format painter button
3. Select multiple target texts sequentially
4. Format automatically applies on each selection
5. Press `ESC` key or click format painter button again to exit

## Supported Formats

Format painter supports sampling and applying the following formats:

- **Text Styles**: Bold, italic, underline, strike, superscript, subscript
- **Colors**: Text color, background highlight color
- **Typography**: Font family, font size
- **Paragraph Format**: Text alignment (left, center, right, justify), line height

## Keyboard Shortcuts

- `ESC`: Exit format painter mode

## Notes

1. Format painter relies on multiple Tiptap extensions; ensure proper configuration:
   - `Bold`, `Italic`, `Underline`, `Strike` (text styles)
   - `Subscript`, `Superscript` (subscript/superscript)
   - `TextStyle`, `Color`, `Highlight` (colors)
   - `FontFamily`, `FontSize` (typography)
   - `TextAlign`, `LineHeight` (paragraph formatting)

2. Format painter is automatically disabled in collaboration mode

3. Format info is saved in browser localStorage under key `tiptap-format-painter-formats`

4. When active, editor cursor displays format painter style via CSS class `cursor-format-painter`

5. Multi-language support is integrated into `locales` module, including:
   - `editor.formatPainter` - Format Painter
   - `editor.pleaseSelectTextToSample` - Please select text to sample first
   - `editor.sampleSuccessSingle` - Format sampled successfully (single mode)
   - `editor.sampleSuccessContinuous` - Format sampled successfully (continuous mode)
   - `editor.formatPainterExited` - Exited format painter mode
   - `editor.collaborationNoFormatPainter` - Format painter is unsupported in collaboration mode

## File Structure

```
format-painter/
├── FormatPainterButton.vue  # Format painter button component
├── formatPainter.ts          # Format painter extension implementation
├── index.ts                  # Unified exports
└── README.md                 # Documentation
```

## Technical Implementation

- Uses Tiptap Extension API to implement format sampling and application logic
- Uses ProseMirror Plugin to listen to keyboard and mouse events
- Uses reactive refs and editor event subscriptions for state sync
- Uses browser localStorage for persistent format storage
- Uses CSS class names for cursor style changes when active

