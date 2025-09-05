import React, { useState, useCallback, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { styled } from '@styles/goober-setup';
import { 
  Dialog, 
  Button, 
  Card,
  ButtonGroup,
  Intent,
  Slider,
  FormGroup,
  RadioGroup,
  Radio
} from '@blueprintjs/core';
import { Stage, Layer, Circle, Rect, RegularPolygon, Star, Line, Group } from 'react-konva';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CanvasElement } from '@/types/canvas';

interface MaskingToolPanelProps {
  isOpen: boolean;
  onClose: () => void;
  element: CanvasElement | null;
  onApplyMask: (maskData: MaskData) => void;
}

interface MaskData {
  type: 'shape' | 'custom';
  shape?: 'circle' | 'rectangle' | 'triangle' | 'star' | 'heart';
  customPath?: string;
  featherRadius: number;
  invert: boolean;
}

const MaskingContainer = styled.div<{ theme: any }>`
  .bp5-dialog-body {
    padding: 16px;
    max-height: 70vh;
    overflow-y: auto;
  }
`;

const PreviewContainer = styled.div<{ theme: any }>`
  width: 300px;
  height: 200px;
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

const ShapeButton = styled(Button)<{ theme: any; active: boolean }>`
  width: 60px !important;
  height: 60px !important;
  margin: 4px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: ${props => props.active ? props.theme.colors.accent : 'transparent'} !important;
  border: 2px solid ${props => props.active ? props.theme.colors.accent : props.theme.colors.border} !important;
  
  &:hover {
    background: ${props => props.theme.colors.accent}40 !important;
  }
  
  .bp5-icon {
    font-size: 24px !important;
  }
`;

const DrawingCanvas = styled.div<{ theme: any }>`
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  cursor: crosshair;
  
  &.drawing {
    cursor: crosshair;
  }
`;

const ControlSection = styled.div`
  margin-bottom: 16px;
