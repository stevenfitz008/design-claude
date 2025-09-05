import React, { useState, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { styled } from '@styles/goober-setup';
import { 
  Dialog, 
  Button, 
  Slider, 
  FormGroup, 
  Tabs, 
  Tab, 
  Card,
  ButtonGroup,
  Intent,
  Switch
} from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CanvasElement, ImageElement } from '@/types/canvas';

interface AdvancedEffectsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  element: CanvasElement | null;
  onApplyEffects: (effects: ImageEffects) => void;
}

interface ImageEffects {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  grayscale: number;
  sepia: number;
  invert: boolean;
  pixelate: number;
  noise: number;
  vignette: number;
  temperature: number;
  tint: number;
}

const defaultEffects: ImageEffects = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  invert: false,
  pixelate: 0,
  noise: 0,
  vignette: 0,
  temperature: 0,
  tint: 0,
};

const EffectsContainer = styled.div<{ theme: any }>`
  .bp5-dialog-body {
    padding: 16px;
    max-height: 70vh;
    overflow-y: auto;
  }
`;

const PreviewContainer = styled.div<{ theme: any }>`
  width: 200px;
  height: 120px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.secondaryBg};
  margin-bottom: 16px;
`;

const PreviewImage = styled.img<{ effects: ImageEffects }>`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: ${props => {
    const {
      brightness,
      contrast,
      saturation,
      hue,
      blur,
      grayscale,
      sepia,
      invert,
      temperature,
      tint
    } = props.effects;
    
    return [
      `brightness(${100 + brightness}%)`,
      `contrast(${100 + contrast}%)`,
      `saturate(${100 + saturation}%)`,
      `hue-rotate(${hue}deg)`,
      `blur(${blur}px)`,
      `grayscale(${grayscale}%)`,
      `sepia(${sepia}%)`,
      invert ? 'invert(100%)' : 'invert(0%)',
      // Temperature effect using color filters
      temperature > 0 ? `sepia(${temperature * 0.3}%) saturate(${100 + temperature}%)` : '',
      tint !== 0 ? `hue-rotate(${tint}deg)` : '',
    ].filter(Boolean).join(' ');
  }};
  transition: filter 0.2s ease;
`;

const EffectSlider = styled(FormGroup)<{ theme: any }>`
  margin-bottom: 12px;
  
  .bp5-label {
    color: ${props => props.theme.colors.text};
    font-size: 12px;
    margin-bottom: 4px;
  }
  
  .bp5-slider {
    width: 100%;
  }
`;

const PresetButton = styled(Button)<{ theme: any }>`
  margin: 2px !important;
  min-width: 80px !important;
  font-size: 11px !important;
`;

const ResetButton = styled(Button)<{ theme: any }>`
  margin-top: 12px !important;
`;

// Effect presets
const effectPresets = {
  'Vintage': {
    brightness: -10,
    contrast: 15,
    saturation: -20,
    sepia: 40,
    temperature: 20,
    vignette: 30,
  },
  'Dramatic': {
    brightness: -5,
    contrast: 40,
    saturation: 25,
    clarity: 30,
    vignette: 20,
  },
  'B&W': {
    grayscale: 100,
    contrast: 20,
    brightness: 5,
  },
  'Warm': {
    temperature: 30,
    saturation: 10,
    brightness: 5,
  },
  'Cool': {
    temperature: -25,
    tint: 10,
    saturation: 5,
  },
  'High Key': {
    brightness: 25,
    contrast: -15,
    saturation: -10,
  },
  'Low Key': {
    brightness: -20,
    contrast: 30,
    saturation: 15,
  },
};

