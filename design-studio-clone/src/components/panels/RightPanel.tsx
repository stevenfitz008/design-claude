import React, { useMemo } from 'react';
import { Button, Icon, Collapse } from '@blueprintjs/core';
import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import { usePanelStore, PanelType } from '@/stores/panelStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { TemplatesPanel } from './TemplatesPanel';
import { PhotosPanel } from './PhotosPanel';
import { TextToolsPanel } from './TextToolsPanel';
import { IconsPanel } from './IconsPanel';
import { IconControlPanel } from './IconControlPanel';
import { ShapesPanel } from './ShapesPanel';
import { UploadPanel } from './UploadPanel';
import { VideosPanel } from './VideosPanel';
import { BackgroundPanel } from './BackgroundPanel';
import { LayersPanel } from './LayersPanel';
import { ResizePanel } from './ResizePanel';
import { QuotesPanel } from './QuotesPanel';
import { QRCodePanel } from './QRCodePanel';
import { AIImagePanel } from './AIImagePanel';
import type { IconElement } from '@/types/canvas';

interface RightPanelProps {
  className?: string;
}

const PanelContainer = styled.div<{ theme: any; isCollapsed: boolean }>`
  width: ${props => props.isCollapsed ? '50px' : '350px'};
  height: 100%;
  background-color: ${props => props.theme.colors.panelBg};
  border-left: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
`;

const PanelHeader = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  min-height: 48px;
  
  .panel-title {
    font-weight: 600;
    font-size: 14px;
    color: ${props => props.theme.colors.textPrimary};
    text-transform: capitalize;
  }
  
  .panel-actions {
    display: flex;
    gap: 4px;
  }
`;

const PanelContent = styled.div<{ theme: any }>`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const CollapsedView = styled.div<{ theme: any }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  gap: 12px;
`;

const BackButton = styled(Button)<{ theme: any }>`
  min-width: 32px !important;
  padding: 4px !important;
`;

// Panel type to display name mapping
const PANEL_NAMES: Record<PanelType, string> = {
  templates: 'Templates',
  text: 'Text Tools', 
  photos: 'Photos',
  icons: 'Icons',
  shapes: 'Shapes',
  upload: 'Upload',
  videos: 'Videos',
  background: 'Background',
  layers: 'Layers',
  resize: 'Resize',
  quotes: 'Quotes',
  qrcode: 'QR Code',
  'ai-image': 'AI Images',
};

export const RightPanel: React.FC<RightPanelProps> = ({ className }) => {
  const { theme } = useTheme();
  const { 
    activePanel, 
    isCollapsed, 
    toggleCollapsed, 
    goBack, 
    canGoBack 
  } = usePanelStore();
  const { selection, elements } = useCanvasStore();
  
  // Check if icons are selected
  const selectedElements = elements.filter(el => selection.includes(el.id));
  const selectedIcons = selectedElements.filter(el => el.type === 'icon') as IconElement[];

  const panelComponent = useMemo(() => {
    // If icons are selected, show the icon control panel regardless of active panel
    if (selectedIcons.length > 0) {
      return <IconControlPanel selectedElements={selectedIcons} />;
    }
    
    switch (activePanel) {
      case 'templates':
        return <TemplatesPanel />;
      case 'photos':
        return <PhotosPanel />;
      case 'text':
        return <TextToolsPanel />;
      case 'icons':
        return <IconsPanel />;
      case 'shapes':
        return <ShapesPanel />;
      case 'upload':
        return <UploadPanel />;
      case 'videos':
        return <VideosPanel />;
      case 'background':
        return <BackgroundPanel />;
      case 'layers':
        return <LayersPanel />;
      case 'resize':
        return <ResizePanel />;
      case 'quotes':
        return <QuotesPanel />;
      case 'qrcode':
        return <QRCodePanel />;
      case 'ai-image':
        return <AIImagePanel />;
      default:
        return <div>Unknown Panel</div>;
    }
  }, [activePanel, selectedIcons]);

  if (isCollapsed) {
    return (
      <PanelContainer theme={theme} isCollapsed={true} className={className}>
        <CollapsedView theme={theme}>
          <Button
            icon="menu-open"
            minimal
            onClick={toggleCollapsed}
            title="Expand Panel"
          />
          <Icon 
            icon={getPanelIcon(activePanel)} 
            size={20} 
            style={{ opacity: 0.6 }}
          />
        </CollapsedView>
      </PanelContainer>
    );
  }

  return (
    <PanelContainer 
      theme={theme} 
      isCollapsed={false} 
      className={className}
      data-testid="right-panel"
      role="complementary"
      aria-label={`${PANEL_NAMES[activePanel]} Panel`}
    >
      {/* All panel headers removed for clean design consistency across all panels */}
      {false && (
        <PanelHeader theme={theme}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {canGoBack() && (
              <BackButton
                icon="arrow-left"
                minimal
                onClick={goBack}
                title="Go Back"
                theme={theme}
              />
            )}
            <Icon icon={getPanelIcon(activePanel)} size={16} />
            <span className="panel-title">
              {PANEL_NAMES[activePanel]}
            </span>
        </div>
        
        <div className="panel-actions">
          <Button
            icon="menu-close"
            minimal
            onClick={toggleCollapsed}
            title="Collapse Panel"  
            aria-label="Collapse Panel"
          />
        </div>
        </PanelHeader>
      )}

      <PanelContent theme={theme}>
        <Collapse isOpen={!isCollapsed} keepChildrenMounted>
          {panelComponent}
        </Collapse>
      </PanelContent>
    </PanelContainer>
  );
};

// Helper function to get panel icon
function getPanelIcon(panel: PanelType): string {
  const iconMap: Record<PanelType, string> = {
    templates: 'layout-grid',
    text: 'font',
    photos: 'media',
    icons: 'symbol-circle',
    shapes: 'polygon-filter',
    upload: 'upload',
    videos: 'video',
    background: 'style',
    layers: 'layers',
    resize: 'fullscreen',
    quotes: 'citation',
    qrcode: 'th',
    'ai-image': 'predictive-analysis',
  };
  
  return iconMap[panel] || 'help';
}

RightPanel.displayName = 'RightPanel';