// Tool system types
export interface Tool {
  id: string;
  name: string;
  icon: string;
  panel: PanelType;
  shortcut?: string;
  category: ToolCategory;
  description?: string;
  premium?: boolean;
  disabled?: boolean;
}

export type ToolCategory = 
  | 'design'
  | 'content' 
  | 'media'
  | 'utility'
  | 'ai';

export type PanelType =
  | 'templates'
  | 'text'
  | 'photos'
  | 'icons'
  | 'shapes'
  | 'upload'
  | 'videos'
  | 'background'
  | 'layers'
  | 'resize'
  | 'quotes'
  | 'qrcode'
  | 'ai-image';

export interface ToolState {
  activeTool: string;
  activePanel: PanelType;
  toolSettings: Record<string, any>;
  panelHistory: PanelType[];
  searchQuery: string;
}

// Panel-specific interfaces
export interface PanelProps {
  isVisible: boolean;
  width: number;
  onClose?: () => void;
}

export interface TemplatesPanel extends PanelProps {
  categories: TemplateCategory[];
  selectedCategory?: string;
  searchQuery: string;
  templates: Template[];
  onTemplateSelect: (template: Template) => void;
  onCategoryChange: (categoryId: string) => void;
}

export interface TextPanel extends PanelProps {
  fonts: FontFamily[];
  selectedFont?: string;
  fontSize: number;
  fontWeight: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  color: string;
  backgroundColor?: string;
  textEffects: TextEffect[];
  onFontChange: (fontFamily: string) => void;
  onSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
}

export interface PhotosPanel extends PanelProps {
  photos: Photo[];
  categories: PhotoCategory[];
  selectedCategory?: string;
  searchQuery: string;
  isLoading: boolean;
  hasMore: boolean;
  onPhotoSelect: (photo: Photo) => void;
  onLoadMore: () => void;
  onSearch: (query: string) => void;
}

export interface ShapesPanel extends PanelProps {
  shapeCategories: ShapeCategory[];
  selectedCategory?: string;
  shapes: Shape[];
  onShapeSelect: (shape: Shape) => void;
}

export interface LayersPanel extends PanelProps {
  layers: LayerInfo[];
  selectedLayers: string[];
  onLayerSelect: (layerId: string, multi?: boolean) => void;
  onLayerReorder: (dragIndex: number, hoverIndex: number) => void;
  onLayerToggleVisibility: (layerId: string) => void;
  onLayerToggleLock: (layerId: string) => void;
  onLayerRename: (layerId: string, newName: string) => void;
  onLayerDelete: (layerId: string) => void;
}

// Supporting types for panels
export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  width: number;
  height: number;
  premium: boolean;
  tags: string[];
  elements: any[]; // Canvas elements
}

export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface FontFamily {
  family: string;
  variants: string[];
  subsets: string[];
  preview?: string;
}

export interface TextEffect {
  id: string;
  name: string;
  preview: string;
  properties: Record<string, any>;
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  alt: string;
  photographer?: string;
  source: 'unsplash' | 'pexels' | 'upload';
  tags: string[];
  premium: boolean;
}

export interface PhotoCategory {
  id: string;
  name: string;
  thumbnail: string;
  count: number;
}

export interface Shape {
  id: string;
  name: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'polygon' | 'star' | 'arrow';
  icon: string;
  defaultProperties: Record<string, any>;
}

export interface ShapeCategory {
  id: string;
  name: string;
  shapes: Shape[];
}

export interface LayerInfo {
  id: string;
  name: string;
  type: 'element' | 'group';
  visible: boolean;
  locked: boolean;
  opacity: number;
  elementCount?: number;
  children?: LayerInfo[];
}

