import { useCallback, useEffect, useRef } from 'react';
import Konva from 'konva';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCommandStore } from '@/stores/commandStore';
import type { CanvasElement } from '@/types/canvas';

export interface CanvasHookReturn {
  stageRef: React.RefObject<Konva.Stage>;
  layerRef: React.RefObject<Konva.Layer>;
  
  // Canvas operations
  fitStageIntoParentContainer: () => void;
  resetTransform: () => void;
  centerView: () => void;
  zoomToFit: () => void;
  zoomToSelection: () => void;
  
  // Element operations
  addTextElement: (x: number, y: number, text?: string) => void;
  addImageElement: (x: number, y: number, src: string) => void;
  addShapeElement: (x: number, y: number, shapeType: string) => void;
  
  // Transform operations
  startTransform: () => void;
  endTransform: () => void;
  
  // Event handlers
  handleStageClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleStageMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleStageMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleStageMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  
  // Keyboard shortcuts
  setupKeyboardShortcuts: () => void;
  cleanupKeyboardShortcuts: () => void;
}

export const useCanvas = (): CanvasHookReturn => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const isTransforming = useRef(false);
  const isDragging = useRef(false);
  
  const {
    zoom,
    pan,
    canvasSize,
    selection,
    selectElement,
    selectElements,
    clearSelection,
    setZoom,
    setPan,
    addElement,
    copySelection,
    cutSelection,
    paste,
    selectAll,
    deleteElements,
    getElementById,
  } = useCanvasStore();
  
  const {
    executeCommand,
    createAddElementCommand,
    createDeleteElementCommand,
    createUpdateElementCommand,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useCommandStore();

  // Canvas operations
  const fitStageIntoParentContainer = useCallback(() => {
    const stage = stageRef.current;
    const container = stage?.container().parentElement;
    
    if (!stage || !container) return;
    
    // Get container dimensions
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    // Account for UI elements (similar to your onResize function)
    const availableWidth = containerWidth;
    const availableHeight = containerHeight - 56; // Bottom zoom controls space
    
    // Use canvas size as virtual dimensions reference
    const VIRTUAL_WIDTH = canvasSize.width;
    const VIRTUAL_HEIGHT = canvasSize.height;
    
    // Calculate scale to fit content while maintaining aspect ratio
    const scaleX = availableWidth / VIRTUAL_WIDTH;
    const scaleY = availableHeight / VIRTUAL_HEIGHT;
    const scale = Math.min(scaleX, scaleY, 1.0); // Don't scale up beyond 100%
    
    // Set stage dimensions (stage position is fixed at 0,0, scaling handled by layers)
    stage.setAttrs({
      width: availableWidth,
      height: availableHeight,
      scaleX: 1, // Don't scale the stage itself
      scaleY: 1, // Don't scale the stage itself
      x: 0, // Fixed position - no panning
      y: 0  // Fixed position - no panning
    });
    
    console.log(`🎯 Stage fitted: ${availableWidth}x${availableHeight} with ${scale.toFixed(2)}x scale`);
    
    // Update our zoom state to match the scale
    setZoom(scale);
    
    // Calculate centering offsets for the canvas content within the stage
    const scaledCanvasWidth = VIRTUAL_WIDTH * scale;
    const scaledCanvasHeight = VIRTUAL_HEIGHT * scale;
    const centerX = (availableWidth - scaledCanvasWidth) / 2;
    const centerY = (availableHeight - scaledCanvasHeight) / 2;
    
    // Use pan values to offset the layers for centering (layers will use these via transform)
    setPan({ x: centerX, y: centerY });
    
    stage.draw();
  }, [canvasSize.width, canvasSize.height, setZoom, setPan]);

  const resetTransform = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [setZoom, setPan]);

  const centerView = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    
    // Perfect center calculation - canvas should be exactly in the middle, accounting for bottom controls
    const zoomedCanvasWidth = canvasSize.width * zoom;
    const zoomedCanvasHeight = canvasSize.height * zoom;
    
    const centerX = (stageWidth - zoomedCanvasWidth) / 2;
    // Adjust centerY to account for bottom zoom controls (56px total space)
    const bottomControlsSpace = 56; // Bottom controls height + margin
    const availableVerticalSpace = stageHeight - bottomControlsSpace;
    const centerY = (availableVerticalSpace - zoomedCanvasHeight) / 2;
    
    setPan({ x: centerX, y: centerY });
    
    console.log(`📍 Canvas centered: zoom ${zoom.toFixed(2)}x at (${centerX.toFixed(1)}, ${centerY.toFixed(1)})`);
  }, [canvasSize, zoom, setPan]);

  const zoomToFit = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) {
      console.log('🚫 zoomToFit: No stage reference');
      return;
    }
    
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    
    // Account for bottom zoom controls and provide generous padding for centering
    const horizontalPadding = 120; // 60px margin on each side for better visual balance (increased from 80)
    const verticalPadding = 140; // Account for bottom controls + extra margin (increased from 120)
    
    const availableWidth = stageWidth - horizontalPadding;
    const availableHeight = stageHeight - verticalPadding;
    
    // Calculate zoom level that fits the canvas with margins
    const scaleX = availableWidth / canvasSize.width;
    const scaleY = availableHeight / canvasSize.height;
    const fitZoom = Math.min(scaleX, scaleY);
    
    // Intelligent zoom limits based on canvas size and container
    const maxZoom = canvasSize.width < 600 ? 1.5 : 1.2; // Allow larger zoom for smaller canvases
    const minZoom = 0.1;
    const newZoom = Math.max(minZoom, Math.min(fitZoom, maxZoom));
    
    console.log(`🎯 ZoomToFit: Canvas ${canvasSize.width}x${canvasSize.height} → ${newZoom.toFixed(2)}x zoom`);
    
    setZoom(newZoom);
    
    // Perfect center positioning - account for the actual zoomed canvas size and bottom controls
    const zoomedCanvasWidth = canvasSize.width * newZoom;
    const zoomedCanvasHeight = canvasSize.height * newZoom;
    
    const centerX = (stageWidth - zoomedCanvasWidth) / 2;
    // Adjust centerY to account for bottom zoom controls (56px total space)
    const bottomControlsSpace = 56; // Bottom controls height + margin
    const availableVerticalSpace = stageHeight - bottomControlsSpace;
    const centerY = (availableVerticalSpace - zoomedCanvasHeight) / 2;
    
    setPan({ x: centerX, y: centerY });
    
    console.log(`🎯 Canvas auto-fit: ${newZoom.toFixed(2)}x zoom, centered at (${centerX.toFixed(1)}, ${centerY.toFixed(1)})`);
  }, [canvasSize, setZoom, setPan, zoom]);

  const zoomToSelection = useCallback(() => {
    const selectedElements = useCanvasStore.getState().getSelectedElements();
    if (selectedElements.length === 0) return;
    
    const bounds = useCanvasStore.getState().getSelectionBounds();
    if (!bounds) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    const scaleX = stageWidth / bounds.width;
    const scaleY = stageHeight / bounds.height;
    const newZoom = Math.min(scaleX, scaleY) * 0.8; // 80% to add some padding
    
    setZoom(newZoom);
    
    const centerX = stageWidth / 2 - (bounds.x + bounds.width / 2) * newZoom;
    const centerY = stageHeight / 2 - (bounds.y + bounds.height / 2) * newZoom;
    
    setPan({ x: centerX, y: centerY });
  }, [setZoom, setPan]);

  // Element creation helpers with command pattern
  const addTextElement = useCallback((x: number, y: number, text = 'New Text') => {
    const element: CanvasElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      x,
      y,
      width: 200,
      height: 50,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      text,
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: 18,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      verticalAlign: 'top',
      color: '#000000',
      lineHeight: 1.2,
      letterSpacing: 0,
      textDecoration: 'none',
      textTransform: 'none',
      wordWrap: true,
    } as CanvasElement;
    
    const command = createAddElementCommand(element);
    executeCommand(command);
    selectElement(element.id);
  }, [createAddElementCommand, executeCommand, selectElement]);

  const addImageElement = useCallback((x: number, y: number, src: string) => {
    const element: CanvasElement = {
      id: `image_${Date.now()}`,
      type: 'image',
      x,
      y,
      width: 200,
      height: 150,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      src,
      originalWidth: 200,
      originalHeight: 150,
      fit: 'cover',
    } as CanvasElement;
    
    addElement(element);
    selectElement(element.id);
  }, [addElement, selectElement]);

  const addShapeElement = useCallback((x: number, y: number, shapeType: string) => {
    const element: CanvasElement = {
      id: `shape_${Date.now()}`,
      type: 'shape',
      x,
      y,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      shapeType: shapeType as any,
      fill: '#007bff',
      stroke: '#0056b3',
      strokeWidth: 2,
    } as CanvasElement;
    
    addElement(element);
    selectElement(element.id);
  }, [addElement, selectElement]);

  // Transform operations
  const startTransform = useCallback(() => {
    isTransforming.current = true;
  }, []);

  const endTransform = useCallback(() => {
    isTransforming.current = false;
    // Push to history after transform
    useCanvasStore.getState().pushHistory('TRANSFORM_ELEMENTS', 'Transformed elements');
  }, []);

  // Event handlers
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicking on stage background, clear selection
    if (e.target === e.target.getStage()) {
      clearSelection();
    }
  }, [clearSelection]);

  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Handle selection logic here
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (clickedOnEmpty) {
      clearSelection();
      return;
    }
    
    // Handle element selection
    const elementId = e.target.attrs.id;
    if (elementId) {
      const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
      selectElement(elementId, isMultiSelect);
    }
  }, [clearSelection, selectElement]);

  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Handle mouse move logic (e.g., for drawing tools, selection box)
    if (isDragging.current) {
      // Handle dragging logic
    }
  }, []);

  const handleStageMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const oldScale = zoom;
    
    // Simple zoom behavior - only change zoom level, centering is handled by fitStageIntoParentContainer
    const baseZoomSpeed = 0.1;
    const adaptiveZoomSpeed = Math.max(baseZoomSpeed, oldScale * 0.05);
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newZoom = Math.max(0.1, Math.min(3, oldScale + direction * adaptiveZoomSpeed));
    
    setZoom(newZoom);
    
    // Recalculate centering for the new zoom level
    const stageWidth = stage.width();
    const stageHeight = stage.height() - 56; // Account for bottom controls
    const scaledCanvasWidth = canvasSize.width * newZoom;
    const scaledCanvasHeight = canvasSize.height * newZoom;
    const centerX = (stageWidth - scaledCanvasWidth) / 2;
    const centerY = (stageHeight - scaledCanvasHeight) / 2;
    
    setPan({ x: centerX, y: centerY });
  }, [zoom, canvasSize, setZoom, setPan, stageRef]);

  // Keyboard shortcuts
  const setupKeyboardShortcuts = useCallback(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;
      
      // Prevent default browser shortcuts
      if (isCtrl && ['a', 'c', 'v', 'x', 'z', 'y', 'd', 'g'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      
      switch (e.key.toLowerCase()) {
        // Selection shortcuts
        case 'a':
          if (isCtrl) selectAll();
          break;
        
        // Clipboard shortcuts
        case 'c':
          if (isCtrl) copySelection();
          break;
        case 'v':
          if (isCtrl) paste();
          break;
        case 'x':
          if (isCtrl) cutSelection();
          break;
        case 'd':
          if (isCtrl && selection.length > 0) {
            e.preventDefault();
            if (selection.length === 1) {
              useCanvasStore.getState().duplicateElement(selection[0]);
            } else {
              useCanvasStore.getState().duplicateElements(selection);
            }
          }
          break;
        
        // History shortcuts
        case 'z':
          if (isCtrl && !isShift && canUndo()) undo();
          else if (isCtrl && isShift && canRedo()) redo();
          break;
        case 'y':
          if (isCtrl && canRedo()) redo();
          break;
        
        // Delete shortcuts with command pattern
        case 'delete':
        case 'backspace':
          if (selection.length > 0) {
            const batchId = useCommandStore.getState().startBatch('Delete Elements');
            selection.forEach(id => {
              const element = getElementById(id);
              if (element) {
                const command = createDeleteElementCommand(id, element);
                executeCommand(command);
              }
            });
            useCommandStore.getState().endBatch(batchId);
          }
          break;
        
        // Selection control
        case 'escape':
          clearSelection();
          break;
        
        // View shortcuts
        case '0':
          if (isCtrl) {
            resetTransform();
            centerView();
          }
          break;
        case '1':
          if (isCtrl) zoomToFit();
          break;
        case '2':
          if (isCtrl && selection.length > 0) zoomToSelection();
          break;
        
        // Layer shortcuts
        case ']':
          if (isCtrl && isShift && selection.length > 0) {
            selection.forEach(id => useCanvasStore.getState().moveToFront(id));
          } else if (isCtrl && selection.length > 0) {
            selection.forEach(id => useCanvasStore.getState().moveForward(id));
          }
          break;
        case '[':
          if (isCtrl && isShift && selection.length > 0) {
            selection.forEach(id => useCanvasStore.getState().moveToBack(id));
          } else if (isCtrl && selection.length > 0) {
            selection.forEach(id => useCanvasStore.getState().moveBackward(id));
          }
          break;
        
        // Group shortcuts
        case 'g':
          if (isCtrl && isShift && selection.length === 1) {
            // TODO: Implement ungrouping in future task
            console.log('Ungroup selected element');
          } else if (isCtrl && selection.length > 1) {
            // TODO: Implement grouping in future task
            console.log('Group selected elements');
          }
          break;
          
        // Lock shortcuts
        case 'l':
          if (isCtrl && selection.length > 0) {
            e.preventDefault();
            selection.forEach(id => {
              const element = useCanvasStore.getState().getElementById(id);
              if (element) {
                useCanvasStore.getState().updateElement(id, { locked: !element.locked });
              }
            });
          }
          break;
          
        // Visibility shortcuts
        case 'h':
          if (isCtrl && selection.length > 0) {
            e.preventDefault();
            selection.forEach(id => {
              const element = useCanvasStore.getState().getElementById(id);
              if (element) {
                useCanvasStore.getState().updateElement(id, { visible: !element.visible });
              }
            });
          }
          break;
          
        // Quick element creation
        case 't':
          if (isAlt) {
            e.preventDefault();
            const centerX = canvasSize.width / 2;
            const centerY = canvasSize.height / 2;
            addTextElement(centerX - 100, centerY - 25, 'New Text');
          }
          break;
        case 'r':
          if (isAlt) {
            e.preventDefault();
            const centerX = canvasSize.width / 2;
            const centerY = canvasSize.height / 2;
            addShapeElement(centerX - 50, centerY - 50, 'rectangle');
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectAll,
    copySelection,
    paste,
    cutSelection,
    undo,
    redo,
    canUndo,
    canRedo,
    selection,
    canvasSize,
    deleteElements,
    clearSelection,
    resetTransform,
    centerView,
    zoomToFit,
    zoomToSelection,
  ]);

  const cleanupKeyboardShortcuts = useCallback(() => {
    // This will be handled by the return function of setupKeyboardShortcuts
  }, []);

  // Setup shortcuts on mount
  useEffect(() => {
    const cleanup = setupKeyboardShortcuts();
    return cleanup;
  }, [setupKeyboardShortcuts]);

  // Fit stage into container on mount
  useEffect(() => {
    fitStageIntoParentContainer();
    
    const handleResize = () => fitStageIntoParentContainer();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [fitStageIntoParentContainer]);

  return {
    stageRef,
    layerRef,
    fitStageIntoParentContainer,
    resetTransform,
    centerView,
    zoomToFit,
    zoomToSelection,
    addTextElement,
    addImageElement,
    addShapeElement,
    startTransform,
    endTransform,
    handleStageClick,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    handleWheel,
    setupKeyboardShortcuts,
    cleanupKeyboardShortcuts,
  };
};