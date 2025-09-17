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
    
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    stage.width(containerWidth);
    stage.height(containerHeight);
  }, []);

  const resetTransform = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [setZoom, setPan]);

  const centerView = useCallback(() => {
    // Stage is automatically centered in CanvasEngine - no manual centering needed
    console.log('🎯 Center view: Stage is automatically centered');
  }, []);

  const zoomToFit = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const stageWidth = stage.width();
    const stageHeight = stage.height();

    // Reserve space for bottom zoom controls
    const availableWidth = stageWidth - 20; // Minimal horizontal padding
    const availableHeight = stageHeight - 60; // Space for bottom zoom controls

    const scaleX = availableWidth / canvasSize.width;
    const scaleY = availableHeight / canvasSize.height;
    const newZoom = Math.min(scaleX, scaleY);

    console.log(`🔍 ZoomToFit: stage(${stageWidth}x${stageHeight}) canvas(${canvasSize.width}x${canvasSize.height}) → zoom ${newZoom.toFixed(2)} (auto-centered)`);

    setZoom(newZoom);
    // Stage is automatically centered in CanvasEngine - no manual pan needed
  }, [canvasSize, setZoom]);

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

    // Zoom speed
    const zoomSpeed = 0.1;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newZoom = Math.max(0.1, Math.min(5, oldScale + direction * zoomSpeed));

    setZoom(newZoom);
    // Stage is automatically centered - no pan calculations needed
  }, [zoom, setZoom]);

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