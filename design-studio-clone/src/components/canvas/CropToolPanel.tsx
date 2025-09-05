import React, { useState, useCallback, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { styled } from '@styles/goober-setup';
import { 
  Dialog, 
  Button, 
  ButtonGroup,
  Intent,
  Card,
  FormGroup,
  NumericInput,
  Switch
} from '@blueprintjs/core';
import { Stage, Layer, Rect, Line, Circle, Group } from 'react-konva';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CanvasElement, ImageElement } from '@/types/canvas';

interface CropToolPanelProps {
  isOpen: boolean;
  onClose: () => void;
  element: CanvasElement | null;
  onApplyCrop: (cropData: CropData) => void;
}

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  aspectRatioLocked: boolean;
  aspectRatio?: number;
}

interface CropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CropContainer = styled.div<{ theme: any }>`
  .bp5-dialog-body {
    padding: 16px;
    max-height: 70vh;
    overflow-y: auto;
  }
`;

const CropCanvasContainer = styled.div<{ theme: any }>`
  width: 400px;
  height: 300px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.secondaryBg};
  margin-bottom: 16px;
  position: relative;
`;

const AspectRatioButton = styled(Button)<{ theme: any; active: boolean }>`
  min-width: 60px !important;
  margin: 2px !important;
  background: ${props => props.active ? props.theme.colors.accent : 'transparent'} !important;
  border-color: ${props => props.active ? props.theme.colors.accent : props.theme.colors.border} !important;
  color: ${props => props.active ? 'white' : props.theme.colors.text} !important;
  
  &:hover {
    background: ${props => props.active ? props.theme.colors.accent : props.theme.colors.accent}40 !important;
  }
`;

const ControlSection = styled.div`
  margin-bottom: 16px;
`;

const CropHandle = styled.div<{ position: string }>`
  position: absolute;
  width: 10px;
  height: 10px;
  background: white;
  border: 2px solid #007bff;
  border-radius: 2px;
  cursor: ${props => {
    switch (props.position) {
      case 'nw': return 'nw-resize';
      case 'ne': return 'ne-resize';
      case 'sw': return 'sw-resize';
      case 'se': return 'se-resize';
      case 'n': return 'n-resize';
      case 's': return 's-resize';
      case 'w': return 'w-resize';
      case 'e': return 'e-resize';
      default: return 'grab';
    }
  }};
  z-index: 10;
`;

// Predefined aspect ratios
const aspectRatios = [
  { label: 'Free', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4/3 },
  { label: '16:9', ratio: 16/9 },
  { label: '3:2', ratio: 3/2 },
  { label: '5:4', ratio: 5/4 },
  { label: '2:3', ratio: 2/3 },
  { label: '9:16', ratio: 9/16 },
];

