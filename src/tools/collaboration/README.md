# Collaboration - Collaboration Tool Module

Provides real-time collaboration features based on Yjs + WebSocket.

## Features

- ✅ **Real-time Sync**: Real-time document sync based on Yjs CRDT
- ✅ **Multi-user Collaboration**: Supports multi-user editing simultaneously
- ✅ **User Cursors**: Displays other users' editing cursors and selections
- ✅ **User List**: Real-time tracking of online user list
- ✅ **Smart Initialization**: Automatically handles initialization logic for new and existing documents
- ✅ **Toggle Control**: Provides toggle component for users to enable/disable (disabled by default)

## Usage

### Using Toggle Component (Recommended)

The simplest way is using `CollaborationToggle` component for full enable/disable control:

```vue
<template>
  <div>
    <!-- Collaboration toggle -->
    <CollaborationToggle
      v-model="collaborationEnabled"
      :options="collaborationOptions"
      :collaborators-count="collaboratorsCount"
      show-label
      @enabled="handleEnabled"
      @disabled="handleDisabled"
    />
    
    <!-- Editor -->
    <TiptapProEditor document-id="doc-123" :features="{ collaboration: collaborationEnabled }" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CollaborationToggle } from './tools/collaboration'
import { useUserStore } from '@vben/stores'

const userStore = useUserStore()
const collaborationEnabled = ref(false) // Default disabled

const collaborationOptions = {
  documentId: 'doc-123',
  readonly: false,
  initialContent: '<p>Initial content</p>',
  editor: editorInstance,
  getUserInfo: () => ({
    id: userStore.userInfo?.userId || 'anonymous',
    name: userStore.userInfo?.realName || 'Anonymous User',
  }),
  onCollaboratorsChange: (count) => {
    collaboratorsCount.value = count
  },
}

const collaboratorsCount = ref(0)

function handleEnabled() {
  console.log('Collaboration enabled')
}

function handleDisabled() {
  console.log('Collaboration disabled')
}
</script>
```

### Using Composable

If fine-grained control is needed, use `useCollaboration` composable:

```vue
<script setup lang="ts">
import { useCollaboration } from './tools/collaboration'
import { useUserStore } from '@vben/stores'

const userStore = useUserStore()
const { enabled, connected, enable, disable } = useCollaboration()

// Enable collaboration
const handleEnable = async () => {
  await enable({
    documentId: 'doc-123',
    editor: editorInstance,
    getUserInfo: () => ({
      id: userStore.userInfo?.userId || 'anonymous',
      name: userStore.userInfo?.realName || 'Anonymous User',
    }),
  })
}

// Disable collaboration
const handleDisable = () => {
  disable()
}
</script>
```

### Basic Usage

```typescript
import { initCollaboration, createCollaborationExtensions } from './tools/collaboration'
import { useUserStore } from '@vben/stores'

const userStore = useUserStore()

// Get user info
const getUserInfo = () => {
  const userInfo = userStore.userInfo
  return {
    name: userInfo?.realName || userInfo?.userName || 'Anonymous User',
    id: userInfo?.userId || Math.random().toString(36).substring(7),
  }
}

// Initialize collaboration
const collaborationInstance = await initCollaboration({
  documentId: 'doc-123',
  readonly: false,
  initialContent: '<p>Initial content</p>',
  editor: editorInstance,
  getUserInfo,
  onCollaboratorsChange: (count) => {
    console.log('Online user count:', count)
  },
  onCollaboratorsListChange: (users) => {
    console.log('Online user list:', users)
  },
})

// Create collaboration editing extension
if (collaborationInstance) {
  const extensions = await createCollaborationExtensions(
    collaborationInstance,
    getUserInfo
  )
  // Add extensions to editor
  editor.use(...extensions)
}
```

### Usage in Editor

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Editor } from '@tiptap/vue-3'
import { initCollaboration, createCollaborationExtensions } from './tools/collaboration'
import { useUserStore } from '@vben/stores'

const props = defineProps<{
  documentId: string
  initialContent?: string
}>()

const editor = ref<Editor | null>(null)
const collaborationInstance = ref<any>(null)
const userStore = useUserStore()

const getUserInfo = () => {
  const userInfo = userStore.userInfo
  return {
    name: userInfo?.realName || userInfo?.userName || 'Anonymous User',
    id: userInfo?.userId || Math.random().toString(36).substring(7),
  }
}

onMounted(async () => {
  // Initialize editor
  editor.value = new Editor({
    extensions: [...],
  })

  // Initialize collaboration
  if (props.documentId) {
    collaborationInstance.value = await initCollaboration({
      documentId: props.documentId,
      initialContent: props.initialContent,
      editor: editor.value,
      getUserInfo,
    })

    // Add collaboration extension
    if (collaborationInstance.value) {
      const extensions = await createCollaborationExtensions(
        collaborationInstance.value,
        getUserInfo
      )
      editor.value.extensionManager.extensions.push(...extensions)
    }
  }
})

