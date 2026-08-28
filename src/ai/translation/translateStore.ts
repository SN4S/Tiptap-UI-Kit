/**
 * Translation language state management
 * @description Manages the selection and persistence of the translation target language
 */
import { ref } from 'vue';

const STORAGE_KEY = 'tiptap_translate_target_lang';

// Globally shared translation target language (initially empty; the user must choose one first)
const saved = typeof window !== 'undefined' ? window.localStorage?.getItem(STORAGE_KEY) : null;
export const currentTranslateLang = ref<string>(saved || '');

/**
 * Sets the language and persists it to localStorage
 * @param label The language label (e.g. "English", "Chinese", etc.)
 */
export function setTranslateLang(label: string) {
  try {
    currentTranslateLang.value = label;
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(STORAGE_KEY, label);
    }
  } catch (error) {
    console.warn('[Translate Store] Failed to save language preference:', error);
  }
}

/**
 * Clears the saved language selection
 */
export function clearTranslateLang() {
  try {
    currentTranslateLang.value = '';
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.warn('[Translate Store] Failed to clear language preference:', error);
  }
}

// Allow external code to access the storage key (if needed)
export { STORAGE_KEY };

