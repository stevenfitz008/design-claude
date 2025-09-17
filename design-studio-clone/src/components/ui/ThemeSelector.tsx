import React from 'react';
import { Button, ButtonGroup, Icon, Popover, Menu, MenuItem } from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';

export const ThemeSelector: React.FC = () => {
  const { themeName, setTheme, isDark, isLight, isSystem, systemPreference } = useTheme();

  const getCurrentIcon = () => {
    if (isSystem) {
      return systemPreference === 'dark' ? 'moon' : 'flash';
    }
    return isDark ? 'moon' : 'flash';
  };

  const getCurrentLabel = () => {
    if (isSystem) {
      return `System (${systemPreference})`;
    }
    return isDark ? 'Dark' : 'Light';
  };

  const themeMenu = (
    <Menu>
      <MenuItem
        icon="flash"
        text="Light Theme"
        active={isLight && !isSystem}
        onClick={() => setTheme('light')}
      />
      <MenuItem
        icon="moon"
        text="Dark Theme"
        active={isDark && !isSystem}
        onClick={() => setTheme('dark')}
      />
      <MenuItem
        icon="desktop"
        text="System Theme"
        active={isSystem}
        onClick={() => setTheme('system')}
        label={`(${systemPreference})`}
      />
    </Menu>
  );

  return (
    <Popover content={themeMenu} position="bottom-right">
      <Button
        minimal
        icon={getCurrentIcon()}
        text={getCurrentLabel()}
        title="Change theme"
        style={{
          minWidth: 'auto',
          fontSize: '12px',
        }}
      />
    </Popover>
  );
};