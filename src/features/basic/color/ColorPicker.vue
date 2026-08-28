<!--
  ColorPicker - color picker component
  @description Component for selecting text color or background color in the text editor
  @features
    - Supports both text color and background color modes
    - Uses a Popover popup to display the color selection panel
    - Provides a common color grid (20 colors by default, 5 per row)
    - Supports clearing the color
    - The preview area shows text color or background color effects based on the type
-->
<template>
  <!-- Use the Ant Design Popover component for the popup layer -->
  <Popover
    trigger="click"
    placement="bottomLeft"
    v-model:open="showPicker"
    overlay-class-name="tt-color-picker-popover"
  >
    <!-- Popover content: color selection panel -->
    <template #content>
      <div class="tt-color-picker-content">
        <!-- Header area: color preview, title, clear button -->
        <div class="tt-color-picker-header">
          <!-- Current color preview swatch (clickable to open the advanced color picker) -->
          <button
            class="tt-color-picker-preview-btn"
            type="button"
            @click.stop="showAdvancedPicker = true"
            :title="t('editor.showAdvanced')"
          >
            <div class="tt-color-picker-preview">
              <div class="tt-color-picker-preview-color" :style="{ backgroundColor: normalizedColor }" />
            </div>
          </button>
          <!-- Separator -->
          <div class="tt-color-picker-separator" />
          <!-- Title -->
          <div class="tt-color-picker-title">{{ t('editor.colors') }}</div>
          <!-- Preview text: shows text color or background color effects based on the type -->
          <div
            class="tt-color-picker-preview-text"
            :class="{ 'is-background': type === 'background' }"
            :style="previewTextStyle"
          >
            A
          </div>
          <!-- Clear color button -->
          <button
            class="tt-color-clear-btn"
            type="button"
            @click.stop="clearColor"
            :title="t('editor.clearColor')"
          >
            <StopOutlined class="tt-color-clear-icon" />
          </button>
        </div>

        <!-- Default color grid -->
        <div class="tt-color-picker-section">
          <div class="tt-color-picker-section-title">{{ t('editor.defaultColors') }}</div>
          <div class="tt-color-picker-grid" :style="gridStyle">
            <button
              v-for="color in DEFAULT_COLORS"
              :key="color"
              :class="['tt-color-picker__item', { 'is-selected': normalizedColor === normalizeColor(color) }]"
              :style="{
                width: `${props.itemSize}px`,
                height: `${props.itemSize}px`,
                backgroundColor: color
              }"
              type="button"
              @click="handleSelectColor(color)"
              :title="color"
            />
          </div>
        </div>

        <!-- Standard colors -->
        <div class="tt-color-picker-section">
          <div class="tt-color-picker-section-title">{{ t('editor.standardColors') }}</div>
          <div class="tt-color-picker-grid" :style="standardGridStyle">
            <button
              v-for="color in STANDARD_COLORS"
              :key="color"
              :class="['tt-color-picker__item', { 'is-selected': normalizedColor === normalizeColor(color) }]"
              :style="{
                width: `${props.itemSize}px`,
                height: `${props.itemSize}px`,
                backgroundColor: color
              }"
              type="button"
              @click="handleSelectColor(color)"
              :title="color"
            />
          </div>
        </div>

        <!-- Advanced color picker -->
        <div v-if="showAdvancedPicker" class="tt-color-picker-advanced">
          <div class="tt-color-picker-advanced-header">
            <span class="tt-color-picker-advanced-title">{{ t('editor.showAdvanced') }}</span>
            <button
              class="tt-color-picker-advanced-close"
              type="button"
              @click.stop="showAdvancedPicker = false"
              :title="t('editor.hideAdvanced')"
            >
              ×
            </button>
          </div>
          <div class="tt-color-picker-advanced-content">
            <input
              v-model="advancedColor"
              type="color"
              class="tt-color-picker-color-input"
              @change="handleAdvancedColorChange"
            />
            <input
              v-model="advancedColor"
              type="text"
              class="tt-color-picker-color-text"
              placeholder="#000000"
              @input="handleAdvancedColorInput"
            />
          </div>
        </div>
      </div>
    </template>
    <!-- Popover trigger: color selection button -->
    <Tooltip :title="buttonTitle" placement="top" :open="showPicker ? false : undefined">
      <div
        class="tt-color-current-btn"
        :class="{ 'has-icon': icon }"
      >
        <!-- If an icon is provided, show the icon; otherwise show the color preview -->
        <component
          v-if="icon"
          :is="icon"
          class="tt-color-icon"
        />
        <div v-else class="tt-color-current-preview" />
      </div>
    </Tooltip>
  </Popover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Component } from 'vue'
