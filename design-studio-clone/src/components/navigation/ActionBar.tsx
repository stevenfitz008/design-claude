import React from 'react';
import { observer } from "mobx-react-lite";
import { Button, ButtonGroup, NumericInput } from '@blueprintjs/core';
import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';

const ActionBarContainer = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  height: 48px;
  background-color: ${props => props.theme.colors.panelBg};
  border-bottom: 1px solid ${props => props.theme.colors.borderColor};
  border-top: 1px solid ${props => props.theme.colors.borderColor};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const DurationControl = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  gap: 8px;
  
  .bp5-input {
    width: 60px !important;
    text-align: center;
    background: ${props => props.theme.colors.panelBg} !important;
    border: 1px solid ${props => props.theme.colors.borderColor} !important;
    color: ${props => props.theme.colors.text} !important;
  }
`;

const ActionSection = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionButton = styled(Button)<{ theme: any }>`
  min-width: 80px !important;
  height: 32px !important;
  border-radius: 4px !important;
  
  &:hover {
    background: ${props => props.theme.colors.accent} !important;
  }
  
  .bp5-icon {
    color: ${props => props.theme.colors.text};
  }
`;

interface ActionBarProps {
  activeTool: string;
  className?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = observer(({ 
  activeTool,
  className,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) => {
  const { theme } = useTheme();
  const { selection, elements } = useCanvasStore();
  
  const [duration, setDuration] = React.useState(5.0);
  
  const hasSelection = selection.length > 0;
  const hasImageSelection = hasSelection && selection.some(id => 
    elements[id]?.type === 'image'
  );
  const hasTextSelection = hasSelection && selection.some(id => 
    elements[id]?.type === 'text'
  );
  const hasShapeSelection = hasSelection && selection.some(id => 
    ['shape', 'icon'].includes(elements[id]?.type || '')
  );

  const handleEffects = () => {
    console.log('Open effects panel');
  };

  const handleFitToPage = () => {
    console.log('Fit to page');
  };

  const handleApplyMask = () => {
    console.log('Apply mask');
  };

  const handleCrop = () => {
    console.log('Crop');
  };

  const handleAnimate = () => {
    console.log('Animate');
  };

  const handleRemoveBackground = () => {
    console.log('Remove background');
  };

  const renderPhotosActions = () => {
    if (!hasImageSelection) return null;
    
    return (
      <ActionSection>
        <ActionButton
          theme={theme}
          icon="media"
          text="Effects"
          minimal
          small
          onClick={handleEffects}
        />
        <ActionButton
          theme={theme}
          icon="fullscreen"
          text="Fit to page"
          minimal
          small
          onClick={handleFitToPage}
        />
        <ActionButton
          theme={theme}
          icon="layers"
          text="Apply mask"
          minimal
          small
          onClick={handleApplyMask}
        />
        <ActionButton
          theme={theme}
          icon="crop"
          text="Crop"
          minimal
          small
          onClick={handleCrop}
        />
        <ActionButton
          theme={theme}
          icon="flash"
          text="Animate"
          minimal
          small
          onClick={handleAnimate}
        />
        <ActionButton
          theme={theme}
          icon="clean"
          text="Remove background"
          minimal
          small
          onClick={handleRemoveBackground}
        />
      </ActionSection>
    );
  };

  const renderTextActions = () => {
    if (!hasTextSelection) return null;
    
    return (
      <ActionSection>
        <ActionButton
          theme={theme}
          icon="font"
          text="Font"
          minimal
          small
        />
        <ActionButton
          theme={theme}
          icon="bold"
          text="Bold"
          minimal
          small
        />
        <ActionButton
          theme={theme}
          icon="italic"
          text="Italic"
          minimal
          small
        />
        <ActionButton
          theme={theme}
          icon="align-left"
          text="Align"
          minimal
          small
        />
      </ActionSection>
    );
  };

  const renderShapesActions = () => {
    if (!hasShapeSelection) return null;
    
    return (
      <ActionSection>
        <ActionButton
          theme={theme}
          icon="style"
          text="Fill"
          minimal
          small
        />
        <ActionButton
          theme={theme}
          icon="circle"
          text="Stroke"
          minimal
          small
        />
        <ActionButton
          theme={theme}
          icon="layout-circle"
          text="Corners"
          minimal
          small
        />
      </ActionSection>
    );
  };

  const renderDefaultActions = () => {
    if (hasSelection) return null;
    
    return (
      <ActionSection>
        <ActionButton
          theme={theme}
          icon="select"
          text="Select All"
          minimal
          small
        />
        <ActionButton
          theme={theme}
          icon="duplicate"
          text="Duplicate"
          minimal
          small
          disabled={!hasSelection}
        />
      </ActionSection>
    );
  };

  const renderPanelActions = () => {
    switch (activeTool) {
      case 'photos':
        return renderPhotosActions();
      case 'text':
        return renderTextActions();
      case 'shapes':
      case 'elements': // elements = icons
        return renderShapesActions();
      default:
        return renderDefaultActions();
    }
  };

  return (
    <ActionBarContainer theme={theme} className={className}>
      {/* Navigation Controls */}
      <ActionSection>
        <ButtonGroup minimal>
          <ActionButton
            theme={theme}
            icon="chevron-left"
            minimal
            small
            title="Back"
            disabled={true} // TODO: Implement back navigation
          />
          <ActionButton
            theme={theme}
            icon="chevron-right"
            minimal
            small
            title="Forward"
            disabled={true} // TODO: Implement forward navigation
          />
        </ButtonGroup>
        
        <ButtonGroup minimal>
          <ActionButton
            theme={theme}
            icon="undo"
            minimal
            small
            title="Undo"
            disabled={!canUndo}
            onClick={onUndo}
          />
          <ActionButton
            theme={theme}
            icon="redo"
            minimal
            small
            title="Redo"
            disabled={!canRedo}
            onClick={onRedo}
          />
        </ButtonGroup>
      </ActionSection>

      {/* Duration Control */}
      <DurationControl theme={theme}>
        <NumericInput
          value={duration}
          onValueChange={setDuration}
          stepSize={0.1}
          minorStepSize={0.1}
          majorStepSize={1}
          min={0.1}
          max={30}
          small
        />
        <span style={{ color: theme.colors.textMuted, fontSize: '12px' }}>s</span>
      </DurationControl>

      {/* Dynamic Panel Actions */}
      {renderPanelActions()}
    </ActionBarContainer>
  );
});