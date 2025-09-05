import React from 'react';
import { observer } from "mobx-react-lite";
import { Button, ButtonGroup, Icon, Menu, MenuDivider, MenuItem, Popover } from '@blueprintjs/core';
import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';

interface TopNavigationProps {
  projectName?: string;
  onSave?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const NavigationContainer = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.toolbarBg};
  border-bottom: 1px solid ${props => props.theme.colors.borderColor};
`;

const LeftSection = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
`;

const CenterSection = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex: 1;
  justify-content: center;
  max-width: 800px;
`;

const RightSection = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ProjectName = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  .project-title {
    font-size: ${props => props.theme.typography.fontSizeMd};
    font-weight: ${props => props.theme.typography.fontWeightMedium};
    color: ${props => props.theme.colors.textPrimary};
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .edit-button {
    opacity: 0.7;
    transition: opacity ${props => props.theme.transitions.fast};
    
    &:hover {
      opacity: 1;
    }
  }
`;

const Logo = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.selectionColor};
  font-weight: ${props => props.theme.typography.fontWeightBold};
  font-size: ${props => props.theme.typography.fontSizeLg};
`;

// we need observer to update component automatically on any store changes
export const TopNavigation: React.FC<TopNavigationProps> = observer(({ 
  projectName = 'Untitled Design',
  onSave,
  onExport,
  onShare,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) => {
  const { theme } = useTheme();
  const { canUndo: storeCanUndo, canRedo: storeCanRedo, undo: storeUndo, redo: storeRedo } = useCanvasStore();

  // Use canvas store methods if no external handlers provided
  const handleUndo = onUndo || storeUndo;
  const handleRedo = onRedo || storeRedo;
  const isUndoDisabled = canUndo !== undefined ? !canUndo : !storeCanUndo();
  const isRedoDisabled = canRedo !== undefined ? !canRedo : !storeCanRedo();

  const fileMenu = (
    <Menu>
      <MenuItem icon="document" text="New Design" />
      <MenuItem icon="folder-open" text="Open" />
      <MenuDivider />
      <MenuItem icon="floppy-disk" text="Save" onClick={onSave} />
      <MenuItem icon="duplicate" text="Save as Copy" />
      <MenuDivider />
      <MenuItem icon="import" text="Import" />
      <MenuItem icon="export" text="Export" onClick={onExport} />
      <MenuDivider />
      <MenuItem icon="print" text="Print" />
    </Menu>
  );

  const shareMenu = (
    <Menu>
      <MenuItem icon="share" text="Share Link" onClick={onShare} />
      <MenuItem icon="people" text="Invite Collaborators" />
      <MenuDivider />
      <MenuItem icon="social-media" text="Share to Social Media" />
      <MenuItem icon="envelope" text="Email" />
    </Menu>
  );

  const helpMenu = (
    <Menu>
      <MenuItem icon="help" text="Help Center" />
      <MenuItem icon="learning" text="Tutorials" />
      <MenuItem icon="keyboard" text="Keyboard Shortcuts" />
      <MenuDivider />
      <MenuItem icon="feedback" text="Send Feedback" />
      <MenuItem icon="info-sign" text="About" />
    </Menu>
  );

  return (
    <NavigationContainer theme={theme}>
      <LeftSection theme={theme}>
        <Logo theme={theme}>
          <Icon icon="edit" size={20} />
          Design Studio
        </Logo>
        
        <Popover content={fileMenu} placement="bottom-start">
          <Button minimal icon="menu" text="File" />
        </Popover>
      </LeftSection>

      <CenterSection theme={theme}>
        <ProjectName theme={theme}>
          <span className="project-title" data-testid="project-name">{projectName}</span>
          <Button minimal icon="edit" className="edit-button" small />
        </ProjectName>
        
      </CenterSection>

      <RightSection theme={theme}>
        {/* Position and Layer Controls */}
        <ButtonGroup minimal>
          <Button 
            icon="layers" 
            minimal 
            small
            title="Position" 
          />
          <Button 
            icon="bring-data" 
            minimal 
            small
            title="Bring to front" 
          />
          <Button 
            icon="send-to-map" 
            minimal 
            small
            title="Send to back" 
          />
          <Button 
            icon="duplicate" 
            minimal 
            small
            title="Duplicate" 
          />
          <Button 
            icon="trash" 
            minimal 
            small
            title="Delete" 
          />
          <Button 
            icon="more" 
            minimal 
            small
            title="More options" 
          />
        </ButtonGroup>
        
        {/* Project Actions */}
        <ButtonGroup>
          <Popover content={shareMenu} placement="bottom-end">
            <Button 
              intent="primary" 
              icon="share" 
              text="Share"
              onClick={onShare}
              data-testid="share-button"
            />
          </Popover>
          
          <Button 
            intent="success" 
            icon="floppy-disk" 
            text="Save" 
            onClick={onSave}
            data-testid="save-button"
          />
          
          <Button 
            intent="primary"
            icon="export"
            text="Export"
            onClick={onExport}
            data-testid="export-button"
          />
          
          <Popover content={helpMenu} placement="bottom-end">
            <Button minimal icon="help" />
          </Popover>
        </ButtonGroup>
      </RightSection>
    </NavigationContainer>
  );
});

export type { TopNavigationProps };