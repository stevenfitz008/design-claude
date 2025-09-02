// Export and import system types

import type { CanvasElement } from './canvas';
import type { Timeline } from './timeline';

// Base export configuration
export interface ExportConfig {
  format: ExportFormat;
  quality: number; // 0.1 to 1.0
  width?: number;
  height?: number;
  dpi?: number;
  transparent?: boolean;
  includeBackground?: boolean;
  fileName?: string;
}

export type ExportFormat = 
  | 'png'
  | 'jpg' 
  | 'jpeg'
  | 'webp'
  | 'svg'
  | 'pdf'
  | 'gif'
  | 'mp4'
  | 'webm'
  | 'json'
  | 'html'
  | 'css';

// Static image export types
export interface ImageExportConfig extends ExportConfig {
  format: 'png' | 'jpg' | 'jpeg' | 'webp';
  compressionLevel?: number; // PNG: 0-9, JPEG: 0-100
  progressive?: boolean; // JPEG progressive encoding
  chromaSubsampling?: boolean; // JPEG color subsampling
}

export interface SVGExportConfig extends ExportConfig {
  format: 'svg';
  embedImages: boolean;
  prettify: boolean;
  removeComments: boolean;
  minify: boolean;
  includeCSS: boolean;
}

export interface PDFExportConfig extends ExportConfig {
  format: 'pdf';
  pageSize: 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'Custom';
  orientation: 'portrait' | 'landscape';
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  embedFonts: boolean;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
  };
}

// Animation export types
export interface GIFExportConfig extends ExportConfig {
  format: 'gif';
  fps: number;
  duration?: number; // in seconds, if undefined uses timeline duration
  loop: boolean;
  dithering: boolean;
  colors: number; // 2-256
  optimize: boolean;
}

export interface VideoExportConfig extends ExportConfig {
  format: 'mp4' | 'webm';
  fps: number;
  duration?: number;
  bitrate: number; // in kbps
  codec: 'h264' | 'vp8' | 'vp9' | 'av1';
  profile?: string; // codec-specific profile
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  crf?: number; // Constant Rate Factor (0-51 for h264)
  audioCodec?: 'aac' | 'opus' | 'none';
  audioBitrate?: number;
}

// Data export types
export interface JSONExportConfig extends ExportConfig {
  format: 'json';
  pretty: boolean;
  includeMetadata: boolean;
  includeHistory: boolean;
  includeAssets: boolean;
  compress: boolean;
}

export interface HTMLExportConfig extends ExportConfig {
  format: 'html';
  interactive: boolean;
  responsive: boolean;
  embedCSS: boolean;
  embedJS: boolean;
  minify: boolean;
  includeAnimations: boolean;
  template?: 'minimal' | 'bootstrap' | 'tailwind' | 'custom';
  customTemplate?: string;
}

export interface CSSExportConfig extends ExportConfig {
  format: 'css';
  selector: string;
  units: 'px' | 'rem' | 'em' | '%' | 'vw' | 'vh';
  includeAnimations: boolean;
  prefixProperties: boolean;
  minify: boolean;
  generateClasses: boolean;
}

// Export progress and status
export interface ExportProgress {
  id: string;
  status: 'preparing' | 'processing' | 'encoding' | 'finalizing' | 'completed' | 'failed';
  progress: number; // 0-100
  stage: string;
  estimatedTimeRemaining?: number; // in seconds
  error?: string;
  warnings: string[];
  startTime: number;
  endTime?: number;
}

export interface ExportResult {
  id: string;
  success: boolean;
  url?: string;
  blob?: Blob;
  fileName: string;
  format: ExportFormat;
  size: number; // in bytes
  dimensions?: { width: number; height: number };
  duration?: number; // for animations/videos
  metadata: ExportMetadata;
  warnings: string[];
  error?: string;
}

export interface ExportMetadata {
  exportedAt: number;
  format: ExportFormat;
  originalSize: { width: number; height: number };
  exportSize: { width: number; height: number };
  elementCount: number;
  hasAnimations: boolean;
  compressionRatio?: number;
  processingTime: number; // in milliseconds
  fileSize: number;
  checksum?: string;
}

// Batch export types
export interface BatchExportConfig {
  formats: ExportConfig[];
  naming: {
    pattern: string; // e.g., "{name}_{format}_{width}x{height}"
    includeTimestamp: boolean;
    includeCounter: boolean;
  };
  output: {
    zip: boolean;
    separate: boolean;
    folder?: string;
  };
}

export interface BatchExportProgress {
  totalFiles: number;
  completedFiles: number;
  currentFile: string;
  overallProgress: number;
  fileProgresses: Record<string, ExportProgress>;
}

// Import types
export interface ImportConfig {
  format: ImportFormat;
  options: ImportOptions;
}