`;

const shapeOptions = [
  { id: 'circle', icon: 'full-circle', label: 'Circle' },
  { id: 'rectangle', icon: 'square', label: 'Rectangle' },
  { id: 'triangle', icon: 'caret-up', label: 'Triangle' },
  { id: 'star', icon: 'star', label: 'Star' },
  { id: 'heart', icon: 'heart', label: 'Heart' },
];

export const MaskingToolPanel: React.FC<MaskingToolPanelProps> = observer(({
  isOpen,
  onClose,
  element,
  onApplyMask,
}) => {
  const { theme } = useTheme();
  const [maskType, setMaskType] = useState<'shape' | 'custom'>('shape');
  const [selectedShape, setSelectedShape] = useState<string>('circle');
  const [featherRadius, setFeatherRadius] = useState(0);
  const [invert, setInvert] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [customPath, setCustomPath] = useState<string>('');
  const [drawingPoints, setDrawingPoints] = useState<number[]>([]);
  
  const stageRef = useRef(null);
  const isDrawingRef = useRef(false);

  const renderShapePreview = () => {
    const centerX = 150;
    const centerY = 100;
    const size = 60;

    const shapeProps = {
      x: centerX,
      y: centerY,
      fill: theme.colors.accent,
      stroke: theme.colors.text,
      strokeWidth: 2,
      opacity: 0.7,
    };

    switch (selectedShape) {
      case 'circle':
        return <Circle {...shapeProps} radius={size / 2} />;
      case 'rectangle':
        return (
          <Rect
            {...shapeProps}
            width={size}
            height={size}
            x={centerX - size / 2}
            y={centerY - size / 2}
          />
        );
      case 'triangle':
        return (
          <RegularPolygon
            {...shapeProps}
            sides={3}
            radius={size / 2}
          />
        );
      case 'star':
        return (
          <Star
            {...shapeProps}
            numPoints={5}
            innerRadius={size / 4}
            outerRadius={size / 2}
          />
        );
      case 'heart':
        // Custom heart shape using Line
        const heartPoints = [
          centerX, centerY - 20,
          centerX - 25, centerY - 35,
          centerX - 40, centerY - 20,
          centerX - 40, centerY - 5,
          centerX - 25, centerY + 10,
          centerX, centerY + 30,
          centerX + 25, centerY + 10,
          centerX + 40, centerY - 5,
          centerX + 40, centerY - 20,
          centerX + 25, centerY - 35,
          centerX, centerY - 20,
        ];
        return (
          <Line
            points={heartPoints}
            fill={theme.colors.accent}
            stroke={theme.colors.text}
            strokeWidth={2}
            closed
            opacity={0.7}
          />
        );
      default:
        return null;
    }
  };

  const handleMouseDown = useCallback((e: any) => {
    if (maskType !== 'custom') return;
    
    isDrawingRef.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setDrawingPoints([pos.x, pos.y]);
  }, [maskType]);

  const handleMouseMove = useCallback((e: any) => {
    if (!isDrawingRef.current) return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setDrawingPoints(prev => [...prev, point.x, point.y]);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const clearCustomPath = useCallback(() => {
    setDrawingPoints([]);
    setCustomPath('');
  }, []);

  const handleApply = useCallback(() => {
    const maskData: MaskData = {
      type: maskType,
      featherRadius,
      invert,
    };

    if (maskType === 'shape') {
      maskData.shape = selectedShape as any;
    } else {
      maskData.customPath = customPath;
    }

    onApplyMask(maskData);
    onClose();
  }, [maskType, selectedShape, customPath, featherRadius, invert, onApplyMask, onClose]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Apply Mask"
      style={{ width: '500px' }}
    >
      <MaskingContainer theme={theme}>
        <div className="bp5-dialog-body">
          {/* Mask Type Selection */}
          <ControlSection>
            <RadioGroup
              label="Mask Type"
              onChange={(e) => setMaskType(e.currentTarget.value as 'shape' | 'custom')}
              selectedValue={maskType}
              inline
            >
              <Radio label="Shape Mask" value="shape" />
              <Radio label="Custom Mask" value="custom" />
            </RadioGroup>
          </ControlSection>

          {/* Shape Selection */}
          {maskType === 'shape' && (
            <ControlSection>
              <h4 style={{ marginBottom: '8px', color: theme.colors.text }}>
                Choose Shape
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {shapeOptions.map((shape) => (
                  <ShapeButton
                    key={shape.id}
                    theme={theme}
                    active={selectedShape === shape.id}
                    icon={shape.icon as any}
                    onClick={() => setSelectedShape(shape.id)}
                    title={shape.label}
                  />
                ))}
              </div>
            </ControlSection>
          )}

          {/* Custom Drawing Area */}
          {maskType === 'custom' && (
            <ControlSection>
              <h4 style={{ marginBottom: '8px', color: theme.colors.text }}>
                Draw Custom Mask
              </h4>
              <DrawingCanvas theme={theme} className={isDrawing ? 'drawing' : ''}>
                <Stage
                  width={300}
                  height={200}
                  ref={stageRef}
                  onMouseDown={handleMouseDown}
                  onMousemove={handleMouseMove}
                  onMouseup={handleMouseUp}
                >
                  <Layer>
                    {drawingPoints.length > 4 && (
                      <Line
                        points={drawingPoints}
                        stroke={theme.colors.accent}
                        strokeWidth={3}
                        tension={0.5}
                        lineCap="round"
                        globalCompositeOperation="source-over"
                      />
                    )}
                  </Layer>
                </Stage>
              </DrawingCanvas>
              <Button
                icon="refresh"
                small
                onClick={clearCustomPath}
                style={{ marginTop: '8px' }}
              >
                Clear
              </Button>
            </ControlSection>
          )}

          {/* Preview */}
          <ControlSection>
            <h4 style={{ marginBottom: '8px', color: theme.colors.text }}>
              Preview
            </h4>
            <PreviewContainer theme={theme}>
              <Stage width={300} height={200}>
                <Layer>
                  {maskType === 'shape' && renderShapePreview()}
                  {maskType === 'custom' && drawingPoints.length > 4 && (
                    <Line
                      points={drawingPoints}
                      fill={`${theme.colors.accent}60`}
                      stroke={theme.colors.accent}
                      strokeWidth={2}
                      closed
                      tension={0.5}
                    />
                  )}
                </Layer>
              </Stage>
            </PreviewContainer>
          </ControlSection>

          {/* Mask Options */}
          <ControlSection>
            <FormGroup label="Feather Radius">
              <Slider
                min={0}
                max={20}
                stepSize={1}
                value={featherRadius}
                onChange={setFeatherRadius}
                labelStepSize={5}
              />
            </FormGroup>

            <FormGroup label="Invert Mask">
              <input
                type="checkbox"
                checked={invert}
                onChange={(e) => setInvert(e.target.checked)}
              />
            </FormGroup>
          </ControlSection>
        </div>

        <div className="bp5-dialog-footer">
          <div className="bp5-dialog-footer-actions">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              intent={Intent.PRIMARY}
              onClick={handleApply}
              disabled={!element || (maskType === 'custom' && drawingPoints.length < 6)}
            >
              Apply Mask
            </Button>
          </div>
        </div>
      </MaskingContainer>
    </Dialog>
  );
});

MaskingToolPanel.displayName = 'MaskingToolPanel';