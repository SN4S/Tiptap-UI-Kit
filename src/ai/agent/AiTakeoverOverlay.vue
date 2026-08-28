<template>
  <Teleport to="body">
    <Transition name="ai-takeover-fade">
      <div v-if="active && rect" class="ai-takeover" :style="overlayStyle" aria-hidden="true">
        <!-- Top badge: AI is taking over -->
        <div class="ai-takeover__chip">
          <ThunderboltOutlined />
          {{ t('aiChat.takeover') }}
        </div>

        <!-- Changed-area highlight (flashes once per edit) -->
        <div
          v-if="highlight"
          :key="highlight.key"
          class="ai-takeover__highlight"
          :style="{
            left: `${highlight.left - (rect?.left ?? 0)}px`,
            top: `${highlight.top - (rect?.top ?? 0)}px`,
            width: `${highlight.width}px`,
            height: `${highlight.height}px`,
          }"
        />

        <!-- Large AI cursor: follows the modification position smoothly -->
        <div
          v-if="cursor"
          class="ai-takeover__cursor"
          :style="{
            left: `${cursor.left - (rect?.left ?? 0)}px`,
            top: `${cursor.top - (rect?.top ?? 0)}px`,
            height: `${cursor.height}px`,
          }"
        >
          <span class="ai-takeover__cursor-flag">
            <ThunderboltOutlined />
            AI
          </span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * AiTakeoverOverlay - AI takeover overlay and edit cursor
 * @description While the AI agent edits the document:
 * 1. Covers the editing area with a breathing-bordered overlay (intercepts user input, avoiding conflicts with concurrent AI edits)
 * 2. Uses a large cursor with a ⚡AI flag that smoothly follows each modification's position, auto-scrolls to follow, and flashes to highlight the changed area
 * Visual reference: the "AI controlling the browser" takeover interaction, like Operator.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Editor } from '@tiptap/core'
import type { Transaction } from '@tiptap/pm/state'
import { ThunderboltOutlined } from '@ant-design/icons-vue'
import { t } from '@/locales'

interface Props {
  editor: Editor | null | undefined
  active: boolean
}

const props = defineProps<Props>()

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

const rect = ref<Rect | null>(null)
const cursor = ref<{ left: number; top: number; height: number } | null>(null)
const highlight = ref<{ left: number; top: number; width: number; height: number; key: number } | null>(null)

const overlayStyle = computed(() =>
  rect.value
    ? {
        left: `${rect.value.left}px`,
        top: `${rect.value.top}px`,
        width: `${rect.value.width}px`,
        height: `${rect.value.height}px`,
      }
    : undefined
)

// ===== Overlay position tracking (syncs the editor geometry every frame while AI runs; follows content growth/scroll) =====
let rafId: number | null = null

/** Find the nearest scroll container upward (in Word mode the paper is taller than the viewport, so the overlay must be clipped to the visible area) */
function getScrollContainer(el: HTMLElement): HTMLElement | null {
  let cur = el.parentElement
  while (cur && cur !== document.body) {
    const cs = getComputedStyle(cur)
    if (/(auto|scroll|overlay)/.test(cs.overflowY) && cur.scrollHeight > cur.clientHeight + 1) {
      return cur
    }
    cur = cur.parentElement
  }
  return null
}

/** Overlay = editing area ∩ scroll container's visible region ∩ viewport: only covers the visible document area, not the header/toolbar */
function updateOverlayRect(view: import('@tiptap/pm/view').EditorView) {
  const r = view.dom.getBoundingClientRect()
  const container = getScrollContainer(view.dom)
  // In scenarios like a background tab, innerWidth/innerHeight may read 0; skip the viewport clipping in that case
  const vw = window.innerWidth || Number.MAX_SAFE_INTEGER
  const vh = window.innerHeight || Number.MAX_SAFE_INTEGER
  const cr = container
    ? container.getBoundingClientRect()
    : { left: 0, top: 0, right: vw, bottom: vh }
  const left = Math.max(r.left, cr.left, 0)
  const top = Math.max(r.top, cr.top, 0)
  const right = Math.min(r.right, cr.right, vw)
  const bottom = Math.min(r.bottom, cr.bottom, vh)
  rect.value =
    right - left > 40 && bottom - top > 40
      ? { left, top, width: right - left, height: bottom - top }
      : null
}

