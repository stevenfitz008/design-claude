import React, { useState, useCallback } from 'react';
import { 
  Button, 
  Slider, 
  FormGroup, 
  ControlGroup,
  ButtonGroup,
  Divider,
  Switch,
  MenuItem,
} from '@blueprintjs/core';
import { Select, ItemRenderer } from '@blueprintjs/select';
import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';
import type { ImageElement, ImageFilters } from '@/types/canvas';

const Panel = styled.div<{ theme: any }>`
  padding: 20px;
  background: ${props => props.theme.colors.cardBg};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  max-width: 320px;
  
  .panel-title {
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 16px;
  }
`;

const FilterSection = styled.div<{ theme: any }>`
  margin-bottom: 20px;
  
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 12px;
  }
  
  .filter-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    
    .filter-label {
      font-size: 12px;
      color: ${props => props.theme.colors.textSecondary};
      min-width: 80px;
    }
    
    .filter-value {
      font-size: 11px;
      color: ${props => props.theme.colors.primary};
      font-weight: 600;
      min-width: 30px;
      text-align: right;
    }
  }
  
  .bp5-slider {
    margin: 8px 0;
  }
`;

const PresetSection = styled.div<{ theme: any }>`
  margin-bottom: 20px;
  
  .preset-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-top: 12px;
  }
  
  .preset-button {
    height: 36px;
    font-size: 11px;
    text-align: center;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-1px);
    }
  }
`;

const CropSection = styled.div<{ theme: any }>`
  margin-bottom: 20px;
  
  .aspect-ratios {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-top: 12px;
  }
  
  .aspect-button {
    height: 32px;
    font-size: 10px;
    
    &.active {
      background: ${props => props.theme.colors.primary};
      color: white;
    }
  }
`;

const ActionSection = styled.div`
  display: flex;
  gap: 8px;
  
  .bp5-button {
    flex: 1;
  }
`;

interface FilterPreset {
  name: string;
  filters: Partial<ImageFilters>;
}

const filterPresets: FilterPreset[] = [
  {
    name: 'Original',
    filters: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      sepia: 0,
      grayscale: 0,
    },
  },
  {
    name: 'Vintage',
    filters: {
      brightness: 90,
      contrast: 110,
      saturation: 80,
      hue: 10,
      blur: 0,
      sepia: 30,
      grayscale: 0,
    },
  },
  {
    name: 'B&W',
    filters: {
      brightness: 105,
      contrast: 115,
      saturation: 100,
      hue: 0,
      blur: 0,
      sepia: 0,
      grayscale: 100,
    },
  },
  {
    name: 'Warm',
    filters: {
      brightness: 105,
      contrast: 105,
      saturation: 110,
      hue: 15,
      blur: 0,
      sepia: 0,
      grayscale: 0,
    },
  },
  {
    name: 'Cool',
    filters: {
      brightness: 100,
      contrast: 105,
      saturation: 105,
      hue: -10,
      blur: 0,
      sepia: 0,
      grayscale: 0,
    },
  },
  {
    name: 'Dramatic',
    filters: {
      brightness: 85,
      contrast: 140,
      saturation: 120,
      hue: 0,
      blur: 0,
      sepia: 0,
      grayscale: 0,
    },
  },
];

const aspectRatios = [
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4/3 },
  { label: '16:9', ratio: 16/9 },
  { label: '3:2', ratio: 3/2 },
  { label: '2:3', ratio: 2/3 },
  { label: '9:16', ratio: 9/16 },
];

const BlendModeSelect = Select.ofType<{ value: string; label: string }>();

const blendModes = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
];

const renderBlendMode: ItemRenderer<{ value: string; label: string }> = (
  option,
  { handleClick, modifiers }
) => {
  return (
    <MenuItem
      active={modifiers.active}
      key={option.value}
      onClick={handleClick}
      text={option.label}
    />
  );
};

interface ImageEffectsPanelProps {
  selectedImage: ImageElement;
  onClose: () => void;
}

