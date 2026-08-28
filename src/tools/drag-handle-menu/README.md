# Drag Handle Menu - 6-Dot Feature

## Feature Description

The drag handle menu (6-dot feature) provides quick action menus for block elements in the editor. Hovering over a block displays a 6-dot icon on the left, clicking pops up the action menu.

## Key Features

- **6-Dot Display**: Displays clickable 6-dot icon on the left of block elements
- **Action Menu**: Clicking 6 dots shows a menu with various editing operations
- **Smart Positioning**: Menu adjusts position automatically to prevent overflowing screen
- **Rich Operations**:
  - Heading level switching (H1-H3)
  - Text formatting (bold, italic, underline, strike)
  - List operations (ordered, bullet, task list)
  - Alignment and indentation
  - Color settings (text color, highlight color)
  - Edit actions (cut, copy, delete)

## File Structure

```
drag-handle-menu/
├── DragHandleMenu.vue              # Menu component
├── DragHandleWithMenuExtension.ts  # 6-dot handle extension
├── dragHandleMenuConfig.ts         # Menu configuration
├── index.ts                        # Unified exports
└── README.md                       # Documentation
```

## Usage

### 1. Import Extension and Component

```typescript
import { DragHandleWithMenuExtension, DragHandleMenu } from '@/components/tiptapPro-tenant/tools/drag-handle-menu'
```

### 2. Extension Usage in Editor

```typescript
import { useEditor } from '@tiptap/vue-3'
import { DragHandleWithMenuExtension } from '@/components/tiptapPro-tenant/tools/drag-handle-menu'

const editor = useEditor({
  extensions: [
    // ... other extensions
    DragHandleWithMenuExtension.configure({
      onHandleClick: (event) => {
        // Handle 6-dot click event
        // Call DragHandleMenu handleDragHandleClick method via ref
      }
    })
  ]
})
```

### 3. Usage of Menu Component in Template

```vue
<template>
  <div>
    <editor-content :editor="editor" />
    <DragHandleMenu
      ref="dragHandleMenuRef"
      :editor="editor"
      :position-strategy="'auto'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DragHandleMenu } from '@/components/tiptapPro-tenant/tools/drag-handle-menu'
import { DragHandleWithMenuExtension } from '@/components/tiptapPro-tenant/tools/drag-handle-menu'

const dragHandleMenuRef = ref<InstanceType<typeof DragHandleMenu>>()

// Connect menu in extension configuration
const editor = useEditor({
  extensions: [
    DragHandleWithMenuExtension.configure({
      onHandleClick: (event) => {
        dragHandleMenuRef.value?.handleDragHandleClick(event)
      }
    })
  ]
})
</script>
```

## Configuration Options

### DragHandleWithMenuExtension Configuration

```typescript
interface DragHandleWithMenuOptions {
  onHandleClick?: (event: DragHandleClickEvent) => void
}
```

### DragHandleMenu Component Props

```typescript
interface Props {
  editor: Editor | null | undefined
  readonly?: boolean                    // Whether read-only, default false
  positionStrategy?: 'auto' | 'right' | 'left'  // Menu position strategy, default 'auto'
}
```

## Style Instructions

Style files located in `shared/styles/drag-handle-with-menu.css`, including:

- 6-dot icon style
- Menu container style
- Menu item style
- Color picker style
- Responsive design
- Dark mode support

## Notes

1. **Style Dependency**: Ensure `drag-handle-with-menu.css` is imported
2. **Internationalization**: Menu text uses `t()` function for i18n
3. **Editor Extensions**: Features like colors and alignment require corresponding Tiptap extensions
4. **Event Handling**: 6-dot click event connects to menu component via `onHandleClick` callback

## Technical Implementation

- **6-Dot Display**: Uses ProseMirror Decoration system to add decoration on block elements
- **Menu Positioning**: Calculates menu position automatically based on handle position and screen size
- **State Management**: Uses Vue 3 Composition API to manage menu state
- **Utility Functions**: Uses shared `editorState`, `editorCommands`, `clipboard` helper functions

## Related Files

- Style file: `shared/styles/drag-handle-with-menu.css`
- Utility functions: `shared/utils/editorState.ts`, `shared/utils/editorCommands.ts`, `shared/utils/clipboard.ts`
- Internationalization: `locales/index.ts`