// Tool definitions
export const TOOLS: Tool[] = [
  { 
    id: 'my-designs', 
    name: 'My Designs', 
    icon: 'folder', 
    panel: 'templates', 
    category: 'utility',
    description: 'Access your saved designs and projects'
  },
  { 
    id: 'templates', 
    name: 'Templates', 
    icon: 'layout', 
    panel: 'templates', 
    category: 'design',
    description: 'Browse and apply design templates'
  },
  { 
    id: 'text', 
    name: 'Text', 
    icon: 'font', 
    panel: 'text', 
    category: 'content', 
    shortcut: 'T',
    description: 'Add and style text elements'
  },
  { 
    id: 'photos', 
    name: 'Photos', 
    icon: 'camera', 
    panel: 'photos', 
    category: 'media',
    description: 'Search and add stock photos'
  },
  { 
    id: 'icons', 
    name: 'Icons', 
    icon: 'symbol-diamond', 
    panel: 'icons', 
    category: 'content',
    description: 'Browse and add icons'
  },
  { 
    id: 'shapes', 
    name: 'Shapes', 
    icon: 'shapes', 
    panel: 'shapes', 
    category: 'design',
    description: 'Add geometric shapes and forms'
  },
  { 
    id: 'upload', 
    name: 'Upload', 
    icon: 'upload', 
    panel: 'upload', 
    category: 'media',
    description: 'Upload your own images and files'
  },
  { 
    id: 'videos', 
    name: 'Videos', 
    icon: 'video', 
    panel: 'videos', 
    category: 'media',
    description: 'Add and edit video elements'
  },
  { 
    id: 'background', 
    name: 'Background', 
    icon: 'media', 
    panel: 'background', 
    category: 'design',
    description: 'Set canvas background and colors'
  },
  { 
    id: 'layers', 
    name: 'Layers', 
    icon: 'layers', 
    panel: 'layers', 
    category: 'utility',
    description: 'Manage element layers and ordering'
  },
  { 
    id: 'resize', 
    name: 'Resize', 
    icon: 'fullscreen', 
    panel: 'resize', 
    category: 'utility',
    description: 'Adjust canvas dimensions and aspect ratio'
  },
  { 
    id: 'quotes', 
    name: 'Quotes', 
    icon: 'citation', 
    panel: 'quotes', 
    category: 'content',
    description: 'Add inspirational quotes and text'
  },
  { 
    id: 'qr-code', 
    name: 'QR Code', 
    icon: 'grid', 
    panel: 'qrcode', 
    category: 'utility',
    description: 'Generate QR codes for links and data'
  },
  { 
    id: 'ai-img', 
    name: 'AI Image', 
    icon: 'predictive-analysis', 
    panel: 'ai-image', 
    category: 'ai',
    description: 'Generate images with AI',
    premium: true
  }
];

// Panel state management
export interface PanelState {
  activePanel: PanelType;
  panelSettings: Record<PanelType, Record<string, any>>;
  panelHistory: PanelType[];
  searchQueries: Record<PanelType, string>;
}

// Keyboard shortcuts
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: string;
  description: string;
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'T', action: 'select-text-tool', description: 'Select text tool' },
  { key: 'V', action: 'select-move-tool', description: 'Select move tool' },
  { key: 'Z', ctrlKey: true, action: 'undo', description: 'Undo last action' },
  { key: 'Y', ctrlKey: true, action: 'redo', description: 'Redo last action' },
  { key: 'S', ctrlKey: true, action: 'save', description: 'Save project' },
  { key: 'C', ctrlKey: true, action: 'copy', description: 'Copy selected elements' },
  { key: 'V', ctrlKey: true, action: 'paste', description: 'Paste elements' },
  { key: 'D', ctrlKey: true, action: 'duplicate', description: 'Duplicate selected elements' },
  { key: 'Delete', action: 'delete', description: 'Delete selected elements' },
  { key: 'Backspace', action: 'delete', description: 'Delete selected elements' },
  { key: '+', ctrlKey: true, action: 'zoom-in', description: 'Zoom in' },
  { key: '-', ctrlKey: true, action: 'zoom-out', description: 'Zoom out' },
  { key: '0', ctrlKey: true, action: 'zoom-fit', description: 'Fit to screen' },
  { key: 'G', ctrlKey: true, action: 'toggle-grid', description: 'Toggle grid' },
  { key: 'L', ctrlKey: true, action: 'toggle-layers', description: 'Toggle layers panel' }
];