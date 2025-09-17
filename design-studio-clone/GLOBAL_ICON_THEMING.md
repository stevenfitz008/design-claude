# Global Icon Theming System

This document explains how the global icon theming system works in the Design Studio Clone application.

## Overview

The application now has a comprehensive icon theming system that ensures consistent icon colors across all components, with support for light, dark, and system (auto) themes that follow the user's operating system preference.

## Components

### 1. Theme Configuration (`src/styles/goober-setup.ts`)

Added icon colors to both dark and light themes:

```typescript
// Dark theme
iconPrimary: '#f5f8fa',    // Primary text color for active/important icons
iconSecondary: '#a7b6c2',  // Secondary text color for normal icons
iconMuted: '#8a9ba8',      // Muted color for disabled/subtle icons

// Light theme
iconPrimary: '#1a202c',    // Dark icons for light theme
iconSecondary: '#4a5568',  // Medium gray for normal icons
iconMuted: '#718096',      // Light gray for disabled/subtle icons
```

### 2. Theme Provider Updates (`src/contexts/ThemeProvider.tsx`)

Enhanced to support both themes with proper TypeScript types and theme switching capabilities.

### 3. Global CSS Rules (`src/styles/global-icons.css`)

Automatic Blueprint.js icon theming using CSS variables:

```css
/* Automatically themes all Blueprint.js icons */
.bp5-icon {
  color: var(--bp5-icon-color) !important;
}

/* Removes background boxes from panel icons */
.layers-panel .bp5-icon,
.photos-panel .bp5-icon {
  background: none !important;
  border: none !important;
}
```

### 4. Utility Functions (`src/utils/themeUtils.ts`)

Helper functions for consistent icon styling:

- `getIconColors(theme)` - Get all icon colors from theme
- `getIconColor(theme, priority)` - Get specific icon color
- `getGlobalIconStyle(theme, priority)` - Get complete icon style object
- `getCleanIconContainerStyle(size, margin)` - Container without background boxes
- `getDragHandleDotStyle(theme)` - Consistent drag handle dots

### 5. Custom Hook (`src/hooks/useGlobalIcons.ts`)

Easy-to-use hook for components:

```typescript
const icons = useGlobalIcons();

// Use in components
<Icon style={icons.getIconStyle('secondary')} />
<div style={icons.getCleanContainer(20, 12)} />
<div className={icons.classes.panel} />
```

## Usage Examples

### Basic Icon Styling

```typescript
import { useGlobalIcons } from '@/hooks/useGlobalIcons';

const MyComponent = () => {
  const icons = useGlobalIcons();

  return (
    <div style={icons.getCleanContainer()}>
      <Icon icon="document" style={icons.getIconStyle('secondary')} />
    </div>
  );
};
```

### Panel Icons (No Background Boxes)

```typescript
// Old way (with background box)
<div style={{
  backgroundColor: '#394b59',
  borderRadius: '4px',
  padding: '8px'
}}>
  <Icon icon="media" />
</div>

// New way (clean, themed)
<div style={icons.getCleanContainer(20, 12)}>
  <Icon icon="media" style={icons.getIconStyle('secondary')} />
</div>
```

### Button Icons

```typescript
<Button
  icon="trash"
  style={icons.getButtonIcon(isActive)}
  className={icons.classes.layerControl}
/>
```

### Drag Handles

```typescript
<div style={icons.getDragDot()} />
<div style={icons.getDragDot()} />
<div style={icons.getDragDot()} />
```

## Theme Switching

The application supports three theme modes:

### Programmatic Theme Switching

```typescript
const { setTheme } = useTheme();

// Switch to light theme
setTheme('light');

// Switch to dark theme
setTheme('dark');

// Switch to system theme (follows OS preference)
setTheme('system');
```

### Theme Selector Component

A ThemeSelector component is available in the top navigation that allows users to:
- Choose Light Theme (force light mode)
- Choose Dark Theme (force dark mode)
- Choose System Theme (automatically follow OS preference)
- See current system preference in the label

### System Theme Detection

The system theme:
- Automatically detects the user's OS color preference
- Updates in real-time when the user changes their OS theme
- Persists the user's theme choice in localStorage
- Defaults to system preference on first visit

## CSS Classes Available

- `.panel-icon` - Standard panel icon styling
- `.panel-icon-primary` - Primary importance icons
- `.panel-icon-muted` - Muted/disabled icons
- `.layer-control-icon` - Layer control button icons

## Automatic Features

1. **Blueprint.js Integration**: All Blueprint.js icons automatically follow the theme
2. **System Theme Detection**: Automatically detects and follows OS color preference
3. **Real-time Updates**: Theme changes instantly when OS preference changes
4. **Persistent Preferences**: User theme choice saved in localStorage
5. **Hover Effects**: Icons automatically get proper hover colors
6. **Disabled States**: Disabled icons automatically get muted colors
7. **Background Removal**: Panel icons automatically have background boxes removed
8. **Consistent Sizing**: Icons maintain consistent sizes across components

## Benefits

1. **Consistency**: All icons follow the same color scheme
2. **Theme Support**: Automatic dark/light theme switching
3. **Accessibility**: Proper contrast ratios for both themes
4. **Maintainability**: Centralized icon styling logic
5. **Performance**: CSS variables for efficient theme switching
6. **Developer Experience**: Easy-to-use utilities and hooks

## Migration Guide

To update existing components:

1. Import the hook: `import { useGlobalIcons } from '@/hooks/useGlobalIcons';`
2. Replace hardcoded icon styles with `icons.getIconStyle()`
3. Remove background containers and use `icons.getCleanContainer()`
4. Use CSS classes for common patterns

This system ensures that all icons in the application will automatically adapt to theme changes and maintain visual consistency.