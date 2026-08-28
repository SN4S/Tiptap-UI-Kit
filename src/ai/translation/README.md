# Translation Feature

AI-driven text translation with multi-language selection and persistence.

## Features

- ✅ Supports translation into 14 languages
- ✅ Persists the language selection (localStorage)
- ✅ Dropdown-menu style language selection UI
- ✅ Interaction experience similar to the continue-writing feature
- ✅ Real-time streaming translation result display

## File structure

```
translation/
├── TranslationExtension.ts    # Tiptap extension, provides the translate command
├── languageCodes.ts           # Language code configuration
├── translateStore.ts          # Translation language state management
├── index.ts                   # Export file
└── README.md                  # This document
```

## Usage

### 1. Use the translation extension in the editor

```typescript
import { TranslationExtension } from '@/components/tiptapPro-tenant/ai/translation';

// Add the extension to the editor configuration
editor = new Editor({
  extensions: [
    // ... other extensions
    TranslationExtension.configure({
      defaultTargetLang: '英文', // Optional: set the default target language
    }),
  ],
});
```

### 2. Invoke the translate command programmatically

```typescript
// Use the saved language
editor.commands.translate();

// Or specify a target language
editor.commands.translate('英文');
editor.commands.translate('中文');
```

### 3. Manage the translation language state

```typescript
import {
  currentTranslateLang,
  setTranslateLang,
  clearTranslateLang,
} from '@/components/tiptapPro-tenant/ai/translation';

// Get the currently selected language
const lang = currentTranslateLang.value;

// Set the target language
setTranslateLang('英文');

// Clear the saved language
clearTranslateLang();
```

### 4. Use the language code configuration

```typescript
import { LANGUAGE_CODES } from '@/components/tiptapPro-tenant/ai/translation';

// Get all supported languages
LANGUAGE_CODES.forEach(({ code, key }) => {
  console.log(`Code: ${code}, Key: ${key}`);
});
```

## Supported languages

| Code | Key | Description |
|------|------|------|
| zh-CN | zh-CN | Simplified Chinese |
| zh-TW | zh-TW | Traditional Chinese |
| en | en | English |
| ja | ja | Japanese |
| th | th | Thai |
| fr | fr | French |
| es | es | Spanish |
| pt | pt | Portuguese |
| ko | ko | Korean |
| vi | vi | Vietnamese |
| ru | ru | Russian |
| de | de | German |
| hi | hi | Hindi |
| id | id | Indonesian |

## State persistence

The translation language selection is automatically saved to `localStorage` under the key `tiptap_translate_target_lang`.

- After a user selects a language, it is automatically restored the next time the editor opens
- The saved language can be cleared with `clearTranslateLang()`

## Comparison with the continue-writing feature

This translation feature follows the implementation approach of the continue-writing feature:

| Feature | Continue-writing | Translation |
|------|---------|---------|
| Extension file | ContinueWritingExtension.ts | TranslationExtension.ts |
| Button component | ContinueWritingButton.vue | None (uses AiMenuButton) |
| State management | None | translateStore.ts |
| Configuration management | None | languageCodes.ts |
| Interaction | Direct click | Select language via the AiMenuButton dropdown |

## Notes

1. **Text selection**: the translate feature requires selecting the text to translate first
2. **Language labels**: uses language labels (e.g. "英文", "中文") rather than language codes (e.g. "en", "zh")
3. **Internationalization**: language labels are obtained via `t('editor.lang.${key}')`; make sure there is a corresponding translation in the locales files
4. **API dependency**: requires the `aiApiService.translate()` method support

## Related files

- `../shared/aiSuggestionManager.ts` - AI suggestion manager
- `../shared/AiSuggestionPopover.vue` - AI suggestion popover component
- `../../locales.ts` - Internationalization file

