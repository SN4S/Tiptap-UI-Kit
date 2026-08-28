# Header Nav - Header Navigation Toolbar

Configurable toolbar component supporting toggle of individual tools.

## Features

- ✅ Configurable tool visibility control
- ✅ Preset configurations (basic, advanced, etc.)
- ✅ Supports custom configuration
- ✅ Supports slot extensions for extra tools
- ✅ Unified styling and interaction experience

## Usage

### Basic Usage (Default Configuration)

```vue
<template>
  <ToolbarNav :editor="editor" />
</template>

<script setup lang="ts">
import { ToolbarNav } from '#/components/tiptapPro-tenant/tools/header-nav'
import type { Editor } from '@tiptap/vue-3'

const editor = ref<Editor | null>(null)
</script>
```

### Usage with Presets

```vue
<template>
  <!-- Basic configuration -->
  <ToolbarNav :editor="editor" :config="BASIC_TOOLBAR_CONFIG" />
  
  <!-- Advanced configuration -->
  <ToolbarNav :editor="editor" :config="ADVANCED_TOOLBAR_CONFIG" />
</template>

<script setup lang="ts">
import {
  ToolbarNav,
  BASIC_TOOLBAR_CONFIG,
  ADVANCED_TOOLBAR_CONFIG,
} from '#/components/tiptapPro-tenant/tools/header-nav'
</script>
```

### Custom Configuration

```vue
<template>
  <ToolbarNav
    :editor="editor"
    :config="{
      textFormat: true,
      colorPicker: true,
      heading: true,
      list: true,
      align: true,
      image: false,
      codeBlock: true,
    }"
  />
</template>

<script setup lang="ts">
import { ToolbarNav, type ToolbarToolsConfig } from '#/components/tiptapPro-tenant/tools/header-nav'

const customConfig: ToolbarToolsConfig = {
  textFormat: true,
  colorPicker: true,
  heading: true,
  list: true,
  align: true,
  image: false,
  codeBlock: true,
  link: true,
  table: true,
}
</script>
```

### Extending Extra Tools via Slots

```vue
<template>
  <ToolbarNav :editor="editor" :config="config">
    <template #extra>
      <div class="tool-group">
        <!-- Custom tools -->
        <CustomTool :editor="editor" />
      </div>
    </template>
  </ToolbarNav>
</template>
```

## Configuration Options

### ToolbarToolsConfig

| Property | Type | Default | Description |
|------|------|--------|------|
| textFormat | `boolean` | `true` | Whether to display text formatting tools (bold, italic, underline, strike) |
| colorPicker | `boolean` | `true` | Whether to display color picker (text color, background color) |
| heading | `boolean` | `true` | Whether to display heading dropdown |
| list | `boolean` | `true` | Whether to display list tools (ordered, bullet, task list) |
| align | `boolean` | `true` | Whether to display alignment tools |
| image | `boolean` | `true` | Whether to display image upload tool |
| codeBlock | `boolean` | `false` | Whether to display code block tool |
| link | `boolean` | `false` | Whether to display link tool |
| table | `boolean` | `false` | Whether to display table tool |
| undoRedo | `boolean` | `false` | Whether to display undo/redo tools |
| clearFormat | `boolean` | `false` | Whether to display format clear tool |
| font | `boolean` | `false` | Whether to display font tools |
| lineHeight | `boolean` | `false` | Whether to display line height tool |
| subscriptSuperscript | `boolean` | `false` | Whether to display subscript/superscript tools |

## Preset Configurations

### BASIC_TOOLBAR_CONFIG

Basic toolbar configuration includes:
- Text formatting tools
- Color pickers
- Heading dropdown
- List tools
- Alignment tools
- Image upload tool

### ADVANCED_TOOLBAR_CONFIG

Advanced toolbar configuration includes all tools.

### DEFAULT_TOOLBAR_CONFIG

Default toolbar configuration, same as basic version.

## File Structure

```
header-nav/
├── ToolbarNav.vue          # Public toolbar component
├── toolbarConfig.ts        # Toolbar config types and presets
├── index.ts                # Unified exports
└── README.md               # Documentation
```

## Migration Notes

`BasicToolbar.vue` has been fully migrated to `ToolbarNav.vue`, original file removed:

```vue
<template>
  <ToolbarNav :editor="editor" :config="toolbarConfig">
    <template #extra>
      <slot name="extra" />
    </template>
  </ToolbarNav>
</template>

<script setup lang="ts">
import { ToolbarNav, BASIC_TOOLBAR_CONFIG } from '../tools/header-nav'

const toolbarConfig = computed(() => ({
  ...BASIC_TOOLBAR_CONFIG,
  ...props.config, // Supports custom configuration
}))
</script>
```

## Notes

1. All toolbar logic migrated to `ToolbarNav.vue`, `BasicToolbar.vue` removed
2. To use basic toolbar config, use `BASIC_TOOLBAR_CONFIG`
2. Customize tool visibility via `config` prop
3. Extend extra tools via `extra` slot
4. Color picker syncs automatically with editor state

