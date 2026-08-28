/**
 * AI API Service
 * Provides AI streaming capabilities using user configuration or environment variables
 */

import { getAiRequestConfig } from '@/ai/config/useAiConfig'

// AI Callback interface used by the extensions
export interface AiStreamCallback {
  onStart?: () => void
  onMessage?: (message: { content: string }) => void
  onStop?: () => void
  onError?: (error: Error) => void
}

export interface AiApiResponse {
  success: boolean
  content?: string
  error?: string
}

/**
 * Load API configuration
 * Priority: User config > Environment variables > Defaults
 * @description Reused by ai/agent tool-use loop
 */
export function getAiConfig() {
  // First check user config (localStorage)
  const userConfig = getAiRequestConfig()
  if (userConfig) {
    return {
      provider: userConfig.provider,
      apiKey: userConfig.apiKey,
      baseUrl: userConfig.endpoint,
      model: userConfig.model,
      timeout: userConfig.timeout,
    }
  }

  // Fall back to environment variables
  const env = import.meta.env || {}
  return {
    provider: env.VITE_AI_PROVIDER || 'openai',
    apiKey: env.VITE_AI_API_KEY || '',
    baseUrl: env.VITE_AI_BASE_URL || '',
    model: env.VITE_AI_MODEL || 'gpt-4o-mini',
    timeout: DEFAULT_TIMEOUT,
  }
}

// Get base URL for provider
export function getBaseUrl(provider: string, customUrl: string): string {
  if (customUrl) return customUrl
  const urls: Record<string, string> = {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
    aliyun: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    deepseek: 'https://api.deepseek.com/v1',
    // Ollama's OpenAI-compatible endpoint (/api is its private protocol, not compatible with /chat/completions)
    ollama: 'http://localhost:11434/v1',
  }
  return urls[provider] || urls.openai
}

// Default timeout for AI requests (60 seconds)
const DEFAULT_TIMEOUT = 60000

/**
 * Simulate AI streaming response for demo purposes
 * Shows how the AI feature works without requiring API key configuration
 */
async function simulateAiStream(
  callback: AiStreamCallback,
  demoType: 'continue' | 'polish' | 'summarize' | 'translate' | 'custom'
): Promise<void> {
  const demoMessages: Record<typeof demoType, string> = {
    continue: 'This is a demo of the AI continue writing feature.\n\n💡 Tip: To use real AI capabilities, please configure your API Key in the toolbar AI Settings.\n\nSupported AI providers:\n• OpenAI (GPT-4, GPT-3.5)\n• Aliyun Qwen\n• DeepSeek\n• Ollama (local deployment)\n\nAfter configuration, AI will intelligently continue writing based on your content.',
    polish: 'This is a demo of the AI text polishing feature.\n\n💡 Tip: To use real AI polishing capabilities, please configure your API Key in the toolbar AI Settings.\n\nAfter configuration, AI will help you:\n• Optimize text phrasing for smooth reading\n• Correct grammatical errors\n• Enhance professionalism and readability\n• Improve writing style while preserving original meaning',
    summarize: 'This is a demo of the AI summarization feature.\n\n💡 Tip: To use real AI summarization capabilities, please configure your API Key in the toolbar AI Settings.\n\nAfter configuration, AI will intelligently extract key points and generate concise summaries to help readers quickly grasp core information.',
    translate: 'This is a demo of the AI translation feature.\n\n💡 Tip: To use the real AI translation feature, please configure your API Key in the AI Settings on the toolbar.\n\nAfter configuration, AI will provide high-quality translations while maintaining the original meaning and style.',
    custom: 'This is a demo of custom AI commands.\n\n💡 Tip: To use real custom AI capabilities, please configure your API Key in the toolbar AI Settings.\n\nAfter configuration, you can enter any custom prompt, and AI will process the selected text according to your instructions.',
  }

  const message = demoMessages[demoType]

  try {
    callback.onStart?.()

    // Simulate streaming by sending message character by character
    let index = 0
    const streamInterval = setInterval(() => {
      if (index < message.length) {
        // Send 2-5 characters at a time for more natural streaming
        const chunkSize = Math.floor(Math.random() * 4) + 2
        const chunk = message.slice(index, index + chunkSize)
        callback.onMessage?.({ content: chunk })
        index += chunkSize
      } else {
        clearInterval(streamInterval)
        callback.onStop?.()
      }
    }, 50) // 50ms interval for smooth streaming effect
  } catch (error) {
    callback.onError?.(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Send streaming request to AI provider with timeout control
 */
async function sendStreamingRequest(
  prompt: string,
  content: string,
  callback: AiStreamCallback,
  demoType?: 'continue' | 'polish' | 'summarize' | 'translate' | 'custom'
): Promise<void> {
  const config = getAiConfig()

  // If no API key configured, show demo/simulation instead of error
  if (!config.apiKey) {
    await simulateAiStream(callback, demoType || 'custom')
    return
  }

  const baseUrl = getBaseUrl(config.provider, config.baseUrl)
  const timeout = config.timeout || DEFAULT_TIMEOUT

  // Create AbortController for timeout control
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeout)

  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

  try {
    callback.onStart?.()

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content },
        ],
        stream: true,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`)
    }

    reader = response.body?.getReader() ?? null
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const messageContent = parsed.choices?.[0]?.delta?.content
          if (messageContent) {
            callback.onMessage?.({ content: messageContent })
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    callback.onStop?.()
  } catch (error) {
    // Handle abort error specifically
    if (error instanceof Error && error.name === 'AbortError') {
      callback.onError?.(new Error('AI request timeout. Please try again.'))
    } else {
      callback.onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  } finally {
    // Cleanup
    clearTimeout(timeoutId)
    if (reader) {
      try {
        await reader.cancel()
      } catch {
        // Ignore cancel errors
      }
    }
  }
}

/**
 * AI API Service
 * Compatible with the original Kortex aiApiService interface
 */
export const aiApiService = {
  /**
   * Continue writing - streaming
   */
  continueWriting(
    content: string,
    sysPrompt: string,
    callback: AiStreamCallback
  ): void {
    const prompt = `${sysPrompt}\n\nYou are a professional writing assistant. Please continue writing based on the text selected by the user. Maintain the style and tone of the original text. Output only the continuation, do not repeat the selected text.`
    sendStreamingRequest(prompt, content, callback, 'continue')
  },

  /**
   * Polish text - streaming
   */
  polish(
    content: string,
    sysPrompt: string,
    callback: AiStreamCallback
  ): void {
    const prompt = `${sysPrompt}\n\nYou are a professional text polishing assistant. Please polish the following text to make it more fluent and professional. Preserve the original meaning and output only the polished text.`
    sendStreamingRequest(prompt, content, callback, 'polish')
  },

  /**
   * Summarize content - streaming
   */
  summarize(
    content: string,
    sysPrompt: string,
    callback: AiStreamCallback
  ): void {
    const prompt = `${sysPrompt}\n\nYou are a professional summarization assistant. Please summarize the key points of the following content. Output only a concise summary.`
    sendStreamingRequest(prompt, content, callback, 'summarize')
  },

  /**
   * Translate text - streaming
   */
  translate(
    content: string,
    targetLang: string,
    sysPrompt: string,
    callback: AiStreamCallback
  ): void {
    const prompt = `${sysPrompt}\n\nYou are a professional translation assistant. Please translate the following content into ${targetLang}. Output only the translation result.`
    sendStreamingRequest(prompt, content, callback, 'translate')
  },

  /**
   * Custom AI command - streaming
   */
  customCommand(
    content: string,
    customPrompt: string,
    sysPrompt: string,
    callback: AiStreamCallback
  ): void {
    const prompt = `${sysPrompt}\n\n${customPrompt}`
    sendStreamingRequest(prompt, content, callback, 'custom')
  },
}
