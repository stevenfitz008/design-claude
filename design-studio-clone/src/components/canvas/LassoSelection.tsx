import React, { useState, useCallback, useRef } from 'react';
import { Group, Line } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '@/stores/canvasStore';

interface LassoSelectionProps {
  isActive: boolean;
  onSelectionComplete: (selectedIds: string[]) => void;
}

export const LassoSelection: React.FC<LassoSelectionProps> = ({
  isActive,
  onSelectionComplete,
}) => {
  const [points, setPoints] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const pathRef = useRef<number[][]>([]);
  
  const { elements, zoom } = useCanvasStore();

  const startDrawing = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isActive) return;
    
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    // Convert screen coordinates to canvas coordinates
    const canvasPos = {
      x: (pos.x - e.target.getStage()!.x()) / zoom,
      y: (pos.y - e.target.getStage()!.y()) / zoom,
    };

    setIsDrawing(true);
    setPoints([canvasPos.x, canvasPos.y]);
    pathRef.current = [[canvasPos.x, canvasPos.y]];
  }, [isActive, zoom]);

  const continueDrawing = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isActive || !isDrawing) return;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    // Convert screen coordinates to canvas coordinates
    const canvasPos = {
      x: (pos.x - e.target.getStage()!.x()) / zoom,
      y: (pos.y - e.target.getStage()!.y()) / zoom,
    };

    const newPoints = [...points, canvasPos.x, canvasPos.y];
    setPoints(newPoints);
    pathRef.current.push([canvasPos.x, canvasPos.y]);
  }, [isActive, isDrawing, points, zoom]);

  const finishDrawing = useCallback(() => {
    if (!isActive || !isDrawing || pathRef.current.length < 3) {
      setIsDrawing(false);
      setPoints([]);
      pathRef.current = [];
      return;
    }

    // Check which elements are inside the lasso selection
    const selectedIds: string[] = [];
    
    elements.forEach((element) => {
      // Check if element center is inside the lasso path
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      
      if (isPointInPolygon(centerX, centerY, pathRef.current)) {
        selectedIds.push(element.id);
      }
    });

    onSelectionComplete(selectedIds);
    
    // Reset lasso
    setIsDrawing(false);
    setPoints([]);
    pathRef.current = [];
  }, [isActive, isDrawing, elements, onSelectionComplete]);

  // Point-in-polygon algorithm (ray casting)
  const isPointInPolygon = (x: number, y: number, polygon: number[][]): boolean => {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  };

  // Register global mouse events when active
  React.useEffect(() => {
    if (!isActive) return;

    const handleGlobalMouseUp = () => finishDrawing();
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isActive, finishDrawing]);

  if (!isActive || !isDrawing || points.length < 4) {
    return null;
  }

  return (
    <Group listening={false}>
      <Line
        points={[...points, points[0], points[1]]} // Close the path
        stroke="#007bff"
        strokeWidth={1.5 / zoom}
        fill="rgba(0, 123, 255, 0.1)"
        closed={true}
        dash={[4 / zoom, 2 / zoom]}
        listening={false}
      />
    </Group>
  );
};

// Custom hook for lasso selection
export const useLassoSelection = () => {
  const [isLassoActive, setIsLassoActive] = useState(false);
  const { selectElements } = useCanvasStore();

  const startLassoSelection = useCallback(() => {
    setIsLassoActive(true);
  }, []);

  const handleSelectionComplete = useCallback((selectedIds: string[]) => {
    selectElements(selectedIds);
    setIsLassoActive(false);
  }, [selectElements]);

  const cancelLassoSelection = useCallback(() => {
    setIsLassoActive(false);
  }, []);

  return {
    isLassoActive,
    startLassoSelection,
    cancelLassoSelection,
    handleSelectionComplete,
  };
};

LassoSelection.displayName = 'LassoSelection';