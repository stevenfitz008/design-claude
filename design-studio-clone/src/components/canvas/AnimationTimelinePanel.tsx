import React, { useState, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { styled } from '@styles/goober-setup';
import { 
  Dialog, 
  Button, 
  ButtonGroup,
  Intent,
  Card,
  Slider,
  FormGroup,
  HTMLSelect,
  Switch,
  Tabs,
  Tab
} from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CanvasElement } from '@/types/canvas';

interface AnimationTimelinePanelProps {
  isOpen: boolean;
  onClose: () => void;
  element: CanvasElement | null;
  onApplyAnimation: (animationData: AnimationData) => void;
}

interface AnimationKeyframe {
  time: number; // 0-100 (percentage of duration)
  properties: {
    x?: number;
    y?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    opacity?: number;
  };
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce';
}

interface AnimationData {
  preset?: string;
  duration: number;
  delay: number;
  iterations: number;
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  keyframes: AnimationKeyframe[];
  autoplay: boolean;
}

const AnimationContainer = styled.div<{ theme: any }>`
  .bp5-dialog-body {
    padding: 16px;
    max-height: 70vh;
    overflow-y: auto;
  }
`;

const TimelineContainer = styled.div<{ theme: any }>`
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  background: ${props => props.theme.colors.secondaryBg};
  padding: 16px;
  margin: 16px 0;
  min-height: 150px;
`;

const TimelineTrack = styled.div<{ theme: any }>`
  height: 30px;
  background: ${props => props.theme.colors.primaryBg};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  margin: 8px 0;
  position: relative;
  overflow: hidden;
`;

const Keyframe = styled.div<{ theme: any; position: number; active: boolean }>`
  position: absolute;
  top: 5px;
  left: ${props => props.position}%;
  width: 8px;
  height: 20px;
  background: ${props => props.active ? props.theme.colors.accent : '#666'};
  border-radius: 2px;
  cursor: pointer;
  transform: translateX(-50%);
  border: 2px solid ${props => props.active ? 'white' : 'transparent'};
  
  &:hover {
    background: ${props => props.theme.colors.accent};
    transform: translateX(-50%) scale(1.2);
  }
`;

const PresetButton = styled(Button)<{ theme: any; active: boolean }>`
  margin: 2px !important;
  min-width: 80px !important;
  font-size: 11px !important;
  background: ${props => props.active ? props.theme.colors.accent : 'transparent'} !important;
  color: ${props => props.active ? 'white' : props.theme.colors.text} !important;
`;