export type ImportFormat = 
  | 'json'
  | 'svg'
  | 'png'
  | 'jpg'
  | 'jpeg'
  | 'webp'
  | 'gif'
  | 'pdf'
  | 'sketch'
  | 'figma'
  | 'ai'
  | 'psd'
  | 'xd';

export interface ImportOptions {
  preserveLayerStructure?: boolean;
  importAsGroup?: boolean;
  scaleToFit?: boolean;
  replaceCanvas?: boolean;
  position?: { x: number; y: number };
  naming?: {
    prefix?: string;
    suffix?: string;
    incrementCounter?: boolean;
  };
}

export interface ImportResult {
  success: boolean;
  elements: CanvasElement[];
  canvasSize?: { width: number; height: number };
  layers?: any[];
  metadata: ImportMetadata;
  warnings: string[];
  errors: string[];
}

export interface ImportMetadata {
  originalFormat: ImportFormat;
  originalSize: { width: number; height: number };
  elementCount: number;
  layerCount: number;
  hasText: boolean;
  hasImages: boolean;
  hasShapes: boolean;
  fonts: string[];
  colors: string[];
  importedAt: number;
  processingTime: number;
}

// Template export/import
export interface TemplateExport {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  thumbnail: string;
  canvasSize: { width: number; height: number };
  elements: CanvasElement[];
  timeline?: Timeline;
  metadata: {
    version: string;
    createdAt: number;
    author?: string;
    license?: string;
  };
}

// Social media export presets
export interface SocialMediaPreset {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'pinterest' | 'tiktok' | 'youtube';
  type: 'post' | 'story' | 'cover' | 'profile' | 'ad' | 'thumbnail';
  dimensions: { width: number; height: number };
  format: ExportFormat;
  quality: number;
  aspectRatio: string;
  dpi: number;
  requirements: {
    maxSize?: number; // in bytes
    minDimensions?: { width: number; height: number };
    maxDimensions?: { width: number; height: number };
    supportedFormats: ExportFormat[];
    aspectRatios: string[];
  };
}

export const SOCIAL_MEDIA_PRESETS: SocialMediaPreset[] = [
  {
    id: 'instagram-post',
    platform: 'instagram',
    type: 'post',
    dimensions: { width: 1080, height: 1080 },
    format: 'jpg',
    quality: 0.9,
    aspectRatio: '1:1',
    dpi: 72,
    requirements: {
      maxSize: 30000000, // 30MB
      minDimensions: { width: 320, height: 320 },
      maxDimensions: { width: 1440, height: 1440 },
      supportedFormats: ['jpg', 'png'],
      aspectRatios: ['1:1', '4:5', '16:9']
    }
  },
  {
    id: 'instagram-story',
    platform: 'instagram',
    type: 'story',
    dimensions: { width: 1080, height: 1920 },
    format: 'jpg',
    quality: 0.9,
    aspectRatio: '9:16',
    dpi: 72,
    requirements: {
      maxSize: 30000000,
      minDimensions: { width: 320, height: 568 },
      maxDimensions: { width: 1080, height: 1920 },
      supportedFormats: ['jpg', 'png', 'gif', 'mp4'],
      aspectRatios: ['9:16']
    }
  }
];

// Print export presets
export interface PrintPreset {
  id: string;
  name: string;
  category: 'business' | 'marketing' | 'personal' | 'large-format';
  dimensions: { width: number; height: number }; // in mm
  dpi: number;
  bleed?: number; // in mm
  safeArea?: number; // in mm
  colorProfile: 'sRGB' | 'CMYK' | 'ProPhoto';
  format: 'pdf' | 'png' | 'jpg';
}

export const PRINT_PRESETS: PrintPreset[] = [
  {
    id: 'business-card',
    name: 'Business Card',
    category: 'business',
    dimensions: { width: 85, height: 55 },
    dpi: 300,
    bleed: 2,
    safeArea: 3,
    colorProfile: 'CMYK',
    format: 'pdf'
  },
  {
    id: 'a4-poster',
    name: 'A4 Poster',
    category: 'marketing',
    dimensions: { width: 210, height: 297 },
    dpi: 300,
    bleed: 3,
    safeArea: 5,
    colorProfile: 'CMYK',
    format: 'pdf'
  }
];

// Export service interface
export interface ExportService {
  export: (config: ExportConfig, elements: CanvasElement[], canvasSize: { width: number; height: number }) => Promise<ExportResult>;
  batchExport: (config: BatchExportConfig, elements: CanvasElement[], canvasSize: { width: number; height: number }) => Promise<ExportResult[]>;
  getProgress: (exportId: string) => ExportProgress | null;
  cancelExport: (exportId: string) => boolean;
  getSupportedFormats: () => ExportFormat[];
  validateConfig: (config: ExportConfig) => { valid: boolean; errors: string[] };
}