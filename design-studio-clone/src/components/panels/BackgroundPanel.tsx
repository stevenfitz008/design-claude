import React, { useState } from 'react';
import { Button, ButtonGroup, FormGroup, NumericInput, Slider, Divider } from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';

// Background types
const BACKGROUND_TYPES = [
  { value: 'solid', label: 'Solid Color', icon: 'tint' },
  { value: 'gradient', label: 'Gradient', icon: 'circle' },
  { value: 'image', label: 'Image', icon: 'media' }
];

// Gradient presets
const GRADIENT_PRESETS = [
  {
    id: 'sunset',
    name: 'Sunset',
    gradient: 'linear-gradient(45deg, #ff6b6b, #feca57, #ff9ff3)',
    colors: ['#ff6b6b', '#feca57', '#ff9ff3'],
    angle: 45
  },
  {
    id: 'ocean',
    name: 'Ocean',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    colors: ['#667eea', '#764ba2'],
    angle: 135
  },
  {
    id: 'forest',
    name: 'Forest',
    gradient: 'linear-gradient(90deg, #56ab2f, #a8e6cf)',
    colors: ['#56ab2f', '#a8e6cf'],
    angle: 90
  },
  {
    id: 'purple',
    name: 'Purple',
    gradient: 'linear-gradient(180deg, #667eea, #764ba2)',
    colors: ['#667eea', '#764ba2'],
    angle: 180
  },
  {
    id: 'fire',
    name: 'Fire',
    gradient: 'linear-gradient(225deg, #ff416c, #ff4b2b)',
    colors: ['#ff416c', '#ff4b2b'],
    angle: 225
  },
  {
    id: 'sky',
    name: 'Sky',
    gradient: 'linear-gradient(270deg, #74b9ff, #0984e3)',
    colors: ['#74b9ff', '#0984e3'],
    angle: 270
  },
  {
    id: 'mint',
    name: 'Mint',
    gradient: 'linear-gradient(315deg, #00b894, #00cec9)',
    colors: ['#00b894', '#00cec9'],
    angle: 315
  },
  {
    id: 'coral',
    name: 'Coral',
    gradient: 'linear-gradient(0deg, #fd79a8, #fdcb6e)',
    colors: ['#fd79a8', '#fdcb6e'],
    angle: 0
  }
];

// Pattern/texture backgrounds
const PATTERN_BACKGROUNDS = [
  {
    id: 'dots',
    name: 'Dots',
    pattern: 'radial-gradient(circle, #000000 1px, transparent 1px)',
    size: '20px 20px'
  },
  {
    id: 'stripes',
    name: 'Stripes',
    pattern: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000000 10px, #000000 20px)',
    size: '20px 20px'
  },
  {
    id: 'grid',
    name: 'Grid',
    pattern: 'linear-gradient(to right, #000000 1px, transparent 1px), linear-gradient(to bottom, #000000 1px, transparent 1px)',
    size: '20px 20px'
  },
  {
    id: 'diagonal',
    name: 'Diagonal',
    pattern: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #000000 5px, #000000 10px)',
    size: '10px 10px'
  }
];

