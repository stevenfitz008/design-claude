import React, { createContext, useContext, useState, ReactNode } from 'react';
import { darkTheme, lightTheme } from '../styles/goober-setup';
import type { Theme } from '../styles/goober-setup';

interface ThemeContextType {
  theme: Theme;
  themeName: string;
  setTheme: (themeName: string) => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
  systemPreference: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Detect system preference
  const getSystemPreference = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark'; // Default fallback
  };

  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(getSystemPreference());
  const [themeName, setThemeName] = useState<string>('system');

  const getCurrentTheme = (): Theme => {
    switch (themeName) {
      case 'light':
        return lightTheme;
      case 'dark':
        return darkTheme;
      case 'system':
      default:
        return systemPreference === 'dark' ? darkTheme : lightTheme;
    }
  };

  const theme = getCurrentTheme();

  // Listen for system theme changes
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemPreference(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const setTheme = (newThemeName: string) => {
    setThemeName(newThemeName);
    // Store preference in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('design-studio-theme', newThemeName);
    }
  };

  // Load saved theme preference on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('design-studio-theme');
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeName(savedTheme);
      }
    }
  }, []);

  const actualTheme = themeName === 'system' ? systemPreference : themeName;

  const contextValue: ThemeContextType = {
    theme,
    themeName,
    setTheme,
    isDark: actualTheme === 'dark',
    isLight: actualTheme === 'light',
    isSystem: themeName === 'system',
    systemPreference,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className={`bp5-${actualTheme} theme-${actualTheme}`} style={{ height: '100%' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};