import { Popover, Tooltip } from 'ant-design-vue'
import { StopOutlined } from '@ant-design/icons-vue'
import { t } from '@/locales'

/**
 * Component Props interface definition
 */
interface Props {
  /** Number of columns in the color grid, defaults to 5 columns */
  columns?: number
  /** Size of each color swatch (px), defaults to 20px */
  itemSize?: number
  /** Currently selected color value (v-model) */
  modelValue?: string
  /** Gap between color swatches (px), defaults to 8px */
  gap?: number
  /** Button icon component (optional) */
  icon?: Component
  /** Color type: 'text' text color | 'background' background color */
  type?: 'text' | 'background'
  /** Button title (tooltip text, optional, auto-generated from type by default) */
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  columns: 10,  // 10 columns to fit more colors (50 colors = 5 rows x 10 columns)
  itemSize: 20,
  modelValue: undefined,
  gap: 8,
  icon: undefined,
  type: 'text',
  title: undefined
})

/**
 * Component events definition
 */
const emit = defineEmits<{
  /** Color value update event (v-model support) */
  (e: 'update:modelValue', value: string | undefined): void
  /** Color selection event */
  (e: 'select', value: string): void
}>()

/**
 * Default color list (50 common colors, arranged by theme color patterns, no duplicates)
 * @description Based on the Office color picker, each primary color is a column, and each column has multiple shades (from light to dark)
 * The array is arranged row-major: row 1 (first color of each column) -> row 2 (second color of each column) -> ...
 * 
 * Column structure (10 columns x 5 rows = 50 colors, each unique):
 * Column 1: White family (#ffffff -> #f5f5f5 -> #d9d9d9 -> #a6a6a6 -> #000000)
 * Column 2: Light gray family (#f2f2f2 -> #e6e6e6 -> #cccccc -> #999999 -> #666666)
 * Column 3: Gray family (#e0e0e0 -> #c0c0c0 -> #808080 -> #595959 -> #404040)
 * Column 4: Red family (#ffcccc -> #ff9999 -> #ff6666 -> #ff0000 -> #990000)
 * Column 5: Orange family (#ffcc99 -> #ff9966 -> #ff9900 -> #ff7700 -> #cc6600)
 * Column 6: Yellow family (#ffffcc -> #ffff99 -> #ffff00 -> #ffd700 -> #cccc00)
 * Column 7: Green family (#ccffcc -> #99ff99 -> #66ff66 -> #00ff00 -> #006600)
 * Column 8: Blue family (#cce5ff -> #99ccff -> #6699ff -> #0066ff -> #003366)
 * Column 9: Purple family (#e4d9ff -> #ccb3ff -> #9966ff -> #6600cc -> #330066)
 * Column 10: Pink family (#ffd9e6 -> #ffb3cc -> #ff6699 -> #ff0066 -> #cc0033)
 */
const DEFAULT_COLORS = [
  // Row 1: lightest shade of each column (primary color)
  '#ffffff', '#f2f2f2', '#e0e0e0', '#ffcccc', '#ffcc99', '#ffffcc', '#ccffcc', '#cce5ff', '#e4d9ff', '#ffd9e6',
  // Row 2: light shade of each column (80% primary)
  '#f5f5f5', '#e6e6e6', '#c0c0c0', '#ff9999', '#ff9966', '#ffff99', '#99ff99', '#99ccff', '#ccb3ff', '#ffb3cc',
  // Row 3: medium shade of each column (60% primary)
  '#d9d9d9', '#cccccc', '#808080', '#ff6666', '#ff9900', '#ffff00', '#66ff66', '#6699ff', '#9966ff', '#ff6699',
  // Row 4: dark shade of each column (40% primary)
  '#a6a6a6', '#999999', '#595959', '#ff0000', '#ff7700', '#ffd700', '#00ff00', '#0066ff', '#6600cc', '#ff0066',
  // Row 5: darkest shade of each column (20% primary)
  '#000000', '#666666', '#404040', '#990000', '#cc6600', '#cccc00', '#006600', '#003366', '#330066', '#cc0033'
] as const

