import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ExportFormat, ExportQuality, ExportOptionsDto, SocialMediaPreset } from '../dto/export.dto';

@Injectable()
export class ImageExportService {
  private readonly outputDir = process.env.EXPORT_OUTPUT_DIR || './exports';
  
  private readonly qualitySettings = {
    [ExportQuality.LOW]: { jpeg: 60, webp: 60, png: 6 },
    [ExportQuality.MEDIUM]: { jpeg: 75, webp: 75, png: 4 },
    [ExportQuality.HIGH]: { jpeg: 90, webp: 85, png: 2 },
    [ExportQuality.ULTRA]: { jpeg: 95, webp: 90, png: 1 },
  };

  private readonly socialPresets = {
    [SocialMediaPreset.INSTAGRAM_POST]: { width: 1080, height: 1080, aspectRatio: '1:1' },
    [SocialMediaPreset.INSTAGRAM_STORY]: { width: 1080, height: 1920, aspectRatio: '9:16' },
    [SocialMediaPreset.FACEBOOK_POST]: { width: 1200, height: 630, aspectRatio: '1.91:1' },
    [SocialMediaPreset.FACEBOOK_COVER]: { width: 1640, height: 859, aspectRatio: '1.91:1' },
    [SocialMediaPreset.TWITTER_POST]: { width: 1200, height: 675, aspectRatio: '16:9' },
    [SocialMediaPreset.TWITTER_HEADER]: { width: 1500, height: 500, aspectRatio: '3:1' },
    [SocialMediaPreset.LINKEDIN_POST]: { width: 1200, height: 627, aspectRatio: '1.91:1' },
    [SocialMediaPreset.LINKEDIN_BANNER]: { width: 1584, height: 396, aspectRatio: '4:1' },
    [SocialMediaPreset.YOUTUBE_THUMBNAIL]: { width: 1280, height: 720, aspectRatio: '16:9' },
    [SocialMediaPreset.YOUTUBE_BANNER]: { width: 2560, height: 1440, aspectRatio: '16:9' },
    [SocialMediaPreset.PINTEREST_PIN]: { width: 1000, height: 1500, aspectRatio: '2:3' },
  };

  async exportImage(
    canvasData: any,
    options: ExportOptionsDto,
    outputPath: string,
  ): Promise<{ filePath: string; fileSize: number; metadata: any }> {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Apply social media preset if specified
    if (options.socialPreset) {
      const preset = this.socialPresets[options.socialPreset];
      options.width = preset.width;
      options.height = preset.height;
    }

    // Calculate output dimensions
    const outputWidth = Math.round((options.width || 1920) * (options.scale || 1));
    const outputHeight = Math.round((options.height || 1080) * (options.scale || 1));

    // Create base Sharp instance
    let sharpInstance = sharp({
      create: {
        width: outputWidth,
        height: outputHeight,
        channels: options.transparent && options.format === ExportFormat.PNG ? 4 : 3,
        background: options.transparent 
          ? { r: 0, g: 0, b: 0, alpha: 0 }
          : this.parseColor(options.backgroundColor || '#ffffff'),
      },
    });

    // Render canvas data to Sharp buffer
    const renderedBuffer = await this.renderCanvasToBuffer(canvasData, outputWidth, outputHeight);
    if (renderedBuffer) {
      sharpInstance = sharp(renderedBuffer);
    }

    // Apply format-specific processing
    switch (options.format) {
      case ExportFormat.PNG:
        sharpInstance = await this.applyPngProcessing(sharpInstance, options);
        break;
      case ExportFormat.JPEG:
        sharpInstance = await this.applyJpegProcessing(sharpInstance, options);
        break;
      case ExportFormat.WEBP:
        sharpInstance = await this.applyWebpProcessing(sharpInstance, options);
        break;
      default:
        throw new Error(`Unsupported image format: ${options.format}`);
    }

    // Apply general image processing
    if (options.dpi && options.dpi !== 72) {
      sharpInstance = sharpInstance.withMetadata({
        density: options.dpi,
      });
    }

    // Add custom metadata
    if (options.metadata) {
      sharpInstance = sharpInstance.withMetadata(options.metadata);
    }

    // Apply color profile if specified
    if (options.colorProfile) {
      try {
        sharpInstance = sharpInstance.withColorProfile(options.colorProfile);
      } catch (error) {
        console.warn(`Failed to apply color profile ${options.colorProfile}:`, error.message);
      }
    }

    // Write to file
    const info = await sharpInstance.toFile(outputPath);
    
    // Get file stats
    const stats = await fs.stat(outputPath);

    return {
      filePath: outputPath,
      fileSize: stats.size,
      metadata: {
        format: info.format,
        width: info.width,
        height: info.height,
        channels: info.channels,
        density: info.density,
        hasAlpha: info.channels === 4,
        colorSpace: options.colorProfile || 'sRGB',
        quality: this.getQualityValue(options.format, options.quality),
      },
    };
  }

