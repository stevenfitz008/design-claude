import { useState, useCallback, useRef, useEffect } from 'react';
import type { UnsplashPhoto } from '@/services/unsplashService';

export interface DragData {
  photo: UnsplashPhoto;
  dragStart: { x: number; y: number };
  offset: { x: number; y: number };
}

export interface DragState {
  isDragging: boolean;
  dragData: DragData | null;
  dragImage: HTMLElement | null;
  currentPosition: { x: number; y: number };
  dropZones: DropZone[];
  activeDropZone: string | null;
}

export interface DropZone {
  id: string;
  element: HTMLElement;
  bounds: DOMRect;
  accepts: (photo: UnsplashPhoto) => boolean;
  onDrop: (photo: UnsplashPhoto, position: { x: number; y: number }) => void;
  highlightClass?: string;
}

export interface UseDragAndDropOptions {
  dragThreshold?: number;
  enableGhost?: boolean;
  ghostOpacity?: number;
  dragCursor?: string;
  onDragStart?: (photo: UnsplashPhoto) => void;
  onDragEnd?: (photo: UnsplashPhoto, success: boolean) => void;
  onDragOver?: (photo: UnsplashPhoto, dropZone: DropZone | null) => void;
}

export function useDragAndDrop(options: UseDragAndDropOptions = {}) {
  const {
    dragThreshold = 5,
    enableGhost = true,
    ghostOpacity = 0.7,
    dragCursor = 'grabbing',
    onDragStart,
    onDragEnd,
    onDragOver,
  } = options;

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragData: null,
    dragImage: null,
    currentPosition: { x: 0, y: 0 },
    dropZones: [],
    activeDropZone: null,
  });

  const dragElementRef = useRef<HTMLElement>();
  const ghostImageRef = useRef<HTMLElement>();
  const originalCursor = useRef<string>();
  const dragStartTimeRef = useRef<number>();

  // Register drop zone
  const registerDropZone = useCallback((dropZone: DropZone) => {
    setDragState(prev => ({
      ...prev,
      dropZones: [...prev.dropZones.filter(dz => dz.id !== dropZone.id), dropZone],
    }));

    return () => {
      setDragState(prev => ({
        ...prev,
        dropZones: prev.dropZones.filter(dz => dz.id !== dropZone.id),
      }));
    };
  }, []);

  // Find active drop zone based on current mouse position
  const findActiveDropZone = useCallback((x: number, y: number) => {
    return dragState.dropZones.find(zone => {
      const rect = zone.bounds;
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
  }, [dragState.dropZones]);

  // Create ghost image
  const createGhostImage = useCallback((element: HTMLElement, photo: UnsplashPhoto) => {
    if (!enableGhost) return null;

    const ghost = element.cloneNode(true) as HTMLElement;
    ghost.style.position = 'fixed';
    ghost.style.top = '-9999px';
    ghost.style.left = '-9999px';
    ghost.style.width = `${element.offsetWidth}px`;
    ghost.style.height = `${element.offsetHeight}px`;
    ghost.style.opacity = ghostOpacity.toString();
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '10000';
    ghost.style.transform = 'rotate(3deg)';
    ghost.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
    ghost.style.border = '2px solid #4A90E2';
    ghost.style.borderRadius = '8px';

    document.body.appendChild(ghost);
    return ghost;
  }, [enableGhost, ghostOpacity]);

  // Update ghost position
  const updateGhostPosition = useCallback((x: number, y: number, offset: { x: number; y: number }) => {
    if (ghostImageRef.current) {
      ghostImageRef.current.style.left = `${x - offset.x}px`;
      ghostImageRef.current.style.top = `${y - offset.y}px`;
    }
  }, []);

  // Handle mouse down - prepare for potential drag
  const handleMouseDown = useCallback((
    event: React.MouseEvent<HTMLElement>,
    photo: UnsplashPhoto,
    element: HTMLElement
  ) => {
    if (event.button !== 0) return; // Only left mouse button

    const startX = event.clientX;
    const startY = event.clientY;
    const elementRect = element.getBoundingClientRect();
    
    const offset = {
      x: startX - elementRect.left,
      y: startY - elementRect.top,
    };

    dragElementRef.current = element;
    dragStartTimeRef.current = Date.now();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Start dragging if threshold is exceeded
      if (distance > dragThreshold && !dragState.isDragging) {
        const ghostImage = createGhostImage(element, photo);
        ghostImageRef.current = ghostImage;

        // Store original cursor and set drag cursor
        originalCursor.current = document.body.style.cursor;
        document.body.style.cursor = dragCursor;

        setDragState(prev => ({
          ...prev,
          isDragging: true,
          dragData: {
            photo,
            dragStart: { x: startX, y: startY },
            offset,
          },
          dragImage: ghostImage,
          currentPosition: { x: moveEvent.clientX, y: moveEvent.clientY },
        }));

        onDragStart?.(photo);
      }

      // Update position during drag
      if (dragState.isDragging || distance > dragThreshold) {
        const currentPosition = { x: moveEvent.clientX, y: moveEvent.clientY };
        
        updateGhostPosition(moveEvent.clientX, moveEvent.clientY, offset);
        
        const activeDropZone = findActiveDropZone(moveEvent.clientX, moveEvent.clientY);
        const activeDropZoneId = activeDropZone?.id || null;

        setDragState(prev => ({
          ...prev,
          currentPosition,
          activeDropZone: activeDropZoneId,
        }));

        onDragOver?.(photo, activeDropZone || null);

        // Update drop zone highlights
        dragState.dropZones.forEach(zone => {
          const isActive = zone.id === activeDropZoneId && zone.accepts(photo);
          zone.element.classList.toggle(zone.highlightClass || 'drag-over', isActive);
        });
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const dragDuration = Date.now() - (dragStartTimeRef.current || 0);
      let success = false;

      if (dragState.isDragging) {
        const activeDropZone = findActiveDropZone(upEvent.clientX, upEvent.clientY);
        
        if (activeDropZone && activeDropZone.accepts(photo)) {
          // Calculate relative position within the drop zone
          const dropZoneRect = activeDropZone.bounds;
          const relativePosition = {
            x: upEvent.clientX - dropZoneRect.left,
            y: upEvent.clientY - dropZoneRect.top,
          };
          
          activeDropZone.onDrop(photo, relativePosition);
          success = true;
        }

        // Clean up ghost image
        if (ghostImageRef.current) {
          document.body.removeChild(ghostImageRef.current);
          ghostImageRef.current = null;
        }

        // Restore cursor
        if (originalCursor.current !== undefined) {
          document.body.style.cursor = originalCursor.current;
        }

        // Clear drop zone highlights
        dragState.dropZones.forEach(zone => {
          zone.element.classList.remove(zone.highlightClass || 'drag-over');
        });

        onDragEnd?.(photo, success);
      }

      // Reset drag state
      setDragState({
        isDragging: false,
        dragData: null,
        dragImage: null,
        currentPosition: { x: 0, y: 0 },
        dropZones: dragState.dropZones, // Keep registered drop zones
        activeDropZone: null,
      });

      // Clean up event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseenter', preventDragInterference);
      document.removeEventListener('mouseleave', preventDragInterference);
    };

    // Prevent drag interference with other elements
    const preventDragInterference = (event: MouseEvent) => {
      if (dragState.isDragging) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseenter', preventDragInterference);
    document.addEventListener('mouseleave', preventDragInterference);

    // Prevent default drag behavior
    event.preventDefault();
  }, [
    dragThreshold,
    dragState.isDragging,
    dragState.dropZones,
    createGhostImage,
    updateGhostPosition,
    findActiveDropZone,
    dragCursor,
    onDragStart,
    onDragEnd,
    onDragOver,
  ]);

  // Touch events for mobile support
  const handleTouchStart = useCallback((
    event: React.TouchEvent<HTMLElement>,
    photo: UnsplashPhoto,
    element: HTMLElement
  ) => {
    // Convert touch event to mouse-like event and delegate
    const touch = event.touches[0];
    const mouseEvent = {
      button: 0,
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: event.preventDefault.bind(event),
    } as React.MouseEvent<HTMLElement>;

    handleMouseDown(mouseEvent, photo, element);
  }, [handleMouseDown]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (ghostImageRef.current && document.body.contains(ghostImageRef.current)) {
        document.body.removeChild(ghostImageRef.current);
      }
      if (originalCursor.current !== undefined) {
        document.body.style.cursor = originalCursor.current;
      }
    };
  }, []);

  return {
    dragState,
    handleMouseDown,
    handleTouchStart,
    registerDropZone,
    isDragging: dragState.isDragging,
    currentDragPhoto: dragState.dragData?.photo || null,
    activeDropZone: dragState.activeDropZone,
  };
}