export const AdvancedEffectsPanel: React.FC<AdvancedEffectsPanelProps> = observer(({
  isOpen,
  onClose,
  element,
  onApplyEffects,
}) => {
  const { theme } = useTheme();
  const [effects, setEffects] = useState<ImageEffects>(defaultEffects);
  const [activeTab, setActiveTab] = useState('basic');
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);

  // Get image source for preview
  const imageSource = useMemo(() => {
    if (!element || element.type !== 'image') return null;
    const imageElement = element as ImageElement;
    return imageElement.src || null;
  }, [element]);

  const updateEffect = useCallback((key: keyof ImageEffects, value: number | boolean) => {
    setEffects(prev => ({ ...prev, [key]: value }));
  }, []);

  const applyPreset = useCallback((presetName: string) => {
    const preset = effectPresets[presetName as keyof typeof effectPresets];
    setEffects(prev => ({ ...prev, ...preset }));
  }, []);

  const resetEffects = useCallback(() => {
    setEffects(defaultEffects);
  }, []);

  const handleApply = useCallback(() => {
    onApplyEffects(effects);
    onClose();
  }, [effects, onApplyEffects, onClose]);

  const renderBasicControls = () => (
    <div>
      <EffectSlider theme={theme} label="Brightness">
        <Slider
          min={-100}
          max={100}
          stepSize={5}
          value={effects.brightness}
          onChange={(value) => updateEffect('brightness', value)}
          labelStepSize={50}
        />
      </EffectSlider>

      <EffectSlider theme={theme} label="Contrast">
        <Slider
          min={-100}
          max={100}
          stepSize={5}
          value={effects.contrast}
          onChange={(value) => updateEffect('contrast', value)}
          labelStepSize={50}
        />
      </EffectSlider>

      <EffectSlider theme={theme} label="Saturation">
        <Slider
          min={-100}
          max={100}
          stepSize={5}
          value={effects.saturation}
          onChange={(value) => updateEffect('saturation', value)}
          labelStepSize={50}
        />
      </EffectSlider>

      <EffectSlider theme={theme} label="Hue">
        <Slider
          min={-180}
          max={180}
          stepSize={5}
          value={effects.hue}
          onChange={(value) => updateEffect('hue', value)}
          labelStepSize={90}
        />
      </EffectSlider>
    </div>
  );

  const renderAdvancedControls = () => (
    <div>
      <EffectSlider theme={theme} label="Blur">
        <Slider
          min={0}
          max={10}
          stepSize={0.5}
          value={effects.blur}
          onChange={(value) => updateEffect('blur', value)}
          labelStepSize={5}
        />
      </EffectSlider>

      <EffectSlider theme={theme} label="Grayscale">
        <Slider
          min={0}
          max={100}
          stepSize={5}
          value={effects.grayscale}
          onChange={(value) => updateEffect('grayscale', value)}
          labelStepSize={25}
        />
      </EffectSlider>

      <EffectSlider theme={theme} label="Sepia">
        <Slider
          min={0}
          max={100}
          stepSize={5}
          value={effects.sepia}
          onChange={(value) => updateEffect('sepia', value)}
          labelStepSize={25}
        />
      </EffectSlider>

      <FormGroup label="Invert">
        <Switch
          checked={effects.invert}
          onChange={(e) => updateEffect('invert', e.currentTarget.checked)}
        />
      </FormGroup>

      <EffectSlider theme={theme} label="Temperature">
        <Slider
          min={-100}
          max={100}
          stepSize={5}
          value={effects.temperature}
          onChange={(value) => updateEffect('temperature', value)}
          labelStepSize={50}
        />
      </EffectSlider>

      <EffectSlider theme={theme} label="Tint">
        <Slider
          min={-100}
          max={100}
          stepSize={5}
          value={effects.tint}
          onChange={(value) => updateEffect('tint', value)}
          labelStepSize={50}
        />
      </EffectSlider>
    </div>
  );

  const renderPresets = () => (
    <div>
      <h4 style={{ marginBottom: '12px', color: theme.colors.text }}>Quick Presets</h4>
      <ButtonGroup fill>
        {Object.keys(effectPresets).map((presetName) => (
          <PresetButton
            key={presetName}
            theme={theme}
            small
            outlined
            onClick={() => applyPreset(presetName)}
          >
            {presetName}
          </PresetButton>
        ))}
      </ButtonGroup>
      
      <ResetButton
        theme={theme}
        icon="refresh"
        outlined
        fill
        onClick={resetEffects}
      >
        Reset All Effects
      </ResetButton>
    </div>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Effects & Filters"
      style={{ width: '500px' }}
    >
      <EffectsContainer theme={theme}>
        <div className="bp5-dialog-body">
          {/* Preview Section */}
          {imageSource && (
            <div style={{ marginBottom: '16px' }}>
              <PreviewContainer theme={theme}>
                <PreviewImage
                  src={imageSource}
                  alt="Effect Preview"
                  effects={effects}
                />
              </PreviewContainer>
              
              <Switch
                label="Show Before/After"
                checked={showBeforeAfter}
                onChange={(e) => setShowBeforeAfter(e.currentTarget.checked)}
              />
            </div>
          )}

          {/* Controls Tabs */}
          <Tabs
            id="effects-tabs"
            selectedTabId={activeTab}
            onChange={(tabId) => setActiveTab(tabId as string)}
          >
            <Tab id="basic" title="Basic" panel={renderBasicControls()} />
            <Tab id="advanced" title="Advanced" panel={renderAdvancedControls()} />
            <Tab id="presets" title="Presets" panel={renderPresets()} />
          </Tabs>
        </div>

        <div className="bp5-dialog-footer">
          <div className="bp5-dialog-footer-actions">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              intent={Intent.PRIMARY}
              onClick={handleApply}
              disabled={!element}
            >
              Apply Effects
            </Button>
          </div>
        </div>
      </EffectsContainer>
    </Dialog>
  );
});

AdvancedEffectsPanel.displayName = 'AdvancedEffectsPanel';