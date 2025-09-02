import React from 'react';
import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';

interface RightPanelProps {
  activePanel?: string;
  children?: React.ReactNode;
  className?: string;
}

const PanelContainer = styled.div<{ theme: any }>`
  height: 100%;
  width: 100%;
  background-color: ${props => props.theme.colors.panelBg};
  border-left: 1px solid ${props => props.theme.colors.borderColor};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PanelHeader = styled.div<{ theme: any }>`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.borderColor};
  background-color: ${props => props.theme.colors.toolbarBg};
  flex-shrink: 0;
`;

const PanelTitle = styled.h3<{ theme: any }>`
  margin: 0;
  font-size: ${props => props.theme.typography.fontSizeMd};
  font-weight: ${props => props.theme.typography.fontWeightSemibold};
  color: ${props => props.theme.colors.textPrimary};
  line-height: ${props => props.theme.typography.lineHeightMd};
`;

const PanelContent = styled.div<{ theme: any }>`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: ${props => props.theme.spacing.md};
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.panelBg};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.textMuted};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.textSecondary};
  }
`;

const EmptyState = styled.div<{ theme: any }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme.colors.textMuted};
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  gap: ${props => props.theme.spacing.md};
  
  .icon {
    font-size: 48px;
    opacity: 0.5;
  }
  
  .title {
    font-size: ${props => props.theme.typography.fontSizeLg};
    font-weight: ${props => props.theme.typography.fontWeightMedium};
    color: ${props => props.theme.colors.textSecondary};
    margin-bottom: ${props => props.theme.spacing.sm};
  }
  
  .description {
    font-size: ${props => props.theme.typography.fontSizeSm};
    line-height: ${props => props.theme.typography.lineHeightMd};
    max-width: 250px;
  }
`;

// Panel name mapping for display
const PANEL_NAMES: Record<string, string> = {
  'my-designs': 'My Designs',
  'templates': 'Templates',
  'text': 'Text Tools',
  'photos': 'Photos',
  'icons': 'Icons',
  'shapes': 'Shapes',
  'upload': 'Upload',
  'videos': 'Videos',
  'background': 'Background',
  'layers': 'Layers',
  'resize': 'Resize',
  'quotes': 'Quotes',
  'qr-code': 'QR Code',
  'ai-image': 'AI Image'
};

export const RightPanel: React.FC<RightPanelProps> = ({ 
  activePanel = 'templates', 
  children, 
  className 
}) => {
  const { theme } = useTheme();
  const panelName = PANEL_NAMES[activePanel] || 'Panel';

  const renderEmptyState = () => (
    <EmptyState theme={theme}>
      <div className="icon">📋</div>
      <div className="title">{panelName}</div>
      <div className="description">
        Panel content will be loaded here based on your tool selection.
      </div>
    </EmptyState>
  );

  return (
    <PanelContainer theme={theme} className={className}>
      <PanelHeader theme={theme}>
        <PanelTitle theme={theme}>
          {panelName}
        </PanelTitle>
      </PanelHeader>
      
      <PanelContent theme={theme}>
        {children || renderEmptyState()}
      </PanelContent>
    </PanelContainer>
  );
};

export type { RightPanelProps };