function trackRect() {
  const view = props.editor && !props.editor.isDestroyed ? props.editor.view : null
  if (!view) {
    rect.value = null
    return
  }
  updateOverlayRect(view)
  // The cursor/highlight are anchored to document positions and their screen coordinates are recomputed every frame——
  // during scrolling they stay pinned to the document content, rather than floating at old screen positions
  syncAnchoredVisuals(view)

  rafId = requestAnimationFrame(trackRect)
}

/** Refreshes the cursor and highlight screen coordinates every frame based on their document anchors */
function syncAnchoredVisuals(view: import('@tiptap/pm/view').EditorView) {
  const docSize = view.state.doc.content.size
  try {
    if (cursorAnchor !== null) {
      const coords = view.coordsAtPos(Math.max(0, Math.min(cursorAnchor, docSize)))
      cursor.value = {
        left: coords.left,
        top: coords.top,
        height: Math.max(coords.bottom - coords.top, 18),
      }
    }
    if (highlightAnchor !== null) {
      const fromCoords = view.coordsAtPos(Math.max(0, Math.min(highlightAnchor.from, docSize)))
      const toCoords = view.coordsAtPos(Math.max(0, Math.min(highlightAnchor.to, docSize)))
      const editorRect = view.dom.getBoundingClientRect()
      // Keep the key unchanged: only update the geometry, do not restart the flash animation
      highlight.value = {
        left: editorRect.left + 8,
        top: fromCoords.top,
        width: editorRect.width - 16,
        height: Math.max(toCoords.bottom - fromCoords.top, 20),
        key: highlightAnchor.key,
      }
    }
  } catch {
    // coordsAtPos may throw at extreme positions; keeping the previous frame's coordinates is fine
  }
}

function stopTracking() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

// ===== Modification position -> cursor/highlight/scroll =====
// The cursor and highlight record "document position anchors"; screen coordinates are recomputed by trackRect each frame (pinned to content when scrolling)
let highlightKey = 0
let cursorAnchor: number | null = null
let highlightAnchor: { from: number; to: number; key: number } | null = null

function onTransaction({ transaction }: { transaction: Transaction }) {
  if (!transaction.docChanged || !props.editor || props.editor.isDestroyed) return
  const view = props.editor.view

  // Take this transaction's modification range as the "AI is editing here" position
  let from: number | null = null
  let to: number | null = null
  transaction.mapping.maps.forEach((stepMap) => {
    stepMap.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
      from = from === null ? newStart : Math.min(from, newStart)
      to = to === null ? newEnd : Math.max(to, newEnd)
    })
  })
  if (from === null || to === null) return

  const docSize = view.state.doc.content.size
  const safeFrom = Math.max(0, Math.min(from, docSize))
  const safeTo = Math.max(0, Math.min(to, docSize))

  cursorAnchor = safeTo
  highlightAnchor = { from: safeFrom, to: safeTo, key: ++highlightKey }

  // When the transaction event fires, the view DOM is already updated: immediately refresh the overlay origin and cursor/highlight, then scroll.
  // The overlay origin must update in the same frame as the cursor coordinates (the template does relative-position math),
  // and we can't rely only on the rAF loop—in background tabs the browser pauses rAF
  updateOverlayRect(view)
  syncAnchoredVisuals(view)
  scrollToPosIfNeeded(safeTo)
}

/**
 * Gentle scrolling: only scrolls the editor's own scroll container (not the page body),
 * and only when the target is outside the comfortable viewport range, scrolling to about 60% of the container's height.
 */
