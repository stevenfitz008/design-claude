// State management types for Zustand stores

import type { CanvasElement, CanvasState, HistoryState, LayerState } from './canvas';
import type { Timeline, TimelineState } from './timeline';
import type { ToolState, PanelState } from './tools';
import type { User, ProjectData } from './api';

// Main application state
export interface AppState {
  // Canvas and design state
  canvas: CanvasState;
  layers: LayerState;
  timeline: TimelineState;
  tools: ToolState;
  panels: PanelState;
  history: HistoryManager;
  
  // UI state
  ui: UIState;
  
  // User and project state
  user: UserState;
  project: ProjectState;
  
  // Collaboration state
  collaboration: CollaborationState;
  
  // Performance and cache state
  performance: PerformanceState;
}

// Canvas store state and actions
export interface CanvasStore extends CanvasState {
  // Element management
  addElement: (element: CanvasElement) => void;
  removeElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: Partial<CanvasElement>) => void;
  duplicateElement: (elementId: string) => void;
  moveElement: (elementId: string, x: number, y: number) => void;
  resizeElement: (elementId: string, width: number, height: number) => void;
  rotateElement: (elementId: string, rotation: number) => void;
  
  // Selection management
  selectElement: (elementId: string, multi?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  selectInBounds: (bounds: { x: number; y: number; width: number; height: number }) => void;
  
  // Clipboard operations
  copySelection: () => void;
  cutSelection: () => void;
  paste: (offsetX?: number, offsetY?: number) => void;
  
  // Canvas operations
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  fitToScreen: () => void;
  resetView: () => void;
  setCanvasSize: (width: number, height: number) => void;
  setBackgroundColor: (color: string) => void;
  
  // Grid and guides
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleSnapToGrid: () => void;
  toggleGuides: () => void;
  toggleSnapToGuides: () => void;
}

// History management
export interface HistoryManager {
  past: HistoryState[];
  present: HistoryState;
  future: HistoryState[];
  maxHistorySize: number;
  canUndo: boolean;
  canRedo: boolean;
  
  // Actions
  pushState: (action: string, description: string) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  compress: () => void; // Remove intermediate states to save memory
}

// UI state management
export interface UIState {
  // Layout
  leftToolbarVisible: boolean;
  rightPanelVisible: boolean;
  timelineVisible: boolean;
  
  // Panels and modals
  activeModal?: ModalType;
  modalProps?: any;
  notifications: Notification[];
  
  // Loading and performance
  isLoading: boolean;
  loadingMessage?: string;
  
  // Viewport and responsive
  viewportSize: { width: number; height: number };
  isMobile: boolean;
  isTablet: boolean;
  
  // Theme and appearance
  theme: 'light' | 'dark' | 'auto';
  reducedMotion: boolean;
  highContrast: boolean;
  
  // Keyboard and mouse state
  pressedKeys: Set<string>;
  mousePosition: { x: number; y: number };
  isDragging: boolean;
  isResizing: boolean;
}

export type ModalType = 
  | 'export'
  | 'share' 
  | 'settings'
  | 'help'
  | 'about'
  | 'upgrade'
  | 'templates'
  | 'fonts'
  | 'shortcuts'
  | 'feedback';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  dismissible: boolean;
  actions?: NotificationAction[];
  createdAt: number;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

// User state management
export interface UserState {
  user?: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  preferences: UserPreferences;
  recentProjects: ProjectSummary[];
  favorites: string[];
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  addToRecent: (project: ProjectSummary) => void;
  toggleFavorite: (projectId: string) => void;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  autoSave: boolean;
  saveInterval: number; // in seconds
  showGrid: boolean;
  snapToGrid: boolean;
  showGuides: boolean;
  snapToGuides: boolean;
  defaultCanvasSize: { width: number; height: number };
  recentColorsLimit: number;
  undoHistoryLimit: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  thumbnail?: string;
  lastModified: string;
  canvasSize: { width: number; height: number };
}

// Project state management
export interface ProjectState {
  currentProject?: ProjectData;
  hasUnsavedChanges: boolean;
  lastSaved?: number;
  autoSaveEnabled: boolean;
  
