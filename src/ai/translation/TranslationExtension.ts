import type { Editor } from '@tiptap/core';

import { Extension } from '@tiptap/core';
import { notification } from 'ant-design-vue';

import { t } from '@/locales';

import { aiApiService } from '@/api/ai';

import { aiSuggestionManager } from '../shared/aiSuggestionManager';
import { currentTranslateLang } from './translateStore';

export interface TranslationOptions {
  defaultTargetLang?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    translation: {
      translate: (targetLang?: string) => ReturnType;
    };
  }
}

export const TranslationExtension = Extension.create<TranslationOptions>({
  name: 'translation',

  addOptions() {
    return {
      defaultTargetLang: '英文',
    };
  },

  addCommands() {
    return {
      translate:
        (targetLang?: string) =>
        ({ state, editor }) => {
          const { selection } = state;
          const { from, to } = selection;
          const selectedText = state.doc.textBetween(from, to, ' ');

          if (!selectedText.trim()) {
            console.warn('[Translation] No text selected');
            // Show a user-friendly prompt
            notification.warning({
              message: t('editor.pleaseSelectText'),
              description: t('editor.translateRequiresSelection'),
              duration: 3,
              placement: 'topRight',
            });
            return false;
          }

          // Prefer the passed-in language, then the saved language, and finally the default language
          const lang =
            targetLang ||
            currentTranslateLang.value ||
            this.options.defaultTargetLang ||
            '英文';
          performTranslation(editor, selectedText, lang, { from, to });
          return true;
        },
    };
  },
});

function performTranslation(
  editor: Editor,
  selectedText: string,
  targetLang: string,
  originalSelection: { from: number; to: number },
) {
  let accumulatedContent = '';

  // Show AI suggestion popover with highlight
  aiSuggestionManager.show(selectedText, originalSelection, editor);

  // Get full document context for system prompt
  const state = editor.state;
  const fullText = state.doc.textBetween(0, state.doc.content.size, ' ');
  const sysPrompt = `以下係完整嘅文件內容:\n\n${fullText}`;

  const callback = {
    onStart: () => {
      accumulatedContent = '';
    },
    onMessage: (message: { content: string }) => {
      if (message && message.content) {
        accumulatedContent += message.content;
        // Update the suggestion in popover
        aiSuggestionManager.updateSuggestion(accumulatedContent);
      }
    },
    onStop: () => {
      try {
        // Stop streaming indicator
        aiSuggestionManager.stopStreaming();

        // Update with final content
        aiSuggestionManager.updateSuggestion(accumulatedContent);
      } catch (error) {
        console.warn('[Translation] Failed to finalize formatting:', error);
      }
    },
    onError: (error: Error) => {
      console.error('[Translation] Error:', error);
      aiSuggestionManager.hide();
      notification.error({
        message: t('messages.translationFailed'),
        description: error.message || t('messages.networkError'),
        duration: 3,
      });
    },
  };

  aiApiService.translate(selectedText, targetLang, sysPrompt, callback);
}

