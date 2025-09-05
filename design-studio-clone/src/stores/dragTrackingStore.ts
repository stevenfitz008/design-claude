import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface DragOperation {
  id: string;
  type: 'panel-to-canvas' | 'canvas-element' | 'layer-reorder';
  sourceType: string; // 'photo', 'shape', 'text', 'video', etc.
  sourceData: any;
  startTime: number;
  startPosition: { x: number; y: number };
  endTime?: number;
  endPosition?: { x: number; y: number };
  targetType?: 'canvas' | 'layer' | 'panel';
  targetId?: string;
  resultElementId?: string;
  success: boolean;
  metadata: Record<string, any>;
}

export interface DragTrackingState {
  currentDrag: DragOperation | null;
  dragHistory: DragOperation[];
  isDropzoneActive: boolean;
  dropPreview: {
    visible: boolean;
    x: number;
    y: number;
    type: string;
    preview?: string;
  } | null;
  // Analytics
  totalDrags: number;
  successfulDrags: number;
  dragsByType: Record<string, number>;
  averageDragDuration: number;
}

interface DragTrackingStore extends DragTrackingState {
  // Actions
  startDrag: (operation: Omit<DragOperation, 'id' | 'startTime' | 'success'>) => void;
  updateDrag: (updates: Partial<DragOperation>) => void;
  endDrag: (success: boolean, resultElementId?: string) => void;
  cancelDrag: () => void;
  
  // Dropzone management
  setDropzoneActive: (active: boolean) => void;
  updateDropPreview: (preview: DragTrackingState['dropPreview']) => void;
  clearDropPreview: () => void;
  
  // History and analytics
  getDragHistory: (limit?: number) => DragOperation[];
  getDragAnalytics: () => {
    totalDrags: number;
    successRate: number;
    mostDraggedType: string;
    averageDuration: number;
  };
  clearHistory: () => void;
  
  // Helpers
  getCurrentDragType: () => string | null;
  isValidDropTarget: (targetType: string, targetId?: string) => boolean;
}

const generateId = (): string => {
  return `drag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useDragTrackingStore = create<DragTrackingStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentDrag: null,
      dragHistory: [],
      isDropzoneActive: false,
      dropPreview: null,
      totalDrags: 0,
      successfulDrags: 0,
      dragsByType: {},
      averageDragDuration: 0,

      // Actions
      startDrag: (operation) => {
        const dragOperation: DragOperation = {
          ...operation,
          id: generateId(),
          startTime: Date.now(),
          success: false,
        };

        set((state) => ({
          currentDrag: dragOperation,
          isDropzoneActive: true,
          totalDrags: state.totalDrags + 1,
          dragsByType: {
            ...state.dragsByType,
            [operation.sourceType]: (state.dragsByType[operation.sourceType] || 0) + 1,
          },
        }));

        console.log('🎯 Started drag operation:', dragOperation);
      },

      updateDrag: (updates) => {
        set((state) => {
          if (!state.currentDrag) return state;
          
          return {
            currentDrag: { ...state.currentDrag, ...updates },
          };
        });
      },

      endDrag: (success, resultElementId) => {
        set((state) => {
          if (!state.currentDrag) return state;

          const endTime = Date.now();
          const duration = endTime - state.currentDrag.startTime;
          const completedDrag: DragOperation = {
            ...state.currentDrag,
            endTime,
            success,
            resultElementId,
          };

          const newHistory = [...state.dragHistory, completedDrag];
          
          // Keep only last 100 operations for performance
          if (newHistory.length > 100) {
            newHistory.shift();
          }

          // Update analytics
          const newSuccessfulDrags = success 
            ? state.successfulDrags + 1 
            : state.successfulDrags;
          
          const totalDuration = state.dragHistory.reduce((acc, drag) => {
            return acc + (drag.endTime ? drag.endTime - drag.startTime : 0);
          }, duration);
          
          const newAverageDuration = newHistory.length > 0 
            ? totalDuration / newHistory.length 
            : 0;

          console.log(
            success ? '✅ Drag completed successfully:' : '❌ Drag failed:',
            completedDrag
          );

          return {
            currentDrag: null,
            dragHistory: newHistory,
            isDropzoneActive: false,
            dropPreview: null,
            successfulDrags: newSuccessfulDrags,
            averageDragDuration: newAverageDuration,
          };
        });
      },

      cancelDrag: () => {
        set((state) => {
          if (state.currentDrag) {
            console.log('🚫 Drag cancelled:', state.currentDrag);
          }
          
          return {
            currentDrag: null,
            isDropzoneActive: false,
            dropPreview: null,
          };
        });
      },

      // Dropzone management
      setDropzoneActive: (active) => {
        set({ isDropzoneActive: active });
      },

      updateDropPreview: (preview) => {
        set({ dropPreview: preview });
      },

      clearDropPreview: () => {
        set({ dropPreview: null });
      },

      // History and analytics
      getDragHistory: (limit = 10) => {
        const { dragHistory } = get();
        return dragHistory.slice(-limit).reverse();
      },

      getDragAnalytics: () => {
        const { totalDrags, successfulDrags, dragsByType, averageDragDuration } = get();
        
        const successRate = totalDrags > 0 ? (successfulDrags / totalDrags) * 100 : 0;
        
        const mostDraggedType = Object.entries(dragsByType).reduce(
          (max, [type, count]) => (count > max.count ? { type, count } : max),
          { type: 'none', count: 0 }
        ).type;

        return {
          totalDrags,
          successRate,
          mostDraggedType,
          averageDuration: averageDragDuration,
        };
      },

      clearHistory: () => {
        set({
          dragHistory: [],
          totalDrags: 0,
          successfulDrags: 0,
          dragsByType: {},
          averageDragDuration: 0,
        });
      },

      // Helpers
      getCurrentDragType: () => {
        const { currentDrag } = get();
        return currentDrag?.sourceType || null;
      },

      isValidDropTarget: (targetType, targetId) => {
        const { currentDrag } = get();
        if (!currentDrag) return false;

        // Define valid drop targets based on drag type
        switch (currentDrag.sourceType) {
          case 'photo':
          case 'video':
          case 'shape':
          case 'text':
            return targetType === 'canvas';
          case 'layer':
            return targetType === 'canvas' || targetType === 'layer';
          default:
            return false;
        }
      },
    }),
    {
      name: 'drag-tracking-store',
    }
  )
);

// Analytics helper hook
export const useDragAnalytics = () => {
  const { getDragAnalytics, getDragHistory, clearHistory } = useDragTrackingStore();
  
  return {
    getAnalytics: getDragAnalytics,
    getRecentDrags: getDragHistory,
    clearHistory,
  };
};