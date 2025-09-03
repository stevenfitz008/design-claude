import React, { useState, useCallback, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { 
  Button, 
  ButtonGroup,
  Divider,
  FormGroup,
  HTMLSelect,
  NumericInput,
  Slider,
  Switch,
  Card
} from '@blueprintjs/core';
import { styled } from '@/styles/goober-setup';
import { useCanvasStore } from '@/stores/canvasStore';
import type { TextElement } from '@/types/canvas';

interface RichTextEditorProps {
  elementId: string;
  onClose?: () => void;
}

const EditorContainer = styled('div')`
  padding: 16px;
  background: var(--panel-bg);
  border-radius: 8px;
  min-width: 320px;
  max-width: 400px;
`;

const ToolbarSection = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
`;

const PropertyGrid = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
`;

const ColorSection = styled('div')`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const EffectsSection = styled('div')`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
`;

const PreviewText = styled('div')<{ 
  fontFamily: string;
  fontSize: number;
  fontWeight: string | number;
  fontStyle: string;
  color: string;
  textAlign: string;
  lineHeight: number;
  letterSpacing: number;
  textDecoration: string;
  textTransform: string;
}>`
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin: 12px 0;
  font-family: ${props => props.fontFamily};
  font-size: ${props => props.fontSize}px;
  font-weight: ${props => props.fontWeight};
  font-style: ${props => props.fontStyle};
  color: ${props => props.color};
  text-align: ${props => props.textAlign};
  line-height: ${props => props.lineHeight};
  letter-spacing: ${props => props.letterSpacing}px;
  text-decoration: ${props => props.textDecoration};
  text-transform: ${props => props.textTransform};
  background: rgba(255, 255, 255, 0.05);
`;

const fontFamilies = [
  'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New',
  'Verdana', 'Tahoma', 'Impact', 'Comic Sans MS', 'Trebuchet MS',
  'Palatino', 'Garamond', 'Bookman', 'Avant Garde', 'Arial Black'
];

const fontWeights = [
  { value: 100, label: 'Thin' },
  { value: 200, label: 'Extra Light' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Normal' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
  { value: 900, label: 'Black' }
];

const textAlignOptions = [
  { value: 'left', label: 'Left', icon: 'align-left' },
  { value: 'center', label: 'Center', icon: 'align-center' },
  { value: 'right', label: 'Right', icon: 'align-right' },
  { value: 'justify', label: 'Justify', icon: 'align-justify' }
];

const RichTextEditor: React.FC<RichTextEditorProps> = observer(({ elementId, onClose }) => {
  const { getElementById, updateElement } = useCanvasStore();
  const element = getElementById(elementId) as TextElement;
  
  const [showEffects, setShowEffects] = useState(false);
  const [textShadow, setTextShadow] = useState({
    enabled: false,
    offsetX: 2,
    offsetY: 2,
    blur: 4,
    color: '#000000'
  });
  const [textStroke, setTextStroke] = useState({
    enabled: false,
    width: 1,
    color: '#000000'
  });
  
  if (!element || element.type !== 'text') return null;

  const updateTextProperty = useCallback((property: keyof TextElement, value: any) => {
    updateElement(elementId, { [property]: value });
  }, [elementId, updateElement]);

  const toggleFormat = useCallback((format: 'bold' | 'italic' | 'underline') => {
    switch (format) {
      case 'bold':
        const currentWeight = element.fontWeight;
        const newWeight = currentWeight === 'bold' || currentWeight === 700 ? 'normal' : 'bold';
        updateTextProperty('fontWeight', newWeight);
        break;
      case 'italic':
        const newStyle = element.fontStyle === 'italic' ? 'normal' : 'italic';
        updateTextProperty('fontStyle', newStyle);
        break;
      case 'underline':
        const newDecoration = element.textDecoration === 'underline' ? 'none' : 'underline';
        updateTextProperty('textDecoration', newDecoration);
        break;
    }
  }, [element, updateTextProperty]);

  const applyTextEffect = useCallback((effectType: 'shadow' | 'stroke', enabled: boolean) => {
    if (effectType === 'shadow') {
      // This would typically be handled by a more comprehensive text effects system
      // For now, we'll store it in element metadata
      updateElement(elementId, { 
        ...element,
        textEffects: { 
          ...((element as any).textEffects || {}), 
          shadow: enabled ? textShadow : undefined 
        }
      });
    } else if (effectType === 'stroke') {
      updateElement(elementId, { 
        ...element,
        textEffects: { 
          ...((element as any).textEffects || {}), 
          stroke: enabled ? textStroke : undefined 
        }
      });
    }
  }, [elementId, element, updateElement, textShadow, textStroke]);

  const presetStyles = [
    {
      name: 'Heading',
      style: {
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'Arial',
        textAlign: 'left'
      }
    },
    {
      name: 'Subheading',
      style: {
        fontSize: 24,
        fontWeight: '600',
        fontFamily: 'Arial',
        textAlign: 'left'
      }
    },
    {
      name: 'Body Text',
      style: {
        fontSize: 16,
        fontWeight: 'normal',
        fontFamily: 'Arial',
        textAlign: 'left'
      }
    },
    {
      name: 'Caption',
      style: {
        fontSize: 12,
        fontWeight: 'normal',
        fontFamily: 'Arial',
        textAlign: 'left'
      }
    }
  ];

  const applyPreset = useCallback((preset: typeof presetStyles[0]) => {
    updateElement(elementId, preset.style);
  }, [elementId, updateElement]);

  return (
    <EditorContainer>
      <h4>Text Editor</h4>
      
      {/* Text Content */}
      <FormGroup label="Text Content" labelFor="text-content">
        <textarea
          id="text-content"
          value={element.text}
          onChange={(e) => updateTextProperty('text', e.target.value)}
          placeholder="Enter your text..."
          style={{
            width: '100%',
            minHeight: '60px',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            background: 'var(--input-bg)',
            color: 'var(--text-color)',
            resize: 'vertical'
          }}
        />
      </FormGroup>

      {/* Style Presets */}
      <FormGroup label="Style Presets">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {presetStyles.map((preset) => (
            <Button
              key={preset.name}
              text={preset.name}
              small
              onClick={() => applyPreset(preset)}
            />
          ))}
        </div>
      </FormGroup>

      <Divider />

      {/* Formatting Toolbar */}
      <FormGroup label="Format">
        <ToolbarSection>
          <ButtonGroup>
            <Button
              icon="bold"
              active={element.fontWeight === 'bold' || element.fontWeight === 700}
              onClick={() => toggleFormat('bold')}
              title="Bold"
            />
            <Button
              icon="italic"
              active={element.fontStyle === 'italic'}
              onClick={() => toggleFormat('italic')}
              title="Italic"
            />
            <Button
              icon="underline"
              active={element.textDecoration === 'underline'}
              onClick={() => toggleFormat('underline')}
              title="Underline"
            />
          </ButtonGroup>
          
          <ButtonGroup>
            {textAlignOptions.map((align) => (
              <Button
                key={align.value}
                icon={align.icon as any}
                active={element.textAlign === align.value}
                onClick={() => updateTextProperty('textAlign', align.value)}
                title={align.label}
              />
            ))}
          </ButtonGroup>
        </ToolbarSection>
      </FormGroup>

      {/* Font Properties */}
      <PropertyGrid>
        <FormGroup label="Font Family">
          <HTMLSelect
            value={element.fontFamily}
            onChange={(e) => updateTextProperty('fontFamily', e.target.value)}
            options={fontFamilies.map(font => ({ value: font, label: font }))}
            fill
          />
        </FormGroup>

        <FormGroup label="Font Size">
          <NumericInput
            value={element.fontSize}
            onValueChange={(value) => updateTextProperty('fontSize', value)}
            min={8}
            max={200}
            stepSize={1}
            fill
          />
        </FormGroup>

        <FormGroup label="Font Weight">
          <HTMLSelect
            value={element.fontWeight}
            onChange={(e) => updateTextProperty('fontWeight', e.target.value)}
            options={fontWeights.map(weight => ({ value: weight.value, label: weight.label }))}
            fill
          />
        </FormGroup>

        <FormGroup label="Line Height">
          <NumericInput
            value={element.lineHeight}
            onValueChange={(value) => updateTextProperty('lineHeight', value)}
            min={0.5}
            max={3}
            stepSize={0.1}
            fill
          />
        </FormGroup>
      </PropertyGrid>

      {/* Color */}
      <ColorSection>
        <FormGroup label="Text Color">
          <input
            type="color"
            value={element.color}
            onChange={(e) => updateTextProperty('color', e.target.value)}
            style={{ width: '40px', height: '32px', border: 'none', borderRadius: '4px' }}
          />
        </FormGroup>
        
        {element.backgroundColor && (
          <FormGroup label="Background">
            <input
              type="color"
              value={element.backgroundColor}
              onChange={(e) => updateTextProperty('backgroundColor', e.target.value)}
              style={{ width: '40px', height: '32px', border: 'none', borderRadius: '4px' }}
            />
          </FormGroup>
        )}
      </ColorSection>

      {/* Letter Spacing */}
      <FormGroup label={`Letter Spacing: ${element.letterSpacing}px`}>
        <Slider
          min={-5}
          max={20}
          stepSize={0.1}
          value={element.letterSpacing}
          onChange={(value) => updateTextProperty('letterSpacing', value)}
        />
      </FormGroup>

      {/* Text Effects */}
      <EffectsSection>
        <Switch
          checked={showEffects}
          onChange={() => setShowEffects(!showEffects)}
          label="Text Effects"
        />
        
        {showEffects && (
          <div style={{ marginTop: '16px' }}>
            <Card style={{ padding: '12px', marginBottom: '12px' }}>
              <Switch
                checked={textShadow.enabled}
                onChange={(e) => {
                  const enabled = (e.target as HTMLInputElement).checked;
                  setTextShadow(prev => ({ ...prev, enabled }));
                  applyTextEffect('shadow', enabled);
                }}
                label="Text Shadow"
              />
              
              {textShadow.enabled && (
                <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <FormGroup label="Offset X">
                    <NumericInput
                      value={textShadow.offsetX}
                      onValueChange={(value) => setTextShadow(prev => ({ ...prev, offsetX: value }))}
                      fill
                      small
                    />
                  </FormGroup>
                  <FormGroup label="Offset Y">
                    <NumericInput
                      value={textShadow.offsetY}
                      onValueChange={(value) => setTextShadow(prev => ({ ...prev, offsetY: value }))}
                      fill
                      small
                    />
                  </FormGroup>
                  <FormGroup label="Blur">
                    <NumericInput
                      value={textShadow.blur}
                      onValueChange={(value) => setTextShadow(prev => ({ ...prev, blur: value }))}
                      min={0}
                      fill
                      small
                    />
                  </FormGroup>
                  <FormGroup label="Color">
                    <input
                      type="color"
                      value={textShadow.color}
                      onChange={(e) => setTextShadow(prev => ({ ...prev, color: e.target.value }))}
                      style={{ width: '100%', height: '32px', border: 'none', borderRadius: '4px' }}
                    />
                  </FormGroup>
                </div>
              )}
            </Card>

            <Card style={{ padding: '12px' }}>
              <Switch
                checked={textStroke.enabled}
                onChange={(e) => {
                  const enabled = (e.target as HTMLInputElement).checked;
                  setTextStroke(prev => ({ ...prev, enabled }));
                  applyTextEffect('stroke', enabled);
                }}
                label="Text Stroke"
              />
              
              {textStroke.enabled && (
                <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <FormGroup label="Width">
                    <NumericInput
                      value={textStroke.width}
                      onValueChange={(value) => setTextStroke(prev => ({ ...prev, width: value }))}
                      min={0}
                      fill
                      small
                    />
                  </FormGroup>
                  <FormGroup label="Color">
                    <input
                      type="color"
                      value={textStroke.color}
                      onChange={(e) => setTextStroke(prev => ({ ...prev, color: e.target.value }))}
                      style={{ width: '100%', height: '32px', border: 'none', borderRadius: '4px' }}
                    />
                  </FormGroup>
                </div>
              )}
            </Card>
          </div>
        )}
      </EffectsSection>

      {/* Preview */}
      <FormGroup label="Preview">
        <PreviewText
          fontFamily={element.fontFamily}
          fontSize={element.fontSize}
          fontWeight={element.fontWeight}
          fontStyle={element.fontStyle}
          color={element.color}
          textAlign={element.textAlign}
          lineHeight={element.lineHeight}
          letterSpacing={element.letterSpacing}
          textDecoration={element.textDecoration}
          textTransform={element.textTransform || 'none'}
        >
          {element.text || 'Preview text...'}
        </PreviewText>
      </FormGroup>

      {/* Actions */}
      {onClose && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button onClick={onClose} intent="primary">
            Done
          </Button>
        </div>
      )}
    </EditorContainer>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;