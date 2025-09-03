import React, { createContext, useContext, useState, ReactNode } from 'react';
import { darkTheme } from '../styles/goober-setup';

interface ThemeContextType {
  theme: any;
  themeName: string;
  setTheme: (themeName: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<string>('dark');
  const [theme] = useState(darkTheme);

  const setTheme = (newThemeName: string) => {
    setThemeName(newThemeName);
  };

  const contextValue: ThemeContextType = {
    theme,
    themeName,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className={`bp5-${themeName} theme-${themeName}`} style={{ height: '100%' }}>
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