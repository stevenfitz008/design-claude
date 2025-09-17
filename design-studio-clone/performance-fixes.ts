/**
 * Critical Performance Fixes Implementation Guide
 * Apply these fixes to resolve the identified performance bottlenecks
 */

// 1. CONSOLE LOGGING FIX
// Create a production-safe logging utility
export const createLogger = (namespace: string) => {
  const isDev = import.meta.env.DEV;

  return {
    log: (...args: any[]) => {
      if (isDev && (window as any).__console) {
        (window as any).__console.log(`[${namespace}]`, ...args);
      }
    },
    warn: (...args: any[]) => {
      if (isDev) {
        console.warn(`[${namespace}]`, ...args);
      }
    },
    error: (...args: any[]) => {
      console.error(`[${namespace}]`, ...args); // Always log errors
    }
  };
};

// Usage in components:
// const logger = createLogger('CanvasImageElement');
// logger.log('Image loaded for element:', element.id);

// 2. OPTIMIZED useEffect PATTERNS

// BEFORE (problematic)
/*
useEffect(() => {
  const img = new window.Image();
  img.onload = () => {
    console.log('🎨 CanvasImageElement - Image loaded for element:', element.id);
    setImage(img);
    updateElement(element.id, {
      originalWidth: img.naturalWidth,
      originalHeight: img.naturalHeight,
    });
  };
  img.src = element.src;
}, [element.src, element.id, element.originalWidth, element.originalHeight, updateElement]);
*/

// AFTER (optimized)
export const useOptimizedImageLoader = (element: any, updateElement: Function) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const logger = createLogger('ImageLoader');

  // Stable callback to avoid dependency changes
  const updateElementCallback = useCallback((id: string, updates: any) => {
    updateElement(id, updates);
  }, []); // Empty deps - updateElement should be stable from store

  // Optimized effect with minimal deps
  useEffect(() => {
    if (!element.src || !element.id) return;

    let isMounted = true;
    const img = new window.Image();

    img.onload = () => {
      if (!isMounted) return; // Cleanup check

      logger.log('Image loaded', { id: element.id, src: element.src.substring(0, 50) });
      setImage(img);

      // Only update if dimensions are missing
      if (!element.originalWidth || !element.originalHeight) {
        updateElementCallback(element.id, {
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
        });
      }
    };

    img.onerror = (error) => {
      if (!isMounted) return;
      logger.error('Image failed to load:', element.src, error);
      setImage(null);
    };

    img.crossOrigin = 'anonymous';
    img.src = element.src;

    // Cleanup function
    return () => {
      isMounted = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [element.src, element.id, element.originalWidth, element.originalHeight, updateElementCallback]);

  return image;
};

// 3. MEMOIZED CANVAS COMPONENTS
export const createMemoizedCanvasComponent = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  compareProps?: (prev: T, next: T) => boolean
) => {
  return React.memo(Component, compareProps || ((prev, next) => {
    // Default comparison for canvas elements
    if (prev.element && next.element) {
      return (
        prev.element.id === next.element.id &&
        prev.element.x === next.element.x &&
        prev.element.y === next.element.y &&
        prev.element.width === next.element.width &&
        prev.element.height === next.element.height &&
        prev.element.rotation === next.element.rotation &&
        prev.element.src === next.element.src
      );
    }
    return false;
  }));
};

// 4. OPTIMIZED STAGE UPDATE PATTERN
export const useOptimizedStageUpdates = (stageRef: React.RefObject<any>, elements: any[]) => {
  const { batchedRAF } = require('./utils/performance');
  const logger = createLogger('StageUpdates');

  // Debounced update function to prevent excessive redraws
  const debouncedStageUpdate = useMemo(() =>
    debounce(() => {
      if (stageRef.current) {
        batchedRAF(() => {
          try {
            stageRef.current.batchDraw();
            logger.log('Stage updated with', elements.length, 'elements');
          } catch (error) {
            logger.error('Stage update failed:', error);
          }
        });
      }
    }, 16), // 60fps max
    [stageRef]
  );

  // Only trigger updates when elements actually change
  const elementsHash = useMemo(() => {
    return elements.map(el => `${el.id}-${el.x}-${el.y}-${el.width}-${el.height}`).join(',');
  }, [elements]);

  useEffect(() => {
    debouncedStageUpdate();
  }, [elementsHash, debouncedStageUpdate]);

  return debouncedStageUpdate;
};

