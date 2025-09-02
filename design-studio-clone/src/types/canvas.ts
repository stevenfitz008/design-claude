// Base canvas element interface
export interface BaseCanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  parentId?: string;
  createdAt: number;
  updatedAt: number;
}

export type CanvasElementType = 'text' | 'image' | 'shape' | 'video' | 'group' | 'icon' | 'background';

// Specific element type interfaces
export interface TextElement extends BaseCanvasElement {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  verticalAlign: 'top' | 'middle' | 'bottom';
  color: string;
  backgroundColor?: string;
  lineHeight: number;
  letterSpacing: number;
  textDecoration: 'none' | 'underline' | 'line-through';
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  wordWrap: boolean;
  maxWidth?: number;
}

export interface ImageElement extends BaseCanvasElement {
  type: 'image';
  src: string;
  originalWidth: number;
  originalHeight: number;
  fit: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  filters?: ImageFilters;
  cropData?: CropData;
  alt?: string;
}

export interface ShapeElement extends BaseCanvasElement {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'polygon' | 'star' | 'arrow';
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDashArray?: number[];
  cornerRadius?: number;
  sides?: number; // For polygons and stars
  innerRadius?: number; // For stars
}

export interface VideoElement extends BaseCanvasElement {
  type: 'video';
  src: string;
  poster?: string;
  originalWidth: number;
  originalHeight: number;
  duration: number;
  currentTime: number;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
}

export interface GroupElement extends BaseCanvasElement {
  type: 'group';
  children: string[]; // Array of child element IDs
}

export interface IconElement extends BaseCanvasElement {
  type: 'icon';
  iconName: string;
  iconSet: string;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface BackgroundElement extends BaseCanvasElement {
  type: 'background';
  backgroundType: 'color' | 'gradient' | 'image' | 'pattern';
  color?: string;
  gradient?: GradientData;
  image?: string;
  pattern?: PatternData;
}

// Union type for all canvas elements
export type CanvasElement = 
  | TextElement 
  | ImageElement 
  | ShapeElement 
  | VideoElement 
  | GroupElement 
  | IconElement 
  | BackgroundElement;

// Supporting interfaces
export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  sepia: number;
  grayscale: number;
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GradientData {
  type: 'linear' | 'radial';
  angle?: number; // For linear gradients
  centerX?: number; // For radial gradients
  centerY?: number; // For radial gradients
  stops: GradientStop[];
}

export interface GradientStop {
  offset: number;
  color: string;
}

export interface PatternData {
  type: 'dots' | 'stripes' | 'grid' | 'checkerboard';
  size: number;
  spacing: number;
  color1: string;
  color2: string;
  angle?: number;
}

// Canvas state and selection
export interface CanvasState {
  elements: CanvasElement[];
  selection: string[];
  clipboard: CanvasElement[];
  zoom: number;
  pan: { x: number; y: number };
  canvasSize: { width: number; height: number };
  backgroundColor: string;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showGuides: boolean;
  snapToGuides: boolean;
}

export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface HistoryState {
  elements: CanvasElement[];
  canvasSize: { width: number; height: number };
  timestamp: number;
  action: string;
  description: string;
}

// Layer management
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  elements: string[];
}

export interface LayerState {
  layers: Layer[];
  activeLayerId: string;
}