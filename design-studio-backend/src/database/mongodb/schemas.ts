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

// MODULAR DESIGN SYSTEM MONGODB SCHEMAS

// Component Definition Interface
export interface ComponentDefinition {
  id: string;
  name: string;
  type: 'chart' | 'text' | 'image' | 'table' | 'shape' | 'container' | 'form' | 'media' | 'widget';
  
  // Component structure
  template: {
    html?: string;
    svg?: string;
    canvas?: CanvasElement[];
    styles: Record<string, any>;
  };
  
  // Component properties schema
  propsSchema: {
    properties: Record<string, {
      type: string;
      default?: any;
      required?: boolean;
      description?: string;
      options?: any[];
    }>;
    required: string[];
  };
  
  // Rendering configuration
  rendering: {
    supportedFormats: string[];
    dependencies: string[];
    performance: {
      complexity: 'low' | 'medium' | 'high';
      estimatedRenderTime: number;
      memoryUsage: number;
    };
  };
  
  // Data binding configuration
  dataBinding?: {
    sources: string[];
    transformations: Record<string, any>;
    validation: Record<string, any>;
  };
  
  // Interaction capabilities
  interactions?: {
    events: string[];
    actions: Record<string, any>;
  };
}

// Component Definition Document Schema
@Schema({ timestamps: true, collection: 'component_definitions' })
export class ComponentDefinitionDocument {
  @Prop({ required: true })
  componentId: string;

  @Prop({ required: true })
  version: number;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ type: Object, required: true })
  definition: ComponentDefinition;

  @Prop({ type: Object, default: {} })
  metadata: {
    changeLog?: string;
    testResults?: any;
    performanceMetrics?: any;
  };

  @Prop({ type: Boolean, default: false })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  isStable: boolean;
}

export type ComponentDefinitionDocumentType = ComponentDefinitionDocument & Document;
export const ComponentDefinitionDocumentSchema = SchemaFactory.createForClass(ComponentDefinitionDocument);

// Report Page Definition Schema
@Schema({ timestamps: true, collection: 'report_page_definitions' })
export class ReportPageDefinition {
  @Prop({ required: true })
  pageId: string;

  @Prop({ required: true })
  reportId: string;

  @Prop({ required: true })
  version: number;

  @Prop({ type: Object, required: true })
  layout: {
    type: 'flexible' | 'grid' | 'fixed' | 'responsive';
    columns: number;
    rows?: number;
    gridTemplate?: string;
    breakpoints?: Record<string, any>;
  };

  @Prop({ type: [Object], required: true })
  componentInstances: Array<{
    id: string;
    componentId: string;
    componentVersion: number;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
      zIndex: number;
    };
    props: Record<string, any>;
    dataBindings?: Record<string, any>;
    responsive?: Record<string, any>;
  }>;

  @Prop({ type: Object, default: {} })
  pageSettings: {
    background?: {
      color?: string;
      image?: string;
      gradient?: any;
    };
    padding?: Record<string, number>;
    margin?: Record<string, number>;
  };

  @Prop({ type: Object, default: {} })
  interactions: {
    navigation?: any;
    animations?: any[];
    events?: Record<string, any>;
  };

  @Prop({ type: Object, default: {} })
  metadata: {
    renderingHints?: any;
    cacheStrategy?: string;
    dependencies?: string[];
  };
}

export type ReportPageDefinitionType = ReportPageDefinition & Document;
export const ReportPageDefinitionSchema = SchemaFactory.createForClass(ReportPageDefinition);

// Report Rendering Cache Schema
@Schema({ timestamps: true, collection: 'report_rendering_cache' })
export class ReportRenderingCache {
  @Prop({ required: true })
  reportId: string;

  @Prop({ required: true })
  version: number;

  @Prop({ type: String, required: true })
  format: 'html' | 'pdf' | 'pptx' | 'svg';

  @Prop({ type: Object, required: true })
  renderingConfig: {
    quality: number;
    dimensions?: { width: number; height: number };
    options: Record<string, any>;
  };

  @Prop({ type: String, required: true })
  cacheKey: string;

  @Prop({ type: Object, required: true })
  renderedContent: {
    pages: Array<{
      pageId: string;
      content: any; // Format-specific content
      assets: string[]; // Referenced asset URLs
    }>;
    metadata: {
      totalPages: number;
      totalSize: number;
      renderTime: number;
      dependencies: string[];
    };
  };

  @Prop({ type: Number, required: true })
  contentHash: string; // Hash of input content for cache validation

