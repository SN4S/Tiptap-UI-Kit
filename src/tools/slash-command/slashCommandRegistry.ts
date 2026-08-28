import { ref, type Ref, type Component } from 'vue'
import type { Editor } from '@tiptap/core'

export interface SlashCommandItem {
  id: string
  title: string
  description: string
  icon: Component
  keywords: string[]
  action: (editor: Editor) => void
}

export interface SlashCommandGroup {
  title: string
  items: SlashCommandItem[]
}

// Reactive store for externally registered slash commands
export const registeredGroups: Ref<SlashCommandGroup[]> = ref<SlashCommandGroup[]>([])

/**
 * Register a new slash command group
 */
export function registerSlashCommandGroup(group: SlashCommandGroup): void {
  const existingIdx = registeredGroups.value.findIndex(g => g.title === group.title)
  if (existingIdx >= 0) {
    // Append items to existing group
    const existingGroup = registeredGroups.value[existingIdx]!
    const newItems = group.items.filter(item => !existingGroup.items.some(i => i.id === item.id))
    existingGroup.items.push(...newItems)
  } else {
    registeredGroups.value.push({ ...group, items: [...group.items] })
  }
}

/**
 * Register a single slash command item
 */
export function registerSlashCommandItem(item: SlashCommandItem, groupTitle = 'Custom'): void {
  registerSlashCommandGroup({
    title: groupTitle,
    items: [item],
  })
}

/**
 * Unregister a slash command item by ID
 */
export function unregisterSlashCommand(id: string): void {
  registeredGroups.value.forEach(group => {
    group.items = group.items.filter(item => item.id !== id)
  })
  registeredGroups.value = registeredGroups.value.filter(group => group.items.length > 0)
}

/**
 * Clear all externally registered slash commands
 */
export function clearSlashCommandRegistry(): void {
  registeredGroups.value = []
}
