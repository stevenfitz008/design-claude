import React from 'react';

// Basic components without styled-components for testing
export const LeftToolbar: React.FC<{ activeTool?: string; onToolChange?: (tool: string) => void }> = ({ activeTool, onToolChange }) => (
  <div data-testid="left-toolbar">LeftToolbar</div>
);

export const MainCanvas: React.FC = () => (
  <div data-testid="main-canvas">MainCanvas</div>
);

export const RightPanel: React.FC = () => (
  <div data-testid="right-panel">RightPanel</div>
);

export const TopNavigation: React.FC<{ 
  projectName?: string;
  onSave?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}> = ({ projectName = 'Test' }) => (
  <div data-testid="top-navigation">TopNavigation - {projectName}</div>
);