# TiptapPro Styles

## File Structure

```
styles/
├── base.css                    # Shared base styles (variables, mixins, animations)
├── word-mode.css               # Word mode editor styles
├── toolbar.css                 # Main toolbar styles
├── bubble-menu.css             # Floating bubble menu
├── floating-menu-toolbar.css   # Floating menu
├── table-bubble-menu.css       # Table toolbar
├── table-insert-plus.css       # Table insert functionality
├── image-toolbar.css           # Image toolbar
├── drag-handle-with-menu.css   # Drag handle menu
├── zoom-toolbar.css            # Zoom toolbar
└── collaboration.css           # Collaboration editing cursor
```

## Shared Styles (base.css)

### CSS Variables

```css
/* Base Colors */
--tp-color-text         /* Primary text color */
--tp-color-text-secondary  /* Secondary text */
--tp-color-bg           /* Background color */
--tp-color-bg-hover     /* Hover background */
--tp-color-border       /* Border color */

/* Theme Colors */
--tp-color-primary      /* Primary color */
--tp-color-primary-bg   /* Primary background */
--tp-color-danger       /* Danger color */
--tp-color-danger-bg    /* Danger background */

/* Menu Styles */
--tp-menu-bg            /* Menu background */
--tp-menu-shadow        /* Menu shadow */
--tp-menu-radius        /* Menu border radius */

/* Button Sizes */
--tp-btn-size           /* Button size */
--tp-btn-size-sm        /* Small button */
--tp-btn-icon-size      /* Icon size */

/* Animation Duration */
--tp-transition-fast    /* Fast transition */
--tp-transition-normal  /* Normal transition */
```

### Shared Classes

| Class Name | Description |
|------|------|
| `.tp-menu` | Menu container |
| `.tp-menu-content` | Menu content |
| `.tp-menu-group` | Menu group |
| `.tp-btn` | Shared button |
| `.tp-btn.active` | Active state |
| `.tp-btn--danger` | Danger button |
| `.tp-color-panel` | Color picker panel |
| `.tp-color-item` | Color item |
| `.tp-dropdown-menu` | Dropdown menu |
| `.tp-dropdown-item` | Dropdown menu item |

### Shared Animations

```css
@keyframes tp-fade-in    /* Fade in */
@keyframes tp-slide-in   /* Slide in */
@keyframes tp-blink      /* Blink */
```

### Utility Classes

| Class Name | Description |
|------|------|
| `.tp-flex-center` | Flex center |
| `.tp-hidden` | Hide element |
| `.tp-visible` | Show element |

## Usage

1. **Import in components**:

```typescript
// Import shared base styles
import '../shared/styles/base.css'

// Import module-specific styles
import '../shared/styles/bubble-menu.css'
```

2. **word-mode.css includes complete theme variables**, and other module styles reuse them via CSS variables.

## Dark Mode

All styles support dark mode through the `:where(.dark, .dark *)` selector:

```css
:where(.dark, .dark *) .my-component {
  background: var(--tp-menu-bg);
  color: var(--tp-color-text);
}
```

## Responsive Breakpoints

- `768px` - Mobile breakpoint
- `480px` - Small screen phone breakpoint

## Optimization Log

### 2024-12 Refactoring

- ✅ Added `base.css` for unified shared styles management
- ✅ Extracted shared CSS variables (`--tp-*` prefix)
- ✅ Unified menu, button, and color panel styles
- ✅ Merged duplicate dark mode styles
- ✅ Merged duplicate responsive breakpoints

**File line count comparison**:

| File | Before | After | Reduction |
|------|--------|--------|------|
| bubble-menu.css | 77 | 52 | 32% |
| floating-menu-toolbar.css | 205 | 110 | 46% |
| table-bubble-menu.css | 190 | 130 | 32% |
| drag-handle-with-menu.css | 527 | 320 | 39% |
| **Added base.css** | - | 180 | - |
