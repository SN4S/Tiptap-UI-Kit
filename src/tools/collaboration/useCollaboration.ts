/**
 * useCollaboration - Collaboration State Management Composable
 * @description Provides complete collaboration state management
 */

import { ref, computed, readonly, shallowRef } from 'vue'
import type { CollaboratorInfo, CollaborationInstance, CollaborationInitOptions, UserInfo } from './types'
import { initCollaboration, createCollaborationExtensions } from './collaboration'
import { logger } from './utils'

/** Composable configuration */
export interface UseCollaborationOptions {
  getUserInfo?: () => UserInfo
  onCollaboratorsChange?: (count: number) => void
  onCollaboratorsListChange?: (users: CollaboratorInfo[]) => void
}

/** Initialization options (excluding callbacks) */
type InitOptions = Omit<CollaborationInitOptions, 'onCollaboratorsChange' | 'onCollaboratorsListChange'>

/**
 * Collaboration state management
 */
export function useCollaboration(options: UseCollaborationOptions = {}) {
  // Core state
  const enabled = ref(false)
  const instance = shallowRef<CollaborationInstance | null>(null)
  const initializing = ref(false)
  const connected = computed(() => !!instance.value)

  // Collaborator state
  const collaboratorsCount = ref(0)
  const collaboratorsList = ref<CollaboratorInfo[]>([])

  // Internal callbacks
  const onCountChange = (count: number) => {
    collaboratorsCount.value = count
    options.onCollaboratorsChange?.(count)
  }

  const onListChange = (users: CollaboratorInfo[]) => {
    collaboratorsList.value = users
    options.onCollaboratorsListChange?.(users)
  }

  /** Enable collaboration */
  const enable = async (initOptions: InitOptions): Promise<CollaborationInstance | null> => {
    if (enabled.value && instance.value) {
      logger.info('Collaboration already enabled, skipping')
      return instance.value
    }

    if (initializing.value) {
      logger.info('Initializing...')
      return null
    }

    try {
      initializing.value = true
      enabled.value = true

      const result = await initCollaboration({
        ...initOptions,
        getUserInfo: initOptions.getUserInfo ?? options.getUserInfo,
        onCollaboratorsChange: onCountChange,
        onCollaboratorsListChange: onListChange,
      })

      if (result) {
        instance.value = result
        logger.success('Collaboration enabled')
      } else {
        enabled.value = false
        logger.warn('Collaboration initialization failed')
      }

      return result
    } catch (error) {
      enabled.value = false
      logger.error('Failed to enable collaboration:', error)
      return null
    } finally {
      initializing.value = false
    }
  }

  /** Disable collaboration */
  const disable = () => {
    if (instance.value) {
      try {
        instance.value.destroy()
        logger.success('Collaboration disabled')
      } catch (error) {
        logger.error('Failed to disable collaboration:', error)
      }
      instance.value = null
    }
    enabled.value = false
    initializing.value = false
    collaboratorsCount.value = 0
    collaboratorsList.value = []
  }

  /** Initialize and get extensions */
  const initWithExtensions = async (initOptions: InitOptions): Promise<any[]> => {
    const result = await enable(initOptions)
    if (!result) return []
    return createCollaborationExtensions(result, initOptions.getUserInfo ?? options.getUserInfo)
  }

  /** Update editor reference */
  const setEditor = (editor: any) => {
    instance.value?.setEditor?.(editor)
  }

  return {
    // Read-only state
    enabled: readonly(enabled),
    connected,
    initializing: readonly(initializing),
    instance: readonly(instance),
    collaboratorsCount: readonly(collaboratorsCount),
    collaboratorsList: readonly(collaboratorsList),
    // Methods
    enable,
    disable,
    initWithExtensions,
    setEditor,
    reset: disable,
  }
}

export type UseCollaborationReturn = ReturnType<typeof useCollaboration>
