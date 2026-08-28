# Polish Feature

AI-powered text polishing that intelligently refines the selected text.

## Files

- `PolishButton.vue` - Polish button component
- `PolishExtension.ts` - The polish extension, providing the `polish` command
- `index.ts` - Unified exports

## Dependencies

This feature depends on the following shared components (located in `tiptapPro-tenant/ai/shared/`):

- `AiSuggestionPopover.vue` - AI suggestion popover component
- `AiHighlightMark.ts` - AI highlight mark extension

## Usage

```typescript
import { PolishExtension, PolishButton } from './ai/polish'

// Add the extension to the editor configuration
editor = useEditor({
  extensions: [
    // ... other extensions
    PolishExtension,
  ],
})

// Use the button component
<PolishButton
  :title="t('editor.polish')"
  :onClick="() => editor.commands.polish()"
/>
```

## How it works

1. The user selects a piece of text
2. Click the polish button or call `editor.commands.polish()`
3. The system polishes the text based on the selected text and the full document context
4. The polished content is displayed as an AI suggestion in the popover
5. The user can accept, reject, or cancel the suggestion

## Notes

- Make sure the `AiHighlightMark` extension is added to the editor
- A correctly configured AI API service is required
- The polish feature replaces the selected text, rather than inserting after it