  @Prop({ default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) })
  expiresAt: Date;
}

export type ReportRenderingCacheType = ReportRenderingCache & Document;
export const ReportRenderingCacheSchema = SchemaFactory.createForClass(ReportRenderingCache);

// DIGITAL ASSET MANAGEMENT MONGODB SCHEMAS

// Asset Processing Queue Schema
@Schema({ timestamps: true, collection: 'asset_processing_queue' })
export class AssetProcessingJob {
  @Prop({ required: true })
  assetId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ type: String, required: true })
  jobType: 'metadata_extraction' | 'thumbnail_generation' | 'format_conversion' | 'ai_analysis' | 'optimization';

  @Prop({ type: String, default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';

  @Prop({ type: Number, default: 0 })
  priority: number; // Higher number = higher priority

  @Prop({ type: Object, required: true })
  jobData: {
    inputPath: string;
    outputPath?: string;
    parameters: Record<string, any>;
    constraints?: {
      maxFileSize?: number;
      maxDimensions?: { width: number; height: number };
      allowedFormats?: string[];
    };
  };

  @Prop({ type: Object, default: {} })
  progress: {
    current: number;
    total: number;
    stage: string;
    message?: string;
  };

  @Prop({ type: Object, default: {} })
  result: {
    success: boolean;
    output?: any;
    error?: string;
    metrics?: {
      processingTime: number;
      inputSize: number;
      outputSize?: number;
    };
  };

  @Prop({ type: Number, default: 0 })
  retryCount: number;

  @Prop({ type: Number, default: 3 })
  maxRetries: number;

  @Prop({ type: Date })
  startedAt?: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) })
  expiresAt: Date;
}

export type AssetProcessingJobType = AssetProcessingJob & Document;
export const AssetProcessingJobSchema = SchemaFactory.createForClass(AssetProcessingJob);

// Asset Search Index Schema
@Schema({ timestamps: true, collection: 'asset_search_index' })
export class AssetSearchIndex {
  @Prop({ required: true })
  assetId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ type: Object, required: true })
  searchableContent: {
    title: string;
    description?: string;
    tags: string[];
    keywords: string[];
    ocrText?: string; // Extracted text from images
    aiDescription?: string;
    categories: string[];
  };

  @Prop({ type: Object, required: true })
  visualFeatures: {
    dominantColors: string[];
    colorPalette: string[];
    brightness: number; // 0-100
    contrast: number; // 0-100
    saturation: number; // 0-100
    hasTransparency: boolean;
    aspectRatio: number;
    orientation: 'landscape' | 'portrait' | 'square';
  };

  @Prop({ type: Object, default: {} })
  contentAnalysis: {
    detectedObjects?: string[];
    detectedFaces?: number;
    detectedText?: string[];
    sceneType?: string;
    mood?: string[];
    style?: string[];
  };

  @Prop({ type: Object, required: true })
  technicalSpecs: {
    format: string;
    fileSize: number;
    dimensions: { width: number; height: number };
    colorProfile?: string;
    bitDepth?: number;
    compression?: string;
    hasAnimation: boolean;
    duration?: number;
  };

  @Prop({ type: Object, required: true })
  usageStats: {
    downloadCount: number;
    viewCount: number;
    likeCount: number;
    shareCount: number;
    lastUsedAt?: Date;
    popularityScore: number; // Calculated score
  };

  @Prop({ type: [String], default: [] })
  similarAssets: string[]; // Asset IDs with similar features

  @Prop({ required: true, default: Date.now })
  indexedAt: Date;

  @Prop({ required: true, default: Date.now })
  lastAnalyzedAt: Date;
}

export type AssetSearchIndexType = AssetSearchIndex & Document;
export const AssetSearchIndexSchema = SchemaFactory.createForClass(AssetSearchIndex);

// Asset Analytics Aggregation Schema
@Schema({ timestamps: true, collection: 'asset_analytics' })
export class AssetAnalytics {
  @Prop({ required: true })
  assetId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ type: String, required: true })
  period: 'hour' | 'day' | 'week' | 'month';

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: Object, required: true })
  metrics: {
    views: number;
    downloads: number;
    edits: number;
    shares: number;
    uniqueUsers: number;
    totalTimeViewed: number; // in seconds
    averageViewDuration: number; // in seconds
  };

  @Prop({ type: Object, default: {} })
  demographics: {
    topCountries?: string[];
    topDevices?: string[];
    topReferrers?: string[];
    userTypes?: Record<string, number>; // free, pro, team
  };

  @Prop({ type: Object, default: {} })
  performance: {
    averageLoadTime: number;
    errorRate: number;
    bandwidthUsed: number;
  };
}

