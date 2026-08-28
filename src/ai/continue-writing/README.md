# Continue Writing Feature

AI-powered continuation that intelligently continues the selected text.

## Files

- `ContinueWritingButton.vue` - Continue-writing button component
- `ContinueWritingExtension.ts` - The continue-writing extension, providing the `continueWriting` command
- `index.ts` - Unified exports

## Dependencies

This feature depends on the following shared components (located in `tiptapPro/features/ai/`):

- `aiSuggestionManager` - AI suggestion manager, used to display and manage AI-generated suggestions
- `AiSuggestionPopover.vue` - AI suggestion popover component
- `AiHighlightMark.ts` - AI highlight mark extension

## Usage

```typescript
import { ContinueWritingExtension, ContinueWritingButton } from './ai/continue-writing'

// Add the extension to the editor configuration
editor = useEditor({
  extensions: [
    // ... other extensions
    ContinueWritingExtension,
  ],
})

// Use the button component
<ContinueWritingButton
  :title="t('editor.continueWriting')"
  :onClick="() => editor.commands.continueWriting()"
/>
```

## How it works

1. The user selects a piece of text
2. Click the continue-writing button or call `editor.commands.continueWriting()`
3. The system continues the text based on the selected text and the full document context
4. The continued content is displayed as an AI suggestion in the popover
5. The user can accept, reject, or cancel the suggestion

## Notes

- Make sure the `aiSuggestionManager` is initialized in the editor
- Make sure the `AiHighlightMark` extension is added to the editor
- A correctly configured AI API service is required

