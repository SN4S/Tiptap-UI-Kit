# Floating Menu - Text Bubble Menu

## Feature Overview

The text bubble menu is a bubble menu component displayed when user selects text, providing:

- ✅ Heading quick buttons (H1-H6)
- ✅ Text formatting (bold, italic, underline, strike, inline code)
- ✅ Color tools (text color, background highlight)
- ✅ Link tool
- ✅ List tools (bullet list, ordered list, task list)
- ✅ AI tools (continue writing, polish, summarize, translate, custom AI)

## File Structure

```
floating-menu/
├── FloatingMenu.vue    # Floating menu main component
├── MenuItem.vue        # Menu item component (placeholder)
├── index.ts            # Export file
└── README.md           # Documentation
```

## Usage

### 1. Import Component

```typescript
import { FloatingMenu } from '@/components/tiptapPro-tenant/tools/floating-menu'
```

### 2. Usage in Editor

```vue
<template>
  <div>
    <!-- Editor -->
    <EditorContent :editor="editor" />
    
    <!-- Text floating menu (displayed on text selection) -->
    <FloatingMenu :editor="editor" :readonly="false" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { FloatingMenu } from '@/components/tiptapPro-tenant/tools/floating-menu'

const editor = useEditor({
  extensions: [
    // ... other extensions
  ],
})
</script>
```

### 3. Enable in TiptapProEditor

```vue
<template>
  <TiptapProEditor
    :features="{ floatingMenu: true }"
    :readonly="false"
  />
</template>
```

## Props

| Property | Type | Default | Description |
|------|------|--------|------|
| `editor` | `Editor \| null \| undefined` | - | Tiptap editor instance (required) |
| `readonly` | `boolean` | `false` | Whether read-only mode |

## Feature Description

### Display Conditions

Floating menu appears under the following conditions:
- ✅ Text is selected (non-empty selection)
- ✅ Not inside code block
- ✅ Not inside table (tables have dedicated toolbar)
- ✅ Image not selected (images have dedicated toolbar)
- ✅ Link not selected (links have dedicated bubble menu)
- ✅ Non-read-only mode

### Feature Modules

1. **Heading Quick Buttons**: Fast toggle of heading levels (H1-H6)
2. **Text Formatting**: Bold, italic, underline, strike, inline code
3. **Color Tools**: Text color picker, background highlight picker
4. **Link Tools**: Insert/edit links
5. **List Tools**: Bullet list, ordered list, task list
6. **AI Tools**: Continue writing, polish, summarize, translate, custom AI

## Style Instructions

Floating menu styles defined in:
- Component internal styles (scoped)
- `../shared/styles/floating-menu-toolbar.css` (global styles)

Styles include:
- Bubble menu container styles
- Button styles (hover, active)
- Color picker panel style
- Dark mode support
- Responsive design (mobile adaptation)

## Dependent Modules

Floating menu depends on the following modules:

- **Basic Components**:
  - `HeadingButtons` - Heading buttons component (`../basic/heading`)
  - `TextFormatButtons` - Text format buttons component (`../basic/text-format`)
  - `ListTools` - List tools component (`../basic/list`)
  - `ColorPicker` - Color picker component (`../basic/color`)
  - `LinkButton` - Link button component (`../advanced/link`)

- **Shared Components**:
  - `ToolbarDropdownButton` - Dropdown button component (`../shared/components`)

- **Utility Functions**:
  - `createCommandRunner` - Command runner (`../shared/utils/editorCommands`)
  - `createAiToolMenuItems` - AI tool menu items factory function (`../shared/configs/toolbarConfigs`)

- **Internationalization**:
  - `t` - Translation function (`../locales`)

## Notes

1. **Editor Instance**: Must provide valid Tiptap editor instance
2. **Auto Display**: Menu displays automatically on text selection
3. **Read-only Mode**: Hidden in read-only mode
4. **Conflict Resolution**: Menu automatically detects and avoids conflicts with other toolbars
5. **Responsive**: Automatically hides on mobile screens (< 768px)

## Related Modules

- **Toolbar Navigation**: `../tools/header-nav/ToolbarNav.vue`
- **Image Toolbar**: `../tools/image-toolbar/ImageToolbar.vue`
- **Link Bubble Menu**: `../tools/link-bubble/LinkBubbleMenu.vue`
- **Table Toolbar**: `../tools/table-toolbar/TableToolbar.vue`
- **Floating Menu Style**: `../shared/styles/floating-menu-toolbar.css`

