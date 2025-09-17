// Goober CSS-in-JS setup for Design Studio Clone
import { setup, styled, css, keyframes, glob } from 'goober';
import { createElement } from 'react';

// Setup Goober to work with React
setup(createElement);

// Re-export for components
export { styled, css, keyframes, glob };

// Theme interface for TypeScript (must be declared before usage)
export interface Theme {
  colors: {
    canvasBg: string;
    canvasSurface: string;
    panelBg: string;
    toolbarBg: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    borderColor: string;
    hoverBg: string;
    activeBg: string;
    selectionColor: string;
    selectionBg: string;
    handleColor: string;
    gridColor: string;
    guideColor: string;
    // Additional properties for PhotosPanelPremium
    bg: string;
    cardBg: string;
    text: string;
    border: string;
    primary: string;
    // Icon colors for global theming
    iconPrimary: string;
    iconSecondary: string;
    iconMuted: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  layout: {
    leftToolbarWidth: string;
    rightPanelWidth: string;
    topNavHeight: string;
    timelineHeight: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  typography: {
    fontSizeXs: string;
    fontSizeSm: string;
    fontSizeMd: string;
    fontSizeLg: string;
    fontSizeXl: string;
    fontSizeXxl: string;
    lineHeightSm: string;
    lineHeightMd: string;
    lineHeightLg: string;
    fontWeightNormal: string;
    fontWeightMedium: string;
    fontWeightSemibold: string;
    fontWeightBold: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

// Light theme configuration
export const lightTheme: Theme = {
  colors: {
    canvasBg: '#f0f0f0',
    canvasSurface: '#ffffff',
    panelBg: '#ffffff',
    toolbarBg: '#f8f9fa',
    textPrimary: '#1a202c',
    textSecondary: '#4a5568',
    textMuted: '#718096',
    borderColor: '#e2e8f0',
    hoverBg: 'rgba(72, 175, 240, 0.1)',
    activeBg: 'rgba(72, 175, 240, 0.2)',
    selectionColor: '#48aff0',
    selectionBg: 'rgba(72, 175, 240, 0.15)',
    handleColor: '#48aff0',
    gridColor: 'rgba(0, 0, 0, 0.1)',
    guideColor: '#ff6b6b',
    // Additional properties for PhotosPanelPremium
    bg: '#ffffff',
    cardBg: '#f8f9fa',
    text: '#1a202c',
    border: '#e2e8f0',
    primary: '#48aff0',
    // Icon colors for global theming - light theme uses darker icons
    iconPrimary: '#1a202c',
    iconSecondary: '#4a5568',
    iconMuted: '#718096',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 2px 6px rgba(0, 0, 0, 0.15)',
    lg: '0 4px 12px rgba(0, 0, 0, 0.2)',
    xl: '0 8px 24px rgba(0, 0, 0, 0.25)',
  },
  layout: {
    leftToolbarWidth: '72px',
    rightPanelWidth: '350px',
    topNavHeight: '64px',
    timelineHeight: '200px',
  },
  borderRadius: {
    sm: '3px',
    md: '4px',
    lg: '6px',
    xl: '8px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  typography: {
    fontSizeXs: '11px',
    fontSizeSm: '12px',
    fontSizeMd: '14px',
    fontSizeLg: '16px',
    fontSizeXl: '18px',
    fontSizeXxl: '20px',
    lineHeightSm: '1.2',
    lineHeightMd: '1.4',
    lineHeightLg: '1.6',
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    fontWeightSemibold: '600',
    fontWeightBold: '700',
  },
  transitions: {
    fast: '0.1s ease',
    normal: '0.15s ease',
    slow: '0.3s ease',
  },
};

// Default dark theme matching our CSS variables
export const darkTheme: Theme = {
  colors: {
    canvasBg: '#e7e7e7',
    canvasSurface: '#ffffff',
    panelBg: '#394b59',
    toolbarBg: '#252a30',
    textPrimary: '#f5f8fa',
    textSecondary: '#a7b6c2',
    textMuted: '#8a9ba8',
    borderColor: '#495563',
    hoverBg: 'rgba(72, 175, 240, 0.1)',
    activeBg: 'rgba(72, 175, 240, 0.2)',
    selectionColor: '#48aff0',
    selectionBg: 'rgba(72, 175, 240, 0.15)',
    handleColor: '#48aff0',
    gridColor: 'rgba(255, 255, 255, 0.1)',
    guideColor: '#ff6b6b',
    // Additional properties for PhotosPanelPremium
    bg: '#2f343c',
    cardBg: '#394b59',
    text: '#f5f8fa',
    border: '#495563',
    primary: '#48aff0',
    // Icon colors for global theming
    iconPrimary: '#f5f8fa',
    iconSecondary: '#a7b6c2',
    iconMuted: '#8a9ba8',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.2)',
    md: '0 2px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 4px 12px rgba(0, 0, 0, 0.4)',
    xl: '0 8px 24px rgba(0, 0, 0, 0.5)',
  },
  layout: {
    leftToolbarWidth: '72px',
    rightPanelWidth: '350px',
    topNavHeight: '64px',
    timelineHeight: '200px',
  },
  borderRadius: {
    sm: '3px',
    md: '4px',
    lg: '6px',
    xl: '8px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  typography: {
    fontSizeXs: '11px',
    fontSizeSm: '12px',
    fontSizeMd: '14px',
    fontSizeLg: '16px',
    fontSizeXl: '18px',
    fontSizeXxl: '20px',
    lineHeightSm: '1.2',
    lineHeightMd: '1.4',
    lineHeightLg: '1.6',
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    fontWeightSemibold: '600',
    fontWeightBold: '700',
  },
  transitions: {
    fast: '0.1s ease',
    normal: '0.15s ease',
    slow: '0.3s ease',
  },
};

// Utility function to get CSS variable value
export const getCSSVar = (name: string): string => {
  return `var(--${name})`;
};

// Common styled component patterns
export const commonStyles = {
  // Flex utilities
  flexCenter: `
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  flexColumn: `
    display: flex;
    flex-direction: column;
  `,
  flexBetween: `
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,
  
  // Position utilities
  absolute: `
    position: absolute;
  `,
  relative: `
    position: relative;
  `,
  fixed: `
    position: fixed;
  `,
  
  // Size utilities
  fullWidth: `
    width: 100%;
  `,
  fullHeight: `
    height: 100%;
  `,
  fullSize: `
    width: 100%;
    height: 100%;
  `,
  
  // Overflow utilities
  overflowHidden: `
    overflow: hidden;
  `,
  overflowAuto: `
    overflow: auto;
  `,
  
  // User interaction
  noSelect: `
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  `,
  
  // Common button styles
  buttonReset: `
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
  `,
};