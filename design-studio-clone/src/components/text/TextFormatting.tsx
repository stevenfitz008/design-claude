import React, { useState, useMemo } from 'react';
import { FormGroup, Label, HTMLSelect, NumericInput, Slider, ButtonGroup, Button, Divider } from '@blueprintjs/core';
import { styled } from 'goober';
import { FontPicker } from './FontPicker';
import { ColorPicker } from './ColorPicker';
import { TextEffects, DEFAULT_EFFECTS, type TextEffectsState } from './TextEffects';
import { useCanvasStore } from '@/stores/canvasStore';
import { useTextEditor } from '@/hooks/useTextEditor';
import type { TextElement } from '@/types/canvas';

const FormattingContainer = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #2f343c;
  color: #f5f8fa;
  border-radius: 6px;
  max-height: 80vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #2f343c;
  }

  &::-webkit-scrollbar-thumb {
    background: #495563;
    border-radius: 3px;
  }
`;

const SectionHeader = styled('div')`
  font-size: 13px;
  font-weight: 600;
  color: #f5f8fa;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ControlRow = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: end;
`;

const ControlGroup = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SliderContainer = styled('div')`
  padding: 0 8px;
`;

const AlignmentButtons = styled(ButtonGroup)`
  .bp4-button {
    font-size: 12px;
    min-width: auto;
    
    &.bp4-active {
      background: #48aff0;
      color: white;
    }
  }
