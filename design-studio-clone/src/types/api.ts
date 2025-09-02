// API integration and service types

// Base API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Unsplash API types
export interface UnsplashPhoto {
  id: string;
  created_at: string;
  updated_at: string;
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    id: string;
    username: string;
    name: string;
    profile_image: {
      small: string;
      medium: string;
      large: string;
    };
  };
  tags?: UnsplashTag[];
  downloads: number;
  likes: number;
}

export interface UnsplashTag {
  type: 'landing_page' | 'search';
  title: string;
}

export interface UnsplashSearchParams {
  query: string;
  page?: number;
  per_page?: number;
  order_by?: 'latest' | 'oldest' | 'popular';
  collections?: string;
  content_filter?: 'low' | 'high';
  color?: 'black_and_white' | 'black' | 'white' | 'yellow' | 'orange' | 'red' | 'purple' | 'magenta' | 'green' | 'teal' | 'blue';
  orientation?: 'landscape' | 'portrait' | 'squarish';
}

// Google Fonts API types
export interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
}

export interface GoogleFontsResponse {
  kind: string;
  items: GoogleFont[];
}

// AI Image Generation API types
export interface AIImageRequest {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  steps: number;
  guidance: number;
  seed?: number;
  style?: string;
  model?: string;
  sampler?: string;
}

export interface AIImageResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  images: AIGeneratedImage[];
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface AIGeneratedImage {
  url: string;
  seed: number;
  width: number;
  height: number;
  steps: number;
  guidance: number;
}

// Cloud Storage API types
export interface CloudStorageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  userId: string;
  tags: string[];
}

export interface CloudUploadRequest {
  file: File;
  folder?: string;
  tags?: string[];
  public?: boolean;
}

export interface CloudUploadResponse {
  file: CloudStorageFile;
  uploadUrl: string;
}

// QR Code Generation API types
export interface QRCodeRequest {
  data: string;
  size: number;
  format: 'svg' | 'png';
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  foregroundColor: string;
  backgroundColor: string;
  logo?: {
    url: string;
    size: number;
  };
}

export interface QRCodeResponse {
  qrCode: string; // Base64 or SVG string
  size: number;
  format: string;
}

// Project Management API types
export interface ProjectData {
  id: string;
  name: string;
  thumbnail?: string;
  canvasSize: {
    width: number;
    height: number;
  };
  elements: any[]; // Canvas elements
  timeline?: any; // Timeline data
  createdAt: string;
  updatedAt: string;
  userId: string;
  isPublic: boolean;
  tags: string[];
  version: number;
}

export interface ProjectCreateRequest {
  name: string;
  canvasSize: {
    width: number;
    height: number;
  };
  template?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface ProjectUpdateRequest {
  name?: string;
  elements?: any[];
  timeline?: any;
  thumbnail?: string;
  isPublic?: boolean;
  tags?: string[];
}

// User and Authentication API types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'team';
  createdAt: string;
  preferences: UserPreferences;
  limits: UserLimits;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  autoSave: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  showGuides: boolean;
  snapToGuides: boolean;
  defaultCanvasSize: {
    width: number;
    height: number;
  };
}

export interface UserLimits {
  maxProjects: number;
  maxStorageSize: number; // in bytes
  maxExportsPerMonth: number;
  hasAIFeatures: boolean;
  hasAdvancedExport: boolean;
  hasCollaboration: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: number;
}

// Template and Asset API types
export interface TemplateAsset {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  canvasSize: {
    width: number;
    height: number;
  };
  elements: any[];
  tags: string[];
  premium: boolean;
  downloads: number;
  createdAt: string;
}

export interface AssetSearchParams {
  query?: string;
  category?: string;
  premium?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'popular' | 'newest' | 'name';
}

// Icon and SVG API types
export interface IconAsset {
  id: string;
  name: string;
  category: string;
  tags: string[];
  svg: string;
  viewBox: string;
  premium: boolean;
  set: string;
}

export interface IconSearchParams {
  query: string;
  category?: string;
  set?: string;
  premium?: boolean;
  page?: number;
  limit?: number;
}

// Export and Share API types
export interface ExportRequest {
  projectId: string;
  format: 'png' | 'jpg' | 'pdf' | 'svg' | 'gif' | 'mp4';
  quality: number;
  width?: number;
  height?: number;
  transparent?: boolean;
  animation?: {
    duration: number;
    fps: number;
    loop: boolean;
  };
}

export interface ExportResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  url?: string;
  progress: number;
  estimatedTime?: number;
  error?: string;
}

export interface ShareRequest {
  projectId: string;
  type: 'link' | 'embed' | 'social';
  permissions: 'view' | 'comment' | 'edit';
  expiresAt?: string;
  password?: string;
}

export interface ShareResponse {
  shareUrl: string;
  embedCode?: string;
  qrCode?: string;
  expiresAt?: string;
}

// Webhook and real-time types
export interface WebSocketMessage {
  type: 'project_update' | 'user_cursor' | 'element_change' | 'chat_message';
  data: any;
  timestamp: number;
  userId: string;
  projectId: string;
}

export interface CollaboratorCursor {
  userId: string;
  userName: string;
  position: { x: number; y: number };
  color: string;
  visible: boolean;
}

// API Client configuration
export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  apiKey?: string;
  authToken?: string;
  userAgent: string;
  version: string;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

// Error types
export interface ApiError extends Error {
  code: string;
  status: number;
  details?: any;
}

export type ApiErrorCode = 
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INVALID_REQUEST'
  | 'SERVER_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT';