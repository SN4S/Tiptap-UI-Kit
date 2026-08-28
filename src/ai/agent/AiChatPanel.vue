<template>
  <Teleport to="body">
    <!-- Floating launcher button -->
    <button
      v-if="!open"
      class="ai-chat-launcher"
      type="button"
      :title="t('aiChat.title')"
      :aria-label="t('aiChat.title')"
      @click="open = true"
    >
      <ThunderboltOutlined />
      <span class="ai-chat-launcher__label">AI</span>
    </button>

    <!-- Chat panel -->
    <Transition name="ai-chat-slide">
      <div v-if="open" class="ai-chat-panel" role="dialog" :aria-label="t('aiChat.title')">
        <div class="ai-chat-panel__header">
          <span class="ai-chat-panel__title">
            <ThunderboltOutlined />
            {{ t('aiChat.title') }}
          </span>
          <div class="ai-chat-panel__actions">
            <button
              v-if="showSettingsEntry"
              class="ai-chat-panel__icon-btn"
              type="button"
              :title="t('aiChat.settings')"
              @click="showSettings = true"
            >
              <SettingOutlined />
            </button>
            <button
              class="ai-chat-panel__icon-btn"
              type="button"
              :title="t('aiChat.close')"
              @click="open = false"
            >
              <CloseOutlined />
            </button>
          </div>
        </div>

        <div ref="messagesRef" class="ai-chat-panel__messages">
          <div v-if="messages.length === 0" class="ai-chat-panel__welcome">
            {{ t('aiChat.welcome') }}
          </div>

          <template v-for="(msg, i) in messages" :key="i">
            <div v-if="msg.type === 'user'" class="ai-chat-msg ai-chat-msg--user">
              {{ msg.text }}
            </div>
            <div v-else-if="msg.type === 'assistant'" class="ai-chat-msg ai-chat-msg--assistant">
              {{ msg.text }}
              <button
                v-if="msg.showConfigure"
                class="ai-chat-panel__configure-btn"
                type="button"
                @click="showSettings = true"
              >
                {{ t('aiChat.configure') }}
              </button>
            </div>
            <div
              v-else-if="msg.type === 'tool'"
              class="ai-chat-step"
              :class="{ 'ai-chat-step--error': msg.isError }"
            >
              <component :is="msg.isError ? CloseCircleOutlined : CheckCircleOutlined" />
              {{ msg.text }}
            </div>
            <div v-else class="ai-chat-msg ai-chat-msg--error">
              {{ msg.text }}
              <button
                v-if="msg.showConfigure"
                class="ai-chat-panel__configure-btn"
                type="button"
                @click="showSettings = true"
              >
                {{ t('aiChat.configure') }}
              </button>
            </div>
          </template>

          <div v-if="running" class="ai-chat-step ai-chat-step--running">
            <LoadingOutlined spin />
            {{ t('aiChat.running') }}
          </div>
        </div>

        <div class="ai-chat-panel__input-area">
          <textarea
            ref="inputRef"
            v-model="input"
            class="ai-chat-panel__input"
            :placeholder="t('aiChat.placeholder')"
            :disabled="running"
            rows="2"
            @keydown.enter.exact="onEnterKey"
          />
          <button
            v-if="running"
            class="ai-chat-panel__send ai-chat-panel__send--stop"
            type="button"
            @click="stop"
          >
            {{ t('aiChat.stop') }}
          </button>
          <button
            v-else
            class="ai-chat-panel__send"
            type="button"
            :disabled="!input.trim() || !editor"
            @click="send"
          >
            {{ t('aiChat.send') }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- AI settings modal (reuses the existing component; not rendered when no settings entry is provided) -->
    <AiSettingsModal v-if="showSettingsEntry" v-model:open="showSettings" />

    <!-- AI takeover overlay + edit cursor (shown while the agent is running) -->
    <AiTakeoverOverlay :editor="editor" :active="running" />
  </Teleport>
</template>

<script setup lang="ts">
/**
 * AiChatPanel - AI document assistant chat panel
 * @description The user describes their needs in natural language ("help me add a 3x3 table at the end", "polish the second paragraph"),
 * and the AI directly edits the current document through a tool-use loop. Floats at the bottom-right of the editor, with its own launcher button.
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { Editor } from '@tiptap/core'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  LoadingOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons-vue'
import { t, useI18n } from '@/locales'
import AiSettingsModal from '../components/AiSettingsModal.vue'
import { runDocumentAgent, AgentNotConfiguredError } from './agentLoop'
import { runSimulatedDocumentAgent } from './simulatedAgent'
import AiTakeoverOverlay from './AiTakeoverOverlay.vue'

interface Props {
  editor: Editor | null | undefined
  /** Whether to provide an "AI settings" entry (a modal where end users fill in their own API Key). Recommended to disable on public sites */
  showSettingsEntry?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSettingsEntry: true,
})
const editor = computed(() => props.editor ?? null)

const { locale } = useI18n()

// ===== Panel state =====
const open = ref(false)
const showSettings = ref(false)
const running = ref(false)
const input = ref('')
const messagesRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)

interface ChatItem {
  type: 'user' | 'assistant' | 'tool' | 'error'
  text: string
  isError?: boolean
  showConfigure?: boolean
}

const messages = ref<ChatItem[]>([])

let abortController: AbortController | null = null

// ===== Tool name -> localized step label =====
function toolLabel(name: string): string {
  const key = `aiChat.tools.${name}`
  const label = t(key)
  return label === key ? name : label
}

// ===== Auto-scroll to bottom =====
async function scrollToBottom() {
  await nextTick()
  const el = messagesRef.value
  if (el) el.scrollTop = el.scrollHeight
}

watch(open, async (isOpen) => {
  if (isOpen) {
    await scrollToBottom()
    inputRef.value?.focus()
  }
})

/**
 * Demo-mode fallback: when no real AI is configured, simulate the instruction locally
 * (actually editing the document + replaying steps), appending "how to integrate real AI" guidance and a configuration entry at the end
 */
async function runDemoFallback(instruction: string) {
  if (!editor.value) {
    messages.value.push({
      type: 'error',
      text: t('aiChat.notConfigured'),
      showConfigure: props.showSettingsEntry,
    })
    return
  }
  try {
    const demo = await runSimulatedDocumentAgent({
      editor: editor.value,
      instruction,
      signal: abortController?.signal,
      callbacks: {
        onToolResult: (name, _result, isError) => {
          messages.value.push({ type: 'tool', text: toolLabel(name), isError })
          scrollToBottom()
        },
      },
    })
    // When a settings entry is provided, append a "fill in your API Key" line and button; public sites keep only the project-configuration guidance
    const text = props.showSettingsEntry
      ? `${demo.finalText}\n${t('aiChat.demo.configureLine')}`
      : demo.finalText
    messages.value.push({ type: 'assistant', text, showConfigure: props.showSettingsEntry })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      messages.value.push({ type: 'error', text: t('aiChat.stopped') })
    } else {
      messages.value.push({
        type: 'error',
        text: t('aiChat.notConfigured'),
        showConfigure: props.showSettingsEntry,
      })
    }
  }
}

// ===== Send =====
async function send() {
  const instruction = input.value.trim()
  if (!instruction || running.value || !editor.value) return

  // Multi-turn context: only include user/assistant text turns, the most recent 8 (built before pushing the current instruction, so it excludes this one)
  const history = messages.value
    .filter((m) => m.type === 'user' || m.type === 'assistant')
    .slice(-8)
    .map((m) => ({ role: m.type as 'user' | 'assistant', content: m.text }))

  input.value = ''
  messages.value.push({ type: 'user', text: instruction })
  running.value = true
  abortController = new AbortController()
  await scrollToBottom()

  try {
    const result = await runDocumentAgent({
      editor: editor.value,
      instruction,
      history,
      signal: abortController.signal,
      locale: locale.value,
      callbacks: {
        onToolResult: (name, _result, isError) => {
          messages.value.push({ type: 'tool', text: toolLabel(name), isError })
          scrollToBottom()
        },
      },
    })

    if (result.finalText) {
      messages.value.push({ type: 'assistant', text: result.finalText })
    } else if (result.toolCallCount > 0) {
      messages.value.push({ type: 'assistant', text: t('aiChat.doneNoSummary') })
    } else {
      messages.value.push({ type: 'error', text: t('aiChat.emptyResponse') })
    }
  } catch (error) {
    if (error instanceof AgentNotConfiguredError) {
      // No real AI configured: use demo mode (consistent with the simulate convention of continue-writing/polish and other features)——
      // use local scripts to actually edit the document so visitors can experience it first; the real Key is bound by the integrator in the project
      await runDemoFallback(instruction)
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      messages.value.push({ type: 'error', text: t('aiChat.stopped') })
    } else {
      const detail = error instanceof Error ? error.message : String(error)
      messages.value.push({ type: 'error', text: `${t('aiChat.error')}: ${detail}` })
    }
  } finally {
    running.value = false
    abortController = null
    await scrollToBottom()
    inputRef.value?.focus()
  }
}

function stop() {
  abortController?.abort()
}

// Abort a still-running agent when the panel unmounts (editor destroyed/route change), to avoid continued API consumption in the background
onBeforeUnmount(() => {
  abortController?.abort()
})

/** Enter sends; Enter during Chinese/Japanese IME composition (candidate-word confirmation) does not trigger */
function onEnterKey(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return
  e.preventDefault()
  send()
}
</script>

<style scoped>
/* ===== Launcher button ===== */
.ai-chat-launcher {
  position: fixed;
  right: 20px;
  bottom: 72px;
  z-index: 900;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 999px;
  background: var(--tiptap-primary, #3b82f6);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.ai-chat-launcher:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.24);
}

/* ===== Panel ===== */
.ai-chat-panel {
  position: fixed;
  right: 20px;
  bottom: 72px;
  z-index: 950;
  display: flex;
  flex-direction: column;
  width: 360px;
  max-width: calc(100vw - 40px);
  height: 480px;
  max-height: calc(100vh - 120px);
  border: 1px solid var(--tiptap-border, #e5e7eb);
  border-radius: 12px;
  background: var(--tiptap-bg, #ffffff);
  color: var(--tiptap-text, #1f2937);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16);
  overflow: hidden;
}

.ai-chat-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--tiptap-border, #e5e7eb);
  background: var(--tiptap-bg-secondary, #f9fafb);
}

.ai-chat-panel__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}

.ai-chat-panel__actions {
  display: flex;
  gap: 4px;
}

.ai-chat-panel__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--tiptap-text-secondary, #6b7280);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.ai-chat-panel__icon-btn:hover {
  background: var(--tiptap-toolbar-btn-hover, #e8e8e8);
  color: var(--tiptap-text, #1f2937);
}

/* ===== Message area ===== */
.ai-chat-panel__messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scrollbar-width: thin;
}

.ai-chat-panel__welcome {
  padding: 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--tiptap-text-secondary, #6b7280);
  white-space: pre-line;
}

.ai-chat-msg {
  max-width: 90%;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-chat-msg--user {
  align-self: flex-end;
  background: var(--tiptap-primary, #3b82f6);
  color: #fff;
}

.ai-chat-msg--assistant {
  align-self: flex-start;
  background: var(--tiptap-bg-secondary, #f3f4f6);
}

.ai-chat-msg--error {
  align-self: flex-start;
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.ai-chat-step {
  display: flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 2px 8px;
  font-size: 12px;
  color: var(--tiptap-text-secondary, #6b7280);
}

.ai-chat-step--error {
  color: #dc2626;
}

.ai-chat-step--running {
  color: var(--tiptap-primary, #3b82f6);
}

.ai-chat-panel__configure-btn {
  display: block;
  margin-top: 6px;
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  background: var(--tiptap-primary, #3b82f6);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

/* ===== Input area ===== */
.ai-chat-panel__input-area {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--tiptap-border, #e5e7eb);
}

.ai-chat-panel__input {
  flex: 1;
  resize: none;
  border: 1px solid var(--tiptap-border, #e5e7eb);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  font-family: inherit;
  line-height: 1.5;
  background: var(--tiptap-bg, #fff);
  color: var(--tiptap-text, #1f2937);
  outline: none;
  transition: border-color 0.15s ease;
}

.ai-chat-panel__input:focus {
  border-color: var(--tiptap-primary, #3b82f6);
}

.ai-chat-panel__send {
  flex-shrink: 0;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  background: var(--tiptap-primary, #3b82f6);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.ai-chat-panel__send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ai-chat-panel__send--stop {
  background: #dc2626;
}

/* ===== Entrance/exit animations ===== */
.ai-chat-slide-enter-active,
.ai-chat-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.ai-chat-slide-enter-from,
.ai-chat-slide-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* Dark mode needs no separate overrides: the panel uses only --tiptap-* variables,
   which are flipped on :root[data-theme="dark"], and they still cascade after Teleport to body */
</style>