`;

const FONT_WEIGHTS = [
  { value: '100', label: 'Thin' },
  { value: '200', label: 'Extra Light' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' }
];

const TEXT_TRANSFORMS = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'capitalize', label: 'Capitalize' }
];

const TEXT_DECORATIONS = [
  { value: 'none', label: 'None' },
  { value: 'underline', label: 'Underline' },
  { value: 'line-through', label: 'Strike Through' }
];

interface TextFormattingProps {
  elementId?: string;
  onClose?: () => void;
}

export const TextFormatting: React.FC<TextFormattingProps> = ({
  elementId,
  onClose
}) => {
  const { elements, updateElement, selection } = useCanvasStore();
  const { updateTextStyle, applyStyleToSelection } = useTextEditor();
  const [effects, setEffects] = useState<TextEffectsState>(DEFAULT_EFFECTS);

  // Get the text element to edit
  const textElement = useMemo(() => {
    if (elementId) {
      const element = elements.find(el => el.id === elementId);
      return element?.type === 'text' ? (element as TextElement) : null;
    } else if (selection.length === 1) {
      const element = elements.find(el => el.id === selection[0]);
      return element?.type === 'text' ? (element as TextElement) : null;
    }
    return null;
  }, [elementId, elements, selection]);

  // Update text property
  const updateProperty = (property: keyof TextElement, value: any) => {
    if (textElement) {
      updateTextStyle(textElement.id, { [property]: value });
    } else if (selection.length > 0) {
      applyStyleToSelection({ [property]: value });
    }
  };

  // Handle font change
  const handleFontChange = (fontFamily: string) => {
    updateProperty('fontFamily', fontFamily);
  };

  // Handle effects change
  const handleEffectsChange = (newEffects: TextEffectsState) => {
    setEffects(newEffects);
    
    // Apply effects to text element
    const updates: Partial<TextElement> = {
      color: newEffects.fill,
    };
    
    if (textElement) {
      updateTextStyle(textElement.id, updates);
    } else if (selection.length > 0) {
      applyStyleToSelection(updates);
    }
  };

  if (!textElement && selection.length === 0) {
    return (
      <FormattingContainer>
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: '#8a9ba8'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
            T
          </div>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>
            No Text Selected
          </div>
          <div style={{ fontSize: '14px', lineHeight: 1.4 }}>
            Select a text element to customize its formatting
          </div>
        </div>
      </FormattingContainer>
    );
  }

  return (
    <FormattingContainer>
      {/* Font Selection */}
      <div>
        <SectionHeader>Font</SectionHeader>
        <FontPicker
          selectedFont={textElement?.fontFamily?.split(',')[0] || 'Inter'}
          onFontSelect={handleFontChange}
          showPreview={true}
          maxHeight={200}
        />
      </div>

      <Divider />

      {/* Typography Settings */}
      <div>
        <SectionHeader>Typography</SectionHeader>
        
        <ControlRow>
          <ControlGroup>
            <Label>Size</Label>
            <NumericInput
              value={textElement?.fontSize || 16}
              onValueChange={(value) => updateProperty('fontSize', value)}
              min={8}
              max={200}
              stepSize={1}
              fill
            />
          </ControlGroup>
          
          <ControlGroup>
            <Label>Weight</Label>
            <HTMLSelect
              value={textElement?.fontWeight || '400'}
              onChange={(e) => updateProperty('fontWeight', e.target.value)}
              fill
            >
              {FONT_WEIGHTS.map(weight => (
                <option key={weight.value} value={weight.value}>
                  {weight.label}
                </option>
              ))}
            </HTMLSelect>
          </ControlGroup>
        </ControlRow>

        <ControlRow>
          <ControlGroup>
            <Label>Transform</Label>
            <HTMLSelect
              value={textElement?.textTransform || 'none'}
              onChange={(e) => updateProperty('textTransform', e.target.value)}
              fill
            >
              {TEXT_TRANSFORMS.map(transform => (
                <option key={transform.value} value={transform.value}>
                  {transform.label}
                </option>
              ))}
            </HTMLSelect>
          </ControlGroup>
          
          <ControlGroup>
            <Label>Decoration</Label>
            <HTMLSelect
              value={textElement?.textDecoration || 'none'}
              onChange={(e) => updateProperty('textDecoration', e.target.value)}
              fill
            >
              {TEXT_DECORATIONS.map(decoration => (
                <option key={decoration.value} value={decoration.value}>
                  {decoration.label}
                </option>
              ))}
            </HTMLSelect>
          </ControlGroup>
        </ControlRow>
      </div>

      <Divider />

      {/* Alignment */}
      <div>
        <SectionHeader>Alignment</SectionHeader>
        <AlignmentButtons fill>
          <Button
            icon="align-left"
            active={textElement?.textAlign === 'left'}
            onClick={() => updateProperty('textAlign', 'left')}
            title="Left"
          />
          <Button
            icon="align-center"
            active={textElement?.textAlign === 'center'}
            onClick={() => updateProperty('textAlign', 'center')}
            title="Center"
          />
          <Button
            icon="align-right"
            active={textElement?.textAlign === 'right'}
            onClick={() => updateProperty('textAlign', 'right')}
            title="Right"
          />
          <Button
            icon="align-justify"
            active={textElement?.textAlign === 'justify'}
            onClick={() => updateProperty('textAlign', 'justify')}
            title="Justify"
          />
        </AlignmentButtons>
      </div>

      <Divider />

      {/* Spacing */}
      <div>
        <SectionHeader>Spacing</SectionHeader>
        
        <ControlGroup>
          <Label>Line Height: {textElement?.lineHeight?.toFixed(1) || '1.4'}</Label>
          <SliderContainer>
            <Slider
              min={0.8}
              max={3.0}
              stepSize={0.1}
              value={textElement?.lineHeight || 1.4}
              onChange={(value) => updateProperty('lineHeight', value)}
              showTrackFill={false}
            />
          </SliderContainer>
        </ControlGroup>

        <ControlGroup>
          <Label>Letter Spacing: {textElement?.letterSpacing?.toFixed(1) || '0.0'}px</Label>
          <SliderContainer>
            <Slider
              min={-5}
              max={10}
              stepSize={0.1}
              value={textElement?.letterSpacing || 0}
              onChange={(value) => updateProperty('letterSpacing', value)}
              showTrackFill={false}
            />
          </SliderContainer>
        </ControlGroup>
      </div>

      <Divider />

      {/* Color */}
      <div>
        <SectionHeader>Color</SectionHeader>
        <ControlRow>
          <Label>Text Color</Label>
          <ColorPicker
            color={textElement?.color || '#000000'}
            onChange={(color) => updateProperty('color', color)}
            showGradients={true}
          />
        </ControlRow>
      </div>

      <Divider />

      {/* Advanced Effects */}
      <div>
        <SectionHeader>Effects</SectionHeader>
        <TextEffects
          effects={effects}
          onChange={handleEffectsChange}
          showPreview={true}
        />
      </div>
    </FormattingContainer>
  );
};

TextFormatting.displayName = 'TextFormatting';