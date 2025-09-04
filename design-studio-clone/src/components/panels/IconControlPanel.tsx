import React, { useState } from 'react';
import { Button, Slider, InputGroup, FormGroup, NumericInput, Divider } from '@blueprintjs/core';
import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';
import type { IconElement } from '@/types/canvas';

interface IconControlPanelProps {
  selectedElements: IconElement[];
}

const PanelContainer = styled.div<{ theme: any }>`
  height: 100%;
  width: 100%;
  background-color: ${props => props.theme.colors.panelBg};
  color: ${props => props.theme.colors.textPrimary};
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px;
`;

const SectionHeader = styled.div<{ theme: any }>`
  font-weight: 600;
  font-size: 14px;
  color: ${props => props.theme.colors.textPrimary};
  margin-bottom: 12px;
  margin-top: 16px;
  &:first-child {
    margin-top: 0;
  }
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const ColorSwatchButton = styled.button<{ color: string; isActive?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background-color: ${props => props.color};
  border: 2px solid ${props => props.isActive ? '#48aff0' : '#495563'};
  cursor: pointer;
  transition: border-color 0.2s ease;
  
  &:hover {
    border-color: #48aff0;
  }
`;

const ColorPalette = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 32px);
  gap: 8px;
  margin-top: 8px;
`;

const ActionButton = styled(Button)<{ theme: any }>`
  && {
    background-color: ${props => props.theme.colors.buttonBg};
    color: ${props => props.theme.colors.textPrimary};
    border: 1px solid ${props => props.theme.colors.border};
    
    &:hover {
      background-color: ${props => props.theme.colors.buttonHover};
      border-color: #48aff0;
    }
  }
