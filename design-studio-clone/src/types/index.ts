// Main types export file - provides centralized access to all type definitions

// Canvas and element types
export type {
  // Base canvas types
  BaseCanvasElement,
  CanvasElement,
  CanvasElementType,
  
  // Specific element types
  TextElement,
  ImageElement,
  ShapeElement,
  VideoElement,
  GroupElement,
  IconElement,
  BackgroundElement,
  
  // Canvas state and management
  CanvasState,
  Transform,
  SelectionBounds,
  HistoryState,
  Layer,
  LayerState,
  
  // Supporting interfaces
  ImageFilters,
  CropData,
  GradientData,
  GradientStop,
  PatternData
} from './canvas';

// Tool and panel types
export type {
  // Tool system
  Tool,
  ToolCategory,
  ToolState,
  PanelType,
  
  // Panel interfaces
  PanelProps,
  TemplatesPanel,
  TextPanel,
  PhotosPanel,
  ShapesPanel,
  LayersPanel,
  
  // Supporting types
  Template,
  TemplateCategory,
  FontFamily,
  TextEffect,
  Photo,
  PhotoCategory,
  Shape,
  ShapeCategory,
  LayerInfo,
  
  // Panel and keyboard management
  PanelState,
  KeyboardShortcut
} from './tools';

// Timeline and animation types
export type {
  // Core timeline types
  Timeline,
  TimelineTrack,
  Keyframe,
  AnimatableProperties,
  
  // Timeline state and controls
  TimelineState,
  PlaybackState,
  SnapSettings,
  TimelineControls,
  TimelineViewport,
  TimelineEvents,
  TimelineUtils,
  
  // Animation system
  AnimationPreset,
  AnimationCategory,
  AnimationEffect,
  
  // Export formats for animations
  AnimationExport,
  GifExportOptions,
  VideoExportOptions,
  LottieExportOptions,
  
  // Easing and interpolation
  EasingType,
  InterpolationType
} from './timeline';

// API and service types
export type {
  // Base API types
  ApiResponse,
  PaginatedResponse,
  ApiError,
  ApiErrorCode,
  ApiClientConfig,
  RequestOptions,
  
  // External service types
  UnsplashPhoto,
  UnsplashTag,
  UnsplashSearchParams,
  GoogleFont,
  GoogleFontsResponse,
  
  // AI and generation
  AIImageRequest,
  AIImageResponse,
  AIGeneratedImage,
  QRCodeRequest,
  QRCodeResponse,
  
  // Cloud storage
  CloudStorageFile,
  CloudUploadRequest,
  CloudUploadResponse,
  
  // Project management
  ProjectData,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  
  // User and authentication
  User,
  UserPreferences,
  UserLimits,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  
  // Templates and assets
  TemplateAsset,
  AssetSearchParams,
  IconAsset,
  IconSearchParams,
  
  // Export and sharing
  ExportRequest,
  ExportResponse,
  ShareRequest,
  ShareResponse,
  
  // WebSocket and collaboration
  WebSocketMessage,
  CollaboratorCursor as APICursor
} from './api';

// State management types
export type {
  // Main application state
  AppState,
  
  // Store interfaces
  CanvasStore,
  HistoryManager,
  UIState,
  UserState,
  ProjectState,
  CollaborationState,
  PerformanceState,
  
  // UI and interaction
  ModalType,
  Notification,
  NotificationAction,
  ProjectSummary,
  
  // Collaboration
  Collaborator,
  CollaboratorCursor,
  Comment,
  CommentReply,
  
  // Store configuration
  StoreConfig,
  StoreSelectors,
  StoreHooks,
  AppAction
} from './state';

// Export and import types
export type {
  // Base export configuration
  ExportConfig,
  ExportFormat,
  
  // Specific export types
  ImageExportConfig,
  SVGExportConfig,
  PDFExportConfig,
  GIFExportConfig,
  VideoExportConfig,
  JSONExportConfig,
  HTMLExportConfig,
  CSSExportConfig,
  
  // Export progress and results
  ExportProgress,
  ExportResult,
  ExportMetadata,
  
  // Batch export
  BatchExportConfig,
  BatchExportProgress,
  
  // Import system
  ImportConfig,
  ImportFormat,
  ImportOptions,
  ImportResult,
  ImportMetadata,
  
  // Template export/import
  TemplateExport,
  
  // Presets
  SocialMediaPreset,
  PrintPreset,
  
  // Export service
  ExportService
} from './export';

// Export constants and default values
export { TOOLS, KEYBOARD_SHORTCUTS } from './tools';
export { SOCIAL_MEDIA_PRESETS, PRINT_PRESETS } from './export';

// Utility types for better TypeScript experience
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// Common utility types for the application
export type ID = string;
export type Timestamp = number;
export type Color = string;
export type URL = string;

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// Event handler types
export type EventHandler<T = void> = (event: T) => void;
export type AsyncEventHandler<T = void> = (event: T) => Promise<void>;

// Generic callback types
export type Callback<T = void> = () => T;
export type AsyncCallback<T = void> = () => Promise<T>;

// Validation types
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export type Validator<T> = (value: T) => ValidationResult;

// Feature flags and permissions
export interface FeatureFlags {
  aiImageGeneration: boolean;
  advancedExport: boolean;
  collaboration: boolean;
  animations: boolean;
  templates: boolean;
  cloudStorage: boolean;
  socialMediaIntegration: boolean;
}

export type Permission = 'view' | 'edit' | 'admin' | 'owner';

// Environment and configuration
export interface AppConfig {
  environment: 'development' | 'staging' | 'production';
  version: string;
  apiBaseUrl: string;
  cdnUrl: string;
  features: FeatureFlags;
  limits: {
    maxFileSize: number;
    maxCanvasSize: { width: number; height: number };
    maxElements: number;
    maxHistory: number;
  };
}