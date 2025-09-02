import React, { useMemo } from 'react';
import { Group, Rect, Circle } from 'react-konva';
import { useCanvasStore } from '@/stores/canvasStore';
import type { SelectionBounds } from '@/types/canvas';

interface SelectionHandlesProps {
  bounds: SelectionBounds;
  onTransformStart?: () => void;
  onTransform?: (newBounds: SelectionBounds) => void;
  onTransformEnd?: () => void;
}

const HANDLE_SIZE = 8;
const STROKE_WIDTH = 1.5;
const SELECTION_COLOR = '#007bff';
const HANDLE_FILL = '#ffffff';

export const SelectionHandles: React.FC<SelectionHandlesProps> = ({
  bounds,
  onTransformStart,
  onTransform,
  onTransformEnd,
}) => {
  const { zoom } = useCanvasStore();
  
  // Scale handles based on zoom level
  const scaledHandleSize = HANDLE_SIZE / zoom;
  const scaledStrokeWidth = STROKE_WIDTH / zoom;

  // Calculate handle positions
  const handles = useMemo(() => {
    const { x, y, width, height } = bounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    return {
      // Corner handles
      topLeft: { x, y, cursor: 'nw-resize' },
      topRight: { x: x + width, y, cursor: 'ne-resize' },
      bottomLeft: { x, y: y + height, cursor: 'sw-resize' },
      bottomRight: { x: x + width, y: y + height, cursor: 'se-resize' },
      
      // Edge handles
      topCenter: { x: x + halfWidth, y, cursor: 'n-resize' },
      bottomCenter: { x: x + halfWidth, y: y + height, cursor: 's-resize' },
      leftCenter: { x, y: y + halfHeight, cursor: 'w-resize' },
      rightCenter: { x: x + width, y: y + halfHeight, cursor: 'e-resize' },
    };
  }, [bounds]);

  const handleMouseDown = (handleType: string) => (e: any) => {
    e.cancelBubble = true;
    onTransformStart?.();
    
    // Store initial mouse position and bounds
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const initialBounds = { ...bounds };
    const initialPointer = { ...pointer };

    const handleMouseMove = (e: any) => {
      const newPointer = stage.getPointerPosition();
      const deltaX = newPointer.x - initialPointer.x;
      const deltaY = newPointer.y - initialPointer.y;

      let newBounds = { ...initialBounds };

      // Calculate new bounds based on handle type
      switch (handleType) {
        case 'topLeft':
          newBounds.x = initialBounds.x + deltaX;
          newBounds.y = initialBounds.y + deltaY;
          newBounds.width = initialBounds.width - deltaX;
          newBounds.height = initialBounds.height - deltaY;
          break;
        case 'topRight':
          newBounds.y = initialBounds.y + deltaY;
          newBounds.width = initialBounds.width + deltaX;
          newBounds.height = initialBounds.height - deltaY;
          break;
        case 'bottomLeft':
          newBounds.x = initialBounds.x + deltaX;
          newBounds.width = initialBounds.width - deltaX;
          newBounds.height = initialBounds.height + deltaY;
          break;
        case 'bottomRight':
          newBounds.width = initialBounds.width + deltaX;
          newBounds.height = initialBounds.height + deltaY;
          break;
        case 'topCenter':
          newBounds.y = initialBounds.y + deltaY;
          newBounds.height = initialBounds.height - deltaY;
          break;
        case 'bottomCenter':
          newBounds.height = initialBounds.height + deltaY;
          break;
        case 'leftCenter':
          newBounds.x = initialBounds.x + deltaX;
          newBounds.width = initialBounds.width - deltaX;
          break;
        case 'rightCenter':
          newBounds.width = initialBounds.width + deltaX;
          break;
      }

      // Ensure minimum size
      newBounds.width = Math.max(10, newBounds.width);
      newBounds.height = Math.max(10, newBounds.height);

      onTransform?.(newBounds);
    };

    const handleMouseUp = () => {
      stage.off('mousemove', handleMouseMove);
      stage.off('mouseup', handleMouseUp);
      onTransformEnd?.();
    };

    stage.on('mousemove', handleMouseMove);
    stage.on('mouseup', handleMouseUp);
  };

  return (
    <Group listening={false}>
      {/* Selection boundary */}
      <Rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        stroke={SELECTION_COLOR}
        strokeWidth={scaledStrokeWidth}
        fill="transparent"
        listening={false}
        dash={[4 / zoom, 2 / zoom]}
      />

      {/* Corner handles */}
      <Circle
        x={handles.topLeft.x}
        y={handles.topLeft.y}
        radius={scaledHandleSize / 2}
        fill={HANDLE_FILL}
        stroke={SELECTION_COLOR}
        strokeWidth={scaledStrokeWidth}
        onMouseDown={handleMouseDown('topLeft')}
        draggable={false}
      />
      <Circle
        x={handles.topRight.x}
        y={handles.topRight.y}
        radius={scaledHandleSize / 2}
        fill={HANDLE_FILL}
        stroke={SELECTION_COLOR}
        strokeWidth={scaledStrokeWidth}
        onMouseDown={handleMouseDown('topRight')}
        draggable={false}
      />
      <Circle
        x={handles.bottomLeft.x}
        y={handles.bottomLeft.y}
        radius={scaledHandleSize / 2}
        fill={HANDLE_FILL}
        stroke={SELECTION_COLOR}
        strokeWidth={scaledStrokeWidth}
        onMouseDown={handleMouseDown('bottomLeft')}
        draggable={false}
      />
      <Circle
        x={handles.bottomRight.x}
        y={handles.bottomRight.y}
        radius={scaledHandleSize / 2}
        fill={HANDLE_FILL}
        stroke={SELECTION_COLOR}
        strokeWidth={scaledStrokeWidth}
        onMouseDown={handleMouseDown('bottomRight')}
        draggable={false}
      />

      {/* Edge handles */}
      <Rect
        x={handles.topCenter.x - scaledHandleSize / 2}
        y={handles.topCenter.y - scaledHandleSize / 2}
        width={scaledHandleSize}
        height={scaledHandleSize}
        fill={HANDLE_FILL}
        stroke={SELECTION_COLOR}
        strokeWidth={scaledStrokeWidth}
        onMouseDown={handleMouseDown('topCenter')}
        draggable={false}
      />
      <Rect
        x={handles.bottomCenter.x - scaledHandleSize / 2}
        y={handles.bottomCenter.y - scaledHandleSize / 2}
        width={scaledHandleSize}
        height={scaledHandleSize}
        fill={HANDLE_FILL}
        stroke={SELECTION_COLOR}
        strokeWidth={scaledStrokeWidth}
        onMouseDown={handleMouseDown('bottomCenter')}
        draggable={false}
      />
      <Rect
        x={handles.leftCenter.x - scaledHandleSize / 2}
        y={handles.leftCenter.y - scaledHandleSize / 2}
        width={scaledHandleSize}
        height={scaledHandleSize}
        fill={HANDLE_FILL}
        stroke={SELECTION_COLOR}
        strokeWidth={scaledStrokeWidth}
        onMouseDown={handleMouseDown('leftCenter')}
        draggable={false}
      />
      <Rect
        x={handles.rightCenter.x - scaledHandleSize / 2}
        y={handles.rightCenter.y - scaledHandleSize / 2}
        width={scaledHandleSize}
        height={scaledHandleSize}
        fill={HANDLE_FILL}
        stroke={SELECTION_COLOR}
        strokeWidth={scaledStrokeWidth}
        onMouseDown={handleMouseDown('rightCenter')}
        draggable={false}
      />
    </Group>
  );
};

SelectionHandles.displayName = 'SelectionHandles';