export const ImageEffectsPanel: React.FC<ImageEffectsPanelProps> = ({
  selectedImage,
  onClose,
}) => {
  const { theme } = useTheme();
  const { updateElement } = useCanvasStore();

  const [filters, setFilters] = useState<ImageFilters>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    ...selectedImage.filters,
  });

  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number | null>(null);
  const [cropMode, setCropMode] = useState(false);

  const handleFilterChange = useCallback((filterName: keyof ImageFilters, value: number) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    
    updateElement(selectedImage.id, {
      filters: newFilters,
    });
  }, [filters, selectedImage.id, updateElement]);

  const handlePresetApply = useCallback((preset: FilterPreset) => {
    const newFilters = { ...filters, ...preset.filters };
    setFilters(newFilters);
    
    updateElement(selectedImage.id, {
      filters: newFilters,
    });
  }, [filters, selectedImage.id, updateElement]);

  const handleReset = useCallback(() => {
    const defaultFilters: ImageFilters = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      sepia: 0,
      grayscale: 0,
    };
    
    setFilters(defaultFilters);
    updateElement(selectedImage.id, {
      filters: defaultFilters,
    });
  }, [selectedImage.id, updateElement]);

  const handleCrop = useCallback((ratio: number) => {
    const currentWidth = selectedImage.width;
    const currentHeight = selectedImage.height;
    const currentRatio = currentWidth / currentHeight;

    let newWidth = currentWidth;
    let newHeight = currentHeight;

    if (ratio > currentRatio) {
      // Image is taller than target ratio, crop height
      newHeight = currentWidth / ratio;
    } else {
      // Image is wider than target ratio, crop width
      newWidth = currentHeight * ratio;
    }

    updateElement(selectedImage.id, {
      width: newWidth,
      height: newHeight,
      cropData: {
        x: (currentWidth - newWidth) / 2,
        y: (currentHeight - newHeight) / 2,
        width: newWidth,
        height: newHeight,
      },
    });

    setSelectedAspectRatio(ratio);
  }, [selectedImage, updateElement]);

  const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {
    if (direction === 'horizontal') {
      updateElement(selectedImage.id, {
        scaleX: selectedImage.scaleX * -1,
      });
    } else {
      updateElement(selectedImage.id, {
        scaleY: selectedImage.scaleY * -1,
      });
    }
  }, [selectedImage, updateElement]);

  const handleRotate = useCallback((angle: number) => {
    updateElement(selectedImage.id, {
      rotation: selectedImage.rotation + angle,
    });
  }, [selectedImage, updateElement]);

  return (
    <Panel theme={theme}>
      <div className="panel-title">Image Effects</div>

      {/* Filter Controls */}
      <FilterSection theme={theme}>
        <div className="section-title">Adjustments</div>
        
        <div className="filter-row">
          <span className="filter-label">Brightness</span>
          <span className="filter-value">{filters.brightness}%</span>
        </div>
        <Slider
          min={0}
          max={200}
          stepSize={1}
          value={filters.brightness}
          onChange={(value) => handleFilterChange('brightness', value)}
        />

        <div className="filter-row">
          <span className="filter-label">Contrast</span>
          <span className="filter-value">{filters.contrast}%</span>
        </div>
        <Slider
          min={0}
          max={200}
          stepSize={1}
          value={filters.contrast}
          onChange={(value) => handleFilterChange('contrast', value)}
        />

        <div className="filter-row">
          <span className="filter-label">Saturation</span>
          <span className="filter-value">{filters.saturation}%</span>
        </div>
        <Slider
          min={0}
          max={200}
          stepSize={1}
          value={filters.saturation}
          onChange={(value) => handleFilterChange('saturation', value)}
        />

        <div className="filter-row">
          <span className="filter-label">Hue</span>
          <span className="filter-value">{filters.hue}°</span>
        </div>
        <Slider
          min={-180}
          max={180}
          stepSize={1}
          value={filters.hue}
          onChange={(value) => handleFilterChange('hue', value)}
        />

        <div className="filter-row">
          <span className="filter-label">Blur</span>
          <span className="filter-value">{filters.blur}px</span>
        </div>
        <Slider
          min={0}
          max={10}
          stepSize={0.1}
          value={filters.blur}
          onChange={(value) => handleFilterChange('blur', value)}
        />

        <div className="filter-row">
          <span className="filter-label">Sepia</span>
          <span className="filter-value">{filters.sepia}%</span>
        </div>
        <Slider
          min={0}
          max={100}
          stepSize={1}
          value={filters.sepia}
          onChange={(value) => handleFilterChange('sepia', value)}
        />

        <div className="filter-row">
          <span className="filter-label">Grayscale</span>
          <span className="filter-value">{filters.grayscale}%</span>
        </div>
        <Slider
          min={0}
          max={100}
          stepSize={1}
          value={filters.grayscale}
          onChange={(value) => handleFilterChange('grayscale', value)}
        />
      </FilterSection>

      <Divider />

      {/* Filter Presets */}
      <PresetSection theme={theme}>
        <div className="section-title">Presets</div>
        <div className="preset-grid">
          {filterPresets.map((preset) => (
            <Button
              key={preset.name}
              className="preset-button"
              size="small"
              onClick={() => handlePresetApply(preset)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </PresetSection>

      <Divider />

      {/* Crop & Transform */}
      <CropSection theme={theme}>
        <div className="section-title">Crop & Transform</div>
        
        <FormGroup label="Crop to Aspect Ratio" inline>
          <div className="aspect-ratios">
            {aspectRatios.map((aspect) => (
              <Button
                key={aspect.label}
                className={`aspect-button ${selectedAspectRatio === aspect.ratio ? 'active' : ''}`}
                size="small"
                onClick={() => handleCrop(aspect.ratio)}
              >
                {aspect.label}
              </Button>
            ))}
          </div>
        </FormGroup>

        <FormGroup label="Transform">
          <ControlGroup>
            <Button
              icon="swap-horizontal"
              onClick={() => handleFlip('horizontal')}
              title="Flip Horizontal"
            />
            <Button
              icon="swap-vertical"
              onClick={() => handleFlip('vertical')}
              title="Flip Vertical"
            />
            <Button
              icon="redo"
              onClick={() => handleRotate(90)}
              title="Rotate 90° CW"
            />
            <Button
              icon="undo"
              onClick={() => handleRotate(-90)}
              title="Rotate 90° CCW"
            />
          </ControlGroup>
        </FormGroup>
      </CropSection>

      <Divider />

      {/* Actions */}
      <ActionSection>
        <Button onClick={handleReset} minimal>
          Reset
        </Button>
        <Button onClick={onClose} intent="primary">
          Done
        </Button>
      </ActionSection>
    </Panel>
  );
};