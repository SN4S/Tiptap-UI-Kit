/**
 * Translation language code configuration
 * @description Defines the supported language codes and their mapping relationships
 */

export interface LanguageCode {
  code: string;
  key: string;
}

/**
 * The list of supported language codes
 * Used for the translate feature's language selection
 */
export const LANGUAGE_CODES: LanguageCode[] = [
  { code: 'zh-CN', key: 'zh-CN' },
  { code: 'zh-TW', key: 'zh-TW' },
  { code: 'en', key: 'en' },
  { code: 'ja', key: 'ja' },
  { code: 'th', key: 'th' },
  { code: 'fr', key: 'fr' },
  { code: 'es', key: 'es' },
  { code: 'pt', key: 'pt' },
  { code: 'ko', key: 'ko' },
  { code: 'vi', key: 'vi' },
  { code: 'ru', key: 'ru' },
  { code: 'de', key: 'de' },
  { code: 'hi', key: 'hi' },
  { code: 'id', key: 'id' },
];