/**
 * Standard color list (10 standard colors)
 * @description Based on the Office color picker, includes common standard colors
 */
const STANDARD_COLORS = [
  '#c00000', // dark red
  '#ff6600', // bright orange
  '#ffc000', // bright yellow
  '#92d050', // light green
  '#00b050', // standard green
  '#00b0f0', // light blue
  '#0070c0', // cyan
  '#0050d0', // medium blue
  '#002060', // dark blue
  '#7030a0'  // purple
] as const

/**
 * Color normalization function
 * @param color - color value (may contain spaces or inconsistent casing)
 * @returns Normalized color value (lowercase, whitespace removed, defaults to '#000000')
 */
const normalizeColor = (color: string | undefined | null) => color?.trim().toLowerCase() || '#000000'

/**
 * Normalized current color value (computed property)
 */
const normalizedColor = computed(() => normalizeColor(props.modelValue))

/**
 * Button title (tooltip text)
 * @description Uses the title prop if provided, otherwise auto-generates based on the type
 */
const buttonTitle = computed(() => {
  if (props.title) return props.title
  return props.type === 'text' ? t('editor.textColor') : t('editor.backgroundColor')
})

/**
 * Calculate a suitable text color based on the background color
 * @description Uses a perceived-luminance formula to compute the background brightness, automatically returning black or white text to ensure readability
 * @param bgColor - background color value
 * @returns '#000' or '#fff' - returns a suitable text color based on the background brightness
 * 
 * @example
 * getTextColorForBackground('#ffffff') // returns '#000' (black text on white background)
 * getTextColorForBackground('#000000') // returns '#fff' (white text on black background)
 */
const getTextColorForBackground = (bgColor: string) => {
  // Handle transparent or empty values
  if (!bgColor || bgColor === 'transparent') return '#000'
  
  // Remove the # prefix
  let hex = bgColor.replace('#', '')
  
  // Support 3-digit hex format (e.g. #fff) converted to 6 digits (e.g. #ffffff)
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('')
  }
  
  // Validate the format
  if (hex.length !== 6) return '#000'
  
  // Extract RGB components
  const r = parseInt(hex.substr(0, 2), 16)  // red component (0-255)
  const g = parseInt(hex.substr(2, 2), 16)  // green component (0-255)
  const b = parseInt(hex.substr(4, 2), 16)  // blue component (0-255)
  
  // Calculate perceived luminance (using the human eye's sensitivity weights for different colors)
  // Formula: brightness = (R x 299 + G x 587 + B x 114) / 1000
  // Green has the highest weight (587), red next (299), blue the lowest (114)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  
  // Use a stricter threshold (120 instead of 128) to ensure better contrast
  // brightness > 120 (light background) returns black text, otherwise white text
  return brightness > 120 ? '#000' : '#fff'
}

/**
 * Preview text style (computed property)
 * @description Returns different styles based on the type:
 *   - text: shows the text color
 *   - background: shows the background color and automatically calculates a suitable text color
 */
const previewTextStyle = computed(() => {
  if (props.type === 'text') {
    // Text color mode: apply the color directly to the text
    return { color: normalizedColor.value }
  } else {
    // Background color mode: apply the background color and automatically calculate a suitable text color
    return {
      backgroundColor: normalizedColor.value,
      color: getTextColorForBackground(normalizedColor.value)
    }
  }
})

/**
 * Color grid style (computed property)
 * @description Dynamically generates the CSS Grid layout based on columns and itemSize
 * @note The gap spacing is controlled uniformly by CSS and is not set here
 * @example
 * columns=10, itemSize=20
 * generates: { gridTemplateColumns: 'repeat(10, 20px)' }
 */
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns}, ${props.itemSize}px)`
}))

/**
 * Standard color grid style (computed property)
 * @description The standard colors are fixed at 10 columns, using a fixed itemSize to ensure alignment
 */
const standardGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(10, ${props.itemSize}px)`
}))

/**
 * Popover show/hide state
 */
const showPicker = ref(false)

/**
 * Advanced color picker show/hide state
 */
const showAdvancedPicker = ref(false)

/**
 * Advanced color picker color value
 */
const advancedColor = ref(normalizedColor.value || '#000000')

// Watch showAdvancedPicker and sync the current color when opened
watch(showAdvancedPicker, (isOpen) => {
  if (isOpen) {
    advancedColor.value = normalizedColor.value || '#000000'
  }
})