export const BackgroundPanel: React.FC = () => {
  const { theme } = useTheme();
  const { canvasBackground, setCanvasBackground } = useCanvasStore();
  
  const [selectedType, setSelectedType] = useState('solid');
  const [solidColor, setSolidColor] = useState('#ffffff');
  const [gradientColors, setGradientColors] = useState(['#667eea', '#764ba2']);
  const [gradientAngle, setGradientAngle] = useState(45);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [imageOpacity, setImageOpacity] = useState(100);
  const [patternOpacity, setPatternOpacity] = useState(20);

  const applyBackground = (type: string, value: string) => {
    setCanvasBackground({
      type,
      value,
      updatedAt: Date.now()
    });
  };

  const handleSolidColorChange = (color: string) => {
    setSolidColor(color);
    applyBackground('solid', color);
  };

  const handleGradientPreset = (preset: any) => {
    setGradientColors(preset.colors);
    setGradientAngle(preset.angle);
    applyBackground('gradient', preset.gradient);
  };

  const handleCustomGradient = () => {
    const gradient = `linear-gradient(${gradientAngle}deg, ${gradientColors.join(', ')})`;
    applyBackground('gradient', gradient);
  };

  const handlePatternSelect = (pattern: any) => {
    const patternValue = `${pattern.pattern}`;
    const background = `${patternValue}`;
    applyBackground('pattern', background);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setBackgroundImage(imageUrl);
        applyBackground('image', `url(${imageUrl})`);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearBackground = () => {
    applyBackground('solid', 'transparent');
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Background Type Selector */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${theme.colors?.border || '#495563'}`
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: theme.colors?.textPrimary || '#f5f8fa',
          marginBottom: '12px'
        }}>
          Background Type
        </div>

        <ButtonGroup fill>
          {BACKGROUND_TYPES.map(type => (
            <Button
              key={type.value}
              icon={type.icon as any}
              active={selectedType === type.value}
              onClick={() => setSelectedType(type.value)}
              text={type.label}
              small
            />
          ))}
        </ButtonGroup>
      </div>

      {/* Background Controls */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto'
      }}>
        {/* Solid Color */}
        {selectedType === 'solid' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormGroup label="Color">
              <input
                type="color"
                value={solidColor}
                onChange={(e) => handleSolidColorChange(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid #495563',
                  borderRadius: '3px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer'
                }}
              />
            </FormGroup>

            {/* Quick Color Palette */}
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: 500,
                color: theme.colors?.textPrimary || '#f5f8fa',
                marginBottom: '8px'
              }}>
                Quick Colors
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '8px'
              }}>
                {['#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#495057', '#212529', '#007bff', '#6f42c1', '#e83e8c', '#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997', '#17a2b8', '#6c757d'].map(color => (
                  <button
                    key={color}
                    onClick={() => handleSolidColorChange(color)}
                    style={{
                      width: '30px',
                      height: '30px',
                      backgroundColor: color,
                      border: `2px solid ${solidColor === color ? theme.colors?.primary || '#48aff0' : theme.colors?.border || '#495563'}`,
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gradient */}
        {selectedType === 'gradient' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Gradient Presets */}
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: 500,
                color: theme.colors?.textPrimary || '#f5f8fa',
                marginBottom: '8px'
              }}>
                Gradient Presets
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}>
                {GRADIENT_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleGradientPreset(preset)}
                    style={{
                      height: '50px',
                      background: preset.gradient,
                      border: `2px solid ${theme.colors?.border || '#495563'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'end',
                      padding: '6px',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 500,
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                    }}
                    title={preset.name}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <Divider />

            {/* Custom Gradient */}
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: 500,
                color: theme.colors?.textPrimary || '#f5f8fa',
                marginBottom: '12px'
              }}>
                Custom Gradient
              </div>

              {/* Gradient Colors */}
              <div style={{ marginBottom: '16px' }}>
                <FormGroup label="Start Color">
                  <input
                    type="color"
                    value={gradientColors[0]}
                    onChange={(e) => {
                      const newColors = [...gradientColors];
                      newColors[0] = e.target.value;
                      setGradientColors(newColors);
                      handleCustomGradient();
                    }}
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
              </div>

              <div style={{ marginBottom: '16px' }}>
                <FormGroup label="End Color">
                  <input
                    type="color"
                    value={gradientColors[1]}
                    onChange={(e) => {
                      const newColors = [...gradientColors];
                      newColors[1] = e.target.value;
                      setGradientColors(newColors);
                      handleCustomGradient();
                    }}
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
              </div>

              {/* Gradient Angle */}
              <FormGroup label={`Angle: ${gradientAngle}°`}>
                <div style={{ padding: '0 8px' }}>
                  <Slider
                    min={0}
                    max={360}
                    stepSize={15}
                    labelStepSize={90}
                    value={gradientAngle}
                    onChange={(value) => {
                      setGradientAngle(value);
                      handleCustomGradient();
                    }}
                    showTrackFill={false}
                  />
                </div>
              </FormGroup>
            </div>
          </div>
        )}

        {/* Image Background */}
        {selectedType === 'image' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Upload Image */}
            <FormGroup label="Upload Image">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${theme.colors?.border || '#495563'}`,
                  borderRadius: '3px',
                  backgroundColor: theme.colors?.cardBg || '#394b59',
                  color: theme.colors?.textPrimary || '#f5f8fa',
                  fontSize: '12px'
                }}
              />
            </FormGroup>

            {/* Image Preview */}
            {backgroundImage && (
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: theme.colors?.textPrimary || '#f5f8fa',
                  marginBottom: '8px'
                }}>
                  Preview
                </div>
                <div style={{
                  width: '100%',
                  height: '100px',
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '6px',
                  border: `1px solid ${theme.colors?.border || '#495563'}`
                }} />
              </div>
            )}

            {/* Image Opacity */}
            <FormGroup label={`Opacity: ${imageOpacity}%`}>
              <div style={{ padding: '0 8px' }}>
                <Slider
                  min={0}
                  max={100}
                  stepSize={5}
                  labelStepSize={25}
                  value={imageOpacity}
                  onChange={(value) => setImageOpacity(value)}
                  showTrackFill={false}
                />
              </div>
            </FormGroup>

            <Divider />

            {/* Pattern Backgrounds */}
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: 500,
                color: theme.colors?.textPrimary || '#f5f8fa',
                marginBottom: '8px'
              }}>
                Patterns
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}>
                {PATTERN_BACKGROUNDS.map(pattern => (
                  <button
                    key={pattern.id}
                    onClick={() => handlePatternSelect(pattern)}
                    style={{
                      height: '50px',
                      backgroundColor: '#ffffff',
                      backgroundImage: pattern.pattern,
                      backgroundSize: pattern.size,
                      border: `2px solid ${theme.colors?.border || '#495563'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'end',
                      padding: '6px',
                      fontSize: '10px',
                      fontWeight: 500,
                      opacity: patternOpacity / 100
                    }}
                    title={pattern.name}
                  >
                    <span style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      padding: '2px 4px',
                      borderRadius: '2px'
                    }}>
                      {pattern.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Pattern Opacity */}
              <div style={{ marginTop: '12px' }}>
                <FormGroup label={`Pattern Opacity: ${patternOpacity}%`}>
                  <div style={{ padding: '0 8px' }}>
                    <Slider
                      min={5}
                      max={100}
                      stepSize={5}
                      labelStepSize={25}
                      value={patternOpacity}
                      onChange={(value) => setPatternOpacity(value)}
                      showTrackFill={false}
                    />
                  </div>
                </FormGroup>
              </div>
            </div>
          </div>
        )}

        <Divider />

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <Button
            onClick={clearBackground}
            icon="clean"
            fill
          >
            Clear Background
          </Button>
        </div>
      </div>
    </div>
  );
};

BackgroundPanel.displayName = 'BackgroundPanel';