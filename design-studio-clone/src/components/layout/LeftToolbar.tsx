import React, { useState } from 'react';
import { Icon } from '@blueprintjs/core';
// import { styled } from 'goober';
import { useTheme } from '@/contexts/ThemeProvider';
import { usePanelStore } from '@/stores/panelStore';
import { TOOLS } from '@types/tools';
type Tool = any;

interface LeftToolbarProps {
  activeTool?: string;
  onToolChange?: (toolId: string) => void;
}

const ToolbarContainer: React.FC<{ theme: any; children: React.ReactNode }> = ({ children }) => (
  <div style={{ 
    height: '100%', 
    width: '100%', 
    backgroundColor: '#252a30',
    borderRight: '1px solid #495563',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden'
  }}>
    {children}
  </div>
);

const ToolButton: React.FC<{ 
  theme: any; 
  isActive: boolean; 
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  'aria-label': string;
  'aria-pressed': boolean;
}> = ({ isActive, onClick, title, children, ...props }) => (
  <button 
    onClick={onClick}
    title={title}
    aria-label={props['aria-label']}
    aria-pressed={props['aria-pressed']}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '64px',
      height: '64px',
      padding: '8px',
      gap: '4px',
      background: isActive ? 'rgba(72, 175, 240, 0.2)' : 'transparent',
      border: 'none',
      color: isActive ? '#48aff0' : '#f5f8fa',
      cursor: 'pointer',
      borderRadius: '4px',
      margin: '2px 4px',
      transition: 'all 0.1s ease',
      position: 'relative'
    }}
  >
    {children}
  </button>
);

const ToolIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    {children}
  </div>
);

const ToolLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{
    fontSize: '11px',
    fontWeight: '400',
    lineHeight: '1.2',
    textAlign: 'center',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }}>
    {children}
  </span>
);

const ToolDivider: React.FC = () => (
  <div style={{
    height: '1px',
    backgroundColor: '#495563',
    margin: '4px 8px',
    opacity: 0.3
  }} />
);

const ShortcutHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    position: 'absolute',
    top: '4px',
    right: '4px',
    fontSize: '9px',
    background: '#8a9ba8',
    color: '#2f343c',
    padding: '1px 3px',
    borderRadius: '2px',
    opacity: 0.7
  }}>
    {children}
  </div>
);

export const LeftToolbar: React.FC<LeftToolbarProps> = ({ 
  activeTool = 'templates', 
  onToolChange 
}) => {
  const { theme } = useTheme();
  const { activePanel, setActivePanel } = usePanelStore();
  const [activeToolId, setActiveToolId] = useState(activeTool);

  const handleToolClick = (tool: Tool) => {
    setActiveToolId(tool.id);
    onToolChange?.(tool.id);
    
    // Update the panel store to show the corresponding panel
    setActivePanel(tool.id as any);
  };

  // Group tools by category for better organization
  const designTools = TOOLS.filter(tool => ['design', 'content'].includes(tool.category));
  const mediaTools = TOOLS.filter(tool => tool.category === 'media');
  const utilityTools = TOOLS.filter(tool => ['utility', 'ai'].includes(tool.category));

  const renderToolButton = (tool: Tool) => (
    <ToolButton
      key={tool.id}
      theme={theme}
      isActive={activeToolId === tool.id}
      onClick={() => handleToolClick(tool)}
      title={`${tool.name}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
      aria-label={tool.name}
      aria-pressed={activeToolId === tool.id}
    >
      <ToolIcon>
        <Icon icon={tool.icon as any} />
      </ToolIcon>
      <ToolLabel>
        {tool.name}
      </ToolLabel>
      {tool.shortcut && (
        <ShortcutHint>
          {tool.shortcut}
        </ShortcutHint>
      )}
    </ToolButton>
  );

  return (
    <ToolbarContainer theme={theme}>
      {/* Design & Content Tools */}
      {designTools.map(renderToolButton)}
      
      <ToolDivider />
      
      {/* Media Tools */}
      {mediaTools.map(renderToolButton)}
      
      <ToolDivider />
      
      {/* Utility & AI Tools */}
      {utilityTools.map(renderToolButton)}
    </ToolbarContainer>
  );
};

export type { LeftToolbarProps };