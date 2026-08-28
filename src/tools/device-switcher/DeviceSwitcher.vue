<template>
  <div class="device-switcher">
    <!-- Device selection buttons -->
    <button
      v-for="device in devices"
      :key="device.value"
      class="device-switcher__btn"
      :class="{ 'device-switcher__btn--active': currentDevice === device.value }"
      :title="device.label"
      @click="handleDeviceChange(device.value)"
    >
      <component :is="device.icon" class="device-switcher__icon" />
    </button>
    
    <!-- Portrait/landscape toggle (only shown on Pad/Mobile) -->
    <template v-if="currentDevice !== 'pc'">
      <div class="device-switcher__divider"></div>
      <button
        class="device-switcher__btn device-switcher__btn--orientation"
        :class="{ 'device-switcher__btn--landscape': currentOrientation === 'landscape' }"
        :title="currentOrientation === 'portrait' ? 'Switch to landscape' : 'Switch to portrait'"
        @click="handleOrientationToggle"
      >
        <component :is="OrientationIcon" class="device-switcher__icon" />
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * DeviceSwitcher - Device view switcher component
 * @description Switches between PC, Pad, and Mobile device views with portrait/landscape support
 */
import { computed, h, onMounted, ref, type FunctionalComponent } from 'vue'

export type DeviceView = 'pc' | 'pad' | 'mobile'
export type Orientation = 'portrait' | 'landscape'

/**
 * Detect if current browser is a mobile browser
 */
function detectMobileBrowser(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  // Match common mobile UA strings
  return /Android.*Mobile|iPhone|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile/i.test(ua)
}

interface Props {
  /** Current device view */
  modelValue?: DeviceView
  /** Current screen orientation */
  orientation?: Orientation
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'pc',
  orientation: 'portrait',
})

/** Whether it's a mobile browser */
const isMobileBrowser = ref(detectMobileBrowser())

const emit = defineEmits<{
  (e: 'update:modelValue', value: DeviceView): void
  (e: 'update:orientation', value: Orientation): void
  (e: 'change', value: DeviceView): void
  (e: 'orientationChange', value: Orientation): void
}>()

const currentDevice = computed(() => props.modelValue)
const currentOrientation = computed(() => props.orientation)

// Device icon components
const DesktopIcon: FunctionalComponent = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
}, [
  h('rect', { x: '2', y: '3', width: '20', height: '14', rx: '2' }),
  h('line', { x1: '8', y1: '21', x2: '16', y2: '21' }),
  h('line', { x1: '12', y1: '17', x2: '12', y2: '21' }),
])

const TabletIcon: FunctionalComponent = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
}, [
  h('rect', { x: '4', y: '2', width: '16', height: '20', rx: '2' }),
  h('line', { x1: '12', y1: '18', x2: '12', y2: '18' }),
])

const MobileIcon: FunctionalComponent = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
}, [
  h('rect', { x: '6', y: '2', width: '12', height: '20', rx: '2' }),
  h('line', { x1: '12', y1: '18', x2: '12', y2: '18' }),
])

// Portrait/landscape toggle icon
const OrientationIcon: FunctionalComponent = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
}, [
  h('path', { d: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5c.83 0 1.5-.67 1.5-1.5V4.5' }),
  h('path', { d: 'M16.5 3L21 7.5m0 0L16.5 12M21 7.5H7.5c-.83 0-1.5.67-1.5 1.5v10.5' }),
])

const allDevices = [
  { value: 'pc' as DeviceView, label: 'Desktop', icon: DesktopIcon },
  { value: 'pad' as DeviceView, label: 'Tablet (iPad)', icon: TabletIcon },
  { value: 'mobile' as DeviceView, label: 'Mobile (iPhone)', icon: MobileIcon },
]

// On mobile browsers, only keep Mobile option
const devices = computed(() => {
  if (isMobileBrowser.value) {
    return allDevices.filter(d => d.value === 'mobile')
  }
  return allDevices
})

const handleDeviceChange = (device: DeviceView) => {
  emit('update:modelValue', device)
  emit('change', device)
}

// On mobile browsers, auto-switch to mobile view
onMounted(() => {
  if (isMobileBrowser.value && props.modelValue !== 'mobile') {
    emit('update:modelValue', 'mobile')
    emit('change', 'mobile')
  }
})

const handleOrientationToggle = () => {
  const newOrientation = currentOrientation.value === 'portrait' ? 'landscape' : 'portrait'
  emit('update:orientation', newOrientation)
  emit('orientationChange', newOrientation)
}
</script>

<style scoped>
.device-switcher {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
}

.device-switcher__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.device-switcher__btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.device-switcher__btn--active {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.device-switcher__icon {
  width: 20px;
  height: 20px;
}

.device-switcher__divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.3);
  margin: 0 4px;
}

.device-switcher__btn--orientation {
  transition: transform 0.3s ease, background 0.2s ease, color 0.2s ease;
}

.device-switcher__btn--landscape .device-switcher__icon {
  transform: rotate(90deg);
}
</style>