  // Project operations
  createProject: (name: string, template?: any) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: () => Promise<void>;
  exportProject: (format: string, options: any) => Promise<void>;
  shareProject: (permissions: any) => Promise<string>;
  duplicateProject: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  
  // Auto-save
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  markAsChanged: () => void;
  markAsSaved: () => void;
}

// Collaboration state
export interface CollaborationState {
  isCollaborating: boolean;
  collaborators: Collaborator[];
  cursors: Record<string, CollaboratorCursor>;
  comments: Comment[];
  
  // Real-time sync
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  lastSyncTime?: number;
  pendingChanges: any[];
  
  // Actions
  joinSession: (sessionId: string) => void;
  leaveSession: () => void;
  sendCursorUpdate: (position: { x: number; y: number }) => void;
  addComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  resolveComment: (commentId: string) => void;
}

export interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isActive: boolean;
  lastSeen: number;
  permissions: 'view' | 'comment' | 'edit';
}

export interface CollaboratorCursor {
  userId: string;
  position: { x: number; y: number };
  color: string;
  visible: boolean;
  lastUpdate: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  position: { x: number; y: number };
  elementId?: string;
  resolved: boolean;
  createdAt: number;
  updatedAt: number;
  replies: CommentReply[];
}

export interface CommentReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: number;
}

// Performance monitoring state
export interface PerformanceState {
  renderTimes: number[];
  averageRenderTime: number;
  frameRate: number;
  memoryUsage: number;
  
  // Cache management
  imageCache: Map<string, HTMLImageElement>;
  fontCache: Map<string, FontFace>;
  assetCache: Map<string, any>;
  
  // Performance settings
  enableWebGL: boolean;
  maxCacheSize: number;
  renderOptimizations: boolean;
  
  // Actions
  clearCache: () => void;
  updatePerformanceMetrics: () => void;
  optimizeForDevice: () => void;
}

// Store creation and configuration
export interface StoreConfig {
  persist: boolean;
  persistKey?: string;
  middleware?: any[];
  devtools?: boolean;
}

// Store selectors for performance
export interface StoreSelectors {
  // Canvas selectors
  getSelectedElements: () => CanvasElement[];
  getElementsBounds: () => { x: number; y: number; width: number; height: number } | null;
  getVisibleElements: () => CanvasElement[];
  
  // UI selectors
  getActivePanel: () => string;
  getActiveModal: () => ModalType | undefined;
  
  // Performance selectors
  shouldRenderElement: (elementId: string) => boolean;
  getOptimizedElements: () => CanvasElement[];
}

// Action types for Redux-style patterns
export type AppAction = 
  | { type: 'CANVAS_ADD_ELEMENT'; payload: CanvasElement }
  | { type: 'CANVAS_REMOVE_ELEMENT'; payload: string }
  | { type: 'CANVAS_UPDATE_ELEMENT'; payload: { id: string; updates: Partial<CanvasElement> } }
  | { type: 'CANVAS_SELECT_ELEMENT'; payload: { id: string; multi?: boolean } }
  | { type: 'CANVAS_CLEAR_SELECTION' }
  | { type: 'UI_TOGGLE_PANEL'; payload: string }
  | { type: 'UI_SHOW_MODAL'; payload: { type: ModalType; props?: any } }
  | { type: 'UI_HIDE_MODAL' }
  | { type: 'HISTORY_UNDO' }
  | { type: 'HISTORY_REDO' }
  | { type: 'PROJECT_SAVE' }
  | { type: 'PROJECT_LOAD'; payload: ProjectData };

// Store hooks for React components
export interface StoreHooks {
  useCanvas: () => CanvasStore;
  useUI: () => UIState;
  useUser: () => UserState;
  useProject: () => ProjectState;
  useCollaboration: () => CollaborationState;
  usePerformance: () => PerformanceState;
  
  // Selector hooks
  useSelectedElements: () => CanvasElement[];
  useCanvasSize: () => { width: number; height: number };
  useZoom: () => number;
  useActivePanel: () => string;
}