import { useState, useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';

export interface ResizeOptions {
  animate?: boolean;
  duration?: number;
  preserveElementPositions?: boolean;
  zoomToFit?: boolean;
}

export const useCanvasResize = () => {
  const { canvasSize, setCanvasSize, pushHistory, elements, transformElements } = useCanvasStore();
  const [isResizing, setIsResizing] = useState(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();

  const resizeWithTransition = useCallback(async (
    newSize: { width: number; height: number },
    options: ResizeOptions = {}
  ) => {
    const {
      animate = true,
      duration = 300,
      preserveElementPositions = true,
      zoomToFit = false
    } = options;

    setIsResizing(true);

    // Clear existing timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    const oldSize = canvasSize;

    // Calculate scale factor for element preservation
    let scaleX = 1;
    let scaleY = 1;
    
    if (preserveElementPositions && oldSize.width > 0 && oldSize.height > 0) {
      scaleX = newSize.width / oldSize.width;
      scaleY = newSize.height / oldSize.height;
    }

    // Apply canvas size change
    setCanvasSize(newSize);

    // Transform elements proportionally if needed
    if (preserveElementPositions && (scaleX !== 1 || scaleY !== 1)) {
      const elementIds = elements.map(el => el.id);
      elementIds.forEach(id => {
        const element = elements.find(el => el.id === id);
        if (element) {
          transformElements([id], {
            x: element.x * scaleX,
            y: element.y * scaleY,
            width: element.width * scaleX,
            height: element.height * scaleY
          });
        }
      });
    }

    // Add to history
    pushHistory('CANVAS_RESIZE', `Resized canvas to ${newSize.width}×${newSize.height}`);

    // Reset resizing state with animation duration
    resizeTimeoutRef.current = setTimeout(() => {
      setIsResizing(false);
    }, animate ? duration : 100);

    return Promise.resolve();
  }, [canvasSize, setCanvasSize, pushHistory, elements, transformElements]);

  const resizeToPreset = useCallback(async (preset: any, options?: ResizeOptions) => {
    return resizeWithTransition(
      { width: preset.width, height: preset.height },
      { ...options, zoomToFit: true }
    );
  }, [resizeWithTransition]);

  const getBestFitSize = useCallback((
    targetWidth: number,
    targetHeight: number,
    containerWidth: number,
    containerHeight: number
  ) => {
    const aspectRatio = targetWidth / targetHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let width, height;
    
    if (aspectRatio > containerAspectRatio) {
      // Constrained by width
      width = containerWidth * 0.8; // Leave 20% padding
      height = width / aspectRatio;
    } else {
      // Constrained by height
      height = containerHeight * 0.8; // Leave 20% padding
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }, []);

  const smartResize = useCallback(async (
    targetSize: { width: number; height: number },
    containerSize?: { width: number; height: number }
  ) => {
    let finalSize = targetSize;

    // If container size is provided, calculate best fit
    if (containerSize) {
      finalSize = getBestFitSize(
        targetSize.width,
        targetSize.height,
        containerSize.width,
        containerSize.height
      );
    }

    return resizeWithTransition(finalSize, {
      animate: true,
      duration: 400,
      preserveElementPositions: true,
      zoomToFit: true
    });
  }, [resizeWithTransition, getBestFitSize]);

  return {
    resizeWithTransition,
    resizeToPreset,
    smartResize,
    getBestFitSize,
    isResizing
  };
};