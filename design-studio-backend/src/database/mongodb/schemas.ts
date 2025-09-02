import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

// Canvas Element Types
export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'video' | 'group';
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
  
  // Type-specific properties
  properties: Record<string, any>;
  
  // Animation data
  animations?: CanvasAnimation[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasAnimation {
  id: string;
  property: string;
  keyframes: {
    time: number;
    value: any;
    easing?: string;
  }[];
  duration: number;
  delay: number;
  repeat: number;
  direction: 'normal' | 'reverse' | 'alternate';
}

export interface CanvasLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  elements: string[]; // Element IDs
}

// Main Canvas Document Schema
@Schema({ timestamps: true, collection: 'canvas_documents' })
export class CanvasDocument {
  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, default: 1920 })
  width: number;

  @Prop({ required: true, default: 1080 })
  height: number;

  @Prop({ type: Object, default: { r: 255, g: 255, b: 255, a: 1 } })
  backgroundColor: {
    r: number;
    g: number;
    b: number;
    a: number;
  };

  @Prop({ type: [Object], default: [] })
  elements: CanvasElement[];

  @Prop({ type: [Object], default: [] })
  layers: CanvasLayer[];

  @Prop({ type: Object, default: {} })
  timeline: {
    duration: number;
    fps: number;
    currentTime: number;
    isPlaying: boolean;
    loop: boolean;
  };

  @Prop({ type: Object, default: {} })
  viewport: {
    zoom: number;
    panX: number;
    panY: number;
  };

  @Prop({ type: Object, default: {} })
  settings: {
    snapToGrid: boolean;
    gridSize: number;
    showGrid: boolean;
    showGuides: boolean;
    snapToGuides: boolean;
  };

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export type CanvasDocumentType = CanvasDocument & Document;
export const CanvasDocumentSchema = SchemaFactory.createForClass(CanvasDocument);

// Canvas Version History Schema
@Schema({ timestamps: true, collection: 'canvas_versions' })
export class CanvasVersion {
  @Prop({ required: true })
  canvasDocumentId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  version: number;

  @Prop({ type: Object, required: true })
  canvasData: {
    elements: CanvasElement[];
    layers: CanvasLayer[];
    timeline: any;
    viewport: any;
    settings: any;
  };

  @Prop({ type: String, default: '' })
  changeDescription: string;

  @Prop({ type: Object, default: {} })
  changeMetadata: {
    elementsAdded: number;
    elementsRemoved: number;
    elementsModified: number;
    changeType: string;
  };

  @Prop({ default: Date.now })
  createdAt: Date;
}

export type CanvasVersionType = CanvasVersion & Document;
export const CanvasVersionSchema = SchemaFactory.createForClass(CanvasVersion);

// Template Canvas Data Schema
@Schema({ timestamps: true, collection: 'template_canvas' })
export class TemplateCanvas {
  @Prop({ required: true })
  templateId: string;

  @Prop({ required: true })
  authorId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 1920 })
  width: number;

  @Prop({ required: true, default: 1080 })
  height: number;

  @Prop({ type: [Object], required: true })
  elements: CanvasElement[];

  @Prop({ type: [Object], default: [] })
  layers: CanvasLayer[];

  @Prop({ type: Object, default: {} })
  preview: {
    thumbnail: string;
    previewImages: string[];
  };

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: String, required: true })
  category: string;

  @Prop({ type: Object, default: {} })
  metadata: {
    colorPalette: string[];
    fontUsed: string[];
    complexity: 'simple' | 'medium' | 'complex';
    estimatedEditTime: number;
  };

  @Prop({ required: true, default: 1 })
  version: number;
}

export type TemplateCanvasType = TemplateCanvas & Document;
export const TemplateCanvasSchema = SchemaFactory.createForClass(TemplateCanvas);

// Real-time Collaboration Schema
@Schema({ timestamps: true, collection: 'collaboration_sessions' })
export class CollaborationSession {
  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ type: String, default: '' })
  userAvatar: string;

  @Prop({ type: Object, required: true })
  cursor: {
    x: number;
    y: number;
    visible: boolean;
    color: string;
  };

  @Prop({ type: [String], default: [] })
  selectedElements: string[];

  @Prop({ type: String, default: 'online' })
  status: 'online' | 'idle' | 'offline';

  @Prop({ type: Object, default: {} })
  currentTool: {
    tool: string;
    settings: Record<string, any>;
  };

  @Prop({ default: Date.now })
  lastActivity: Date;

  @Prop({ default: Date.now })
  joinedAt: Date;
}

export type CollaborationSessionType = CollaborationSession & Document;
export const CollaborationSessionSchema = SchemaFactory.createForClass(CollaborationSession);

// Collaboration Operations (for operational transform)
@Schema({ timestamps: true, collection: 'collaboration_operations' })
export class CollaborationOperation {
  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  operationId: string;

  @Prop({ type: String, required: true })
  type: 'insert' | 'update' | 'delete' | 'move' | 'transform';

  @Prop({ type: Object, required: true })
  operation: {
    elementId?: string;
    path: string;
    oldValue?: any;
    newValue?: any;
    position?: number;
  };

  @Prop({ type: [String], default: [] })
  dependencies: string[];

  @Prop({ type: Number, required: true })
  timestamp: number;

  @Prop({ type: Boolean, default: false })
  applied: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export type CollaborationOperationType = CollaborationOperation & Document;
export const CollaborationOperationSchema = SchemaFactory.createForClass(CollaborationOperation);

// Export Job Canvas Data Cache
@Schema({ timestamps: true, collection: 'export_cache' })
export class ExportCache {
  @Prop({ required: true })
  exportId: string;

  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ type: Object, required: true })
  canvasSnapshot: {
    elements: CanvasElement[];
    layers: CanvasLayer[];
    settings: any;
    dimensions: {
      width: number;
      height: number;
    };
  };

  @Prop({ type: Object, required: true })
  exportSettings: {
    format: string;
    quality: number;
    dimensions: { width: number; height: number };
    transparent: boolean;
    animation?: {
      duration: number;
      fps: number;
      loop: boolean;
    };
  };

  @Prop({ type: String, default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Prop({ type: Number, default: 0 })
  progress: number;

  @Prop({ type: String, default: '' })
  resultUrl: string;

  @Prop({ type: String, default: '' })
  errorMessage: string;

  @Prop({ default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) })
  expiresAt: Date;
}

export type ExportCacheType = ExportCache & Document;
export const ExportCacheSchema = SchemaFactory.createForClass(ExportCache);

// Index configurations for performance
CanvasDocumentSchema.index({ projectId: 1, userId: 1 });
CanvasDocumentSchema.index({ createdAt: -1 });
CanvasDocumentSchema.index({ updatedAt: -1 });

CanvasVersionSchema.index({ canvasDocumentId: 1, version: -1 });
CanvasVersionSchema.index({ projectId: 1, createdAt: -1 });

TemplateCanvasSchema.index({ templateId: 1 });
TemplateCanvasSchema.index({ category: 1, tags: 1 });
TemplateCanvasSchema.index({ createdAt: -1 });

CollaborationSessionSchema.index({ projectId: 1, status: 1 });
CollaborationSessionSchema.index({ userId: 1 });
CollaborationSessionSchema.index({ lastActivity: -1 });

CollaborationOperationSchema.index({ projectId: 1, timestamp: 1 });
CollaborationOperationSchema.index({ operationId: 1 });

ExportCacheSchema.index({ exportId: 1 });
ExportCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
ExportCacheSchema.index({ createdAt: -1 });