export type AssetAnalyticsType = AssetAnalytics & Document;
export const AssetAnalyticsSchema = SchemaFactory.createForClass(AssetAnalytics);

// Asset Transformation History Schema
@Schema({ timestamps: true, collection: 'asset_transformations' })
export class AssetTransformation {
  @Prop({ required: true })
  assetId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ type: String, required: true })
  transformationType: 'resize' | 'crop' | 'rotate' | 'filter' | 'format_conversion' | 'compression' | 'watermark';

  @Prop({ type: Object, required: true })
  parameters: {
    input: {
      format: string;
      dimensions: { width: number; height: number };
      fileSize: number;
    };
    transformation: Record<string, any>;
    output: {
      format: string;
      dimensions: { width: number; height: number };
      fileSize: number;
      quality?: number;
    };
  };

  @Prop({ type: String, required: true })
  originalStorageKey: string;

  @Prop({ type: String, required: true })
  transformedStorageKey: string;

  @Prop({ type: Object, required: true })
  processingMetrics: {
    duration: number; // milliseconds
    cpuUsage: number;
    memoryUsage: number;
    compressionRatio: number;
  };

  @Prop({ type: Boolean, default: false })
  isReversible: boolean;

  @Prop({ type: Object, default: {} })
  reverseParameters: Record<string, any>;
}

export type AssetTransformationType = AssetTransformation & Document;
export const AssetTransformationSchema = SchemaFactory.createForClass(AssetTransformation);

// INDEX CONFIGURATIONS FOR NEW SCHEMAS

// Component Definition indexes
ComponentDefinitionDocumentSchema.index({ componentId: 1, version: -1 });
ComponentDefinitionDocumentSchema.index({ createdBy: 1 });
ComponentDefinitionDocumentSchema.index({ isActive: 1, isStable: 1 });
ComponentDefinitionDocumentSchema.index({ createdAt: -1 });

// Report Page Definition indexes
ReportPageDefinitionSchema.index({ pageId: 1, version: -1 });
ReportPageDefinitionSchema.index({ reportId: 1 });
ReportPageDefinitionSchema.index({ updatedAt: -1 });

// Report Rendering Cache indexes
ReportRenderingCacheSchema.index({ reportId: 1, version: 1, format: 1 });
ReportRenderingCacheSchema.index({ cacheKey: 1 }, { unique: true });
ReportRenderingCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
ReportRenderingCacheSchema.index({ createdAt: -1 });

// Asset Processing Job indexes
AssetProcessingJobSchema.index({ assetId: 1, jobType: 1 });
AssetProcessingJobSchema.index({ status: 1, priority: -1 });
AssetProcessingJobSchema.index({ userId: 1 });
AssetProcessingJobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AssetProcessingJobSchema.index({ createdAt: -1 });

// Asset Search Index indexes
AssetSearchIndexSchema.index({ assetId: 1 }, { unique: true });
AssetSearchIndexSchema.index({ userId: 1 });
AssetSearchIndexSchema.index({ 'searchableContent.tags': 1 });
AssetSearchIndexSchema.index({ 'searchableContent.categories': 1 });
AssetSearchIndexSchema.index({ 'visualFeatures.dominantColors': 1 });
AssetSearchIndexSchema.index({ 'technicalSpecs.format': 1 });
AssetSearchIndexSchema.index({ 'technicalSpecs.dimensions.width': 1, 'technicalSpecs.dimensions.height': 1 });
AssetSearchIndexSchema.index({ 'usageStats.popularityScore': -1 });
AssetSearchIndexSchema.index({ lastAnalyzedAt: -1 });

// Asset Analytics indexes
AssetAnalyticsSchema.index({ assetId: 1, period: 1, timestamp: -1 });
AssetAnalyticsSchema.index({ userId: 1, timestamp: -1 });
AssetAnalyticsSchema.index({ timestamp: -1 });

// Asset Transformation indexes
AssetTransformationSchema.index({ assetId: 1, createdAt: -1 });
AssetTransformationSchema.index({ userId: 1 });
AssetTransformationSchema.index({ transformationType: 1 });
AssetTransformationSchema.index({ originalStorageKey: 1 });
AssetTransformationSchema.index({ transformedStorageKey: 1 });
AssetTransformationSchema.index({ createdAt: -1 });