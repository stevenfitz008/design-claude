import type { Theme } from '../styles/goober-setup';

/**
 * Global theme utilities for consistent styling across components
 */

export interface IconColorProps {
  primary: string;
  secondary: string;
  muted: string;
}

/**
 * Get standardized icon colors from theme
 */
export const getIconColors = (theme: Theme): IconColorProps => ({
  primary: theme.colors?.iconPrimary || theme.colors?.textPrimary || '#f5f8fa',
  secondary: theme.colors?.iconSecondary || theme.colors?.textSecondary || '#a7b6c2',
  muted: theme.colors?.iconMuted || theme.colors?.textMuted || '#8a9ba8',
});

/**
 * Get icon color by priority level
 */
export const getIconColor = (theme: Theme, priority: 'primary' | 'secondary' | 'muted' = 'secondary'): string => {
  const colors = getIconColors(theme);
  return colors[priority];
};

/**
 * Global icon style properties for consistent theming
 */
export const getGlobalIconStyle = (theme: Theme, priority: 'primary' | 'secondary' | 'muted' = 'secondary') => ({
  color: getIconColor(theme, priority),
});

/**
 * Remove background boxes from icons - returns clean icon container styles
 */
export const getCleanIconContainerStyle = (size: number = 20, marginRight: number = 12) => ({
  width: `${size}px`,
  height: `${size}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: `${marginRight}px`,
  flexShrink: 0,
});

/**
 * Consistent button icon styles across the app
 */
export const getButtonIconStyle = (theme: Theme, isActive: boolean = false) => ({
  ...getGlobalIconStyle(theme, isActive ? 'primary' : 'secondary'),
  opacity: isActive ? 1 : 0.7,
});

/**
 * Drag handle dot styles for consistent appearance
 */
export const getDragHandleDotStyle = (theme: Theme, size: number = 3) => ({
  width: `${size}px`,
  height: `${size}px`,
  backgroundColor: getIconColor(theme, 'muted'),
  borderRadius: '50%',
});