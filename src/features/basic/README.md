# Basic edition feature module

## 📁 Directory structure

```
basic/
├── text-format/           # Text format components
│   ├── TextFormatButtons.vue
│   └── index.ts
├── list/                  # List components
│   ├── ListTools.vue
│   └── index.ts
├── color/                 # Color components
│   ├── ColorPicker.vue
│   └── index.ts
├── heading/               # Heading components
│   ├── HeadingDropdown.vue  # Heading dropdown menu (paragraph, H1-H6)
│   ├── HeadingButtons.vue    # Heading button group (H1, H2, H3, etc.)
│   └── index.ts
├── align/                 # Alignment components
│   ├── AlignDropdown.vue     # Alignment dropdown menu (left, center, right, justify)
│   └── index.ts
└── index.ts               # Unified export

Note: BasicToolbar has been migrated to tools/header-nav/ToolbarNav.vue
```

**Note:** Shared files (`ui`, `utils`, `types`, `styles`) are located in the `shared/` folder, not under `basic/`.

## ✅ Feature list

The basic edition includes the following features:

- ✅ **Text format**: bold, italic, underline, strike
- ✅ **Headings**: H1-H6, paragraph
- ✅ **Alignment**: left, center, right, justify
- ✅ **Lists**: ordered list, bullet list, task list
- ✅ **Colors**: text color, background color

## 🚀 Usage

### Import basic edition components

```typescript
// Import basic edition feature components
import { TextFormatButtons, ListTools, ColorPicker } from './basic'

// The toolbar has been migrated to tools/header-nav
import { ToolbarNav, BASIC_TOOLBAR_CONFIG } from '../tools/header-nav'
```

### Disabling basic edition features

Basic edition features are independent and can be disabled by commenting out imports:

**In `TiptapProEditor.vue`:**

```vue
<script setup lang="ts">
// Comment out the basic toolbar import
// The toolbar has been migrated to tools/header-nav/ToolbarNav.vue
// import { ToolbarNav, BASIC_TOOLBAR_CONFIG } from '../tools/header-nav'

// Comment out the basic style import
// import '../basic/styles/toolbar.css'
</script>

<template>
  <!-- Comment out the basic toolbar component -->
  <!-- <ToolbarNav v-if="editorInstance" :editor="editorInstance" :config="BASIC_TOOLBAR_CONFIG" class="word-toolbar" /> -->
</template>
```

**In `ToolbarNav.vue`:**

```vue
<script setup lang="ts">
// You can comment out the import of any feature component
// import { TextFormatButtons } from './text-format'
// import { ListTools } from './list'
// import { ColorPicker } from './color'
</script>
```

## 📝 Notes

- All basic edition features are in the `basic/` folder and are fully independent
- Commenting out import statements disables the corresponding feature without affecting other features
- Each feature module has its own `index.ts` for unified exports
- Shared files (`ui`, `utils`, `types`, `styles`, `configs`) are located in the `shared/` folder and are shared by all editions
- The `basic/` directory only contains feature-related folders (text-format, heading, align, list, color), keeping the structure clear and simple