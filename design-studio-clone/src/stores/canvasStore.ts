import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CanvasState, CanvasElement, SelectionBounds, HistoryState } from '../types/canvas';

interface CanvasStore extends CanvasState {
  // History management
  history: HistoryState[];
  historyIndex: number;
  maxHistorySize: number;

  // Actions
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  deleteElements: (ids: string[]) => void;
  duplicateElement: (id: string) => void;
  duplicateElements: (ids: string[]) => void;
  
  // Selection management
  selectElement: (id: string, multi?: boolean) => void;
  selectElements: (ids: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Layer management
  moveToFront: (id: string) => void;
  moveToBack: (id: string) => void;
  moveForward: (id: string) => void;
  moveBackward: (id: string) => void;
  
  // Transform operations
  transformElements: (ids: string[], transform: Partial<CanvasElement>) => void;
  
  // Canvas operations
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  setBackgroundColor: (color: string) => void;
  fitCanvasToContainer: (containerWidth: number, containerHeight: number) => void;
  
  // Grid and guides
  toggleGrid: () => void;
  toggleGuides: () => void;
  setGridSize: (size: number) => void;
  toggleSnapToGrid: () => void;
  toggleSnapToGuides: () => void;
  
  // Clipboard operations
  copySelection: () => void;
  cutSelection: () => void;
  paste: () => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: (action: string, description?: string) => void;
  clearHistory: () => void;
  
  // Utility methods
  getElementById: (id: string) => CanvasElement | undefined;
  getSelectedElements: () => CanvasElement[];
  getSelectionBounds: () => SelectionBounds | null;
  isSelected: (id: string) => boolean;
}

const generateId = (): string => {
  return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createHistoryState = (elements: CanvasElement[], canvasSize: { width: number; height: number }, action: string, description = ''): HistoryState => ({
  elements: JSON.parse(JSON.stringify(elements)),
  canvasSize: { ...canvasSize },
  timestamp: Date.now(),
  action,
  description
});

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    (set, get) => ({
      // Initial state with sample elements to demonstrate Konva functionality
      elements: [
        {
          id: 'sample-text',
          type: 'text',
          x: 100,
          y: 100,
          width: 200,
          height: 60,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          visible: true,
          locked: false,
          zIndex: 1,
          text: 'Sample Text Element',
          fontSize: 24,
          fontFamily: 'Arial',
          fontStyle: 'normal',
          fontWeight: 'normal',
          color: '#333333',
          textAlign: 'left',
          verticalAlign: 'top',
          lineHeight: 1.2,
          letterSpacing: 0,
          textDecoration: '',
          wordWrap: false
        },
        {
          id: 'sample-rect',
          type: 'shape',
          x: 150,
          y: 200,
          width: 120,
          height: 80,
          rotation: 15,
          scaleX: 1,
          scaleY: 1,
          opacity: 0.8,
          visible: true,
          locked: false,
          zIndex: 2,
          fill: '#48aff0',
          stroke: '#2c5282',
          strokeWidth: 2,
          cornerRadius: 8
        }
      ] as CanvasElement[],
      selection: [],
      clipboard: [],
      zoom: 1,
      pan: { x: 0, y: 0 },
      canvasSize: { width: 1000, height: 625 }, // Default 16:10 aspect ratio - will be auto-fit on load
      backgroundColor: '#ffffff',
      showGrid: false,
      gridSize: 20,
      snapToGrid: false,
      showGuides: false,
      snapToGuides: false,
      
      history: [],
      historyIndex: -1,
      maxHistorySize: 100,

      // Element management
      addElement: (element) => {
        set((state) => {
          const newElement = { ...element, id: element.id || generateId() };
          const newElements = [...state.elements, newElement];
          const newState = { ...state, elements: newElements };
          
          // Push to history
          const historyState = createHistoryState(newElements, state.canvasSize, 'ADD_ELEMENT', `Added ${element.type} element`);
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(historyState);
          
          if (newHistory.length > state.maxHistorySize) {
            newHistory.shift();
          }
          
          return {
            ...newState,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      updateElement: (id, updates) => {
        set((state) => {
          const elementIndex = state.elements.findIndex(el => el.id === id);
          if (elementIndex === -1) return state;
          
          const newElements = [...state.elements];
          newElements[elementIndex] = { 
            ...newElements[elementIndex], 
            ...updates, 
            updatedAt: Date.now() 
          };
          
          return { ...state, elements: newElements };
        });
      },

      deleteElement: (id) => {
        set((state) => {
          const newElements = state.elements.filter(el => el.id !== id);
          const newSelection = state.selection.filter(selId => selId !== id);
          const newState = {
            ...state,
            elements: newElements,
            selection: newSelection,
          };
          
          // Push to history
          const historyState = createHistoryState(newElements, state.canvasSize, 'DELETE_ELEMENT', 'Deleted element');
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(historyState);
          
          return {
            ...newState,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      deleteElements: (ids) => {
        set((state) => {
          const newElements = state.elements.filter(el => !ids.includes(el.id));
          const newSelection = state.selection.filter(selId => !ids.includes(selId));
          const newState = {
            ...state,
            elements: newElements,
            selection: newSelection,
          };
          
          // Push to history
          const historyState = createHistoryState(newElements, state.canvasSize, 'DELETE_ELEMENTS', `Deleted ${ids.length} elements`);
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(historyState);
          
          return {
            ...newState,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      duplicateElement: (id) => {
        set((state) => {
          const element = state.elements.find(el => el.id === id);
          if (!element) return state;
          
          const duplicatedElement = {
            ...JSON.parse(JSON.stringify(element)),
            id: generateId(),
            x: element.x + 20,
            y: element.y + 20,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          
          const newElements = [...state.elements, duplicatedElement];
          const newState = {
            ...state,
            elements: newElements,
            selection: [duplicatedElement.id],
          };
          
          // Push to history
          const historyState = createHistoryState(newElements, state.canvasSize, 'DUPLICATE_ELEMENT', 'Duplicated element');
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(historyState);
          
          return {
            ...newState,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      duplicateElements: (ids) => {
        set((state) => {
          const elements = state.elements.filter(el => ids.includes(el.id));
          const duplicatedElements = elements.map(element => ({
            ...JSON.parse(JSON.stringify(element)),
            id: generateId(),
            x: element.x + 20,
            y: element.y + 20,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }));
          
          const newElements = [...state.elements, ...duplicatedElements];
          const newState = {
            ...state,
            elements: newElements,
            selection: duplicatedElements.map(el => el.id),
          };
          
          // Push to history
          const historyState = createHistoryState(newElements, state.canvasSize, 'DUPLICATE_ELEMENTS', `Duplicated ${ids.length} elements`);
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(historyState);
          
          return {
            ...newState,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      // Selection management
      selectElement: (id, multi = false) => {
        set((state) => {
          if (!state.elements.find(el => el.id === id)) return state;
          
          const newSelection = multi && state.selection.includes(id)
            ? state.selection.filter(selId => selId !== id)
            : multi
            ? [...state.selection, id]
            : [id];
            
          return { ...state, selection: newSelection };
        });
      },

      selectElements: (ids) => {
        set((state) => ({
          ...state,
          selection: ids.filter(id => state.elements.find(el => el.id === id)),
        }));
      },

      clearSelection: () => {
        set((state) => ({ ...state, selection: [] }));
      },

      selectAll: () => {
        set((state) => ({
          ...state,
          selection: state.elements.map(el => el.id),
        }));
      },

      // Layer management
      moveToFront: (id) => {
        set((state) => {
          const element = state.elements.find(el => el.id === id);
          if (!element) return state;
          
          const maxZIndex = Math.max(...state.elements.map(el => el.zIndex));
          return get().updateElement(id, { zIndex: maxZIndex + 1 });
        });
      },

      moveToBack: (id) => {
        set((state) => {
          const element = state.elements.find(el => el.id === id);
          if (!element) return state;
          
          const minZIndex = Math.min(...state.elements.map(el => el.zIndex));
          return get().updateElement(id, { zIndex: minZIndex - 1 });
        });
      },

      moveForward: (id) => {
        set((state) => {
          const element = state.elements.find(el => el.id === id);
          if (!element) return state;
          
          return get().updateElement(id, { zIndex: element.zIndex + 1 });
        });
      },

      moveBackward: (id) => {
        set((state) => {
          const element = state.elements.find(el => el.id === id);
          if (!element) return state;
          
          return get().updateElement(id, { zIndex: Math.max(0, element.zIndex - 1) });
        });
      },

      // Transform operations
      transformElements: (ids, transform) => {
        set((state) => {
          const newElements = state.elements.map(element => {
            if (ids.includes(element.id)) {
              // Handle flip operations by inverting scale
              const updates = { ...transform };
              if ('scaleX' in updates && updates.scaleX === -1) {
                updates.scaleX = element.scaleX * -1;
              }
              if ('scaleY' in updates && updates.scaleY === -1) {
                updates.scaleY = element.scaleY * -1;
              }
              return { ...element, ...updates, updatedAt: Date.now() };
            }
            return element;
          });
          
          // Push to history
          const historyState = createHistoryState(newElements, state.canvasSize, 'TRANSFORM', `Transformed ${ids.length} elements`);
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(historyState);
          
          return { 
            ...state, 
            elements: newElements,
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        });
      },

      // Canvas operations
      setZoom: (zoom) => {
        const clampedZoom = Math.max(0.1, Math.min(5, zoom));
        set((state) => ({ ...state, zoom: clampedZoom }));
      },

      setPan: (pan) => {
        set((state) => ({ ...state, pan }));
      },

      setCanvasSize: (canvasSize) => {
        set((state) => {
          console.log(`📏 Canvas size changed from ${state.canvasSize.width}x${state.canvasSize.height} to ${canvasSize.width}x${canvasSize.height}`);
          return { ...state, canvasSize };
        });
      },

      setBackgroundColor: (backgroundColor) => {
        set((state) => ({ ...state, backgroundColor }));
      },

      fitCanvasToContainer: (containerWidth, containerHeight) => {
        // Account for UI elements and provide comfortable margins
        const horizontalPadding = 100; // Generous horizontal margins for centering
        const verticalPadding = 140; // Account for top bar, bottom controls, and margins
        
        const availableWidth = Math.max(400, containerWidth - horizontalPadding);
        const availableHeight = Math.max(300, containerHeight - verticalPadding);
        
        // Use 85% of available space for better visual balance
        const usagePercent = 0.85;
        const targetWidth = availableWidth * usagePercent;
        const targetHeight = availableHeight * usagePercent;
        
        // Default to 16:10 aspect ratio (excellent for design work)
        const defaultAspectRatio = 16 / 10;
        let canvasWidth, canvasHeight;
        
        // Calculate optimal dimensions maintaining aspect ratio
        if (targetWidth / targetHeight > defaultAspectRatio) {
          // Height is the constraint - fit to height
          canvasHeight = targetHeight;
          canvasWidth = canvasHeight * defaultAspectRatio;
        } else {
          // Width is the constraint - fit to width
          canvasWidth = targetWidth;
          canvasHeight = canvasWidth / defaultAspectRatio;
        }
        
        // Apply reasonable size bounds for usability
        canvasWidth = Math.max(500, Math.min(canvasWidth, 1600));
        canvasHeight = Math.max(300, Math.min(canvasHeight, 1200));
        
        const newSize = {
          width: Math.round(canvasWidth),
          height: Math.round(canvasHeight)
        };
        
        console.log(`🎯 Auto-fit canvas: ${newSize.width}x${newSize.height} (from container: ${containerWidth}x${containerHeight}, aspect: ${(newSize.width/newSize.height).toFixed(2)})`);
        
        set((state) => ({ ...state, canvasSize: newSize }));
      },

      // Grid and guides
      toggleGrid: () => {
        set((state) => ({ ...state, showGrid: !state.showGrid }));
      },

      toggleGuides: () => {
        set((state) => ({ ...state, showGuides: !state.showGuides }));
      },

      setGridSize: (gridSize) => {
        set((state) => ({ ...state, gridSize: Math.max(5, gridSize) }));
      },

      toggleSnapToGrid: () => {
        set((state) => ({ ...state, snapToGrid: !state.snapToGrid }));
      },

      toggleSnapToGuides: () => {
        set((state) => ({ ...state, snapToGuides: !state.snapToGuides }));
      },

      // Clipboard operations
      copySelection: () => {
        set((state) => {
          const selectedElements = state.elements.filter(el => state.selection.includes(el.id));
          return {
            ...state,
            clipboard: JSON.parse(JSON.stringify(selectedElements)),
          };
        });
      },

      cutSelection: () => {
        const { copySelection, deleteElements, selection } = get();
        copySelection();
        deleteElements(selection);
      },

      paste: () => {
        set((state) => {
          if (state.clipboard.length === 0) return state;
          
          const pastedElements = state.clipboard.map(element => ({
            ...JSON.parse(JSON.stringify(element)),
            id: generateId(),
            x: element.x + 20,
            y: element.y + 20,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }));
          
          const newElements = [...state.elements, ...pastedElements];
          const newState = {
            ...state,
            elements: newElements,
            selection: pastedElements.map(el => el.id),
          };
          
          // Push to history
          const historyState = createHistoryState(newElements, state.canvasSize, 'PASTE', `Pasted ${pastedElements.length} elements`);
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(historyState);
          
          return {
            ...newState,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      // History operations
      undo: () => {
        set((state) => {
          if (state.historyIndex <= 0) return state;
          
          const previousState = state.history[state.historyIndex - 1];
          return {
            ...state,
            elements: JSON.parse(JSON.stringify(previousState.elements)),
            canvasSize: { ...previousState.canvasSize },
            historyIndex: state.historyIndex - 1,
            selection: [], // Clear selection after undo
          };
        });
      },

      redo: () => {
        set((state) => {
          if (state.historyIndex >= state.history.length - 1) return state;
          
          const nextState = state.history[state.historyIndex + 1];
          return {
            ...state,
            elements: JSON.parse(JSON.stringify(nextState.elements)),
            canvasSize: { ...nextState.canvasSize },
            historyIndex: state.historyIndex + 1,
            selection: [], // Clear selection after redo
          };
        });
      },

      canUndo: () => get().historyIndex > 0,

      canRedo: () => get().historyIndex < get().history.length - 1,

      pushHistory: (action, description = '') => {
        set((state) => {
          const historyState = createHistoryState(state.elements, state.canvasSize, action, description);
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(historyState);
          
          if (newHistory.length > state.maxHistorySize) {
            newHistory.shift();
          }
          
          return {
            ...state,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      clearHistory: () => {
        set((state) => ({
          ...state,
          history: [],
          historyIndex: -1,
        }));
      },

      // Utility methods
      getElementById: (id) => {
        return get().elements.find(el => el.id === id);
      },

      getSelectedElements: () => {
        const { elements, selection } = get();
        return elements.filter(el => selection.includes(el.id));
      },

      getSelectionBounds: () => {
        const selectedElements = get().getSelectedElements();
        if (selectedElements.length === 0) return null;
        
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        
        selectedElements.forEach(element => {
          const x1 = element.x;
          const y1 = element.y;
          const x2 = element.x + element.width;
          const y2 = element.y + element.height;
          
          minX = Math.min(minX, x1);
          minY = Math.min(minY, y1);
          maxX = Math.max(maxX, x2);
          maxY = Math.max(maxY, y2);
        });
        
        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          rotation: 0, // TODO: Handle rotation in group selection
        };
      },

      isSelected: (id) => get().selection.includes(id),
    }),
    {
      name: 'canvas-store',
    }
  )
);