/**
 * Uniformly trigger the color change event
 * @param color - color value
 */
const updateColor = (color: string) => {
  emit('update:modelValue', color)
  emit('select', color)
}

/**
 * Handle color selection
 * @param color - the selected color value
 */
const handleSelectColor = (color: string) => {
  updateColor(normalizeColor(color))
}

/**
 * Clear the color
 * @description Returns the default value based on the type:
 *   - text: revert to black '#000000'
 *   - background: revert to transparent 'transparent'
 */
const clearColor = () => {
  updateColor(props.type === 'text' ? '#000000' : 'transparent')
}

/**
 * Handle color changes in the advanced color picker (color input)
 */
const handleAdvancedColorChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const color = normalizeColor(target.value)
  advancedColor.value = color
  updateColor(color)
}

/**
 * Handle text input in the advanced color picker
 */
const handleAdvancedColorInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let color = target.value.trim()
  
  // Automatically prepend # if the input value does not start with it
  if (color && !color.startsWith('#')) {
    color = '#' + color
  }
  
  // Validate the color format
  if (/^#[0-9A-Fa-f]{6}$/.test(color) || /^#[0-9A-Fa-f]{3}$/.test(color)) {
    const normalized = normalizeColor(color)
    advancedColor.value = normalized
    updateColor(normalized)
  }
}

// Watch normalizedColor changes and sync to advancedColor
watch(normalizedColor, (newColor) => {
  if (showAdvancedPicker.value) {
    advancedColor.value = newColor
  }
})
</script>

<style lang="scss" scoped>
// Dark mode selector variable (for centrally managing dark theme styles)
$dark-selector: ':where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) &';

/* ===== Color selection button ===== */
.tt-color-current-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  position: relative;
  overflow: visible;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #333;

  #{$dark-selector} {
    color: #f0f0f0;
  }

  &.has-icon {
    overflow: hidden;
  }

  &:hover {
    background: #f5f5f5;

    #{$dark-selector} {
      background: #303030;
    }
  }
}

/* Color preview area (shown when there is no icon) */
.tt-color-current-preview {
  width: 100%;
  height: 100%;
  border-radius: 2px;
}

/* Icon style */
.tt-color-icon {
  font-size: 18px;
  color: #262626;
  line-height: 1;
  transition: color 0.2s;

  #{$dark-selector} {
    color: #f0f0f0;
  }
}

/* ===== Popover content area ===== */
.tt-color-picker-content {
  padding: 10px 12px;
  min-width: 280px;  /* Fits the 10-column layout (10 x 20px + 9 x 6px + padding) */
  max-width: 320px;
  background: #fff;
  border-radius: 8px;

  #{$dark-selector} {
    background: #1f1f1f;
  }
}

/* Header area: color preview, title, clear button */
.tt-color-picker-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

/* Current color preview swatch container */
.tt-color-picker-preview {
  width: 40px;
  height: 24px;
  min-width: 40px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;

  #{$dark-selector} {
    border-color: rgba(255, 255, 255, 0.15);
  }
}

/* Current color preview swatch */
.tt-color-picker-preview-color {
  width: 100%;
  height: 100%;
}

/* Separator */
.tt-color-picker-separator {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.08);

  #{$dark-selector} {
    background: rgba(255, 255, 255, 0.15);
  }
}

/* Title text */
.tt-color-picker-title {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  flex: 1;

  #{$dark-selector} {
    color: #f0f0f0;
  }
}

/* Preview text (shows text color or background color effects) */
.tt-color-picker-preview-text {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 18px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  border: 1.5px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  background: #fff;
  transition: all 0.2s;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);  /* Text shadow improves readability */

  #{$dark-selector} {
    border-color: rgba(255, 255, 255, 0.25);
    background: #1f1f1f;
  }

  /* Background color mode: ensure the text is clearly visible */
  &.is-background {
    border-width: 2px;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
  }
}

/* Clear color button */
.tt-color-clear-btn {
  padding: 0;
  margin: 0 0 0 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.06);

    #{$dark-selector} {
      background: rgba(255, 255, 255, 0.1);
    }

    .tt-color-clear-icon {
      color: #1677ff;

      #{$dark-selector} {
        color: #4fc3f7;
      }
    }
  }

  &:active {
    background: rgba(0, 0, 0, 0.1);

    #{$dark-selector} {
      background: rgba(255, 255, 255, 0.15);
    }
  }
}

