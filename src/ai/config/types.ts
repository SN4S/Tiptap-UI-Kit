/**
 * AI Configuration Types
 * @description AI user configuration system type definitions
 */

/** Supported AI providers */
export type AiProvider =
  | 'openai'
  | 'deepseek'
  | 'anthropic'
  | 'aliyun'
  | 'ollama'
  | 'custom'

/** AI provider information */
export interface AiProviderInfo {
  /** Provider ID */
  id: AiProvider
  /** Display name */
  name: string
  /** Description */
  description: string
  /** Default API endpoint */
  defaultEndpoint: string
  /** Default model */
  defaultModel: string
  /** Whether API Key is required */
  requiresApiKey: boolean
  /** Documentation link */
  docsUrl?: string
}

/** User AI configuration */
export interface AiUserConfig {
  /** Selected provider */
  provider: AiProvider
  /** API Key (encrypted storage) */
  apiKey: string
  /** API Endpoint (optional, for custom or proxy) */
  endpoint?: string
  /** Model name */
  model: string
  /** Request timeout (ms) */
  timeout: number
  /** Whether enabled */
  enabled: boolean
  /** Last updated timestamp */
  updatedAt: number
}

/** AI configuration state */
export interface AiConfigState {
  /** User configuration */
  config: AiUserConfig | null
  /** Whether initialized */
  initialized: boolean
  /** Connection test status */
  testStatus: 'idle' | 'testing' | 'success' | 'error'
  /** Test error message */
  testError: string | null
}

/** AI configuration store interface */
export interface AiConfigStore {
  /** Get configuration */
  getConfig: () => AiUserConfig | null
  /** Save configuration */
  saveConfig: (config: AiUserConfig) => void
  /** Clear configuration */
  clearConfig: () => void
  /** Get API Key (decrypted) */
  getApiKey: () => string | null
  /** Check if configured */
  isConfigured: () => boolean
}

/** Connection test result */
export interface ConnectionTestResult {
  success: boolean
  message: string
  latency?: number
}

/** Default configuration values */
export const DEFAULT_CONFIG: Omit<AiUserConfig, 'apiKey' | 'updatedAt'> = {
  provider: 'openai',
  endpoint: '',
  model: 'gpt-4o-mini',
  timeout: 60000,
  enabled: true,
}

/** Provider list */
export const AI_PROVIDERS: AiProviderInfo[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4o-mini and other models',
    defaultEndpoint: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    requiresApiKey: true,
    docsUrl: 'https://platform.openai.com/docs',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek-V3, DeepSeek-R1 and other models',
    defaultEndpoint: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    requiresApiKey: true,
    docsUrl: 'https://platform.deepseek.com/docs',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.5 Sonnet, Claude 3 Opus and other models',
    defaultEndpoint: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    requiresApiKey: true,
    docsUrl: 'https://docs.anthropic.com',
  },
  {
    id: 'aliyun',
    name: 'Aliyun Qwen',
    description: 'Qwen-Max, Qwen-Plus and other models',
    defaultEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    requiresApiKey: true,
    docsUrl: 'https://help.aliyun.com/zh/dashscope/',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Locally running open-source models',
    defaultEndpoint: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    requiresApiKey: false,
    docsUrl: 'https://ollama.com/docs',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Custom OpenAI compatible interface',
    defaultEndpoint: '',
    defaultModel: '',
    requiresApiKey: true,
  },
]

/** Get provider information by provider ID */
export function getProviderInfo(provider: AiProvider): AiProviderInfo | undefined {
  return AI_PROVIDERS.find(p => p.id === provider)
}
