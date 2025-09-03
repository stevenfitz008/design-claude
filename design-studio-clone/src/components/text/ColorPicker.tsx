import React, { useState, useEffect, useRef, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
// we need observer to update component automatically on any store changes
import { Button, Popover, InputGroup, Tab, Tabs, Spinner } from '@blueprintjs/core';
import { styled } from 'goober';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

const ColorPickerContainer = styled('div')`
  width: 280px;
  background: #2f343c;
  border: 1px solid #495563;
  border-radius: 6px;
  overflow: hidden;
`;

const TabsContainer = styled('div')`
  .bp4-tabs {
    .bp4-tab-list {
      background: #2f343c;
      border-bottom: 1px solid #495563;
      margin: 0;
      padding: 0 8px;
    }

    .bp4-tab {
      color: #8a9ba8;
      font-size: 12px;
      padding: 8px 12px;
      min-height: auto;
      
      &[aria-selected="true"] {
        color: #48aff0;
        border-bottom: 2px solid #48aff0;
        background: transparent;
      }
      
      &:hover {
        color: #bfccd6;
        background: rgba(72, 175, 240, 0.1);
      }
    }

    .bp4-tab-panel {
      padding: 16px;
    }
  }
`;

const ColorPreview = styled('div')<{ color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: ${props => props.color};
  border: 2px solid #495563;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    border-color: #48aff0;
    transform: scale(1.05);
  }
`;

const HueSaturationPicker = styled('div')`
  position: relative;
  width: 200px;
  height: 150px;
  border-radius: 4px;
  cursor: crosshair;
  margin-bottom: 12px;
`;

const HueBar = styled('div')`
  width: 200px;
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(to right, 
    #ff0000 0%, #ffff00 17%, #00ff00 33%, 
    #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);
  margin-bottom: 12px;
  cursor: pointer;
  position: relative;
`;

const AlphaBar = styled('div')<{ hue: number }>`
  width: 200px;
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(to right, transparent, hsl(${props => props.hue}, 100%, 50%));
  cursor: pointer;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(45deg, #ccc 25%, transparent 25%), 
      linear-gradient(-45deg, #ccc 25%, transparent 25%), 
      linear-gradient(45deg, transparent 75%, #ccc 75%), 
      linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 8px 8px;
    background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
    border-radius: 6px;
    z-index: -1;
  }
`;

const SliderThumb = styled('div')<{ position: number }>`
  position: absolute;
  top: -2px;
  left: ${props => props.position * 100}%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  border: 2px solid #495563;
  transform: translateX(-50%);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const ColorSwatches = styled('div')`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
  margin-bottom: 16px;
`;

const ColorSwatch = styled('div')<{ color: string; isSelected: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background: ${props => props.color};
  cursor: pointer;
  border: 2px solid ${props => props.isSelected ? '#48aff0' : '#495563'};
  transition: all 0.15s ease;
  
  &:hover {
    border-color: #48aff0;
    transform: scale(1.1);
  }
`;

const GradientPresets = styled('div')`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
`;

const GradientSwatch = styled('div')<{ gradient: string; isSelected: boolean }>`
  width: 100%;
  height: 32px;
  border-radius: 4px;
  background: ${props => props.gradient};
  cursor: pointer;
  border: 2px solid ${props => props.isSelected ? '#48aff0' : '#495563'};
  transition: all 0.15s ease;
  
  &:hover {
    border-color: #48aff0;
    transform: scale(1.02);
  }
`;

const HexInput = styled(InputGroup)`
  .bp4-input {
    background: #1c2127;
    border: 1px solid #495563;
    color: #f5f8fa;
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 12px;
    
    &:focus {
      border-color: #48aff0;
      box-shadow: 0 0 0 1px #48aff0;
    }
  }
`;

const ScrollContainer = styled('div')`
  max-height: 200px;
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

const LoadingIndicator = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: #8a9ba8;
  font-size: 12px;
  gap: 8px;

  .bp4-spinner {
    .bp4-spinner-svg-container {
      .bp4-spinner-track {
        stroke: #495563;
      }
      .bp4-spinner-head {
        stroke: #48aff0;
      }
    }
  }
`;

// Predefined color swatches
const COLOR_SWATCHES = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
  '#FF7675', '#74B9FF', '#0984E3', '#00B894', '#FDCB6E', '#E84393',
  '#6C5CE7', '#A29BFE', '#FD79A8', '#E17055', '#00CEC9', '#55A3FF',
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'
];

// Gradient presets
const GRADIENT_PRESETS = [
  'linear-gradient(45deg, #ff6b6b, #ffa500)',
  'linear-gradient(45deg, #4ecdc4, #44a08d)',
  'linear-gradient(45deg, #667eea, #764ba2)',
  'linear-gradient(45deg, #f093fb, #f5576c)',
  'linear-gradient(45deg, #4facfe, #00f2fe)',
  'linear-gradient(45deg, #43e97b, #38f9d7)',
  'linear-gradient(45deg, #fa709a, #fee140)',
  'linear-gradient(45deg, #a8edea, #fed6e3)',
  'linear-gradient(45deg, #ffecd2, #fcb69f)',
  'linear-gradient(45deg, #ff8a80, #ea80fc)',
  'linear-gradient(45deg, #8fd3f4, #84fab0)',
  'linear-gradient(45deg, #cfd9df, #e2ebf0)'
];

// Extended color generator for infinite scrolling
const generateMoreColors = (page: number, existingColors: string[]): string[] => {
  const colors = [];
  const hues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const saturations = [50, 70, 85, 100];
  const lightnesses = [25, 40, 55, 70, 85];
  
  for (let i = 0; i < 16; i++) {
    const colorIndex = (page - 1) * 16 + i;
    const h = hues[colorIndex % hues.length];
    const s = saturations[Math.floor(colorIndex / hues.length) % saturations.length];
    const l = lightnesses[Math.floor(colorIndex / (hues.length * saturations.length)) % lightnesses.length];
    
    // Convert HSL to hex
    const hslToHex = (h: number, s: number, l: number): string => {
      l /= 100;
      const a = s * Math.min(l, 1 - l) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };
    
    colors.push(hslToHex(h, s, l));
  }
  
  return colors;
};

// Extended gradient generator for infinite scrolling
const generateMoreGradients = (page: number, existingGradients: string[]): string[] => {
  const gradients = [];
  const directions = ['45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg', '0deg'];
  const colorPairs = [
    ['#ff9a9e', '#fecfef'], ['#a18cd1', '#fbc2eb'], ['#fad0c4', '#ffd1ff'],
    ['#fbc2eb', '#a6c1ee'], ['#fdbb2d', '#22c1c3'], ['#ff9a56', '#ffad56'],
    ['#a8edea', '#fed6e3'], ['#d299c2', '#fef9d7'], ['#89f7fe', '#66a6ff'],
    ['#ffecd2', '#fcb69f'], ['#ff8a80', '#ea80fc'], ['#8fd3f4', '#84fab0'],
    ['#cfd9df', '#e2ebf0'], ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'], ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140']
  ];
  
  for (let i = 0; i < 8; i++) {
    const gradientIndex = (page - 1) * 8 + i;
    const direction = directions[gradientIndex % directions.length];
    const colorPair = colorPairs[gradientIndex % colorPairs.length];
    
    gradients.push(`linear-gradient(${direction}, ${colorPair[0]}, ${colorPair[1]})`);
  }
  
  return gradients;
};

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  showAlpha?: boolean;
  showGradients?: boolean;
}

interface HSV {
  h: number;
  s: number;
  v: number;
  a: number;
}

// Utility functions for color conversion
const hexToHsv = (hex: string): HSV => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  if (diff !== 0) {
    if (max === r) h = ((g - b) / diff) % 6;
    else if (max === g) h = (b - r) / diff + 2;
    else h = (r - g) / diff + 4;
  }
  h = Math.round(60 * h);
  if (h < 0) h += 360;
  
  const s = max === 0 ? 0 : diff / max;
  const v = max;
  
  return { h, s, v, a: 1 };
};

const hsvToHex = ({ h, s, v, a }: HSV): string => {
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const ColorPicker: React.FC<ColorPickerProps> = observer(({ 
  color, 
  onChange, 
  showAlpha = true,
  showGradients = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('picker');
  const [hsv, setHsv] = useState<HSV>(hexToHsv(color.startsWith('#') ? color : '#000000'));
  const [hexValue, setHexValue] = useState(color.startsWith('#') ? color : '#000000');
  
  const hueRef = useRef<HTMLDivElement>(null);
  const alphaRef = useRef<HTMLDivElement>(null);
  const satValRef = useRef<HTMLDivElement>(null);

  // Initialize infinite scroll for color swatches
  const { 
    items: colorSwatches, 
    loading: colorsLoading, 
    hasMore: hasMoreColors, 
    loadingRef: colorsLoadingRef 
  } = useInfiniteScroll({
    initialItems: COLOR_SWATCHES,
    itemsPerPage: 16,
    generateItems: generateMoreColors,
    hasMore: true
  });

  // Initialize infinite scroll for gradients
  const { 
    items: gradientPresets, 
    loading: gradientsLoading, 
    hasMore: hasMoreGradients, 
    loadingRef: gradientsLoadingRef 
  } = useInfiniteScroll({
    initialItems: GRADIENT_PRESETS,
    itemsPerPage: 8,
    generateItems: generateMoreGradients,
    hasMore: true
  });

  // Update internal state when color prop changes
  useEffect(() => {
    if (color.startsWith('#') && color !== hexValue) {
      const newHsv = hexToHsv(color);
      setHsv(newHsv);
      setHexValue(color);
    }
  }, [color, hexValue]);

  const handleHsvChange = useCallback((newHsv: HSV) => {
    setHsv(newHsv);
    const hexColor = hsvToHex(newHsv);
    setHexValue(hexColor);
    onChange(hexColor);
  }, [onChange]);

  const handleHexInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexValue(value);
    
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      const newHsv = hexToHsv(value);
      setHsv(newHsv);
      onChange(value);
    }
  }, [onChange]);

  const handleSwatchClick = useCallback((swatchColor: string) => {
    const newHsv = hexToHsv(swatchColor);
    setHsv(newHsv);
    setHexValue(swatchColor);
    onChange(swatchColor);
  }, [onChange]);

  const renderColorPicker = () => (
    <div>
      {/* Saturation/Value picker */}
      <HueSaturationPicker
        ref={satValRef}
        style={{
          background: `linear-gradient(to top, black, transparent), linear-gradient(to right, white, hsl(${hsv.h}, 100%, 50%))`
        }}
        onMouseDown={(e) => {
          const rect = satValRef.current?.getBoundingClientRect();
          if (!rect) return;
          
          const x = (e.clientX - rect.left) / rect.width;
          const y = 1 - (e.clientY - rect.top) / rect.height;
          
          handleHsvChange({ ...hsv, s: x, v: y });
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            width: '12px',
            height: '12px',
            border: '2px solid white',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
            pointerEvents: 'none'
          }}
        />
      </HueSaturationPicker>

      {/* Hue bar */}
      <HueBar
        ref={hueRef}
        onMouseDown={(e) => {
          const rect = hueRef.current?.getBoundingClientRect();
          if (!rect) return;
          
          const x = (e.clientX - rect.left) / rect.width;
          const hue = x * 360;
          
          handleHsvChange({ ...hsv, h: hue });
        }}
      >
        <SliderThumb position={hsv.h / 360} />
      </HueBar>

      {/* Alpha bar */}
      {showAlpha && (
        <AlphaBar
          ref={alphaRef}
          hue={hsv.h}
          onMouseDown={(e) => {
            const rect = alphaRef.current?.getBoundingClientRect();
            if (!rect) return;
            
            const x = (e.clientX - rect.left) / rect.width;
            handleHsvChange({ ...hsv, a: x });
          }}
        >
          <SliderThumb position={hsv.a} />
        </AlphaBar>
      )}

      {/* Hex input */}
      <HexInput
        value={hexValue}
        onChange={handleHexInputChange}
        leftIcon="tint"
        placeholder="#000000"
      />
    </div>
  );

  const renderSwatches = () => (
    <ScrollContainer>
      <ColorSwatches>
        {colorSwatches.map(swatchColor => (
          <ColorSwatch
            key={swatchColor}
            color={swatchColor}
            isSelected={hexValue.toLowerCase() === swatchColor.toLowerCase()}
            onClick={() => handleSwatchClick(swatchColor)}
          />
        ))}
      </ColorSwatches>
      {hasMoreColors && (
        <div ref={colorsLoadingRef}>
          {colorsLoading && (
            <LoadingIndicator>
              <Spinner size={16} />
              Loading more colors...
            </LoadingIndicator>
          )}
        </div>
      )}
    </ScrollContainer>
  );

  const renderGradients = () => (
    <ScrollContainer>
      <GradientPresets>
        {gradientPresets.map((gradient, index) => (
          <GradientSwatch
            key={index}
            gradient={gradient}
            isSelected={false}
            onClick={() => onChange(gradient)}
          />
        ))}
      </GradientPresets>
      {hasMoreGradients && (
        <div ref={gradientsLoadingRef}>
          {gradientsLoading && (
            <LoadingIndicator>
              <Spinner size={16} />
              Loading more gradients...
            </LoadingIndicator>
          )}
        </div>
      )}
    </ScrollContainer>
  );

  return (
    <Popover
      isOpen={isOpen}
      onInteraction={setIsOpen}
      position="bottom-left"
      content={
        <ColorPickerContainer>
          <TabsContainer>
            <Tabs selectedTabId={activeTab} onChange={setActiveTab}>
              <Tab
                id="picker"
                title="Picker"
                panel={renderColorPicker()}
              />
              <Tab
                id="swatches"
                title="Swatches"
                panel={renderSwatches()}
              />
              {showGradients && (
                <Tab
                  id="gradients"
                  title="Gradients"
                  panel={renderGradients()}
                />
              )}
            </Tabs>
          </TabsContainer>
        </ColorPickerContainer>
      }
    >
      <ColorPreview color={hexValue} />
    </Popover>
  );
});

ColorPicker.displayName = 'ColorPicker';