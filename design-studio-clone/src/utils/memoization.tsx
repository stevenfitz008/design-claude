/**
 * Canvas-Optimized Memoization Utilities
 * Provides optimized React.memo implementations for canvas components
 */
import React from 'react';
import type { CanvasElement, TextElement, ImageElement, ShapeElement, IconElement } from '@/types/canvas';

/**
 * Canvas Element Props for memoization
 */
interface CanvasElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onContextMenu?: (e: any) => void;
}

/**
 * Optimized comparison function for canvas elements
 * Only re-renders when critical properties change
 */
export const canvasElementPropsAreEqual = <T extends CanvasElementProps>(
  prevProps: T,
  nextProps: T
): boolean => {
  const prevElement = prevProps.element;
  const nextElement = nextProps.element;

  // Fast comparison - if IDs don't match, definitely different
  if (prevElement.id !== nextElement.id) return false;

  // Selection state changed - must re-render
  if (prevProps.isSelected !== nextProps.isSelected) return false;

  // Critical position and size properties
  if (
    prevElement.x !== nextElement.x ||
    prevElement.y !== nextElement.y ||
    prevElement.width !== nextElement.width ||
    prevElement.height !== nextElement.height ||
    prevElement.rotation !== nextElement.rotation ||
    prevElement.zIndex !== nextElement.zIndex
  ) {
    return false;
  }

  // Type-specific comparisons
  switch (prevElement.type) {
    case 'text': {
      const prevText = prevElement as TextElement;
      const nextText = nextElement as TextElement;
      return (
        prevText.text === nextText.text &&
        prevText.fontSize === nextText.fontSize &&
        prevText.fontFamily === nextText.fontFamily &&
        prevText.fill === nextText.fill &&
        prevText.fontStyle === nextText.fontStyle &&
        prevText.textDecoration === nextText.textDecoration
      );
    }

    case 'image': {
      const prevImage = prevElement as ImageElement;
      const nextImage = nextElement as ImageElement;
      return (
        prevImage.src === nextImage.src &&
        prevImage.opacity === nextImage.opacity &&
        prevImage.filters?.length === nextImage.filters?.length &&
        prevImage.clipPosition === nextImage.clipPosition &&
        prevImage.cropArea?.x === nextImage.cropArea?.x &&
        prevImage.cropArea?.y === nextImage.cropArea?.y &&
        prevImage.cropArea?.width === nextImage.cropArea?.width &&
        prevImage.cropArea?.height === nextImage.cropArea?.height
      );
    }

    case 'shape': {
      const prevShape = prevElement as ShapeElement;
      const nextShape = nextElement as ShapeElement;
      return (
        prevShape.shapeType === nextShape.shapeType &&
        prevShape.fill === nextShape.fill &&
        prevShape.stroke === nextShape.stroke &&
        prevShape.strokeWidth === nextShape.strokeWidth
      );
    }

    case 'icon': {
      const prevIcon = prevElement as IconElement;
      const nextIcon = nextElement as IconElement;
      return (
        prevIcon.iconType === nextIcon.iconType &&
        prevIcon.fill === nextIcon.fill &&
        prevIcon.stroke === nextIcon.stroke
      );
    }

    default:
      return true;
  }
};

/**
 * Text-specific memoization comparison
 */
export const textElementPropsAreEqual = (
  prevProps: { element: TextElement; isSelected: boolean; onContextMenu?: (e: any) => void },
  nextProps: { element: TextElement; isSelected: boolean; onContextMenu?: (e: any) => void }
): boolean => {
  return canvasElementPropsAreEqual(prevProps, nextProps);
};

/**
 * Image-specific memoization comparison
 */
export const imageElementPropsAreEqual = (
  prevProps: { element: ImageElement; isSelected: boolean; onContextMenu?: (e: any) => void },
  nextProps: { element: ImageElement; isSelected: boolean; onContextMenu?: (e: any) => void }
): boolean => {
  return canvasElementPropsAreEqual(prevProps, nextProps);
};

/**
 * Shape-specific memoization comparison
 */
export const shapeElementPropsAreEqual = (
  prevProps: { element: ShapeElement; isSelected: boolean },
  nextProps: { element: ShapeElement; isSelected: boolean }
): boolean => {
  return canvasElementPropsAreEqual(prevProps, nextProps);
};

/**
 * Icon-specific memoization comparison
 */
export const iconElementPropsAreEqual = (
  prevProps: { element: IconElement; isSelected: boolean },
  nextProps: { element: IconElement; isSelected: boolean }
): boolean => {
  return canvasElementPropsAreEqual(prevProps, nextProps);
};

/**
 * General element renderer comparison
 */
export const elementRendererPropsAreEqual = (
  prevProps: CanvasElementProps,
  nextProps: CanvasElementProps
): boolean => {
  return canvasElementPropsAreEqual(prevProps, nextProps);
};

/**
 * Creates a memoized canvas component with performance monitoring
 */
export const createMemoizedCanvasComponent = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  compareProps: (prev: T, next: T) => boolean,
  componentName?: string
): React.ComponentType<T> => {
  const MemoizedComponent = React.memo(Component, compareProps);

  if (import.meta.env.DEV && componentName) {
    MemoizedComponent.displayName = `Memo(${componentName})`;
  }

  return MemoizedComponent;
};

/**
 * Performance monitoring wrapper for memoized components
 */
export const withMemoPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo(
    React.forwardRef((props: P, ref: any) => {
      if (import.meta.env.DEV) {
        const renderCount = React.useRef(0);
        const lastRenderTime = React.useRef(performance.now());

        React.useLayoutEffect(() => {
          renderCount.current++;
          const currentTime = performance.now();
          const renderTime = currentTime - lastRenderTime.current;

          // Log performance issues in development
          if (renderTime > 16.67) {
            console.warn(`[${componentName}] Slow render: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
          }

          if (renderCount.current > 50) {
            console.warn(`[${componentName}] High render count: ${renderCount.current}`);
          }

          lastRenderTime.current = currentTime;
        });
      }

      return <Component {...props} ref={ref} />;
    })
  );
};

/**
 * Shallow comparison utility for object props
 */
export const shallowEqual = <T extends Record<string, any>>(a: T, b: T): boolean => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (a[key] !== b[key]) {
      return false;
    }
  }

  return true;
};

/**
 * Deep comparison for complex nested objects (use sparingly)
 */
export const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;

  if (a == null || b == null) return a === b;

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
};