# Basic Folder Usage Guide

## 📍 Reference locations

The `basic` folder is mainly imported and used in the following locations:

### 1. Core editor component

**File:** `core/TiptapProEditor.vue`

```vue
<template>
  <ToolbarNav v-if="editorInstance" :editor="editorInstance" :config="toolbarConfig" class="word-toolbar" />
</template>

<script setup lang="ts">
// Public toolbar (migrated)
import { ToolbarNav, BASIC_TOOLBAR_CONFIG } from '../tools/header-nav'
</script>
```

### 2. Unified export entry

**File:** `components/tiptapPro-tenant/index.ts`

```typescript
// Core editor
export { default as TiptapProEditor } from './core/TiptapProEditor.vue'
```

### 3. Actual usage location

**File:** `views/tiptap-pro-tenant-demo/index.vue`

```vue
<template>
  <TiptapProEditor
    :version="'basic'"
    :initialContent="initialContent"
    @update="handleUpdate"
  />
</template>

<script setup lang="ts">
import { TiptapProEditor } from '#/components/tiptapPro-tenant'
</script>
```

## 🔗 Reference chain

```
views/tiptap-pro-tenant-demo/index.vue
  ↓ imports
components/tiptapPro-tenant/index.ts
  ↓ exports
core/TiptapProEditor.vue
  ↓ imports
tools/header-nav/ToolbarNav.vue
  ↓ uses
basic/text-format/TextFormatButtons.vue
basic/heading/HeadingDropdown.vue
basic/align/AlignDropdown.vue
basic/list/ListTools.vue
basic/color/ColorPicker.vue
```

## 📝 Notes

- The `basic` folder is the **basic edition feature module**, containing various feature components (text formatting, headings, alignment, lists, colors, etc.)
- The toolbar has been migrated to `tools/header-nav/ToolbarNav.vue`, supporting configurable tool visibility
- Users use the basic edition features through the `TiptapProEditor` component
- Whether the toolbar is displayed can be controlled via the `versionConfig.features.headerNav` config