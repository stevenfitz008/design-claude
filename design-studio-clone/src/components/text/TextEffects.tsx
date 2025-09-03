import React, { useState } from 'react';
import { FormGroup, Label, Slider, Switch, HTMLSelect, Divider } from '@blueprintjs/core';
import { styled } from 'goober';
import { ColorPicker } from './ColorPicker';

const EffectsContainer = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #2f343c;
  border-radius: 6px;
`;

const EffectSection = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionHeader = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: #f5f8fa;
  margin-bottom: 8px;
`;

const ControlRow = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: center;
`;

const ControlGroup = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SliderContainer = styled('div')`
  padding: 0 8px;
`;

const EffectPreview = styled('div')<{ effects: TextEffectsState }>`
  padding: 16px;
  background: #1c2127;
  border-radius: 4px;
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: ${props => props.effects.fill};
  text-shadow: ${props => generateTextShadow(props.effects.shadow, props.effects.glow)};
  filter: ${props => generateFilter(props.effects)};
  -webkit-text-stroke: ${props => props.effects.outline.enabled ? 
    `${props.effects.outline.width}px ${props.effects.outline.color}` : 'none'};
  background: ${props => props.effects.background.enabled ? 
    props.effects.background.color : 'transparent'};
  border-radius: ${props => props.effects.background.enabled ? 
    `${props.effects.background.radius}px` : '0px'};
  transform: ${props => `
    perspective(1000px) 
    rotateX(${props.effects.transform.rotateX}deg) 
    rotateY(${props.effects.transform.rotateY}deg) 
    skewX(${props.effects.transform.skewX}deg) 
    skewY(${props.effects.transform.skewY}deg)
  `};
`;

export interface TextEffectsState {
  fill: string;
  shadow: {
    enabled: boolean;
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
    opacity: number;
  };
  glow: {
    enabled: boolean;
    size: number;
    color: string;
    opacity: number;
  };
  outline: {
    enabled: boolean;
    width: number;
    color: string;
  };
  background: {
    enabled: boolean;
    color: string;
    opacity: number;
    radius: number;
    padding: number;
  };
  transform: {
    rotateX: number;
    rotateY: number;
    skewX: number;
    skewY: number;
  };
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
  };
}

const DEFAULT_EFFECTS: TextEffectsState = {
  fill: '#ffffff',
  shadow: {
    enabled: false,
    offsetX: 2,
    offsetY: 2,
    blur: 4,
    color: '#000000',
    opacity: 0.5
  },
  glow: {
    enabled: false,
    size: 10,
    color: '#48aff0',
    opacity: 0.8
  },
  outline: {
    enabled: false,
    width: 1,
    color: '#000000'
  },
  background: {
    enabled: false,
    color: '#48aff0',
    opacity: 0.2,
    radius: 8,
    padding: 16
  },
  transform: {
    rotateX: 0,
    rotateY: 0,
    skewX: 0,
    skewY: 0
  },
  filters: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0
  }
};

// Helper functions to generate CSS
const generateTextShadow = (shadow: TextEffectsState['shadow'], glow: TextEffectsState['glow']): string => {
  const shadows = [];
  
  if (shadow.enabled) {
    const shadowOpacity = Math.round(shadow.opacity * 255).toString(16).padStart(2, '0');
    shadows.push(`${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}${shadowOpacity}`);
  }
  
  if (glow.enabled) {
    const glowOpacity = Math.round(glow.opacity * 255).toString(16).padStart(2, '0');
    shadows.push(`0 0 ${glow.size}px ${glow.color}${glowOpacity}`);
  }
  
  return shadows.join(', ') || 'none';
};

const generateFilter = (effects: TextEffectsState): string => {
  const { brightness, contrast, saturation, hue } = effects.filters;
  
  if (brightness === 100 && contrast === 100 && saturation === 100 && hue === 0) {
    return 'none';
  }
  
  return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`;
};

interface TextEffectsProps {
  effects: TextEffectsState;
  onChange: (effects: TextEffectsState) => void;
  showPreview?: boolean;
}

