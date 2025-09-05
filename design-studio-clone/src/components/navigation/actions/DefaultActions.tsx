import React from 'react';
import { Button, ButtonGroup, Icon } from '@blueprintjs/core';
import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CanvasElement } from '@/types/canvas';

interface DefaultActionsProps {
  hasSelection: boolean;
  selectedElements: CanvasElement[];
}

const ActionsContainer = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const ActionButton = styled(Button)<{ theme: any }>`
  &.bp4-disabled {
    opacity: 0.3;
  }
  
  &:not(.bp4-disabled):hover {
    background-color: ${props => props.theme.colors.hoverBg};
    color: ${props => props.theme.colors.selectionColor};
  }
`;

export const DefaultActions: React.FC<DefaultActionsProps> = ({ hasSelection, selectedElements }) => {
  const { theme } = useTheme();
  const { 
    duplicateElements, 
    deleteElements, 
    copySelection, 
    cutSelection, 
    paste, 
    moveToFront, 
    moveToBack,
    clipboard,
    selectAll
  } = useCanvasStore();

  const handleDuplicate = () => {
    if (!hasSelection) return;
    duplicateElements(selectedElements.map(el => el.id));
  };

  const handleDelete = () => {
    if (!hasSelection) return;
    deleteElements(selectedElements.map(el => el.id));
  };

  const handleCopy = () => {
    if (!hasSelection) return;
    copySelection();
  };

  const handleCut = () => {
    if (!hasSelection) return;
    cutSelection();
  };

  const handlePaste = () => {
    paste();
  };

  const handleBringToFront = () => {
    if (!hasSelection) return;
    selectedElements.forEach(el => moveToFront(el.id));
  };

  const handleSendToBack = () => {
    if (!hasSelection) return;
    selectedElements.forEach(el => moveToBack(el.id));
  };

  const handleSelectAll = () => {
    selectAll();
  };

  const hasClipboard = clipboard.length > 0;

  return (
    <ActionsContainer theme={theme}>
      <ButtonGroup>
        {/* Selection Actions */}
        <ActionButton
          theme={theme}
          icon="select"
          text="Select All"
          minimal
          small
          onClick={handleSelectAll}
          title="Select All (Ctrl+A)"
        />

        {/* Clipboard Actions */}
        <ActionButton
          theme={theme}
          icon="duplicate"
          text="Copy"
          minimal
          small
          disabled={!hasSelection}
          onClick={handleCopy}
          title="Copy (Ctrl+C)"
        />
        
        <ActionButton
          theme={theme}
          icon="cut"
          text="Cut"
          minimal
          small
          disabled={!hasSelection}
          onClick={handleCut}
          title="Cut (Ctrl+X)"
        />
        
        <ActionButton
          theme={theme}
          icon="clipboard"
          text="Paste"
          minimal
          small
          disabled={!hasClipboard}
          onClick={handlePaste}
          title="Paste (Ctrl+V)"
        />

        {/* Transform Actions */}
        <ActionButton
          theme={theme}
          icon="duplicate"
          text="Duplicate"
          minimal
          small
          disabled={!hasSelection}
          onClick={handleDuplicate}
          title="Duplicate (Ctrl+D)"
        />

        <ActionButton
          theme={theme}
          icon="trash"
          text="Delete"
          minimal
          small
          disabled={!hasSelection}
          onClick={handleDelete}
          title="Delete (Del)"
        />

        {/* Layer Actions */}
        <ButtonGroup>
          <ActionButton
            theme={theme}
            icon="bring-data"
            minimal
            small
            disabled={!hasSelection}
            onClick={handleBringToFront}
            title="Bring to Front"
          />
          <ActionButton
            theme={theme}
            icon="send-to-map"
            minimal
            small
            disabled={!hasSelection}
            onClick={handleSendToBack}
            title="Send to Back"
          />
        </ButtonGroup>
      </ButtonGroup>
    </ActionsContainer>
  );
};