.tt-color-clear-icon {
  font-size: 18px;
  color: #8c8c8c;
  line-height: 1;
  transition: color 0.2s;

  #{$dark-selector} {
    color: #999;
  }
}

/* ===== Color sections ===== */
.tt-color-picker-section {
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

/* Section title */
.tt-color-picker-section-title {
  font-size: 12px;
  font-weight: 500;
  color: #8c8c8c;
  margin-bottom: 6px;
  line-height: 1.5;

  #{$dark-selector} {
    color: #999;
  }
}

/* ===== Color grid ===== */
.tt-color-picker-grid {
  display: grid;
  width: 100%;
  justify-content: start;
  margin-bottom: 0;
  gap: 6px;  /* Uniform color swatch spacing of 6px */
}

/* Color swatch style */
.tt-color-picker__item {
  padding: 0;
  cursor: pointer;
  border: 1px solid #ddd;
  border-radius: 50%;  /* Circular */
  transition: transform 0.2s;
  position: relative;

  #{$dark-selector} {
    border-color: #434343;
  }

  /* Selected state: blue border and shadow, slightly enlarged */
  &.is-selected {
    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15);
    border-color: rgba(22, 119, 255, 0.8);
    transform: scale(1.1);

    #{$dark-selector} {
      box-shadow: 0 0 0 2px rgba(79, 195, 247, 0.4), 0 2px 8px rgba(0, 0, 0, 0.5);
      border-color: rgba(79, 195, 247, 0.8);
    }
  }

  /* Hover state: enlarge effect, shadow */
  &:hover:not(.is-selected) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transform: scale(1.2);

    #{$dark-selector} {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }
  }
}

/* Preview swatch button (clickable) */
.tt-color-picker-preview-btn {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.06);

    #{$dark-selector} {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &:active {
    background: rgba(0, 0, 0, 0.1);

    #{$dark-selector} {
      background: rgba(255, 255, 255, 0.15);
    }
  }
}

/* Advanced color picker */
.tt-color-picker-advanced {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);

  #{$dark-selector} {
    border-top-color: rgba(255, 255, 255, 0.15);
  }
}

.tt-color-picker-advanced-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.tt-color-picker-advanced-title {
  font-size: 12px;
  font-weight: 500;
  color: #8c8c8c;

  #{$dark-selector} {
    color: #999;
  }
}

.tt-color-picker-advanced-close {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  color: #8c8c8c;
  border-radius: 4px;
  transition: all 0.2s;

  #{$dark-selector} {
    color: #999;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #262626;

    #{$dark-selector} {
      background: rgba(255, 255, 255, 0.1);
      color: #f0f0f0;
    }
  }
}

.tt-color-picker-advanced-content {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tt-color-picker-color-input {
  width: 60px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;

  #{$dark-selector} {
    border-color: #434343;
    background: #1f1f1f;
  }

  &:hover {
    border-color: #1677ff;

    #{$dark-selector} {
      border-color: #4fc3f7;
    }
  }

  &:focus {
    outline: none;
    border-color: #1677ff;
    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);

    #{$dark-selector} {
      border-color: #4fc3f7;
      box-shadow: 0 0 0 2px rgba(79, 195, 247, 0.2);
    }
  }
}

.tt-color-picker-color-text {
  flex: 1;
  height: 32px;
  padding: 4px 11px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  color: #262626;
  background: #fff;
  transition: all 0.2s;

  #{$dark-selector} {
    border-color: #434343;
    background: #1f1f1f;
    color: #f0f0f0;
  }

  &:hover {
    border-color: #1677ff;

    #{$dark-selector} {
      border-color: #4fc3f7;
    }
  }

  &:focus {
    outline: none;
    border-color: #1677ff;
    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);

    #{$dark-selector} {
      border-color: #4fc3f7;
      box-shadow: 0 0 0 2px rgba(79, 195, 247, 0.2);
    }
  }

  &::placeholder {
    color: #bfbfbf;

    #{$dark-selector} {
      color: #666;
    }
  }
}

/* Override Ant Design Popover default padding */
:deep(.tt-color-picker-popover) {
  .ant-popover-inner {
    padding: 0;  /* Remove the Popover default padding, use the component's internal padding */
  }
}
</style>

