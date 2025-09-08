/**
 * Canvas Thumbnail Generation Utility
 * Generates thumbnail images from canvas state for reports
 */

import type { CanvasState } from '../types/canvas';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  backgroundColor?: string;
}

const DEFAULT_OPTIONS: Required<ThumbnailOptions> = {
  width: 300,
  height: 200,
  quality: 0.8,
  backgroundColor: '#ffffff',
};

/**
 * Generate a thumbnail from canvas state
 * Returns a base64 encoded image string
 */
export const generateCanvasThumbnail = async (
  canvasState: CanvasState,
  options: ThumbnailOptions = {}
): Promise<string | null> => {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // Create an off-screen canvas for rendering
    const canvas = document.createElement('canvas');
    canvas.width = opts.width;
    canvas.height = opts.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Clear canvas with background color
    ctx.fillStyle = canvasState.backgroundColor || opts.backgroundColor;
    ctx.fillRect(0, 0, opts.width, opts.height);
    
    // Calculate scale factors to fit original canvas into thumbnail
    const scaleX = opts.width / canvasState.canvasSize.width;
    const scaleY = opts.height / canvasState.canvasSize.height;
    const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio
    
    // Center the content
    const offsetX = (opts.width - canvasState.canvasSize.width * scale) / 2;
    const offsetY = (opts.height - canvasState.canvasSize.height * scale) / 2;
    
    // Apply transform
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    // Render elements (simplified version)
    for (const element of canvasState.elements || []) {
      await renderElementToThumbnail(ctx, element);
    }
    
    ctx.restore();
    
    // Convert to base64
    return canvas.toDataURL('image/jpeg', opts.quality);
  } catch (error) {
    console.warn('Failed to generate canvas thumbnail:', error);
    return null;
  }
};

/**
 * Render a canvas element to the thumbnail context
 * This is a simplified version - in production you'd want more sophisticated rendering
 */
const renderElementToThumbnail = async (
  ctx: CanvasRenderingContext2D,
  element: any
): Promise<void> => {
  try {
    const { x = 0, y = 0, width = 100, height = 100 } = element;
    
    ctx.save();
    
    // Set common styles
    ctx.globalAlpha = element.opacity || 1;
    
    switch (element.type) {
      case 'rect':
      case 'rectangle':
        ctx.fillStyle = element.fill || element.backgroundColor || '#cccccc';
        ctx.strokeStyle = element.stroke || element.borderColor || 'transparent';
        ctx.lineWidth = element.strokeWidth || element.borderWidth || 0;
        
        if (ctx.lineWidth > 0) {
          ctx.strokeRect(x, y, width, height);
        }
        ctx.fillRect(x, y, width, height);
        break;
        
      case 'circle':
      case 'ellipse':
        ctx.beginPath();
        ctx.ellipse(x + width/2, y + height/2, width/2, height/2, 0, 0, 2 * Math.PI);
        ctx.fillStyle = element.fill || element.backgroundColor || '#cccccc';
        ctx.fill();
        
        if (element.stroke || element.borderColor) {
          ctx.strokeStyle = element.stroke || element.borderColor;
          ctx.lineWidth = element.strokeWidth || element.borderWidth || 1;
          ctx.stroke();
        }
        break;
        
      case 'text':
        ctx.fillStyle = element.fill || element.color || '#000000';
        ctx.font = `${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;
        ctx.textAlign = element.textAlign || 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(element.text || 'Text', x, y);
        break;
        
      case 'image':
        // For images, we'd normally load and draw them, but for thumbnails
        // we'll just draw a placeholder rectangle
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        // Add image icon placeholder
        ctx.fillStyle = '#666666';
        ctx.font = `${Math.min(width, height) / 4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📷', x + width/2, y + height/2);
        break;
        
      default:
        // Generic element - draw as rectangle
        ctx.fillStyle = element.fill || '#dddddd';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#aaaaaa';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        break;
    }
    
    ctx.restore();
  } catch (error) {
    console.warn('Failed to render element to thumbnail:', element, error);
  }
};

/**
 * Get a canvas element by reference (for Konva integration)
 */
export const getCanvasElement = (): HTMLCanvasElement | null => {
  // Try to find the main canvas element
  const canvasElement = document.querySelector('canvas[data-konva="true"]') as HTMLCanvasElement;
  if (canvasElement) {
    return canvasElement;
  }
  
  // Fallback: look for any canvas in the canvas container
  const canvasContainer = document.querySelector('.main-canvas-area canvas') as HTMLCanvasElement;
  return canvasContainer || null;
};

/**
 * Generate thumbnail directly from DOM canvas (more accurate but requires canvas to be rendered)
 */
export const generateThumbnailFromDOM = async (
  options: ThumbnailOptions = {}
): Promise<string | null> => {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const sourceCanvas = getCanvasElement();
    
    if (!sourceCanvas) {
      console.warn('No canvas element found for thumbnail generation');
      return null;
    }
    
    // Create thumbnail canvas
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = opts.width;
    thumbCanvas.height = opts.height;
    
    const ctx = thumbCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get thumbnail canvas context');
    }
    
    // Fill background
    ctx.fillStyle = opts.backgroundColor;
    ctx.fillRect(0, 0, opts.width, opts.height);
    
    // Calculate scale to fit source canvas into thumbnail
    const scaleX = opts.width / sourceCanvas.width;
    const scaleY = opts.height / sourceCanvas.height;
    const scale = Math.min(scaleX, scaleY);
    
    const scaledWidth = sourceCanvas.width * scale;
    const scaledHeight = sourceCanvas.height * scale;
    const offsetX = (opts.width - scaledWidth) / 2;
    const offsetY = (opts.height - scaledHeight) / 2;
    
    // Draw scaled canvas
    ctx.drawImage(
      sourceCanvas,
      0, 0, sourceCanvas.width, sourceCanvas.height,
      offsetX, offsetY, scaledWidth, scaledHeight
    );
    
    return thumbCanvas.toDataURL('image/jpeg', opts.quality);
  } catch (error) {
    console.warn('Failed to generate thumbnail from DOM canvas:', error);
    return null;
  }
};