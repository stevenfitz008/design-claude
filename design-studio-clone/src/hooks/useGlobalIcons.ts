import { useTheme } from '@/contexts/ThemeProvider';
import { getGlobalIconStyle, getCleanIconContainerStyle, getDragHandleDotStyle, getButtonIconStyle } from '@/utils/themeUtils';

/**
 * Hook for accessing global icon utilities with current theme
 * This ensures consistent icon styling across all components
 */
export const useGlobalIcons = () => {
  const { theme } = useTheme();

  return {
    // Style functions with theme applied
    getIconStyle: (priority: 'primary' | 'secondary' | 'muted' = 'secondary') =>
      getGlobalIconStyle(theme, priority),

    getCleanContainer: (size: number = 20, marginRight: number = 12) =>
      getCleanIconContainerStyle(size, marginRight),

    getDragDot: (size: number = 3) =>
      getDragHandleDotStyle(theme, size),

    getButtonIcon: (isActive: boolean = false) =>
      getButtonIconStyle(theme, isActive),

    // Direct color access
    colors: {
      primary: theme.colors?.iconPrimary || theme.colors?.textPrimary || '#f5f8fa',
      secondary: theme.colors?.iconSecondary || theme.colors?.textSecondary || '#a7b6c2',
      muted: theme.colors?.iconMuted || theme.colors?.textMuted || '#8a9ba8',
    },

    // CSS class names for global styling
    classes: {
      panel: 'panel-icon',
      panelPrimary: 'panel-icon-primary',
      panelMuted: 'panel-icon-muted',
      layerControl: 'layer-control-icon',
    },
  };
};