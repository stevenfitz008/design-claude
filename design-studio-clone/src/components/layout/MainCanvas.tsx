import React, { useRef, useEffect, useCallback } from 'react';
import { observer } from "mobx-react-lite";
// import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import AdvancedCanvasEngine from '../canvas/AdvancedCanvasEngine';

interface MainCanvasProps {
  className?: string;
}

// Temporarily using inline styles to fix styled.div error
// const CanvasContainer = styled.div<{ theme: any }>`...
const CanvasContainer: React.FC<{ theme: any; className?: string; children: React.ReactNode }> = ({ theme, className, children }) => (
  <div 
    className={className}
    style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors?.canvasBg || 'var(--canvas-bg)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      padding: 0, // Ensure no padding for edge-to-edge frame
      margin: 0   // Ensure no margin for edge-to-edge frame
    }}
  >
    {children}
  </div>
);

const CanvasArea: React.FC<{
  children: React.ReactNode;
  canvasAreaRef?: React.RefObject<HTMLDivElement>;
}> = ({ children, canvasAreaRef }) => (
  <div
    ref={canvasAreaRef}
    style={{
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
      padding: 0,
      margin: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'var(--canvas-bg)' // Canvas background from theme
    }}
  >
    {children}
  </div>
);


// we need observer to update component automatically on any store changes
export const MainCanvas: React.FC<MainCanvasProps> = observer(({ className }) => {
  const { theme } = useTheme();
  const { zoom, setZoom, fitCanvasToContainer, canvasSize } = useCanvasStore();
  const { zoomToFit } = useCanvas();
  const { smartResize, getBestFitSize } = useCanvasResize();
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simplified zoom handler - Stage is auto-centered in CanvasEngine
  const handleZoomChange = useCallback((newZoom: number) => {
    console.log(`🔍 Zoom change: ${zoom.toFixed(2)} → ${newZoom.toFixed(2)} (Stage auto-centered)`);
    setZoom(newZoom);
  }, [setZoom, zoom]);

  const handleAutoFit = () => {
    zoomToFit();
  };

  // Track last container dimensions to prevent infinite loops
  const lastDimensionsRef = useRef<{ width: number; height: number } | null>(null);

  // Enhanced resize handler that manages canvas dimensions
  const handleCanvasResize = useCallback(() => {
    if (!canvasAreaRef.current) return;

    const container = canvasAreaRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Guard against invalid dimensions
    if (containerWidth <= 0 || containerHeight <= 0) return;

    // Prevent infinite loops by checking if dimensions actually changed
    const lastDimensions = lastDimensionsRef.current;
    if (lastDimensions &&
        Math.abs(lastDimensions.width - containerWidth) < 5 &&
        Math.abs(lastDimensions.height - containerHeight) < 5) {
      return; // Dimensions haven't changed significantly
    }

    // Update last known dimensions
    lastDimensionsRef.current = { width: containerWidth, height: containerHeight };

    console.log(`🔄 Canvas auto-fit with element scaling: container ${containerWidth}x${containerHeight}`);

    // Calculate optimal canvas size that fits the container
    const optimalCanvasSize = getBestFitSize(
      canvasSize.width,
      canvasSize.height,
      containerWidth,
      containerHeight
    );

    console.log(`📏 Smart resize: ${canvasSize.width}x${canvasSize.height} → ${optimalCanvasSize.width}x${optimalCanvasSize.height}`);

    // Use smartResize which automatically scales all elements proportionally
    smartResize(optimalCanvasSize, { width: containerWidth, height: containerHeight }).then(() => {
      // After smart resize, apply zoom to fit for perfect positioning
      setTimeout(() => {
        zoomToFit();
        console.log(`✅ Auto-fit complete: canvas resized with proportional element scaling + zoom-to-fit applied`);
      }, 100);
    });
  }, [canvasSize, getBestFitSize, smartResize, zoomToFit]);

  // Debounced resize handler to prevent excessive recalculations
  const debouncedResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      handleCanvasResize();
    }, 150); // 150ms debounce
  }, [handleCanvasResize]);

  // Set up resize observer and window resize listener
  useEffect(() => {
    const container = canvasAreaRef.current;
    if (!container) return;

    // Immediate initial auto-fit on mount for launch behavior
    console.log('🚀 Canvas launched - applying immediate auto-fit to browser window');
    handleCanvasResize();

    // Additional delayed check in case initial measurements were wrong
    const initialTimeout = setTimeout(() => {
      handleCanvasResize();
    }, 200);

    // Use ResizeObserver for more accurate container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver((entries) => {
        // Only trigger for actual size changes
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            debouncedResize();
          }
        }
      });
      resizeObserver.observe(container);
    }

    // Fallback to window resize event
    const handleWindowResize = () => {
      debouncedResize();
    };

    window.addEventListener('resize', handleWindowResize, { passive: true });

    // Also handle orientation changes on mobile
    window.addEventListener('orientationchange', handleWindowResize, { passive: true });

    return () => {
      clearTimeout(initialTimeout);

      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('orientationchange', handleWindowResize);
    };
  }, []); // Remove dependencies to prevent re-running

  return (
    <CanvasContainer
      theme={theme}
      className={className}
      data-canvas-container
    >
      <AdvancedCanvasEngine />
    </CanvasContainer>
  );
});


export type { MainCanvasProps };