`;

const PRESET_COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff0000', '#ff6600', '#ffcc00', '#66cc00', '#00cc66', '#00ccff',
  '#0066ff', '#6600ff', '#cc00ff', '#ff0066', '#ff3366', '#ff6699'
];

export const IconControlPanel: React.FC<IconControlPanelProps> = ({ selectedElements }) => {
  const { theme } = useTheme();
  const { updateElement, duplicateElements, deleteElements, moveToFront, moveToBack } = useCanvasStore();
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (selectedElements.length === 0) {
    return (
      <PanelContainer theme={theme}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '200px',
          color: theme.colors.textSecondary,
          fontSize: '14px'
        }}>
          Select an icon to edit properties
        </div>
      </PanelContainer>
    );
  }

  const isSingleSelection = selectedElements.length === 1;
  const element = selectedElements[0];
  
  // Get common values for multi-selection
  const commonWidth = isSingleSelection ? element.width : selectedElements.every(el => el.width === element.width) ? element.width : '';
  const commonHeight = isSingleSelection ? element.height : selectedElements.every(el => el.height === element.height) ? element.height : '';
  const commonOpacity = isSingleSelection ? element.opacity : selectedElements.every(el => el.opacity === element.opacity) ? element.opacity : '';
  const commonRotation = isSingleSelection ? (element.rotation || 0) : selectedElements.every(el => (el.rotation || 0) === (element.rotation || 0)) ? (element.rotation || 0) : '';
  const commonFill = isSingleSelection ? element.fill : selectedElements.every(el => el.fill === element.fill) ? element.fill : '';

  const handlePropertyUpdate = (updates: Partial<IconElement>) => {
    selectedElements.forEach(el => {
      updateElement(el.id, updates);
    });
  };

  const handleColorChange = (color: string) => {
    handlePropertyUpdate({ fill: color });
  };

  const handleDuplicate = () => {
    const ids = selectedElements.map(el => el.id);
    duplicateElements(ids);
  };

  const handleDelete = () => {
    const ids = selectedElements.map(el => el.id);
    deleteElements(ids);
  };

  const handleBringToFront = () => {
    selectedElements.forEach(el => moveToFront(el.id));
  };

  const handleSendToBack = () => {
    selectedElements.forEach(el => moveToBack(el.id));
  };

  return (
    <PanelContainer theme={theme}>
      {/* Selection Info */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
          Icon Properties
        </div>
        <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>
          {selectedElements.length} icon{selectedElements.length > 1 ? 's' : ''} selected
        </div>
      </div>

      {/* Size Controls */}
      <SectionHeader theme={theme}>Size</SectionHeader>
      <ControlRow>
        <FormGroup label="Width" labelFor="icon-width" style={{ margin: 0, flex: 1 }}>
          <NumericInput
            id="icon-width"
            value={typeof commonWidth === 'number' ? commonWidth : ''}
            onValueChange={(value) => {
              if (typeof value === 'number' && value > 0) {
                handlePropertyUpdate({ width: value });
              }
            }}
            min={1}
            max={1000}
            stepSize={1}
            minorStepSize={1}
            majorStepSize={10}
            placeholder={typeof commonWidth === 'number' ? undefined : 'Mixed'}
            fill
          />
        </FormGroup>
        
        <FormGroup label="Height" labelFor="icon-height" style={{ margin: 0, flex: 1 }}>
          <NumericInput
            id="icon-height"
            value={typeof commonHeight === 'number' ? commonHeight : ''}
            onValueChange={(value) => {
              if (typeof value === 'number' && value > 0) {
                handlePropertyUpdate({ height: value });
              }
            }}
            min={1}
            max={1000}
            stepSize={1}
            minorStepSize={1}
            majorStepSize={10}
            placeholder={typeof commonHeight === 'number' ? undefined : 'Mixed'}
            fill
          />
        </FormGroup>
      </ControlRow>

      {/* Position Controls (only for single selection) */}
      {isSingleSelection && (
        <>
          <SectionHeader theme={theme}>Position</SectionHeader>
          <ControlRow>
            <FormGroup label="X" labelFor="icon-x" style={{ margin: 0, flex: 1 }}>
              <NumericInput
                id="icon-x"
                value={Math.round(element.x)}
                onValueChange={(value) => {
                  if (typeof value === 'number') {
                    handlePropertyUpdate({ x: value });
                  }
                }}
                stepSize={1}
                minorStepSize={1}
                majorStepSize={10}
                fill
              />
            </FormGroup>
            
            <FormGroup label="Y" labelFor="icon-y" style={{ margin: 0, flex: 1 }}>
              <NumericInput
                id="icon-y"
                value={Math.round(element.y)}
                onValueChange={(value) => {
                  if (typeof value === 'number') {
                    handlePropertyUpdate({ y: value });
                  }
                }}
                stepSize={1}
                minorStepSize={1}
                majorStepSize={10}
                fill
              />
            </FormGroup>
          </ControlRow>
        </>
      )}

      {/* Transform Controls */}
      <SectionHeader theme={theme}>Transform</SectionHeader>
      
      {/* Rotation */}
      <FormGroup label={`Rotation: ${typeof commonRotation === 'number' ? Math.round(commonRotation) : 'Mixed'}°`}>
        <Slider
          min={-180}
          max={180}
          stepSize={1}
          labelStepSize={45}
          value={typeof commonRotation === 'number' ? commonRotation : 0}
          onChange={(value) => handlePropertyUpdate({ rotation: value })}
          showTrackFill={false}
          disabled={typeof commonRotation !== 'number'}
        />
      </FormGroup>

      {/* Opacity */}
      <FormGroup label={`Opacity: ${typeof commonOpacity === 'number' ? Math.round(commonOpacity * 100) : 'Mixed'}%`}>
        <Slider
          min={0}
          max={1}
          stepSize={0.01}
          labelStepSize={0.25}
          labelRenderer={(value) => `${Math.round(value * 100)}%`}
          value={typeof commonOpacity === 'number' ? commonOpacity : 1}
          onChange={(value) => handlePropertyUpdate({ opacity: value })}
          showTrackFill={false}
          disabled={typeof commonOpacity !== 'number'}
        />
      </FormGroup>

      {/* Color Controls */}
      <SectionHeader theme={theme}>Color</SectionHeader>
      
      <FormGroup label="Fill Color">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ColorSwatchButton
            color={typeof commonFill === 'string' ? commonFill : '#000000'}
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Click to change color"
          />
          <InputGroup
            value={typeof commonFill === 'string' ? commonFill : ''}
            onChange={(e) => handleColorChange(e.target.value)}
            placeholder={typeof commonFill === 'string' ? undefined : 'Mixed colors'}
            style={{ flex: 1 }}
          />
        </div>
        
        {showColorPicker && (
          <ColorPalette>
            {PRESET_COLORS.map((color) => (
              <ColorSwatchButton
                key={color}
                color={color}
                isActive={commonFill === color}
                onClick={() => {
                  handleColorChange(color);
                  setShowColorPicker(false);
                }}
                title={color}
              />
            ))}
          </ColorPalette>
        )}
      </FormGroup>

      <Divider style={{ margin: '20px 0' }} />

      {/* Action Buttons */}
      <SectionHeader theme={theme}>Actions</SectionHeader>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <ControlRow>
          <ActionButton
            theme={theme}
            icon="duplicate"
            onClick={handleDuplicate}
            style={{ flex: 1 }}
            title={`Duplicate ${selectedElements.length} icon${selectedElements.length > 1 ? 's' : ''}`}
          >
            Duplicate
          </ActionButton>
          
          <ActionButton
            theme={theme}
            icon="trash"
            onClick={handleDelete}
            style={{ flex: 1 }}
            intent="danger"
            title={`Delete ${selectedElements.length} icon${selectedElements.length > 1 ? 's' : ''}`}
          >
            Delete
          </ActionButton>
        </ControlRow>

        <ControlRow>
          <ActionButton
            theme={theme}
            icon="bring-data"
            onClick={handleBringToFront}
            style={{ flex: 1 }}
            title="Bring to Front"
          >
            To Front
          </ActionButton>
          
          <ActionButton
            theme={theme}
            icon="send-to-back"
            onClick={handleSendToBack}
            style={{ flex: 1 }}
            title="Send to Back"
          >
            To Back
          </ActionButton>
        </ControlRow>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div style={{ 
        marginTop: '24px', 
        padding: '12px', 
        backgroundColor: 'rgba(0, 0, 0, 0.2)', 
        borderRadius: '4px',
        fontSize: '12px',
        color: theme.colors.textSecondary 
      }}>
        <div style={{ fontWeight: '600', marginBottom: '8px' }}>Keyboard Shortcuts:</div>
        <div>Ctrl+C / Cmd+C - Copy</div>
        <div>Ctrl+V / Cmd+V - Paste</div>
        <div>Ctrl+D / Cmd+D - Duplicate</div>
        <div>Delete / Backspace - Delete</div>
        <div>Arrow Keys - Move</div>
        <div>Shift+Arrow - Move 10px</div>
      </div>
    </PanelContainer>
  );
};

IconControlPanel.displayName = 'IconControlPanel';