const PropertyControl = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 8px 0;
`;

// Animation presets
const animationPresets = {
  'Fade In': {
    keyframes: [
      { time: 0, properties: { opacity: 0 }, easing: 'easeOut' },
      { time: 100, properties: { opacity: 1 }, easing: 'easeOut' },
    ],
    duration: 1000,
  },
  'Slide In Left': {
    keyframes: [
      { time: 0, properties: { x: -100, opacity: 0 }, easing: 'easeOut' },
      { time: 100, properties: { x: 0, opacity: 1 }, easing: 'easeOut' },
    ],
    duration: 800,
  },
  'Slide In Right': {
    keyframes: [
      { time: 0, properties: { x: 100, opacity: 0 }, easing: 'easeOut' },
      { time: 100, properties: { x: 0, opacity: 1 }, easing: 'easeOut' },
    ],
    duration: 800,
  },
  'Scale In': {
    keyframes: [
      { time: 0, properties: { scaleX: 0, scaleY: 0, opacity: 0 }, easing: 'bounce' },
      { time: 100, properties: { scaleX: 1, scaleY: 1, opacity: 1 }, easing: 'bounce' },
    ],
    duration: 1200,
  },
  'Rotate In': {
    keyframes: [
      { time: 0, properties: { rotation: -180, scaleX: 0, scaleY: 0, opacity: 0 }, easing: 'easeOut' },
      { time: 100, properties: { rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, easing: 'easeOut' },
    ],
    duration: 1000,
  },
  'Bounce': {
    keyframes: [
      { time: 0, properties: { scaleY: 1 }, easing: 'bounce' },
      { time: 25, properties: { scaleY: 1.2 }, easing: 'bounce' },
      { time: 50, properties: { scaleY: 0.8 }, easing: 'bounce' },
      { time: 75, properties: { scaleY: 1.1 }, easing: 'bounce' },
      { time: 100, properties: { scaleY: 1 }, easing: 'bounce' },
    ],
    duration: 1000,
  },
  'Pulse': {
    keyframes: [
      { time: 0, properties: { scaleX: 1, scaleY: 1 }, easing: 'easeInOut' },
      { time: 50, properties: { scaleX: 1.1, scaleY: 1.1 }, easing: 'easeInOut' },
      { time: 100, properties: { scaleX: 1, scaleY: 1 }, easing: 'easeInOut' },
    ],
    duration: 1000,
  },
};

const easingOptions = [
  { value: 'linear', label: 'Linear' },
  { value: 'easeIn', label: 'Ease In' },
  { value: 'easeOut', label: 'Ease Out' },
  { value: 'easeInOut', label: 'Ease In Out' },
  { value: 'bounce', label: 'Bounce' },
];

const directionOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'reverse', label: 'Reverse' },
  { value: 'alternate', label: 'Alternate' },
  { value: 'alternate-reverse', label: 'Alternate Reverse' },
];

export const AnimationTimelinePanel: React.FC<AnimationTimelinePanelProps> = observer(({
  isOpen,
  onClose,
  element,
  onApplyAnimation,
}) => {
  const { theme } = useTheme();
  
  const [selectedPreset, setSelectedPreset] = useState<string>('Fade In');
  const [duration, setDuration] = useState(1000);
  const [delay, setDelay] = useState(0);
  const [iterations, setIterations] = useState(1);
  const [direction, setDirection] = useState<'normal' | 'reverse' | 'alternate' | 'alternate-reverse'>('normal');
  const [autoplay, setAutoplay] = useState(true);
  const [keyframes, setKeyframes] = useState<AnimationKeyframe[]>([]);
  const [selectedKeyframe, setSelectedKeyframe] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Initialize keyframes when preset changes
  React.useEffect(() => {
    if (selectedPreset && animationPresets[selectedPreset as keyof typeof animationPresets]) {
      const preset = animationPresets[selectedPreset as keyof typeof animationPresets];
      setKeyframes(preset.keyframes as AnimationKeyframe[]);
      setDuration(preset.duration);
    }
  }, [selectedPreset]);

  const handlePresetSelect = useCallback((presetName: string) => {
    setSelectedPreset(presetName);
    const preset = animationPresets[presetName as keyof typeof animationPresets];
    if (preset) {
      setKeyframes(preset.keyframes as AnimationKeyframe[]);
      setDuration(preset.duration);
    }
  }, []);

  const addKeyframe = useCallback(() => {
    const newKeyframe: AnimationKeyframe = {
      time: Math.min(100, Math.max(0, currentTime)),
      properties: {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
      },
      easing: 'easeOut',
    };
    
    setKeyframes(prev => [...prev, newKeyframe].sort((a, b) => a.time - b.time));
  }, [currentTime]);

  const updateKeyframe = useCallback((index: number, updates: Partial<AnimationKeyframe>) => {
    setKeyframes(prev => prev.map((kf, i) => 
      i === index ? { ...kf, ...updates } : kf
    ));
  }, []);

  const deleteKeyframe = useCallback((index: number) => {
    setKeyframes(prev => prev.filter((_, i) => i !== index));
    setSelectedKeyframe(-1);
  }, []);

  const playPreview = useCallback(() => {
    setIsPlaying(true);
    setCurrentTime(0);
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setCurrentTime(progress * 100);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
      }
    };
    
    requestAnimationFrame(animate);
  }, [duration]);

  const stopPreview = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleApply = useCallback(() => {
    const animationData: AnimationData = {
      preset: selectedPreset,
      duration,
      delay,
      iterations,
      direction,
      keyframes,
      autoplay,
    };

    onApplyAnimation(animationData);
    onClose();
  }, [selectedPreset, duration, delay, iterations, direction, keyframes, autoplay, onApplyAnimation, onClose]);

  const renderTimelineControls = () => (
    <div>
      <TimelineContainer theme={theme}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, color: theme.colors.text }}>Timeline</h4>
          <ButtonGroup size="small">
            <Button
              icon={isPlaying ? "pause" : "play"}
              onClick={isPlaying ? stopPreview : playPreview}
              intent={isPlaying ? Intent.WARNING : Intent.SUCCESS}
            />
            <Button icon="refresh" onClick={() => setCurrentTime(0)} />
            <Button icon="plus" onClick={addKeyframe} />
          </ButtonGroup>
        </div>

        {/* Timeline track */}
        <TimelineTrack theme={theme}>
          {/* Progress indicator */}
          <div
            style={{
              position: 'absolute',
              left: `${currentTime}%`,
              top: 0,
              width: '2px',
              height: '100%',
              background: theme.colors.accent,
              zIndex: 10,
            }}
          />
          
          {/* Keyframes */}
          {keyframes.map((kf, index) => (
            <Keyframe
              key={index}
              theme={theme}
              position={kf.time}
              active={selectedKeyframe === index}
              onClick={() => setSelectedKeyframe(index)}
            />
          ))}
        </TimelineTrack>

        {/* Time markers */}
        <div style={{ position: 'relative', height: '20px' }}>
          {[0, 25, 50, 75, 100].map(time => (
            <div
              key={time}
              style={{
                position: 'absolute',
                left: `${time}%`,
                transform: 'translateX(-50%)',
                fontSize: '11px',
                color: theme.colors.textMuted,
              }}
            >
              {time}%
            </div>
          ))}
        </div>
      </TimelineContainer>

      {/* Keyframe properties */}
      {selectedKeyframe >= 0 && (
        <Card style={{ marginTop: '16px' }}>
          <h5>Keyframe Properties</h5>
          <PropertyControl>
            <FormGroup label="Time (%)">
              <Slider
                min={0}
                max={100}
                value={keyframes[selectedKeyframe]?.time || 0}
                onChange={(time) => updateKeyframe(selectedKeyframe, { time })}
                labelStepSize={25}
              />
            </FormGroup>
            <FormGroup label="Easing">
              <HTMLSelect
                value={keyframes[selectedKeyframe]?.easing || 'easeOut'}
                onChange={(e) => updateKeyframe(selectedKeyframe, { easing: e.target.value as any })}
                options={easingOptions}
              />
            </FormGroup>
          </PropertyControl>

          <h6>Transform Properties</h6>
          <PropertyControl>
            <FormGroup label="X Position">
              <Slider
                min={-200}
                max={200}
                value={keyframes[selectedKeyframe]?.properties.x || 0}
                onChange={(x) => updateKeyframe(selectedKeyframe, { 
                  properties: { ...keyframes[selectedKeyframe].properties, x }
                })}
              />
            </FormGroup>
            <FormGroup label="Y Position">
              <Slider
                min={-200}
                max={200}
                value={keyframes[selectedKeyframe]?.properties.y || 0}
                onChange={(y) => updateKeyframe(selectedKeyframe, { 
                  properties: { ...keyframes[selectedKeyframe].properties, y }
                })}
              />
            </FormGroup>
            <FormGroup label="Scale X">
              <Slider
                min={0}
                max={3}
                stepSize={0.1}
                value={keyframes[selectedKeyframe]?.properties.scaleX || 1}
                onChange={(scaleX) => updateKeyframe(selectedKeyframe, { 
                  properties: { ...keyframes[selectedKeyframe].properties, scaleX }
                })}
              />
            </FormGroup>
            <FormGroup label="Scale Y">
              <Slider
                min={0}
                max={3}
                stepSize={0.1}
                value={keyframes[selectedKeyframe]?.properties.scaleY || 1}
                onChange={(scaleY) => updateKeyframe(selectedKeyframe, { 
                  properties: { ...keyframes[selectedKeyframe].properties, scaleY }
                })}
              />
            </FormGroup>
            <FormGroup label="Rotation">
              <Slider
                min={-360}
                max={360}
                value={keyframes[selectedKeyframe]?.properties.rotation || 0}
                onChange={(rotation) => updateKeyframe(selectedKeyframe, { 
                  properties: { ...keyframes[selectedKeyframe].properties, rotation }
                })}
              />
            </FormGroup>
            <FormGroup label="Opacity">
              <Slider
                min={0}
                max={1}
                stepSize={0.1}
                value={keyframes[selectedKeyframe]?.properties.opacity || 1}
                onChange={(opacity) => updateKeyframe(selectedKeyframe, { 
                  properties: { ...keyframes[selectedKeyframe].properties, opacity }
                })}
              />
            </FormGroup>
          </PropertyControl>

          <Button
            icon="trash"
            intent={Intent.DANGER}
            onClick={() => deleteKeyframe(selectedKeyframe)}
            style={{ marginTop: '8px' }}
          >
            Delete Keyframe
          </Button>
        </Card>
      )}
    </div>
  );

  const renderPresets = () => (
    <div>
      <h4 style={{ marginBottom: '12px', color: theme.colors.text }}>Animation Presets</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '4px' }}>
        {Object.keys(animationPresets).map((presetName) => (
          <PresetButton
            key={presetName}
            theme={theme}
            active={selectedPreset === presetName}
            small
            outlined
            onClick={() => handlePresetSelect(presetName)}
          >
            {presetName}
          </PresetButton>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div>
      <PropertyControl>
        <FormGroup label="Duration (ms)">
          <Slider
            min={100}
            max={5000}
            stepSize={100}
            value={duration}
            onChange={setDuration}
            labelStepSize={1000}
          />
        </FormGroup>
        <FormGroup label="Delay (ms)">
          <Slider
            min={0}
            max={2000}
            stepSize={100}
            value={delay}
            onChange={setDelay}
            labelStepSize={500}
          />
        </FormGroup>
        <FormGroup label="Iterations">
          <Slider
            min={1}
            max={10}
            value={iterations}
            onChange={setIterations}
            labelRenderer={(val) => val === 10 ? '∞' : val.toString()}
          />
        </FormGroup>
        <FormGroup label="Direction">
          <HTMLSelect
            value={direction}
            onChange={(e) => setDirection(e.target.value as any)}
            options={directionOptions}
          />
        </FormGroup>
      </PropertyControl>
      
      <Switch
        checked={autoplay}
        onChange={(e) => setAutoplay(e.currentTarget.checked)}
        label="Autoplay on Load"
      />
    </div>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Animation Timeline"
      style={{ width: '700px' }}
    >
      <AnimationContainer theme={theme}>
        <div className="bp5-dialog-body">
          <Tabs defaultSelectedTabId="presets">
            <Tab id="presets" title="Presets" panel={renderPresets()} />
            <Tab id="timeline" title="Timeline" panel={renderTimelineControls()} />
            <Tab id="settings" title="Settings" panel={renderSettings()} />
          </Tabs>
        </div>

        <div className="bp5-dialog-footer">
          <div className="bp5-dialog-footer-actions">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              intent={Intent.PRIMARY}
              onClick={handleApply}
              disabled={!element || keyframes.length === 0}
            >
              Apply Animation
            </Button>
          </div>
        </div>
      </AnimationContainer>
    </Dialog>
  );
});

AnimationTimelinePanel.displayName = 'AnimationTimelinePanel';