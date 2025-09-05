import React from 'react';
import { Button, ButtonGroup, Icon, Popover, Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CanvasElement } from '@/types/canvas';

interface ShapesActionsProps {
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

const ColorIndicator = styled.div<{ color: string; theme: any }>`
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background-color: ${props => props.color};
  border: 1px solid ${props => props.theme.colors.borderColor};
  margin-right: 4px;
`;

export const ShapesActions: React.FC<ShapesActionsProps> = ({ hasSelection, selectedElements }) => {
  const { theme } = useTheme();
  const { updateElement, duplicateElements, deleteElements } = useCanvasStore();
  
  // Check if selected elements include shapes or icons
  const hasShapeSelection = hasSelection && selectedElements.some(el => 
    el.type === 'shape' || el.type === 'icon'
  );
  const shapeElement = selectedElements.find(el => el.type === 'shape' || el.type === 'icon');

  const handleFillColor = (color: string) => {
    if (!hasShapeSelection) return;
    
    selectedElements.forEach(element => {
      if (element.type === 'shape' || element.type === 'icon') {
        updateElement(element.id, { fill: color });
      }
    });
  };

  const handleStrokeColor = (color: string) => {
    if (!hasShapeSelection) return;
    
    selectedElements.forEach(element => {
      if (element.type === 'shape' || element.type === 'icon') {
        updateElement(element.id, { stroke: color });
      }
    });
  };

  const handleStrokeWidth = (width: number) => {
    if (!hasShapeSelection) return;
    
    selectedElements.forEach(element => {
      if (element.type === 'shape' || element.type === 'icon') {
        updateElement(element.id, { strokeWidth: width });
      }
    });
  };

  const handleCornerRadius = (radius: number) => {
    if (!hasShapeSelection) return;
    
    selectedElements.forEach(element => {
      if (element.type === 'shape' || element.type === 'icon') {
        updateElement(element.id, { cornerRadius: radius });
      }
    });
  };

  const handleOpacity = (opacity: number) => {
    if (!hasShapeSelection) return;
    
    selectedElements.forEach(element => {
      if (element.type === 'shape' || element.type === 'icon') {
        updateElement(element.id, { opacity: opacity / 100 });
      }
    });
  };

  const fillColorMenu = (
    <Menu>
      <MenuItem 
        icon={<ColorIndicator color="#48aff0" theme={theme} />} 
        text="Blue" 
        onClick={() => handleFillColor('#48aff0')} 
      />
      <MenuItem 
        icon={<ColorIndicator color="#db3737" theme={theme} />} 
        text="Red" 
        onClick={() => handleFillColor('#db3737')} 
      />
      <MenuItem 
        icon={<ColorIndicator color="#15b371" theme={theme} />} 
        text="Green" 
        onClick={() => handleFillColor('#15b371')} 
      />
      <MenuItem 
        icon={<ColorIndicator color="#d9822b" theme={theme} />} 
        text="Orange" 
        onClick={() => handleFillColor('#d9822b')} 
      />
      <MenuItem 
        icon={<ColorIndicator color="#8b2fc2" theme={theme} />} 
        text="Purple" 
        onClick={() => handleFillColor('#8b2fc2')} 
      />
      <MenuDivider />
      <MenuItem 
        icon={<ColorIndicator color="#000000" theme={theme} />} 
        text="Black" 
        onClick={() => handleFillColor('#000000')} 
      />
      <MenuItem 
        icon={<ColorIndicator color="#ffffff" theme={theme} />} 
        text="White" 
        onClick={() => handleFillColor('#ffffff')} 
      />
      <MenuItem 
        icon={<ColorIndicator color="transparent" theme={theme} />} 
        text="Transparent" 
        onClick={() => handleFillColor('transparent')} 
      />
      <MenuDivider />
      <MenuItem icon="style" text="Custom Color..." />
    </Menu>
  );

  const strokeMenu = (
    <Menu>
      <MenuItem text="No Stroke" onClick={() => handleStrokeWidth(0)} />
      <MenuItem text="1px" onClick={() => handleStrokeWidth(1)} />
      <MenuItem text="2px" onClick={() => handleStrokeWidth(2)} />
      <MenuItem text="3px" onClick={() => handleStrokeWidth(3)} />
      <MenuItem text="5px" onClick={() => handleStrokeWidth(5)} />
      <MenuDivider />
      <MenuItem icon="tint" text="Stroke Color" />
    </Menu>
  );

  const borderRadiusMenu = (
    <Menu>
      <MenuItem text="No Radius" onClick={() => handleCornerRadius(0)} />
      <MenuItem text="Small (4px)" onClick={() => handleCornerRadius(4)} />
      <MenuItem text="Medium (8px)" onClick={() => handleCornerRadius(8)} />
      <MenuItem text="Large (16px)" onClick={() => handleCornerRadius(16)} />
      <MenuItem text="Extra Large (24px)" onClick={() => handleCornerRadius(24)} />
      <MenuDivider />
      <MenuItem text="Fully Rounded" onClick={() => handleCornerRadius(999)} />
    </Menu>
  );

  const getCurrentFillColor = (): string => {
    if (!shapeElement) return '#48aff0';
    return (shapeElement as any).fill || '#48aff0';
  };

  const getCurrentStrokeWidth = (): number => {
    if (!shapeElement) return 0;
    return (shapeElement as any).strokeWidth || 0;
  };

  return (
    <ActionsContainer theme={theme}>
      <ButtonGroup>
        {/* Fill Color */}
        <Popover content={fillColorMenu} placement="bottom" disabled={!hasShapeSelection}>
          <ActionButton
            theme={theme}
            icon={<ColorIndicator color={getCurrentFillColor()} theme={theme} />}
            text="Fill"
            minimal
            small
            disabled={!hasShapeSelection}
            rightIcon="caret-down"
          />
        </Popover>

        {/* Stroke */}
        <Popover content={strokeMenu} placement="bottom" disabled={!hasShapeSelection}>
          <ActionButton
            theme={theme}
            icon="path-search"
            text={`Stroke ${getCurrentStrokeWidth()}px`}
            minimal
            small
            disabled={!hasShapeSelection}
            rightIcon="caret-down"
          />
        </Popover>

        {/* Corner Radius */}
        <Popover content={borderRadiusMenu} placement="bottom" disabled={!hasShapeSelection}>
          <ActionButton
            theme={theme}
            icon="layout-auto"
            text="Corners"
            minimal
            small
            disabled={!hasShapeSelection}
            rightIcon="caret-down"
          />
        </Popover>

        {/* Opacity */}
        <ActionButton
          theme={theme}
          icon="contrast"
          text="Opacity"
          minimal
          small
          disabled={!hasShapeSelection}
          onClick={() => handleOpacity(50)}
        />

        {/* Transform Actions */}
        <ButtonGroup>
          <ActionButton
            theme={theme}
            icon="duplicate"
            minimal
            small
            disabled={!hasSelection}
            onClick={() => duplicateElements(selectedElements.map(el => el.id))}
            title="Duplicate"
          />
          <ActionButton
            theme={theme}
            icon="trash"
            minimal
            small
            disabled={!hasSelection}
            onClick={() => deleteElements(selectedElements.map(el => el.id))}
            title="Delete"
          />
        </ButtonGroup>
      </ButtonGroup>
    </ActionsContainer>
  );
};