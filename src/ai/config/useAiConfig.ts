/**
 * AI Configuration Composable
 * @description Vue Composable for AI configuration management
 */

import { ref, computed, readonly } from 'vue'
import type {
  AiUserConfig,
  AiProvider,
  AiConfigState,
  ConnectionTestResult,
} from './types'
import { DEFAULT_CONFIG, getProviderInfo, AI_PROVIDERS } from './types'
import { getAiConfigStore } from './store'

/** Global reactive state */
const state = ref<AiConfigState>({
  config: null,
  initialized: false,
  testStatus: 'idle',
  testError: null,
})

/** Initialization flag */
let isInitialized = false

/**
 * Initialize configuration
 */
function initConfig(): void {
  if (isInitialized) return

  const store = getAiConfigStore()
  const savedConfig = store.getConfig()

  if (savedConfig) {
    state.value.config = savedConfig
  }

  state.value.initialized = true
  isInitialized = true
}

/**
 * Test API connection
 */
async function testConnection(config: AiUserConfig): Promise<ConnectionTestResult> {
  const providerInfo = getProviderInfo(config.provider)
  if (!providerInfo) {
    return { success: false, message: 'Unknown provider' }
  }

  // Check required parameters
  if (providerInfo.requiresApiKey && !config.apiKey) {
    return { success: false, message: 'Please enter API Key' }
  }

  const endpoint = config.endpoint || providerInfo.defaultEndpoint
  if (!endpoint) {
    return { success: false, message: 'Please enter API endpoint' }
  }

  const startTime = Date.now()

  try {
    // Build test request
    let testUrl = endpoint
    let testBody: string
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (config.provider === 'ollama') {
      // Ollama uses /api/tags to test
      testUrl = endpoint.replace(/\/api\/?$/, '') + '/api/tags'
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const latency = Date.now() - startTime
      return { success: true, message: 'Connection successful', latency }
    }

    if (config.provider === 'anthropic') {
      // Anthropic uses different headers
      headers['x-api-key'] = config.apiKey
      headers['anthropic-version'] = '2023-06-01'
      testUrl = endpoint.replace(/\/$/, '') + '/messages'
      testBody = JSON.stringify({
        model: config.model || providerInfo.defaultModel,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      })
    } else {
      // OpenAI compatible interface
      headers['Authorization'] = `Bearer ${config.apiKey}`
      testUrl = endpoint.replace(/\/$/, '') + '/chat/completions'
      testBody = JSON.stringify({
        model: config.model || providerInfo.defaultModel,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      })
    }

    const response = await fetch(testUrl, {
      method: 'POST',
      headers,
      body: testBody,
      signal: AbortSignal.timeout(15000),
    })

    const latency = Date.now() - startTime

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage =
        errorData.error?.message || errorData.message || `HTTP ${response.status}`
      return { success: false, message: errorMessage, latency }
    }

    return { success: true, message: 'Connection successful', latency }
  } catch (error) {
    const latency = Date.now() - startTime
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return { success: false, message: 'Connection timeout', latency }
      }
      return { success: false, message: error.message, latency }
    }
    return { success: false, message: 'Connection failed', latency }
  }
}

/**
 * useAiConfig Composable
 */
export function useAiConfig() {
  // Ensure initialization
  initConfig()

  const store = getAiConfigStore()

  // Computed properties
  const config = computed(() => state.value.config)
  const isConfigured = computed(() => store.isConfigured())
  const isEnabled = computed(() => state.value.config?.enabled ?? false)
  const currentProvider = computed(() => state.value.config?.provider ?? 'openai')
  const currentProviderInfo = computed(() => getProviderInfo(currentProvider.value))
  const testStatus = computed(() => state.value.testStatus)
  const testError = computed(() => state.value.testError)

  /**
   * Save configuration
   */
  function saveConfig(newConfig: AiUserConfig): void {
    store.saveConfig(newConfig)
    state.value.config = newConfig
    state.value.testStatus = 'idle'
    state.value.testError = null
  }

  /**
   * Update partial configuration
   */
  function updateConfig(partial: Partial<AiUserConfig>): void {
    const current = state.value.config || {
      ...DEFAULT_CONFIG,
      apiKey: '',
      updatedAt: Date.now(),
    }
    saveConfig({ ...current, ...partial })
  }

  /**
   * Switch provider
   */
  function setProvider(provider: AiProvider): void {
    const providerInfo = getProviderInfo(provider)
    if (!providerInfo) return

    updateConfig({
      provider,
      endpoint: providerInfo.defaultEndpoint,
      model: providerInfo.defaultModel,
    })
  }

  /**
   * Test connection
   */
  async function testConnectionAsync(): Promise<ConnectionTestResult> {
    const currentConfig = state.value.config
    if (!currentConfig) {
      return { success: false, message: 'Please configure AI settings first' }
    }

    state.value.testStatus = 'testing'
    state.value.testError = null

    const result = await testConnection(currentConfig)

    state.value.testStatus = result.success ? 'success' : 'error'
    state.value.testError = result.success ? null : result.message

    return result
  }

  /**
   * Clear configuration
   */
  function clearConfig(): void {
    store.clearConfig()
    state.value.config = null
    state.value.testStatus = 'idle'
    state.value.testError = null
  }

  /**
   * Get configuration for API requests
   */
  function getRequestConfig(): {
    endpoint: string
    apiKey: string
    model: string
    timeout: number
  } | null {
    const cfg = state.value.config
    if (!cfg || !cfg.enabled) return null

    const providerInfo = getProviderInfo(cfg.provider)
    if (!providerInfo) return null

    return {
      endpoint: cfg.endpoint || providerInfo.defaultEndpoint,
      apiKey: cfg.apiKey,
      model: cfg.model || providerInfo.defaultModel,
      timeout: cfg.timeout || DEFAULT_CONFIG.timeout,
    }
  }

  return {
    // State
    config: readonly(config),
    isConfigured: readonly(isConfigured),
    isEnabled: readonly(isEnabled),
    currentProvider: readonly(currentProvider),
    currentProviderInfo: readonly(currentProviderInfo),
    testStatus: readonly(testStatus),
    testError: readonly(testError),
    providers: AI_PROVIDERS,

    // Methods
    saveConfig,
    updateConfig,
    setProvider,
    testConnection: testConnectionAsync,
    clearConfig,
    getRequestConfig,
  }
}

/**
 * Get static configuration (non-reactive, for API calls)
 */
export function getAiRequestConfig(): {
  endpoint: string
  apiKey: string
  model: string
  timeout: number
  provider: AiProvider
} | null {
  const store = getAiConfigStore()
  const config = store.getConfig()

  if (!config || !config.enabled) return null

  const providerInfo = getProviderInfo(config.provider)
  if (!providerInfo) return null

  // Check required conditions
  if (providerInfo.requiresApiKey && !config.apiKey) {
    return null
  }

  return {
    endpoint: config.endpoint || providerInfo.defaultEndpoint,
    apiKey: config.apiKey,
    model: config.model || providerInfo.defaultModel,
    timeout: config.timeout || DEFAULT_CONFIG.timeout,
    provider: config.provider,
  }
}