// 5. PERFORMANCE-OPTIMIZED EVENT HANDLERS
export const useOptimizedEventHandlers = (handlers: {
  onMouseMove?: (e: any) => void;
  onWheel?: (e: any) => void;
  onTouchMove?: (e: any) => void;
}) => {
  const { throttle } = require('./utils/performance');

  return useMemo(() => ({
    onMouseMove: handlers.onMouseMove ? throttle(handlers.onMouseMove, 16) : undefined,
    onWheel: handlers.onWheel ? throttle(handlers.onWheel, 16) : undefined,
    onTouchMove: handlers.onTouchMove ? throttle(handlers.onTouchMove, 16) : undefined,
  }), [handlers.onMouseMove, handlers.onWheel, handlers.onTouchMove]);
};

// 6. VIRTUALIZED ELEMENT RENDERER
export const VirtualizedCanvasElements = React.memo(({
  elements,
  viewport,
  renderElement
}: {
  elements: any[];
  viewport: { x: number; y: number; width: number; height: number; scale: number };
  renderElement: (element: any) => React.ReactNode;
}) => {
  const visibleElements = useMemo(() => {
    return elements.filter(element => {
      // Basic viewport culling
      const elementBounds = {
        left: element.x * viewport.scale,
        top: element.y * viewport.scale,
        right: (element.x + element.width) * viewport.scale,
        bottom: (element.y + element.height) * viewport.scale
      };

      const viewportBounds = {
        left: viewport.x,
        top: viewport.y,
        right: viewport.x + viewport.width,
        bottom: viewport.y + viewport.height
      };

      // Check if element intersects viewport
      return !(
        elementBounds.right < viewportBounds.left ||
        elementBounds.left > viewportBounds.right ||
        elementBounds.bottom < viewportBounds.top ||
        elementBounds.top > viewportBounds.bottom
      );
    });
  }, [elements, viewport]);

  return (
    <>
      {visibleElements.map(renderElement)}
    </>
  );
});

// 7. MEMORY-EFFICIENT IMAGE CACHE
class OptimizedImageCache {
  private cache = new Map<string, HTMLImageElement>();
  private maxSize = 50;
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;

  get(src: string): HTMLImageElement | null {
    const image = this.cache.get(src);
    if (image) {
      this.accessOrder.set(src, ++this.accessCounter);
      return image;
    }
    return null;
  }

  set(src: string, image: HTMLImageElement): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.accessOrder.entries())
        .sort(([, a], [, b]) => a - b)[0][0];
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }

    this.cache.set(src, image);
    this.accessOrder.set(src, ++this.accessCounter);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
  }
}

export const imageCache = new OptimizedImageCache();

// 8. PERFORMANCE MONITORING INTEGRATION
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const renderCount = useRef(0);
    const logger = createLogger(`Perf-${componentName}`);

    useEffect(() => {
      renderCount.current++;
      if (renderCount.current > 100) {
        logger.warn(`High render count: ${renderCount.current}`);
      }
    });

    const startTime = useRef(performance.now());

    useLayoutEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime.current;

      if (renderTime > 16.67) {
        logger.warn(`Slow render: ${renderTime.toFixed(2)}ms`);
      }
    });

    startTime.current = performance.now();
    return <Component {...props} ref={ref} />;
  });
};

// 9. CLEANUP UTILITIES
export const useCleanupEffect = (
  effect: () => (() => void) | void,
  deps?: React.DependencyList
) => {
  useEffect(() => {
    const cleanup = effect();
    return cleanup;
  }, deps);
};

// 10. PERFORMANCE ASSERTION HOOK
export const usePerformanceAssertion = (
  componentName: string,
  maxRenderTime = 16.67
) => {
  const renderStart = useRef(performance.now());
  const renderCount = useRef(0);
  const logger = createLogger(`Assert-${componentName}`);

  useLayoutEffect(() => {
    const renderTime = performance.now() - renderStart.current;
    renderCount.current++;

    if (renderTime > maxRenderTime) {
      logger.warn(`Performance assertion failed: ${renderTime.toFixed(2)}ms > ${maxRenderTime}ms (render #${renderCount.current})`);
    }
  });

  // Reset timer for next render
  renderStart.current = performance.now();
};

// EXAMPLE USAGE IN CanvasImageElement:
/*
const CanvasImageElement = createMemoizedCanvasComponent(({ element }) => {
  const logger = createLogger('CanvasImageElement');
  const { updateElement } = useCanvasStore();

  // Use optimized image loader
  const image = useOptimizedImageLoader(element, updateElement);

  // Performance monitoring
  usePerformanceAssertion('CanvasImageElement', 16.67);

  // Your component logic here...

  return (
    <Image
      image={image}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
    />
  );
});
*/