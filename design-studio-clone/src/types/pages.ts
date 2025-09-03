// Multi-page system types for Polotno-style interface

export interface DesignPage {
  id: string;
  name: string;
  duration: number; // in seconds (default 5.0s)
  thumbnailUrl?: string;
  previewData?: string; // Base64 encoded preview
  canvasSize: { width: number; height: number };
  backgroundColor: string;
  elements: string[]; // Array of element IDs on this page
  createdAt: number;
  updatedAt: number;
  order: number; // For page ordering in carousel
}

export interface PageState {
  pages: DesignPage[];
  currentPageId: string;
  pageOrder: string[];
  totalDuration: number;
}

// Page carousel component props
export interface PageCarouselProps {
  pages: DesignPage[];
  currentPageId: string;
  onPageSelect: (pageId: string) => void;
  onPageAdd: () => void;
  onPageDuplicate: (pageId: string) => void;
  onPageDelete: (pageId: string) => void;
  onPageReorder: (fromIndex: number, toIndex: number) => void;
  className?: string;
}

// Page thumbnail component props
export interface PageThumbnailProps {
  page: DesignPage;
  isActive: boolean;
  onClick: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  className?: string;
}

// Zoom control component props
export interface ZoomControlProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
  fitToScreen: () => void;
  className?: string;
}

// Position callout component props
export interface PositionCalloutProps {
  x: number;
  y: number;
  visible: boolean;
  elementId?: string;
  className?: string;
}

// Canvas toolbar props
export interface CanvasToolbarProps {
  selectedElements: string[];
  onFlip: (direction: 'horizontal' | 'vertical') => void;
  onEffects: () => void;
  onFitToPage: () => void;
  onApplyMask: () => void;
  onAnimate: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  className?: string;
}

// Action button component props
export interface ActionButtonProps {
  icon: string;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}