  private async applyPngProcessing(sharpInstance: sharp.Sharp, options: ExportOptionsDto): Promise<sharp.Sharp> {
    const compressionLevel = this.qualitySettings[options.quality || ExportQuality.HIGH].png;
    
    return sharpInstance.png({
      compressionLevel,
      progressive: true,
      palette: options.quality === ExportQuality.LOW, // Use palette for low quality
      effort: options.quality === ExportQuality.ULTRA ? 10 : 6,
    });
  }

  private async applyJpegProcessing(sharpInstance: sharp.Sharp, options: ExportOptionsDto): Promise<sharp.Sharp> {
    const quality = this.qualitySettings[options.quality || ExportQuality.HIGH].jpeg;
    
    // Remove alpha channel for JPEG
    if (!options.transparent) {
      sharpInstance = sharpInstance.flatten({
        background: this.parseColor(options.backgroundColor || '#ffffff'),
      });
    }
    
    return sharpInstance.jpeg({
      quality,
      progressive: true,
      mozjpeg: true, // Use mozjpeg for better compression
      chromaSubsampling: options.quality === ExportQuality.ULTRA ? '4:4:4' : '4:2:0',
    });
  }

  private async applyWebpProcessing(sharpInstance: sharp.Sharp, options: ExportOptionsDto): Promise<sharp.Sharp> {
    const quality = this.qualitySettings[options.quality || ExportQuality.HIGH].webp;
    
    return sharpInstance.webp({
      quality,
      effort: options.quality === ExportQuality.ULTRA ? 6 : 4,
      lossless: options.quality === ExportQuality.ULTRA,
      nearLossless: options.quality === ExportQuality.HIGH,
    });
  }

  async createSVGExport(
    canvasData: any,
    options: ExportOptionsDto,
    outputPath: string,
  ): Promise<{ filePath: string; fileSize: number; metadata: any }> {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Apply social media preset if specified
    if (options.socialPreset) {
      const preset = this.socialPresets[options.socialPreset];
      options.width = preset.width;
      options.height = preset.height;
    }

    const width = options.width || 1920;
    const height = options.height || 1080;
    
    // Generate SVG content from canvas data
    const svgContent = await this.generateSVGFromCanvas(canvasData, width, height, options);
    
    // Write SVG file
    await fs.writeFile(outputPath, svgContent, 'utf-8');
    
    // Get file stats
    const stats = await fs.stat(outputPath);
    
    return {
      filePath: outputPath,
      fileSize: stats.size,
      metadata: {
        format: 'svg',
        width,
        height,
        vectorFormat: true,
        scalable: true,
      },
    };
  }

