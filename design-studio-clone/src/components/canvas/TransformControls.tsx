import React, { useMemo, useCallback, useState } from 'react';
import { Group, Circle, Rect, Line, Arc, Text } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '@/stores/canvasStore';
import type { SelectionBounds } from '@/types/canvas';

interface TransformControlsProps {
  bounds: SelectionBounds;
  onTransformStart?: () => void;
  onTransform?: (newBounds: SelectionBounds) => void;
  onTransformEnd?: () => void;
  enableRotation?: boolean;
  enableSnapping?: boolean;
}

const HANDLE_SIZE = 8;
const ROTATION_HANDLE_DISTANCE = 30;
const STROKE_WIDTH = 1.5;
const TRANSFORM_COLOR = '#007bff';
const HANDLE_FILL = '#ffffff';
const HANDLE_HOVER_COLOR = '#48aff0';
const HANDLE_ACTIVE_COLOR = '#2563eb';
const SNAP_THRESHOLD = 5;

// Handle cursor styles for different handle types
const getCursor = (handleType: string, mode: 'resize' | 'rotate') => {
  if (mode === 'rotate') return 'grab';
  
  switch (handleType) {
    case 'topLeft':
    case 'bottomRight':
      return 'nw-resize';
    case 'topRight':
    case 'bottomLeft':
      return 'ne-resize';
    case 'topCenter':
    case 'bottomCenter':
      return 'ns-resize';
    case 'leftCenter':
    case 'rightCenter':
      return 'ew-resize';
    default:
      return 'grab';
  }
};

