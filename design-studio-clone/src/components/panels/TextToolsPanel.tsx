import React, { useState, useMemo } from 'react';
import { Button, ButtonGroup, HTMLSelect, NumericInput, Slider, FormGroup, Label, ColorPicker, Divider } from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvas } from '@/hooks/useCanvas';
import { useCanvasStore } from '@/stores/canvasStore';

// Google Fonts list (popular ones for design tools)
const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Source Sans Pro',
  'Oswald',
  'Raleway',
  'Poppins',
  'Nunito',
  'Playfair Display',
  'Merriweather',
  'PT Sans',
  'Ubuntu',
  'Lora',
  'Fira Sans',
  'Work Sans',
  'Crimson Text',
  'Dancing Script',
  'Pacifico'
];

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

const TEXT_ALIGNS = [
  { value: 'left', label: 'Left', icon: 'align-left' },
  { value: 'center', label: 'Center', icon: 'align-center' },
  { value: 'right', label: 'Right', icon: 'align-right' },
  { value: 'justify', label: 'Justify', icon: 'align-justify' }
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
  { value: 'line-through', label: 'Strike' }
];

export const TextToolsPanel: React.FC = () => {
  const { theme } = useTheme();
  const { addTextElement } = useCanvas();
  const { selection, updateElement, elements } = useCanvasStore();
  
  // Typography state
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState(18);
  const [fontWeight, setFontWeight] = useState('400');
  const [textColor, setTextColor] = useState('#000000');
  const [textAlign, setTextAlign] = useState('left');
  const [lineHeight, setLineHeight] = useState(1.2);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [textTransform, setTextTransform] = useState('none');
  const [textDecoration, setTextDecoration] = useState('none');

  // Get selected text element if any
  const selectedTextElement = useMemo(() => {
    if (selection.length === 1) {
      const element = elements.find(el => el.id === selection[0]);
      return element?.type === 'text' ? element : null;
    }
    return null;
  }, [selection, elements]);

  // Load Google Font dynamically
  const loadGoogleFont = (fontName: string) => {
    if (!document.querySelector(`link[href*="${fontName.replace(' ', '+')}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
      document.head.appendChild(link);
    }
  };

  const handleAddHeading = () => {
    loadGoogleFont(fontFamily);
    addTextElement(50, 50, 'Add a heading');
    // Update with current typography settings
    setTimeout(() => {
      const elements = useCanvasStore.getState().elements;
      const newElement = elements[elements.length - 1];
      if (newElement) {
        updateElement(newElement.id, {
          fontFamily: `${fontFamily}, Arial, sans-serif`,
          fontSize: Math.max(fontSize, 24),
          fontWeight: fontWeight || '600',
          color: textColor,
          textAlign: textAlign as any,
          lineHeight,
          letterSpacing,
          textTransform: textTransform as any,
          textDecoration: textDecoration as any
        });
      }
    }, 10);
  };

  const handleAddSubheading = () => {
    loadGoogleFont(fontFamily);
    addTextElement(50, 100, 'Add a subheading');
    setTimeout(() => {
      const elements = useCanvasStore.getState().elements;
      const newElement = elements[elements.length - 1];
      if (newElement) {
        updateElement(newElement.id, {
          fontFamily: `${fontFamily}, Arial, sans-serif`,
          fontSize: Math.max(fontSize, 20),
          fontWeight: fontWeight || '500',
          color: textColor,
          textAlign: textAlign as any,
          lineHeight,
          letterSpacing,
          textTransform: textTransform as any,
          textDecoration: textDecoration as any
        });
      }
    }, 10);
  };

  const handleAddBodyText = () => {
    loadGoogleFont(fontFamily);
    addTextElement(50, 150, 'Add some body text');
    setTimeout(() => {
      const elements = useCanvasStore.getState().elements;
      const newElement = elements[elements.length - 1];
      if (newElement) {
        updateElement(newElement.id, {
          fontFamily: `${fontFamily}, Arial, sans-serif`,
          fontSize,
          fontWeight,
          color: textColor,
          textAlign: textAlign as any,
          lineHeight,
          letterSpacing,
          textTransform: textTransform as any,
          textDecoration: textDecoration as any
        });
      }
    }, 10);
  };

  const handleTypographyChange = (property: string, value: any) => {
    if (selectedTextElement) {
      updateElement(selectedTextElement.id, { [property]: value });
    }
    
    // Update global settings
    switch (property) {
      case 'fontFamily':
        loadGoogleFont(value);
        setFontFamily(value);
        break;
      case 'fontSize':
        setFontSize(value);
        break;
      case 'fontWeight':
        setFontWeight(value);
        break;
      case 'color':
        setTextColor(value);
        break;
      case 'textAlign':
        setTextAlign(value);
        break;
      case 'lineHeight':
        setLineHeight(value);
        break;
      case 'letterSpacing':
        setLetterSpacing(value);
        break;
      case 'textTransform':
        setTextTransform(value);
        break;
      case 'textDecoration':
        setTextDecoration(value);
        break;
    }
  };

  return (
    <div style={{
      height: '100%',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      overflow: 'auto'
    }}>
      {/* Quick Text Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '8px'
      }}>
        <Button
          onClick={handleAddHeading}
          large
          style={{
            justifyContent: 'flex-start',
            textAlign: 'left',
            padding: '12px',
            height: 'auto'
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '2px'
          }}>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>Add a heading</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>Big text for titles</div>
          </div>
        </Button>

        <Button
          onClick={handleAddSubheading}
          large
          style={{
            justifyContent: 'flex-start',
            textAlign: 'left',
            padding: '12px',
            height: 'auto'
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '2px'
          }}>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>Add a subheading</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>Medium text for sections</div>
          </div>
        </Button>

        <Button
          onClick={handleAddBodyText}
          large
          style={{
            justifyContent: 'flex-start',
            textAlign: 'left',
            padding: '12px',
            height: 'auto'
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '2px'
          }}>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>Add body text</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>Regular text for content</div>
          </div>
        </Button>
      </div>

      <Divider />

      {/* Typography Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors?.textPrimary || '#f5f8fa' }}>
          Typography
          {selectedTextElement && (
            <span style={{ fontSize: '11px', fontWeight: 400, opacity: 0.7, marginLeft: '8px' }}>
              (Editing selected text)
            </span>
          )}
        </div>

        {/* Font Family */}
        <FormGroup label="Font Family" labelFor="font-family">
          <HTMLSelect
            id="font-family"
            value={selectedTextElement?.fontFamily?.split(',')[0] || fontFamily}
            onChange={(e) => handleTypographyChange('fontFamily', e.target.value)}
            fill
          >
            {GOOGLE_FONTS.map(font => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </HTMLSelect>
        </FormGroup>

        {/* Font Size & Weight */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <FormGroup label="Size">
            <NumericInput
              value={selectedTextElement?.fontSize || fontSize}
              onValueChange={(value) => handleTypographyChange('fontSize', value)}
              min={8}
              max={200}
              stepSize={1}
              fill
            />
          </FormGroup>
          
          <FormGroup label="Weight">
            <HTMLSelect
              value={selectedTextElement?.fontWeight || fontWeight}
              onChange={(e) => handleTypographyChange('fontWeight', e.target.value)}
              fill
            >
              {FONT_WEIGHTS.map(weight => (
                <option key={weight.value} value={weight.value}>
                  {weight.label}
                </option>
              ))}
            </HTMLSelect>
          </FormGroup>
        </div>

        {/* Color */}
        <FormGroup label="Color">
          <input
            type="color"
            value={selectedTextElement?.color || textColor}
            onChange={(e) => handleTypographyChange('color', e.target.value)}
            style={{
              width: '100%',
              height: '30px',
              border: '1px solid #495563',
              borderRadius: '3px',
              backgroundColor: 'transparent',
              cursor: 'pointer'
            }}
          />
        </FormGroup>

        {/* Text Align */}
        <FormGroup label="Alignment">
          <ButtonGroup fill>
            {TEXT_ALIGNS.map(align => (
              <Button
                key={align.value}
                icon={align.icon as any}
                active={(selectedTextElement?.textAlign || textAlign) === align.value}
                onClick={() => handleTypographyChange('textAlign', align.value)}
                title={align.label}
              />
            ))}
          </ButtonGroup>
        </FormGroup>

        {/* Line Height */}
        <FormGroup label="Line Height">
          <div style={{ padding: '0 8px' }}>
            <Slider
              min={0.8}
              max={3.0}
              stepSize={0.1}
              labelStepSize={0.4}
              value={selectedTextElement?.lineHeight || lineHeight}
              onChange={(value) => handleTypographyChange('lineHeight', value)}
              showTrackFill={false}
            />
          </div>
        </FormGroup>

        {/* Letter Spacing */}
        <FormGroup label="Letter Spacing">
          <div style={{ padding: '0 8px' }}>
            <Slider
              min={-5}
              max={10}
              stepSize={0.5}
              labelStepSize={5}
              value={selectedTextElement?.letterSpacing || letterSpacing}
              onChange={(value) => handleTypographyChange('letterSpacing', value)}
              showTrackFill={false}
            />
          </div>
        </FormGroup>

        {/* Text Transform */}
        <FormGroup label="Transform">
          <HTMLSelect
            value={selectedTextElement?.textTransform || textTransform}
            onChange={(e) => handleTypographyChange('textTransform', e.target.value)}
            fill
          >
            {TEXT_TRANSFORMS.map(transform => (
              <option key={transform.value} value={transform.value}>
                {transform.label}
              </option>
            ))}
          </HTMLSelect>
        </FormGroup>

        {/* Text Decoration */}
        <FormGroup label="Decoration">
          <HTMLSelect
            value={selectedTextElement?.textDecoration || textDecoration}
            onChange={(e) => handleTypographyChange('textDecoration', e.target.value)}
            fill
          >
            {TEXT_DECORATIONS.map(decoration => (
              <option key={decoration.value} value={decoration.value}>
                {decoration.label}
              </option>
            ))}
          </HTMLSelect>
        </FormGroup>
      </div>
    </div>
  );
};

TextToolsPanel.displayName = 'TextToolsPanel';