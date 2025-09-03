import React from 'react';
import { observer } from 'mobx-react-lite';
// we need observer to update component automatically on any store changes
// Import @meronex icons for proper vector icons
import { FaFolder, FaTh, FaFont, FaImage, FaStar, FaShapes, FaUpload, FaPlay, FaLayerGroup, FaExpandArrowsAlt, FaQuoteLeft, FaQrcode, FaRobot } from '@meronex/icons/fa';

// Basic functional components for testing with minimal styling
export const LeftToolbar: React.FC<{ activeTool?: string; onToolChange?: (tool: string) => void }> = observer(({ activeTool, onToolChange }) => {
  const tools = [
    { id: 'templates', name: 'Templates', IconComponent: FaTh, testId: 'tool-templates' },
    { id: 'uploads', name: 'Upload', IconComponent: FaUpload, testId: 'tool-uploads' },
    
    { id: 'photos', name: 'Photos', IconComponent: FaImage, testId: 'tool-photos' },
    { id: 'elements', name: 'Icons', IconComponent: FaStar, testId: 'tool-elements' },
    { id: 'text', name: 'Text', IconComponent: FaFont, testId: 'tool-text' },
    { id: 'shapes', name: 'Shapes', IconComponent: FaShapes, testId: 'tool-shapes' },
    
    { id: 'videos', name: 'Videos', IconComponent: FaPlay, testId: 'tool-videos' },
    { id: 'background', name: 'Background', IconComponent: FaTh, testId: 'tool-background' },
    
    { id: 'layers', name: 'Layers', IconComponent: FaLayerGroup, testId: 'tool-layers' },
    { id: 'resize', name: 'Resize', IconComponent: FaExpandArrowsAlt, testId: 'tool-resize' },
    
    { id: 'quotes', name: 'Quotes', IconComponent: FaQuoteLeft, testId: 'tool-quotes' },
    { id: 'qr-code', name: 'QR Code', IconComponent: FaQrcode, testId: 'tool-qr-code' },
    { id: 'ai-img', name: 'AI Img', IconComponent: FaRobot, testId: 'tool-ai-img' }
  ];

  return (
    <div style={{ position: 'relative' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .left-toolbar-scroll {
            scrollbar-width: thin;
            scrollbar-color: #48aff0 #252a30;
          }
          .left-toolbar-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .left-toolbar-scroll::-webkit-scrollbar-track {
            background: #252a30;
            border-radius: 3px;
          }
          .left-toolbar-scroll::-webkit-scrollbar-thumb {
            background: #495563;
            border-radius: 3px;
            border: 1px solid #252a30;
          }
          .left-toolbar-scroll::-webkit-scrollbar-thumb:hover {
            background: #48aff0;
          }
          .left-toolbar-scroll::-webkit-scrollbar-thumb:active {
            background: #2e5bba;
          }
          
          .left-toolbar-scroll::before,
          .left-toolbar-scroll::after {
            content: '';
            position: absolute;
            left: 0;
            right: 6px;
            height: 8px;
            pointer-events: none;
            z-index: 2;
          }
          .left-toolbar-scroll::before {
            top: 0;
            background: linear-gradient(to bottom, #252a30, transparent);
          }
          .left-toolbar-scroll::after {
            bottom: 0;
            background: linear-gradient(to top, #252a30, transparent);
          }
        `
      }} />
      
      <div 
        data-testid="left-toolbar" 
        className="left-toolbar-scroll"
        style={{ 
          width: '72px', 
          height: '100%', 
          backgroundColor: '#252a30', 
          borderRight: '1px solid #495563',
          display: 'flex',
          flexDirection: 'column',
          padding: '4px',
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative'
        }}
      >
      {tools.map((tool, index) => {
        const { IconComponent } = tool;
        const isActive = activeTool === tool.id;
        const iconColor = isActive ? '#48aff0' : '#f5f8fa';
        
        return (
          <div key={tool.id}>
            <button
              data-testid={tool.testId}
              onClick={() => onToolChange?.(tool.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                background: isActive ? 'rgba(72, 175, 240, 0.2)' : 'transparent',
                color: iconColor,
                border: 'none',
                padding: '8px 4px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '9px',
                width: '100%',
                marginBottom: '2px',
                transition: 'all 0.1s ease'
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(245, 248, 250, 0.05)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <IconComponent size={16} color={iconColor} style={{ color: iconColor }} />
              <span style={{ lineHeight: '1', textAlign: 'center', maxWidth: '100%' }}>
                {tool.name}
              </span>
            </button>
            {(index === 1 || index === 6 || index === 9 || index === 11) && (
              <div style={{
                height: '1px',
                backgroundColor: '#495563',
                margin: '4px 8px',
                opacity: 0.3
              }} />
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
});

// MainCanvas component moved to components/layout/MainCanvas.tsx

export const TopNavigation: React.FC<{ 
  projectName?: string;
  onSave?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}> = observer(({ projectName = 'Untitled Design' }) => (
  <div 
    data-testid="top-navigation" 
    style={{ 
      width: '100%', 
      height: '48px', 
      backgroundColor: '#252a30', 
      borderBottom: '1px solid #495563',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      color: '#f5f8fa',
      fontSize: '14px'
    }}
  >
    <span data-testid="project-name" style={{ fontWeight: '500' }}>
      {projectName}
    </span>
    <div style={{ display: 'flex', gap: '8px' }}>
      <button 
        data-testid="save-button"
        style={{ 
          padding: '6px 12px', 
          background: '#48aff0', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Save
      </button>
      <button 
        data-testid="export-button"
        style={{ 
          padding: '6px 12px', 
          background: 'transparent', 
          color: '#f5f8fa', 
          border: '1px solid #495563', 
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Export
      </button>
    </div>
  </div>
));

// Add AppLayout component that the tests expect
export const AppLayout: React.FC<{
  topNavigation: React.ReactNode;
  leftToolbar: React.ReactNode;
  mainCanvas: React.ReactNode;
  rightPanel: React.ReactNode;
}> = observer(({ topNavigation, leftToolbar, mainCanvas, rightPanel }) => (
  <div 
    data-testid="app-layout"
    style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#1e1e1e'
    }}
  >
    {topNavigation}
    <div style={{ display: 'flex', flex: 1 }}>
      {leftToolbar}
      <div data-testid="right-panel" style={{ width: '350px', borderLeft: '1px solid #495563', borderRight: '1px solid #495563' }}>
        {rightPanel}
      </div>
      {mainCanvas}
    </div>
  </div>
));