import { create } from 'zustand';

interface CanvasImage {
  id: string;
  photoId: string;
  src: string;
  alt: string;
  photographer: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
}

interface DragState {
  imageId: string;
  offset: { x: number; y: number };
}

interface ResizeState {
  imageId: string;
  handle: string;
  startPos: { x: number; y: number };
  startSize: { width: number; height: number };
}

interface CanvasState {
  canvasImages: CanvasImage[];
  selectedImageId: string | null;
  isDragging: DragState | null;
  isResizing: ResizeState | null;
  dragOver: boolean;
  
  // Actions
  setCanvasImages: (images: CanvasImage[]) => void;
  addCanvasImage: (image: CanvasImage) => void;
  updateCanvasImage: (id: string, updates: Partial<CanvasImage>) => void;
  removeCanvasImage: (id: string) => void;
  setSelectedImageId: (id: string | null) => void;
  setIsDragging: (dragState: DragState | null) => void;
  setIsResizing: (resizeState: ResizeState | null) => void;
  setDragOver: (dragOver: boolean) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  canvasImages: [],
  selectedImageId: null,
  isDragging: null,
  isResizing: null,
  dragOver: false,
  
  setCanvasImages: (images) => set({ canvasImages: images }),
  
  addCanvasImage: (image) => set((state) => ({
    canvasImages: [...state.canvasImages, image]
  })),
  
  updateCanvasImage: (id, updates) => set((state) => ({
    canvasImages: state.canvasImages.map(img => 
      img.id === id ? { ...img, ...updates } : img
    )
  })),
  
  removeCanvasImage: (id) => set((state) => ({
    canvasImages: state.canvasImages.filter(img => img.id !== id),
    selectedImageId: state.selectedImageId === id ? null : state.selectedImageId
  })),
  
  setSelectedImageId: (id) => set({ selectedImageId: id }),
  
  setIsDragging: (dragState) => set({ isDragging: dragState }),
  
  setIsResizing: (resizeState) => set({ isResizing: resizeState }),
  
  setDragOver: (dragOver) => set({ dragOver })
}));