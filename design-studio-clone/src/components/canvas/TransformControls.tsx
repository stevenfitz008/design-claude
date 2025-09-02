import React, { useMemo, useCallback, useState } from 'react';
import { Group, Circle, Rect, Line, Arc } from 'react-konva';
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
const SNAP_THRESHOLD = 5;

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

  const handleMouseDown = (handleType: string, mode: 'resize' | 'rotate') => (e: any) => {
    e.cancelBubble = true;
    setIsTransforming(true);
    setTransformMode(mode);
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
              const avgScale = (newWidth + newHeight / aspectRatio) / 2 / initialBounds.width;
              newBounds.width = initialBounds.width * avgScale;
              newBounds.height = initialBounds.height * avgScale;
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
              const avgScale = (newWidthFromDelta / initialBounds.width + newHeightFromDelta / initialBounds.height) / 2;
              newBounds.width = initialBounds.width * avgScale;
              newBounds.height = initialBounds.height * avgScale;
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
              const avgScale = (newWidthFromDelta / initialBounds.width + newHeightFromDelta / initialBounds.height) / 2;
              newBounds.width = initialBounds.width * avgScale;
              newBounds.height = initialBounds.height * avgScale;
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
              const avgScale = (newWidthFromDelta / initialBounds.width + newHeightFromDelta / initialBounds.height) / 2;
              newBounds.width = initialBounds.width * avgScale;
              newBounds.height = initialBounds.height * avgScale;
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
      {Object.entries(handles.corners).map(([key, pos]) => (
        <Circle
          key={`corner-${key}`}
          x={pos.x}
          y={pos.y}
          radius={scaledHandleSize / 2}
          fill={HANDLE_FILL}
          stroke={TRANSFORM_COLOR}
          strokeWidth={scaledStrokeWidth}
          onMouseDown={handleMouseDown(key, 'resize')}
          draggable={false}
        />
      ))}

      {/* Edge resize handles */}
      {Object.entries(handles.edges).map(([key, pos]) => (
        <Rect
          key={`edge-${key}`}
          x={pos.x - scaledHandleSize / 2}
          y={pos.y - scaledHandleSize / 2}
          width={scaledHandleSize}
          height={scaledHandleSize}
          fill={HANDLE_FILL}
          stroke={TRANSFORM_COLOR}
          strokeWidth={scaledStrokeWidth}
          onMouseDown={handleMouseDown(key, 'resize')}
          draggable={false}
        />
      ))}

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
          <Circle
            x={handles.rotationHandle.x}
            y={handles.rotationHandle.y}
            radius={scaledHandleSize / 2}
            fill={HANDLE_FILL}
            stroke={TRANSFORM_COLOR}
            strokeWidth={scaledStrokeWidth}
            onMouseDown={handleMouseDown('rotate', 'rotate')}
            draggable={false}
          />
          
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