<template>
  <a-popover
    v-if="enabled && collaboratorsList.length > 0"
    placement="bottomRight"
    :overlay-style="{ maxWidth: '300px' }"
  >
    <template #content>
      <div class="all-collaborators-popover">
        <div class="popover-title">Online Users ({{ collaboratorsList.length }})</div>
        <div class="popover-users">
          <div
            v-for="user in collaboratorsList"
            :key="user.id"
            class="popover-user-item"
          >
            <div
              class="popover-avatar"
              :style="{ backgroundColor: user.color }"
            >
              {{ getAvatarText(user.name) }}
            </div>
            <span class="popover-user-name">{{ user.name }}</span>
          </div>
        </div>
      </div>
    </template>
    
    <!-- Trigger: shows user count and first user avatar -->
    <div class="collaboration-toggle">
      <span class="toggle-label">Collaboration</span>
      <span class="toggle-text enabled">Enabled ({{ collaboratorsList.length }})</span>
      <div
        v-if="firstUser"
        class="avatar-item"
        :style="{ backgroundColor: firstUser.color }"
      >
        {{ getAvatarText(firstUser.name) }}
      </div>
    </div>
  </a-popover>
  
  <!-- Display when collaboration is disabled or no users -->
  <div v-else class="collaboration-toggle">
    <span class="toggle-label">Collaboration</span>
    <span v-if="!enabled" class="toggle-text">Disabled</span>
    <span v-else class="toggle-text enabled">Enabled (0)</span>
  </div>
</template>

<script setup lang="ts">
/**
 * CollaborationToggle - Collaboration status display component
 * @description Controls enabling/disabling collaboration based on modelValue, default disabled
 */
import { computed } from 'vue'
import { Popover as APopover } from 'ant-design-vue'
import type { CollaboratorInfo } from './types'

interface Props {
  /** Whether collaboration is enabled (v-model binding, default false) */
  modelValue?: boolean
  /** Whether to show label */
  showLabel?: boolean
  /** Online user count (deprecated, use collaboratorsList) */
  collaboratorsCount?: number
  /** Online user list */
  collaboratorsList?: CollaboratorInfo[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  showLabel: false,
  collaboratorsCount: 0,
  collaboratorsList: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'change': [value: boolean]
}>()

/** Whether enabled (internal computed property based on modelValue) */
const enabled = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    emit('update:modelValue', value)
    emit('change', value)
  },
})

/** Online user list (from props with default values) */
const collaboratorsList = computed(() => props.collaboratorsList)

/** First user (for avatar display) */
const firstUser = computed(() => collaboratorsList.value[0] || null)

/**
 * Get avatar text (first character or initial of username)
 * @description Takes first initial for avatar display
 */
const getAvatarText = (name: string): string => {
  if (!name?.trim()) return '?'
  const trimmed = name.trim()
  // Check if language/script requires initial extraction
  return /[\u4e00-\u9fa5]/.test(trimmed) ? trimmed.slice(0, 2) : trimmed.charAt(0).toUpperCase()
}
</script>

<style scoped lang="css">
.collaboration-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.collaboration-toggle:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.toggle-label {
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

.toggle-text {
  font-size: 12px;
  color: #666;
}

.toggle-text.enabled {
  color: #52c41a;
}

/* Avatar style */
.avatar-item,
.popover-avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  color: #fff;
  flex-shrink: 0;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.avatar-item {
  width: 28px;
  height: 28px;
  font-size: 12px;
}

/* Popover style */
.all-collaborators-popover {
  min-width: 180px;
}

.popover-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.popover-users {
  max-height: 300px;
  overflow-y: auto;
}

.popover-user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.popover-user-item:last-child {
  border-bottom: none;
}

.popover-avatar {
  width: 32px;
  height: 32px;
  font-size: 14px;
}

.popover-user-name {
  font-size: 14px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