export const TextEffects: React.FC<TextEffectsProps> = ({ 
  effects = DEFAULT_EFFECTS, 
  onChange,
  showPreview = true 
}) => {
  const updateEffect = <T extends keyof TextEffectsState>(
    category: T,
    updates: Partial<TextEffectsState[T]>
  ) => {
    onChange({
      ...effects,
      [category]: {
        ...effects[category],
        ...updates
      }
    });
  };

  return (
    <EffectsContainer>
      {showPreview && (
        <EffectSection>
          <SectionHeader>Preview</SectionHeader>
          <EffectPreview effects={effects}>
            Sample Text
          </EffectPreview>
        </EffectSection>
      )}

      {/* Fill Color */}
      <EffectSection>
        <SectionHeader>Fill</SectionHeader>
        <ControlRow>
          <Label>Color</Label>
          <ColorPicker
            color={effects.fill}
            onChange={(color) => onChange({ ...effects, fill: color })}
            showGradients={true}
          />
        </ControlRow>
      </EffectSection>

      <Divider />

      {/* Shadow */}
      <EffectSection>
        <SectionHeader>
          Drop Shadow
          <Switch
            checked={effects.shadow.enabled}
            onChange={(e) => updateEffect('shadow', { enabled: e.currentTarget.checked })}
          />
        </SectionHeader>
        
        {effects.shadow.enabled && (
          <>
            <ControlRow>
              <ControlGroup>
                <Label>X Offset</Label>
                <SliderContainer>
                  <Slider
                    min={-20}
                    max={20}
                    stepSize={1}
                    value={effects.shadow.offsetX}
                    onChange={(value) => updateEffect('shadow', { offsetX: value })}
                    showTrackFill={false}
                  />
                </SliderContainer>
              </ControlGroup>
              
              <ControlGroup>
                <Label>Y Offset</Label>
                <SliderContainer>
                  <Slider
                    min={-20}
                    max={20}
                    stepSize={1}
                    value={effects.shadow.offsetY}
                    onChange={(value) => updateEffect('shadow', { offsetY: value })}
                    showTrackFill={false}
                  />
                </SliderContainer>
              </ControlGroup>
            </ControlRow>

            <ControlRow>
              <ControlGroup>
                <Label>Blur</Label>
                <SliderContainer>
                  <Slider
                    min={0}
                    max={20}
                    stepSize={1}
                    value={effects.shadow.blur}
                    onChange={(value) => updateEffect('shadow', { blur: value })}
                    showTrackFill={false}
                  />
                </SliderContainer>
              </ControlGroup>
              
              <ControlGroup>
                <Label>Opacity</Label>
                <SliderContainer>
                  <Slider
                    min={0}
                    max={1}
                    stepSize={0.1}
                    value={effects.shadow.opacity}
                    onChange={(value) => updateEffect('shadow', { opacity: value })}
                    showTrackFill={false}
                  />
                </SliderContainer>
              </ControlGroup>
            </ControlRow>

            <ControlRow>
              <Label>Color</Label>
              <ColorPicker
                color={effects.shadow.color}
                onChange={(color) => updateEffect('shadow', { color })}
                showAlpha={false}
              />
            </ControlRow>
          </>
        )}
      </EffectSection>

      <Divider />

      {/* Glow */}
      <EffectSection>
        <SectionHeader>
          Glow
          <Switch
            checked={effects.glow.enabled}
            onChange={(e) => updateEffect('glow', { enabled: e.currentTarget.checked })}
          />
        </SectionHeader>
        
        {effects.glow.enabled && (
          <>
            <ControlRow>
              <ControlGroup>
                <Label>Size</Label>
                <SliderContainer>
                  <Slider
                    min={1}
                    max={30}
                    stepSize={1}
                    value={effects.glow.size}
                    onChange={(value) => updateEffect('glow', { size: value })}
                    showTrackFill={false}
                  />
                </SliderContainer>
              </ControlGroup>
              
              <ControlGroup>
                <Label>Opacity</Label>
                <SliderContainer>
                  <Slider
                    min={0}
                    max={1}
                    stepSize={0.1}
                    value={effects.glow.opacity}
                    onChange={(value) => updateEffect('glow', { opacity: value })}
                    showTrackFill={false}
                  />
                </SliderContainer>
              </ControlGroup>
            </ControlRow>

            <ControlRow>
              <Label>Color</Label>
              <ColorPicker
                color={effects.glow.color}
                onChange={(color) => updateEffect('glow', { color })}
                showAlpha={false}
              />
            </ControlRow>
          </>
        )}
      </EffectSection>

      <Divider />

      {/* Outline */}
      <EffectSection>
        <SectionHeader>
          Outline
          <Switch
            checked={effects.outline.enabled}
            onChange={(e) => updateEffect('outline', { enabled: e.currentTarget.checked })}
          />
        </SectionHeader>
        
        {effects.outline.enabled && (
          <>
            <ControlRow>
              <ControlGroup>
                <Label>Width</Label>
                <SliderContainer>
                  <Slider
                    min={1}
                    max={8}
                    stepSize={0.5}
                    value={effects.outline.width}
                    onChange={(value) => updateEffect('outline', { width: value })}
                    showTrackFill={false}
                  />
                </SliderContainer>
              </ControlGroup>
              
              <ControlGroup>
                <Label>Color</Label>
                <ColorPicker
                  color={effects.outline.color}
                  onChange={(color) => updateEffect('outline', { color })}
                  showAlpha={false}
                />
              </ControlGroup>
            </ControlRow>
          </>
        )}
      </EffectSection>

      <Divider />

      {/* Background */}
      <EffectSection>
        <SectionHeader>
          Background
          <Switch
            checked={effects.background.enabled}
            onChange={(e) => updateEffect('background', { enabled: e.currentTarget.checked })}
          />
        </SectionHeader>
        
        {effects.background.enabled && (
          <>
            <ControlRow>
              <ControlGroup>
                <Label>Opacity</Label>
                <SliderContainer>
                  <Slider
                    min={0}
                    max={1}
                    stepSize={0.1}
                    value={effects.background.opacity}
                    onChange={(value) => updateEffect('background', { opacity: value })}
                    showTrackFill={false}
                  />
                </SliderContainer>
              </ControlGroup>
              
              <ControlGroup>
                <Label>Radius</Label>
                <SliderContainer>
                  <Slider
                    min={0}
                    max={20}
                    stepSize={1}
                    value={effects.background.radius}
                    onChange={(value) => updateEffect('background', { radius: value })}
                    showTrackFill={false}
                  />
                </SliderContainer>
              </ControlGroup>
            </ControlRow>

            <ControlRow>
              <Label>Color</Label>
              <ColorPicker
                color={effects.background.color}
                onChange={(color) => updateEffect('background', { color })}
                showAlpha={false}
              />
            </ControlRow>
          </>
        )}
      </EffectSection>
    </EffectsContainer>
  );
};

TextEffects.displayName = 'TextEffects';

// Export default effects for use in other components
export { DEFAULT_EFFECTS };