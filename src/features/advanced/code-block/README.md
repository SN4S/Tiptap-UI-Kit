# Code Block - Code Block Feature Module

The code block feature module provides capabilities to insert code blocks into the editor by clicking a button.

## Features

- ✅ One-click code block insertion (using default language JavaScript)
- ✅ Code block status detection
- ✅ Click active code block button to exit code block mode

## Usage

### Basic Usage

```vue
<template>
  <CodeBlockDropdown :editor="editor" />
</template>

<script setup lang="ts">
import { CodeBlockDropdown } from '#/components/tiptapPro-tenant/advanced/code-block'
import type { Editor } from '@tiptap/vue-3'

const editor = ref<Editor | null>(null)
</script>
```

### Usage in Toolbar

```vue
<template>
  <ToolbarNav :editor="editor" :config="{ codeBlock: true }">
    <!-- Other toolbar buttons -->
    <template #extra>
      <CodeBlockDropdown :editor="editor" />
    </template>
  </ToolbarNav>
</template>
```

## Instructions

- **Insert Code Block**: Click button to insert code block using JavaScript
- **Exit Code Block**: If cursor is in code block, clicking button exits code block mode to normal paragraph
- **Default Language**: Code blocks use JavaScript by default

## Default Language

Code blocks default to **JavaScript**. Languages can be modified in block properties.

Supported languages include: JavaScript, TypeScript, Python, Java, HTML, CSS, JSON, Bash, SQL, PHP, Go, Rust, C, C++, C#, Swift, Kotlin, Ruby, Markdown, XML, etc.

## File Structure

```
code-block/
├── CodeBlockDropdown.vue    # Code block button component
├── index.ts                  # Unified exports
└── README.md                 # Documentation
```

## API

### CodeBlockDropdown

#### Props

| Property | Type | Default | Description |
|------|------|--------|------|
| editor | `Editor \| null \| undefined` | - | Tiptap editor instance |

#### Features

- Click button to directly insert code block (using default language JavaScript)
- If cursor is in code block, clicking button exits code block mode to normal paragraph

## Code Language Constants

To use the language list, import from `shared/configs/editorConstants.ts`:

```typescript
import { CODE_LANGUAGES } from '#/components/tiptapPro-tenant/shared/configs/editorConstants'

// Get all supported languages
console.log(CODE_LANGUAGES) // ['javascript', 'typescript', ...]
```

## Notes

1. Ensure editor is configured with `CodeBlockLowlight` extension
2. Code blocks default to JavaScript language
3. Multi-language support is integrated into `locales` module

