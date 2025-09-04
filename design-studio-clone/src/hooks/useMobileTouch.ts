import { useCallback, useRef } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import { useCanvasStore } from '@/stores/canvasStore';

interface TouchState {
  touches: TouchList | null;
  initialDistance: number;
  initialRotation: number;
  initialCenter: { x: number; y: number };
  startTime: number;
}

export const useMobileTouch = () => {
  const touchState = useRef<TouchState>({
    touches: null,
    initialDistance: 0,
    initialRotation: 0,
    initialCenter: { x: 0, y: 0 },
    startTime: 0
  });

  const { zoom, setZoom, pan, setPan, selectElement, clearSelection } = useCanvasStore();

  const getDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const getCenter = (touches: TouchList): { x: number; y: number } => {
    if (touches.length === 0) return { x: 0, y: 0 };
    
    let x = 0;
    let y = 0;
    for (let i = 0; i < touches.length; i++) {
      x += touches[i].clientX;
      y += touches[i].clientY;
    }
    return {
      x: x / touches.length,
      y: y / touches.length
    };
  };

  const getRotation = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX) * 180 / Math.PI;
  };

  const handleTouchStart = useCallback((e: KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    
    const touches = e.evt.touches;
    touchState.current = {
      touches,
      initialDistance: getDistance(touches),
      initialRotation: getRotation(touches),
      initialCenter: getCenter(touches),
      startTime: Date.now()
    };

    // Single touch - potential selection
    if (touches.length === 1) {
      const target = e.target;
      const stage = target.getStage();
      
      if (target === stage) {
        // Touched empty space
        clearSelection();
      } else {
        // Touched an element
        const elementId = target.attrs.id;
        if (elementId) {
          selectElement(elementId, false);
        }
      }
    }
  }, [selectElement, clearSelection]);

  const handleTouchMove = useCallback((e: KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    
    const touches = e.evt.touches;
    if (!touchState.current.touches || touches.length !== touchState.current.touches.length) {
      return;
    }

    if (touches.length === 1) {
      // Single touch - panning
      const touch = touches[0];
      const initialTouch = touchState.current.touches[0];
      
      const deltaX = touch.clientX - initialTouch.clientX;
      const deltaY = touch.clientY - initialTouch.clientY;
      
      setPan({
        x: pan.x + deltaX * 0.5,
        y: pan.y + deltaY * 0.5
      });
    } else if (touches.length === 2) {
      // Two finger gesture - zoom and rotate
      const currentDistance = getDistance(touches);
      const currentCenter = getCenter(touches);
      
      // Zoom based on pinch
      if (touchState.current.initialDistance > 0) {
        const scaleChange = currentDistance / touchState.current.initialDistance;
        const newZoom = Math.max(0.1, Math.min(5, zoom * scaleChange));
        setZoom(newZoom);
      }
      
      // Pan based on center movement
      const centerDeltaX = currentCenter.x - touchState.current.initialCenter.x;
      const centerDeltaY = currentCenter.y - touchState.current.initialCenter.y;
      
      setPan({
        x: pan.x + centerDeltaX * 0.3,
        y: pan.y + centerDeltaY * 0.3
      });
      
      // Update for next frame
      touchState.current.initialDistance = currentDistance;
      touchState.current.initialCenter = currentCenter;
    }
  }, [zoom, setZoom, pan, setPan]);

  const handleTouchEnd = useCallback((e: KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    
    const endTime = Date.now();
    const duration = endTime - touchState.current.startTime;
    
    // Reset touch state
    touchState.current = {
      touches: null,
      initialDistance: 0,
      initialRotation: 0,
      initialCenter: { x: 0, y: 0 },
      startTime: 0
    };
    
    // Handle tap gestures
    if (duration < 200) {
      // Quick tap - selection was handled in touchstart
    }
  }, []);

  // Double tap to zoom
  const handleDoubleTap = useCallback((e: KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    
    const target = e.target;
    const stage = target.getStage();
    
    if (!stage) return;
    
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    // Zoom in/out toggle
    const newZoom = zoom > 1.5 ? 1 : 2;
    setZoom(newZoom);
    
    // Center on tap point
    const centerX = stage.width() / 2;
    const centerY = stage.height() / 2;
    
    setPan({
      x: centerX - pointer.x * newZoom,
      y: centerY - pointer.y * newZoom
    });
  }, [zoom, setZoom, setPan]);

  const handleLongPress = useCallback((e: KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    
    // Long press could trigger context menu or multi-selection mode
    const target = e.target;
    const elementId = target.attrs?.id;
    
    if (elementId) {
      // Show context menu or enter multi-select mode
      selectElement(elementId, true);
    }
  }, [selectElement]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDoubleTap,
    handleLongPress
  };
};