import React, { useState } from 'react';
import { observer } from "mobx-react-lite";
import { Button } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useTheme } from '../../../contexts/ThemeProvider';
import { usePanelStore } from '../../stores/panelStore';
import { TOOLS, Tool } from '../../types/tools';

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
  icon: IconNames;
  label: string;
  shortcut?: string;
  'aria-label': string;
  'aria-pressed': boolean;
}> = ({ isActive, onClick, title, icon, label, shortcut, ...props }) => (
  <Button
    onClick={onClick}
    title={title}
    aria-label={props['aria-label']}
    aria-pressed={props['aria-pressed']}
    icon={icon}
    minimal
    large
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
    <div style={{
      fontSize: '11px',
      fontWeight: '400',
      lineHeight: '1.2',
      textAlign: 'center',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      marginTop: '4px'
    }}>
      {label}
    </div>
    {shortcut && (
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
        {shortcut}
      </div>
    )}
  </Button>
);


const ToolDivider: React.FC = () => (
  <div style={{
    height: '1px',
    backgroundColor: '#495563',
    margin: '4px 8px',
    opacity: 0.3
  }} />
);


// we need observer to update component automatically on any store changes
export const LeftToolbar: React.FC<LeftToolbarProps> = observer(({ 
  activeTool = 'templates', 
  onToolChange 
}) => {
  const { theme } = useTheme();
  const { setActivePanel } = usePanelStore();
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

  // Icon mapping for tools - using Blueprint.js icons
  const getToolIcon = (toolId: string): IconNames => {
    const iconMap: Record<string, IconNames> = {
      'my-designs': 'folder-close',
      'templates': 'grid-view',
      'text': 'font',
      'photos': 'media',
      'icons': 'symbol-circle',
      'shapes': 'polygon-filter',
      'upload': 'upload',
      'videos': 'play',
      'background': 'media',
      'layers': 'layers',
      'resize': 'fullscreen',
      'quotes': 'citation',
      'qr-code': 'grid',
      'ai-img': 'lightbulb',
      'reports': 'document',
      'pages': 'document',
      'components': 'cube',
      'hierarchy': 'diagram-tree',
    };
    return iconMap[toolId] || 'grid-view';
  };

  const renderToolButton = (tool: Tool) => {
    const icon = getToolIcon(tool.id);
    const isActive = activeToolId === tool.id;

    return (
      <div key={tool.id} data-testid={`tool-${tool.id}`}>
        <ToolButton
          theme={theme}
          isActive={isActive}
          onClick={() => handleToolClick(tool)}
          title={`${tool.name}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
          icon={icon}
          label={tool.name}
          shortcut={tool.shortcut}
          aria-label={tool.name}
          aria-pressed={isActive}
        />
      </div>
    );
  };

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
});

export type { LeftToolbarProps };