  private async renderCanvasToBuffer(canvasData: any, width: number, height: number): Promise<Buffer | null> {
    // This would typically integrate with a canvas rendering engine
    // For now, return null to use Sharp's create functionality
    // In a real implementation, you'd render the canvas elements to a buffer
    
    try {
      // Placeholder for canvas rendering logic
      // This would involve:
      // 1. Parsing canvas elements from canvasData
      // 2. Rendering text, shapes, images in correct layers
      // 3. Applying transforms, filters, effects
      // 4. Returning rendered buffer
      
      return null; // Use Sharp's create functionality as fallback
    } catch (error) {
      console.error('Canvas rendering failed:', error);
      return null;
    }
  }

  private async generateSVGFromCanvas(canvasData: any, width: number, height: number, options: ExportOptionsDto): Promise<string> {
    const viewBox = `0 0 ${width} ${height}`;
    const background = options.backgroundColor || (options.transparent ? 'transparent' : '#ffffff');
    
    let svgElements = '';
    
    // This would parse canvasData and generate SVG elements
    // For now, create a basic SVG structure
    if (canvasData?.elements) {
      svgElements = canvasData.elements.map((element: any) => {
        // Convert each canvas element to SVG
        // This is a simplified example
        switch (element.type) {
          case 'text':
            return this.createSVGText(element);
          case 'rect':
            return this.createSVGRect(element);
          case 'circle':
            return this.createSVGCircle(element);
          case 'image':
            return this.createSVGImage(element);
          default:
            return '';
        }
      }).join('\n');
    }
    
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="${viewBox}" 
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  ${background !== 'transparent' ? `<rect width="100%" height="100%" fill="${background}"/>` : ''}
  ${svgElements}
</svg>`;

    return svgContent;
  }

  private createSVGText(element: any): string {
    const { x = 0, y = 0, text = '', fontSize = 16, fill = '#000000', fontFamily = 'Arial' } = element;
    return `<text x="${x}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}" fill="${fill}">${this.escapeXml(text)}</text>`;
  }

  private createSVGRect(element: any): string {
    const { x = 0, y = 0, width = 100, height = 100, fill = '#000000', stroke, strokeWidth = 1 } = element;
    const strokeAttr = stroke ? `stroke="${stroke}" stroke-width="${strokeWidth}"` : '';
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${strokeAttr}/>`;
  }

  private createSVGCircle(element: any): string {
    const { cx = 0, cy = 0, r = 50, fill = '#000000', stroke, strokeWidth = 1 } = element;
    const strokeAttr = stroke ? `stroke="${stroke}" stroke-width="${strokeWidth}"` : '';
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${strokeAttr}/>`;
  }

  private createSVGImage(element: any): string {
    const { x = 0, y = 0, width = 100, height = 100, href } = element;
    if (!href) return '';
    return `<image x="${x}" y="${y}" width="${width}" height="${height}" xlink:href="${href}"/>`;
  }

  private parseColor(color: string): { r: number; g: number; b: number; alpha?: number } {
    // Simple color parser - in production, use a more robust color parsing library
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
    
    // Default to white
    return { r: 255, g: 255, b: 255 };
  }

  private getQualityValue(format: ExportFormat, quality: ExportQuality = ExportQuality.HIGH): number {
    const settings = this.qualitySettings[quality];
    switch (format) {
      case ExportFormat.JPEG:
        return settings.jpeg;
      case ExportFormat.PNG:
        return settings.png;
      default:
        return settings.webp;
    }
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  getSocialMediaPresets(): Record<SocialMediaPreset, any> {
    return this.socialPresets;
  }

  validateDimensions(width: number, height: number): { valid: boolean; message?: string } {
    if (width < 1 || height < 1) {
      return { valid: false, message: 'Dimensions must be at least 1x1 pixels' };
    }
    
    if (width > 8192 || height > 8192) {
      return { valid: false, message: 'Dimensions cannot exceed 8192x8192 pixels' };
    }
    
    const totalPixels = width * height;
    if (totalPixels > 33554432) { // 32MP limit
      return { valid: false, message: 'Total pixel count cannot exceed 32 megapixels' };
    }
    
    return { valid: true };
  }
}