export const TransformControls: React.FC<TransformControlsProps> = ({
  bounds,
  onTransformStart,
  onTransform,
  onTransformEnd,
  enableRotation = true,
  enableSnapping = true,
}) => {
  const { zoom, snapToGrid, gridSize, showGuides, elements, selection } = useCanvasStore();
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformMode, setTransformMode] = useState<'resize' | 'rotate' | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  
  // Scale handles based on zoom level
  const scaledHandleSize = HANDLE_SIZE / zoom;
  const scaledStrokeWidth = STROKE_WIDTH / zoom;
  const scaledRotationDistance = ROTATION_HANDLE_DISTANCE / zoom;

  // Calculate handle positions
  const handles = useMemo(() => {
    const { x, y, width, height, rotation = 0 } = bounds;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Convert rotation from degrees to radians
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Helper function to rotate point around center
    const rotatePoint = (px: number, py: number) => ({
      x: centerX + (px - centerX) * cos - (py - centerY) * sin,
      y: centerY + (px - centerX) * sin + (py - centerY) * cos,
    });

    const corners = {
      topLeft: rotatePoint(x, y),
      topRight: rotatePoint(x + width, y),
      bottomLeft: rotatePoint(x, y + height),
      bottomRight: rotatePoint(x + width, y + height),
    };

    const edges = {
      topCenter: rotatePoint(centerX, y),
      bottomCenter: rotatePoint(centerX, y + height),
      leftCenter: rotatePoint(x, centerY),
      rightCenter: rotatePoint(x + width, centerY),
    };

    // Rotation handle - positioned above the top edge
    const rotationHandle = rotatePoint(centerX, y - scaledRotationDistance);

    return { corners, edges, rotationHandle, center: { x: centerX, y: centerY } };
  }, [bounds, scaledRotationDistance]);

  // Snap helper function
  const snapValue = useCallback((value: number, threshold: number = SNAP_THRESHOLD) => {
    if (!enableSnapping) return value;
    
    if (snapToGrid) {
      const snapped = Math.round(value / gridSize) * gridSize;
      if (Math.abs(value - snapped) <= threshold / zoom) {
        return snapped;
      }
    }
    
    return value;
  }, [enableSnapping, snapToGrid, gridSize, zoom]);

  // Generate alignment guides
  const getAlignmentGuides = useCallback(() => {
    if (!showGuides || !enableSnapping || selection.length === 0) return [];

    const guides: Array<{ x1: number; y1: number; x2: number; y2: number; type: 'vertical' | 'horizontal' }> = [];
    const otherElements = elements.filter(el => !selection.includes(el.id));
    
    const { x, y, width, height } = bounds;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    otherElements.forEach(element => {
      const elCenterX = element.x + element.width / 2;
      const elCenterY = element.y + element.height / 2;

      // Vertical alignment guides
      if (Math.abs(centerX - elCenterX) <= SNAP_THRESHOLD / zoom) {
        guides.push({
          x1: elCenterX,
          y1: Math.min(y, element.y) - 50,
          x2: elCenterX,
          y2: Math.max(y + height, element.y + element.height) + 50,
          type: 'vertical'
        });
      }

      // Horizontal alignment guides
      if (Math.abs(centerY - elCenterY) <= SNAP_THRESHOLD / zoom) {
        guides.push({
          x1: Math.min(x, element.x) - 50,
          y1: elCenterY,
          x2: Math.max(x + width, element.x + element.width) + 50,
          y2: elCenterY,
          type: 'horizontal'
        });
      }
    });

    return guides;
  }, [showGuides, enableSnapping, selection, elements, bounds, zoom]);

  // Helper functions for handle interactions
  const handleMouseEnter = (handleType: string) => () => {
    setHoveredHandle(handleType);
  };

  const handleMouseLeave = () => {
    setHoveredHandle(null);
  };

  const getHandleStyle = (handleType: string) => {
    const isHovered = hoveredHandle === handleType;
    const isActive = activeHandle === handleType;
    
    return {
      fill: isActive ? HANDLE_ACTIVE_COLOR : (isHovered ? HANDLE_HOVER_COLOR : HANDLE_FILL),
      stroke: isActive ? HANDLE_ACTIVE_COLOR : TRANSFORM_COLOR,
      scale: isActive ? 1.2 : (isHovered ? 1.1 : 1),
    };
  };

  const getTooltipText = (handleType: string) => {
    if (handleType === 'rotate') return 'Rotate';
    
    const directions: Record<string, string> = {
      'topLeft': '↖ Resize',
      'topCenter': '↑ Resize',
      'topRight': '↗ Resize',
      'rightCenter': '→ Resize',
      'bottomRight': '↘ Resize',
      'bottomCenter': '↓ Resize',
      'bottomLeft': '↙ Resize',
      'leftCenter': '← Resize',
    };
    
    return directions[handleType] || 'Resize';
  };

  const handleMouseDown = (handleType: string, mode: 'resize' | 'rotate') => (e: any) => {
    e.cancelBubble = true;
    setIsTransforming(true);
    setTransformMode(mode);
    setActiveHandle(handleType);
    onTransformStart?.();
    
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const initialBounds = { ...bounds };
    const initialPointer = { ...pointer };

    const handleMouseMove = (e: any) => {
      const newPointer = stage.getPointerPosition();
      const deltaX = newPointer.x - initialPointer.x;
      const deltaY = newPointer.y - initialPointer.y;

      let newBounds = { ...initialBounds };

      if (mode === 'rotate') {
        // Calculate rotation
        const centerX = initialBounds.x + initialBounds.width / 2;
        const centerY = initialBounds.y + initialBounds.height / 2;
        
        const initialAngle = Math.atan2(initialPointer.y - centerY, initialPointer.x - centerX);
        const currentAngle = Math.atan2(newPointer.y - centerY, newPointer.x - centerX);
        
        let rotation = ((currentAngle - initialAngle) * 180) / Math.PI;
        
        // Snap to 15-degree increments when holding Shift
        if (e.evt?.shiftKey) {
          rotation = Math.round(rotation / 15) * 15;
        }
        
        newBounds.rotation = (initialBounds.rotation || 0) + rotation;
      } else {
        // Handle resize operations
        const constrainProportions = e.evt?.shiftKey;
        
        switch (handleType) {
          case 'topLeft':
            const newWidth = initialBounds.width - deltaX;
            const newHeight = initialBounds.height - deltaY;
            
            if (constrainProportions) {
              const aspectRatio = initialBounds.width / initialBounds.height;
              // Use minimum scale to maintain aspect ratio from corner
              const scaleX = newWidth / initialBounds.width;
              const scaleY = newHeight / initialBounds.height;
              const scale = Math.min(Math.abs(scaleX), Math.abs(scaleY));
              
              newBounds.width = Math.max(10, initialBounds.width * scale);
              newBounds.height = Math.max(10, initialBounds.height * scale);
              newBounds.x = initialBounds.x + initialBounds.width - newBounds.width;
              newBounds.y = initialBounds.y + initialBounds.height - newBounds.height;
            } else {
              newBounds.x = snapValue(initialBounds.x + deltaX);
              newBounds.y = snapValue(initialBounds.y + deltaY);
              newBounds.width = Math.max(10, newWidth);
              newBounds.height = Math.max(10, newHeight);
            }
            break;
            
          case 'topRight':
            if (constrainProportions) {
              const aspectRatio = initialBounds.width / initialBounds.height;
              const newWidthFromDelta = initialBounds.width + deltaX;
              const newHeightFromDelta = initialBounds.height - deltaY;
              // Use minimum scale to maintain aspect ratio from corner
              const scaleX = newWidthFromDelta / initialBounds.width;
              const scaleY = newHeightFromDelta / initialBounds.height;
              const scale = Math.min(Math.abs(scaleX), Math.abs(scaleY));
              
              newBounds.width = Math.max(10, initialBounds.width * scale);
              newBounds.height = Math.max(10, initialBounds.height * scale);
              newBounds.y = initialBounds.y + initialBounds.height - newBounds.height;
            } else {
              newBounds.y = snapValue(initialBounds.y + deltaY);
              newBounds.width = Math.max(10, initialBounds.width + deltaX);
              newBounds.height = Math.max(10, initialBounds.height - deltaY);
            }
            break;
            
          case 'bottomLeft':
            if (constrainProportions) {
              const aspectRatio = initialBounds.width / initialBounds.height;
              const newWidthFromDelta = initialBounds.width - deltaX;
              const newHeightFromDelta = initialBounds.height + deltaY;
              // Use minimum scale to maintain aspect ratio from corner
              const scaleX = newWidthFromDelta / initialBounds.width;
              const scaleY = newHeightFromDelta / initialBounds.height;
              const scale = Math.min(Math.abs(scaleX), Math.abs(scaleY));
              
              newBounds.width = Math.max(10, initialBounds.width * scale);
              newBounds.height = Math.max(10, initialBounds.height * scale);
              newBounds.x = initialBounds.x + initialBounds.width - newBounds.width;
            } else {
              newBounds.x = snapValue(initialBounds.x + deltaX);
              newBounds.width = Math.max(10, initialBounds.width - deltaX);
              newBounds.height = Math.max(10, initialBounds.height + deltaY);
            }
            break;
            
          case 'bottomRight':
            if (constrainProportions) {
              const aspectRatio = initialBounds.width / initialBounds.height;
              const newWidthFromDelta = initialBounds.width + deltaX;
              const newHeightFromDelta = initialBounds.height + deltaY;
              // Use minimum scale to maintain aspect ratio from corner
              const scaleX = newWidthFromDelta / initialBounds.width;
              const scaleY = newHeightFromDelta / initialBounds.height;
              const scale = Math.min(Math.abs(scaleX), Math.abs(scaleY));
              
              newBounds.width = Math.max(10, initialBounds.width * scale);
              newBounds.height = Math.max(10, initialBounds.height * scale);
            } else {
              newBounds.width = Math.max(10, initialBounds.width + deltaX);
              newBounds.height = Math.max(10, initialBounds.height + deltaY);
            }
            break;
            
          case 'topCenter':
            newBounds.y = snapValue(initialBounds.y + deltaY);
            newBounds.height = Math.max(10, initialBounds.height - deltaY);
            break;
            
          case 'bottomCenter':
            newBounds.height = Math.max(10, initialBounds.height + deltaY);
            break;
            
          case 'leftCenter':
            newBounds.x = snapValue(initialBounds.x + deltaX);
            newBounds.width = Math.max(10, initialBounds.width - deltaX);
            break;
            
          case 'rightCenter':
            newBounds.width = Math.max(10, initialBounds.width + deltaX);
            break;
        }
      }

      onTransform?.(newBounds);
    };

    const handleMouseUp = () => {
      stage.off('mousemove', handleMouseMove);
      stage.off('mouseup', handleMouseUp);
      setIsTransforming(false);
      setTransformMode(null);
      setActiveHandle(null);
      onTransformEnd?.();
    };

    stage.on('mousemove', handleMouseMove);
    stage.on('mouseup', handleMouseUp);
  };

  const alignmentGuides = getAlignmentGuides();

  return (
    <Group listening={false}>
      {/* Alignment guides */}
      {alignmentGuides.map((guide, index) => (
        <Line
          key={`guide-${index}`}
          points={[guide.x1, guide.y1, guide.x2, guide.y2]}
          stroke="#ff6b6b"
          strokeWidth={scaledStrokeWidth}
          dash={[4 / zoom, 4 / zoom]}
          listening={false}
        />
      ))}

      {/* Selection boundary */}
      <Rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        stroke={TRANSFORM_COLOR}
        strokeWidth={scaledStrokeWidth}
        fill="transparent"
        rotation={bounds.rotation}
        offsetX={0}
        offsetY={0}
        listening={false}
        dash={[6 / zoom, 3 / zoom]}
      />

      {/* Corner resize handles */}
      {Object.entries(handles.corners).map(([key, pos]) => {
        const handleStyle = getHandleStyle(key);
        return (
          <Circle
            key={`corner-${key}`}
            x={pos.x}
            y={pos.y}
            radius={(scaledHandleSize / 2) * handleStyle.scale}
            fill={handleStyle.fill}
            stroke={handleStyle.stroke}
            strokeWidth={scaledStrokeWidth}
            onMouseDown={handleMouseDown(key, 'resize')}
            onMouseEnter={handleMouseEnter(key)}
            onMouseLeave={handleMouseLeave}
            draggable={false}
            shadowColor={hoveredHandle === key ? 'rgba(0, 123, 255, 0.3)' : ''}
            shadowBlur={hoveredHandle === key ? 4 : 0}
            shadowOffset={{ x: 0, y: 2 }}
            shadowOpacity={hoveredHandle === key ? 0.5 : 0}
          />
        );
      })}

      {/* Edge resize handles */}
      {Object.entries(handles.edges).map(([key, pos]) => {
        const handleStyle = getHandleStyle(key);
        const scaledSize = scaledHandleSize * handleStyle.scale;
        return (
          <Rect
            key={`edge-${key}`}
            x={pos.x - scaledSize / 2}
            y={pos.y - scaledSize / 2}
            width={scaledSize}
            height={scaledSize}
            fill={handleStyle.fill}
            stroke={handleStyle.stroke}
            strokeWidth={scaledStrokeWidth}
            onMouseDown={handleMouseDown(key, 'resize')}
            onMouseEnter={handleMouseEnter(key)}
            onMouseLeave={handleMouseLeave}
            draggable={false}
            shadowColor={hoveredHandle === key ? 'rgba(0, 123, 255, 0.3)' : ''}
            shadowBlur={hoveredHandle === key ? 4 : 0}
            shadowOffset={{ x: 0, y: 2 }}
            shadowOpacity={hoveredHandle === key ? 0.5 : 0}
          />
        );
      })}

      {/* Rotation handle */}
      {enableRotation && (
        <Group>
          {/* Connection line from top center to rotation handle */}
          <Line
            points={[
              handles.edges.topCenter.x,
              handles.edges.topCenter.y,
              handles.rotationHandle.x,
              handles.rotationHandle.y,
            ]}
            stroke={TRANSFORM_COLOR}
            strokeWidth={scaledStrokeWidth}
            listening={false}
          />
          
          {/* Rotation handle */}
          {(() => {
            const handleStyle = getHandleStyle('rotate');
            return (
              <Circle
                x={handles.rotationHandle.x}
                y={handles.rotationHandle.y}
                radius={(scaledHandleSize / 2) * handleStyle.scale}
                fill={handleStyle.fill}
                stroke={handleStyle.stroke}
                strokeWidth={scaledStrokeWidth}
                onMouseDown={handleMouseDown('rotate', 'rotate')}
                onMouseEnter={handleMouseEnter('rotate')}
                onMouseLeave={handleMouseLeave}
                draggable={false}
                shadowColor={hoveredHandle === 'rotate' ? 'rgba(0, 123, 255, 0.3)' : ''}
                shadowBlur={hoveredHandle === 'rotate' ? 4 : 0}
                shadowOffset={{ x: 0, y: 2 }}
                shadowOpacity={hoveredHandle === 'rotate' ? 0.5 : 0}
              />
            );
          })()}
          
          {/* Rotation arc indicator */}
          {isTransforming && transformMode === 'rotate' && (
            <Arc
              x={handles.center.x}
              y={handles.center.y}
              innerRadius={Math.min(bounds.width, bounds.height) / 4}
              outerRadius={Math.min(bounds.width, bounds.height) / 4 + 2}
              angle={360}
              rotation={bounds.rotation || 0}
              stroke={TRANSFORM_COLOR}
              strokeWidth={scaledStrokeWidth}
              listening={false}
              opacity={0.5}
            />
          )}
        </Group>
      )}

      {/* Tooltip for hovered handle */}
      {hoveredHandle && !isTransforming && (
        <Group>
          <Rect
            x={handles.center.x - 30}
            y={handles.center.y - bounds.height / 2 - 40}
            width={60}
            height={20}
            fill="rgba(0, 0, 0, 0.8)"
            cornerRadius={4}
            listening={false}
          />
          <Text
            x={handles.center.x - 28}
            y={handles.center.y - bounds.height / 2 - 36}
            text={getTooltipText(hoveredHandle)}
            fontSize={12 / zoom}
            fill="#ffffff"
            fontFamily="Arial, sans-serif"
            listening={false}
          />
        </Group>
      )}

      {/* Active handle indicator */}
      {activeHandle && isTransforming && (
        <Group>
          <Rect
            x={handles.center.x - 35}
            y={handles.center.y + bounds.height / 2 + 10}
            width={70}
            height={22}
            fill="rgba(72, 175, 240, 0.9)"
            cornerRadius={6}
            listening={false}
          />
          <Text
            x={handles.center.x - 32}
            y={handles.center.y + bounds.height / 2 + 16}
            text={`${getTooltipText(activeHandle)} Active`}
            fontSize={11 / zoom}
            fill="#ffffff"
            fontFamily="Arial, sans-serif"
            fontStyle="bold"
            listening={false}
          />
        </Group>
      )}

      {/* Center point indicator */}
      <Circle
        x={handles.center.x}
        y={handles.center.y}
        radius={2 / zoom}
        fill={TRANSFORM_COLOR}
        listening={false}
      />
    </Group>
  );
};

TransformControls.displayName = 'TransformControls';