import React from 'react';
import { observer } from "mobx-react-lite";
import { PhotosPanelPremium } from '@components/panels/PhotosPanelPremium';
import { PhotosPanelSimple } from '@components/PhotosPanelSimple';

interface RightPanelProps {
  activePanel?: string;
  children?: React.ReactNode;
  className?: string;
}

// Panel name mapping for display
const PANEL_NAMES: Record<string, string> = {
  'templates': 'Templates',
  'text': 'Text Tools',
  'photos': 'Photos'
};

// we need observer to update component automatically on any store changes
export const RightPanel: React.FC<RightPanelProps> = observer(({  
  activePanel = 'templates', 
  children, 
  className 
}) => {
  const panelName = PANEL_NAMES[activePanel] || 'Panel';

  const renderPanelContent = () => {
    if (children) return children;
    
    switch (activePanel) {
      case 'photos':
        return <PhotosPanelSimple />;
      default:
        return (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%', 
            color: '#8a9ba8',
            textAlign: 'center',
            padding: '32px'
          }}>
            <div style={{ fontSize: '48px', opacity: 0.5, marginBottom: '16px' }}>📋</div>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '500',
              color: '#bfccd6',
              marginBottom: '8px'
            }}>
              {panelName}
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.4', maxWidth: '250px' }}>
              Panel content will be loaded here based on your tool selection.
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      className={className}
      data-testid="right-panel"
      style={{ 
        height: '100%',
        width: '350px',
        minWidth: '350px',
        maxWidth: '350px',
        backgroundColor: '#2f343c',
        borderLeft: '1px solid #495563',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        flexGrow: 0,
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {activePanel !== 'photos' && (
        <div style={{ 
          padding: '16px',
          borderBottom: '1px solid #495563',
          backgroundColor: '#252a30',
          flexShrink: 0,
          width: '350px',
          maxWidth: '350px',
          minWidth: '350px',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ 
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#f5f8fa'
          }}>
            {panelName}
          </h3>
        </div>
      )}
      
      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        width: '350px',
        maxWidth: '350px',
        minWidth: '350px',
        boxSizing: 'border-box',
        position: 'relative',
        minHeight: 0
      }}>
        {renderPanelContent()}
      </div>
    </div>
  );
});

export type { RightPanelProps };