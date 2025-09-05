import React from 'react';
import { Button, ButtonGroup, Icon, Popover, Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CanvasElement } from '@/types/canvas';

interface PhotosActionsProps {
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

export const PhotosActions: React.FC<PhotosActionsProps> = ({ hasSelection, selectedElements }) => {
  const { theme } = useTheme();
  const { updateElement, duplicateElements, deleteElements, selection } = useCanvasStore();
  
  // Check if selected elements include images/photos
  const hasImageSelection = hasSelection && selectedElements.some(el => 
    el.type === 'image' || (el.type === 'shape' && el.backgroundImage)
  );

  const handleEffects = () => {
    if (!hasImageSelection) return;
    
    // TODO: Open effects panel or apply effects
    console.log('Apply effects to selected images');
  };

  const handleFitToPage = () => {
    if (!hasImageSelection) return;
    
    selectedElements.forEach(element => {
      if (element.type === 'image' || (element.type === 'shape' && element.backgroundImage)) {
        // Scale image to fit canvas while maintaining aspect ratio
        updateElement(element.id, {
          width: 400, // Example fit size
          height: 300,
          x: 50,
          y: 50
        });
      }
    });
  };

  const handleApplyMask = () => {
    if (!hasImageSelection) return;
    
    // TODO: Open mask selection or apply default mask
    console.log('Apply mask to selected images');
  };

  const handleCrop = () => {
    if (!hasImageSelection) return;
    
    // TODO: Enter crop mode
    console.log('Enter crop mode for selected images');
  };

  const handleAnimate = () => {
    if (!hasSelection) return;
    
    // TODO: Open animation panel
    console.log('Open animation options for selected elements');
  };

  const handleRemoveBackground = () => {
    if (!hasImageSelection) return;
    
    // TODO: Apply AI background removal
    console.log('Remove background from selected images');
  };

  const effectsMenu = (
    <Menu>
      <MenuItem icon="contrast" text="Brightness & Contrast" />
      <MenuItem icon="tint" text="Saturation" />
      <MenuItem icon="eye-open" text="Blur" />
      <MenuDivider />
      <MenuItem icon="media" text="Vintage" />
      <MenuItem icon="camera" text="Black & White" />
      <MenuItem icon="style" text="Sepia" />
      <MenuDivider />
      <MenuItem icon="reset" text="Reset All Effects" />
    </Menu>
  );

  const maskMenu = (
    <Menu>
      <MenuItem icon="selection" text="Circle Mask" />
      <MenuItem icon="square" text="Square Mask" />
      <MenuItem icon="heart" text="Heart Mask" />
      <MenuItem icon="star" text="Star Mask" />
      <MenuDivider />
      <MenuItem icon="polygon-filter" text="Custom Shape" />
      <MenuItem icon="reset" text="Remove Mask" />
    </Menu>
  );

  const animationMenu = (
    <Menu>
      <MenuItem icon="play" text="Fade In" />
      <MenuItem icon="flash" text="Zoom In" />
      <MenuItem icon="move" text="Slide In" />
      <MenuItem icon="refresh" text="Rotate" />
      <MenuDivider />
      <MenuItem icon="time" text="Custom Duration" />
      <MenuItem icon="properties" text="Animation Settings" />
    </Menu>
  );

  return (
    <ActionsContainer theme={theme}>
      <ButtonGroup>
        {/* Effects */}
        <Popover content={effectsMenu} placement="bottom" disabled={!hasImageSelection}>
          <ActionButton
            theme={theme}
            icon="media"
            text="Effects"
            minimal
            small
            disabled={!hasImageSelection}
            onClick={handleEffects}
          />
        </Popover>

        {/* Fit to page */}
        <ActionButton
          theme={theme}
          icon="fullscreen"
          text="Fit to page"
          minimal
          small
          disabled={!hasImageSelection}
          onClick={handleFitToPage}
        />

        {/* Apply mask */}
        <Popover content={maskMenu} placement="bottom" disabled={!hasImageSelection}>
          <ActionButton
            theme={theme}
            icon="mask"
            text="Apply mask"
            minimal
            small
            disabled={!hasImageSelection}
            onClick={handleApplyMask}
          />
        </Popover>

        {/* Crop */}
        <ActionButton
          theme={theme}
          icon="crop"
          text="Crop"
          minimal
          small
          disabled={!hasImageSelection}
          onClick={handleCrop}
        />

        {/* Animate */}
        <Popover content={animationMenu} placement="bottom" disabled={!hasSelection}>
          <ActionButton
            theme={theme}
            icon="play"
            text="Animate"
            minimal
            small
            disabled={!hasSelection}
            onClick={handleAnimate}
          />
        </Popover>

        {/* Remove background */}
        <ActionButton
          theme={theme}
          icon="clean"
          text="Remove background"
          minimal
          small
          disabled={!hasImageSelection}
          onClick={handleRemoveBackground}
        />
      </ButtonGroup>
    </ActionsContainer>
  );
};