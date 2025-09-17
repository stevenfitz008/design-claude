// Plotly Text Integration Types
// Adapted from Design Studio's canvas.ts and integrated with Plotly annotations

import type { PlotData, Layout, Annotations } from 'plotly.js';
import type { TextStyle } from './textTemplates';

// Plotly-specific text element
export interface PlotlyTextElement {
  id: string;
  type: 'text' | 'rich-text';
  
  // Plotly annotation properties
  x: number | string;
  y: number | string;
  xref?: 'x' | 'paper' | string;
  yref?: 'y' | 'paper' | string;
  
  // Text content
  text: string;
  html?: string; // For rich text content
  
  // Styling (maps to Plotly annotation styling)
  font: {
    family: string;
    size: number;
    color: string;
    weight?: string | number;
  };
  
  // Positioning and alignment
  xanchor?: 'left' | 'center' | 'right';
  yanchor?: 'top' | 'middle' | 'bottom';
  align?: 'left' | 'center' | 'right';
  
  // Visual properties
  opacity?: number;
  visible: boolean;
  
  // Interaction states
  editable: boolean;
  selected: boolean;
  locked: boolean;
  
  // Rich text specific
  richText?: boolean;
  imageData?: string; // Base64 image for rich text rendering
  
  // Metadata
  zIndex: number;
  createdAt: number;
  updatedAt: number;
}

// Plotly chart with text annotations
export interface PlotlyChartWithText {
  data: PlotData[];
  layout: Layout & {
    annotations?: Annotations[];
  };
  textElements: PlotlyTextElement[];
  config?: Partial<Plotly.Config>;
}

// Text editing state
export interface TextEditingState {
  isEditing: boolean;
  editingElementId: string | null;
  editorPosition: { x: number; y: number } | null;
  editorSize: { width: number; height: number } | null;
}

// Rich text editor state
export interface RichTextEditorState {
  isVisible: boolean;
  content: string;
  status: 'loading' | 'ready' | 'converting';
  selectedElementId: string | null;
}

// Text template application to Plotly
export interface PlotlyTextTemplate extends TextStyle {
  // Additional Plotly-specific properties
  xref?: 'x' | 'paper';
  yref?: 'y' | 'paper';
  xanchor?: 'left' | 'center' | 'right';
  yanchor?: 'top' | 'middle' | 'bottom';
}

// Drag and drop data for Plotly text
export interface PlotlyTextDragData {
  type: 'plotly-text';
  template: PlotlyTextTemplate;
  preview: string;
  // Template style properties for compatibility
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: string;
}

// Text positioning within Plotly coordinate system
export interface PlotlyTextPosition {
  // Data coordinates (relative to chart data)
  dataX?: number;
  dataY?: number;
  
  // Paper coordinates (0-1, relative to plot area)
  paperX?: number;
  paperY?: number;
  
  // Pixel coordinates (for overlay positioning)
  pixelX?: number;
  pixelY?: number;
  
  // Reference system
  xref: 'x' | 'paper' | string;
  yref: 'y' | 'paper' | string;
}

// Text interaction events
export interface PlotlyTextInteractionEvent {
  type: 'click' | 'doubleclick' | 'hover' | 'select';
  element: PlotlyTextElement;
  originalEvent: Event;
  position: PlotlyTextPosition;
}

// Conversion utilities
export interface TextStyleToPlotlyAnnotation {
  (style: TextStyle, content: string, position: PlotlyTextPosition): Partial<Annotations>;
}

export interface PlotlyAnnotationToTextElement {
  (annotation: Annotations): PlotlyTextElement;
}

// Editor integration
export interface PlotlyTextEditorProps {
  element?: PlotlyTextElement;
  position: PlotlyTextPosition;
  onUpdate: (element: PlotlyTextElement) => void;
  onClose: () => void;
  isVisible: boolean;
}

// Store interface for Plotly text management
export interface PlotlyTextStore {
  // Text elements
  textElements: Map<string, PlotlyTextElement>;
  selectedElementIds: Set<string>;
  
  // Editing state
  editingState: TextEditingState;
  richTextEditor: RichTextEditorState;
  
  // Chart reference
  plotlyRef: React.RefObject<any> | null;
  
  // Actions
  addTextElement: (element: Omit<PlotlyTextElement, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTextElement: (id: string, updates: Partial<PlotlyTextElement>) => void;
  deleteTextElement: (id: string) => void;
  selectTextElement: (id: string, multiSelect?: boolean) => void;
  clearSelection: () => void;
  
  // Editing
  startEditing: (elementId: string) => void;
  stopEditing: () => void;
  showRichTextEditor: (elementId?: string) => void;
  hideRichTextEditor: () => void;
  
  // Template application
  applyTemplate: (template: PlotlyTextTemplate, position: PlotlyTextPosition) => string;
  
  // Plotly integration
  updatePlotlyAnnotations: () => void;
  syncWithPlotlyAnnotations: (annotations: Annotations[]) => void;
}