function scrollToPosIfNeeded(pos: number) {
  const view = props.editor && !props.editor.isDestroyed ? props.editor.view : null
  if (!view) return
  try {
    const coords = view.coordsAtPos(Math.max(0, Math.min(pos, view.state.doc.content.size)))
    const container = getScrollContainer(view.dom)
    if (container) {
      const cr = container.getBoundingClientRect()
      // Don't scroll if the target is already within the comfortable viewport range (the middle area outside the top 15% and bottom 25%)
      const comfortTop = cr.top + cr.height * 0.15
      const comfortBottom = cr.bottom - cr.height * 0.25
      if (coords.top >= comfortTop && coords.bottom <= comfortBottom) return
      container.scrollTo({
        top: container.scrollTop + (coords.top - (cr.top + cr.height * 0.6)),
        behavior: 'smooth',
      })
    } else {
      // No internal scroll container (e.g. Notion theme scrolls the whole page): only scroll the window when the target is outside the viewport
      if (coords.top >= window.innerHeight * 0.15 && coords.bottom <= window.innerHeight * 0.75) return
      window.scrollTo({
        top: window.scrollY + (coords.top - window.innerHeight * 0.6),
        behavior: 'smooth',
      })
    }
  } catch {
    // Pure visual enhancement; skip scrolling if the position is anomalous
  }
}

// ===== Lifecycle =====
watch(
  () => [props.active, props.editor] as const,
  ([active, editor], _, onCleanup) => {
    stopTracking()
    cursor.value = null
    highlight.value = null
    cursorAnchor = null
    highlightAnchor = null
    if (active && editor && !editor.isDestroyed) {
      trackRect()
      editor.on('transaction', onTransaction)
      onCleanup(() => {
        editor.off('transaction', onTransaction)
      })
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  stopTracking()
})
</script>

<style scoped>
.ai-takeover {
  position: fixed;
  z-index: 940; /* Below the chat panel (950), above the editor content */
  pointer-events: auto; /* Intercepts user input, avoiding concurrent conflicts during AI editing */
  cursor: progress;
  background: color-mix(in srgb, var(--tiptap-primary, #3b82f6) 4%, transparent);
  border-radius: 8px;
  overflow: hidden;
  animation: ai-takeover-breathe 2.4s ease-in-out infinite;
}

@keyframes ai-takeover-breathe {
  0%,
  100% {
    box-shadow:
      inset 0 0 0 2px color-mix(in srgb, var(--tiptap-primary, #3b82f6) 55%, transparent),
      inset 0 0 32px color-mix(in srgb, var(--tiptap-primary, #3b82f6) 12%, transparent);
  }
  50% {
    box-shadow:
      inset 0 0 0 2px color-mix(in srgb, var(--tiptap-primary, #3b82f6) 25%, transparent),
      inset 0 0 12px color-mix(in srgb, var(--tiptap-primary, #3b82f6) 5%, transparent);
  }
}

.ai-takeover__chip {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--tiptap-primary, #3b82f6);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

.ai-takeover__highlight {
  position: absolute;
  border-radius: 6px;
  background: color-mix(in srgb, var(--tiptap-primary, #3b82f6) 28%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--tiptap-primary, #3b82f6) 45%, transparent);
  pointer-events: none;
  animation: ai-takeover-flash 1.8s ease-out forwards;
}

@keyframes ai-takeover-flash {
  0% {
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.ai-takeover__cursor {
  position: absolute;
  width: 4px;
  border-radius: 2px;
  background: var(--tiptap-primary, #3b82f6);
  box-shadow: 0 0 10px color-mix(in srgb, var(--tiptap-primary, #3b82f6) 70%, transparent);
  pointer-events: none;
  /* Follows the document anchor every frame: short transition values keep a sense of motion while flying and reduce lag when following scroll */
  transition: left 0.22s ease-out, top 0.22s ease-out, height 0.15s ease;
  animation: ai-takeover-cursor-pulse 1s ease-in-out infinite;
}

.ai-takeover__cursor-flag {
  position: absolute;
  top: -28px;
  left: 3px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px 8px 8px 0;
  background: var(--tiptap-primary, #3b82f6);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25);
}

@keyframes ai-takeover-cursor-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}

.ai-takeover-fade-enter-active,
.ai-takeover-fade-leave-active {
  transition: opacity 0.25s ease;
}

.ai-takeover-fade-enter-from,
.ai-takeover-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .ai-takeover,
  .ai-takeover__cursor {
    animation: none;
  }
}
</style>
