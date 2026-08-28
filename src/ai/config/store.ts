/**
 * AI Configuration Store
 * @description AI configuration localStorage persistent storage
 */

import type { AiUserConfig, AiConfigStore } from './types'
import { DEFAULT_CONFIG, getProviderInfo } from './types'

/** Storage keys */
const STORAGE_KEY = 'tiptap-ai-config'
const API_KEY_STORAGE_KEY = 'tiptap-ai-apikey'

/**
 * Simple obfuscation encoding (non-encrypted, only prevents plaintext storage)
 * Note: This is not real encryption, just basic obfuscation
 */
function obfuscate(str: string): string {
  if (!str) return ''
  try {
    return btoa(encodeURIComponent(str).split('').reverse().join(''))
  } catch {
    return ''
  }
}

/**
 * Deobfuscation
 */
function deobfuscate(str: string): string {
  if (!str) return ''
  try {
    return decodeURIComponent(atob(str).split('').reverse().join(''))
  } catch {
    return ''
  }
}

/**
 * Safe localStorage operations
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/**
 * Get stored configuration (excluding API Key)
 */
function getStoredConfig(): Omit<AiUserConfig, 'apiKey'> | null {
  const data = safeGetItem(STORAGE_KEY)
  if (!data) return null

  try {
    const parsed = JSON.parse(data)
    // Validate required fields
    if (parsed && typeof parsed.provider === 'string') {
      return {
        provider: parsed.provider,
        endpoint: parsed.endpoint || '',
        model: parsed.model || '',
        timeout: parsed.timeout || DEFAULT_CONFIG.timeout,
        enabled: parsed.enabled !== false,
        updatedAt: parsed.updatedAt || Date.now(),
      }
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * Get stored API Key
 */
function getStoredApiKey(): string {
  const obfuscated = safeGetItem(API_KEY_STORAGE_KEY)
  return obfuscated ? deobfuscate(obfuscated) : ''
}

/**
 * Create AI configuration store
 */
export function createAiConfigStore(): AiConfigStore {
  return {
    getConfig(): AiUserConfig | null {
      const stored = getStoredConfig()
      if (!stored) return null

      return {
        ...stored,
        apiKey: getStoredApiKey(),
      }
    },

    saveConfig(config: AiUserConfig): void {
      // Separate storage: configuration and API Key stored separately
      const { apiKey, ...rest } = config
      const configToStore = {
        ...rest,
        updatedAt: Date.now(),
      }

      safeSetItem(STORAGE_KEY, JSON.stringify(configToStore))

      // API Key stored with separate obfuscation
      if (apiKey) {
        safeSetItem(API_KEY_STORAGE_KEY, obfuscate(apiKey))
      } else {
        safeRemoveItem(API_KEY_STORAGE_KEY)
      }
    },

    clearConfig(): void {
      safeRemoveItem(STORAGE_KEY)
      safeRemoveItem(API_KEY_STORAGE_KEY)
    },

    getApiKey(): string | null {
      const key = getStoredApiKey()
      return key || null
    },

    isConfigured(): boolean {
      const config = this.getConfig()
      if (!config || !config.enabled) return false

      const providerInfo = getProviderInfo(config.provider)
      if (!providerInfo) return false

      // Check necessary conditions
      if (providerInfo.requiresApiKey && !config.apiKey) {
        return false
      }

      // Custom provider requires endpoint
      if (config.provider === 'custom' && !config.endpoint) {
        return false
      }

      return true
    },
  }
}

/** Singleton instance */
let storeInstance: AiConfigStore | null = null

/**
 * Get configuration store instance
 */
export function getAiConfigStore(): AiConfigStore {
  if (!storeInstance) {
    storeInstance = createAiConfigStore()
  }
  return storeInstance
}

/**
 * Reset store instance (for testing)
 */
export function resetAiConfigStore(): void {
  storeInstance = null
}
