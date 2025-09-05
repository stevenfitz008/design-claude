import React, { useCallback } from 'react';
import { observer } from "mobx-react-lite";
// we need observer to update component automatically on any store changes
import { styled } from '@styles/goober-setup';
import { Button, Divider, Tooltip } from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import type { CanvasToolbarProps } from '@/types/pages';

const ToolbarContainer = styled.div<{ theme: any }>`
  position: fixed;
  top: 80px; /* Below top navigation */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: ${props => props.theme.colors.primaryBg};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 80;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%) translateY(-10px) scale(0.95);
  transition: all 0.3s ease;
  
  &.visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(-50%) translateY(0) scale(1);
  }
`;

const ToolbarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const ActionButton = styled(Button)<{ theme: any }>`
  min-width: 36px !important;
  height: 32px !important;
  border-radius: 4px !important;
  
  &:hover {
    background: ${props => props.theme.colors.accent} !important;
  }
  
  &.bp5-intent-danger:hover {
    background: #db3737 !important;
  }
  
  .bp5-icon {
    color: ${props => props.theme.colors.text};
  }
  
  &.bp5-intent-danger .bp5-icon {
    color: #ff6b6b;
  }
`;

const SectionDivider = styled(Divider)<{ theme: any }>`
  margin: 0 8px;
  height: 24px;
  border-color: ${props => props.theme.colors.border};
`;

const CanvasToolbar: React.FC<CanvasToolbarProps> = observer(({
  selectedElements,
  onFlip,
  onEffects,
  onFitToPage,
  onApplyMask,
  onCrop,
  onAnimate,
  onRemoveBackground,
  onDelete,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  className,
}) => {
  const { theme } = useTheme();
  const hasSelection = selectedElements.length > 0;
  const hasMultipleSelection = selectedElements.length > 1;

  const handleFlipHorizontal = useCallback(() => {
    onFlip('horizontal');
  }, [onFlip]);

  const handleFlipVertical = useCallback(() => {
    onFlip('vertical');
  }, [onFlip]);

  return (
    <ToolbarContainer
      theme={theme}
      className={`${className || ''} ${hasSelection ? 'visible' : ''}`}
    >
      {/* Transform actions */}
      <ToolbarSection>
        <Tooltip content="Flip horizontal">
          <ActionButton
            theme={theme}
            icon="swap-horizontal"
            minimal
            small
            onClick={handleFlipHorizontal}
            disabled={!hasSelection}
          />
        </Tooltip>
        
        <Tooltip content="Flip vertical">
          <ActionButton
            theme={theme}
            icon="swap-vertical"
            minimal
            small
            onClick={handleFlipVertical}
            disabled={!hasSelection}
          />
        </Tooltip>
      </ToolbarSection>

      <SectionDivider theme={theme} />

      {/* Image/Element actions */}
      <ToolbarSection>
        <Tooltip content="Effects & Filters">
          <ActionButton
            theme={theme}
            icon="media"
            minimal
            small
            onClick={onEffects}
            disabled={!hasSelection}
          />
        </Tooltip>
        
        <Tooltip content="Fit to page">
          <ActionButton
            theme={theme}
            icon="fullscreen"
            minimal
            small
            onClick={onFitToPage}
            disabled={!hasSelection}
          />
        </Tooltip>
        
        <Tooltip content="Apply mask">
          <ActionButton
            theme={theme}
            icon="layers"
            minimal
            small
            onClick={onApplyMask}
            disabled={!hasSelection}
          />
        </Tooltip>
        
        {onCrop && (
          <Tooltip content="Crop">
            <ActionButton
              theme={theme}
              icon="crop"
              minimal
              small
              onClick={onCrop}
              disabled={!hasSelection}
            />
          </Tooltip>
        )}
        
        {onRemoveBackground && (
          <Tooltip content="Remove background">
            <ActionButton
              theme={theme}
              icon="clean"
              minimal
              small
              onClick={onRemoveBackground}
              disabled={!hasSelection}
            />
          </Tooltip>
        )}
      </ToolbarSection>

      <SectionDivider theme={theme} />

      {/* Animation and duplication */}
      <ToolbarSection>
        <Tooltip content="Animate">
          <ActionButton
            theme={theme}
            icon="flash"
            minimal
            small
            onClick={onAnimate}
            disabled={!hasSelection}
          />
        </Tooltip>
        
        <Tooltip content="Duplicate">
          <ActionButton
            theme={theme}
            icon="duplicate"
            minimal
            small
            onClick={onDuplicate}
            disabled={!hasSelection}
          />
        </Tooltip>
      </ToolbarSection>

      <SectionDivider theme={theme} />

      {/* Layer management */}
      <ToolbarSection>
        <Tooltip content="Bring to front">
          <ActionButton
            theme={theme}
            icon="bring-data"
            minimal
            small
            onClick={onBringToFront}
            disabled={!hasSelection}
          />
        </Tooltip>
        
        <Tooltip content="Send to back">
          <ActionButton
            theme={theme}
            icon="send-to-back"
            minimal
            small
            onClick={onSendToBack}
            disabled={!hasSelection}
          />
        </Tooltip>
      </ToolbarSection>

      <SectionDivider theme={theme} />

      {/* Destructive actions */}
      <ToolbarSection>
        <Tooltip content={`Delete ${hasMultipleSelection ? 'elements' : 'element'}`}>
          <ActionButton
            theme={theme}
            icon="trash"
            minimal
            small
            intent="danger"
            onClick={onDelete}
            disabled={!hasSelection}
          />
        </Tooltip>
      </ToolbarSection>
    </ToolbarContainer>
  );
});

export { CanvasToolbar };
export type { CanvasToolbarProps };