onBeforeUnmount(() => {
  // Clean up collaboration editing resources
  if (collaborationInstance.value) {
    collaborationInstance.value.destroy()
  }
  if (editor.value) {
    editor.value.destroy()
  }
})
</script>
```

## API Reference

### `CollaborationToggle` Component

Collaboration toggle component providing visual enable/disable controls.

**Props:**

- `modelValue` (boolean, optional): Whether enabled (v-model binding), default `false`
- `options` (CollaborationInitOptions, optional): Collaboration initialization options
- `disabled` (boolean, optional): Whether disabled, default `false`
- `showLabel` (boolean, optional): Whether to show label, default `false`
- `collaboratorsCount` (number, optional): Online user count, default `0`

**Events:**

- `update:modelValue`: Triggered on state change
- `change`: Triggered on state change with boolean parameter
- `enabled`: Triggered when collaboration enabled
- `disabled`: Triggered when collaboration disabled

**Example:**

```vue
<CollaborationToggle
  v-model="enabled"
  :options="options"
  :collaborators-count="count"
  @enabled="handleEnabled"
/>
```

### `useCollaboration()` Composable

Collaboration state management composable.

**Return values:**

- `enabled` (ComputedRef<boolean>): Whether enabled
- `connected` (ComputedRef<boolean>): Whether connected
- `initializing` (ComputedRef<boolean>): Whether initializing
- `instance` (ComputedRef<CollaborationInstance | null>): Collaboration instance
- `enable(options)`: Enable collaboration
- `disable()`: Disable collaboration
- `toggle(options?)`: Toggle state
- `reset()`: Reset state

**Example:**

```typescript
const { enabled, enable, disable } = useCollaboration()
```

### `initCollaboration(options)`

Initialize collaboration editing feature.

**Parameters:**

- `options.documentId` (string, required): Document ID for WebSocket room
- `options.readonly` (boolean, optional): Whether read-only mode, default `false`
- `options.initialContent` (string | object, optional): Initial content for new docs or single-user edit
- `options.editor` (Editor, optional): Editor instance to set initial content
- `options.getUserInfo` (() => UserInfo, optional): User info getter function
- `options.onCollaboratorsChange` ((count: number) => void, optional): Online user count change callback
- `options.onCollaboratorsListChange` ((users: CollaboratorInfo[]) => void, optional): Online user list change callback

**Returns:**

- `CollaborationInstance | null`: Collaboration instance containing `doc`, `provider`, and `destroy` method

### `createCollaborationExtensions(instance, getUserInfo)`

Create collaboration editing extension configuration.

**Parameters:**

- `instance` (CollaborationInstance | null): Collaboration instance
- `getUserInfo` (() => UserInfo, optional): User info getter function

**Returns:**

- `Promise<Extension[]>`: Tiptap Extension Configuration array

### `getRandomColor()`

Generate random color for collaboration user cursors and selection highlights.

**Returns:**

- `string`: Color value (hex)

## Type Definitions

### `CollaboratorInfo`

Collaboration user info.

```typescript
interface CollaboratorInfo {
  id: string | number
  name: string
  color: string
}
```

### `UserInfo`

User info (for setting awareness).

```typescript
interface UserInfo {
  id: string | number
  name: string
}
```

### `CollaborationInstance`

Collaboration editing instance.

```typescript
interface CollaborationInstance {
  doc: any // Yjs document instance
  provider: any // WebSocket Provider instance
  destroy: () => void // Destroy function
}
```

## Styles

Collaboration editing module includes the following styles:

- `.collaboration-cursor__caret`: User cursor style
- `.collaboration-cursor__label`: User name label style
- `.collaboration-cursor__selection`: User selection highlight style

Style file is located in `collaboration.css`, import in project:

```typescript
import './tools/collaboration/collaboration.css'
```

## Notes

1. **WebSocket URL**: Ensure `getWebSocketUrl` function in `#/api/document/websocket` is available
2. **Document ID**: Each document needs a unique `documentId` for WebSocket room isolation
3. **Initial Content**: Existing document content in Yjs won't be overwritten in multi-user collaboration
4. **User Deduplication**: Automatically deduplicated by user ID across multiple browser tabs
5. **Resource Cleanup**: Always call `destroy()` on component unmount to clean WebSocket connections and Yjs document

## Dependencies

- `yjs`: Yjs CRDT library
- `y-websocket`: Yjs WebSocket Provider
- `@tiptap/extension-collaboration`: Tiptap collaboration extension
- `@tiptap/extension-collaboration-cursor`: Tiptap collaboration cursor extension

