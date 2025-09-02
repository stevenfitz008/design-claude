import React, { useState, useCallback } from 'react';
import { Rect } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '@/stores/canvasStore';

interface SelectionBoxProps {
  isActive: boolean;
  onSelectionComplete: (selectedIds: string[]) => void;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  isActive,
  onSelectionComplete,
}) => {
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const { elements, zoom, pan } = useCanvasStore();

  const startSelection = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isActive) return;

    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    // Convert screen coordinates to canvas coordinates
    const canvasPos = {
      x: (pos.x - pan.x) / zoom,
      y: (pos.y - pan.y) / zoom,
    };

    setStartPoint(canvasPos);
    setIsDrawing(true);
    setSelectionBox({
      x: canvasPos.x,
      y: canvasPos.y,
      width: 0,
      height: 0,
    });
  }, [isActive, zoom, pan]);

  const updateSelection = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isActive || !isDrawing || !startPoint) return;

    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    // Convert screen coordinates to canvas coordinates
    const canvasPos = {
      x: (pos.x - pan.x) / zoom,
      y: (pos.y - pan.y) / zoom,
    };

    const box = {
      x: Math.min(startPoint.x, canvasPos.x),
      y: Math.min(startPoint.y, canvasPos.y),
      width: Math.abs(canvasPos.x - startPoint.x),
      height: Math.abs(canvasPos.y - startPoint.y),
    };

    setSelectionBox(box);
  }, [isActive, isDrawing, startPoint, zoom, pan]);

  const finishSelection = useCallback(() => {
    if (!isActive || !isDrawing || !selectionBox) {
      setIsDrawing(false);
      setSelectionBox(null);
      setStartPoint(null);
      return;
    }

    // Find elements that intersect with the selection box
    const selectedIds: string[] = [];
    
    elements.forEach((element) => {
      // Check if element intersects with selection box
      const elementRight = element.x + element.width;
      const elementBottom = element.y + element.height;
      const boxRight = selectionBox.x + selectionBox.width;
      const boxBottom = selectionBox.y + selectionBox.height;

      const intersects = !(
        elementRight < selectionBox.x ||
        element.x > boxRight ||
        elementBottom < selectionBox.y ||
        element.y > boxBottom
      );

      if (intersects) {
        selectedIds.push(element.id);
      }
    });

    onSelectionComplete(selectedIds);

    // Reset selection box
    setIsDrawing(false);
    setSelectionBox(null);
    setStartPoint(null);
  }, [isActive, isDrawing, selectionBox, elements, onSelectionComplete]);

  // Register global mouse events when active
  React.useEffect(() => {
    if (!isActive) return;

    const handleGlobalMouseUp = () => finishSelection();
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isActive, finishSelection]);

  if (!isActive || !selectionBox || !isDrawing) {
    return null;
  }

  return (
    <Rect
      x={selectionBox.x}
      y={selectionBox.y}
      width={selectionBox.width}
      height={selectionBox.height}
      stroke="#007bff"
      strokeWidth={1 / zoom}
      fill="rgba(0, 123, 255, 0.1)"
      dash={[4 / zoom, 2 / zoom]}
      listening={false}
    />
  );
};

// Custom hook for selection box
export const useSelectionBox = () => {
  const [isBoxActive, setIsBoxActive] = useState(false);
  const { selectElements } = useCanvasStore();

  const startBoxSelection = useCallback(() => {
    setIsBoxActive(true);
  }, []);

  const handleSelectionComplete = useCallback((selectedIds: string[]) => {
    selectElements(selectedIds);
    setIsBoxActive(false);
  }, [selectElements]);

  const cancelBoxSelection = useCallback(() => {
    setIsBoxActive(false);
  }, []);

  return {
    isBoxActive,
    startBoxSelection,
    cancelBoxSelection,
    handleSelectionComplete,
  };
};

SelectionBox.displayName = 'SelectionBox';