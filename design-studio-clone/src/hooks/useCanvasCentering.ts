import { useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvas } from '@/hooks/useCanvas';

/**
 * Hook to manage canvas centering behavior
 * Ensures the canvas stays centered when size changes from ResizePanel
 * and automatically fits to viewport when opened
 */
export const useCanvasCentering = () => {
  const { canvasSize } = useCanvasStore();
  const { zoomToFit, centerView, stageRef } = useCanvas();

  // Auto-center canvas when size changes (e.g., from ResizePanel)
  const handleCanvasSizeChange = useCallback(() => {
    console.log(`📏 Canvas centering hook triggered for size: ${canvasSize.width}x${canvasSize.height}`);
    
    // Enhanced timing with retry logic for stage availability using direct stageRef
    const attemptZoomToFit = (retryCount = 0) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Check if stage ref is available and has dimensions
          const stage = stageRef.current;
          
          if (stage && stage.width() > 0 && stage.height() > 0) {
            // Stage is ready, call zoomToFit
            setTimeout(() => {
              console.log(`🎯 Stage ready via stageRef, calling zoomToFit (attempt ${retryCount + 1})`);
              zoomToFit();
            }, 50); // Small additional delay to ensure everything is rendered
          } else if (retryCount < 8) {
            // If stage isn't ready, retry up to 8 times with increasing delays
            console.log(`⏳ Stage ref not ready, retrying zoomToFit (attempt ${retryCount + 1})`);
            setTimeout(() => attemptZoomToFit(retryCount + 1), 150 * (retryCount + 1));
          } else {
            console.warn('⚠️ zoomToFit failed after 8 retries - stageRef may not be initialized');
          }
        });
      });
    };
    
    attemptZoomToFit();
  }, [canvasSize.width, canvasSize.height, zoomToFit, stageRef]);

  // React to canvas size changes
  useEffect(() => {
    handleCanvasSizeChange();
  }, [canvasSize.width, canvasSize.height, handleCanvasSizeChange]);

  // Initial auto-fit on mount (when canvas is first opened)
  useEffect(() => {
    // Enhanced initial auto-fit with retry logic using stageRef
    const attemptInitialZoomToFit = (retryCount = 0) => {
      const timer = setTimeout(() => {
        console.log(`🎯 Initial canvas auto-fit and center on mount (attempt ${retryCount + 1})`);
        
        // Check if stage ref is available and has dimensions
        const stage = stageRef.current;
        
        if (stage && stage.width() > 0 && stage.height() > 0) {
          console.log(`✅ Stage ready for initial zoomToFit via stageRef (attempt ${retryCount + 1})`);
          zoomToFit();
        } else if (retryCount < 12) {
          // Retry with exponential backoff, up to 12 times for initial mount
          console.log(`⏳ Initial stage ref not ready, retrying (attempt ${retryCount + 1})`);
          attemptInitialZoomToFit(retryCount + 1);
        } else {
          console.warn('⚠️ Initial zoomToFit failed after 12 retries - stageRef may not be ready');
        }
      }, 100 * Math.pow(1.2, retryCount)); // Exponential backoff starting at 100ms
    };

    // Start initial attempt after a base delay to allow component mounting
    setTimeout(() => attemptInitialZoomToFit(), 200);
  }, [stageRef, zoomToFit]); // Include stageRef and zoomToFit in dependencies

  return {
    handleCanvasSizeChange,
  };
};