export const CropToolPanel: React.FC<CropToolPanelProps> = observer(({
  isOpen,
  onClose,
  element,
  onApplyCrop,
}) => {
  const { theme } = useTheme();
  const stageRef = useRef<any>(null);
  
  // Initialize crop bounds based on element
  const initialBounds = useCallback((): CropBounds => {
    if (!element) return { x: 50, y: 50, width: 200, height: 150 };
    return {
      x: 20,
      y: 20,
      width: Math.min(300, element.width * 0.8),
      height: Math.min(200, element.height * 0.8),
    };
  }, [element]);

  const [cropBounds, setCropBounds] = useState<CropBounds>(initialBounds);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number | null>(null);
  const [aspectRatioLocked, setAspectRatioLocked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null);
  const [dragHandle, setDragHandle] = useState<string>('');

  const imageSource = React.useMemo(() => {
    if (!element || element.type !== 'image') return null;
    const imageElement = element as ImageElement;
    return imageElement.src || null;
  }, [element]);

  const constrainToAspectRatio = useCallback((bounds: CropBounds, aspectRatio: number | null): CropBounds => {
    if (!aspectRatio) return bounds;
    
    const currentRatio = bounds.width / bounds.height;
    if (Math.abs(currentRatio - aspectRatio) < 0.01) return bounds;
    
    // Adjust height to match aspect ratio
    const newHeight = bounds.width / aspectRatio;
    return {
      ...bounds,
      height: newHeight,
    };
  }, []);

  const updateCropBounds = useCallback((newBounds: Partial<CropBounds>) => {
    setCropBounds(prev => {
      const updated = { ...prev, ...newBounds };
      
      // Constrain to canvas bounds
      const maxX = 380 - updated.width;
      const maxY = 280 - updated.height;
      
      updated.x = Math.max(10, Math.min(maxX, updated.x));
      updated.y = Math.max(10, Math.min(maxY, updated.y));
      updated.width = Math.max(20, Math.min(360, updated.width));
      updated.height = Math.max(15, Math.min(260, updated.height));
      
      // Apply aspect ratio constraint if locked
      if (aspectRatioLocked && selectedAspectRatio) {
        return constrainToAspectRatio(updated, selectedAspectRatio);
      }
      
      return updated;
    });
  }, [aspectRatioLocked, selectedAspectRatio, constrainToAspectRatio]);

  const handleAspectRatioSelect = useCallback((ratio: number | null, label: string) => {
    setSelectedAspectRatio(ratio);
    setAspectRatioLocked(ratio !== null);
    
    if (ratio) {
      const constrainedBounds = constrainToAspectRatio(cropBounds, ratio);
      setCropBounds(constrainedBounds);
    }
  }, [cropBounds, constrainToAspectRatio]);

  const handleMouseDown = useCallback((e: any, mode: 'move' | 'resize', handle?: string) => {
    e.cancelBubble = true;
    setIsDragging(true);
    setDragMode(mode);
    setDragHandle(handle || '');
    
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const startPos = { x: pointer.x, y: pointer.y };
    const startBounds = { ...cropBounds };

    const handleMouseMove = (e: any) => {
      const newPointer = stage.getPointerPosition();
      const deltaX = newPointer.x - startPos.x;
      const deltaY = newPointer.y - startPos.y;

      if (mode === 'move') {
        updateCropBounds({
          x: startBounds.x + deltaX,
          y: startBounds.y + deltaY,
        });
      } else if (mode === 'resize') {
        let newBounds = { ...startBounds };
        
        switch (handle) {
          case 'nw':
            newBounds.x = startBounds.x + deltaX;
            newBounds.y = startBounds.y + deltaY;
            newBounds.width = startBounds.width - deltaX;
            newBounds.height = startBounds.height - deltaY;
            break;
          case 'ne':
            newBounds.y = startBounds.y + deltaY;
            newBounds.width = startBounds.width + deltaX;
            newBounds.height = startBounds.height - deltaY;
            break;
          case 'sw':
            newBounds.x = startBounds.x + deltaX;
            newBounds.width = startBounds.width - deltaX;
            newBounds.height = startBounds.height + deltaY;
            break;
          case 'se':
            newBounds.width = startBounds.width + deltaX;
            newBounds.height = startBounds.height + deltaY;
            break;
          case 'n':
            newBounds.y = startBounds.y + deltaY;
            newBounds.height = startBounds.height - deltaY;
            break;
          case 's':
            newBounds.height = startBounds.height + deltaY;
            break;
          case 'w':
            newBounds.x = startBounds.x + deltaX;
            newBounds.width = startBounds.width - deltaX;
            break;
          case 'e':
            newBounds.width = startBounds.width + deltaX;
            break;
        }
        
        updateCropBounds(newBounds);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragMode(null);
      setDragHandle('');
      stage.off('mousemove', handleMouseMove);
      stage.off('mouseup', handleMouseUp);
    };

    stage.on('mousemove', handleMouseMove);
    stage.on('mouseup', handleMouseUp);
  }, [cropBounds, updateCropBounds]);

  const resetCrop = useCallback(() => {
    setCropBounds(initialBounds());
    setSelectedAspectRatio(null);
    setAspectRatioLocked(false);
  }, [initialBounds]);

  const handleApply = useCallback(() => {
    const cropData: CropData = {
      x: cropBounds.x,
      y: cropBounds.y,
      width: cropBounds.width,
      height: cropBounds.height,
      rotation: 0,
      aspectRatioLocked,
      aspectRatio: selectedAspectRatio || undefined,
    };

    onApplyCrop(cropData);
    onClose();
  }, [cropBounds, aspectRatioLocked, selectedAspectRatio, onApplyCrop, onClose]);

  // Render crop handles
  const renderCropHandles = () => {
    const handles = [
      { id: 'nw', x: cropBounds.x - 5, y: cropBounds.y - 5 },
      { id: 'ne', x: cropBounds.x + cropBounds.width - 5, y: cropBounds.y - 5 },
      { id: 'sw', x: cropBounds.x - 5, y: cropBounds.y + cropBounds.height - 5 },
      { id: 'se', x: cropBounds.x + cropBounds.width - 5, y: cropBounds.y + cropBounds.height - 5 },
      { id: 'n', x: cropBounds.x + cropBounds.width / 2 - 5, y: cropBounds.y - 5 },
      { id: 's', x: cropBounds.x + cropBounds.width / 2 - 5, y: cropBounds.y + cropBounds.height - 5 },
      { id: 'w', x: cropBounds.x - 5, y: cropBounds.y + cropBounds.height / 2 - 5 },
      { id: 'e', x: cropBounds.x + cropBounds.width - 5, y: cropBounds.y + cropBounds.height / 2 - 5 },
    ];

    return handles.map(handle => (
      <Rect
        key={handle.id}
        x={handle.x}
        y={handle.y}
        width={10}
        height={10}
        fill="white"
        stroke="#007bff"
        strokeWidth={2}
        onMouseDown={(e) => handleMouseDown(e, 'resize', handle.id)}
      />
    ));
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Crop Image"
      style={{ width: '600px' }}
    >
      <CropContainer theme={theme}>
        <div className="bp5-dialog-body">
          {/* Aspect Ratio Selection */}
          <ControlSection>
            <h4 style={{ marginBottom: '8px', color: theme.colors.text }}>
              Aspect Ratio
            </h4>
            <ButtonGroup>
              {aspectRatios.map(({ label, ratio }) => (
                <AspectRatioButton
                  key={label}
                  theme={theme}
                  active={selectedAspectRatio === ratio}
                  small
                  onClick={() => handleAspectRatioSelect(ratio, label)}
                >
                  {label}
                </AspectRatioButton>
              ))}
            </ButtonGroup>
          </ControlSection>

          {/* Crop Area */}
          <ControlSection>
            <h4 style={{ marginBottom: '8px', color: theme.colors.text }}>
              Crop Area
            </h4>
            <CropCanvasContainer theme={theme}>
              <Stage width={400} height={300} ref={stageRef}>
                <Layer>
                  {/* Background image simulation */}
                  <Rect
                    x={0}
                    y={0}
                    width={400}
                    height={300}
                    fill={`${theme.colors.accent}20`}
                    stroke={theme.colors.border}
                    strokeWidth={1}
                  />
                  
                  {/* Overlay - darkened area outside crop */}
                  <Group>
                    {/* Top */}
                    <Rect
                      x={0}
                      y={0}
                      width={400}
                      height={cropBounds.y}
                      fill="rgba(0, 0, 0, 0.5)"
                    />
                    {/* Bottom */}
                    <Rect
                      x={0}
                      y={cropBounds.y + cropBounds.height}
                      width={400}
                      height={300 - (cropBounds.y + cropBounds.height)}
                      fill="rgba(0, 0, 0, 0.5)"
                    />
                    {/* Left */}
                    <Rect
                      x={0}
                      y={cropBounds.y}
                      width={cropBounds.x}
                      height={cropBounds.height}
                      fill="rgba(0, 0, 0, 0.5)"
                    />
                    {/* Right */}
                    <Rect
                      x={cropBounds.x + cropBounds.width}
                      y={cropBounds.y}
                      width={400 - (cropBounds.x + cropBounds.width)}
                      height={cropBounds.height}
                      fill="rgba(0, 0, 0, 0.5)"
                    />
                  </Group>

                  {/* Crop selection rectangle */}
                  <Rect
                    x={cropBounds.x}
                    y={cropBounds.y}
                    width={cropBounds.width}
                    height={cropBounds.height}
                    stroke="#007bff"
                    strokeWidth={2}
                    fill="transparent"
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                    draggable={false}
                  />

                  {/* Grid lines */}
                  <Group>
                    {/* Vertical lines */}
                    <Line
                      points={[
                        cropBounds.x + cropBounds.width / 3, cropBounds.y,
                        cropBounds.x + cropBounds.width / 3, cropBounds.y + cropBounds.height
                      ]}
                      stroke="#007bff"
                      strokeWidth={1}
                      opacity={0.5}
                    />
                    <Line
                      points={[
                        cropBounds.x + (cropBounds.width * 2) / 3, cropBounds.y,
                        cropBounds.x + (cropBounds.width * 2) / 3, cropBounds.y + cropBounds.height
                      ]}
                      stroke="#007bff"
                      strokeWidth={1}
                      opacity={0.5}
                    />
                    {/* Horizontal lines */}
                    <Line
                      points={[
                        cropBounds.x, cropBounds.y + cropBounds.height / 3,
                        cropBounds.x + cropBounds.width, cropBounds.y + cropBounds.height / 3
                      ]}
                      stroke="#007bff"
                      strokeWidth={1}
                      opacity={0.5}
                    />
                    <Line
                      points={[
                        cropBounds.x, cropBounds.y + (cropBounds.height * 2) / 3,
                        cropBounds.x + cropBounds.width, cropBounds.y + (cropBounds.height * 2) / 3
                      ]}
                      stroke="#007bff"
                      strokeWidth={1}
                      opacity={0.5}
                    />
                  </Group>

                  {/* Resize handles */}
                  {renderCropHandles()}
                </Layer>
              </Stage>
            </CropCanvasContainer>
          </ControlSection>

          {/* Manual Controls */}
          <ControlSection>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
              <FormGroup label="X">
                <NumericInput
                  value={Math.round(cropBounds.x)}
                  onValueChange={(value) => updateCropBounds({ x: value })}
                  min={0}
                  max={380}
                  small
                />
              </FormGroup>
              <FormGroup label="Y">
                <NumericInput
                  value={Math.round(cropBounds.y)}
                  onValueChange={(value) => updateCropBounds({ y: value })}
                  min={0}
                  max={280}
                  small
                />
              </FormGroup>
              <FormGroup label="Width">
                <NumericInput
                  value={Math.round(cropBounds.width)}
                  onValueChange={(value) => updateCropBounds({ width: value })}
                  min={20}
                  max={380}
                  small
                />
              </FormGroup>
              <FormGroup label="Height">
                <NumericInput
                  value={Math.round(cropBounds.height)}
                  onValueChange={(value) => updateCropBounds({ height: value })}
                  min={15}
                  max={280}
                  small
                />
              </FormGroup>
            </div>
          </ControlSection>

          {/* Options */}
          <ControlSection>
            <Switch
              checked={aspectRatioLocked}
              onChange={(e) => setAspectRatioLocked(e.currentTarget.checked)}
              label="Lock Aspect Ratio"
            />
          </ControlSection>
        </div>

        <div className="bp5-dialog-footer">
          <div className="bp5-dialog-footer-actions">
            <Button onClick={resetCrop} icon="refresh">
              Reset
            </Button>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              intent={Intent.PRIMARY}
              onClick={handleApply}
              disabled={!element}
            >
              Apply Crop
            </Button>
          </div>
        </div>
      </CropContainer>
    </Dialog>
  );
});

CropToolPanel.displayName = 'CropToolPanel';